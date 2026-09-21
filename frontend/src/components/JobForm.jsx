import { useState } from 'react';
import { createJob } from '../api';

export default function JobForm({ onJobCreated }) {
    const [title, setTitle] = useState('');
    const [primaryStack, setPrimaryStack] = useState('');
    const [skills, setSkills] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const job = await createJob({ title, primaryStack, skills });
            setTitle('');
            setPrimaryStack('');
            setSkills('');
            onJobCreated(job);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Create Job Posting</h2>

            <label>
                Job title
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>

            <label>
                Primary stack (e.g. "Node.js/React")
                <input
                    value={primaryStack}
                    onChange={(e) => setPrimaryStack(e.target.value)}
                    required
                />
            </label>

            <label>
                Required skills (comma or newline separated)
                <textarea
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Node.js, React, MySQL, REST APIs"
                    required
                />
            </label>

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Job'}
            </button>
        </form>
    );
}
