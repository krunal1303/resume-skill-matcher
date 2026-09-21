import { useState, useEffect, useCallback } from 'react';
import JobForm from './components/JobForm';
import ResumeUpload from './components/ResumeUpload';
import ResultsTable from './components/ResultsTable';
import CandidateDetailModal from './components/CandidateDetailModal';
import { getJobs, getResumesForJob } from './api';
import './App.css';

export default function App() {
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [resumes, setResumes] = useState([]);
    const [viewingResumeId, setViewingResumeId] = useState(null);

    const refreshJobs = useCallback(async () => {
        const data = await getJobs();
        setJobs(data);
    }, []);

    const refreshResumes = useCallback(async (jobId) => {
        if (!jobId) {
            setResumes([]);
            return;
        }
        const data = await getResumesForJob(jobId);
        setResumes(data);
    }, []);

    useEffect(() => {
        refreshJobs();
    }, [refreshJobs]);

    useEffect(() => {
        refreshResumes(selectedJobId);
    }, [selectedJobId, refreshResumes]);

    function handleJobCreated(job) {
        refreshJobs();
        setSelectedJobId(String(job.id));
    }

    function handleScored() {
        refreshResumes(selectedJobId);
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
                    resumeId={viewingResumeId}
                    onClose={() => setViewingResumeId(null)}
                />
            )}
        </div>
    );
}
