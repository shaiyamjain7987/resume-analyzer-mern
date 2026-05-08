import mongoose from "mongoose";

const ResumeAnalysisSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true
    },
    jobTitle: {
      type: String,
      default: ""
    },
    jobDescription: {
      type: String,
      default: ""
    },
    resumeText: {
      type: String,
      required: true
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.models.ResumeAnalysis ||
  mongoose.model("ResumeAnalysis", ResumeAnalysisSchema);
