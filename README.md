# Site Aidat Takip - Prototip (HTML/CSS/JS + JSON)

Bu prototip, rapordaki temel senaryoları çalıştırır:
- Login (Yönetici / Sakin)
- Yönetici: Daire & kullanıcı ekleme/atama, toplu aidat tanımlama, gider ekleme, duyuru ekleme, finansal rapor
- Sakin: Bakiye görüntüleme, borç listesi (kırmızı/yeşil), ödeme yapma (banka doğrulama simülasyonu), gider/duyuru görüntüleme

## Kurulum / Çalıştırma
1) Node.js kurulu olmalı.
2) Proje klasöründe:
```bash
npm install
npm start
```
3) Tarayıcıda aç:
- http://localhost:3000

## Demo hesaplar
- Yönetici:
  - Telefon: 05550000000
  - Şifre: admin123
- Sakin (Daire 1):
  - Telefon: 05551112233
  - Şifre: 123456
- Sakin (Daire 2):
  - Telefon: 05554445566
  - Şifre: 123456

## Notlar
- Veriler `data/db.json` dosyasında tutulur.
- Sunucu JSON dosyasını okuyup yazar (gerçek DB yerine).
- Yedek: Yönetici panelinden "Yedek Al" ile `backups/` klasörüne kopya oluşturulur.