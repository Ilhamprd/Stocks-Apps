# FairValue ID — Aplikasi Analisa Nilai Wajar Saham IDX

Aplikasi Android (single-file React di-bungkus Capacitor) buat analisa **fair value** saham Bursa Efek Indonesia: 10 model valuasi, quality score, risk metrics, screener, watchlist, portfolio, + **AI Analyst**.

> ⚠️ **Angka 6 ticker (BBRI, BBCA, TLKM, ADRO, TPIA, CUAN) itu DEMO/ilustratif.** Edit di tab **Dashboard → Edit data** sebelum dipakai beneran. Ini alat edukasi, **bukan** ajakan jual-beli.

---

## 📦 Isi project

```
fairvalue-id/
├── src/
│   ├── App.jsx        ← seluruh platform (engine valuasi, UI, AI)
│   ├── main.jsx       ← entry + shim storage (localStorage)
│   └── index.css
├── android/           ← native project Capacitor (siap di-build)
├── .github/workflows/build-apk.yml  ← build APK otomatis di cloud
├── capacitor.config.json
├── vite.config.js
└── package.json
```

---

## 🚀 Cara bikin APK

Ada 2 jalur. **Jalur A paling gampang** kalau males install Android Studio.

### ✅ Jalur A — Build di cloud via GitHub Actions (rekomendasi)

Nggak perlu Android Studio sama sekali. GitHub yang build-in.

1. Bikin repo baru di GitHub (boleh private), terus push project ini:
   ```bash
   git init
   git add .
   git commit -m "FairValue ID"
   git branch -M main
   git remote add origin https://github.com/USERNAME/fairvalue-id.git
   git push -u origin main
   ```
2. Buka repo di GitHub → tab **Actions**. Workflow **"Build Android APK"** jalan otomatis (atau klik **Run workflow** manual).
3. Tunggu ± 3–5 menit sampai centang hijau.
4. Klik run-nya → scroll ke bawah → bagian **Artifacts** → download **`fairvalue-id-debug-apk`**.
5. Unzip → dapet `app-debug.apk`. Itu file APK kamu. Lanjut ke **Install ke HP** di bawah.

### 🛠️ Jalur B — Build lokal pakai Android Studio (Windows)

Kalau mau kontrol penuh / mau publish ke Play Store nanti.

**Yang perlu di-install dulu:**
- [Node.js](https://nodejs.org) (LTS) — udah ada kalau kamu dev.
- [Android Studio](https://developer.android.com/studio) — pas install centang **Android SDK** + **Android SDK Platform-Tools**.
- JDK 21 (biasanya ikut Android Studio).

**Langkah:**
```bash
# di folder project
npm install
npm run build
npx cap sync android
npx cap open android      # buka di Android Studio
```
Di Android Studio: tunggu Gradle sync kelar → menu **Build → Build Bundle(s) / APK(s) → Build APK(s)** → klik **locate** → ketemu `app-debug.apk`.

> Mau lewat command line aja tanpa buka Android Studio? (Android SDK harus udah ke-set di `ANDROID_HOME`)
> ```bash
> npm run build && npx cap sync android
> cd android && ./gradlew assembleDebug      # Windows: .\gradlew.bat assembleDebug
> # hasil: android/app/build/outputs/apk/debug/app-debug.apk
> ```

---

## 📲 Install APK ke HP

1. Pindahin `app-debug.apk` ke HP (USB / Google Drive / WhatsApp ke diri sendiri).
2. Buka file-nya di HP → kalau muncul peringatan, izinkan **"Install from unknown sources"** buat aplikasi yang kamu pakai buka file itu (File Manager / Chrome).
3. Tap **Install** → kelar, icon **FairValue ID** nongol di home screen.

> Ini APK **debug** (unsigned) — cukup buat dipakai sendiri. Buat sebar ke orang banyak / Play Store, perlu **signed release APK/AAB** (bisa gue bantuin kalau mau).

---

## 🔑 Aktifin AI Analyst (wajib API key sendiri)

Fitur AI butuh Anthropic API key **punya kamu** (disimpan lokal di HP, nggak masuk ke kode).

1. Daftar di **console.anthropic.com** → dapet **$5 kredit gratis**, tanpa kartu kredit.
2. Menu **API Keys → Create Key** → salin (diawali `sk-ant-`).
3. Di app: tab **Settings** → tempel key → **Simpan key**. Selesai.
4. Buka tab **AI Analyst** → **Buat analisis**.

**Biaya:** Sonnet ≈ $3 / $15 per 1 juta token → satu analisa ± **Rp 300–400**. $5 kredit ≈ ratusan analisa. Bisa pasang spending limit di console biar aman.

---

## 🎨 (Opsional) Ganti icon app

Icon brand "FV" udah disiapin di `resources/icon.png`. Buat generate semua ukuran Android:
```bash
npm i -D @capacitor/assets
npx @capacitor/assets generate --android
npx cap sync android
```

---

## 🧠 Catatan teknis

- **AI call tanpa CORS:** `CapacitorHttp` di-enable di `capacitor.config.json`, jadi `fetch` ke `api.anthropic.com` lewat HTTP native — CORS browser nggak berlaku di APK.
- **Storage:** watchlist, portfolio, API key disimpan di `localStorage` HP (via shim di `main.jsx`).
- **Data real-time:** masih demo & pluggable. Kalau mau auto-fetch beneran dari sumber IDX, itu butuh backend/proxy terpisah — bisa dibahas lanjut.
- **Model AI:** `claude-sonnet-4-6`.

---

*Dibikin buat DS Journey · edukasi, bukan rekomendasi investasi.*
