import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initialCustomDb } from "./src/data/initialDb";
import { DEFAULT_PAGES } from "./src/data/defaultPages";

const DB_FILE = path.join(process.cwd(), "db.json");

// Ensure db.json exists on startup
function ensureDbExists() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultData = {
        customDb: initialCustomDb,
        pages: DEFAULT_PAGES,
        selectedPageId: DEFAULT_PAGES[0]?.id || ""
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error creating initial db.json:", err);
  }
}

async function startServer() {
  ensureDbExists();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API endpoints
  app.get("/api/assets", (req, res) => {
    try {
      const assetsMap: Record<string, string> = {};
      const baseDir = path.join(process.cwd(), "assets");
      const categories = ["items", "recipes", "machines", "modifiers"];

      categories.forEach(cat => {
        const dirPath = path.join(baseDir, cat);
        if (fs.existsSync(dirPath)) {
          try {
            const files = fs.readdirSync(dirPath);
            files.forEach(file => {
              const extIdx = file.lastIndexOf(".");
              if (extIdx !== -1) {
                const id = file.substring(0, extIdx);
                // Map category:id to the exact static relative URL path
                assetsMap[`${cat}:${id}`] = `/assets/${cat}/${file}`;
              }
            });
          } catch (err) {
            console.error(`Error scanning assets for ${cat}:`, err);
          }
        }
      });

      res.json(assetsMap);
    } catch (error) {
      console.error("Error in GET /api/assets:", error);
      res.status(500).json({ error: "Failed to scan assets" });
    }
  });

  // Serve custom assets folder statically so they can be accessed at /assets/...
  app.use("/assets", express.static(path.join(process.cwd(), "assets")));

  app.get("/api/db", async (req, res) => {
    try {
      let data;
      if (!fs.existsSync(DB_FILE)) {
        data = {
          customDb: initialCustomDb,
          pages: DEFAULT_PAGES,
          selectedPageId: DEFAULT_PAGES[0]?.id || ""
        };
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
      } else {
        try {
          const dataStr = await fs.promises.readFile(DB_FILE, "utf-8");
          data = JSON.parse(dataStr);
        } catch (e) {
          console.error("Corrupt db.json, recreating with defaults...", e);
          const backupPath = path.join(process.cwd(), `db_corrupt_${Date.now()}.json`);
          await fs.promises.rename(DB_FILE, backupPath);
          data = {
            customDb: initialCustomDb,
            pages: DEFAULT_PAGES,
            selectedPageId: DEFAULT_PAGES[0]?.id || ""
          };
          await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
        }
      }
      res.json(data);
    } catch (error) {
      console.error("Error in GET /api/db:", error);
      res.status(500).json({ error: "Failed to load database" });
    }
  });

  app.post("/api/db", async (req, res) => {
    try {
      const { customDb, pages, selectedPageId } = req.body;
      const dataToSave = { customDb, pages, selectedPageId };
      await fs.promises.writeFile(DB_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
      res.json({ success: true });
    } catch (error) {
      console.error("Error in POST /api/db:", error);
      res.status(500).json({ error: "Failed to save database" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
