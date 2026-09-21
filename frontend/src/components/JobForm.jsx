import { useState } from 'react';
import { createJob } from '../storage';

export default function JobForm({ onJobCreated }) {
    const [title, setTitle] = useState('');
    const [primaryStack, setPrimaryStack] = useState('');
    const [skills, setSkills] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        const job = createJob({ title, primaryStack, skills });
        setTitle('');
        setPrimaryStack('');
        setSkills('');
        onJobCreated(job);
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

            <button type="submit">Create Job</button>
        </form>
    );
}
