const API_BASE = 'http://localhost:5000/api';

async function request(path, options) {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Request failed');
    }
    return data;
}

export function createJob({ title, primaryStack, skills }) {
    return request('/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, primaryStack, skills }),
    });
}

export function getJobs() {
    return request('/jobs');
}

export function uploadResume({ file, jobId, candidateName }) {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobId', jobId);
    if (candidateName) formData.append('candidateName', candidateName);

    return request('/resumes', { method: 'POST', body: formData });
}

export function getResumesForJob(jobId) {
    return request(`/resumes?jobId=${jobId}`);
}

export function getResumeDetail(resumeId) {
    return request(`/resumes/${resumeId}`);
}
