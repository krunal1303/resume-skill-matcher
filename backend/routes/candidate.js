const express = require('express');
const fs = require('fs');
const { extractResumeText } = require('../services/textExtraction/extractResumeText');
const { runAtsChecks } = require('../services/candidate/atsRules');
const { checkGrammar } = require('../services/candidate/grammarService');
const upload = require('../middleware/upload');

const router = express.Router();

// POST /api/candidate/analyze - stateless: extract a candidate's resume and
// return an ATS report. jdText is optional; when present, the report will
// also cover how well the resume is tailored to that job.
router.post('/analyze', upload.single('resume'), async (req, res) => {
    const jdText = (req.body.jdText || '').trim();
    const uploadedFile = req.file;

    if (!uploadedFile) {
        return res.status(400).json({ error: 'resume file is required' });
    }

    try {
        const extraction = await extractResumeText(uploadedFile.path);
        const wordCount = extraction.text.split(/\s+/).filter(Boolean).length;

        const ats = runAtsChecks(extraction.text);
        const grammar = await checkGrammar(extraction.text);

        // TODO: JD tailoring suggestions (missing/weak skills) when jdText is set.
        res.status(200).json({
            extractionConfidence: extraction.confidence,
            wordCount,
            jdProvided: jdText.length > 0,
            atsScore: ats.score,
            checks: ats.checks,
            grammar,
            analyzedAt: new Date().toISOString(),
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to analyze resume', details: err.message });
    } finally {
        // Same guarantee as the recruiter flow: the upload is never kept.
        fs.unlink(uploadedFile.path, () => {});
    }
});

module.exports = router;
