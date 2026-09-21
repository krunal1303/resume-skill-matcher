import { useState } from 'react';
import { scoreResume } from '../api';

export default function ResumeUpload({ jobs, selectedJobId, onJobIdChange, onScored }) {
    const [file, setFile] = useState(null);
    const [candidateName, setCandidateName] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        const job = jobs.find((j) => String(j.id) === String(selectedJobId));
        if (!file || !job) return;

        setError(null);
        setSubmitting(true);
        try {
            const result = await scoreResume({
                file,
                candidateName,
                primaryStack: job.primaryStack,
                requiredSkills: job.skills,
            });
            setFile(null);
            setCandidateName('');
            e.target.reset();
            onScored(job.id, result);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Upload Resume</h2>

            <label>
                Job
                <select
                    value={selectedJobId}
                    onChange={(e) => onJobIdChange(e.target.value)}
                    required
                >
                    <option value="">Select a job...</option>
                    {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                            {job.title}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Candidate name (optional)
                <input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
            </label>

            <label>
                Resume file (.pdf or .docx)
                <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                />
            </label>

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={submitting || !selectedJobId}>
                {submitting ? 'Scoring...' : 'Upload & Score'}
            </button>
        </form>
    );
}
