# Resume Skill Matcher

Upload a resume, extract its text, and score it against a job's required
tech skills using semantic similarity (embeddings) — not keyword matching.

## Stack

- **Backend:** Node.js, Express, Multer (file upload) — stateless, no database
- **Frontend:** React (Vite), storing jobs and results in the browser's
  `localStorage`
- **AI component:** [`@xenova/transformers`](https://github.com/xenova/transformers.js)
  running the `Xenova/all-MiniLM-L6-v2` embedding model **locally in Node** —
  free, no API key, no network call per request.

## Setup

```bash
npm install
cp .env.example .env   # optional: PORT, FRONTEND_URL for CORS in production
npm start               # backend on http://localhost:5000

cd frontend
npm install
cp .env.example .env    # optional: VITE_API_URL if backend isn't on :5000
npm run dev              # frontend on http://localhost:5173
```

Run the scoring engine tests (uses the real embedding model, not mocked):

```bash
npm test
```

## How Scoring Works

1. **Extraction.** The resume (PDF/DOCX) is parsed by an existing extraction
   module: direct PDF text-layer extraction, or DOCX via `mammoth`. It
   returns the extracted text plus a **confidence flag** (`high` / `low`).
   OCR fallback for scanned/image-only PDFs is currently disabled (see
   Deployment below) — those files return a clear error instead.

2. **Chunking.** The resume text is split line-by-line into small chunks
   (bullet points, sentences). We chunk instead of embedding the whole
   resume as one block because a single "whole document" vector would blur
   a candidate's strongest, most specific evidence into an average across
   every unrelated line (education, hobbies, etc.). Chunking also lets us
   show recruiters *which* line of the resume matched a given skill.

3. **Embedding.** Both the resume chunks and each required skill (e.g.
   `"React"`, `"Node.js"`) are converted into embedding vectors — lists of
   numbers that place text on a "meaning map," where texts with similar
   meaning land close together, regardless of shared keywords.

4. **Similarity scoring.** For each required skill, we compute **cosine
   similarity** (the angle between two vectors) against every resume chunk
   and keep the single best-matching chunk. Cosine similarity ranges from
   -1 to 1 in theory; in practice for related text it's roughly 0 (unrelated)
   to 1 (same meaning). The **overall score** is the average of all
   per-skill scores.

5. **Primary-stack mismatch check.** A candidate can score reasonably well
   on individual skills while their resume is actually dominated by a
   *different*, competing tech stack (e.g. mostly Java/Spring experience,
   with one passing mention of Node.js). We separately embed a handful of
   common competing stacks (Java/Spring, Python/Django, .NET/C#, PHP) and
   compare them the same way. If a competing stack scores meaningfully
   higher (>0.1) than the job's own stated primary stack, we raise a
   **mismatch flag** with the specific competing stack and both scores, so
   the verdict reflects that risk rather than hiding it behind a single
   average number.

6. **Recommendation.** All of the above (overall score, per-skill scores,
   mismatch flag, extraction confidence) feeds a small **rule-based**
   recommendation engine — no additional AI call. It produces a verdict
   (*Strong Match* / *Borderline* / *Weak Match*), plain-language reasons,
   caveats (mismatch or low-confidence extraction), and a short note per
   skill. It's deterministic and fully traceable back to the numbers that
   produced it — nothing here is generated free-text that could invent a
   reason not grounded in an actual score.

## Design Decisions

- **Why `@xenova/transformers`:** runs a small (~90MB) embedding model
  directly in Node — free, offline-capable, no API key, no per-request
  latency/cost from calling an external embeddings API. Good fit for a
  learning project and for keeping resume text off third-party servers.

- **Why cosine similarity over chunks, not one embedding per resume:** see
  "How Scoring Works" above — chunk-level comparison avoids diluting a
  strong, specific match with the rest of an unrelated resume, and lets the
  UI point to the exact line that matched.

- **Why the raw uploaded file is never persisted:** the backend is
  stateless — `POST /api/resumes/score` extracts text, scores it, and
  returns the full result without writing anything server-side. The
  uploaded file is written to a temp `backend/uploads/` folder only long
  enough for the extraction module to read it, then deleted — in a
  `finally` block, so it's deleted even if extraction or scoring throws
  partway through.

- **Why there's no database:** this is a demo/personal-use build, not a
  multi-user product — job postings and scored results are stored in the
  browser's `localStorage` on the frontend instead of a server-side
  database. The backend never sees a "job" as a persisted concept; the
  frontend sends the required skills and primary stack directly with each
  scoring request. Trade-off: results don't survive clearing browser data
  or switching devices/browsers, and there's no cross-user sharing of
  results — acceptable for the intended use, but worth knowing before
  relying on this for anything beyond a demo.

- **Why the mismatch flag exists as a separate signal:** an overall score
  is an average, and averages can hide a real problem — a candidate could
  clear the bar on required skills while their resume's dominant signal is
  a different stack entirely. The mismatch check is a separate,
  independent comparison for exactly that blind spot, and a confirmed
  mismatch downgrades the recommendation verdict rather than just adding a
  footnote, so a recruiter skimming only the verdict can't miss it.

- **Why the recommendation engine is rule-based, not a second AI call:** the
  verdict and reasons are derived deterministically from scores we already
  computed. This keeps every claim traceable ("why did this get Borderline?"
  → because overall score was 52%, which is the documented Borderline
  range) instead of relying on free-text generation that could state a
  reason not actually grounded in the underlying numbers.

- **Why skills are free-text (not a structured picker):** keeps the first
  version simple — a textarea a recruiter can paste a list into — rather
  than building a skills taxonomy/autocomplete before the core scoring
  engine was proven out.

## Deployment

**Backend (Render):**
1. New Web Service → connect this repo.
2. Root directory: repo root. Build command: `npm install`. Start command:
   `npm start`.
3. Environment variable: `FRONTEND_URL` = your deployed Vercel URL (once you
   have it), to lock CORS down from the wide-open local-dev default.
4. Note: the free tier has an ephemeral filesystem and ~512MB RAM. That's
   fine here since nothing is persisted to disk beyond the lifetime of a
   single request.
5. **OCR fallback is currently disabled.** It originally used `pdf-poppler`,
   which calls `process.exit(1)` at import time on any platform other than
   Windows/Mac — including Linux, which crashed the server immediately on
   Render. Direct-text PDFs (`pdf-parse`) and DOCX (`mammoth`) are
   unaffected; a scanned/image-only PDF now returns a clear error instead of
   crashing the process. Re-enabling OCR would need a cross-platform PDF
   rasterizer that doesn't depend on a native `canvas` build or platform
   binaries — e.g. a custom Docker image with `poppler-utils` installed.

**Frontend (Vercel):**
1. New Project → connect this repo, set root directory to `frontend/`.
2. Framework preset: Vite (auto-detected). Build command `npm run build`,
   output directory `dist`.
3. Environment variable: `VITE_API_URL` = your deployed Render backend URL.
