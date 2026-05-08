import mammoth from "mammoth";
import pdfParse from "pdf-parse";

const supportedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

export async function extractTextFromFile(file) {
  if (!supportedTypes.has(file.mimetype)) {
    throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT resume.");
  }

  if (file.mimetype === "application/pdf") {
    const parsed = await pdfParse(file.buffer);
    return normalizeText(parsed.text);
  }

  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return normalizeText(parsed.value);
  }

  return normalizeText(file.buffer.toString("utf8"));
}

function normalizeText(text) {
  return text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
