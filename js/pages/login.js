import { html, showToast, setBusy, errorState } from "../ui.js";
import { setSession } from "../store.js";

export function renderLogin({ app, state, db }) {
  const usedFallback = !!db?.__meta?.usedFallback;
  const hint = usedFallback ? `
    <div class="pill warn">🧩 GitHub verisine ulaşılamadı → local sample kullanılıyor</div>
    <div class="small">Detay: ${db?.__meta?.error || ""}</div>
  ` : `<div class="pill good">🌐 GitHub JSON yüklendi</div>`;

  app.innerHTML = html`
  <div class="grid">
    <div class="col-6">
      <div class="card">
        <div class="card-header">
          <div class="card-title">🔐 Giriş</div>
          <span class="badge">v1</span>
        </div>
        <div class="card-body">
          <div class="row" style="align-items:flex-start">
            <div style="flex:1">
              <div class="h2">Hoş geldin 👋</div>
              <p class="p">Bu prototip read-only bir <code>database.json</code> okur. Ödeme işlemleri cihazında simüle edilir 💾</p>
            </div>
          </div>

          <div class="hr"></div>

          <form class="form" id="loginForm">
            <div class="field">
              <label>Kullanıcı adı</label>
              <input name="username" placeholder="ör. admin / sakin" autocomplete="username" required />
              <div class="small muted">Demo: <code>admin/1234</code> • <code>sakin/1234</code></div>
            </div>
            <div class="field">
              <label>Şifre</label>
              <input name="password" type="password" placeholder="1234" autocomplete="current-password" required />
            </div>
            <div class="row">
              <button class="btn btn-primary" type="submit">➡️ Giriş Yap</button>
              <button class="btn" type="button" id="fillDemoBtn">✨ Demo Doldur</button>
            </div>
          </form>

          <div class="hr"></div>
          ${hint}
        </div>
        <div class="card-footer small">
          <div>🧪 Test Modu: Header’daki “Test Modu” ile boş/hata/ödeme başarısız senaryolarını açıp kapatabilirsin.</div>
        </div>
      </div>
    </div>

    <div class="col-6">
      <div class="card">
        <div class="card-header">
          <div class="card-title">👥 Kullanıcılar (JSON’dan)</div>
        </div>
        <div class="card-body">
          ${db?.users?.length ? `
            <table class="table">
              <thead>
                <tr>
                  <th>Ad</th><th>Kullanıcı</th><th>Rol</th>
                </tr>
              </thead>
              <tbody>
                ${db.users.slice(0, 8).map(u => `
                  <tr>
                    <td>${u.displayName || "-"}</td>
                    <td><code>${u.username}</code></td>
                    <td>${u.role === "admin" ? "Yönetici" : "Sakin"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          ` : errorState({ title:"Kullanıcı listesi yok", desc:"JSON içinde kullanıcılar bulunamadı. Demo kullanıcıları kullanılacak." })}
        </div>
      </div>
    </div>
  </div>
  `;

  const form = document.getElementById("loginForm");
  const fill = document.getElementById("fillDemoBtn");

  fill?.addEventListener("click", () => {
    form.username.value = "admin";
    form.password.value = "1234";
    showToast({ title: "Demo", msg: "Alanlar demo bilgisiyle dolduruldu.", icon:"✨" });
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = form.username.value.trim();
    const password = form.password.value;

    setBusy(true);
    try {
      const user = (db.users || []).find(u => String(u.username).toLowerCase() === username.toLowerCase());
      if (!user || String(user.password) !== String(password)) {
        showToast({ title:"Giriş başarısız", msg:"Kullanıcı adı veya şifre hatalı.", icon:"⛔" });
        return;
      }
      const role = (user.role || "resident").toLowerCase().includes("admin") ? "admin" : "resident";
      setSession(state, { userId: user.id, username: user.username, role, displayName: user.displayName || user.username });
      showToast({ title:"Giriş başarılı", msg:`Hoş geldin ${user.displayName || user.username} 🎉`, icon:"✅" });
      location.hash = "#/dashboard";
    } finally {
      setBusy(false);
    }
  });
}
