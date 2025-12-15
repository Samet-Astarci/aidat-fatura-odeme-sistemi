# Kısa Demo Açıklaması (1 sayfa) 📝

**Proje:** Site/Apartman Aidat & Fatura Ödeme Sistemi (Prototip)  
**Teknoloji:** HTML + CSS + Vanilla JavaScript (framework yok)  
**Veri Kaynağı:** GitHub’da bulunan `database.json` (salt okunur)  
**Not:** Ödeme işlemleri **gerçek ödeme değildir**. Prototip, “ödendi” bilgisini cihaz üzerinde `localStorage` içine kaydeder.

---

## 1) Ekranlar ve Geçişler 🧭
1. **Giriş (Login)** → kullanıcı adı/şifre ile oturum açılır.  
2. **Dashboard** → özet (aidat/fatura sayıları, kalan tutar) ve menü.  
3. **Aidatlar Listesi** → listeleme (satırdan detaya geçiş).  
4. **Aidat Detay** → tutar/son tarih/durum + “Öde (Simülasyon)”.  
5. **Faturalar Listesi** → listeleme (satırdan detaya geçiş).  
6. **Fatura Detay** → tutar/son tarih/durum + “Öde (Simülasyon)”.  
7. **Duyurular** → duyuru kartları.  
8. (Yönetici) **Rapor** → cihazdaki son ödeme kayıtlarını listeler.

---

## 2) Aktif Fonksiyonlar ✅
- **Giriş:** Doğru kullanıcı bilgisiyle giriş, yanlış bilgiyle hata mesajı.  
- **Listeleme:** Aidat/Fatura kayıtlarını tablo halinde gösterme.  
- **Detay:** Seçilen kaydın detaylarını gösterme.  
- **Ödeme Simülasyonu:** Detay ekranında ödeme onayı sonrası “ödendi” durumuna geçirme (localStorage).

---

## 3) Boş / Hata Durumları 🧯
Header’daki **“🧪 Test Modu”** ile senaryolar tetiklenir:

- **🫥 Boş listeler:** Aidat/Fatura/Duyuru listesi boş görünür ve “boş durum ekranı” gösterilir.  
- **⛔ Ödeme başarısız:** “Ödemeyi Onayla” butonuna basınca hata toast mesajı gösterilir.  
- **⚠️ Veri yükleme hatası:** GitHub JSON yüklenemiyormuş gibi davranır ve local sample veriye düşer.

---

## 4) Demo Akışı (30-60 sn) 🎬
1. Login: `admin / 1234` ile giriş  
2. Dashboard → Aidatlar  
3. Listeden bir kayıt seç → Detay  
4. “Öde (Simülasyon)” → Onayla → başarı mesajı  
5. Listeye dön → durum “Ödendi” görünsün  
6. Test Modu’ndan “Boş listeler” aç → boş durum ekranını göster

---
