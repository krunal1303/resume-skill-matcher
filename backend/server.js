const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const resumesRouter = require('./routes/resumes');

const app = express();
const PORT = process.env.PORT || 5000;

fs.mkdirSync('backend/uploads', { recursive: true });

// In production, restrict to the deployed frontend origin(s) via
// FRONTEND_URL (comma-separated for multiple). Falls back to allowing all
// origins for local development, where there's no real security boundary.
const allowedOrigins = process.env.FRONTEND_URL?.split(',').map((s) => s.trim());
app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined));
app.use(express.json());

app.use('/api/resumes', resumesRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
