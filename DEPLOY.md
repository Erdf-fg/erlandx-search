# 🚀 Deployment Guide: Among Digital

## Arsitektur Deploy
- **Client** (Phaser game) → **Netlify** (static hosting)
- **Server** (Socket.IO) → **Render.com** (WebSocket support, gratis)

---

## Step 1: Deploy Server ke Zeabur (Gratis & Tanpa Kartu Kredit)

Zeabur adalah layanan modern yang sangat stabil untuk Socket.IO.

1. Buka **[zeabur.com](https://zeabur.com/)** dan klik **Get Started**.
2. **Login dengan GitHub** (ini yang paling mudah).
3. Klik **Create Project** → Pilih lokasi server (pilih yang terdekat, misal Singapore atau US).
4. Klik **Deploy Service** → Pilih **GitHub**.
5. Pilih repositori Anda: `erlandx-search`.
6. **Konfigurasi:**
   - Karena project Anda ada di subfolder, Zeabur akan bertanya. Pilih folder `server`.
   - Zeabur akan otomatis mendeteksi Node.js.
7. Klik **Networking** di dashboard Zeabur, lalu klik **Expose Port**.
   - Tambahkan port `3000` (atau biarkan Zeabur mendeteksi otomatis).
8. Klik **Domain** → Klik **Generate Domain** untuk mendapatkan URL publik.
   - Contoh: `among-digital-server.zeabur.app`
9. Selesai! Server Anda sudah online.




---

## Step 2: Deploy Client ke Netlify

1. Buka **https://app.netlify.com** dan buat akun.

2. Di Netlify, set **Environment Variable**:
   - Key: `VITE_SERVER_URL`
   - Value: `https://among-digital-server.onrender.com` _(URL dari Step 1)_

3. **Option A**: Drag & Drop
   - Jalankan `cd client && npm run build`
   - Drag folder `client/dist/` ke Netlify dashboard.
   - ⚠️ Dengan cara ini, env var harus di-set SEBELUM build lokal:
     ```
     set VITE_SERVER_URL=https://among-digital-server.onrender.com
     cd client
     npm run build
     ```

4. **Option B**: Connect GitHub (Recommended)
   - Push seluruh project ke GitHub.
   - Di Netlify, pilih **Import from Git**.
   - Atur:
     - **Base directory**: `client`
     - **Build command**: `npm run build`
     - **Publish directory**: `client/dist`
   - Tambahkan env var `VITE_SERVER_URL` di Netlify settings.

---

## Step 3: Verifikasi

1. Buka URL Netlify (contoh: `https://among-digital.netlify.app`).
2. Klik "I UNDERSTAND" → Masukkan nama → "START MISSION".
3. Timer countdown dan lobby harus muncul.
4. Buka di tab/device lain untuk test multiplayer.

---

## Troubleshooting

- **Server Render spin down setelah idle**: Gratis tier Render akan sleep setelah 15 menit idle. Koneksi pertama mungkin lambat (30-60 detik).
- **CORS error**: Sudah diatur `origin: "*"` di server, tapi bisa diganti ke URL Netlify spesifik untuk keamanan.
- **WebSocket gagal connect**: Pastikan URL server benar dan tidak ada typo di `VITE_SERVER_URL`.
