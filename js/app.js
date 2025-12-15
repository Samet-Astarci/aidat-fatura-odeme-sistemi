import { Router } from "./router.js";
import { loadDatabase, normalizeDB } from "./api.js";
import { loadState, clearSession, toggleFlag, setFlag } from "./store.js";
import { setNav, showToast, setBusy, errorState } from "./ui.js";

import { renderLogin } from "./pages/login.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderDebtList } from "./pages/debtList.js";
import { renderDebtDetail } from "./pages/debtDetail.js";
import { renderAnnouncements } from "./pages/announcements.js";
import { renderReport } from "./pages/report.js";
import { renderNotFound } from "./pages/notFound.js";

const state = loadState();
const app = document.getElementById("app");

let db = null;

function requireAuth() {
  if (!state.session) {
    location.hash = "#/login";
    return false;
  }
  return true;
}

function buildNav(ctx) {
  const session = state.session;
  if (!session) {
    setNav([]);
    return;
  }
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: "🏠", title: "Ana ekran", active: ctx.path === "/dashboard" },
    { href: "/dues", label: "Aidatlar", icon: "📋", title: "Aidat listesi", active: ctx.path.startsWith("/dues") },
    { href: "/bills", label: "Faturalar", icon: "🧾", title: "Fatura listesi", active: ctx.path.startsWith("/bills") },
    { href: "/announcements", label: "Duyurular", icon: "📢", title: "Duyurular", active: ctx.path.startsWith("/announcements") },
  ];
  if (session.role === "admin") {
    items.push({ href: "/report", label: "Rapor", icon: "📊", title: "Basit rapor", active: ctx.path.startsWith("/report") });
  }
  setNav(items);
}

async function bootstrap() {
  setBusy(true);
  try {
    const raw = await loadDatabase({ forceError: state.flags.forceLoadError });
    db = normalizeDB(raw);
  } catch (e) {
    db = normalizeDB({ users: [], dues: [], bills: [], announcements: [], __meta: { usedFallback: true, error: String(e) } });
  } finally {
    setBusy(false);
  }
}

function renderRoute(ctx) {
  buildNav(ctx);

  // Header butonları
  const logoutBtn = document.getElementById("logoutBtn");
  const devBtn = document.getElementById("toggleDevBtn");
  const brandBtn = document.getElementById("brandBtn");

  logoutBtn.style.display = state.session ? "inline-flex" : "none";

  logoutBtn.onclick = () => {
    clearSession(state);
    showToast({ title: "Çıkış", msg: "Oturum kapatıldı.", icon: "🚪" });
    location.hash = "#/login";
  };

  brandBtn.onclick = () => {
    if (!state.session) location.hash = "#/login";
    else location.hash = "#/dashboard";
  };

  devBtn.onclick = () => openTestPanel();

  // Routes
  if (ctx.path === "/login") {
    renderLogin({ app, state, db });
    return;
  }

  if (!requireAuth()) return;

  if (ctx.path === "/dashboard") {
    renderDashboard({ app, state, db });
    return;
  }

  if (ctx.path === "/dues") {
    renderDebtList({ kind: "due", app, state, db });
    return;
  }

  if (ctx.path.startsWith("/dues/")) {
    const id = decodeURIComponent(ctx.parts[1] || "");
    renderDebtDetail({ kind: "due", app, state, db, id });
    return;
  }

  if (ctx.path === "/bills") {
    renderDebtList({ kind: "bill", app, state, db });
    return;
  }

  if (ctx.path.startsWith("/bills/")) {
    const id = decodeURIComponent(ctx.parts[1] || "");
    renderDebtDetail({ kind: "bill", app, state, db, id });
    return;
  }

  if (ctx.path === "/announcements") {
    renderAnnouncements({ app, db, state });
    return;
  }

  if (ctx.path === "/report") {
    if (state.session.role !== "admin") {
      app.innerHTML = errorState({
        title: "Erişim yok",
        desc: "Bu sayfa sadece yönetici içindir.",
        actionHtml: `<a class="btn btn-primary" href="#/dashboard">🏠 Dashboard</a>`
      });
      return;
    }
    renderReport({ app, db, state });
    return;
  }

  renderNotFound({ app });
}

function openTestPanel() {
  // küçük test paneli (boş/hata/ödeme fail)
  const panel = document.createElement("div");
  panel.className = "modal-backdrop";
  panel.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">🧪 Test Modu</div>
        <button class="btn btn-ghost" id="tpClose">✖️</button>
      </div>
      <div class="modal-body">
        <div class="small muted">Bu ayarlar sadece demo/test içindir.</div>
        <div class="hr"></div>

        <div class="row">
          <button class="btn ${state.flags.forceEmptyLists ? "btn-primary" : ""}" id="tpEmpty">🫥 Boş listeler</button>
          <button class="btn ${state.flags.forcePaymentFail ? "btn-primary" : ""}" id="tpPayFail">⛔ Ödeme başarısız</button>
          <button class="btn ${state.flags.forceLoadError ? "btn-primary" : ""}" id="tpLoadErr">⚠️ Veri yükleme hatası</button>
        </div>

        <div class="hr"></div>
        <div class="small">
          <b>Boş listeler</b>: Aidat/Fatura/Duyuru boş görünür.<br/>
          <b>Ödeme başarısız</b>: “Öde” butonu hata verir.<br/>
          <b>Veri yükleme hatası</b>: GitHub JSON yüklenemez → local sample fallback (yeniden yükleme gerekir).
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="tpReset">♻️ Hepsini kapat</button>
        <button class="btn btn-primary" id="tpOk">✅ Uygula</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const close = () => panel.remove();
  panel.querySelector("#tpClose")?.addEventListener("click", close);
  panel.addEventListener("click", (e) => { if (e.target === panel) close(); });

  panel.querySelector("#tpEmpty")?.addEventListener("click", () => {
    toggleFlag(state, "forceEmptyLists");
    panel.querySelector("#tpEmpty").classList.toggle("btn-primary", state.flags.forceEmptyLists);
  });
  panel.querySelector("#tpPayFail")?.addEventListener("click", () => {
    toggleFlag(state, "forcePaymentFail");
    panel.querySelector("#tpPayFail").classList.toggle("btn-primary", state.flags.forcePaymentFail);
  });
  panel.querySelector("#tpLoadErr")?.addEventListener("click", () => {
    toggleFlag(state, "forceLoadError");
    panel.querySelector("#tpLoadErr").classList.toggle("btn-primary", state.flags.forceLoadError);
  });

  panel.querySelector("#tpReset")?.addEventListener("click", async () => {
    setFlag(state, "forceEmptyLists", false);
    setFlag(state, "forcePaymentFail", false);
    setFlag(state, "forceLoadError", false);
    showToast({ title:"Sıfırlandı", msg:"Test ayarları kapatıldı.", icon:"♻️" });
    close();
    await bootstrap();
    router.resolve();
  });

  panel.querySelector("#tpOk")?.addEventListener("click", async () => {
    close();
    if (state.flags.forceLoadError) {
      showToast({ title:"Bilgi", msg:"Veri yükleme hatası açıldı. Yeniden yükleme yapılacak.", icon:"⚠️" });
      await bootstrap();
      router.resolve();
    } else {
      router.resolve();
    }
  });
}

await bootstrap();

const router = new Router({
  onRoute: (ctx) => renderRoute(ctx),
  notFound: () => renderNotFound({ app })
});

router.resolve();
