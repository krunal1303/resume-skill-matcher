import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import CandidatePage from './pages/CandidatePage';
import RecruiterPage from './pages/RecruiterPage';
import './App.css';

// Two independent tools sharing one backend. They don't share any state -
// each page owns its own data.
export default function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <nav className="top-nav">
                    <NavLink to="/candidate">For Candidates</NavLink>
                    <NavLink to="/recruiter">For Recruiters</NavLink>
                </nav>

                <Routes>
                    <Route path="/" element={<Navigate to="/candidate" replace />} />
                    <Route path="/candidate" element={<CandidatePage />} />
                    <Route path="/recruiter" element={<RecruiterPage />} />
                    <Route path="*" element={<Navigate to="/candidate" replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
