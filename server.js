/**
 * Dependency-free mini server (Node.js built-in modules)
 * - Serves static files from /public
 * - Reads/Writes JSON "database" from /data/db.json
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DB_PATH = path.join(ROOT, "data", "db.json");
const BACKUP_DIR = path.join(ROOT, "backups");

const TOKENS = new Map(); // token -> { userId, createdAt }

function readDB() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}
function nextId(db, entity) {
  if (!db.meta) db.meta = { nextIds: {} };
  if (!db.meta.nextIds) db.meta.nextIds = {};
  if (!db.meta.nextIds[entity]) db.meta.nextIds[entity] = 1;
  const id = db.meta.nextIds[entity];
  db.meta.nextIds[entity] += 1;
  return id;
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

function sendText(res, code, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(code, { "Content-Type": contentType });
  res.end(text);
}

function contentTypeFromExt(fp) {
  const ext = path.extname(fp).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };
  return map[ext] || "application/octet-stream";
}

function safeJoin(baseDir, reqPath) {
  // prevent path traversal
  const p = decodeURIComponent(reqPath.split("?")[0]);
  const joined = path.join(baseDir, p);
  const normalized = path.normalize(joined);
  if (!normalized.startsWith(baseDir)) return null;
  return normalized;
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 1e6) { // 1mb
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function getToken(req) {
  const auth = req.headers["authorization"] || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

function authRequired(req) {
  const token = getToken(req);
  if (!token || !TOKENS.has(token)) return { ok: false, code: 401, error: "Giriş gerekli." };

  const { userId } = TOKENS.get(token);
  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return { ok: false, code: 401, error: "Geçersiz oturum." };
  return { ok: true, user, db, token };
}

function adminOnly(user) {
  return user && user.role === "admin";
}

function maskCard(cardNumber) {
  const digits = String(cardNumber).replace(/\s+/g, "");
  const last4 = digits.slice(-4);
  return "**** **** **** " + last4;
}

function isValidCardNumber(cardNumber) {
  const digits = String(cardNumber).replace(/\s+/g, "");
  if (!/^\d{16}$/.test(digits)) return false;
  // Luhn check
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function autoBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const dst = path.join(BACKUP_DIR, `auto-db-${stamp}-${Date.now()}.json`);
    fs.copyFileSync(DB_PATH, dst);
    console.log("[backup] auto backup created:", path.basename(dst));
  } catch (e) {
    console.warn("[backup] failed:", e.message);
  }
}
// run every 24h while server is up
setInterval(autoBackup, 24 * 60 * 60 * 1000);

// ---------------- ROUTER ----------------
async function handleApi(req, res, url) {
  const pathname = url.pathname;

  // AUTH: login
  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = JSON.parse((await readBody(req)) || "{}");
    const { phone, password } = body || {};
    if (!phone || !password) return sendJson(res, 400, { error: "Telefon ve şifre zorunlu." });

    const db = readDB();
    const user = db.users.find(u => u.phone === phone && u.password === password);
    if (!user) return sendJson(res, 401, { error: "Telefon veya şifre hatalı." });

    const token = crypto.randomUUID();
    TOKENS.set(token, { userId: user.id, createdAt: Date.now() });
    return sendJson(res, 200, { token, user: { id: user.id, name: user.name, role: user.role, phone: user.phone } });
  }

  // From here: auth required
  const auth = authRequired(req);
  if (!auth.ok) return sendJson(res, auth.code, { error: auth.error });
  const { user } = auth;

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    TOKENS.delete(auth.token);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET" && pathname === "/api/auth/me") {
    return sendJson(res, 200, { user: { id: user.id, name: user.name, role: user.role, phone: user.phone } });
  }

  // USERS (admin)
  if (pathname === "/api/users") {
    if (!adminOnly(user)) return sendJson(res, 403, { error: "Bu işlem için yönetici yetkisi gerekli." });
    const db = readDB();

    if (req.method === "GET") {
      return sendJson(res, 200, { users: db.users.map(u => ({ id: u.id, name: u.name, phone: u.phone, role: u.role })) });
    }
    if (req.method === "POST") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const { name, phone, role, password } = body || {};
      if (!name || !phone || !role || !password) return sendJson(res, 400, { error: "name/phone/role/password zorunlu." });
      if (db.users.some(u => u.phone === phone)) return sendJson(res, 400, { error: "Bu telefon zaten kayıtlı." });

      const id = nextId(db, "users");
      const u = { id, name, phone, role, password };
      db.users.push(u);
      writeDB(db);
      return sendJson(res, 200, { user: { id, name, phone, role } });
    }
  }

  // USERS by id
  const userIdMatch = pathname.match(/^\/api\/users\/(\d+)$/);
  if (userIdMatch) {
    if (!adminOnly(user)) return sendJson(res, 403, { error: "Bu işlem için yönetici yetkisi gerekli." });
    const id = Number(userIdMatch[1]);
    const db = readDB();
    const target = db.users.find(u => u.id === id);
    if (!target) return sendJson(res, 404, { error: "Kullanıcı bulunamadı." });

    if (req.method === "PUT") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const { name, phone, role, password } = body || {};
      if (phone && db.users.some(u => u.phone === phone && u.id !== id)) {
        return sendJson(res, 400, { error: "Bu telefon başka kullanıcıda kayıtlı." });
      }
      if (name) target.name = name;
      if (phone) target.phone = phone;
      if (role) target.role = role;
      if (password) target.password = password;
      writeDB(db);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      // cleanup apartment assignment
      db.apartments.forEach(a => { if (a.userId === id) { a.userId = null; a.status = 0; } });
      db.users = db.users.filter(u => u.id !== id);
      writeDB(db);
      return sendJson(res, 200, { ok: true });
    }
  }

  // APARTMENTS
  if (pathname === "/api/apartments") {
    const db = readDB();

    if (req.method === "GET") {
      const apartments = db.apartments.map(a => {
        const u = a.userId ? db.users.find(x => x.id === a.userId) : null;
        return { ...a, userName: u ? u.name : null, userPhone: u ? u.phone : null };
      });
      return sendJson(res, 200, { apartments });
    }

    if (req.method === "POST") {
      if (!adminOnly(user)) return sendJson(res, 403, { error: "Bu işlem için yönetici yetkisi gerekli." });
      const body = JSON.parse((await readBody(req)) || "{}");
      const { number, userId, status } = body || {};
      if (!number) return sendJson(res, 400, { error: "Daire numarası zorunlu." });
      const n = Number(number);
      if (db.apartments.some(a => a.number === n)) return sendJson(res, 400, { error: "Bu daire numarası zaten var." });
      const id = nextId(db, "apartments");
      const apt = { id, number: n, userId: userId ?? null, status: status ?? (userId ? 1 : 0) };
      db.apartments.push(apt);
      writeDB(db);
      return sendJson(res, 200, { apartment: apt });
    }
  }

  const aptIdMatch = pathname.match(/^\/api\/apartments\/(\d+)$/);
  if (aptIdMatch) {
    if (!adminOnly(user)) return sendJson(res, 403, { error: "Bu işlem için yönetici yetkisi gerekli." });
    const id = Number(aptIdMatch[1]);
    const db = readDB();
    const apt = db.apartments.find(a => a.id === id);
    if (!apt) return sendJson(res, 404, { error: "Daire bulunamadı." });

    if (req.method === "PUT") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const { number, userId, status } = body || {};

      if (number !== undefined) {
        const n = Number(number);
        if (db.apartments.some(a => a.number === n && a.id !== id)) {
          return sendJson(res, 400, { error: "Bu daire numarası zaten var." });
        }
        apt.number = n;
      }
      if (userId !== undefined) apt.userId = (userId === null || userId === "" ? null : Number(userId));
      if (status !== undefined) apt.status = Number(status);
      if (apt.userId) apt.status = 1;
      writeDB(db);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      db.dues = db.dues.filter(d => d.apartmentId !== id);
      db.apartments = db.apartments.filter(a => a.id !== id);
      writeDB(db);
      return sendJson(res, 200, { ok: true });
    }
  }

  // DUES get
  if (req.method === "GET" && pathname === "/api/dues") {
    const db = readDB();
    const period = url.searchParams.get("period");
    let dues = db.dues;
    if (period) dues = dues.filter(d => d.period === period);

    if (user.role !== "admin") {
      const apt = db.apartments.find(a => a.userId === user.id);
      dues = apt ? dues.filter(d => d.apartmentId === apt.id) : [];
    }

    const mapped = dues.map(d => {
      const apt = db.apartments.find(a => a.id === d.apartmentId);
      return { ...d, apartmentNumber: apt ? apt.number : null };
    });
    return sendJson(res, 200, { dues: mapped });
  }

  // DUES apply
  if (req.method === "POST" && pathname === "/api/dues/apply") {
    if (!adminOnly(user)) return sendJson(res, 403, { error: "Bu işlem için yönetici yetkisi gerekli." });

    const body = JSON.parse((await readBody(req)) || "{}");
    const { period, amount, description } = body || {};
    if (!period || !amount) return sendJson(res, 400, { error: "period ve amount zorunlu." });
    if (!/^\d{4}-\d{2}$/.test(period)) return sendJson(res, 400, { error: "period formatı YYYY-MM olmalı." });

    const db = readDB();
    const a = Number(amount);
    if (!(a > 0)) return sendJson(res, 400, { error: "Tutar 0'dan büyük olmalı." });

    let created = 0;
    const activeApts = db.apartments.filter(x => x.status === 1 && x.userId);
    activeApts.forEach(apt => {
      const exists = db.dues.some(d => d.apartmentId === apt.id && d.period === period);
      if (!exists) {
        const id = nextId(db, "dues");
        db.dues.push({
          id,
          apartmentId: apt.id,
          period,
          amount: a,
          paid: 0,
          description: description || `${period} Aidatı`
        });
        created += 1;
      }
    });
    writeDB(db);
    return sendJson(res, 200, { ok: true, created });
  }

  // PAY
  if (req.method === "POST" && pathname === "/api/payments/pay") {
    const body = JSON.parse((await readBody(req)) || "{}");
    const { dueId, cardNumber, amount } = body || {};
    if (!dueId || !cardNumber || amount === undefined) {
      return sendJson(res, 400, { error: "dueId, cardNumber, amount zorunlu." });
    }

    const db = readDB();
    const due = db.dues.find(d => d.id === Number(dueId));
    if (!due) return sendJson(res, 404, { error: "Borç bulunamadı." });
    if (due.paid) return sendJson(res, 400, { error: "Bu borç zaten ödenmiş." });

    const apt = db.apartments.find(a => a.id === due.apartmentId);
    if (!apt) return sendJson(res, 400, { error: "Daire kaydı bulunamadı." });

    if (user.role !== "admin") {
      if (apt.userId !== user.id) return sendJson(res, 403, { error: "Sadece kendi borcunuzu ödeyebilirsiniz." });
    }

    const a = Number(amount);
    if (Math.abs(a - Number(due.amount)) > 0.0001) {
      return sendJson(res, 400, { error: "Ödeme tutarı borç tutarı ile aynı olmalı (tam ödeme)." });
    }
    if (!isValidCardNumber(cardNumber)) {
      return sendJson(res, 400, { error: "Banka doğrulaması başarısız: Kart numarası geçersiz." });
    }

    due.paid = 1;
    const paymentId = nextId(db, "payments");
    const now = new Date().toISOString();
    const p = {
      id: paymentId,
      dueId: due.id,
      userId: apt.userId || user.id,
      datetime: now,
      cardMasked: maskCard(cardNumber),
      amount: a
    };
    db.payments.push(p);
    writeDB(db);

    return sendJson(res, 200, {
      ok: true,
      receipt: {
        paymentId: p.id,
        period: due.period,
        apartmentNumber: apt.number,
        amount: p.amount,
        datetime: p.datetime,
        cardMasked: p.cardMasked
      }
    });
  }

  if (req.method === "GET" && pathname === "/api/payments") {
    const db = readDB();
    let payments = db.payments;
    if (user.role !== "admin") payments = payments.filter(p => p.userId === user.id);
    return sendJson(res, 200, { payments });
  }

  // EXPENSES
  if (req.method === "GET" && pathname === "/api/expenses") {
    const db = readDB();
    return sendJson(res, 200, { expenses: db.expenses });
  }
  if (req.method === "POST" && pathname === "/api/expenses") {
    if (!adminOnly(user)) return sendJson(res, 403, { error: "Bu işlem için yönetici yetkisi gerekli." });
    const db = readDB();
    const body = JSON.parse((await readBody(req)) || "{}");
    const { title, amount, date, description } = body || {};
    if (!title || amount === undefined || !date) return sendJson(res, 400, { error: "title/amount/date zorunlu." });
    const a = Number(amount);
    if (!(a > 0)) return sendJson(res, 400, { error: "Tutar 0'dan büyük olmalı." });
    const id = nextId(db, "expenses");
    db.expenses.push({ id, title, amount: a, date, description: description || "" });
    writeDB(db);
    return sendJson(res, 200, { ok: true });
  }

  // ANNOUNCEMENTS
  if (req.method === "GET" && pathname === "/api/announcements") {
    const db = readDB();
    const anns = db.announcements.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    return sendJson(res, 200, { announcements: anns });
  }
  if (req.method === "POST" && pathname === "/api/announcements") {
    if (!adminOnly(user)) return sendJson(res, 403, { error: "Bu işlem için yönetici yetkisi gerekli." });
    const db = readDB();
    const body = JSON.parse((await readBody(req)) || "{}");
    const { title, body: b, date } = body || {};
    if (!title || !b) return sendJson(res, 400, { error: "title ve body zorunlu." });
    const id = nextId(db, "announcements");
    db.announcements.push({ id, title, body: b, date: date || new Date().toISOString().slice(0,10) });
    writeDB(db);
    return sendJson(res, 200, { ok: true });
  }

  // REPORTS
  if (req.method === "GET" && pathname === "/api/reports/summary") {
    const db = readDB();
    const totalDues = db.dues.reduce((s,d)=>s+Number(d.amount||0),0);
    const totalPaid = db.dues.filter(d=>d.paid).reduce((s,d)=>s+Number(d.amount||0),0);
    const totalUnpaid = totalDues - totalPaid;
    const totalExpenses = db.expenses.reduce((s,e)=>s+Number(e.amount||0),0);
    const net = totalPaid - totalExpenses;
    return sendJson(res, 200, { totalDues, totalPaid, totalUnpaid, totalExpenses, net });
  }
  if (req.method === "GET" && pathname === "/api/reports/monthly") {
    const db = readDB();
    const map = new Map();
    db.dues.forEach(d=>{
      const k = d.period;
      if (!map.has(k)) map.set(k, { period:k, dues:0, paid:0 });
      const it = map.get(k);
      it.dues += Number(d.amount||0);
      if (d.paid) it.paid += Number(d.amount||0);
    });
    const list = Array.from(map.values()).sort((a,b)=>a.period.localeCompare(b.period));
    return sendJson(res, 200, { monthly: list });
  }

  // BACKUP
  if (req.method === "POST" && pathname === "/api/backup/run") {
    if (!adminOnly(user)) return sendJson(res, 403, { error: "Bu işlem için yönetici yetkisi gerekli." });
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().slice(0,10).replace(/-/g,"");
    const dst = path.join(BACKUP_DIR, `db-${stamp}-${Date.now()}.json`);
    fs.copyFileSync(DB_PATH, dst);
    return sendJson(res, 200, { ok: true, file: path.basename(dst) });
  }

  return sendJson(res, 404, { error: "API endpoint bulunamadı." });
}

function serveStatic(req, res, url) {
  // default route
  let reqPath = url.pathname;
  if (reqPath === "/") reqPath = "/index.html";

  const filePath = safeJoin(PUBLIC_DIR, reqPath);
  if (!filePath) return sendText(res, 400, "Bad request");

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      return sendText(res, 404, "Not found");
    }
    const ct = contentTypeFromExt(filePath);
    res.writeHead(200, { "Content-Type": ct });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    // only GET for static
    if (req.method !== "GET") {
      return sendText(res, 405, "Method Not Allowed");
    }
    serveStatic(req, res, url);
  } catch (e) {
    console.error("Server error:", e);
    sendJson(res, 500, { error: "Sunucu hatası." });
  }
});

server.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});