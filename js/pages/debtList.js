import { html, formatMoney, pillForStatus, emptyState } from "../ui.js";
import { isPaid } from "../store.js";

function filterBySession(items, session){
  if (session.role !== "resident") return items;
  // ownerId varsa filtrele, yoksa hepsini göster (veri yoksa demo için)
  return items.filter(x => x.ownerId == null || x.ownerId == session.userId);
}

export function renderDebtList({ kind, app, state, db }) {
  const session = state.session;
  const title = kind === "due" ? "Aidatlar" : "Faturalar";
  const itemsRaw = kind === "due" ? (db.dues || []) : (db.bills || []);
  const items = filterBySession(itemsRaw, session);

  // test modu: boş listeler
  const list = state.flags.forceEmptyLists ? [] : items;

  const rows = list.map((d) => {
    const paid = isPaid(state, d.id) || String(d.status).toLowerCase().includes("paid");
    const href = kind === "due" ? `#/dues/${encodeURIComponent(d.id)}` : `#/bills/${encodeURIComponent(d.id)}`;
    return `
      <tr>
        <td><a href="${href}">${d.title ?? "-"}</a></td>
        <td>${d.period || "-"}</td>
        <td>${d.dueDate ? new Date(d.dueDate).toLocaleDateString("tr-TR") : "-"}</td>
        <td><b>${formatMoney(d.amount, d.unit)}</b></td>
        <td>${pillForStatus({ paid, dueDate: d.dueDate })}</td>
      </tr>
    `;
  }).join("");

  app.innerHTML = html`
    <div class="grid">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <div class="card-title">📋 ${title}</div>
            <div class="row" style="justify-content:flex-end">
              <span class="pill">Kayıt: <b>${list.length}</b></span>
              <a class="btn btn-ghost" href="#/dashboard">🏠 Dashboard</a>
            </div>
          </div>

          <div class="card-body">
            ${list.length ? `
              <table class="table">
                <thead>
                  <tr>
                    <th>Başlık</th>
                    <th>Dönem</th>
                    <th>Son tarih</th>
                    <th>Tutar</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
              <div class="small" style="margin-top:10px">
                🧪 Boş liste test etmek için: <b>Test Modu</b> → “Boş listeler”i aç.
              </div>
            ` : emptyState({
              title: `${title} bulunamadı`,
              desc: "Liste boş görünüyor. Bu bir test senaryosu olabilir veya JSON’da veri yoktur.",
              actionHtml: `<button class="btn btn-primary" id="goBackBtn">⬅️ Geri</button>`
            })}
          </div>
        </div>
      </div>
    </div>
  `;

  const back = document.getElementById("goBackBtn");
  back?.addEventListener("click", () => history.back());
}
