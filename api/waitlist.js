function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readBody(req) {
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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const raw = await readBody(req);
    const body = JSON.parse(raw || "{}");
    const email = String(body.email || "").trim().toLowerCase();

    if (!isEmail(email)) {
      sendJson(res, 400, { error: "Please enter a valid email." });
      return;
    }

    // Vercel functions cannot persist writes to repository files.
    // Use logs as a deployment-safe placeholder until a database or email service is connected.
    console.log(JSON.stringify({ event: "waitlist_signup", email, submitted_at: new Date().toISOString() }));
    sendJson(res, 200, { ok: true });
  } catch (_error) {
    sendJson(res, 500, { error: "Could not save email." });
  }
};
