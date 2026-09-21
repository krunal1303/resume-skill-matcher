import { useEffect, useState } from 'react';
import { getResumeDetail } from '../api';

const VERDICT_CLASS = {
    'Strong Match': 'verdict-strong',
    Borderline: 'verdict-borderline',
    'Weak Match': 'verdict-weak',
};

export default function CandidateDetailModal({ resumeId, onClose }) {
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setDetail(null);
        setError(null);
        getResumeDetail(resumeId)
            .then((data) => {
                if (!cancelled) setDetail(data);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message);
            });
        return () => {
            cancelled = true;
        };
    }, [resumeId]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    &times;
                </button>

                {error && <p className="error">{error}</p>}
                {!detail && !error && <p>Loading...</p>}

                {detail && (
                    <>
                        <h2>{detail.candidate_name || '(unnamed candidate)'}</h2>

                        <div className={`verdict-banner ${VERDICT_CLASS[detail.recommendation.verdict]}`}>
                            <strong>{detail.recommendation.verdict}</strong>
                            <span>{(detail.overall_score * 100).toFixed(0)}% overall skill match</span>
                        </div>

                        <section>
                            <h3>Why this verdict</h3>
                            <ul>
                                {detail.recommendation.reasons.map((reason, i) => (
                                    <li key={i}>{reason}</li>
                                ))}
                            </ul>
                        </section>

                        {detail.recommendation.caveats.length > 0 && (
                            <section>
                                <h3>Things to double-check</h3>
                                <ul className="caveat-list">
                                    {detail.recommendation.caveats.map((caveat, i) => (
                                        <li key={i}>{caveat}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <section>
                            <h3>Skill-by-skill breakdown</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Skill</th>
                                        <th>Match</th>
                                        <th>Note</th>
                                        <th>Evidence in resume</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detail.recommendation.skillNotes.map((note) => {
                                        const skillDetail = detail.skillBreakdown.find(
                                            (s) => s.skill_name === note.skill
                                        );
                                        return (
                                            <tr key={note.skill}>
                                                <td>{note.skill}</td>
                                                <td>
                                                    <div className="score-bar-track">
                                                        <div
                                                            className="score-bar-fill"
                                                            style={{ width: `${Math.max(note.score, 0) * 100}%` }}
                                                        />
                                                    </div>
                                                    {(note.score * 100).toFixed(0)}%
                                                </td>
                                                <td>{note.note}</td>
                                                <td className="evidence-cell">
                                                    {skillDetail?.matched_text_snippet || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
