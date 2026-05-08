const commonSkills = [
  "javascript",
  "typescript",
  "react",
  "node",
  "express",
  "mongodb",
  "sql",
  "python",
  "java",
  "aws",
  "docker",
  "kubernetes",
  "rest",
  "graphql",
  "git",
  "testing",
  "ci/cd",
  "redux",
  "tailwind",
  "html",
  "css"
];

const stopWords = new Set([
  "and",
  "the",
  "with",
  "for",
  "you",
  "are",
  "our",
  "this",
  "that",
  "from",
  "will",
  "have",
  "has",
  "your",
  "into",
  "using",
  "work",
  "role",
  "team",
  "build",
  "years"
]);

export function heuristicAnalyze({ resumeText, jobDescription, jobTitle }) {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();
  const jdKeywords = extractKeywords(jobDescription);
  const resumeKeywords = new Set(extractKeywords(resumeText));
  const requiredKeywords = jdKeywords.length ? jdKeywords : inferRoleKeywords(jobTitle);

  const matchedKeywords = requiredKeywords.filter((keyword) =>
    resumeLower.includes(keyword.toLowerCase())
  );
  const missingKeywords = requiredKeywords
    .filter((keyword) => !resumeLower.includes(keyword.toLowerCase()))
    .slice(0, 12);

  const matchedSkills = commonSkills.filter((skill) => resumeLower.includes(skill));
  const jobSkills = commonSkills.filter((skill) => jdLower.includes(skill));
  const skillScore = scoreRatio(matchedSkills.length, Math.max(jobSkills.length, 6));
  const experienceScore = scoreExperience(resumeLower);
  const educationScore = hasAny(resumeLower, ["education", "degree", "bachelor", "master", "university"])
    ? 82
    : 55;
  const projectsScore = hasAny(resumeLower, ["project", "portfolio", "github", "built", "implemented"])
    ? 84
    : 58;
  const atsReadability = scoreAts(resumeText);
  const keywordScore = scoreRatio(matchedKeywords.length, Math.max(requiredKeywords.length, 1));

  const overallScore = Math.round(
    keywordScore * 0.35 +
      skillScore * 0.25 +
      experienceScore * 0.18 +
      atsReadability * 0.12 +
      projectsScore * 0.1
  );

  const strengths = [
    matchedSkills.length
      ? `Shows relevant technical skills: ${matchedSkills.slice(0, 6).join(", ")}.`
      : "Includes enough text to perform a structured review.",
    experienceScore >= 75
      ? "Experience section appears substantial and role-oriented."
      : "Resume has a foundation that can be strengthened with clearer experience impact.",
    atsReadability >= 75
      ? "Formatting appears reasonably ATS-readable."
      : "Resume text is readable, but formatting or section clarity may need work."
  ];

  const improvements = [
    missingKeywords.length
      ? `Add evidence for missing role keywords: ${missingKeywords.slice(0, 6).join(", ")}.`
      : "Keep the keyword coverage strong and make sure each important skill has proof.",
    "Rewrite bullets to include measurable impact, scope, tools used, and business outcome.",
    "Put the most relevant skills and projects near the top for faster recruiter scanning."
  ];

  const atsIssues = buildAtsIssues(resumeText, resumeLower);

  return {
    overallScore,
    summary: buildSummary(overallScore, matchedKeywords.length, missingKeywords.length),
    sectionScores: {
      skills: Math.round(skillScore),
      experience: experienceScore,
      education: educationScore,
      projects: projectsScore,
      atsReadability
    },
    matchedKeywords: matchedKeywords.slice(0, 16),
    missingKeywords,
    strengths,
    improvements,
    atsIssues,
    suggestedBullets: buildSuggestedBullets(jobTitle, matchedSkills, resumeKeywords)
  };
}

function extractKeywords(text) {
  const phrases = text
    .toLowerCase()
    .match(/[a-z][a-z+#./-]{2,}(?:\s[a-z][a-z+#./-]{2,})?/g);

  if (!phrases) return [];

  const counts = new Map();
  for (const phrase of phrases) {
    const clean = phrase.trim();
    if (clean.length < 3 || stopWords.has(clean)) continue;
    counts.set(clean, (counts.get(clean) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword]) => keyword);
}

function inferRoleKeywords(jobTitle = "") {
  const title = jobTitle.toLowerCase();
  if (title.includes("mern") || title.includes("full stack")) {
    return ["react", "node", "express", "mongodb", "javascript", "api", "authentication"];
  }
  if (title.includes("data")) {
    return ["python", "sql", "analytics", "dashboard", "machine learning", "statistics"];
  }
  return ["communication", "leadership", "project", "collaboration", "problem solving"];
}

function scoreRatio(value, total) {
  return Math.min(100, Math.round((value / total) * 100));
}

function scoreExperience(text) {
  let score = 45;
  if (text.includes("experience")) score += 20;
  if (/\b\d+\+?\s*(years|yrs)\b/.test(text)) score += 15;
  if (/\b(led|owned|improved|reduced|increased|delivered|launched)\b/.test(text)) score += 15;
  if (/%|\$|\b\d+x\b/.test(text)) score += 5;
  return Math.min(score, 100);
}

function scoreAts(text) {
  let score = 85;
  if (text.length < 1400) score -= 12;
  if (!/experience/i.test(text)) score -= 8;
  if (!/skills/i.test(text)) score -= 8;
  if (!/education/i.test(text)) score -= 6;
  if (/[│┌┐└┘]/.test(text)) score -= 12;
  return Math.max(35, score);
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function buildAtsIssues(resumeText, resumeLower) {
  const issues = [];
  if (!resumeLower.includes("skills")) issues.push("Add a clear Skills section.");
  if (!resumeLower.includes("experience")) issues.push("Add a clear Experience section.");
  if (!resumeLower.includes("education")) issues.push("Add a clear Education section.");
  if (resumeText.length < 1400) issues.push("Resume may be too thin for competitive screening.");
  if (!/%|\$|\b\d+x\b/.test(resumeText)) {
    issues.push("Add measurable results such as percentages, revenue, time saved, or scale.");
  }
  return issues.length ? issues : ["No major ATS readability issues detected."];
}

function buildSummary(score, matched, missing) {
  if (score >= 80) {
    return `Strong match. The resume covers ${matched} important signals and has limited gaps.`;
  }
  if (score >= 60) {
    return `Moderate match. The resume has useful overlap, but ${missing} important keywords or proof points need work.`;
  }
  return `Needs targeted revision. Add role-specific skills, measurable achievements, and clearer section structure.`;
}

function buildSuggestedBullets(jobTitle, skills) {
  const skillText = skills.slice(0, 3).join(", ") || "relevant tools";
  const roleText = jobTitle || "target role";
  return [
    `Built and maintained production features for a ${roleText} using ${skillText}, improving reliability and user workflow efficiency.`,
    "Converted ambiguous requirements into shipped functionality by collaborating with stakeholders, documenting decisions, and validating outcomes.",
    "Improved application performance and maintainability by refactoring core flows, adding tests, and monitoring user-facing metrics."
  ];
}
