/**
 * ATS rule checks - YOUR code to write.
 *
 * Every check returns the same shape, so the route and UI never need to
 * change when you add, remove, or re-weight a rule:
 *
 *   {
 *     id: string,          // stable key, e.g. 'contact-email'
 *     label: string,       // shown in the UI, e.g. 'Email address present'
 *     passed: boolean,
 *     weight: number,      // how much this check matters to the overall score
 *     suggestion: string | null,  // what to fix, only when !passed - be specific
 *   }
 *
 * runAtsChecks() runs them all and turns them into one 0-100 score.
 * One example check is done below so you can see the pattern.
 */

// --- Example (done) ---------------------------------------------------------

function checkEmail(text) {
    const passed = /[\w.+-]+@[\w-]+\.[\w.]+/.test(text);
    return {
        id: 'contact-email',
        label: 'Email address present',
        passed,
        weight: 5,
        suggestion: passed ? null : 'Add an email address at the top of your resume.',
    };
}

// --- Your checks --------------------------------------------------------------
// Uncomment each one in ALL_CHECKS below once you've written it.

// TODO: checkSections(text)
// Hint: ATS parsers look for standard headings. Check for Experience,
// Education, and Skills (case-insensitive, and allow variants like
// "Work Experience" / "Technical Skills"). The suggestion should name the
// *missing* sections, not just say "sections missing".

// TODO: checkQuantifiedBullets(text)
// Hint: split the text into lines, keep ones that look like bullets or
// sentences (say, 6+ words). Count how many contain a number, %, or $.
// Pass if some ratio is met - you pick the threshold. A good suggestion
// quotes one bullet that has no number.

// TODO: checkWeakPhrases(text)
// Hint: keep an array like ['responsible for', 'worked on', 'helped with',
// 'duties included']. Report which ones appear and suggest strong verbs
// (Built, Led, Reduced, Designed...).

// TODO: checkFirstPerson(text)
// Hint: resumes normally skip "I", "my", "me". Use word boundaries (\b) in
// your regex or you'll match "I" inside other words.

// TODO: checkLength(text)
// Hint: word count. Roughly 400-800 words is typical for 1-2 pages. Decide
// what a too-short vs too-long suggestion should say.

// TODO (optional): checkPassiveVoice(text)
// Hint: a rough heuristic is "was|were|been|being" followed by a word ending
// in "ed". It'll have false positives - that's a good tradeoff to discuss in
// an interview.

const ALL_CHECKS = [
    checkEmail,
    // checkSections,
    // checkQuantifiedBullets,
    // checkWeakPhrases,
    // checkFirstPerson,
    // checkLength,
];

/**
 * @param {string} text - extracted resume text
 * @returns {{ score: number | null, checks: object[] }}
 */
function runAtsChecks(text) {
    const checks = ALL_CHECKS.map((check) => check(text));

    // TODO: compute the 0-100 score from checks.
    // Hint: think about why a weighted ratio (passed weight / total weight)
    // is fairer than counting passed checks, and what score an empty checks
    // array should give (it shouldn't divide by zero).
    const score = null;

    return { score, checks };
}

module.exports = { runAtsChecks };
