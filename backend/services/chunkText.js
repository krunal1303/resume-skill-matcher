const MIN_CHUNK_LENGTH = 8; // filters out blank lines, stray bullets, section headers like "Skills"

/**
 * Splits resume text into line-based chunks for embedding.
 * @param {string} text
 * @returns {string[]}
 */
function chunkText(text) {
    return text
        .split('\n')
        .map((line) => line.replace(/^[\s•\-*•]+/, '').trim())
        .filter((line) => line.length >= MIN_CHUNK_LENGTH);
}

module.exports = { chunkText };
