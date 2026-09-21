const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
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

// POST /api/resumes/score - stateless: extract + score a resume against
// skills/primaryStack supplied directly in the request. Nothing is persisted
// server-side; the caller (frontend) is responsible for storing the result.
router.post('/score', upload.single('resume'), async (req, res) => {
    const { candidateName, primaryStack } = req.body;
    const requiredSkills = JSON.parse(req.body.requiredSkills || '[]');
    const uploadedFile = req.file;

    if (!uploadedFile) {
        return res.status(400).json({ error: 'resume file is required' });
    }
    if (!primaryStack || requiredSkills.length === 0) {
        fs.unlinkSync(uploadedFile.path);
        return res.status(400).json({ error: 'primaryStack and requiredSkills are required' });
    }

    try {
        const extraction = await extractResumeText(uploadedFile.path);
        const result = await scoreResume(extraction.text, requiredSkills, primaryStack);
        const recommendation = generateRecommendation(result, extraction.confidence);

        res.status(200).json({
            candidateName: candidateName || null,
            extractionConfidence: extraction.confidence,
            overallScore: result.overallScore,
            skillBreakdown: result.skillBreakdown,
            primaryStackMismatch: result.primaryStackMismatch,
            mismatchDetails: result.mismatchDetails,
            recommendation,
            scoredAt: new Date().toISOString(),
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to process resume', details: err.message });
    } finally {
        // Raw file is never persisted - only the extracted text ever briefly
        // exists in-memory during scoring, and this temp upload is deleted.
        fs.unlink(uploadedFile.path, () => {});
    }
});

module.exports = router;
