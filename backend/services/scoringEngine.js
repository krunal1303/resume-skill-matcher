const { chunkText } = require('./chunkText');
const { embedText, embedBatch } = require('./embeddingService');
const { cosineSimilarity } = require('./similarityService');

// Reference phrases for common competing stacks. Compared the same way as
// required skills so the mismatch flag is explainable in the same terms.
const COMPETING_STACKS = {
    'Java/Spring': 'Java Spring Boot backend development',
    'Python/Django': 'Python Django backend development',
    '.NET/C#': '.NET C# backend development',
    PHP: 'PHP backend development',
};

const MISMATCH_MARGIN = 0.1;

/**
 * For one skill's embedding, finds the best-matching resume chunk.
 * @param {number[]} skillVector
 * @param {string[]} chunks
 * @param {number[][]} chunkVectors
 * @returns {{ score: number, snippet: string }}
 */
function bestChunkMatch(skillVector, chunks, chunkVectors) {
    let bestScore = -1;
    let bestSnippet = '';

    for (let i = 0; i < chunks.length; i++) {
        const score = cosineSimilarity(skillVector, chunkVectors[i]);
        if (score > bestScore) {
            bestScore = score;
            bestSnippet = chunks[i];
        }
    }

    return { score: bestScore, snippet: bestSnippet };
}

/**
 * Scores resume text against a list of required skills, and checks whether
 * a competing tech stack outweighs the job's stated primary stack.
 *
 * @param {string} resumeText
 * @param {string[]} requiredSkills
 * @param {string} primaryStack - e.g. "Node.js/React", used as a reference phrase
 * @returns {Promise<{
 *   overallScore: number,
 *   skillBreakdown: { skill: string, score: number, snippet: string }[],
 *   primaryStackMismatch: boolean,
 *   mismatchDetails: { competingStack: string, competingScore: number, primaryScore: number } | null
 * }>}
 */
async function scoreResume(resumeText, requiredSkills, primaryStack) {
    const chunks = chunkText(resumeText);
    if (chunks.length === 0) {
        throw new Error('No usable text found in resume after chunking');
    }

    const chunkVectors = await embedBatch(chunks);

    // Score each required skill against the best-matching chunk
    const skillBreakdown = [];
    for (const skill of requiredSkills) {
        const skillVector = await embedText(skill);
        const { score, snippet } = bestChunkMatch(skillVector, chunks, chunkVectors);
        skillBreakdown.push({ skill, score, snippet });
    }

    const overallScore =
        skillBreakdown.reduce((sum, s) => sum + s.score, 0) / skillBreakdown.length;

    // Primary-stack mismatch check
    const primaryStackVector = await embedText(primaryStack);
    const primaryScore = bestChunkMatch(primaryStackVector, chunks, chunkVectors).score;

    let mismatchDetails = null;
    for (const [stackName, referencePhrase] of Object.entries(COMPETING_STACKS)) {
        const competingVector = await embedText(referencePhrase);
        const competingScore = bestChunkMatch(competingVector, chunks, chunkVectors).score;

        if (competingScore - primaryScore > MISMATCH_MARGIN) {
            if (!mismatchDetails || competingScore > mismatchDetails.competingScore) {
                mismatchDetails = { competingStack: stackName, competingScore, primaryScore };
            }
        }
    }

    return {
        overallScore,
        skillBreakdown,
        primaryStackMismatch: mismatchDetails !== null,
        mismatchDetails,
    };
}

module.exports = { scoreResume, COMPETING_STACKS, MISMATCH_MARGIN };
