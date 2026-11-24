import { useState } from 'react';
import { analyzeResume } from '../api';

export default function CandidatePage() {
    const [file, setFile] = useState(null);
    const [jdText, setJdText] = useState('');
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!file) return;

        setError(null);
        setReport(null);
        setSubmitting(true);
        try {
            setReport(await analyzeResume({ file, jdText }));
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <h1>Candidate: ATS Resume Checker</h1>
            <p>
                Upload your resume to get an ATS score with suggestions. Optionally paste a job
                description to see how well your resume is tailored to it.
            </p>
            <p className="privacy-note">
                Your file is deleted right after analysis. For the grammar check, the resume text is
                sent to LanguageTool (languagetool.org).
            </p>

            <div className="panels">
                <form onSubmit={handleSubmit}>
                    <h2>Check Your Resume</h2>

                    <label>
                        Resume file (.pdf or .docx)
                        <input
                            type="file"
                            accept=".pdf,.docx"
                            onChange={(e) => setFile(e.target.files[0])}
                            required
                        />
                    </label>

                    <label>
                        Job description (optional)
                        <textarea
                            value={jdText}
                            onChange={(e) => setJdText(e.target.value)}
                            placeholder="Paste the job description to get tailoring suggestions"
                            rows={8}
                        />
                    </label>

                    {error && <p className="error">{error}</p>}

                    <button type="submit" disabled={submitting || !file}>
                        {submitting ? 'Analyzing...' : 'Analyze Resume'}
                    </button>
                </form>
            </div>

            {report && (
                <section>
                    <h2>Report</h2>
                    <p>
                        Extraction confidence: <strong>{report.extractionConfidence}</strong> ·
                        Word count: <strong>{report.wordCount}</strong> · Job description:{' '}
                        <strong>{report.jdProvided ? 'provided' : 'not provided'}</strong>
                    </p>

                    <h3>
                        ATS score: {report.atsScore === null ? 'not scored yet' : `${report.atsScore}/100`}
                    </h3>
                    <ul className="check-list">
                        {report.checks.map((check) => (
                            <li key={check.id} className={check.passed ? 'pass' : 'fail'}>
                                {check.passed ? '✓' : '✗'} {check.label}
                                {check.suggestion && <div className="hint">{check.suggestion}</div>}
                            </li>
                        ))}
                    </ul>

                    <h3>Grammar & spelling</h3>
                    {!report.grammar.available ? (
                        <p>Grammar check is unavailable right now. Try again in a minute.</p>
                    ) : report.grammar.issues.length === 0 ? (
                        <p>No grammar or spelling issues found.</p>
                    ) : (
                        <ul className="check-list">
                            {report.grammar.issues.map((issue, i) => (
                                <li key={i} className="fail">
                                    <strong>"{issue.flagged}"</strong>: {issue.message}
                                    {issue.replacements.length > 0 && (
                                        <div className="hint">Try: {issue.replacements.join(', ')}</div>
                                    )}
                                    <div className="excerpt">…{issue.excerpt}…</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </>
    );
}
