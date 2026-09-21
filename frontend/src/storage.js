const STORAGE_KEY = 'resume-skills-matcher-data';

function loadAll() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { jobs: [], resumesByJobId: {} };
    } catch {
        return { jobs: [], resumesByJobId: {} };
    }
}

function saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getJobs() {
    return loadAll().jobs;
}

export function createJob({ title, primaryStack, skills }) {
    const data = loadAll();
    const job = {
        id: Date.now(),
        title,
        primaryStack,
        skills: skills
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
    };
    data.jobs.unshift(job);
    saveAll(data);
    return job;
}

export function getResumesForJob(jobId) {
    const data = loadAll();
    return data.resumesByJobId[jobId] || [];
}

export function addResumeResult(jobId, result) {
    const data = loadAll();
    const resume = { id: Date.now(), ...result };
    const existing = data.resumesByJobId[jobId] || [];
    data.resumesByJobId[jobId] = [resume, ...existing];
    saveAll(data);
    return resume;
}

export function getResumeById(jobId, resumeId) {
    return getResumesForJob(jobId).find((r) => String(r.id) === String(resumeId)) || null;
}
