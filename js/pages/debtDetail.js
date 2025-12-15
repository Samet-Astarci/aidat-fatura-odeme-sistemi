import { html, formatMoney, pillForStatus, openModal, showToast, errorState } from "../ui.js";
import { isPaid, markPaid } from "../store.js";

function getItemById(list, id) {
  return list.find(x => String(x.id) === String(id));
}

export function renderDebtDetail({ kind, app, state, db, id }) {
  const list = kind === "due" ? (db.dues || []) : (db.bills || []);
  const item = getItemById(list, id);

  if (!item) {
    app.innerHTML = errorState({
      title: "Kayıt bulunamadı",
      desc: `Bu ID ile ${kind === "due" ? "aidat" : "fatura"} bulunamadı: ${id}`,
      actionHtml: `<a class="btn btn-primary" href="#/${kind === "due" ? "dues" : "bills"}">⬅️ Listeye dön</a>`
    });
    return;
  }

  const paid = isPaid(state, item.id) || String(item.status).toLowerCase().includes("paid");
  const title = kind === "due" ? "Aidat Detayı" : "Fatura Detayı";

  app.innerHTML = html`
    <div class="grid">
      <div class="col-8">
        <div class="card">
          <div class="card-header">
            <div class="card-title">🔎 ${title}</div>
            <div class="row" style="justify-content:flex-end">
              <a class="btn btn-ghost" href="#/${kind === "due" ? "dues" : "bills"}">⬅️ Liste</a>
              <a class="btn btn-ghost" href="#/dashboard">🏠 Dashboard</a>
            </div>
          </div>

          <div class="card-body">
            <div class="h2">${item.title ?? "-"}</div>
            <p class="p">Detay ekranı + ödeme simülasyonu burada gösterilir 💳🙂</p>
            <div class="hr"></div>

            <div class="kv"><div class="k">Dönem</div><div class="v">${item.period || "-"}</div></div>
            <div class="kv"><div class="k">Son tarih</div><div class="v">${item.dueDate ? new Date(item.dueDate).toLocaleDateString("tr-TR") : "-"}</div></div>
            <div class="kv"><div class="k">Tutar</div><div class="v">${formatMoney(item.amount, item.unit)}</div></div>
            <div class="kv"><div class="k">Durum</div><div class="v">${pillForStatus({ paid, dueDate: item.dueDate })}</div></div>

            <div class="hr"></div>

            ${paid ? `
              <div class="pill good">✅ Bu kayıt için cihazında “ödenmiş” işareti var</div>
              <div class="small" style="margin-top:6px">Not: Prototipte yazma yok; ödeme sadece localStorage’da tutulur.</div>
            ` : `
              <button class="btn btn-good" id="payBtn">💳 Öde (Simülasyon)</button>
              <div class="small" style="margin-top:6px">🧪 “Test Modu”nda ödeme başarısız simülasyonu açılabilir.</div>
            `}
          </div>
        </div>
      </div>

      <div class="col-4">
        <div class="card">
          <div class="card-header"><div class="card-title">🧾 Ham Veri</div></div>
          <div class="card-body">
            <div class="small muted">JSON’dan gelen kaydı (debug):</div>
            <pre class="card" style="padding:12px; overflow:auto; border-radius:14px; background: rgba(0,0,0,.18); border:1px solid rgba(255,255,255,.10)"><code>${escapeJson(item.raw || item)}</code></pre>
          </div>
        </div>
      </div>
    </div>
  `;

  const payBtn = document.getElementById("payBtn");
  payBtn?.addEventListener("click", () => openPayModal({ state, item, kind }));
}

function escapeJson(obj) {
  try { return JSON.stringify(obj, null, 2).replaceAll("<","\u003c"); }
  catch { return String(obj); }
}

function openPayModal({ state, item, kind }) {
  const bodyHtml = `
    <div class="small muted">Bu bir demo ödeme ekranıdır. Gerçek ödeme yoktur 🙂</div>
    <div class="hr"></div>

    <div class="field">
      <label>Kart üzerindeki isim</label>
      <input id="cardName" placeholder="Ad Soyad" />
    </div>
    <div class="row">
      <div class="field">
        <label>Kart no</label>
        <input id="cardNo" placeholder="4111 1111 1111 1111" inputmode="numeric" />
      </div>
      <div class="field">
        <label>CVV</label>
        <input id="cvv" placeholder="123" inputmode="numeric" />
      </div>
    </div>
    <div class="row">
      <div class="field">
        <label>Tutar</label>
        <input value="${formatMoney(item.amount, item.unit)}" disabled />
      </div>
      <div class="field">
        <label>Yöntem</label>
        <select id="method">
          <option value="kredi_karti">Kredi Kartı</option>
          <option value="havale">Havale/EFT</option>
        </select>
      </div>
    </div>
    <div class="small">🧪 Test Modu → “Ödeme başarısız” açık ise işlem hata verir.</div>
  `;

  const footerHtml = `
    <button class="btn btn-ghost" id="cancelPayBtn">Vazgeç</button>
    <button class="btn btn-good" id="confirmPayBtn">✅ Ödemeyi Onayla</button>
  `;

  const modal = openModal({ title: "Ödeme Simülasyonu", bodyHtml, footerHtml });

  document.getElementById("cancelPayBtn")?.addEventListener("click", () => modal.close());

  document.getElementById("confirmPayBtn")?.addEventListener("click", () => {
    const forceFail = !!state.flags.forcePaymentFail;
    if (forceFail) {
      showToast({ title: "Ödeme alınamadı", msg: "Test modunda ödeme başarısız simülasyonu açık.", icon: "⛔" });
      modal.close();
      return;
    }
    // basit validasyon
    const cardNo = (document.getElementById("cardNo")?.value || "").replaceAll(" ", "");
    if (cardNo && cardNo.length < 12) {
      showToast({ title: "Hatalı bilgi", msg: "Kart numarası eksik görünüyor.", icon: "⚠️" });
      return;
    }
    const method = document.getElementById("method")?.value || "kredi_karti";
    markPaid(state, item.id, { paidAt: new Date().toISOString(), method, note: `${kind}:${item.title}` });
    showToast({ title: "Başarılı", msg: "Ödeme (demo) tamamlandı. Listeye dönün 🙂", icon: "✅" });
    modal.close();
    // aynı sayfayı yeniden render etmek için küçük hack:
    setTimeout(() => location.hash = location.hash, 10);
  });
}
