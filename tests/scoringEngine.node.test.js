const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { scoreResume } = require('../backend/services/scoringEngine');

// Real embedding model inference (not mocked) - runs actual neural network
// calls via @xenova/transformers, so allow extra time per test.
// Uses node:test instead of Jest: Jest's VM-sandboxed test environment
// breaks onnxruntime's internal `instanceof Float32Array` checks, which
// only matches when run in Node's normal global realm.
const TIMEOUT_MS = 60000;

describe('scoreResume', () => {
    test('clear match: Node.js/React resume against Node.js/React job', { timeout: TIMEOUT_MS }, async () => {
        const resumeText = `
Senior Software Engineer with 5 years experience
Built and maintained REST APIs using Node.js and Express
Developed responsive single-page applications with React and Redux
Worked extensively with MySQL for relational data storage
Deployed applications to AWS using Docker containers
        `.trim();

        const requiredSkills = ['Node.js', 'React', 'MySQL', 'REST APIs'];

        const result = await scoreResume(resumeText, requiredSkills, 'Node.js/React');

        assert.ok(result.overallScore > 0.4, `expected overallScore > 0.4, got ${result.overallScore}`);
        assert.equal(result.primaryStackMismatch, false);
        assert.equal(result.skillBreakdown.length, requiredSkills.length);
        for (const entry of result.skillBreakdown) {
            assert.ok(entry.score > -1);
            assert.equal(typeof entry.snippet, 'string');
        }
    });

    test('clear mismatch: Java/Spring-heavy resume against Node.js/React job', { timeout: TIMEOUT_MS }, async () => {
        const resumeText = `
Backend Engineer specializing in enterprise Java applications
Built microservices using Java Spring Boot and Hibernate
Designed relational schemas and wrote complex SQL queries in Oracle DB
Implemented CI/CD pipelines with Jenkins for Java deployments
Led a team migrating a monolith Java application to Spring microservices
        `.trim();

        const requiredSkills = ['Node.js', 'React', 'MySQL', 'REST APIs'];

        const result = await scoreResume(resumeText, requiredSkills, 'Node.js/React');

        assert.equal(result.primaryStackMismatch, true);
        assert.notEqual(result.mismatchDetails, null);
        assert.equal(result.mismatchDetails.competingStack, 'Java/Spring');
        assert.ok(result.mismatchDetails.competingScore > result.mismatchDetails.primaryScore);
    });

    test('borderline: resume has some relevant skills but is not a strong match', { timeout: TIMEOUT_MS }, async () => {
        const resumeText = `
IT Support Specialist with experience in helpdesk ticketing systems
Basic scripting experience using Python for automating small tasks
Familiar with SQL for running simple database queries
Some exposure to web technologies including HTML and CSS
        `.trim();

        const requiredSkills = ['Node.js', 'React', 'MySQL', 'REST APIs'];

        const result = await scoreResume(resumeText, requiredSkills, 'Node.js/React');

        // Borderline: expect a middling score - not a strong match, but not
        // completely unrelated either (some overlapping web/DB concepts).
        assert.ok(result.overallScore > 0, `expected overallScore > 0, got ${result.overallScore}`);
        assert.ok(result.overallScore < 0.5, `expected overallScore < 0.5, got ${result.overallScore}`);
    });
});
