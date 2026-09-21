const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

// The only server call: extraction + embedding-based scoring is real work
// that has to happen in Node. Everything else (jobs, results) lives in
// localStorage - see storage.js.
export async function scoreResume({ file, candidateName, primaryStack, requiredSkills }) {
    const formData = new FormData();
    formData.append('resume', file);
    if (candidateName) formData.append('candidateName', candidateName);
    formData.append('primaryStack', primaryStack);
    formData.append('requiredSkills', JSON.stringify(requiredSkills));

    const res = await fetch(`${API_BASE}/resumes/score`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Request failed');
    }
    return data;
}
