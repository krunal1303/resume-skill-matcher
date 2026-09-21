const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const jobsRouter = require('./routes/jobs');
const resumesRouter = require('./routes/resumes');

const app = express();
const PORT = process.env.PORT || 5000;

fs.mkdirSync('backend/uploads', { recursive: true });

app.use(cors());
app.use(express.json());

app.use('/api/jobs', jobsRouter);
app.use('/api/resumes', resumesRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
