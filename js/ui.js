export function html(strings, ...values) {
  // küçük template helper
  return strings.reduce((acc, s, i) => acc + s + (values[i] ?? ""), "");
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatMoney(amount, unit = "TRY") {
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: unit }).format(Number(amount || 0));
  } catch {
    return `${amount} ${unit}`;
  }
}

export function pillForStatus({ paid, dueDate }) {
  if (paid) return `<span class="pill good">✅ Ödendi</span>`;
  // dueDate yaklaşımı (basit)
  if (dueDate) {
    const d = new Date(dueDate);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      const diffDays = Math.ceil((d - now) / (1000*60*60*24));
      if (diffDays < 0) return `<span class="pill bad">⛔ Gecikmiş</span>`;
      if (diffDays <= 7) return `<span class="pill warn">⏳ Yaklaşıyor</span>`;
    }
  }
  return `<span class="pill">🕒 Ödenmedi</span>`;
}

export function showToast({ title, msg, icon = "ℹ️" }) {
  const host = document.getElementById("toastHost");
  if (!host) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `
    <div class="icon">${icon}</div>
    <div>
      <div class="title">${escapeHtml(title)}</div>
      <div class="msg">${escapeHtml(msg)}</div>
    </div>
  `;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

export function setBusy(isBusy) {
  const app = document.getElementById("app");
  if (!app) return;
  app.setAttribute("aria-busy", String(!!isBusy));
}

export function setNav(items) {
  const nav = document.getElementById("nav");
  if (!nav) return;
  nav.innerHTML = items.map(i => `
    <a class="btn btn-ghost ${i.active ? "btn-primary" : ""}" href="#${i.href}" title="${escapeHtml(i.title)}">
      ${i.icon} <span class="hide-sm">${escapeHtml(i.label)}</span>
    </a>
  `).join("");
}

export function openModal({ title, bodyHtml, footerHtml }) {
  const bd = document.getElementById("modalBackdrop");
  const t = document.getElementById("modalTitle");
  const b = document.getElementById("modalBody");
  const f = document.getElementById("modalFooter");
  const closeBtn = document.getElementById("modalCloseBtn");
  bd.classList.remove("hidden");
  bd.setAttribute("aria-hidden", "false");
  t.textContent = title;
  b.innerHTML = bodyHtml;
  f.innerHTML = footerHtml || "";
  const close = () => {
    bd.classList.add("hidden");
    bd.setAttribute("aria-hidden", "true");
    closeBtn.removeEventListener("click", close);
    bd.removeEventListener("click", onBackdrop);
    document.removeEventListener("keydown", onEsc);
  };
  const onBackdrop = (e) => { if (e.target === bd) close(); };
  const onEsc = (e) => { if (e.key === "Escape") close(); };
  closeBtn.addEventListener("click", close);
  bd.addEventListener("click", onBackdrop);
  document.addEventListener("keydown", onEsc);
  return { close };
}

export function emptyState({ title, desc, actionHtml = "" }) {
  return `
    <div class="card">
      <div class="card-body">
        <div class="h2">🫥 ${escapeHtml(title)}</div>
        <p class="p">${escapeHtml(desc)}</p>
        ${actionHtml ? `<div class="hr"></div>${actionHtml}` : ""}
      </div>
    </div>
  `;
}

export function errorState({ title, desc, actionHtml = "" }) {
  return `
    <div class="card">
      <div class="card-body">
        <div class="h2">⚠️ ${escapeHtml(title)}</div>
        <p class="p">${escapeHtml(desc)}</p>
        ${actionHtml ? `<div class="hr"></div>${actionHtml}` : ""}
      </div>
    </div>
  `;
}
