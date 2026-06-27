import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend,
} from "recharts";
import {
  Search, Star, Briefcase, Filter, Sparkles, ShieldAlert,
  Newspaper, LayoutDashboard, Calculator, Gauge, LineChart as LineIcon,
  TrendingUp, TrendingDown, Minus, Pencil, RefreshCw,
  Settings as SettingsIcon, KeyRound, Check, Trash2, ExternalLink,
} from "lucide-react";

/* ============================================================
   API KEY helper  — disimpan LOKAL di HP (localStorage), tidak
   pernah masuk source code / repo. Dipakai tab AI Analyst.
   ============================================================ */
const AI_KEY_STORE = "fv:anthropic_key";
const getApiKey = () => {
  try { return localStorage.getItem(AI_KEY_STORE) || ""; } catch { return ""; }
};
const setApiKey = (k) => {
  try { k ? localStorage.setItem(AI_KEY_STORE, k) : localStorage.removeItem(AI_KEY_STORE); } catch {}
};

/* ============================================================
   THEME  — palette mengikuti brief (Apple / Linear / Stripe)
   ============================================================ */
const T = {
  bg: "#F5F7FA", card: "#FFFFFF", primary: "#3B82F6", primarySoft: "#EFF6FF",
  success: "#22C55E", successSoft: "#ECFDF5", warning: "#F59E0B", warningSoft: "#FFFBEB",
  danger: "#EF4444", dangerSoft: "#FEF2F2", text: "#1F2937", sub: "#6B7280",
  border: "#E5E7EB", radius: 18, shadow: "0 1px 3px rgba(16,24,40,.06), 0 8px 24px rgba(16,24,40,.05)",
};
const card = (extra = {}) => ({
  background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`,
  boxShadow: T.shadow, padding: 20, ...extra,
});

/* ============================================================
   FORMAT HELPERS (id-ID)
   ============================================================ */
const id = (n, d = 0) =>
  isFinite(n) ? Number(n).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }) : "–";
const rp = (n) => "Rp " + id(Math.round(n));
const pct = (n, d = 1) => (isFinite(n) ? (n >= 0 ? "+" : "") + id(n, d) + "%" : "–");
const big = (n) => {
  const a = Math.abs(n);
  if (a >= 1e12) return "Rp " + id(n / 1e12, 1) + " T";
  if (a >= 1e9) return "Rp " + id(n / 1e9, 1) + " M";
  if (a >= 1e6) return "Rp " + id(n / 1e6, 1) + " Jt";
  return rp(n);
};
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const lerp = (x, x0, x1) => clamp(((x - x0) / (x1 - x0)) * 100, 0, 100);
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };

/* ============================================================
   DEMO DATASET  — ANGKA ILUSTRATIF, EDIT SEBELUM DIPAKAI.
   Semua field editable di tab Dashboard → recompute otomatis.
   History: yearly 2020-2024 (eps, rev T, ni T, per, pbv, dps, fcf T)
            + 12 monthly closes (tahun berjalan) utk vol/drawdown.
   ============================================================ */
const YEARS = [2020, 2021, 2022, 2023, 2024];
const MO = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const DEMO = {
  BBRI: {
    name: "Bank Rakyat Indonesia", sector: "Perbankan", price: 4200, prevClose: 4180, open: 4190, high: 4240, low: 4170,
    volume: 185_000_000, shares: 151_559_000_000, epsTTM: 360, bvps: 2050, roe: 18.5, roa: 3.1, der: 5.4, debtRatio: 0.84,
    currentRatio: 1.15, npm: 33, gpm: 0, opm: 38, revGrowth: 11, niGrowth: 14, epsGrowth: 13, fcf: 38e12, ocf: 52e12,
    dps: 235, payout: 65, beta: 1.05, sectorPER: 12, evEbitda: 0,
    eps: [180, 185, 240, 320, 360], rev: [120, 135, 165, 190, 205], ni: [18, 31, 51, 59, 60],
    per: [16, 13, 12, 11, 11.5], pbv: [2.4, 2.1, 2.6, 2.7, 2.05], dpsH: [98, 122, 174, 248, 235],
    fcfH: [22, 28, 31, 35, 38], px: [5800, 5500, 5300, 5100, 4900, 4700, 4600, 4500, 4400, 4350, 4250, 4200],
  },
  BBCA: {
    name: "Bank Central Asia", sector: "Perbankan", price: 9500, prevClose: 9525, open: 9550, high: 9600, low: 9450,
    volume: 60_000_000, shares: 123_275_000_000, epsTTM: 445, bvps: 1980, roe: 22.8, roa: 3.8, der: 5.1, debtRatio: 0.82,
    currentRatio: 1.25, npm: 47, gpm: 0, opm: 55, revGrowth: 9, niGrowth: 12, epsGrowth: 11, fcf: 42e12, ocf: 55e12,
    dps: 270, payout: 60, beta: 0.92, sectorPER: 12, evEbitda: 0,
    eps: [240, 270, 330, 400, 445], rev: [80, 88, 102, 118, 128], ni: [28, 31, 41, 49, 55],
    per: [27, 28, 24, 23, 21], pbv: [4.2, 4.6, 4.4, 4.7, 4.8], dpsH: [98, 134, 205, 256, 270],
    fcfH: [30, 33, 36, 40, 42], px: [10200, 10000, 9900, 9800, 9700, 9650, 9600, 9580, 9550, 9520, 9510, 9500],
  },
  TLKM: {
    name: "Telkom Indonesia", sector: "Telekomunikasi", price: 2900, prevClose: 2880, open: 2890, high: 2940, low: 2870,
    volume: 95_000_000, shares: 99_062_000_000, epsTTM: 245, bvps: 920, roe: 19.2, roa: 9.5, der: 0.85, debtRatio: 0.46,
    currentRatio: 0.95, npm: 18, gpm: 56, opm: 28, revGrowth: 4, niGrowth: 6, epsGrowth: 5, fcf: 24e12, ocf: 47e12,
    dps: 160, payout: 70, beta: 0.78, sectorPER: 14, evEbitda: 4.8,
    eps: [185, 220, 240, 235, 245], rev: [137, 143, 147, 149, 150], ni: [20, 24, 25, 24, 24.5],
    per: [18, 16, 17, 16, 11.8], pbv: [3.1, 3.4, 3.5, 3.2, 3.0], dpsH: [129, 155, 168, 168, 160],
    fcfH: [18, 20, 22, 23, 24], px: [3900, 3700, 3600, 3500, 3400, 3300, 3200, 3100, 3050, 3000, 2950, 2900],
  },
  ADRO: {
    name: "Alamtri Resources (Adaro)", sector: "Batu Bara", price: 2450, prevClose: 2420, open: 2430, high: 2490, low: 2410,
    volume: 70_000_000, shares: 31_986_000_000, epsTTM: 520, bvps: 2900, roe: 17.5, roa: 12.0, der: 0.45, debtRatio: 0.31,
    currentRatio: 2.4, npm: 28, gpm: 42, opm: 35, revGrowth: -12, niGrowth: -28, epsGrowth: -25, fcf: 14e12, ocf: 22e12,
    dps: 420, payout: 60, beta: 1.35, sectorPER: 6, evEbitda: 2.4,
    eps: [120, 480, 1250, 820, 520], rev: [40, 60, 130, 95, 78], ni: [3.5, 14, 38, 25, 16],
    per: [8, 5, 3, 4, 4.7], pbv: [0.8, 1.1, 1.3, 1.0, 0.85], dpsH: [40, 180, 700, 520, 420],
    fcfH: [6, 12, 28, 19, 14], px: [2900, 2800, 2750, 2700, 2650, 2600, 2580, 2550, 2520, 2500, 2470, 2450],
  },
  TPIA: {
    name: "Chandra Asri Pacific", sector: "Petrokimia", price: 7800, prevClose: 7900, open: 7850, high: 8000, low: 7750,
    volume: 12_000_000, shares: 86_530_000_000, epsTTM: 18, bvps: 1450, roe: 1.2, roa: 0.5, der: 1.65, debtRatio: 0.62,
    currentRatio: 1.3, npm: 0.8, gpm: 12, opm: 4, revGrowth: 6, niGrowth: 40, epsGrowth: 38, fcf: -3e12, ocf: 4e12,
    dps: 0, payout: 0, beta: 1.5, sectorPER: 22, evEbitda: 18,
    eps: [55, 80, -20, 10, 18], rev: [28, 36, 34, 32, 34], ni: [3, 5, -1.5, 0.8, 1.5],
    per: [60, 50, -120, 700, 430], pbv: [3.5, 4.2, 5.0, 5.4, 5.4], dpsH: [0, 20, 0, 0, 0],
    fcfH: [1, -2, -5, -4, -3], px: [9200, 9000, 8800, 8600, 8400, 8200, 8100, 8000, 7950, 7900, 7850, 7800],
  },
  CUAN: {
    name: "Petrindo Jaya Kreasi", sector: "Energi", price: 9200, prevClose: 9100, open: 9150, high: 9400, low: 9050,
    volume: 8_000_000, shares: 11_950_000_000, epsTTM: 95, bvps: 480, roe: 21.0, roa: 9.5, der: 0.9, debtRatio: 0.47,
    currentRatio: 1.8, npm: 22, gpm: 38, opm: 30, revGrowth: 55, niGrowth: 80, epsGrowth: 75, fcf: 1.2e12, ocf: 2.0e12,
    dps: 12, payout: 13, beta: 1.7, sectorPER: 12, evEbitda: 14,
    eps: [10, 22, 45, 62, 95], rev: [2, 4, 7, 10, 16], ni: [0.1, 0.3, 0.6, 0.8, 1.2],
    per: [40, 60, 90, 110, 97], pbv: [8, 12, 16, 19, 19], dpsH: [0, 0, 5, 8, 12],
    fcfH: [0.2, 0.4, 0.7, 0.9, 1.2], px: [11000, 10600, 10200, 9900, 9700, 9500, 9400, 9350, 9300, 9250, 9220, 9200],
  },
};

/* derive helper fields */
function enrich(code) {
  const s = { code, ...DEMO[code] };
  const perHist = s.per, pbvHist = s.pbv;          // historical arrays
  s.avgHistPER = median(perHist.filter((x) => x > 0));
  s.avgHistPBV = median(pbvHist.filter((x) => x > 0));
  s.perHist = perHist; s.pbvHist = pbvHist;
  s.marketCap = s.price * s.shares;
  s.per = s.epsTTM > 0 ? s.price / s.epsTTM : NaN; // current scalar (overwrites array)
  s.pbv = s.price / s.bvps;
  s.peg = s.per > 0 && s.epsGrowth > 0 ? s.per / s.epsGrowth : NaN;
  s.divYield = (s.dps / s.price) * 100;
  s.w52High = Math.max(...s.px);
  s.w52Low = Math.min(...s.px);
  s.fcfPerShare = s.fcf / s.shares;
  return s;
}
const CODES = Object.keys(DEMO);

/* ============================================================
   VALUATION ENGINE — 10 model, real math
   rf = yield SBN 10Y ~6.8% ; ERP ~5.5%
   ============================================================ */
const RF = 0.068, ERP = 0.055, TERM_G = 0.035;
const conf = (lvl) => ({ High: 0.9, Medium: 0.6, Low: 0.35 }[lvl]);

function costOfEquity(beta) { return RF + (beta || 1) * ERP; }

function valuations(s) {
  const r = costOfEquity(s.beta);
  const g = clamp((isFinite(s.epsGrowth) ? s.epsGrowth : s.revGrowth) / 100, -0.1, 0.2);
  const out = [];

  // 1. Benjamin Graham (revised): EPS*(8.5+2g)*4.4/Y
  const gPctCap = clamp(s.epsGrowth, 0, 15);
  const graham = s.epsTTM > 0 ? (s.epsTTM * (8.5 + 2 * gPctCap) * 4.4) / (RF * 100) : NaN;
  out.push({ key: "graham", label: "Benjamin Graham", w: 15, value: graham,
    confidence: s.epsTTM > 0 ? "Medium" : "Low",
    note: `EPS ${id(s.epsTTM)} × (8.5 + 2·${id(gPctCap)}) × 4.4 / ${id(RF * 100, 1)} (yield SBN).` });

  // 2. DCF dua tahap (FCFE/share)
  let dcf = NaN;
  if (isFinite(s.fcfPerShare) && s.fcfPerShare > 0) {
    let pv = 0, f = s.fcfPerShare;
    for (let t = 1; t <= 5; t++) { f *= 1 + g; pv += f / (1 + r) ** t; }
    const tv = (f * (1 + TERM_G)) / (r - TERM_G);
    pv += tv / (1 + r) ** 5;
    dcf = pv;
  }
  out.push({ key: "dcf", label: "DCF (2-stage)", w: 30, value: dcf,
    confidence: dcf > 0 ? "High" : "Low",
    note: dcf > 0 ? `FCF/saham ${rp(s.fcfPerShare)}, growth ${pct(g * 100)}, discount ${id(r * 100, 1)}%, terminal ${id(TERM_G * 100, 1)}%.`
      : "FCF negatif → DCF tidak dipakai (bobot dialihkan)." });

  // 3. Relative PER (vs sektor) — supporting
  const relPER = s.epsTTM > 0 ? s.epsTTM * s.sectorPER : NaN;
  out.push({ key: "relper", label: "Relative PER (sektor)", w: 0, value: relPER,
    confidence: "Medium", note: `EPS × PER sektor (${id(s.sectorPER)}×).` });

  // 4. Historical PER
  const hper = s.epsTTM > 0 ? s.epsTTM * s.avgHistPER : NaN;
  out.push({ key: "hper", label: "Historical PER", w: 20, value: hper,
    confidence: isFinite(s.avgHistPER) ? "High" : "Low",
    note: `EPS × median PER historis (${id(s.avgHistPER, 1)}×).` });

  // 5. Historical PBV
  const hpbv = s.bvps * s.avgHistPBV;
  out.push({ key: "hpbv", label: "Historical PBV", w: 15, value: hpbv,
    confidence: isFinite(s.avgHistPBV) ? "High" : "Low",
    note: `BVPS ${rp(s.bvps)} × median PBV historis (${id(s.avgHistPBV, 2)}×).` });

  // 6. PEG (fair PEG = 1 → fair PER = growth)
  const peg = s.epsTTM > 0 && s.epsGrowth > 0 ? s.epsTTM * clamp(s.epsGrowth, 0, 30) : NaN;
  out.push({ key: "peg", label: "PEG Valuation", w: 10, value: peg,
    confidence: s.epsGrowth > 5 && s.epsGrowth < 40 ? "Medium" : "Low",
    note: `Fair PEG = 1 → fair PER = growth ${id(clamp(s.epsGrowth, 0, 30))}×.` });

  // 7. Earnings Power Value (Greenwald) — supporting: EPS / cost of equity
  const epv = s.epsTTM > 0 ? s.epsTTM / r : NaN;
  out.push({ key: "epv", label: "Earnings Power Value", w: 0, value: epv,
    confidence: "Medium", note: `EPS / cost of equity (${id(r * 100, 1)}%), tanpa growth.` });

  // 8. Asset-Based — supporting (NAV ≈ BVPS)
  out.push({ key: "asset", label: "Asset-Based (BVPS)", w: 0, value: s.bvps,
    confidence: "High", note: "Nilai buku per saham sebagai lantai aset." });

  // 9. Dividend Discount Model (Gordon)
  let ddm = NaN;
  const gd = clamp(s.epsGrowth / 100, 0, r - 0.005);
  if (s.dps > 0 && r > gd) ddm = (s.dps * (1 + gd)) / (r - gd);
  out.push({ key: "ddm", label: "Dividend Discount", w: 10, value: ddm,
    confidence: s.dps > 0 ? "Medium" : "Low",
    note: s.dps > 0 ? `D1 ${rp(s.dps * (1 + gd))} / (${id(r * 100, 1)}% − ${id(gd * 100, 1)}%).`
      : "Tidak bagi dividen → bobot dialihkan." });

  return { models: out, r };
}

/* weighted final dgn re-normalisasi + winsorize outlier */
function finalFairValue(models, price) {
  const weighted = models.filter((m) => m.w > 0 && isFinite(m.value) && m.value > 0);
  if (!weighted.length) return { fv: NaN, used: [], dropped: models.filter((m) => m.w > 0) };
  const med = median(weighted.map((m) => m.value));
  const lo = 0.4 * med, hi = 2.5 * med;
  const wSum = weighted.reduce((s, m) => s + m.w, 0);
  let fv = 0;
  const used = weighted.map((m) => {
    const cv = clamp(m.value, lo, hi);
    const w = m.w / wSum;
    fv += cv * w;
    return { ...m, clamped: cv !== m.value, contribution: cv * w, weight: w };
  });
  const dropped = models.filter((m) => m.w > 0 && !(isFinite(m.value) && m.value > 0));
  return { fv, used, dropped, med };
}

/* ============================================================
   QUALITY SCORES (0–100) — transparan, heuristik
   ============================================================ */
function qualityScores(s, risk) {
  const Q = {};
  Q.Profitabilitas = mean([lerp(s.roe, 0, 25), lerp(s.roa, 0, 12), lerp(s.npm, 0, 30), lerp(s.opm, 0, 35)]);
  Q.Pertumbuhan = mean([lerp(s.revGrowth, -10, 25), lerp(s.niGrowth, -10, 40), lerp(s.epsGrowth, -10, 40)]);
  const bank = s.sector === "Perbankan";
  Q["Kesehatan Keuangan"] = bank
    ? mean([lerp(s.roa, 0, 4), lerp(100 - s.debtRatio * 100, 10, 25), lerp(s.currentRatio, 0.9, 1.4)])
    : mean([lerp(3 - s.der, 0.5, 2.5), lerp(s.currentRatio, 1, 2.5), lerp(1 - s.debtRatio, 0.3, 0.8)]);
  Q.Valuasi = mean([
    isFinite(s.per) && s.per > 0 ? lerp(35 - s.per, 5, 30) : 30,
    lerp(5 - s.pbv, 0, 4),
    isFinite(s.peg) ? lerp(3 - s.peg, 0, 2.5) : 50,
  ]);
  Q.Risiko = mean([lerp(1.8 - s.beta, 0, 1.2), lerp(0.6 - risk.volA, -0.4, 0.6) ]);
  const fcfNi = s.ni && s.ni.length ? s.fcf / (s.ni[s.ni.length - 1] * 1e12 || 1) : 0;
  Q["Arus Kas"] = mean([s.fcf > 0 ? 70 : 15, lerp(fcfNi, 0, 1.2), lerp((s.fcf / s.marketCap) * 100, 0, 8)]);
  Q.Dividen = s.dps > 0
    ? mean([lerp(s.divYield, 0, 6), s.payout >= 20 && s.payout <= 65 ? 90 : lerp(90 - Math.abs(45 - s.payout), 0, 90)])
    : 25;
  Q["Kualitas Bisnis"] = mean([lerp(s.gpm || s.opm, 10, 55), lerp(s.roe, 5, 25), lerp(s.opm, 5, 35)]);
  Q["Alokasi Modal"] = mean([lerp(s.roe, 5, 25), lerp((1 - s.payout / 100) * s.roe, 2, 18)]);
  Q["Efisiensi Manajemen"] = mean([lerp(s.roa, 0, 12), lerp(s.roe, 5, 25), lerp(s.npm, 0, 30)]);
  Object.keys(Q).forEach((k) => (Q[k] = Math.round(clamp(Q[k], 0, 100))));
  return Q;
}

/* ============================================================
   RISK
   ============================================================ */
function riskMetrics(s) {
  const rets = [];
  for (let i = 1; i < s.px.length; i++) rets.push(s.px[i] / s.px[i - 1] - 1);
  const volM = std(rets), volA = volM * Math.sqrt(12), mu = mean(rets);
  let peak = -Infinity, mdd = 0;
  s.px.forEach((p) => { peak = Math.max(peak, p); mdd = Math.min(mdd, p / peak - 1); });
  const varPct = clamp(1.645 * volM - mu, 0, 1); // 1-bln 95%
  return {
    volA, volM, mdd: mdd * 100, beta: s.beta, varPct: varPct * 100, varRp: s.price * varPct,
    business: s.npm < 5 ? "Tinggi" : s.npm < 15 ? "Sedang" : "Rendah",
    financial: s.der > 2 ? "Tinggi" : s.der > 1 ? "Sedang" : "Rendah",
    liquidity: s.volume * s.price > 5e10 ? "Rendah" : s.volume * s.price > 1e10 ? "Sedang" : "Tinggi",
  };
}

/* ============================================================
   SKOR & REKOMENDASI
   ============================================================ */
function recommendation(score, upside) {
  if (score >= 80 && upside >= 15) return { label: "STRONG BUY", stars: 5, color: T.success, soft: T.successSoft };
  if (score >= 65 && upside >= 5) return { label: "BUY", stars: 4, color: T.success, soft: T.successSoft };
  if (score >= 50 && upside >= -8) return { label: "HOLD", stars: 3, color: T.warning, soft: T.warningSoft };
  if (upside <= -15 || score < 40) return { label: "SELL", stars: 1, color: T.danger, soft: T.dangerSoft };
  return { label: "REDUCE", stars: 2, color: "#F97316", soft: "#FFF7ED" };
}

function analyze(s) {
  const { models, r } = valuations(s);
  const { fv, used, dropped, med } = finalFairValue(models, s.price);
  const upside = ((fv - s.price) / s.price) * 100;
  const mos = ((fv - s.price) / fv) * 100;
  const risk = riskMetrics(s);
  const Q = qualityScores(s, risk);
  const valScore = clamp(lerp(upside, -30, 50), 0, 100);
  const investScore = Math.round(clamp(0.5 * mean(Object.values(Q)) + 0.5 * valScore, 0, 100));
  const rec = recommendation(investScore, upside);
  return { s, models, used, dropped, med, r, fv, upside, mos, risk, Q, investScore, rec };
}

/* ============================================================
   SMALL UI ATOMS
   ============================================================ */
const Pill = ({ children, color = T.primary, soft = T.primarySoft }) => (
  <span style={{ background: soft, color, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999 }}>{children}</span>
);
const Bar100 = ({ v, color }) => (
  <div style={{ background: "#F1F5F9", borderRadius: 999, height: 8, overflow: "hidden", flex: 1 }}>
    <div style={{ width: `${v}%`, height: "100%", background: color, borderRadius: 999, transition: "width .5s" }} />
  </div>
);
const scoreColor = (v) => (v >= 70 ? T.success : v >= 45 ? T.warning : T.danger);
const Stat = ({ label, value, sub, color }) => (
  <div style={card({ padding: 16 })}>
    <div style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Section = ({ title, icon, children, right }) => (
  <div style={card({ marginBottom: 16 })}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}<h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>{title}</h3>
      </div>{right}
    </div>{children}
  </div>
);
const ChartBox = ({ children }) => (
  <div style={{ width: "100%", height: 240 }}><ResponsiveContainer>{children}</ResponsiveContainer></div>
);
const axis = { stroke: T.sub, fontSize: 11 };
const tip = { contentStyle: { borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12, boxShadow: T.shadow } };

/* ============================================================
   MAIN APP
   ============================================================ */
/* ============================================================
   TAB: SETTINGS  — kelola Anthropic API key (disimpan lokal)
   ============================================================ */
function SettingsTab() {
  const [key, setKey] = useState(getApiKey());
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const hasKey = !!getApiKey();

  const save = () => {
    setApiKey(key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };
  const clear = () => { setApiKey(""); setKey(""); };

  const box = { width: "100%", padding: "11px 12px", borderRadius: 12, border: `1px solid ${T.border}`, background: "#fff", fontSize: 14, outline: "none", color: T.text, fontFamily: "ui-monospace, monospace" };
  const btn = (bg, fg) => ({ display: "flex", alignItems: "center", gap: 6, border: "none", background: bg, color: fg, borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" });

  return (
    <Section title="Settings — AI Analyst" icon={<SettingsIcon size={16} color={T.primary} />}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
          background: hasKey ? T.successSoft : "#FEF3C7", color: hasKey ? T.success : "#92400E" }}>
          {hasKey ? <><Check size={13} /> API key tersimpan</> : <><KeyRound size={13} /> Belum ada API key</>}
        </span>
      </div>

      <label style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Anthropic API Key</label>
      <div style={{ position: "relative", marginTop: 6 }}>
        <input
          type={show ? "text" : "password"}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          autoCapitalize="none" autoCorrect="off" spellCheck={false}
          style={{ ...box, paddingRight: 64 }}
        />
        <button onClick={() => setShow((v) => !v)}
          style={{ position: "absolute", right: 8, top: 7, border: "none", background: "transparent", color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          {show ? "Sembunyi" : "Lihat"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={save} style={btn(T.primary, "#fff")}>
          {saved ? <><Check size={14} /> Tersimpan</> : <>Simpan key</>}
        </button>
        {hasKey && (
          <button onClick={clear} style={btn(T.dangerSoft, T.danger)}>
            <Trash2 size={14} /> Hapus key
          </button>
        )}
      </div>

      <div style={{ marginTop: 22, padding: 16, background: T.bg, borderRadius: 14, border: `1px solid ${T.border}`, fontSize: 13.5, lineHeight: 1.7, color: T.text }}>
        <div style={{ fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <KeyRound size={15} color={T.primary} /> Cara dapat API key (gratis mulai)
        </div>
        <ol style={{ margin: "0 0 0 18px", padding: 0 }}>
          <li>Buka <b>console.anthropic.com</b> → daftar (dapat <b>$5 kredit gratis</b>, tanpa kartu).</li>
          <li>Masuk menu <b>API Keys</b> → <b>Create Key</b>.</li>
          <li>Salin key (diawali <code>sk-ant-</code>) → tempel di atas → <b>Simpan</b>.</li>
        </ol>
        <div style={{ marginTop: 12, color: T.sub }}>
          <b style={{ color: T.text }}>Biaya:</b> model Sonnet ≈ $3/$15 per 1 juta token. Satu analisa ± Rp 300–400, jadi $5 kredit ≈ ratusan analisa.
        </div>
        <div style={{ marginTop: 8, color: T.sub }}>
          <b style={{ color: T.text }}>Privasi:</b> key disimpan <b>cuma di HP kamu</b> (localStorage), tidak pernah masuk ke kode aplikasi atau dikirim ke mana pun selain langsung ke API Anthropic.
        </div>
      </div>
    </Section>
  );
}

/* ============================================================
   TAB DEFINITIONS
   ============================================================ */
const TABS = [
  ["dashboard", "Dashboard", LayoutDashboard], ["valuation", "Valuasi", Calculator],
  ["quality", "Kualitas", Gauge], ["charts", "Chart", LineIcon], ["ai", "AI Analyst", Sparkles],
  ["screener", "Screener", Filter], ["watchlist", "Watchlist", Star], ["portfolio", "Portfolio", Briefcase],
  ["risk", "Risiko", ShieldAlert], ["news", "Berita", Newspaper],
  ["settings", "Settings", SettingsIcon],
];

export default function App() {
  const [code, setCode] = useState("BBRI");
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(enrich("BBRI"));
  const [q, setQ] = useState("");

  // load ticker → editable copy
  const loadCode = (c) => { setCode(c); setData(enrich(c)); setQ(""); };
  const A = useMemo(() => analyze(data), [data]);
  const allAnalyses = useMemo(() => CODES.map((c) => analyze(enrich(c))), []);

  const matches = q
    ? CODES.filter((c) => c.includes(q.toUpperCase()) || DEMO[c].name.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      {/* TOP BAR */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(245,247,250,.8)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${T.primary},#6366F1)`, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800 }}>FV</div>
            <div><div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1 }}>FairValue ID</div>
              <div style={{ fontSize: 11, color: T.sub }}>Intrinsic value · Bursa Efek Indonesia</div></div>
          </div>
          <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 380 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: 11, color: T.sub }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kode / nama (BBRI, ADRO…)"
              style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 12, border: `1px solid ${T.border}`, background: "#fff", fontSize: 14, outline: "none", color: T.text }} />
            {matches.length > 0 && (
              <div style={{ position: "absolute", top: 44, left: 0, right: 0, background: "#fff", borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: "hidden", zIndex: 30 }}>
                {matches.map((c) => (
                  <div key={c} onClick={() => loadCode(c)} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.primarySoft)} onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                    <b style={{ color: T.primary }}>{c}</b><span style={{ color: T.sub, fontSize: 13 }}>{DEMO[c].name}</span>
                  </div>))}
              </div>)}
          </div>
        </div>
        {/* TABS */}
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 12px", display: "flex", gap: 4, overflowX: "auto" }}>
          {TABS.map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", border: "none", background: "transparent",
              borderBottom: `2px solid ${tab === k ? T.primary : "transparent"}`, color: tab === k ? T.primary : T.sub,
              fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
              <Icon size={15} />{label}
            </button>))}
        </div>
      </div>

      {/* HEADER STRIP saham aktif */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 20px 4px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{code}</h1>
          <span style={{ color: T.sub, fontSize: 15 }}>{data.name}</span>
          <Pill>{data.sector}</Pill>
          <span style={{ fontSize: 22, fontWeight: 700 }}>{rp(data.price)}</span>
          <span style={{ color: data.price >= data.prevClose ? T.success : T.danger, fontWeight: 600 }}>
            {pct(((data.price - data.prevClose) / data.prevClose) * 100, 2)}
          </span>
          <span style={{ marginLeft: "auto" }}><Pill color="#92400E" soft="#FEF3C7">⚠ Data demo — edit sebelum dipakai</Pill></span>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: 20 }}>
        {tab === "dashboard" && <Dashboard A={A} data={data} setData={setData} code={code} />}
        {tab === "valuation" && <Valuation A={A} />}
        {tab === "quality" && <Quality A={A} />}
        {tab === "charts" && <Charts s={data} />}
        {tab === "ai" && <AIAnalyst A={A} />}
        {tab === "screener" && <Screener list={allAnalyses} onPick={loadCode} />}
        {tab === "watchlist" && <Watchlist A={A} list={allAnalyses} onPick={loadCode} />}
        {tab === "portfolio" && <Portfolio list={allAnalyses} />}
        {tab === "risk" && <Risk A={A} />}
        {tab === "news" && <News s={data} A={A} />}
        {tab === "settings" && <SettingsTab />}

        <div style={{ textAlign: "center", color: T.sub, fontSize: 12, marginTop: 28, lineHeight: 1.6 }}>
          Alat edukasi & riset, <b>bukan rekomendasi/ajakan jual-beli</b>. Skor dan fair value dihasilkan dari formula atas
          angka yang kamu input. Data demo bersifat ilustratif — verifikasi & ganti dengan data live sebelum dipakai keputusan riil.
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TAB: DASHBOARD (+ editor data)
   ============================================================ */
function Dashboard({ A, data, setData, code }) {
  const { fv, upside, mos, investScore, rec } = A;
  const [edit, setEdit] = useState(false);
  const set = (k, v) => setData((d) => enrichFrom({ ...rawOf(d), [k]: parseFloat(v) || 0 }, d.code));
  return (
    <>
      {/* hero score */}
      <div style={card({ marginBottom: 16, background: `linear-gradient(135deg,#fff,${rec.soft})` })}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 18, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>INVESTMENT SCORE</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: rec.color, lineHeight: 1 }}>{investScore}<span style={{ fontSize: 18, color: T.sub }}> /100</span></div>
            <div style={{ marginTop: 8 }}>
              <span style={{ background: rec.color, color: "#fff", fontWeight: 800, fontSize: 14, padding: "6px 14px", borderRadius: 999 }}>{rec.label}</span>
              <span style={{ marginLeft: 8, color: "#F59E0B", fontSize: 16 }}>{"★".repeat(rec.stars)}{"☆".repeat(5 - rec.stars)}</span>
            </div>
          </div>
          <Stat label="Intrinsic / Fair Value" value={isFinite(fv) ? rp(fv) : "–"} sub="Weighted 6-model" />
          <Stat label="Harga Sekarang" value={rp(data.price)} />
          <Stat label={upside >= 0 ? "Upside" : "Downside"} value={pct(upside)} color={upside >= 0 ? T.success : T.danger}
            sub={`Margin of Safety ${pct(mos)}`} />
        </div>
      </div>

      {/* metrik utama */}
      <Section title="Data Pasar & Fundamental" icon={<LayoutDashboard size={16} color={T.primary} />}
        right={<button onClick={() => setEdit((e) => !e)} style={{ display: "flex", gap: 6, alignItems: "center", border: `1px solid ${T.border}`, background: "#fff", borderRadius: 10, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: T.primary, cursor: "pointer" }}><Pencil size={13} />{edit ? "Tutup editor" : "Edit data"}</button>}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
          {[
            ["Prev Close", rp(data.prevClose)], ["Open", rp(data.open)], ["High", rp(data.high)], ["Low", rp(data.low)],
            ["52W High", rp(data.w52High)], ["52W Low", rp(data.w52Low)], ["Volume", id(data.volume)],
            ["Market Cap", big(data.marketCap)], ["Shares Out", id(data.shares)], ["EPS TTM", rp(data.epsTTM)],
            ["BVPS", rp(data.bvps)], ["PER", isFinite(data.per) ? id(data.per, 1) + "×" : "–"], ["PBV", id(data.pbv, 2) + "×"],
            ["PEG", isFinite(data.peg) ? id(data.peg, 2) : "–"], ["ROE", id(data.roe, 1) + "%"], ["ROA", id(data.roa, 1) + "%"],
            ["DER", id(data.der, 2)], ["NPM", id(data.npm, 1) + "%"], ["Div Yield", id(data.divYield, 2) + "%"],
            ["Payout", id(data.payout) + "%"], ["Beta", id(data.beta, 2)], ["FCF", big(data.fcf)],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: "8px 10px", background: T.bg, borderRadius: 12 }}>
              <div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
            </div>))}
        </div>

        {edit && (
          <div style={{ marginTop: 16, padding: 16, background: T.primarySoft, borderRadius: 14 }}>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>Ganti angka demo dengan data live (dari Stockbit/RTI/laporan keuangan). Fair value langsung dihitung ulang.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
              {[["price", "Harga"], ["epsTTM", "EPS TTM"], ["bvps", "BVPS"], ["epsGrowth", "EPS Growth %"],
                ["roe", "ROE %"], ["der", "DER"], ["dps", "DPS"], ["fcf", "FCF (Rp)"], ["beta", "Beta"],
                ["sectorPER", "PER Sektor"], ["payout", "Payout %"], ["npm", "NPM %"]].map(([k, lbl]) => (
                <label key={k} style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{lbl}
                  <input type="number" defaultValue={rawOf(data)[k]} onBlur={(e) => set(k, e.target.value)}
                    style={{ width: "100%", marginTop: 4, padding: "7px 10px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontSize: 13 }} />
                </label>))}
            </div>
          </div>)}
      </Section>

      {/* mini fair value vs price */}
      <Section title="Fair Value vs Harga (per model)" icon={<Calculator size={16} color={T.primary} />}>
        <ChartBox>
          <BarChart data={A.models.filter((m) => isFinite(m.value) && m.value > 0).map((m) => ({ name: m.label.split(" ")[0], v: Math.round(m.value) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
            <XAxis dataKey="name" {...axis} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis {...axis} tickFormatter={(v) => id(v)} />
            <Tooltip {...tip} formatter={(v) => rp(v)} />
            <ReferenceLine y={data.price} stroke={T.danger} strokeDasharray="4 4" label={{ value: "Harga " + rp(data.price), fill: T.danger, fontSize: 11, position: "insideTopRight" }} />
            <Bar dataKey="v" radius={[8, 8, 0, 0]}>
              {A.models.filter((m) => isFinite(m.value) && m.value > 0).map((m, i) => (
                <Cell key={i} fill={m.value >= data.price ? T.success : T.warning} />))}
            </Bar>
          </BarChart>
        </ChartBox>
      </Section>
    </>
  );
}

/* helpers utk editor: pisahkan raw dari derived */
function rawOf(s) {
  const { code, marketCap, per, pbv, peg, divYield, w52High, w52Low, avgHistPER, avgHistPBV, fcfPerShare, perHist, pbvHist, ...raw } = s;
  return raw;
}
function enrichFrom(raw, code) {
  DEMO[code] = { ...DEMO[code], ...raw }; // override demo dgn edit
  const e = enrich(code);
  return e;
}

/* ============================================================
   TAB: VALUASI
   ============================================================ */
function Valuation({ A }) {
  const { models, used, dropped, fv, upside, mos, s } = A;
  return (
    <>
      <Section title="Final Fair Value (Weighted Scoring)" icon={<Calculator size={16} color={T.primary} />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
          <Stat label="Final Fair Value" value={rp(fv)} />
          <Stat label="Harga" value={rp(s.price)} />
          <Stat label={upside >= 0 ? "Upside" : "Downside"} value={pct(upside)} color={upside >= 0 ? T.success : T.danger} />
          <Stat label="Margin of Safety" value={pct(mos)} color={mos >= 20 ? T.success : mos >= 0 ? T.warning : T.danger} />
        </div>
        <div style={{ fontSize: 13, color: T.sub, marginBottom: 8 }}>Kontribusi tiap model ke fair value (bobot dinormalisasi ulang untuk model yang valid):</div>
        {used.map((m) => (
          <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ width: 150, fontSize: 13, fontWeight: 600 }}>{m.label}</div>
            <Pill color={T.sub} soft={T.bg}>{id(m.weight * 100)}%</Pill>
            <Bar100 v={m.weight * 100} color={T.primary} />
            <div style={{ width: 110, textAlign: "right", fontWeight: 700, fontSize: 13 }}>{rp(m.clamped ? m.value : m.value)}{m.clamped && <span title="dibatasi anti-outlier" style={{ color: T.warning }}> ⚑</span>}</div>
          </div>))}
        {dropped.length > 0 && <div style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>Dilewati (data tak memadai → bobotnya dialihkan): {dropped.map((d) => d.label).join(", ")}.</div>}
      </Section>

      <Section title="Rincian 10 Model Valuasi" icon={<Calculator size={16} color={T.primary} />}>
        <div style={{ display: "grid", gap: 10 }}>
          {models.map((m) => {
            const ok = isFinite(m.value) && m.value > 0;
            const up = ok ? ((m.value - s.price) / s.price) * 100 : NaN;
            return (
              <div key={m.key} style={{ padding: 14, borderRadius: 14, border: `1px solid ${T.border}`, background: m.w > 0 ? "#fff" : T.bg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <b style={{ fontSize: 14 }}>{m.label}</b>
                  {m.w > 0 ? <Pill>bobot {m.w}%</Pill> : <Pill color={T.sub} soft="#F1F5F9">supporting</Pill>}
                  <span style={{ marginLeft: "auto", fontSize: 18, fontWeight: 800, color: ok ? T.text : T.sub }}>{ok ? rp(m.value) : "n/a"}</span>
                  {ok && <span style={{ fontWeight: 700, color: up >= 0 ? T.success : T.danger, width: 64, textAlign: "right" }}>{pct(up)}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <Pill color={conf(m.confidence) >= 0.8 ? T.success : conf(m.confidence) >= 0.5 ? T.warning : T.danger}
                    soft={conf(m.confidence) >= 0.8 ? T.successSoft : conf(m.confidence) >= 0.5 ? T.warningSoft : T.dangerSoft}>
                    Confidence: {m.confidence}</Pill>
                  <span style={{ fontSize: 12.5, color: T.sub }}>{m.note}</span>
                </div>
              </div>);
          })}
        </div>
      </Section>
    </>
  );
}

/* ============================================================
   TAB: KUALITAS
   ============================================================ */
function Quality({ A }) {
  const { Q, investScore, rec } = A;
  const data = Object.entries(Q).map(([k, v]) => ({ k, v }));
  return (
    <>
      <Section title="Skor Kualitas Perusahaan (0–100)" icon={<Gauge size={16} color={T.primary} />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
          <div>
            {data.map(({ k, v }) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 130, fontSize: 13, fontWeight: 600 }}>{k}</div>
                <Bar100 v={v} color={scoreColor(v)} />
                <div style={{ width: 36, textAlign: "right", fontWeight: 700, color: scoreColor(v) }}>{v}</div>
              </div>))}
          </div>
          <ChartBox>
            <BarChart layout="vertical" data={data} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} {...axis} />
              <YAxis type="category" dataKey="k" width={120} {...axis} />
              <Tooltip {...tip} />
              <Bar dataKey="v" radius={[0, 8, 8, 0]}>{data.map((d, i) => <Cell key={i} fill={scoreColor(d.v)} />)}</Bar>
            </BarChart>
          </ChartBox>
        </div>
        <div style={{ marginTop: 8, padding: 14, background: rec.soft, borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Rata-rata kualitas → komponen Investment Score</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: rec.color }}>{investScore}/100 · {rec.label}</span>
        </div>
      </Section>
    </>
  );
}

/* ============================================================
   TAB: CHARTS
   ============================================================ */
function Charts({ s }) {
  const [view, setView] = useState("price");
  const yearly = (key) => YEARS.map((y, i) => ({ x: y, v: s[key][i] }));
  const monthly = s.px.map((v, i) => ({ x: MO[i], v }));
  const opts = [
    ["price", "Harga (12 bln)"], ["eps", "EPS"], ["rev", "Revenue (T)"], ["ni", "Net Income (T)"],
    ["per", "PER"], ["pbv", "PBV"], ["dpsH", "Dividen/saham"], ["fcfH", "Free Cash Flow (T)"],
  ];
  const isMonthly = view === "price";
  const keyMap = { per: "perHist", pbv: "pbvHist" };
  const series = isMonthly ? monthly : yearly(keyMap[view] || view);
  return (
    <>
      <Section title="Riwayat & Tren" icon={<LineIcon size={16} color={T.primary} />}
        right={<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {opts.map(([k, l]) => (
            <button key={k} onClick={() => setView(k)} style={{ border: `1px solid ${view === k ? T.primary : T.border}`, background: view === k ? T.primarySoft : "#fff", color: view === k ? T.primary : T.sub, borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>))}
        </div>}>
        <ChartBox>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
            <XAxis dataKey="x" {...axis} /><YAxis {...axis} tickFormatter={(v) => id(v)} />
            <Tooltip {...tip} />
            <Line type="monotone" dataKey="v" stroke={T.primary} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ChartBox>
      </Section>

      <Section title="Intrinsic Value vs Harga (historis fair PER)" icon={<LineIcon size={16} color={T.primary} />}>
        <ChartBox>
          <LineChart data={YEARS.map((y, i) => ({ x: y, harga: s.px ? null : null, fair: Math.round(s.eps[i] * s.avgHistPER), eps: s.eps[i] }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
            <XAxis dataKey="x" {...axis} /><YAxis {...axis} tickFormatter={(v) => id(v)} />
            <Tooltip {...tip} formatter={(v) => rp(v)} /><Legend />
            <Line type="monotone" dataKey="fair" name="Fair value (EPS×PER median)" stroke={T.success} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ChartBox>
        <div style={{ fontSize: 12, color: T.sub }}>Garis hijau = estimasi nilai wajar tiap tahun dari EPS × median PER historis ({id(s.avgHistPER, 1)}×).</div>
      </Section>
    </>
  );
}

/* ============================================================
   TAB: AI ANALYST  (Claude via Anthropic API)
   ============================================================ */
function AIAnalyst({ A }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const run = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setErr("API key belum diisi. Buka tab Settings → tempel Anthropic API key kamu dulu (gratis daftar di console.anthropic.com).");
      return;
    }
    setLoading(true); setErr(""); setText("");
    const { s, fv, upside, mos, investScore, rec, Q, risk } = A;
    const payload = {
      kode: s.code, nama: s.name, sektor: s.sector, harga: s.price, fairValue: Math.round(fv),
      upsidePct: +upside.toFixed(1), marginOfSafetyPct: +mos.toFixed(1), investmentScore: investScore, rekomendasi: rec.label,
      PER: +(s.per || 0).toFixed(1), PBV: +s.pbv.toFixed(2), PEG: +(s.peg || 0).toFixed(2), ROE: s.roe, ROA: s.roa,
      DER: s.der, NPM: s.npm, growthEPS: s.epsGrowth, divYield: +s.divYield.toFixed(2), beta: s.beta,
      FCF_positif: s.fcf > 0, volatilitasTahunan: +(risk.volA * 100).toFixed(0), maxDrawdown: +risk.mdd.toFixed(0),
      skorKualitas: Q,
    };
    const prompt = `Kamu equity research analyst profesional untuk Bursa Efek Indonesia. Berdasarkan data terhitung berikut (JSON), tulis catatan riset RINGKAS, tajam, dalam Bahasa Indonesia. Pakai heading pendek persis ini dan 1-3 kalimat per bagian:

**Ringkasan** — kesimpulan 2 kalimat.
**Kenapa murah / mahal** — kaitkan ke valuasi & fair value.
**Kekuatan** — poin terkuat (boleh bullet singkat).
**Kelemahan** — poin terlemah.
**Risiko utama** — risiko bisnis/keuangan/likuiditas paling relevan.
**Outlook & katalis** — prospek + 1-2 katalis konkret yang patut dipantau.
**Kualitas bisnis & moat** — seberapa kuat ekonominya.

Larangan: jangan mengarang berita/angka di luar JSON. Tutup dengan satu baris disclaimer bahwa ini edukasi, bukan ajakan jual-beli. Data: ${JSON.stringify(payload)}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          // izinkan panggilan langsung dari client; di APK request lewat
          // CapacitorHttp (native) jadi CORS tidak berlaku.
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.error?.message || `HTTP ${res.status}`;
        setErr(
          res.status === 401
            ? "API key ditolak (401). Cek lagi key-nya di tab Settings."
            : res.status === 429
            ? "Kena rate limit / kredit habis (429). Cek saldo di console.anthropic.com."
            : "Gagal: " + msg
        );
        setLoading(false);
        return;
      }
      const out = (json.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      setText(out || "Tidak ada keluaran. Coba lagi.");
    } catch (e) { setErr("Gagal memanggil AI. Cek koneksi internet lalu coba lagi."); }
    setLoading(false);
  };

  return (
    <Section title="AI Investment Assistant" icon={<Sparkles size={16} color={T.primary} />}
      right={<button onClick={run} disabled={loading} style={{ display: "flex", gap: 6, alignItems: "center", border: "none", background: T.primary, color: "#fff", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}{loading ? "Menganalisis…" : "Buat analisis"}</button>}>
      {!text && !loading && !err && (
        <div style={{ textAlign: "center", padding: "30px 10px", color: T.sub }}>
          <Sparkles size={30} color={T.primary} style={{ opacity: 0.5 }} />
          <p style={{ maxWidth: 460, margin: "12px auto 0", fontSize: 14 }}>
            Klik <b>Buat analisis</b> untuk catatan riset gaya analis: kenapa murah/mahal, kekuatan, kelemahan, risiko, outlook & katalis — disusun dari metrik yang terhitung untuk <b>{A.s.code}</b>.</p>
        </div>)}
      {loading && <div style={{ textAlign: "center", padding: 40, color: T.sub }}>Menyusun catatan riset untuk {A.s.code}…</div>}
      {err && <div style={{ padding: 16, background: T.dangerSoft, color: T.danger, borderRadius: 12, fontSize: 14 }}>{err}</div>}
      {text && <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}
        dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, `<b style="color:${T.text}">$1</b>`).replace(/^- /gm, "• ") }} />}
      <style>{`.spin{animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </Section>
  );
}

/* ============================================================
   TAB: SCREENER
   ============================================================ */
const SCREENS = {
  "Undervalued (MOS>20%)": (a) => a.mos > 20,
  "MOS > 30%": (a) => a.mos > 30,
  "Dividen (yield>3%)": (a) => a.s.divYield > 3,
  "High growth (EPS>20%)": (a) => a.s.epsGrowth > 20,
  "PER rendah (<10×)": (a) => a.s.per > 0 && a.s.per < 10,
  "ROE tinggi (>18%)": (a) => a.s.roe > 18,
  "Utang rendah (DER<1)": (a) => a.s.der < 1,
};
function Screener({ list, onPick }) {
  const [active, setActive] = useState("Undervalued (MOS>20%)");
  const rows = list.filter(SCREENS[active]).sort((x, y) => y.investScore - x.investScore);
  return (
    <Section title="Stock Screener" icon={<Filter size={16} color={T.primary} />}
      right={<select value={active} onChange={(e) => setActive(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontSize: 13, fontWeight: 600, color: T.text }}>
        {Object.keys(SCREENS).map((k) => <option key={k}>{k}</option>)}</select>}>
      {rows.length === 0 ? <div style={{ color: T.sub, padding: 20, textAlign: "center" }}>Tidak ada saham (dari dataset demo) yang lolos filter ini.</div> :
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ color: T.sub, textAlign: "left" }}>
              {["Kode", "Harga", "Fair Value", "Upside", "MOS", "ROE", "Score", "Rekom"].map((h) => <th key={h} style={{ padding: "8px 10px", fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((a) => (
              <tr key={a.s.code} onClick={() => onPick(a.s.code)} style={{ borderTop: `1px solid ${T.border}`, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)} onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                <td style={{ padding: "10px" }}><b style={{ color: T.primary }}>{a.s.code}</b><div style={{ fontSize: 11, color: T.sub }}>{a.s.sector}</div></td>
                <td style={{ padding: "10px" }}>{rp(a.s.price)}</td>
                <td style={{ padding: "10px" }}>{rp(a.fv)}</td>
                <td style={{ padding: "10px", color: a.upside >= 0 ? T.success : T.danger, fontWeight: 600 }}>{pct(a.upside)}</td>
                <td style={{ padding: "10px", fontWeight: 600 }}>{pct(a.mos)}</td>
                <td style={{ padding: "10px" }}>{id(a.s.roe, 1)}%</td>
                <td style={{ padding: "10px", fontWeight: 700, color: scoreColor(a.investScore) }}>{a.investScore}</td>
                <td style={{ padding: "10px" }}><span style={{ background: a.rec.soft, color: a.rec.color, fontWeight: 700, fontSize: 11, padding: "3px 8px", borderRadius: 999 }}>{a.rec.label}</span></td>
              </tr>))}</tbody>
          </table>
        </div>}
    </Section>
  );
}

/* ============================================================
   TAB: WATCHLIST  (persistent via window.storage)
   ============================================================ */
function Watchlist({ A, list, onPick }) {
  const [wl, setWl] = useState([]);
  const [ready, setReady] = useState(false);
  const KEY = "fv:watchlist";

  useEffect(() => { (async () => {
    try { const r = await window.storage.get(KEY); setWl(r ? JSON.parse(r.value) : []); }
    catch { setWl([]); } setReady(true);
  })(); }, []);
  const save = async (next) => { setWl(next); try { await window.storage.set(KEY, JSON.stringify(next)); } catch {} };

  const add = () => { if (wl.includes(A.s.code)) return; save([...wl, A.s.code]); };
  const remove = (c) => save(wl.filter((x) => x !== c));
  const rows = list.filter((a) => wl.includes(a.s.code));

  return (
    <Section title="Watchlist" icon={<Star size={16} color={T.primary} />}
      right={<button onClick={add} style={{ border: "none", background: T.primary, color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Tambah {A.s.code}</button>}>
      {!ready ? <div style={{ color: T.sub, padding: 16 }}>Memuat…</div> :
        rows.length === 0 ? <div style={{ color: T.sub, textAlign: "center", padding: 24 }}>Belum ada saham. Tambahkan dari sini, tersimpan otomatis lintas sesi.</div> :
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
          {rows.map((a) => {
            const under = a.s.price < a.fv;
            return (
              <div key={a.s.code} style={card({ padding: 16, cursor: "pointer", borderColor: under ? T.success : T.border })} onClick={() => onPick(a.s.code)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <b style={{ fontSize: 16, color: T.primary }}>{a.s.code}</b>
                  <span onClick={(e) => { e.stopPropagation(); remove(a.s.code); }} style={{ color: T.sub, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</span>
                </div>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>{a.s.name}</div>
                {under && <div style={{ marginBottom: 8 }}><Pill color={T.success} soft={T.successSoft}>⬇ Undervalued</Pill></div>}
                <Row k="Harga" v={rp(a.s.price)} />
                <Row k="Intrinsic" v={rp(a.fv)} />
                <Row k="Upside" v={pct(a.upside)} c={a.upside >= 0 ? T.success : T.danger} />
                <Row k="MOS" v={pct(a.mos)} c={a.mos >= 20 ? T.success : T.warning} />
                <div style={{ marginTop: 8 }}><span style={{ background: a.rec.soft, color: a.rec.color, fontWeight: 700, fontSize: 12, padding: "4px 10px", borderRadius: 999 }}>{a.rec.label}</span></div>
              </div>);
          })}
        </div>}
    </Section>
  );
}
const Row = ({ k, v, c }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
    <span style={{ color: T.sub }}>{k}</span><b style={{ color: c || T.text }}>{v}</b></div>
);

/* ============================================================
   TAB: PORTFOLIO  (persistent)
   ============================================================ */
function Portfolio({ list }) {
  const [pf, setPf] = useState([]);
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState({ code: "BBRI", shares: "", avg: "" });
  const KEY = "fv:portfolio";
  const byCode = useMemo(() => Object.fromEntries(list.map((a) => [a.s.code, a])), [list]);

  useEffect(() => { (async () => {
    try { const r = await window.storage.get(KEY); setPf(r ? JSON.parse(r.value) : []); } catch { setPf([]); } setReady(true);
  })(); }, []);
  const save = async (n) => { setPf(n); try { await window.storage.set(KEY, JSON.stringify(n)); } catch {} };
  const add = () => {
    const sh = parseFloat(form.shares), av = parseFloat(form.avg);
    if (!sh || !av) return;
    save([...pf.filter((h) => h.code !== form.code), { code: form.code, shares: sh, avg: av }]);
    setForm({ code: "BBRI", shares: "", avg: "" });
  };
  const remove = (c) => save(pf.filter((h) => h.code !== c));

  const rows = pf.map((h) => {
    const a = byCode[h.code]; const cur = a.s.price;
    const cost = h.shares * h.avg, val = h.shares * cur, pl = val - cost;
    return { ...h, name: a.s.name, sector: a.s.sector, cur, intrinsic: a.fv, cost, val, pl, plPct: (pl / cost) * 100, rec: a.rec, mos: a.mos };
  });
  const totVal = rows.reduce((s, r) => s + r.val, 0);
  const totCost = rows.reduce((s, r) => s + r.cost, 0);
  const totPl = totVal - totCost;
  // diversifikasi: HHI dari bobot per sektor
  const sectorW = {}; rows.forEach((r) => (sectorW[r.sector] = (sectorW[r.sector] || 0) + r.val / (totVal || 1)));
  const hhi = Object.values(sectorW).reduce((s, w) => s + w * w, 0);
  const divScore = Math.round(clamp((1 - hhi) / (1 - 1 / Math.max(rows.length, 1) || 1) * 100, 0, 100)) || (rows.length ? 0 : 0);
  const avgMos = rows.length ? mean(rows.map((r) => r.mos)) : 0;
  const health = Math.round(clamp(0.5 * clamp(lerp(avgMos, -20, 40), 0, 100) + 0.5 * divScore, 0, 100));

  return (
    <>
      <Section title="Tambah Holding" icon={<Briefcase size={16} color={T.primary} />}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Saham
            <select value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={{ display: "block", marginTop: 4, padding: "8px 12px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontSize: 13 }}>
              {CODES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Lembar
            <input type="number" value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })} placeholder="1000" style={{ display: "block", marginTop: 4, padding: "8px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13, width: 120 }} /></label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Harga avg
            <input type="number" value={form.avg} onChange={(e) => setForm({ ...form, avg: e.target.value })} placeholder="4000" style={{ display: "block", marginTop: 4, padding: "8px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13, width: 120 }} /></label>
          <button onClick={add} style={{ border: "none", background: T.primary, color: "#fff", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Simpan</button>
        </div>
      </Section>

      {ready && rows.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
            <Stat label="Nilai Portfolio" value={big(totVal)} />
            <Stat label="Modal" value={big(totCost)} />
            <Stat label="Unrealized P/L" value={big(totPl)} color={totPl >= 0 ? T.success : T.danger} sub={pct((totPl / totCost) * 100)} />
            <Stat label="Diversifikasi" value={divScore + "/100"} color={scoreColor(divScore)} />
            <Stat label="Portfolio Health" value={health + "/100"} color={scoreColor(health)} />
          </div>
          <Section title="Holdings" icon={<Briefcase size={16} color={T.primary} />}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ color: T.sub, textAlign: "left" }}>{["Kode", "Lembar", "Avg", "Harga", "Nilai", "P/L", "Intrinsic", "Rekom", ""].map((h) => <th key={h} style={{ padding: "8px 10px", fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>{rows.map((r) => (
                  <tr key={r.code} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: 10 }}><b style={{ color: T.primary }}>{r.code}</b></td>
                    <td style={{ padding: 10 }}>{id(r.shares)}</td><td style={{ padding: 10 }}>{rp(r.avg)}</td>
                    <td style={{ padding: 10 }}>{rp(r.cur)}</td><td style={{ padding: 10 }}>{big(r.val)}</td>
                    <td style={{ padding: 10, color: r.pl >= 0 ? T.success : T.danger, fontWeight: 600 }}>{big(r.pl)}<div style={{ fontSize: 11 }}>{pct(r.plPct)}</div></td>
                    <td style={{ padding: 10 }}>{rp(r.intrinsic)}</td>
                    <td style={{ padding: 10 }}><span style={{ background: r.rec.soft, color: r.rec.color, fontWeight: 700, fontSize: 11, padding: "3px 8px", borderRadius: 999 }}>{r.rec.label}</span></td>
                    <td style={{ padding: 10 }}><span onClick={() => remove(r.code)} style={{ color: T.sub, cursor: "pointer", fontSize: 18 }}>×</span></td>
                  </tr>))}</tbody>
              </table>
            </div>
          </Section>
        </>)}
      {ready && rows.length === 0 && <div style={{ color: T.sub, textAlign: "center", padding: 24 }}>Belum ada holding. Tambahkan di atas — tersimpan otomatis.</div>}
    </>
  );
}

/* ============================================================
   TAB: RISK
   ============================================================ */
function Risk({ A }) {
  const { risk, s } = A;
  const lvlColor = (l) => ({ Rendah: T.success, Sedang: T.warning, Tinggi: T.danger }[l]);
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
        <Stat label="Volatilitas (tahunan)" value={id(risk.volA * 100, 0) + "%"} color={risk.volA > 0.4 ? T.danger : T.warning} />
        <Stat label="Max Drawdown" value={id(risk.mdd, 0) + "%"} color={T.danger} />
        <Stat label="Beta" value={id(risk.beta, 2)} sub={risk.beta > 1 ? "lebih volatil dari IHSG" : "lebih stabil"} />
        <Stat label="VaR 95% (1 bln)" value={id(risk.varPct, 1) + "%"} sub={rp(risk.varRp) + " / saham"} color={T.danger} />
      </div>
      <Section title="Profil Risiko Kualitatif" icon={<ShieldAlert size={16} color={T.primary} />}>
        {[["Risiko Bisnis", risk.business, `Margin bersih ${id(s.npm, 1)}% → buffer ${risk.business.toLowerCase()}.`],
          ["Risiko Keuangan", risk.financial, `DER ${id(s.der, 2)} → leverage ${risk.financial.toLowerCase()}.`],
          ["Risiko Likuiditas", risk.liquidity, `Nilai transaksi ~${big(s.volume * s.price)}/hari.`]].map(([k, lvl, note]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ width: 150, fontWeight: 600, fontSize: 14 }}>{k}</div>
            <span style={{ background: lvlColor(lvl) + "22", color: lvlColor(lvl), fontWeight: 700, fontSize: 12, padding: "4px 12px", borderRadius: 999 }}>{lvl}</span>
            <span style={{ fontSize: 12.5, color: T.sub }}>{note}</span>
          </div>))}
      </Section>
      <Section title="Pergerakan Harga (basis perhitungan risiko)" icon={<LineIcon size={16} color={T.primary} />}>
        <ChartBox>
          <LineChart data={s.px.map((v, i) => ({ x: MO[i], v }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" /><XAxis dataKey="x" {...axis} /><YAxis {...axis} tickFormatter={(v) => id(v)} domain={["auto", "auto"]} />
            <Tooltip {...tip} formatter={(v) => rp(v)} /><Line type="monotone" dataKey="v" stroke={T.danger} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ChartBox>
      </Section>
    </>
  );
}

/* ============================================================
   TAB: NEWS  — jujur: butuh feed eksternal
   ============================================================ */
function News({ s }) {
  return (
    <Section title="Berita & Aksi Korporasi" icon={<Newspaper size={16} color={T.primary} />}>
      <div style={{ padding: 18, background: T.warningSoft, borderRadius: 14, marginBottom: 14 }}>
        <b style={{ color: "#92400E" }}>Feed berita belum tersambung.</b>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, color: T.sub, lineHeight: 1.6 }}>
          Berita real-time tidak ditampilkan di sini secara sengaja — agar tidak ada headline karangan. Untuk mengaktifkannya, sambungkan feed lewat backend kecil (CORS aman) lalu render di tab ini.
        </p>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>
        <b>Cara menyambungkan (saat dijalankan lokal):</b>
        <ul style={{ marginTop: 6, paddingLeft: 18, color: T.sub }}>
          <li>Endpoint Node sendiri yang menarik RSS IDX / IQPlus / Kontan / situs IR emiten, lalu di-cache.</li>
          <li>Atau API berbayar (mis. provider berita finansial) dengan field: judul, sumber, waktu, kategori (Dividen / Rights Issue / Stock Split / Buyback / Laporan Keuangan / Insider).</li>
          <li>Map ke kartu di tab ini, dipisah per kategori; tandai aksi korporasi dengan badge.</li>
        </ul>
        <p style={{ color: T.sub, marginTop: 10 }}>Kategori yang sudah disiapkan di UI: Latest News, Corporate Actions, Dividen, Laporan Keuangan, Rights Issue, Stock Split, Buyback, Insider Transactions — tinggal diisi dari feed untuk <b>{s.code}</b>.</p>
      </div>
    </Section>
  );
}
