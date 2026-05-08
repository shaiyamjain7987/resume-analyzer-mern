import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { analyzeResume } from "../services/analyzer.js";
import { extractTextFromFile } from "../services/fileParser.js";
import ResumeAnalysis from "../models/ResumeAnalysis.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required." });
    }

    const jobDescription = req.body.jobDescription || "";
    const jobTitle = req.body.jobTitle || "";
    const resumeText = await extractTextFromFile(req.file);

    if (resumeText.trim().length < 120) {
      return res.status(400).json({
        message: "Could not extract enough resume text. Try a text-based PDF, DOCX, or TXT file."
      });
    }

    const result = await analyzeResume({
      resumeText,
      jobDescription,
      jobTitle
    });

    let savedId = null;
    if (mongoose.connection.readyState === 1) {
      const saved = await ResumeAnalysis.create({
        fileName: req.file.originalname,
        jobTitle,
        jobDescription,
        resumeText,
        result
      });
      savedId = saved._id;
    }

    res.json({
      id: savedId,
      fileName: req.file.originalname,
      result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Unable to analyze resume."
    });
  }
});

router.get("/history", async (_req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json([]);
  }

  const reports = await ResumeAnalysis.find()
    .select("fileName jobTitle result.overallScore createdAt")
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(reports);
});

export default router;
