# Aidat / Fatura Ödeme Sistemi — Basit HTML/CSS/JS Prototip 🧩

Bu repo, dersin **Prototip Geliştirme** kısmı için hazırlanmış **vanilla (frameworksüz)** bir prototiptir.

✅ Özellikler
- Ekran tasarımları + sayfa geçişleri (hash router)
- En az 3 aktif fonksiyon:
  - 🔐 Giriş
  - 📋 Aidat/Fatura listeleme
  - 🔎 Detay + 💳 ödeme simülasyonu
- Boş/Hata durumları:
  - 🫥 Boş listeler (Test Modu)
  - ⛔ Ödeme başarısız simülasyonu (Test Modu)
  - ⚠️ Veri yükleme hatası / local fallback (Test Modu)

---

## Çalıştırma 🚀

> **Önemli:** `fetch()` kullandığı için **dosyaya çift tıklayıp** açmak yerine bir **local server** ile açman önerilir.

### 1) VS Code Live Server (en kolay)
- `index.html` → **Open with Live Server**

### 2) Python HTTP server
```bash
python -m http.server 5500
# sonra tarayıcıda:
# http://localhost:5500
```

---

## Veri Kaynağı 🌐

Uygulama önce şu adresten okur (read-only):

- `https://raw.githubusercontent.com/Samet-Astarci/aidat-fatura-odeme-sistemi/main/database.json`

Eğer erişemezse otomatik **local fallback** kullanır:
- `./database.sample.json`

> Not: Prototip “yazma” yapmaz. Ödemeler cihazda `localStorage` ile tutulur.

---

## Demo Kullanıcıları 👥
- `admin / 1234`
- `sakin / 1234`

Eğer JSON içinde kullanıcı yoksa bu demo kullanıcılar otomatik oluşturulur.

---

## GitHub Pages (opsiyonel) 🌍
Repo’yu GitHub Pages’e koyarsan, link üzerinden demo yapabilirsin.
