const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const CSV_PATH = path.join(ROOT, "emails.csv");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk.toString();
      if (data.length > 10000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function toCsvCell(value) {
  const text = String(value ?? "");
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function appendEmailRow(email) {
  const isNewFile = !fs.existsSync(CSV_PATH);
  if (isNewFile) {
    fs.writeFileSync(CSV_PATH, "email,submitted_at\n", "utf8");
  }

  const row = `${toCsvCell(email)},${toCsvCell(new Date().toISOString())}\n`;
  fs.appendFileSync(CSV_PATH, row, "utf8");
}

function serveFile(reqPath, res) {
  const safePath = path.normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const relativePath = safePath === "/" ? "index.html" : safePath.replace(/^\/+/, "");
  const filePath = path.join(ROOT, relativePath);

  if (!filePath.startsWith(ROOT)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  fs.readFile(filePath, (err, file) => {
    if (err) {
      const publicFilePath = path.join(ROOT, "public", relativePath);
      if (!publicFilePath.startsWith(path.join(ROOT, "public"))) {
        sendJson(res, 403, { error: "Forbidden" });
        return;
      }

      fs.readFile(publicFilePath, (publicErr, publicFile) => {
        if (publicErr) {
          sendJson(res, 404, { error: "Not found" });
          return;
        }

        const publicExt = path.extname(publicFilePath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME[publicExt] || "application/octet-stream" });
        res.end(publicFile);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(file);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if ((url.pathname === "/api/waitlist" || url.pathname === "/waitlist") && req.method === "POST") {
    try {
      const raw = await parseBody(req);
      const body = JSON.parse(raw || "{}");
      const email = String(body.email || "").trim().toLowerCase();

      if (!isEmail(email)) {
        sendJson(res, 400, { error: "Please enter a valid email." });
        return;
      }

      appendEmailRow(email);
      sendJson(res, 200, { ok: true });
      return;
    } catch (error) {
      sendJson(res, 500, { error: "Could not save email." });
      return;
    }
  }

  if (req.method === "GET") {
    serveFile(url.pathname, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Local server running at http://localhost:${PORT}`);
});
