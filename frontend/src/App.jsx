import { useState, useEffect } from 'react';
import JobForm from './components/JobForm';
import ResumeUpload from './components/ResumeUpload';
import ResultsTable from './components/ResultsTable';
import CandidateDetailModal from './components/CandidateDetailModal';
import { getJobs, getResumesForJob, addResumeResult } from './storage';
import './App.css';

export default function App() {
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [resumes, setResumes] = useState([]);
    const [viewingResumeId, setViewingResumeId] = useState(null);

    useEffect(() => {
        setJobs(getJobs());
    }, []);

    useEffect(() => {
        setResumes(selectedJobId ? getResumesForJob(selectedJobId) : []);
    }, [selectedJobId]);

    function handleJobCreated(job) {
        setJobs(getJobs());
        setSelectedJobId(String(job.id));
    }

    function handleScored(jobId, result) {
        addResumeResult(jobId, result);
        setResumes(getResumesForJob(selectedJobId));
    }

    return (
        <div className="app">
            <h1>Resume Skill Matcher</h1>

            <div className="panels">
                <JobForm onJobCreated={handleJobCreated} />
                <ResumeUpload
                    jobs={jobs}
                    selectedJobId={selectedJobId}
                    onJobIdChange={setSelectedJobId}
                    onScored={handleScored}
                />
            </div>

            <h2>Results</h2>
            <ResultsTable resumes={resumes} onViewCandidate={setViewingResumeId} />

            {viewingResumeId && (
                <CandidateDetailModal
                    jobId={selectedJobId}
                    resumeId={viewingResumeId}
                    onClose={() => setViewingResumeId(null)}
                />
            )}
        </div>
    );
}
