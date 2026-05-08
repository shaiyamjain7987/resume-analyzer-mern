import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Gauge,
  History,
  Loader2,
  Sparkles,
  Upload,
  XCircle
} from "lucide-react";
import "./styles.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:5000`;

function App() {
  const [resume, setResume] = useState(null);
  const [jobTitle, setJobTitle] = useState("MERN Stack Developer");
  const [jobDescription, setJobDescription] = useState("");
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/resumes/history`)
      .then((response) => response.json())
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  const canAnalyze = useMemo(() => resume && !loading, [resume, loading]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!resume) {
      setError("Upload a resume first.");
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jobTitle", jobTitle);
    formData.append("jobDescription", jobDescription);

    try {
      const response = await fetch(`${API_URL}/api/resumes/analyze`, {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Analysis failed.");
      }

      setReport(payload);
      setHistory((current) => [
        {
          _id: payload.id || crypto.randomUUID(),
          fileName: payload.fileName,
          jobTitle,
          result: { overallScore: payload.result.overallScore },
          createdAt: new Date().toISOString()
        },
        ...current
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">MERN AI Resume Analyzer</p>
            <h1>Resume match, ATS checks, and rewrite suggestions in one review.</h1>
          </div>
          <div className="status-pill">
            <Sparkles size={18} />
            AI ready
          </div>
        </header>

        <div className="main-grid">
          <form className="panel analyzer-panel" onSubmit={handleSubmit}>
            <div className="panel-title">
              <BriefcaseBusiness size={21} />
              <h2>Target Role</h2>
            </div>

            <label>
              Job title
              <input
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                placeholder="Frontend Developer"
              />
            </label>

            <label>
              Job description
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste responsibilities, required skills, and qualifications."
              />
            </label>

            <label className="dropzone">
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(event) => setResume(event.target.files?.[0] || null)}
              />
              <Upload size={28} />
              <span>{resume ? resume.name : "Upload resume PDF, DOCX, or TXT"}</span>
            </label>

            {error && (
              <div className="alert">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <button className="primary-button" type="submit" disabled={!canAnalyze}>
              {loading ? <Loader2 className="spin" size={20} /> : <Gauge size={20} />}
              {loading ? "Analyzing" : "Analyze Resume"}
            </button>
          </form>

          <section className="panel report-panel">
            {!report ? (
              <EmptyState loading={loading} />
            ) : (
              <ReportView report={report.result} fileName={report.fileName} />
            )}
          </section>
        </div>

        <section className="history-row">
          <div className="section-heading">
            <History size={20} />
            <h2>Recent Reports</h2>
          </div>
          <div className="history-list">
            {history.length ? (
              history.slice(0, 4).map((item) => (
                <article className="history-item" key={item._id}>
                  <FileText size={19} />
                  <div>
                    <strong>{item.fileName}</strong>
                    <span>{item.jobTitle || "Untitled role"}</span>
                  </div>
                  <b>{item.result?.overallScore ?? "--"}%</b>
                </article>
              ))
            ) : (
              <p className="muted">Saved reports appear here when MongoDB is connected.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function EmptyState({ loading }) {
  return (
    <div className="empty-state">
      {loading ? <Loader2 className="spin" size={42} /> : <FileText size={42} />}
      <h2>{loading ? "Reviewing resume" : "Analysis report"}</h2>
      <p>
        {loading
          ? "Extracting text, comparing role signals, and preparing recommendations."
          : "Upload a resume and target role to generate a recruiter-style report."}
      </p>
    </div>
  );
}

function ReportView({ report, fileName }) {
  return (
    <div className="report">
      <div className="score-header">
        <div>
          <span className="file-name">{fileName}</span>
          <h2>{report.overallScore}% match</h2>
          <p>{report.summary}</p>
        </div>
        <ScoreRing score={report.overallScore} />
      </div>

      <div className="score-grid">
        {Object.entries(report.sectionScores).map(([label, score]) => (
          <div className="metric" key={label}>
            <span>{formatLabel(label)}</span>
            <strong>{score}%</strong>
            <div className="meter">
              <i style={{ width: `${score}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="keyword-grid">
        <KeywordList
          title="Matched Keywords"
          items={report.matchedKeywords}
          icon={<CheckCircle2 size={18} />}
          tone="good"
        />
        <KeywordList
          title="Missing Keywords"
          items={report.missingKeywords}
          icon={<XCircle size={18} />}
          tone="warn"
        />
      </div>

      <InsightList title="Strengths" items={report.strengths} />
      <InsightList title="Improvements" items={report.improvements} />
      <InsightList title="ATS Issues" items={report.atsIssues} />
      <InsightList title="Suggested Bullets" items={report.suggestedBullets} accent />
    </div>
  );
}

function ScoreRing({ score }) {
  const background = `conic-gradient(#2f7d68 ${score * 3.6}deg, #d8e4df 0deg)`;
  return (
    <div className="score-ring" style={{ background }} aria-label={`${score}% match`}>
      <span>{score}</span>
    </div>
  );
}

function KeywordList({ title, items, icon, tone }) {
  return (
    <section className={`keyword-card ${tone}`}>
      <h3>
        {icon}
        {title}
      </h3>
      <div className="chips">
        {items.length ? items.map((item) => <span key={item}>{item}</span>) : <em>None detected</em>}
      </div>
    </section>
  );
}

function InsightList({ title, items, accent = false }) {
  return (
    <section className={accent ? "insight accent" : "insight"}>
      <h3>
        {accent && <ArrowUpRight size={18} />}
        {title}
      </h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function formatLabel(label) {
  return label.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

createRoot(document.getElementById("root")).render(<App />);
