import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import Database from "better-sqlite3";
import { createServer as createViteServer } from "vite";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const db = new Database("manuscripts.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS manuscripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    original_path TEXT,
    restored_text TEXT,
    era TEXT,
    confidence REAL,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  app.use(express.json());

  // Multer setup for image uploads
  const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
  const upload = multer({ storage });

  // API Routes
  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    const stmt = db.prepare("INSERT INTO manuscripts (filename, original_path, status) VALUES (?, ?, ?)");
    const info = stmt.run(req.file.filename, req.file.path, "pending");
    
    res.json({ id: info.lastInsertRowid, filename: req.file.filename });
  });

  app.get("/api/manuscripts", (req, res) => {
    const rows = db.prepare("SELECT * FROM manuscripts ORDER BY created_at DESC").all();
    res.json(rows);
  });

  app.post("/api/manuscripts/:id/restore", express.json(), (req, res) => {
    const { id } = req.params;
    const { restored_text, era, confidence } = req.body;
    
    const stmt = db.prepare("UPDATE manuscripts SET restored_text = ?, era = ?, confidence = ?, status = ? WHERE id = ?");
    stmt.run(restored_text, era, confidence, "completed", id);
    
    res.json({ success: true });
  });

  // Socket.io for real-time pipeline updates
  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("start-restoration", (data) => {
      const { manuscriptId } = data;
      
      // Simulate pipeline progress
      const steps = [
        { id: "I", name: "Initial Scan", message: "Multi-spectral imaging complete", delay: 1000 },
        { id: "II", name: "Ink Analysis", message: "Chemical composition identified", delay: 2000 },
        { id: "III", name: "Digital Infills", message: "Reconstructing lost characters...", delay: 3000 },
        { id: "IV", name: "Final Curation", message: "Finalizing restoration...", delay: 2000 },
      ];

      let currentStep = 0;
      const runStep = () => {
        if (currentStep < steps.length) {
          const step = steps[currentStep];
          socket.emit("pipeline-update", {
            manuscriptId,
            stepId: step.id,
            name: step.name,
            message: step.message,
            progress: ((currentStep + 1) / steps.length) * 100,
            isComplete: currentStep === steps.length - 1
          });
          currentStep++;
          setTimeout(runStep, step.delay);
        }
      };

      runStep();
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
