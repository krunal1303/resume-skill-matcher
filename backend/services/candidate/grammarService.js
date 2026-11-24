// Grammar/spelling via LanguageTool's free public API. This is the one place
// resume text leaves our server - the candidate UI tells users so.
// Public API limits: ~20 requests/min per IP, 20KB of text per request.
const LANGUAGETOOL_URL = process.env.LANGUAGETOOL_URL || 'https://api.languagetool.org/v2/check';
const MAX_TEXT_BYTES = 20000;
const REQUEST_TIMEOUT_MS = 15000;

// Resumes are full of tech names (Node.js, PostgreSQL, k8s) that a general
// spellchecker flags as typos. Skip spelling hits on words that look technical.
function looksTechnical(word) {
    return /[.\d#+/]/.test(word) || /[a-z][A-Z]/.test(word) || /^[A-Z]{2,}$/.test(word);
}

/**
 * @param {string} text
 * @returns {Promise<{ available: boolean, issues: {
 *   message: string, excerpt: string, flagged: string,
 *   replacements: string[], category: string
 * }[] }>}
 */
async function checkGrammar(text) {
    const body = new URLSearchParams({
        text: Buffer.from(text).subarray(0, MAX_TEXT_BYTES).toString(),
        language: 'en-US',
    });

    let data;
    try {
        const res = await fetch(LANGUAGETOOL_URL, {
            method: 'POST',
            body,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`LanguageTool responded ${res.status}`);
        data = await res.json();
    } catch (err) {
        // Grammar is a nice-to-have: if the free API is down or rate-limited,
        // the rest of the ATS report should still come back.
        console.warn('Grammar check unavailable:', err.message);
        return { available: false, issues: [] };
    }

    const issues = data.matches
        .map((m) => ({
            message: m.message,
            excerpt: m.context.text,
            flagged: m.context.text.substr(m.context.offset, m.context.length),
            replacements: m.replacements.slice(0, 3).map((r) => r.value),
            category: m.rule.category.id,
        }))
        .filter((issue) => !(issue.category === 'TYPOS' && looksTechnical(issue.flagged)));

    return { available: true, issues };
}

module.exports = { checkGrammar };
