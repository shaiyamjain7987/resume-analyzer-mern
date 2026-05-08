import OpenAI from "openai";
import { z } from "zod";
import { heuristicAnalyze } from "./heuristicAnalyzer.js";

const AnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  summary: z.string(),
  sectionScores: z.object({
    skills: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
    education: z.number().min(0).max(100),
    projects: z.number().min(0).max(100),
    atsReadability: z.number().min(0).max(100)
  }),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  atsIssues: z.array(z.string()),
  suggestedBullets: z.array(z.string())
});

export async function analyzeResume({ resumeText, jobDescription, jobTitle }) {
  if (!process.env.OPENAI_API_KEY) {
    return heuristicAnalyze({ resumeText, jobDescription, jobTitle });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = buildPrompt({ resumeText, jobDescription, jobTitle });

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical recruiter and ATS resume analyst. Return strict JSON only."
        },
        { role: "user", content: prompt }
      ]
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return AnalysisSchema.parse(parsed);
  } catch (error) {
    console.warn("AI analysis failed. Falling back to local analyzer.");
    console.warn(error.message);
    return heuristicAnalyze({ resumeText, jobDescription, jobTitle });
  }
}

function buildPrompt({ resumeText, jobDescription, jobTitle }) {
  return `
Analyze this resume for the target role. Score honestly and provide practical edits.

Target role: ${jobTitle || "Not provided"}

Job description:
${jobDescription || "Not provided"}

Resume:
${resumeText.slice(0, 12000)}

Return JSON with exactly these keys:
overallScore number 0-100,
summary string,
sectionScores object with skills, experience, education, projects, atsReadability numbers 0-100,
matchedKeywords string[],
missingKeywords string[],
strengths string[],
improvements string[],
atsIssues string[],
suggestedBullets string[].
`;
}
