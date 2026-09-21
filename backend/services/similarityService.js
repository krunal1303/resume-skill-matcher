/**
 * Cosine similarity between two equal-length vectors.
 * Returns a value from -1 (opposite meaning) to 1 (same meaning).
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(magA) * Math.sqrt(magB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
}

module.exports = { cosineSimilarity };
