const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

/**
 * Splits a free-text skills field ("React, Node.js\nMySQL") into a clean list.
 */
function parseSkillsInput(rawSkills) {
    return rawSkills
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

// POST /api/jobs - create a job posting with required skills
router.post('/', async (req, res) => {
    const { title, primaryStack, skills } = req.body;

    if (!title || !primaryStack || !skills) {
        return res.status(400).json({ error: 'title, primaryStack, and skills are required' });
    }

    const skillList = parseSkillsInput(skills);
    if (skillList.length === 0) {
        return res.status(400).json({ error: 'At least one skill is required' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [jobResult] = await connection.query(
            'INSERT INTO jobs (title, primary_stack) VALUES (?, ?)',
            [title, primaryStack]
        );
        const jobId = jobResult.insertId;

        const skillRows = skillList.map((skill) => [jobId, skill]);
        await connection.query('INSERT INTO required_skills (job_id, skill_name) VALUES ?', [
            skillRows,
        ]);

        await connection.commit();
        res.status(201).json({ id: jobId, title, primaryStack, skills: skillList });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: 'Failed to create job', details: err.message });
    } finally {
        connection.release();
    }
});

// GET /api/jobs - list all job postings
router.get('/', async (req, res) => {
    try {
        const [jobs] = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch jobs', details: err.message });
    }
});

// GET /api/jobs/:id - get one job with its required skills
router.get('/:id', async (req, res) => {
    try {
        const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
        if (jobs.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const [skills] = await pool.query(
            'SELECT skill_name FROM required_skills WHERE job_id = ?',
            [req.params.id]
        );

        res.json({ ...jobs[0], skills: skills.map((s) => s.skill_name) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch job', details: err.message });
    }
});

module.exports = router;
