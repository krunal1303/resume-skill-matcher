const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pool = require('../db/pool');
const { extractResumeText } = require('../services/textExtraction/extractResumeText');
const { scoreResume } = require('../services/scoringEngine');
const { generateRecommendation } = require('../services/recommendationEngine');

const router = express.Router();

// multer's default disk storage drops the original extension; the extraction
// module dispatches on file extension (.pdf vs .docx), so we must preserve it.
const storage = multer.diskStorage({
    destination: 'backend/uploads/',
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage });

// POST /api/resumes - upload + score a resume against a job's required skills
router.post('/', upload.single('resume'), async (req, res) => {
    const { jobId, candidateName } = req.body;
    const uploadedFile = req.file;

    if (!uploadedFile) {
        return res.status(400).json({ error: 'resume file is required' });
    }
    if (!jobId) {
        fs.unlinkSync(uploadedFile.path);
        return res.status(400).json({ error: 'jobId is required' });
    }

    try {
        const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
        if (jobs.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const job = jobs[0];

        const [skillRows] = await pool.query(
            'SELECT skill_name FROM required_skills WHERE job_id = ?',
            [jobId]
        );
        const requiredSkills = skillRows.map((s) => s.skill_name);

        const extraction = await extractResumeText(uploadedFile.path);
        const result = await scoreResume(extraction.text, requiredSkills, job.primary_stack);

        const [resumeResult] = await pool.query(
            `INSERT INTO resumes
             (job_id, candidate_name, extracted_text, extraction_confidence, overall_score, primary_stack_mismatch,
              mismatch_competing_stack, mismatch_competing_score, mismatch_primary_score)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                jobId,
                candidateName || null,
                extraction.text,
                extraction.confidence,
                result.overallScore,
                result.primaryStackMismatch,
                result.mismatchDetails?.competingStack || null,
                result.mismatchDetails?.competingScore ?? null,
                result.mismatchDetails?.primaryScore ?? null,
            ]
        );
        const resumeId = resumeResult.insertId;

        const skillScoreRows = result.skillBreakdown.map((entry) => [
            resumeId,
            entry.skill,
            entry.score,
            entry.snippet,
        ]);
        await pool.query(
            'INSERT INTO resume_skill_scores (resume_id, skill_name, similarity_score, matched_text_snippet) VALUES ?',
            [skillScoreRows]
        );

        const recommendation = generateRecommendation(result, extraction.confidence);

        res.status(201).json({
            resumeId,
            extractionConfidence: extraction.confidence,
            overallScore: result.overallScore,
            skillBreakdown: result.skillBreakdown,
            primaryStackMismatch: result.primaryStackMismatch,
            mismatchDetails: result.mismatchDetails,
            recommendation,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to process resume', details: err.message });
    } finally {
        // Raw file is never persisted - only extracted text + scores go to MySQL.
        fs.unlink(uploadedFile.path, () => {});
    }
});

// GET /api/resumes?jobId=1 - list scored resumes for a job (sortable results table)
router.get('/', async (req, res) => {
    const { jobId } = req.query;
    if (!jobId) {
        return res.status(400).json({ error: 'jobId query param is required' });
    }

    try {
        const [resumes] = await pool.query(
            `SELECT id, candidate_name, extraction_confidence, overall_score, primary_stack_mismatch, created_at
             FROM resumes WHERE job_id = ? ORDER BY overall_score DESC`,
            [jobId]
        );
        res.json(resumes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch resumes', details: err.message });
    }
});

// GET /api/resumes/:id - full score breakdown for one resume
router.get('/:id', async (req, res) => {
    try {
        const [resumes] = await pool.query('SELECT * FROM resumes WHERE id = ?', [
            req.params.id,
        ]);
        if (resumes.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const [skillScores] = await pool.query(
            'SELECT skill_name, similarity_score, matched_text_snippet FROM resume_skill_scores WHERE resume_id = ?',
            [req.params.id]
        );

        const resume = resumes[0];
        const recommendation = generateRecommendation(
            {
                overallScore: resume.overall_score,
                skillBreakdown: skillScores.map((s) => ({
                    skill: s.skill_name,
                    score: s.similarity_score,
                    snippet: s.matched_text_snippet,
                })),
                primaryStackMismatch: !!resume.primary_stack_mismatch,
                mismatchDetails: resume.primary_stack_mismatch
                    ? {
                          competingStack: resume.mismatch_competing_stack,
                          competingScore: resume.mismatch_competing_score,
                          primaryScore: resume.mismatch_primary_score,
                      }
                    : null,
            },
            resume.extraction_confidence
        );

        res.json({ ...resume, skillBreakdown: skillScores, recommendation });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch resume', details: err.message });
    }
});

module.exports = router;
