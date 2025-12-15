// GitHub raw URL (senin repo)
export const DB_URL = "https://raw.githubusercontent.com/Samet-Astarci/aidat-fatura-odeme-sistemi/main/database.json";

// local fallback (repo içindeki örnek)
export const LOCAL_FALLBACK_URL = "./database.sample.json";

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function loadDatabase({ forceError = false } = {}) {
  if (forceError) throw new Error("Zorla hata modu aktif.");
  try {
    return await fetchJson(DB_URL);
  } catch (e) {
    // fallback: local sample
    const sample = await fetchJson(LOCAL_FALLBACK_URL);
    sample.__meta = { usedFallback: true, error: String(e) };
    return sample;
  }
}

/**
 * Esnek normalize: JSON yapısı değişse bile sayfalar çalışsın diye.
 * Çıktı:
 *  {
 *    users: [{id, username, password, role, displayName}],
 *    dues:  [{id, title, amount, dueDate, period, unit, status, ownerId}],
 *    bills: [{...}],
 *    announcements: [{id, title, body, date}]
 *  }
 */
export function normalizeDB(raw) {
  const obj = raw || {};

  const pickArray = (...keys) => {
    for (const k of keys) {
      if (Array.isArray(obj?.[k])) return obj[k];
    }
    return null;
  };

  const usersRaw = pickArray("users", "kullanicilar", "kullanıcılar", "members", "residents") || [];
  const duesRaw  = pickArray("dues", "aidatlar", "aidat", "aidatList", "borclar", "borçlar") || [];
  const billsRaw = pickArray("bills", "faturalar", "fatura", "invoices") || [];
  const annRaw   = pickArray("announcements", "duyurular", "duyuru", "notices") || [];

  const normUsers = usersRaw.map((u, i) => ({
    id: u.id ?? u.userId ?? i + 1,
    username: u.username ?? u.kullaniciAdi ?? u.kullanıcıAdı ?? u.email ?? u.mail ?? `user${i+1}`,
    password: u.password ?? u.sifre ?? u.şifre ?? "1234",
    role: u.role ?? u.rol ?? (u.isAdmin ? "admin" : "resident"),
    displayName: u.displayName ?? u.adSoyad ?? u.ad ?? u.name ?? (u.role === "admin" ? "Yönetici" : "Sakin")
  }));

  // Eğer JSON'da kullanıcı yoksa, en az 2 demo kullanıcı üret.
  if (!normUsers.length) {
    normUsers.push(
      { id: 1, username: "admin", password: "1234", role: "admin", displayName: "Yönetici (Demo)" },
      { id: 2, username: "sakin", password: "1234", role: "resident", displayName: "Sakin (Demo)" },
    );
  }

  const normDebt = (d, i, kind) => {
    const id = d.id ?? d.debtId ?? d.no ?? (kind + "_" + (i + 1));
    const title = d.title ?? d.aciklama ?? d.açıklama ?? d.name ?? (kind === "due" ? "Aidat" : "Fatura");
    const amount = Number(d.amount ?? d.tutar ?? d.ucret ?? d.ücret ?? d.price ?? 0);
    const dueDate = d.dueDate ?? d.sonTarih ?? d.son_tarih ?? d.deadline ?? d.tarih ?? d.date ?? "";
    const period = d.period ?? d.donem ?? d.dönem ?? d.month ?? "";
    const unit = d.unit ?? d.currency ?? "TRY";
    const status = d.status ?? d.durum ?? (d.paid ? "paid" : "unpaid");
    const ownerId = d.ownerId ?? d.userId ?? d.sakinId ?? d.daіreId ?? d.daireId ?? d.apartmentId ?? null;

    return { id, title, amount, dueDate, period, unit, status, ownerId, raw: d };
  };

  const normDues = duesRaw.map((d, i) => normDebt(d, i, "due"));
  const normBills = billsRaw.map((d, i) => normDebt(d, i, "bill"));

  const normAnn = annRaw.map((a, i) => ({
    id: a.id ?? i + 1,
    title: a.title ?? a.baslik ?? a.başlık ?? "Duyuru",
    body: a.body ?? a.icerik ?? a.içerik ?? a.text ?? "",
    date: a.date ?? a.tarih ?? ""
  }));

  return { users: normUsers, dues: normDues, bills: normBills, announcements: normAnn, __meta: obj.__meta };
}
