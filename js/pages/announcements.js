import { html, emptyState } from "../ui.js";

export function renderAnnouncements({ app, db, state }) {
  const list = state.flags.forceEmptyLists ? [] : (db.announcements || []);
  app.innerHTML = html`
    <div class="grid">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <div class="card-title">📢 Duyurular</div>
            <div class="row" style="justify-content:flex-end">
              <a class="btn btn-ghost" href="#/dashboard">🏠 Dashboard</a>
            </div>
          </div>
          <div class="card-body">
            ${list.length ? list.map(a => `
              <div class="card" style="margin-bottom:12px">
                <div class="card-header">
                  <div class="card-title">${a.title}</div>
                  <span class="pill">${a.date ? new Date(a.date).toLocaleDateString("tr-TR") : "Tarih yok"}</span>
                </div>
                <div class="card-body">
                  <div class="p">${a.body || "(içerik yok)"}</div>
                </div>
              </div>
            `).join("") : emptyState({ title: "Duyuru yok", desc:"Bu bir test senaryosu olabilir veya JSON’da duyuru bulunmuyor.", actionHtml:`<a class="btn btn-primary" href="#/dashboard">🏠 Dashboard</a>` })}
          </div>
        </div>
      </div>
    </div>
  `;
}
