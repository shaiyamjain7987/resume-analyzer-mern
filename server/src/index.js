import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import resumeRoutes from "./routes/resumeRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const configuredOrigin = process.env.CLIENT_ORIGIN;
      const allowedOrigins = new Set([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        configuredOrigin
      ]);

      try {
        const { hostname, port } = new URL(origin);
        const isLocalClient =
          port === "5173" &&
          (hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname.startsWith("192.168.") ||
            hostname.startsWith("10.") ||
            hostname.startsWith("172."));

        if (allowedOrigins.has(origin) || isLocalClient) {
          return callback(null, true);
        }
      } catch {
        return callback(new Error("Invalid request origin."));
      }

      return callback(new Error("Request origin is not allowed by CORS."));
    }
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? "connected" : "offline"
  });
});

app.use("/api/resumes", resumeRoutes);

async function start() {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected");
    } catch (error) {
      console.warn("MongoDB connection failed. Continuing without persistence.");
      console.warn(error.message);
    }
  }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start();
