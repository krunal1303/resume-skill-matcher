CREATE DATABASE IF NOT EXISTS resume_skills_matcher;
USE resume_skills_matcher;

-- A job posting created by a recruiter
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    primary_stack VARCHAR(100) NOT NULL, -- e.g. "Node.js/React" - used for the mismatch flag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Required skills for a job, one row per skill (from the free-text list)
CREATE TABLE IF NOT EXISTS required_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- A scored resume submission for a job.
-- Raw uploaded file is NEVER stored - only extracted text + resulting scores.
CREATE TABLE IF NOT EXISTS resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    candidate_name VARCHAR(255),
    extracted_text MEDIUMTEXT NOT NULL,
    extraction_confidence VARCHAR(20) NOT NULL, -- from existing extraction module: e.g. 'high' | 'low' (OCR fallback used)
    overall_score FLOAT NOT NULL,
    primary_stack_mismatch BOOLEAN NOT NULL DEFAULT FALSE,
    mismatch_competing_stack VARCHAR(100), -- e.g. "Java/Spring" - which competing stack triggered the flag
    mismatch_competing_score FLOAT, -- that competing stack's similarity score
    mismatch_primary_score FLOAT, -- the job's own primary stack similarity score, for comparison
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Per-skill score breakdown for a resume (the "clear score breakdown" requirement)
CREATE TABLE IF NOT EXISTS resume_skill_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resume_id INT NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    similarity_score FLOAT NOT NULL, -- cosine similarity, 0-1
    matched_text_snippet TEXT, -- the resume chunk that best matched this skill
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);
