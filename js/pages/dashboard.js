import { html, formatMoney } from "../ui.js";
import { isPaid } from "../store.js";

export function renderDashboard({ app, state, db }) {
  const session = state.session;
  const roleLabel = session.role === "admin" ? "Yönetici" : "Sakin";
  const allDues = db.dues || [];
  const allBills = db.bills || [];

  // Sakin ise kendi borçlarını filtrelemeye çalış (ownerId eşleşiyorsa)
  const dues = session.role === "resident" ? allDues.filter(x => x.ownerId == null || x.ownerId == session.userId) : allDues;
  const bills = session.role === "resident" ? allBills.filter(x => x.ownerId == null || x.ownerId == session.userId) : allBills;

  const unpaidDues = dues.filter(d => !isPaid(state, d.id) && !String(d.status).toLowerCase().includes("paid"));
  const unpaidBills = bills.filter(d => !isPaid(state, d.id) && !String(d.status).toLowerCase().includes("paid"));

  const sum = (arr) => arr.reduce((a, b) => a + Number(b.amount || 0), 0);

  app.innerHTML = html`
    <div class="grid">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <div class="h1">Merhaba, ${session.displayName} 👋</div>
            <div class="row">
              <span class="pill">🧑‍💼 Rol: <b>${roleLabel}</b></span>
              <span class="pill">🗓️ Bugün: <b>${new Date().toLocaleDateString("tr-TR")}</b></span>
              ${db.__meta?.usedFallback ? `<span class="pill warn">🧩 Local sample ile çalışıyor</span>` : `<span class="pill good">🌐 GitHub JSON</span>`}
            </div>
            <p class="p">Aşağıdan aidat/fatura listesine gidip detaya girerek “ödeme simülasyonu” yapabilirsin 💳🙂</p>
          </div>
        </div>
      </div>

      <div class="col-4">
        <div class="card">
          <div class="card-header"><div class="card-title">📋 Aidatlar</div></div>
          <div class="card-body">
            <div class="kv"><div class="k">Toplam kayıt</div><div class="v">${dues.length}</div></div>
            <div class="kv"><div class="k">Ödenmemiş</div><div class="v">${unpaidDues.length}</div></div>
            <div class="kv"><div class="k">Kalan tutar</div><div class="v">${formatMoney(sum(unpaidDues))}</div></div>
          </div>
          <div class="card-footer">
            <a class="btn btn-primary" href="#/dues">➡️ Aidatlara Git</a>
          </div>
        </div>
      </div>

      <div class="col-4">
        <div class="card">
          <div class="card-header"><div class="card-title">🧾 Faturalar</div></div>
          <div class="card-body">
            <div class="kv"><div class="k">Toplam kayıt</div><div class="v">${bills.length}</div></div>
            <div class="kv"><div class="k">Ödenmemiş</div><div class="v">${unpaidBills.length}</div></div>
            <div class="kv"><div class="k">Kalan tutar</div><div class="v">${formatMoney(sum(unpaidBills))}</div></div>
          </div>
          <div class="card-footer">
            <a class="btn btn-primary" href="#/bills">➡️ Faturalara Git</a>
          </div>
        </div>
      </div>

      <div class="col-4">
        <div class="card">
          <div class="card-header"><div class="card-title">📢 Duyurular</div></div>
          <div class="card-body">
            <div class="kv"><div class="k">Toplam duyuru</div><div class="v">${(db.announcements || []).length}</div></div>
            <div class="kv"><div class="k">Okunacaklar</div><div class="v">${Math.min(3, (db.announcements || []).length)}</div></div>
            <div class="kv"><div class="k">Durum</div><div class="v">Demo</div></div>
          </div>
          <div class="card-footer">
            <a class="btn" href="#/announcements">➡️ Duyurular</a>
          </div>
        </div>
      </div>

      ${session.role === "admin" ? `
      <div class="col-12">
        <div class="card">
          <div class="card-header"><div class="card-title">🧑‍💼 Yönetici Notu</div></div>
          <div class="card-body">
            <p class="p">Bu prototipte yazma yok. Yönetici ekranları sadece listeleme/rapor görünümü sağlar. Ödeme simülasyonları cihazda tutulur 💾</p>
            <a class="btn" href="#/report">📊 Basit Rapor</a>
          </div>
        </div>
      </div>
      ` : ""}

    </div>
  `;
}
