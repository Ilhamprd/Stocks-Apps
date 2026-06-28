# CLAUDE.md — Konteks Project untuk Claude Code

> Baca file ini dulu setiap sesi. Komunikasi dengan user (Dika) pakai **Bahasa Indonesia casual + istilah teknis English**. Jawaban langsung, jujur, nggak bertele-tele.

## Apa ini

**FairValue ID** — aplikasi Android untuk analisa **nilai wajar (fair value/intrinsic value) saham Bursa Efek Indonesia (IDX)**. Web app React yang dibungkus Capacitor jadi APK. Fokus: value investing, 10 model valuasi, quality score, risk, screener, watchlist, portfolio, AI analyst, rekomendasi aksi posisi (cut loss / take profit).

**Disclaimer wajib tetap ada di UI:** alat edukasi, BUKAN rekomendasi/ajakan jual-beli.

## Stack & struktur

- **Vite 5 + React 18** (bukan Next.js). Single main file.
- **Capacitor 6** (`@capacitor/core|cli|android` ^6.2.0) untuk build Android.
- Libs: `recharts`, `lucide-react`.

```
src/App.jsx        ← SELURUH aplikasi (~1000+ baris): engine valuasi + semua UI
src/main.jsx       ← entry + shim window.storage (pakai localStorage HP)
src/index.css      ← global CSS minimal + animasi .spin
capacitor.config.json   ← appId id.fairvalue.app, webDir "dist", CapacitorHttp enabled
vite.config.js     ← base: "./" (WAJIB utk Capacitor — asset relatif)
.github/workflows/build-apk.yml  ← CI build APK
push.bat           ← 1-klik git add/commit/push (Windows)
```

## Konvensi (PENTING — jangan dilanggar)

1. **Single-file**: semua logika + UI di `src/App.jsx`. User suka 1 file, jangan pecah jadi banyak komponen file kecuali diminta.
2. **Styling inline only**: pakai object style + theme object `T` (di atas App.jsx). TIDAK pakai Tailwind / CSS framework (artifact legacy).
3. **Bahasa Indonesia** di semua teks UI.
4. Setelah edit, **selalu jalankan build lokal buat verifikasi** sebelum bilang selesai: `npm run build` (harus "✓ transformed" tanpa error).

## Build & Deploy (HAFALKAN versi JDK)

- **JDK 17 WAJIB.** Capacitor 6 generate **Gradle 8.2.1 + AGP 8.2.1**:
  - AGP 8.x butuh JDK 17 (JDK 11 ditolak)
  - Gradle 8.2.1 cuma sampai JDK 20 (JDK 21 ditolak)
  - Jadi: **bukan 11, bukan 21 — tepat 17.**
- CI workflow (`build-apk.yml`): pakai `npm install` (BUKAN `npm ci`, biar nggak rewel lock file), `cache:"npm"` TIDAK dipakai di setup-node, generate folder `android/` kalau belum ada, lalu `./gradlew assembleDebug`, upload artifact `app-debug.apk`.

**Workflow rilis yang diinginkan user:** habis ngedit kode → **commit + push ke GitHub** → GitHub Actions otomatis build APK → user download dari tab Actions → Artifacts. Jadi **setelah perubahan, lakukan `git add -A && git commit && git push`** (kecuali user bilang jangan).

## Arsitektur `src/App.jsx`

- **Theme `T`**: palette (bg #F5F7FA, primary #3B82F6, success #22C55E, warning #F59E0B, danger #EF4444), radius 18.
- **Helpers**: `id/rp/pct/big` (format id-ID), `clamp/lerp/mean/median/std`.
- **Persistence** (localStorage): `fv:overrides` (data edit per saham), `fv:lastcode` (saham terakhir dibuka), `fv:anthropic_key` (API key AI). Edit apa pun → `saveOverride()`. Saat load, override di-merge ke `DEMO`. `DEMO_ORIGINAL` = snapshot buat tombol reset.
- **Data `DEMO`**: 6 ticker demo (BBRI, BBCA, TLKM, ADRO, TPIA, CUAN) — angka ilustratif, editable. `makeStock(code)` = factory saham custom (fundamental kosong, diisi user).
- **`enrich(code)`**: turunkan PER/PBV/PEG/divYield/marketCap dari harga + fundamental. Hormati `manualAvgPER`/`manualAvgPBV` (override rata-rata historis dari Stockbit).
- **Valuation engine**: RF=0.068 (SBN 10Y), ERP=0.055, TERM_G=0.035. `valuations()` → 9 model (Graham, DCF 2-stage, Relative PER, Historical PER, Historical PBV, PEG, EPV, Asset-Based, DDM); model tak relevan return NaN → di-drop. `finalFairValue()` = weighted (DCF 30/HistPER 20/HistPBV 15/Graham 15/PEG 10/DDM 10), re-normalisasi + winsorize outlier. MoS = model ke-10 (derived). `qualityScores()` 10 kategori. `riskMetrics()` vol/maxDD/beta/VaR. `recommendation()` STRONG BUY→SELL. `positionAction(upside, score, plPct)` → CUT LOSS / TAKE PROFIT / KURANGI / TAHAN / AKUMULASI (butuh harga beli user). `analyze(s)` = orkestrator.
- **UI tabs**: Dashboard (hero score + AKSI POSISI + editor 2-mode), Valuasi, Kualitas, Chart, AI Analyst, Screener, Watchlist, Portfolio, Risiko, Berita, Settings.

## Fitur khusus & gotcha teknis

- **Harga live (gratis)**: Yahoo Finance endpoint `https://query1.finance.yahoo.com/v8/finance/chart/{KODE}.JK?range=1y&interval=1mo`. Parse `chart.result[0].meta.regularMarketPrice` + `previousClose` + `indicators.quote[0].close[]`. **Kirim header `User-Agent: Mozilla/5.0`**. Endpoint ini TIDAK butuh crumb/login.
- **CORS**: di APK, `fetch` di-patch jadi HTTP native oleh **CapacitorHttp** (di-enable di `capacitor.config.json`), jadi panggilan ke Yahoo & Anthropic TIDAK kena CORS. Header User-Agent dihormati native.
- **Universal search**: ketik kode apa aja → `addStock()` validasi via Yahoo → bikin entry + harga live → user isi fundamental. Saham custom persist + muncul di screener/watchlist (pakai state `ver` buat recompute).
- **Mode "Dari Stockbit"** (editor): user ketik rasio (PER/PBV/Div Yield) → app **hitung balik** EPS/BVPS/DPS pakai harga saat ini (EPS = harga/PER, dst). EPS/BVPS jadi price-independent → konsisten saat harga di-update. Workflow user: tap "Update harga" dulu → baru isi rasio dari Stockbit.
- **AI Analyst**: Anthropic API, model **`claude-sonnet-4-6`**, header `x-api-key` + `anthropic-version: 2023-06-01` + `anthropic-dangerous-direct-browser-access: true`. **API key dari user sendiri** (tab Settings, disimpan localStorage, JANGAN hardcode di kode). Butuh saldo di console.anthropic.com.
- **NO localStorage di artifact** sudah tidak relevan — ini app native asli, localStorage AMAN dan dipakai.

## Catatan saldo/biaya (kalau user tanya)

- AI butuh saldo Anthropic (Sonnet ≈ $3/$15 per 1jt token, ±Rp 300–400/analisa). Fitur valuasi inti jalan TANPA API/internet.
- Fundamental IDX dari API asing (FMP/Twelve Data/EODHD) mahal & sering nggak akurat → user lebih baik input manual dari Stockbit. Yang gratis & live cuma HARGA (Yahoo).
