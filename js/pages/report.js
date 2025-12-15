import { html, formatMoney, emptyState } from "../ui.js";
import { isPaid } from "../store.js";

export function renderReport({ app, db, state }) {
  const dues = db.dues || [];
  const bills = db.bills || [];
  const payments = state.payments || {};

  const paidCount = Object.keys(payments).length;
  const allCount = dues.length + bills.length;

  const sumPaid = () => {
    let total = 0;
    const all = [...dues, ...bills];
    for (const d of all) {
      if (isPaid(state, d.id) || String(d.status).toLowerCase().includes("paid")) total += Number(d.amount || 0);
    }
    return total;
  };

  const lastPaid = Object.entries(payments)
    .map(([id, info]) => ({ id, ...info }))
    .sort((a,b) => String(b.paidAt).localeCompare(String(a.paidAt)))
    .slice(0, 8);

  app.innerHTML = html`
    <div class="grid">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <div class="card-title">📊 Basit Rapor (Yönetici)</div>
            <div class="row" style="justify-content:flex-end">
              <a class="btn btn-ghost" href="#/dashboard">🏠 Dashboard</a>
            </div>
          </div>
          <div class="card-body">
            <div class="row">
              <span class="pill">Toplam kayıt: <b>${allCount}</b></span>
              <span class="pill good">Cihazda ödenen: <b>${paidCount}</b></span>
              <span class="pill">Ödenen toplam: <b>${formatMoney(sumPaid())}</b></span>
            </div>
            <p class="p">Not: Bu rapor, sunucudan değil cihazındaki <code>localStorage</code> verilerinden üretilir.</p>

            <div class="hr"></div>

            ${lastPaid.length ? `
              <div class="h2">🕒 Son Ödemeler (Demo)</div>
              <table class="table" style="margin-top:10px">
                <thead><tr><th>ID</th><th>Tarih</th><th>Yöntem</th><th>Not</th></tr></thead>
                <tbody>
                  ${lastPaid.map(p => `
                    <tr>
                      <td><code>${p.id}</code></td>
                      <td>${p.paidAt ? new Date(p.paidAt).toLocaleString("tr-TR") : "-"}</td>
                      <td>${p.method || "-"}</td>
                      <td>${p.note || "-"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            ` : emptyState({ title:"Henüz ödeme yok", desc:"Detay ekranından “Öde (Simülasyon)” yapınca burada listelenir." })}
          </div>
        </div>
      </div>
    </div>
  `;
}
