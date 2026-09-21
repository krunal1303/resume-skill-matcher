let embedderPromise = null;

/**
 * Lazily loads the embedding pipeline once and reuses it.
 * Model: Xenova/all-MiniLM-L6-v2 - small, fast, runs locally, no API key.
 * Uses dynamic import() because @xenova/transformers ships ESM-only.
 */
function getEmbedder() {
    if (!embedderPromise) {
        embedderPromise = (async () => {
            const { pipeline } = await import('@xenova/transformers');
            return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        })();
    }
    return embedderPromise;
}

/**
 * Converts a piece of text into an embedding vector (array of numbers).
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function embedText(text) {
    const embedder = await getEmbedder();
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

/**
 * Embeds multiple texts sequentially, returning one vector per input.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
async function embedBatch(texts) {
    const vectors = [];
    for (const text of texts) {
        vectors.push(await embedText(text));
    }
    return vectors;
}

module.exports = { embedText, embedBatch };
