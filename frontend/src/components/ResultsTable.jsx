import { useState, useMemo } from 'react';

const SORT_FIELDS = {
    score: (r) => r.overall_score,
    name: (r) => r.candidate_name || '',
    date: (r) => r.created_at,
};

export default function ResultsTable({ resumes, onViewCandidate }) {
    const [sortField, setSortField] = useState('score');
    const [sortDir, setSortDir] = useState('desc');

    const sortedResumes = useMemo(() => {
        const getValue = SORT_FIELDS[sortField];
        const sorted = [...resumes].sort((a, b) => {
            const va = getValue(a);
            const vb = getValue(b);
            if (va < vb) return -1;
            if (va > vb) return 1;
            return 0;
        });
        return sortDir === 'desc' ? sorted.reverse() : sorted;
    }, [resumes, sortField, sortDir]);

    function toggleSort(field) {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    }

    if (resumes.length === 0) {
        return <p>No resumes scored yet for this job.</p>;
    }

    return (
        <table>
            <thead>
                <tr>
                    <th onClick={() => toggleSort('name')}>Candidate</th>
                    <th onClick={() => toggleSort('score')}>Score</th>
                    <th>Stack Match</th>
                    <th>Extraction</th>
                    <th onClick={() => toggleSort('date')}>Uploaded</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {sortedResumes.map((resume) => (
                    <tr key={resume.id}>
                        <td>{resume.candidate_name || '(unnamed)'}</td>
                        <td>{(resume.overall_score * 100).toFixed(0)}%</td>
                        <td>
                            {resume.primary_stack_mismatch ? (
                                <span className="flag flag-warning">Stack mismatch</span>
                            ) : (
                                'OK'
                            )}
                        </td>
                        <td>
                            {resume.extraction_confidence !== 'high' && (
                                <span className="flag flag-warning">
                                    Low confidence ({resume.extraction_confidence})
                                </span>
                            )}
                            {resume.extraction_confidence === 'high' && 'OK'}
                        </td>
                        <td>{new Date(resume.created_at).toLocaleDateString()}</td>
                        <td>
                            <button onClick={() => onViewCandidate(resume.id)}>View</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
