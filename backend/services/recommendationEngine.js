const STRONG_THRESHOLD = 0.6;
const BORDERLINE_THRESHOLD = 0.35;
const SKILL_STRONG_THRESHOLD = 0.55;
const SKILL_WEAK_THRESHOLD = 0.3;

/**
 * Turns scoring output into an interviewer-facing verdict, reasons, and
 * per-skill notes - all derived from scores we already computed, no new
 * model calls. Keeps the recommendation explainable and deterministic.
 *
 * @param {{
 *   overallScore: number,
 *   skillBreakdown: { skill: string, score: number, snippet: string }[],
 *   primaryStackMismatch: boolean,
 *   mismatchDetails: { competingStack: string, competingScore: number, primaryScore: number } | null
 * }} scoreResult
 * @param {string} extractionConfidence - 'high' | 'medium' | 'low'
 * @returns {{
 *   verdict: 'Strong Match' | 'Borderline' | 'Weak Match',
 *   reasons: string[],
 *   caveats: string[],
 *   skillNotes: { skill: string, score: number, note: string }[]
 * }}
 */
function generateRecommendation(scoreResult, extractionConfidence) {
    const { overallScore, skillBreakdown, primaryStackMismatch, mismatchDetails } = scoreResult;

    const strongSkills = skillBreakdown.filter((s) => s.score >= SKILL_STRONG_THRESHOLD);
    const weakSkills = skillBreakdown.filter((s) => s.score < SKILL_WEAK_THRESHOLD);

    const reasons = [];
    const caveats = [];

    let verdict;
    if (overallScore >= STRONG_THRESHOLD && !primaryStackMismatch) {
        verdict = 'Strong Match';
        reasons.push(
            `Overall skill match is ${(overallScore * 100).toFixed(0)}%, above the ${STRONG_THRESHOLD * 100}% bar for a strong candidate.`
        );
        if (strongSkills.length > 0) {
            reasons.push(
                `Strong evidence for: ${strongSkills.map((s) => s.skill).join(', ')}.`
            );
        }
    } else if (overallScore >= BORDERLINE_THRESHOLD && !primaryStackMismatch) {
        verdict = 'Borderline';
        reasons.push(
            `Overall skill match is ${(overallScore * 100).toFixed(0)}%, in the borderline range (${BORDERLINE_THRESHOLD * 100}-${STRONG_THRESHOLD * 100}%).`
        );
        if (weakSkills.length > 0) {
            reasons.push(
                `Weak or missing evidence for: ${weakSkills.map((s) => s.skill).join(', ')}.`
            );
        }
    } else {
        verdict = 'Weak Match';
        reasons.push(
            `Overall skill match is only ${(overallScore * 100).toFixed(0)}%, below the ${BORDERLINE_THRESHOLD * 100}% bar.`
        );
        if (weakSkills.length > 0) {
            reasons.push(
                `Little to no evidence found for: ${weakSkills.map((s) => s.skill).join(', ')}.`
            );
        }
    }

    if (primaryStackMismatch && mismatchDetails) {
        caveats.push(
            `Resume signal leans toward ${mismatchDetails.competingStack} ` +
                `(${(mismatchDetails.competingScore * 100).toFixed(0)}%) more than the required stack ` +
                `(${(mismatchDetails.primaryScore * 100).toFixed(0)}%) - verify hands-on experience with the required stack directly.`
        );
        if (verdict === 'Strong Match') verdict = 'Borderline';
    }

    if (extractionConfidence !== 'high') {
        caveats.push(
            `Resume text was extracted with ${extractionConfidence} confidence (OCR fallback may have missed content) - consider reviewing the original file.`
        );
    }

    const skillNotes = skillBreakdown.map((s) => ({
        skill: s.skill,
        score: s.score,
        note:
            s.score >= SKILL_STRONG_THRESHOLD
                ? 'Clear match found in resume.'
                : s.score >= SKILL_WEAK_THRESHOLD
                  ? 'Some related experience, but not a direct match.'
                  : 'No meaningful evidence found for this skill.',
    }));

    return { verdict, reasons, caveats, skillNotes };
}

module.exports = { generateRecommendation };
