# AI Resume Analyzer

A MERN resume analyzer with file upload, AI-powered scoring, skill gap detection, ATS checks, and saved analysis history.

## Tech Stack

- MongoDB + Mongoose
- Express + Node.js
- React + Vite
- OpenAI-compatible analysis with a local heuristic fallback

## Setup

1. Install dependencies:

   ```bash
   npm run install:all
   ```

2. Create `server/.env`:

   ```bash
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/ai-resume-analyzer
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   CLIENT_ORIGIN=http://localhost:5173
   ```

   `OPENAI_API_KEY` and `MONGO_URI` are optional for local demo use. Without an API key, the server uses a deterministic analyzer. Without MongoDB, analysis still works but history is not persisted.

3. Run the app:

   ```bash
   npm run dev
   ```

4. Open:

   ```text
   http://localhost:5173
   ```

   This workspace uses Vite preview for the default local client command because some Windows/OneDrive setups block Vite's dependency optimizer in live dev mode. For standard hot reload development, try `npm --prefix client run dev:vite`.

## Features

- Upload PDF, DOCX, or TXT resumes
- Paste a target job description
- Overall match score and section scores
- ATS readability checks
- Keyword and skill gap detection
- Concrete rewrite suggestions
- Report history endpoint backed by MongoDB
