"use strict";
/* ================= Helpers ================= */
const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
function mulberry32(a) {
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/* ================= Hằng số ================= */
const LW = 960, LH = 600;
const WATER_Y = 468;
const BASE_Y = WATER_Y + 32;        // đáy chồng đá
const STONE_H = 26;
const X0 = 172, X1 = 820;           // vùng cầu
const GRAV = 1500;                  // px/s^2

/* ================= Canvas ================= */
const canvas = $("#game"), ctx = canvas.getContext("2d");
let DPR = 1;
function fitCanvas() {
  DPR = clamp(window.devicePixelRatio || 1, 1, 2);
  canvas.width = LW * DPR; canvas.height = LH * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
fitCanvas(); window.addEventListener("resize", fitCanvas);

/* ================= Trạng thái ================= */
let mode = "story";          // story | endless | daily
let levelIdx = 0, L = LEVELS[0];
let slots = [];              // {units, stones:[{u,golden,seed}], done}
let stonesLeft = 0, throwCount = 0;
let state = "menu";          // menu | story | aim | fly | win | fail | ad | pause
let flying = null, wind = 0, ring = null;
let particles = [], floaters = [];
let drag = null, dragStart = null, spaceCharge = null;   // drag/dragStart: điểm chạm hiện tại / lúc bắt đầu
let throwAnim = 0, hopT = 0, winTimer = -1, failTimer = -1;
let rewardUsedThisLevel = false, reviveUsed = false;
let time = 0;
let combo = 0, bestCombo = 0;
let gull = null, makara = null, fireballs = [], fireTimer = 0;
let demon = null, demonQueue = [];   // quỷ Rakshasa đang canh cầu / hàng chờ xuất hiện
let fishes = [], fishTimer = 3, embers = [];
let gustTimer = 0.5, gustFlashT = 0;
let shakeT = 0, shakeMag = 0;
let eff = { calm: 0, sight: 0, bless: 0 };    // số lần ném còn hiệu lực của vật phẩm
let run = { fire: 0, rings: 0 };              // thống kê trong màn
let endless = { stage: 1, built: 0 };
const starsBG = Array.from({ length: 70 }, () => ({ x: rand(0, LW), y: rand(0, 300), r: rand(0.6, 1.7), p: rand(0, TAU) }));
const clouds = Array.from({ length: 6 }, () => ({ x: rand(0, LW), y: rand(24, 150), s: rand(0.6, 1.3), v: rand(4, 11) }));
const rain = Array.from({ length: 90 }, () => ({ x: rand(0, LW), y: rand(0, LH), v: rand(520, 760) }));

function diff() { return DIFFS[SAVE.diff]; }
function slotW() { return (X1 - X0) / L.slots; }
function slotCX(i) { return X0 + (i + 0.5) * slotW(); }
function stackTopY(i) { return BASE_Y - slots[i].units * STONE_H; }
function deckY() { return BASE_Y - L.need * STONE_H; }
function contiguous() { let c = 0; while (c < slots.length && slots[c].done) c++; return c; }
function monkeyPos() {
  const c = contiguous();
  if (c === 0) return { x: X0 - 52, y: 448 };
  return { x: slotCX(c - 1) + slotW() * 0.22, y: deckY() };
}
function nextIsGolden() { return eff.bless > 0 || throwCount % 5 === 4; }
function gustsOn() { return !!L.gust || SAVE.diff === 2; }
function playing() { return state === "aim" || state === "fly"; }

/* ---------- Sinh màn chơi ngẫu nhiên (Vô tận / Thử thách ngày) ---------- */
function genLevel(stage, rng, name, sub) {
  const r = (a, b) => a + rng() * (b - a);
  const nSlots = Math.min(5 + Math.floor(stage * 0.75) + Math.floor(r(0, 2)), 15);
  const need = stage < 3 ? 2 : stage < 8 ? 3 : (rng() < 0.5 ? 3 : 4);
  const total = nSlots * need;
  const nDemons = Math.min(3, 1 + Math.floor(stage / 4));
  return {
    ch: -1, name, sub, slots: nSlots, need,
    stones: Math.ceil(total * 1.2), wind: Math.min(18 + stage * 12, 150),
    theme: Math.floor(rng() * THEMES.length),
    gull: stage >= 3 && rng() < 0.6, gust: stage >= 4 && rng() < 0.5,
    makara: stage >= 5 && rng() < 0.45, fire: stage >= 6 && rng() < 0.55 ? r(6.5, 10) : 0,
    demons: stage >= 2 ? Array.from({ length: nDemons }, (_, k) =>
      [Math.max(2, Math.round((k + 1) * nSlots / (nDemons + 1))), Math.min(4, 1 + Math.floor(stage / 4))]) : [],
    demonShield: stage >= 5, demonHeal: stage >= 8
  };
}

/* ---------- Khởi tạo màn ---------- */
function startLevel(cfg, stones) {
  L = cfg;
  slots = Array.from({ length: L.slots }, () => ({ units: 0, stones: [], done: false }));
  stonesLeft = stones != null ? stones : Math.round(L.stones * diff().stoneMul);
  throwCount = 0;
  flying = null; ring = null; particles = []; floaters = [];
  drag = null; dragStart = null; spaceCharge = null; winTimer = -1; failTimer = -1;
  rewardUsedThisLevel = false; reviveUsed = false;
  combo = 0; bestCombo = 0; fishes = []; fishTimer = rand(2, 4); hopT = 0; gustTimer = 0.5; gustFlashT = 0;
  eff = { calm: 0, sight: 0, bless: 0 }; run = { fire: 0, rings: 0 };
  gull = L.gull ? { x: rand(320, 680), y: rand(185, 245), dir: Math.random() < 0.5 ? -1 : 1, speed: rand(50, 80) } : null;
  makara = L.makara ? { slot: -1, up: false, t: rand(2, 3.5), h: 0 } : null;
  fireballs = []; fireTimer = L.fire ? L.fire * 0.7 : 0;
  // quỷ: chỉnh máu theo độ khó, cộng thêm đá tương ứng tổng máu để độ khó nằm ở độ chính xác
  const dAdj = SAVE.diff === 0 ? -1 : SAVE.diff === 2 ? 1 : 0;
  demon = null;
  demonQueue = (L.demons || []).map(d => ({ at: d[0], hp: Math.max(1, d[1] + dAdj), boss: d[2] === "boss" })).sort((a, b) => a.at - b.at);
  run.demonHp = demonQueue.reduce((a, d) => a + d.hp, 0);
  stonesLeft += Math.ceil(run.demonHp * 1.7);
  $("#windBox").classList.remove("gust");
  rollWind();
  updateHUD();
}
function rollWind() {
  if (eff.calm > 0) wind = 0;
  else {
    const wmax = L.wind * diff().windMul;
    wind = Math.round(rand(-wmax, wmax));
    if (Math.abs(wind) < 8) wind = 0;
  }
  updateWindHUD();
}

/* ================= HUD ================= */
function updateWindHUD() {
  const txt = $("#windText"), arrow = $("#windArrow"), bars = $("#windBars").children;
  txt.textContent = eff.calm > 0 ? t("wind_calm") : wind === 0 ? t("wind_none") : (wind > 0 ? t("wind_tail") : t("wind_head"));
  arrow.style.transform = wind < 0 ? "scaleX(-1)" : "scaleX(1)";
  arrow.style.opacity = wind === 0 ? "0.25" : "1";
  const lit = wind === 0 ? 0 : clamp(Math.round(Math.abs(wind) / 30) + 1, 1, 5);
  for (let i = 0; i < bars.length; i++) bars[i].classList.toggle("on", i < lit);
}
function updateHUD() {
  $("#hudLevelName").textContent = mode === "story" ? t("hud_lv", { n: levelIdx + 1, ch: Tx.chapterName(L.ch).split(" · ")[1] }) : L.sub;
  $("#hudLevelSub").textContent = mode === "story" ? Tx.levelName(levelIdx) : L.name;
  $("#hudStones").textContent = stonesLeft;
  $("#hudStones").parentElement.classList.toggle("low", stonesLeft <= 3 && playing());
  UI.refreshCoins();
  const cb = $("#comboBox");
  if (combo >= 2 && playing()) { cb.hidden = false; $("#comboText").textContent = "×" + combo + " 🔥"; }
  else cb.hidden = true;
  const g = nextIsGolden();
  $("#nextLabel").textContent = g ? t("stone_gold") : t("stone_normal");
  $("#nextChip").classList.toggle("gold-next", g);
  const doneUnits = slots.reduce((s, x) => s + Math.min(x.units, L.need), 0);
  $("#progressFill").style.width = (doneUnits / (L.slots * L.need) * 100).toFixed(1) + "%";
  updatePowerBar();
}
function updatePowerBar() {
  const rb = $("#rewardBtn");
  if (rb) { rb.disabled = rewardUsedThisLevel || !(state === "aim" && !flying); rb.classList.toggle("used", rewardUsedThisLevel); }
  document.querySelectorAll(".pw[data-pw]").forEach(b => {
    const id = b.dataset.pw, n = SAVE.inv[id] || 0;
    b.querySelector(".cnt").textContent = n;
    const active = eff[id] > 0;
    b.classList.toggle("active", active);
    b.querySelector(".act").textContent = active ? eff[id] : "";
    b.disabled = !(state === "aim" && !flying) || n <= 0 || active;
  });
}

/* ================= Vật phẩm ================= */
function usePower(id) {
  if (state !== "aim" || flying || (SAVE.inv[id] || 0) <= 0 || eff[id] > 0) return;
  SAVE.inv[id]--; SAVE.stats.powerUsed++; persist();
  const m = monkeyPos();
  if (id === "stones") { stonesLeft += 5; floater(m.x + 40, m.y - 120, t("f_stones5"), "#ffd166"); }
  else {
    eff[id] = 3;
    if (id === "calm") { wind = 0; updateWindHUD(); floater(m.x + 60, m.y - 120, t("f_calm"), "#c8f7dc"); }
    if (id === "sight") floater(m.x + 60, m.y - 120, t("f_sight"), "#bfe6ff");
    if (id === "bless") floater(m.x + 60, m.y - 120, t("f_bless"), "#ffd166");
  }
  sparkle(m.x + 16, m.y - 60, 18, "#ffd166"); sfx.golden();
  updateHUD(); UI.checkAchievements();
}

/* ================= Hạt & chữ nổi ================= */
function splash(x, y, n, col) {
  for (let i = 0; i < n; i++) particles.push({ x, y, vx: rand(-90, 90), vy: rand(-190, -40), life: rand(0.3, 0.65), t: 0, col: col || "#dff4ff", size: rand(2, 4.5), grav: 620 });
}
function sparkle(x, y, n, col) {
  for (let i = 0; i < n; i++) { const a = rand(0, TAU), sp = rand(40, 170); particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: rand(0.35, 0.8), t: 0, col: col || "#ffd166", size: rand(2, 4), grav: 120 }); }
}
function explode(x, y) {
  const cols = ["#ffb347", "#ff6a3d", "#ffd166", "#5a3a2a"];
  for (let i = 0; i < 26; i++) { const a = rand(0, TAU), sp = rand(60, 240); particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: rand(0.4, 0.9), t: 0, col: cols[i % 4], size: rand(2.5, 5.5), grav: 380 }); }
}
function confetti() {
  const cols = ["#e07b24", "#ffd166", "#0e7c86", "#e4572e", "#f2b04a", "#fff3d6"];
  for (let i = 0; i < 90; i++) particles.push({ x: rand(0, LW), y: rand(-40, -5), vx: rand(-30, 30), vy: rand(50, 150), life: rand(1.4, 2.6), t: 0, col: cols[i % cols.length], size: rand(4, 8), grav: 60, rect: true, rot: rand(0, TAU), vr: rand(-4, 4) });
}
function floater(x, y, text, col) { floaters.push({ x: clamp(x, 90, LW - 90), y, text, col: col || "#fff", t: 0, life: 1.3 }); }
function shake(m) { shakeMag = Math.max(shakeMag, m); shakeT = 0.3; }

/* ================= Vẽ ================= */
function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
/* ---------- Ảnh bối cảnh (ART.bg / ART.fx) — thiếu ảnh thì dùng hình vẽ bằng code ---------- */
const IMG = {};
function loadImg(key, src) { if (!src) return; const im = new Image(); im.onload = () => { IMG[key] = im; }; im.src = src; }
ART.bg.sky.forEach((src, i) => loadImg("sky" + i, src));
["india", "lanka", "lankaNight"].forEach(k => loadImg(k, ART.bg[k] && ART.bg[k].src));
Object.keys(ART.fx).forEach(k => loadImg(k, ART.fx[k]));
const tintCache = {};
const RAVANA_IMG = new Image(); if (ART.portraits.ravana) RAVANA_IMG.src = ART.portraits.ravana;
/* Bản phủ màu (đêm, bão, hoàng hôn…) tạo một lần rồi dùng lại */
function tinted(key, color) {
  const im = IMG[key];
  if (!color || !im) return im;
  const id = key + color;
  if (!tintCache[id]) {
    const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
    const g = c.getContext("2d");
    g.drawImage(im, 0, 0);
    g.globalCompositeOperation = "source-atop"; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    tintCache[id] = c;
  }
  return tintCache[id];
}
function drawShoreImg(key, color) {
  const d = ART.bg[key], im = tinted(key, color);
  ctx.drawImage(im, d.x, d.y, d.w, d.w * im.height / im.width);
}
function drawBirds(th) {
  ctx.strokeStyle = th.night ? "rgba(220,230,245,.4)" : "rgba(40,70,95,.45)";
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    const bx = ((time * 14 + i * 260) % (LW + 80)) - 40, by = 92 + i * 34 + Math.sin(time * 2 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(bx - 8, by); ctx.quadraticCurveTo(bx - 3, by - 6, bx, by);
    ctx.quadraticCurveTo(bx + 3, by - 6, bx + 8, by); ctx.stroke();
  }
}
function drawSky(th) {
  const sky = IMG["sky" + L.theme];
  if (sky) {
    // ảnh trời trôi rất chậm cho cảm giác sống động
    const pan = Math.sin(time * 0.05) * 14;
    ctx.drawImage(sky, -18 + pan, 0, LW + 36, (LW + 36) * sky.height / sky.width);
    if (th.storm && Math.sin(time * 0.7) > 0.985) { ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(0, 0, LW, WATER_Y); }
    if (!th.storm && !th.lanka) drawBirds(th);
    return;
  }
  const g = ctx.createLinearGradient(0, 0, 0, WATER_Y);
  g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, LW, WATER_Y + 2);
  if (th.night) {
    ctx.fillStyle = "#fff";
    starsBG.forEach(s => { ctx.globalAlpha = (th.lanka ? 0.2 : 0.45) + 0.4 * Math.sin(time * 1.6 + s.p) * (th.lanka ? 0.4 : 1); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); });
    ctx.globalAlpha = 1;
  }
  ctx.save();
  ctx.shadowColor = th.sun; ctx.shadowBlur = th.lanka ? 60 : 34;
  ctx.fillStyle = th.sun; ctx.beginPath(); ctx.arc(th.sunX, th.sunY, th.night && !th.lanka ? 24 : 32, 0, TAU); ctx.fill();
  ctx.restore();
  if (!th.night && !th.storm) {
    ctx.save();
    ctx.translate(th.sunX, th.sunY); ctx.rotate(time * 0.05);
    ctx.fillStyle = "rgba(255,215,106,.12)";
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(165, -9); ctx.lineTo(165, 9); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  if (th.night && !th.lanka) { ctx.fillStyle = th.sky[0]; ctx.beginPath(); ctx.arc(th.sunX + 13, th.sunY - 7, 20, 0, TAU); ctx.fill(); }
  ctx.fillStyle = th.storm ? "rgba(70,80,95,.85)" : th.lanka ? "rgba(60,20,30,.55)" : th.night ? "rgba(200,215,235,.16)" : "rgba(255,255,255,.85)";
  clouds.forEach(c => {
    const x = ((c.x + time * c.v * (th.storm ? 3 : 1)) % (LW + 220)) - 110;
    ctx.beginPath();
    ctx.ellipse(x, c.y, 44 * c.s, 15 * c.s, 0, 0, TAU);
    ctx.ellipse(x + 30 * c.s, c.y + 4 * c.s, 32 * c.s, 12 * c.s, 0, 0, TAU);
    ctx.ellipse(x - 32 * c.s, c.y + 5 * c.s, 28 * c.s, 11 * c.s, 0, 0, TAU);
    ctx.fill();
  });
  if (th.storm && Math.sin(time * 0.7) > 0.985) { ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(0, 0, LW, WATER_Y); }
  if (!th.storm && !th.lanka) {
    ctx.strokeStyle = th.night ? "rgba(220,230,245,.4)" : "rgba(40,70,95,.45)";
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      const bx = ((time * 14 + i * 260) % (LW + 80)) - 40, by = 92 + i * 34 + Math.sin(time * 2 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(bx - 8, by); ctx.quadraticCurveTo(bx - 3, by - 6, bx, by);
      ctx.quadraticCurveTo(bx + 3, by - 6, bx + 8, by); ctx.stroke();
    }
  }
}
function drawRavana(th, px, py) {
  // gọi từ bờ vẽ tay (ảnh bờ chưa tải xong) thì không có toạ độ → đặt trên đỉnh cung điện
  if (px == null) px = X1 + 76;
  if (py == null) py = WATER_Y - 168;
  if (RAVANA_IMG.complete && RAVANA_IMG.naturalWidth) {
    // chân dung Ravana hiện mờ ảo trên trời Lanka, hào quang đỏ nhấp nháy
    const cx = px, cy = py - 70 + Math.sin(time * 1.1) * 4, sz = 132;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, sz * 0.8);
    glow.addColorStop(0, "rgba(255,80,30," + (0.35 + 0.15 * pulse) + ")"); glow.addColorStop(1, "rgba(255,80,30,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, sz * 0.8, 0, TAU); ctx.fill();
    ctx.save();
    ctx.globalAlpha = (0.5 + 0.12 * pulse) * (demon && demon.boss ? 0.4 : 1);   // lùi lại khi tướng quỷ xuất trận
    ctx.beginPath(); ctx.ellipse(cx, cy, sz * 0.5, sz * 0.46, 0, 0, TAU); ctx.clip();
    ctx.drawImage(RAVANA_IMG, cx - sz / 2, cy - sz / 2, sz, sz);
    ctx.restore();
    return;
  }
  // bóng quỷ vương mười đầu trên đỉnh cung điện
  const cx = px != null ? px : X1 + 76, cy = (py != null ? py : WATER_Y - 168) + Math.sin(time * 1.3) * 2;
  const glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, 90);
  glow.addColorStop(0, "rgba(255,90,40,.45)"); glow.addColorStop(1, "rgba(255,90,40,0)");
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, 90, 0, TAU); ctx.fill();
  ctx.fillStyle = "#14070c";
  ctx.beginPath(); ctx.moveTo(cx - 20, cy + 40); ctx.quadraticCurveTo(cx, cy + 4, cx + 20, cy + 40); ctx.closePath(); ctx.fill();
  for (let i = -4; i <= 4; i++) {
    const hx = cx + i * 7.5, hy = cy - Math.abs(i) * 1.6 + (i === 0 ? -3 : 0), r = i === 0 ? 7.5 : 5.5;
    ctx.fillStyle = "#14070c"; ctx.beginPath(); ctx.arc(hx, hy, r, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ffcf4a"; ctx.fillRect(hx - r * 0.7, hy - r - 3, r * 1.4, 3);
    ctx.fillStyle = "rgba(255,70,40," + (0.6 + 0.4 * Math.sin(time * 5 + i)) + ")";
    ctx.fillRect(hx - 2.6, hy - 1, 1.6, 1.6); ctx.fillRect(hx + 1, hy - 1, 1.6, 1.6);
  }
}
function drawShores(th) {
  if (IMG.india && IMG.lanka && (!th.lanka || IMG.lankaNight)) {
    const lk = th.lanka ? "lankaNight" : "lanka";
    drawShoreImg(lk, th.lanka ? null : th.tint);
    if (L.fire) { const d = ART.bg[lk]; drawRavana(th, d.x + d.w * 0.45, d.y - 22); }
    drawShoreImg("india", th.tint);
    return;
  }
  ctx.fillStyle = th.lanka ? "#2a1218" : th.night ? "#12293e" : "#7a8b5a";
  ctx.beginPath();
  ctx.moveTo(X1 - 6, WATER_Y + 4);
  ctx.quadraticCurveTo(X1 + 46, WATER_Y - 66, LW, WATER_Y - 58);
  ctx.lineTo(LW, WATER_Y + 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = th.lanka ? "#1a0a10" : th.night ? "#0b1c2c" : "#54683f";
  ctx.beginPath();
  ctx.moveTo(X1 + 34, WATER_Y - 40);
  ctx.lineTo(X1 + 52, WATER_Y - 96); ctx.lineTo(X1 + 66, WATER_Y - 96); ctx.lineTo(X1 + 70, WATER_Y - 118);
  ctx.lineTo(X1 + 84, WATER_Y - 118); ctx.lineTo(X1 + 88, WATER_Y - 96); ctx.lineTo(X1 + 104, WATER_Y - 96);
  ctx.lineTo(X1 + 118, WATER_Y - 40); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(X1 + 76, WATER_Y - 118, 11, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(X1 + 59, WATER_Y - 96, 8, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(X1 + 95, WATER_Y - 96, 8, Math.PI, 0); ctx.fill();
  ctx.fillRect(X1 + 74.5, WATER_Y - 140, 3, 12);
  if (th.night) { ctx.fillStyle = th.lanka ? "#ff7a3a" : "#ffd166"; ctx.fillRect(X1 + 62, WATER_Y - 84, 4, 5); ctx.fillRect(X1 + 88, WATER_Y - 84, 4, 5); ctx.fillRect(X1 + 74, WATER_Y - 106, 4, 6); }
  if (L.fire) drawRavana(th);
  ctx.fillStyle = th.night ? "#1a2f42" : "#9c7a4e";
  ctx.beginPath();
  ctx.moveTo(0, LH); ctx.lineTo(0, 452);
  ctx.quadraticCurveTo(60, 436, 128, 444);
  ctx.quadraticCurveTo(168, 448, X0 + 6, 458);
  ctx.lineTo(X0 + 6, LH); ctx.closePath(); ctx.fill();
  ctx.fillStyle = th.night ? "#132636" : "#86643c";
  ctx.beginPath();
  ctx.moveTo(0, 470); ctx.quadraticCurveTo(80, 456, X0 + 6, 470); ctx.lineTo(X0 + 6, LH); ctx.lineTo(0, LH); ctx.closePath(); ctx.fill();
  const gx = 26, gy = 448;
  ctx.fillStyle = th.night ? "#0d1f30" : "#5f4630";
  const tiers = [[64, 34], [52, 30], [40, 26], [28, 22]];
  let ty = gy;
  tiers.forEach(t => { ty -= t[1]; ctx.fillRect(gx + (64 - t[0]) / 2, ty, t[0], t[1]); });
  ctx.beginPath(); ctx.arc(gx + 32, ty - 4, 9, Math.PI, 0); ctx.fill();
  ctx.fillRect(gx + 30.5, ty - 22, 3, 12);
  ctx.fillStyle = "#e9a13b"; ctx.beginPath(); ctx.arc(gx + 32, ty - 24, 3.4, 0, TAU); ctx.fill();
  // cờ nghệ trên tháp đền
  ctx.fillStyle = "#ef7d1f";
  ctx.beginPath(); ctx.moveTo(gx + 33, ty - 22); ctx.quadraticCurveTo(gx + 44, ty - 20 + Math.sin(time * 5) * 2, gx + 54, ty - 18); ctx.lineTo(gx + 33, ty - 12); ctx.closePath(); ctx.fill();
  drawPalm(140, 452, 1, th); drawPalm(896, WATER_Y - 52, 0.8, th);
}
function drawPalm(x, y, s, th) {
  ctx.strokeStyle = th.night ? "#0e2436" : "#6d5133"; ctx.lineWidth = 5 * s; ctx.lineCap = "round";
  const sway = th.storm ? Math.sin(time * 3) * 6 : 0;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8 * s, y - 26 * s, x + 20 * s + sway * 0.3, y - 40 * s); ctx.stroke();
  ctx.strokeStyle = th.night ? "#123148" : "#4e7d3a"; ctx.lineWidth = 3.4 * s;
  const tx = x + 20 * s + sway * 0.3, tyy = y - 40 * s;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.08 + i * 0.17);
    ctx.beginPath(); ctx.moveTo(tx, tyy);
    ctx.quadraticCurveTo(tx + Math.cos(a) * 20 * s + sway, tyy - Math.sin(a) * 16 * s - 4, tx + Math.cos(a) * 34 * s + sway, tyy - Math.sin(a) * 10 * s + 8 * s);
    ctx.stroke();
  }
}
function drawSea(th, t) {
  const sky = IMG["sky" + L.theme];
  if (sky) {
    // phản chiếu bầu trời (lật dọc, mờ) để mặt nước ăn tông với tranh
    ctx.save();
    ctx.beginPath(); ctx.rect(0, WATER_Y - 4, LW, LH - WATER_Y + 4); ctx.clip();   // chỉ trong vùng nước
    ctx.translate(0, WATER_Y * 2); ctx.scale(1, -1);                             // gương qua đường chân trời
    ctx.globalAlpha = 0.5;
    const pan = Math.sin(time * 0.05) * 14, w = LW + 36;
    ctx.drawImage(sky, -18 + pan, 0, w, w * sky.height / sky.width);
    ctx.restore();
  }
  const amp = th.storm ? 1.8 : 1;
  const layers = [
    { amp: 3.2 * amp, len: 0.021, sp: 1.15, col: th.sea[0], off: 0 },
    { amp: 4.2 * amp, len: 0.016, sp: -0.8, col: th.sea[1], off: 7 },
    { amp: 2.4 * amp, len: 0.03, sp: 1.7, col: th.lanka ? "rgba(255,120,60,.12)" : "rgba(255,255,255,.13)", off: 13 }
  ];
  layers.forEach((ly, li) => {
    ctx.globalAlpha = sky ? [0.58, 0.68, 1][li] : 1;
    ctx.fillStyle = ly.col; ctx.beginPath();
    ctx.moveTo(0, LH);
    for (let x = 0; x <= LW; x += 8) {
      const y = WATER_Y + ly.off + Math.sin(x * ly.len + t * ly.sp) * ly.amp + Math.sin(x * 0.006 - t * 0.6) * ly.amp * 0.6;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(LW, LH); ctx.closePath(); ctx.fill();
  });
  ctx.globalAlpha = 1;
  // nước sâu tối dần về phía dưới
  const deep = ctx.createLinearGradient(0, WATER_Y, 0, LH);
  deep.addColorStop(0, "rgba(5,10,30,0)"); deep.addColorStop(1, "rgba(5,10,30,.38)");
  ctx.fillStyle = deep; ctx.fillRect(0, WATER_Y, LW, LH - WATER_Y);
  ctx.fillStyle = th.lanka ? "rgba(255,110,60,.18)" : "rgba(255,220,140,.16)";
  for (let i = 0; i < 12; i++) {
    const gx = th.sunX + Math.sin(i * 3.7 + t * 1.3) * (14 + i * 5);
    const gy = WATER_Y + 14 + i * 10;
    ctx.fillRect(gx - (10 + i * 2), gy, 20 + i * 4, 2.4);
  }
}
function drawWeather(th, dt) {
  if (th.storm) {
    ctx.strokeStyle = "rgba(210,225,240,.35)"; ctx.lineWidth = 1.2;
    ctx.beginPath();
    rain.forEach(r => {
      r.y += r.v * dt; r.x += (wind * 0.4 - 60) * dt;
      if (r.y > LH) { r.y = -10; r.x = rand(0, LW + 100); }
      if (r.x < -20) r.x = LW + 10;
      ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 4, r.y + 13);
    });
    ctx.stroke();
  }
  if (th.lanka) {
    if (embers.length < 40 && Math.random() < 0.5) embers.push({ x: rand(X1 - 40, LW), y: WATER_Y - rand(20, 120), vx: rand(-40, -10), vy: rand(-40, -15), t: 0, life: rand(2, 4) });
    embers = embers.filter(e => e.t < e.life);
    embers.forEach(e => {
      e.t += dt; e.x += e.vx * dt; e.y += e.vy * dt;
      ctx.globalAlpha = 1 - e.t / e.life; ctx.fillStyle = "#ff9a4a";
      ctx.fillRect(e.x, e.y, 2.2, 2.2);
    });
    ctx.globalAlpha = 1;
  }
}
function stoneRGB() { return (STONE_SKINS.find(s => s.id === SAVE.stoneSkin) || STONE_SKINS[0]).rgb; }
function drawStoneShape(x, y, w, h, golden, seed) {
  const shade = 8 + ((seed * 37) % 14);
  if (golden) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "#ffd873"); g.addColorStop(1, "#dfa02e");
    ctx.fillStyle = g;
  } else {
    const c = stoneRGB();
    ctx.fillStyle = "rgb(" + (c[0] - shade) + "," + (c[1] - shade) + "," + (c[2] - shade) + ")";
  }
  rr(x, y, w, h, 7); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.20)";
  rr(x + 3, y + 2.5, w - 6, h * 0.34, 5); ctx.fill();
  // khắc tên Rama (राम) lên đá
  if (w >= 20 && h >= 16) {
    ctx.fillStyle = golden ? "rgba(140,80,0,.85)" : "rgba(40,30,20,.35)";
    ctx.font = "700 " + Math.min(13, h * 0.5) + "px 'Noto Sans Devanagari', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("राम", x + w / 2, y + h * 0.6);
    ctx.textBaseline = "alphabetic";
  }
}
function drawBridge(t) {
  const w = slotW();
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i], x = X0 + i * w;
    let yCursor = BASE_Y;
    s.stones.forEach(st => {
      const h = st.u * STONE_H - 3;
      yCursor -= st.u * STONE_H;
      drawStoneShape(x + 3, yCursor + 1.5, w - 6, h, st.golden, st.seed + i * 7);
    });
    if (s.done) {
      const dy = deckY();
      ctx.fillStyle = "#7d6647"; rr(x + 1, dy - 9, w - 2, 10, 4); ctx.fill();
      ctx.fillStyle = "#a5854f"; rr(x + 1, dy - 9, w - 2, 4.5, 3); ctx.fill();
      ctx.strokeStyle = "rgba(60,40,18,.35)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + w / 2, dy - 8); ctx.lineTo(x + w / 2, dy); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.35)";
      const fw = 8 + Math.sin(t * 2.2 + i * 1.7) * 3;
      ctx.beginPath(); ctx.ellipse(x + w / 2, WATER_Y + 6, fw + w * 0.24, 3.4, 0, 0, TAU); ctx.fill();
    } else if (s.units > 0) {
      ctx.fillStyle = "rgba(255,255,255,.28)";
      ctx.beginPath(); ctx.ellipse(x + w / 2, WATER_Y + 5, w * 0.3, 3, 0, 0, TAU); ctx.fill();
    }
    if (state === "aim" && i === contiguous() && !s.done) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.6;
      rr(x + 3, deckY() - 2, w - 6, BASE_Y - deckY(), 7); ctx.stroke();
      ctx.restore();
    }
  }
}
function drawRing(t) {
  if (!ring) return;
  const pulse = 1 + Math.sin(t * 4) * 0.07;
  ctx.save();
  ctx.translate(ring.x, ring.y + Math.sin(t * 1.8) * 5);
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 5;
  ctx.shadowColor = "#ffd166"; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(0, 0, ring.r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, ring.r - 5, 0, TAU); ctx.stroke();
  ctx.restore();
}
/* Sprite ảnh minh họa (nếu khai báo trong ART.monkey) — nạp nền, lỗi thì giữ hình vẽ bằng code */
const SPRITES = {}, POSES = {};
function loadSprite(def, done) { const im = new Image(); im.onload = () => done(Object.assign({ img: im }, def)); im.src = def.src; }
Object.keys(ART.monkey).forEach(id => {
  const a = ART.monkey[id];
  loadSprite(a, sp => { SPRITES[id] = sp; });
  ["windup", "throw"].forEach(p => { if (a[p]) loadSprite(a[p], sp => { POSES[id + ":" + p] = sp; }); });
});
let throwPoseT = 0;   // thời gian còn hiển thị tư thế vung tay
const THROW_POSE = 0.42;

/* ---------- Hoạt ảnh nhân vật sprite: hòa trộn khung + quán tính ---------- */
const MA = { cur: "stand", prev: null, b: 1, dur: 0.1, power: 0, stone: null, stoneK: 1, stoneIn: 1, swoosh: null };
const POSE_BLEND = { "stand>windup": 0.08, "windup>throw": 0.05, "stand>throw": 0.05, "throw>stand": 0.12, "windup>stand": 0.1 };
function poseTarget() { return (drag || spaceCharge) && state === "aim" ? "windup" : throwPoseT > 0 ? "throw" : "stand"; }
function poseFrame(id, name) { return (name !== "stand" && POSES[id + ":" + name]) || SPRITES[id]; }
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
function poseXform(name, t) {
  if (name === "windup") {
    const p = MA.power;   // kéo càng mạnh càng ngả & khuỵu
    return { dx: -3.5 * p, lean: -0.03 - 0.07 * p, sx: 1 + 0.035 * p, sy: 1 - 0.045 * p };
  }
  if (name === "throw") {
    const f = 1 - clamp(throwPoseT / THROW_POSE, 0, 1);            // 0 → 1 theo thời gian
    const a = f < 0.22 ? easeOut(f / 0.22) : 1 - easeOut((f - 0.22) / 0.78);  // lao nhanh rồi trả chậm
    return { dx: 8 * a, lean: 0.08 * a, sx: 1 + 0.05 * a, sy: 1 - 0.035 * a };
  }
  const br = Math.sin(t * 2.4);                                      // thở nhẹ khi đứng
  return { dx: 0, lean: 0, sx: 1 - 0.006 * br, sy: 1 + 0.012 * br };
}
function applyXform(x) { ctx.translate(x.dx, 0); ctx.rotate(x.lean); ctx.scale(x.sx, x.sy); }
function drawPose(fr, x, alpha) {
  if (alpha <= 0.01) return;
  ctx.save(); ctx.globalAlpha = alpha; applyXform(x);
  ctx.drawImage(fr.img, -fr.ax, -fr.ay, fr.w, fr.h);
  ctx.restore();
}
function updateMonkeyAnim(dt) {
  const tg = poseTarget();
  if (tg !== MA.cur) { MA.prev = MA.cur; MA.cur = tg; MA.b = 0; MA.dur = POSE_BLEND[MA.prev + ">" + tg] || 0.1; }
  MA.b = Math.min(1, MA.b + dt / MA.dur);
  let p = 0;
  if (drag && state === "aim") { const v = dragVelocity(); p = clamp(Math.hypot(v.x, v.y) / 1080, 0, 1); }
  else if (spaceCharge && state === "aim") p = clamp((spaceCharge.power - 340) / 700, 0, 1);
  MA.power += (p - MA.power) * Math.min(1, dt * 14);
  MA.stoneK = dt * 22;
  if (MA.stoneIn < 1) MA.stoneIn += dt / 0.18;
  if (MA.swoosh) { MA.swoosh.t -= dt; if (MA.swoosh.t <= 0) MA.swoosh = null; }
}
function drawSwoosh() {
  const sw = MA.swoosh; if (!sw) return;
  const k = sw.t / sw.life, a = sw.a, b = sw.b;
  const cx = (a.x + b.x) / 2 - 6, cy = Math.min(a.y, b.y) - 38;
  ctx.save(); ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,236,190," + (0.35 * k) + ")"; ctx.lineWidth = 12 * k;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cx, cy, b.x, b.y); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255," + (0.8 * k) + ")"; ctx.lineWidth = 3.5 * k;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cx, cy, b.x, b.y); ctx.stroke();
  ctx.restore();
}
/* Vị trí bàn tay cầm đá (tọa độ game): theo sprite nếu có, ngược lại theo hình vẽ code */
function handPos(m, pose) {
  const spr = SPRITES[SAVE.skin];
  if (!spr) return { x: m.x + 16, y: m.y - 44 };
  const wu = POSES[SAVE.skin + ":windup"];
  if (wu && (pose === "windup" || (pose == null && (drag || spaceCharge)))) return { x: m.x - wu.ax + wu.hx, y: m.y - wu.ay + wu.hy - 2 };
  return { x: m.x - spr.ax + spr.hx, y: m.y - spr.ay + spr.hy - 4 };
}
/* Điểm buông đá = bàn tay phía trước ở tư thế vung (nếu có ảnh) */
function releasePos(m) {
  const th = POSES[SAVE.skin + ":throw"];
  if (!th || th.rx == null || !SPRITES[SAVE.skin]) return null;
  return { x: m.x - th.ax + th.rx, y: m.y - th.ay + th.ry };
}
function curSkin() { return SKINS.find(s => s.id === SAVE.skin) || SKINS[0]; }
function drawMonkey(m, t) {
  const sk = curSkin();
  const bob = state === "aim" && !drag ? Math.sin(t * 2.4) * 1.6 : 0;
  const hop = hopT > 0 ? Math.sin((0.45 - hopT) / 0.45 * Math.PI) * 15 : 0;
  const x = m.x, y = m.y + bob - hop;
  ctx.fillStyle = "rgba(20,30,20,.20)";
  ctx.beginPath(); ctx.ellipse(m.x, m.y + 2.5, 25 - hop * 0.35, 5, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(x, y);
  const spr = SPRITES[sk.id];
  if (spr) {
    const cur = poseFrame(sk.id, MA.cur), xc = poseXform(MA.cur, t);
    // hòa trộn: khung cũ mờ dần, khung mới hiện nhanh để thân không bị "trong suốt"
    // khung mới hiện gần như ngay (alpha tăng nhanh), khung cũ tắt theo bình phương → hạn chế bóng mờ chồng hình
    if (MA.prev && MA.b < 1) drawPose(poseFrame(sk.id, MA.prev), poseXform(MA.prev, t), Math.pow(1 - MA.b, 2));
    drawPose(cur, xc, Math.min(1, MA.b * 2.5));
    if (state === "aim" && !flying && MA.cur !== "throw") {
      const tgt = { x: cur.hx - cur.ax, y: cur.hy - cur.ay - (MA.cur === "windup" ? 2 : 4) };
      if (!MA.stone) { MA.stone = tgt; MA.stoneIn = 0; }
      else { const k = Math.min(1, MA.stoneK); MA.stone = { x: MA.stone.x + (tgt.x - MA.stone.x) * k, y: MA.stone.y + (tgt.y - MA.stone.y) * k }; }
      const gs = nextIsGolden();
      ctx.save(); applyXform(xc); ctx.translate(MA.stone.x, MA.stone.y);
      const pop = easeOut(Math.min(1, MA.stoneIn));   // viên đá mới phóng to dần vào tay
      ctx.scale(pop, pop);
      drawStoneShape(-(gs ? 12 : 10), -(gs ? 14 : 11), gs ? 24 : 20, gs ? 28 : 22, gs, 3);
      ctx.restore();
    } else MA.stone = null;
    ctx.restore();
    return;
  }
  drawMonkeyBody(sk, t);
  let armA, handX = 16, handY = -30;
  if (drag && dragStart) {
    const pp = pullPoint(), dx = pp.x - x, dy = pp.y - (y - 38);
    armA = Math.atan2(dy, dx);
    handX = Math.cos(armA) * 20; handY = -38 + Math.sin(armA) * 20;
  } else if (throwAnim > 0) {
    const p = 1 - throwAnim / 0.28;
    armA = -1.2 + p * 1.9; handX = Math.cos(armA) * 21; handY = -38 + Math.sin(armA) * 21;
  }
  ctx.strokeStyle = sk.fur; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(8, -34); ctx.lineTo(handX, handY); ctx.stroke();
  if (state === "aim" && !flying) {
    const gs = nextIsGolden();
    ctx.save(); ctx.translate(handX, handY - 6);
    drawStoneShape(-(gs ? 13 : 11), -(gs ? 15 : 12), gs ? 26 : 22, gs ? 30 : 24, gs, 3);
    ctx.restore();
  }
  ctx.restore();
}
function drawMonkeyBody(sk, t) {
  if (sk.acc === "mace") {
    // chùy gada của Hanuman đeo sau lưng
    ctx.strokeStyle = "#8a5a1c"; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(-4, -10); ctx.lineTo(-20, -52); ctx.stroke();
    ctx.fillStyle = "#e9b23a"; ctx.beginPath(); ctx.arc(-21, -56, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = "#b8791c"; ctx.fillRect(-29, -57, 16, 2.5);
  }
  ctx.fillStyle = sk.scarf;
  ctx.beginPath();
  ctx.moveTo(-5, -39);
  ctx.quadraticCurveTo(-16, -37 + Math.sin(t * 5.2) * 2.4, -24, -33 + Math.sin(t * 5.2 + 0.7) * 3);
  ctx.quadraticCurveTo(-15, -31, -6, -31.5);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = sk.dark; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-10, -16);
  ctx.quadraticCurveTo(-26, -12 + Math.sin(t * 3) * 2, -24, -30 + Math.sin(t * 3) * 3); ctx.stroke();
  ctx.fillStyle = sk.dark;
  ctx.beginPath(); ctx.ellipse(-7, -3, 7, 4.5, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8, -3, 7, 4.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = sk.fur;
  ctx.beginPath(); ctx.ellipse(0, -22, 15, 18, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = sk.belly;
  ctx.beginPath(); ctx.ellipse(2, -19, 9.5, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = sk.fur;
  ctx.beginPath(); ctx.arc(3, -50, 14.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(-10, -52, 5.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(16, -52, 5.5, 0, TAU); ctx.fill();
  ctx.fillStyle = sk.face;
  ctx.beginPath(); ctx.arc(-10, -52, 2.8, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(16, -52, 2.8, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4, -47, 10, 8.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = "#2b1c10";
  ctx.beginPath(); ctx.arc(0.5, -50, 1.9, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(8.5, -50, 1.9, 0, TAU); ctx.fill();
  ctx.fillStyle = "rgba(232,110,90,.45)";
  ctx.beginPath(); ctx.arc(-2.5, -44.5, 2.7, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(11.5, -44.5, 2.7, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#2b1c10"; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(4.5, -43.5, 3.4, 0.25, Math.PI - 0.6); ctx.stroke();
  ctx.fillStyle = sk.band; ctx.fillRect(-11.5, -60, 29, 5.5);
  ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(3, -57.2, 2.6, 0, TAU); ctx.fill();
  if (sk.acc === "crown" || sk.acc === "mace") {
    ctx.fillStyle = "#f2b84b";
    ctx.beginPath(); ctx.moveTo(-9, -60); ctx.lineTo(-7, -70); ctx.lineTo(-2, -64); ctx.lineTo(3, -73); ctx.lineTo(8, -64); ctx.lineTo(13, -70); ctx.lineTo(15, -60); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#d9483b"; ctx.beginPath(); ctx.arc(3, -64, 1.8, 0, TAU); ctx.fill();
  }
}
function drawTutorial() {
  // gợi ý thao tác ở màn đầu tiên
  if (!(mode === "story" && levelIdx === 0 && throwCount === 0 && state === "aim" && !drag)) return;
  const m = monkeyPos();
  const p = (time % 1.6) / 1.6;
  const h0 = handPos(m), hx = h0.x - p * 70, hy = h0.y + p * 55;
  ctx.save();
  ctx.globalAlpha = 0.9 * (1 - Math.max(0, p - 0.8) * 5);
  ctx.font = "34px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("👆", hx, hy + 20);
  ctx.restore();
  ctx.font = "800 15px 'Be Vietnam Pro', 'Noto Sans Devanagari', sans-serif"; ctx.textAlign = "left";
  ctx.lineWidth = 4; ctx.strokeStyle = "rgba(20,35,50,.7)"; ctx.fillStyle = "#fff";
  ctx.strokeText(t("tut_drag"), m.x + 40, m.y - 130);
  ctx.fillText(t("tut_drag"), m.x + 40, m.y - 130);
}
function drawAim() {
  if (!drag || state !== "aim") return;
  const m = monkeyPos();
  const v = dragVelocity();
  ctx.strokeStyle = "rgba(90,55,20,.75)"; ctx.lineWidth = 3;
  const pp = pullPoint();
  ctx.beginPath(); ctx.moveTo(v.gx, v.gy); ctx.lineTo(pp.x, pp.y); ctx.stroke();
  ctx.fillStyle = "#5f4630"; ctx.beginPath(); ctx.arc(pp.x, pp.y, 6, 0, TAU); ctx.fill();
  // quỹ đạo dự đoán: mặc định không tính gió; "Mắt Rama" tính cả gió và vẽ dài hơn
  const power = clamp(Math.hypot(v.x, v.y) / 1080, 0, 1);
  const sight = eff.sight > 0;
  let px = v.hx, py = v.hy, vx = v.x, vy = v.y;
  const dt = 0.045, n = sight ? 40 : 17;
  ctx.fillStyle = sight ? "#9be8ff" : power > 0.8 ? "#ff8c5a" : power > 0.5 ? "#ffd166" : "rgba(255,255,255,.9)";
  for (let i = 0; i < n; i++) {
    vy += GRAV * dt; if (sight) vx += wind * dt;
    px += vx * dt; py += vy * dt;
    if (py > WATER_Y + 20) break;
    ctx.globalAlpha = sight ? 0.95 - i * 0.015 : 0.9 - i * 0.045;
    ctx.beginPath(); ctx.arc(px, py, sight ? 3.4 : 3.6 - i * 0.09, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const up = SPRITES[SAVE.skin] ? 18 : 0;   // sprite cao hơn hình vẽ code
  ctx.fillStyle = "rgba(10,25,38,.55)"; rr(m.x - 30, m.y - 96 - up, 84, 11, 5.5); ctx.fill();
  ctx.fillStyle = power > 0.85 ? "#e4572e" : "#ffd166"; rr(m.x - 28, m.y - 94 - up, 80 * power, 7, 3.5); ctx.fill();
  ctx.font = "800 11px 'Be Vietnam Pro', 'Noto Sans Devanagari', sans-serif";
  ctx.textAlign = "left"; ctx.fillStyle = "#fff";
  ctx.fillText(Math.round(power * 100) + "%", m.x + 59, m.y - 86 - up);
}
function drawFlying() {
  if (!flying) return;
  ctx.save(); ctx.translate(flying.x, flying.y); ctx.rotate(flying.rot);
  const s = flying.golden ? 15 : 12.5;
  drawStoneShape(-s, -s * (flying.golden ? 1.15 : 0.95), s * 2, s * (flying.golden ? 2.3 : 1.9), flying.golden, flying.seed);
  ctx.restore();
  if (flying.golden) { ctx.fillStyle = "rgba(255,209,102,.5)"; ctx.beginPath(); ctx.arc(flying.x, flying.y, 24 + Math.sin(time * 10) * 3, 0, TAU); ctx.fill(); }
}
function drawParticles(dt) {
  particles = particles.filter(p => p.t < p.life);
  particles.forEach(p => {
    p.t += dt; p.vy += (p.grav || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col;
    if (p.rect) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rot || 0) + p.t * (p.vr || 0));
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66); ctx.restore();
    } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); }
  });
  ctx.globalAlpha = 1;
  floaters = floaters.filter(f => f.t < f.life);
  floaters.forEach(f => {
    f.t += dt; f.y -= 34 * dt;
    ctx.globalAlpha = 1 - f.t / f.life;
    ctx.font = "800 17px 'Be Vietnam Pro', 'Noto Sans Devanagari', sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 4; ctx.strokeStyle = "rgba(20,35,50,.65)";
    ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.col; ctx.fillText(f.text, f.x, f.y);
  });
  ctx.globalAlpha = 1;
}
function drawGull(t) {
  if (!gull) return;
  const flap = Math.sin(t * 9) * 0.55;
  const body = THEMES[L.theme].night ? "#c9d6e2" : "#ffffff";
  ctx.save();
  ctx.translate(gull.x, gull.y + Math.sin(t * 2.2) * 4);
  ctx.scale(gull.dir, 1);
  if (IMG.gull) {
    // ảnh tĩnh: co giãn theo nhịp vỗ cánh
    const w = 54, hh = w * IMG.gull.height / IMG.gull.width, f = 1 + Math.sin(t * 9) * 0.14;
    ctx.scale(1, f);
    if (THEMES[L.theme].night) ctx.filter = "brightness(.75)";
    ctx.drawImage(IMG.gull, -w / 2, -hh / 2, w, hh);
    ctx.restore();
    return;
  }
  ctx.strokeStyle = body; ctx.lineWidth = 4.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-2, -2); ctx.quadraticCurveTo(-12, -10 - flap * 8, -23, -5 - flap * 13); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(11, -12 - flap * 8, 21, -7 - flap * 13); ctx.stroke();
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-21, -4); ctx.lineTo(-20, 3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, 15, 6.5, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(13, -4, 5.5, 0, TAU); ctx.fill();
  ctx.fillStyle = "#e07b24";
  ctx.beginPath(); ctx.moveTo(17, -5); ctx.lineTo(25, -3); ctx.lineTo(17, -1.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#22303c";
  ctx.beginPath(); ctx.arc(14.5, -5, 1.3, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawMakara(t) {
  if (!makara || makara.h <= 0.02) return;
  const x = slotCX(makara.slot), h = makara.h;
  const y = WATER_Y + 16 - 46 * h;
  const jaw = 0.35 + Math.sin(t * 6) * 0.15;
  ctx.save(); ctx.translate(x, y);
  // cảnh báo vùng
  ctx.fillStyle = "rgba(255,80,60," + (0.15 + 0.1 * Math.sin(t * 8)) + ")";
  ctx.fillRect(-slotW() / 2 + 2, -120, slotW() - 4, 140);
  if (IMG.makara) {
    const w = Math.min(slotW() * 1.25, 74), hh = w * IMG.makara.height / IMG.makara.width;
    ctx.rotate(Math.sin(t * 3) * 0.05);
    ctx.drawImage(IMG.makara, -w / 2, 22 - hh, w, hh);
    ctx.restore();
    return;
  }
  ctx.fillStyle = "#2f7a5a";
  ctx.beginPath(); ctx.ellipse(0, 6, 20, 16, 0, 0, TAU); ctx.fill();
  // hàm trên
  ctx.save(); ctx.rotate(-jaw);
  ctx.fillStyle = "#3b9a6e"; ctx.beginPath(); ctx.ellipse(10, -4, 22, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = "#fff"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i * 8 - 2, 2); ctx.lineTo(i * 8 + 1, 8); ctx.lineTo(i * 8 + 4, 2); ctx.fill(); }
  ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(-2, -9, 4, 0, TAU); ctx.fill();
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(-1, -9, 1.8, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.rotate(jaw * 0.6);
  ctx.fillStyle = "#2f7a5a"; ctx.beginPath(); ctx.ellipse(10, 8, 20, 6, 0, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.restore();
}
function drawFireballs(t) {
  fireballs.forEach(fb => {
    // vạch cảnh báo dưới điểm rơi
    const i = clamp(Math.floor((fb.x - X0) / slotW()), 0, L.slots - 1);
    ctx.fillStyle = "rgba(255,90,40," + (0.25 + 0.2 * Math.sin(t * 10)) + ")";
    ctx.beginPath(); ctx.ellipse(slotCX(i), stackTopY(i) - 2, slotW() * 0.4, 4, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 5; k++) {
      ctx.globalAlpha = 0.5 - k * 0.09; ctx.fillStyle = k < 2 ? "#ffd166" : "#ff6a3d";
      ctx.beginPath(); ctx.arc(fb.x - fb.vx * k * 0.03, fb.y - fb.vy * k * 0.05, 13 - k * 1.6, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (IMG.fireball) {
      const w = 36 + Math.sin(t * 18) * 1.5, hh = w * IMG.fireball.height / IMG.fireball.width;
      ctx.drawImage(IMG.fireball, fb.x - w / 2, fb.y - hh * 0.74, w, hh);
      return;
    }
    const g = ctx.createRadialGradient(fb.x, fb.y, 2, fb.x, fb.y, 14);
    g.addColorStop(0, "#fff6c8"); g.addColorStop(0.5, "#ffb347"); g.addColorStop(1, "#e2401c");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fb.x, fb.y, 13 + Math.sin(t * 20) * 1.2, 0, TAU); ctx.fill();
  });
}
function drawFish() {
  const th = THEMES[L.theme];
  fishes.forEach(f => {
    const p = f.t / f.dur;
    const x = f.x + f.dir * p * f.len;
    const y = WATER_Y + 10 - Math.sin(p * Math.PI) * f.h;
    ctx.save(); ctx.translate(x, y); ctx.rotate(f.dir * (0.7 - p * 1.4)); ctx.scale(f.dir, 1);
    ctx.fillStyle = th.night ? "#b8c9d6" : "#f2a65a";
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 4.6, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-17, -5); ctx.lineTo(-17, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#22303c"; ctx.beginPath(); ctx.arc(6.5, -1, 1.2, 0, TAU); ctx.fill();
    ctx.restore();
  });
}
function drawWinFlag(t) {
  if (state !== "win") return;
  const fx = X1 + 26, fy = WATER_Y - 56;
  ctx.strokeStyle = "#5f4630"; ctx.lineWidth = 4; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(fx, fy + 58); ctx.lineTo(fx, fy); ctx.stroke();
  ctx.fillStyle = "#e07b24";
  ctx.beginPath(); ctx.moveTo(fx, fy);
  ctx.quadraticCurveTo(fx + 15, fy + 4 + Math.sin(t * 6) * 2.4, fx + 30, fy + 2);
  ctx.quadraticCurveTo(fx + 15, fy + 10 + Math.sin(t * 6 + 1) * 2.4, fx, fy + 13);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(fx + 11, fy + 6, 3, 0, TAU); ctx.fill();
}
function render(dt) {
  const th = THEMES[L.theme];
  ctx.save();
  if (shakeT > 0) { const m = shakeMag * (shakeT / 0.3); ctx.translate(rand(-m, m), rand(-m, m)); }
  else shakeMag = 0;
  drawSky(th);
  drawShores(th);
  drawSea(th, time);
  drawFish();
  drawBridge(time);
  drawMakara(time);
  drawBarrier(time);
  drawDemon(time);
  drawRing(time);
  drawWinFlag(time);
  drawGull(time);
  drawFireballs(time);
  drawMonkey(monkeyPos(), time);
  drawSwoosh();
  drawAim();
  drawTutorial();
  drawFlying();
  drawWeather(th, dt);
  drawParticles(dt);
  ctx.restore();
}

/* ================= Gameplay ================= */
/* Điểm viên đá rời tay: bàn tay vung phía trước nhưng không vượt quá ô cầu kế tiếp
   (màn nhiều ô, ô rất hẹp → nếu buông quá xa sẽ không thể ném vào ô gần nhất) */
function launchOrigin(m) {
  const o = releasePos(m) || handPos(m, "windup");
  const c = contiguous();
  if (c < slots.length) o.x = Math.min(o.x, slotCX(c) - slotW() * 0.25);
  return o;
}
/* Ná cao su: lực = khoảng kéo từ điểm bắt đầu chạm → điểm hiện tại (chạm ở đâu trên màn hình cũng được) */
function pullPoint() {
  const g = handPos(monkeyPos());
  return { x: g.x + (drag.x - dragStart.x), y: g.y + (drag.y - dragStart.y) };
}
function dragVelocity() {
  const m = monkeyPos(), grip = handPos(m), o = launchOrigin(m);
  let vx = (dragStart.x - drag.x) * 3.4, vy = (dragStart.y - drag.y) * 3.4;
  const sp = Math.hypot(vx, vy), max = 1080;
  if (sp > max) { vx *= max / sp; vy *= max / sp; }
  return { x: vx, y: vy, hx: o.x, hy: o.y, gx: grip.x, gy: grip.y };
}
/* Lực nhỏ nhất (góc ang, không gió) để đá rơi trúng giữa ô kế tiếp — dùng cho phím Space */
function minPowerToFrontier(ang) {
  const m = monkeyPos(), o = launchOrigin(m), c = Math.min(contiguous(), slots.length - 1);
  const tx = slotCX(c), top = stackTopY(c);
  let lo = 40, hi = 1080;
  for (let k = 0; k < 18; k++) {
    const p = (lo + hi) / 2;
    let x = o.x, y = o.y, vx = Math.cos(ang) * p, vy = -Math.sin(ang) * p;
    for (let n = 0; n < 400; n++) { vy += GRAV / 120; x += vx / 120; y += vy / 120; if (vy > 0 && y + 13 >= top) break; }
    if (x < tx) lo = p; else hi = p;
  }
  return (lo + hi) / 2;
}
function launch(vx, vy, hx, hy) {
  const golden = nextIsGolden();
  flying = { x: hx, y: hy, vx, vy, rot: 0, vr: rand(2, 5), golden, units: golden ? 2 : 1, seed: (Math.random() * 90) | 0, ringChecked: false, calm: eff.calm > 0 };
  if (eff.bless > 0) eff.bless--;
  if (eff.sight > 0) eff.sight--;
  if (eff.calm > 0) eff.calm--;
  stonesLeft--; throwCount++; SAVE.stats.throws++;
  state = "fly"; throwAnim = 0.28; throwPoseT = THROW_POSE;
  if (SPRITES[SAVE.skin] && POSES[SAVE.skin + ":throw"]) {
    const g = handPos(monkeyPos(), "windup");
    MA.swoosh = { a: g, b: { x: hx, y: hy }, t: 0.16, life: 0.16 };
  }
  sfx.throwIt();
  updateHUD();
}
function addCombo() {
  combo++; bestCombo = Math.max(bestCombo, combo);
  if (combo >= 2) sfx.combo(combo);
  if (combo > SAVE.stats.maxCombo) SAVE.stats.maxCombo = combo;
}
function landStone(i) {
  const s = slots[i], cx = slotCX(i);
  const st = flying;
  splash(cx, WATER_Y + 2, st.golden ? 16 : 10);
  if (demon && i >= demon.at) {
    floater(cx, WATER_Y - 80, t("f_barrier"), "#d8b4ff");
    splash(cx, WATER_Y, 12, "#c79bff"); sfx.splash(false); combo = 0; buzz(30);
    flying = null; updateHUD(); afterThrow(); return;
  }
  if (makara && makara.up && makara.slot === i && makara.h > 0.6) {
    floater(cx, WATER_Y - 80, t("f_makara"), "#9be8c0");
    sfx.chomp(); shake(3); combo = 0; buzz(40);
    flying = null; updateHUD(); afterThrow(); return;
  }
  if (s.done) {
    floater(cx, WATER_Y - 60, t("f_full"), "#ffb3a0");
    sfx.splash(true); combo = 0;
    flying = null; updateHUD(); afterThrow(); return;
  }
  const add = Math.min(st.units, L.need - s.units);
  s.stones.push({ u: add, golden: st.golden, seed: st.seed });
  s.units += add;
  addCombo();
  if (combo >= 3) floater(cx, deckY() - 56, t("f_combo", { n: combo }), "#ffb35c");
  if (st.golden) { sfx.golden(); floater(cx, stackTopY(i) - 16, t("f_gold2"), "#ffd166"); shake(3.5); buzz(25); }
  else { sfx.thud(); buzz(12); }
  if (s.units >= L.need && !s.done) {
    s.done = true;
    sparkle(cx, deckY() - 8, 18, "#ffd166");
    sfx.complete();
    floater(cx, deckY() - 30, t("f_slot_done"), "#c8f7dc");
    hopT = 0.45; shake(2.5); buzz([15, 40, 25]);
  }
  flying = null;
  updateHUD();
  if (slots.every(x => x.done)) { startWin(); return; }
  afterThrow();
}
function sinkStone() {
  if (!flying) return;
  splash(flying.x, WATER_Y + 2, 12);
  sfx.sink();
  floater(flying.x, WATER_Y - 46, combo >= 2 ? t("f_sink_combo", { n: combo }) : t("f_sink"), "#a9d8f2");
  combo = 0; shake(2);
  flying = null;
  updateHUD();
  afterThrow();
}
function afterThrow() {
  state = "aim";
  if (stonesLeft <= 0) { failTimer = 0.75; updateHUD(); return; }
  rollWind();
  const ringChance = L.ring || 0.38;
  if (!ring && Math.random() < ringChance) {
    const open = slots.map((s, i) => s.done ? -1 : i).filter(i => i >= 0);
    if (open.length) {
      const i = open[(Math.random() * open.length) | 0];
      ring = { x: slotCX(i) + rand(-8, 8), y: stackTopY(i) - rand(120, 185), r: 21, ttl: 3 };
    }
  } else if (ring) { ring.ttl--; if (ring.ttl <= 0) ring = null; }
  UI.checkAchievements();
  updateHUD();
}
function startWin() {
  state = "win"; fireballs = [];
  confetti(); sfx.win(); buzz([40, 60, 40, 60, 80]);
  winTimer = 1.0;
  persist();
  updateHUD();
}
/* ================= Quỷ Rakshasa canh cầu ================= */
function spawnDemon() {
  const q = demonQueue.shift(), c = contiguous();
  if (c >= slots.length) return;
  const sc = q.boss ? 1.7 : 1.2;
  // luôn cách khỉ ≥ 100px; hết chỗ ngang (ô cuối) thì bay lên xuống trên trời Lanka
  const mx = monkeyPos().x;
  const minX = Math.max(mx + 100, slotCX(c)), maxX = Math.min(905, Math.max(slotCX(Math.min(c + 2, slots.length - 1)) + 30, minX));
  const vert = maxX - minX < 70;
  const baseY = deckY() - (q.boss ? 70 : 48);
  demon = {
    at: c, hp: q.hp, maxHp: q.hp, boss: q.boss, minX, maxX, vert, baseY,
    x: vert ? Math.min(905, minX + 10) : minX, y: baseY, dir: 1,
    speed: (q.boss ? 26 : 34 + Math.max(0, L.ch) * 12) * (SAVE.diff === 2 ? 1.25 : 1),
    appearT: 0.6, hitT: 0, shield: false, shT: rand(1.5, 2.5), healT: 8, sc
  };
  explode(demon.x, demon.y - 30 * sc); sparkle(demon.x, demon.y - 30 * sc, 24, "#c79bff");
  floater(LW / 2, 150, t("f_demon_appear"), "#d8b4ff");
  if (!SAVE.stats.demons) floater(LW / 2, 178, t("f_demon_tip"), "#ffe6a8");
  sfx.demonAppear(); shake(4); buzz([30, 40, 30]);
}
function updateDemon(dt) {
  if (!demon && demonQueue.length && contiguous() >= demonQueue[0].at && state !== "win") spawnDemon();
  const d = demon; if (!d) return;
  if (d.appearT > 0) { d.appearT -= dt; return; }
  if (d.hitT > 0) d.hitT -= dt;
  if (d.vert) {                    // bay lên xuống
    d.y += d.dir * d.speed * 0.9 * dt;
    if (d.y < d.baseY - 80) { d.y = d.baseY - 80; d.dir = 1; }
    if (d.y > d.baseY) { d.y = d.baseY; d.dir = -1; }
  } else {
    d.x += d.dir * d.speed * dt;
    if (d.x < d.minX) { d.x = d.minX; d.dir = 1; }
    if (d.x > d.maxX) { d.x = d.maxX; d.dir = -1; }
  }
  if (L.demonShield) {            // giơ khiên theo nhịp
    d.shT -= dt;
    if (d.shT <= 0) { d.shield = !d.shield; d.shT = d.shield ? rand(0.9, 1.3) : rand(2.2, 3.4); }
  }
  if (L.demonHeal && d.hp < d.maxHp) {   // chậm tay thì quỷ hồi máu
    d.healT -= dt;
    if (d.healT <= 0) { d.hp++; d.healT = 8; floater(d.x, d.y - 80 * d.sc, t("f_demon_heal"), "#9be8a0"); sparkle(d.x, d.y - 30 * d.sc, 12, "#9be8a0"); }
  }
}
function hitDemon(f) {
  const d = demon;
  f.demonDone = true;
  if (d.shield) {                 // trúng khiên: đá bật ra
    f.vx = -Math.abs(f.vx) * 0.35; f.vy = -140; f.vr = rand(8, 12);
    sparkle(f.x, f.y, 14, "#ffd166"); floater(d.x, d.y - 80 * d.sc, t("f_shield"), "#ffd166");
    sfx.shield(); shake(2); buzz(20);
    return;
  }
  const dmg = f.units;
  d.hp -= dmg; d.hitT = 0.28; d.healT = 8; d.x -= 6 * Math.sign(f.vx || 1) * -1;
  splash(f.x, f.y, 10, "#e0c0ff"); floater(d.x, d.y - 82 * d.sc, "-" + dmg, "#ff9a7a");
  sfx.demonHit(); shake(3.5); buzz(35);
  addCombo();
  flying = null;
  if (d.hp <= 0) {
    const coins = d.boss ? 60 : 10 * d.maxHp;
    explode(d.x, d.y - 30 * d.sc); explode(d.x, d.y - 50 * d.sc); sparkle(d.x, d.y - 40 * d.sc, 30, "#c79bff");
    addCoins(coins); UI.flyCoins(d.x, d.y - 40 * d.sc, Math.min(10, 3 + d.maxHp), true);
    floater(d.x, d.y - 90 * d.sc, t("f_demon_down") + " +" + coins, "#ffe6a8");
    SAVE.stats.demons = (SAVE.stats.demons || 0) + 1;
    sfx.demonDown(); shake(6); buzz([40, 60, 80]); hopT = 0.45;
    demon = null;
  }
  updateHUD(); afterThrow();
}
function drawBarrier(tm) {
  if (!demon) return;
  const w = slotW(), x = X0 + demon.at * w, top = deckY() - 110, a = demon.appearT > 0 ? 1 - demon.appearT / 0.6 : 1;
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, top, 0, WATER_Y);
  g.addColorStop(0, "rgba(170,90,255,0)"); g.addColorStop(0.35, "rgba(170,90,255,.28)"); g.addColorStop(1, "rgba(120,40,200,.45)");
  ctx.fillStyle = g; ctx.fillRect(x + 2, top, w - 4, WATER_Y - top);
  ctx.strokeStyle = "rgba(220,170,255," + (0.55 + 0.3 * Math.sin(tm * 6)) + ")"; ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {               // vân kết giới chạy lên
    const yy = WATER_Y - ((tm * 40 + k * 40) % (WATER_Y - top));
    ctx.beginPath(); ctx.moveTo(x + 4, yy); ctx.lineTo(x + w / 2, yy - 8); ctx.lineTo(x + w - 4, yy); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(200,140,255,.8)"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x + 2, top + 30); ctx.lineTo(x + 2, WATER_Y); ctx.moveTo(x + w - 2, top + 30); ctx.lineTo(x + w - 2, WATER_Y); ctx.stroke();
  ctx.restore();
}
function drawDemon(tm) {
  const d = demon; if (!d) return;
  const sc = d.sc, ap = d.appearT > 0 ? easeOut(1 - d.appearT / 0.6) : 1;
  const bob = Math.sin(tm * 2.6) * 3, flash = d.hitT > 0 && Math.floor(d.hitT * 30) % 2 === 0;
  ctx.save();
  ctx.translate(d.x + (d.hitT > 0 ? Math.sin(d.hitT * 80) * 2 : 0), d.y + bob);
  const img = IMG[d.boss ? "rakshasaBoss" : "rakshasa"] || IMG.rakshasa;
  if (!img) {   // mây đen dưới chân (ảnh minh họa đã có sẵn mây)
    ctx.fillStyle = "rgba(60,20,90,.75)";
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(k * 9 * sc, 2 + Math.sin(tm * 4 + k) * 1.5, 12 * sc, 6 * sc, 0, 0, TAU); ctx.fill(); }
  }
  ctx.scale(-sc * ap, sc * ap);   // quay mặt về phía khỉ (bên trái)
  if (img) {
    // quầng tối phía sau giúp quỷ nổi bật trên mọi bầu trời
    const aura = ctx.createRadialGradient(0, -40, 6, 0, -40, 58);
    aura.addColorStop(0, "rgba(30,0,45,.42)"); aura.addColorStop(1, "rgba(30,0,45,0)");
    ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, -40, 58, 0, TAU); ctx.fill();
    ctx.scale(-1, 1);               // ảnh vẽ sẵn nhìn sang trái
    const hh = 80, ww = hh * img.width / img.height;
    if (flash) { ctx.filter = "brightness(2.2)"; ctx.globalAlpha = 0.65; }   // nháy sáng khi trúng đòn
    ctx.drawImage(img, -ww / 2, -hh + 6, ww, hh);
    ctx.filter = "none"; ctx.globalAlpha = 1;
    ctx.scale(-1, 1);
  } else {
    const skin = flash ? "#ffffff" : d.boss ? "#8c2232" : "#5b3a8c", dark = flash ? "#eeeeee" : d.boss ? "#5e1520" : "#3d2463";
    // chùy gai giơ cao phía sau
    ctx.strokeStyle = "#6b4a2a"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-6, -40); ctx.lineTo(-18, -64); ctx.stroke();
    ctx.fillStyle = "#4a4a52"; ctx.beginPath(); ctx.arc(-20, -68, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = "#c9c9d1"; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.beginPath(); ctx.arc(-20 + Math.cos(a) * 8, -68 + Math.sin(a) * 8, 2, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = skin; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-6, -40); ctx.lineTo(-14, -56); ctx.stroke();
    // chân, thân, khố
    ctx.fillStyle = dark; ctx.fillRect(-9, -16, 6, 15); ctx.fillRect(3, -16, 6, 15);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(0, -30, 14, 16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = flash ? "#fff" : "#b3262e"; ctx.beginPath(); ctx.moveTo(-12, -22); ctx.lineTo(12, -22); ctx.lineTo(8, -10); ctx.lineTo(-8, -10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f2b84b"; ctx.fillRect(-12, -24, 24, 3);
    // tay trước
    ctx.strokeStyle = skin; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(8, -38); ctx.lineTo(17, -26); ctx.stroke();
    // đầu, sừng, mắt lửa, nanh
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(2, -52, 11, 0, TAU); ctx.fill();
    ctx.fillStyle = "#efe6d0";
    ctx.beginPath(); ctx.moveTo(-6, -60); ctx.quadraticCurveTo(-14, -70, -10, -78); ctx.quadraticCurveTo(-8, -68, -2, -62); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, -61); ctx.quadraticCurveTo(16, -70, 13, -78); ctx.quadraticCurveTo(10, -68, 4, -62); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ffd23f"; ctx.shadowColor = "#ff8a00"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.ellipse(0, -54, 2.6, 1.8, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(8, -54, 2.6, 1.8, 0, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#1a0d24"; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-3, -58); ctx.lineTo(3, -56); ctx.moveTo(11, -58); ctx.lineTo(5, -56); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(2, -42); ctx.lineTo(3, -46); ctx.fill(); ctx.beginPath(); ctx.moveTo(6, -46); ctx.lineTo(7, -42); ctx.lineTo(9, -46); ctx.fill();
    if (d.boss) {   // vương miện tướng quỷ
      ctx.fillStyle = "#f2b84b";
      ctx.beginPath(); ctx.moveTo(-8, -60); ctx.lineTo(-6, -70); ctx.lineTo(-1, -64); ctx.lineTo(3, -73); ctx.lineTo(7, -64); ctx.lineTo(12, -70); ctx.lineTo(13, -60); ctx.closePath(); ctx.fill();
    }
  }
  // khiên
  if (d.shield) {
    ctx.save(); ctx.translate(20, -34);
    ctx.shadowColor = "#ffd166"; ctx.shadowBlur = 14 + Math.sin(tm * 12) * 4;
    ctx.fillStyle = "#c98a2b"; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f2c35a"; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
    ctx.fillStyle = "#b3262e"; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // thanh máu
  if (ap >= 1) {
    const bw = (d.boss ? 64 : 38), bx = d.x - bw / 2, by = d.y + bob - 92 * sc;
    ctx.fillStyle = "rgba(10,5,20,.7)"; rr(bx - 2, by - 2, bw + 4, 9, 4); ctx.fill();
    const seg = bw / d.maxHp;
    for (let k = 0; k < d.maxHp; k++) {
      ctx.fillStyle = k < d.hp ? (d.boss ? "#ff5a3d" : "#e0465a") : "rgba(255,255,255,.12)";
      rr(bx + k * seg + 1, by, seg - 2, 5, 2.5); ctx.fill();
    }
  }
}
function spawnFireball() {
  // ưu tiên nhắm vào ô đã có đá để tạo áp lực
  // chỉ nhắm vào ô chưa hoàn thành (ô đã xong được phép thuật bảo vệ), ưu tiên ô đã có đá
  const open = slots.map((s, i) => !s.done ? i : -1).filter(i => i >= 0);
  if (!open.length) return;
  const built = open.filter(i => slots[i].units > 0);
  const pool = built.length && Math.random() < 0.7 ? built : open;
  const i = pool[(Math.random() * pool.length) | 0];
  const sp = rand(55, 78) * diff().fireMul * (L.boss ? 1.15 : 1);
  fireballs.push({ x: slotCX(i) + rand(-6, 6), y: -24, vx: 0, vy: sp });
  floater(slotCX(i), 40, "☄️", "#ffb347");
}
function fireImpact(fb) {
  const i = clamp(Math.floor((fb.x - X0) / slotW()), 0, L.slots - 1);
  const s = slots[i];
  explode(fb.x, fb.y);
  sfx.boom(); shake(5); buzz(60);
  if (s.done) {
    sparkle(fb.x, fb.y, 14, "#ffd166");
    floater(slotCX(i), deckY() - 30, t("f_shield"), "#ffe6a8");
  } else if (s.units > 0) {
    const top = s.stones[s.stones.length - 1];
    if (top.u > 1) top.u--; else s.stones.pop();
    s.units--;
    floater(slotCX(i), stackTopY(i) - 30, t("f_burn"), "#ff9a7a");
  } else splash(fb.x, WATER_Y, 14, "#ffd9c0");
  updateHUD();
}

function step(dt) {
  time += dt;
  if (throwAnim > 0) throwAnim -= dt;
  if (throwPoseT > 0) throwPoseT -= dt;
  updateMonkeyAnim(dt);
  if (hopT > 0) hopT -= dt;
  if (shakeT > 0) shakeT -= dt;
  const live = playing();
  if (gustFlashT > 0) { gustFlashT -= dt; if (gustFlashT <= 0) $("#windBox").classList.remove("gust"); }
  if (gull && state !== "pause") {
    gull.x += gull.dir * gull.speed * dt;
    if (gull.x < X0 + 30) { gull.x = X0 + 30; gull.dir = 1; }
    if (gull.x > X1 - 30) { gull.x = X1 - 30; gull.dir = -1; }
  }
  fishTimer -= dt;
  if (fishTimer <= 0) {
    fishTimer = rand(3.5, 8);
    fishes.push({ x: rand(240, 860), dir: Math.random() < 0.5 ? -1 : 1, len: rand(50, 95), h: rand(30, 52), t: 0, dur: rand(0.8, 1.1) });
  }
  fishes.forEach(f => { f.t += dt; });
  fishes = fishes.filter(f => f.t < f.dur);
  if (winTimer > 0) { winTimer -= dt; if (winTimer <= 0 && state === "win") UI.onWin(); }
  if (failTimer > 0 && state !== "pause" && state !== "ad") {
    failTimer -= dt;
    if (failTimer <= 0) { if (stonesLeft <= 0 && state === "aim") { state = "fail"; sfx.lose(); buzz(120); UI.onFail(); } }
  }

  if (live) {
    updateDemon(dt);
    // Makara trồi/lặn
    if (makara) {
      makara.t -= dt;
      if (makara.t <= 0) {
        if (makara.up) { makara.up = false; makara.t = rand(3, 5); }
        else {
          const c = contiguous();
          const open = slots.map((s, i) => !s.done && i >= c ? i : -1).filter(i => i >= 0);
          if (open.length) {
            makara.slot = open[(Math.random() * Math.min(open.length, 4)) | 0];
            makara.up = true; makara.t = rand(2.6, 3.6);
            splash(slotCX(makara.slot), WATER_Y, 12);
          } else makara.t = 2;
        }
      }
      makara.h += ((makara.up ? 1 : 0) - makara.h) * Math.min(1, dt * 6);
    }
    // cầu lửa
    if (L.fire && state !== "win") {
      fireTimer -= dt;
      if (fireTimer <= 0) { fireTimer = L.fire * rand(0.8, 1.2) / diff().fireMul; spawnFireball(); }
    }
    for (const fb of fireballs) {
      fb.x += fb.vx * dt; fb.y += fb.vy * dt;
      const i = clamp(Math.floor((fb.x - X0) / slotW()), 0, L.slots - 1);
      const top = slots[i].done ? deckY() - 8 : slots[i].units > 0 ? stackTopY(i) : WATER_Y;
      if (fb.y >= top - 6) { fb.dead = true; fireImpact(fb); }
    }
    fireballs = fireballs.filter(f => !f.dead);
  }

  if (spaceCharge && state === "aim") {
    const t = (performance.now() - spaceCharge.t0) / 1000;
    const p = 0.5 + 0.5 * Math.sin(t * 2.6 - Math.PI / 2);          // 0 → 1 → 0
    spaceCharge.power = spaceCharge.min + p * (1040 - spaceCharge.min);
    const hp = handPos(monkeyPos());
    dragStart = { x: hp.x, y: hp.y };
    drag = { x: hp.x - Math.cos(0.907) * (spaceCharge.power / 3.4), y: hp.y + Math.sin(0.907) * (spaceCharge.power / 3.4) };
  }
  if (flying && state === "fly") {
    const f = flying;
    if (gustsOn() && !f.calm) {
      gustTimer -= dt;
      if (gustTimer <= 0) {
        gustTimer = rand(0.4, 0.8);
        if (Math.random() < 0.55) {
          const dw = Math.round(rand(-52, 52));
          if (Math.abs(dw) >= 14) {
            wind += dw;
            updateWindHUD();
            gustFlashT = 0.7;
            $("#windBox").classList.add("gust");
            floater(f.x, f.y - 34, dw > 0 ? t("f_gust_r") : t("f_gust_l"), "#ffb3a0");
            sfx.wind();
          }
        }
      }
    }
    f.vy += GRAV * dt; f.vx += wind * dt;
    f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
    if (gull && !f.gullHit && Math.hypot(f.x - gull.x, f.y - gull.y) < 30) {
      f.gullHit = true;
      f.vx = -f.vx * 0.15; f.vy = 150; f.vr = rand(6, 10);
      sparkle(f.x, f.y, 10, "#ffffff");
      floater(f.x, f.y - 30, t("f_gull"), "#ffffff");
      sfx.gull(); shake(3); buzz(30);
    }
    if (demon && !f.demonDone && demon.appearT <= 0) {
      const d = demon, sc = d.boss ? 1.55 : 1, cy = d.y - 32 * sc;
      if (Math.abs(f.x - d.x) < 22 * sc && Math.abs(f.y - cy) < 34 * sc) { hitDemon(f); if (!flying) { render(dt); return; } }
    }
    for (const fb of fireballs) {
      if (!fb.dead && Math.hypot(f.x - fb.x, f.y - fb.y) < 28) {
        fb.dead = true; run.fire++; SAVE.stats.fire++;
        addCoins(5); sfx.fireBlock(); sparkle(fb.x, fb.y, 20, "#ffb347");
        floater(fb.x, fb.y - 26, t("f_fire_block"), "#ffd166");
        f.vx *= 0.75; updateHUD(); buzz(20);
        UI.flyCoins(fb.x, fb.y, 3, true);
      }
    }
    fireballs = fireballs.filter(x => !x.dead);
    if (ring && !f.ringChecked && Math.hypot(f.x - ring.x, f.y - ring.y) < ring.r + 10) {
      f.ringChecked = true; ring = null; stonesLeft++; run.rings++; SAVE.stats.rings++;
      sparkle(f.x, f.y, 14, "#ffd166");
      floater(f.x, f.y - 26, t("f_ring"), "#ffd166");
      sfx.ring(); updateHUD();
    }
    if (f.x >= X0 - 4 && f.x <= X1 + 4 && f.vy > 0) {
      const i = clamp(Math.floor((f.x - X0) / slotW()), 0, L.slots - 1);
      let top = stackTopY(i);
      if (makara && makara.up && makara.slot === i) top = Math.min(top, WATER_Y - 40 * makara.h);
      if (f.y + 13 >= top) { landStone(i); render(dt); return; }
    }
    if (f.y > WATER_Y + 18 || f.x > LW + 40 || f.x < -40) sinkStone();
  }
  render(dt);
}
let lastTs = 0;
function loop(ts) {
  const dt = clamp((ts - lastTs) / 1000, 0, 0.033);
  lastTs = ts;
  requestAnimationFrame(loop); // đặt khung kế trước: lỗi trong step() không làm đứng cả game
  try { step(state === "pause" ? 0 : dt); } catch (e) { console.error(e); }
}

/* ================= Điều khiển ================= */
function toGame(e) {
  const r = canvas.getBoundingClientRect();
  // chế độ xoay ngang giả (điện thoại cầm dọc): khung game đã bị xoay 90° theo chiều kim đồng hồ
  if (document.body.classList.contains("rot")) return { x: (e.clientY - r.top) * LW / r.height, y: (r.right - e.clientX) * LH / r.width };
  return { x: (e.clientX - r.left) * LW / r.width, y: (e.clientY - r.top) * LH / r.height };
}
canvas.addEventListener("pointerdown", (e) => {
  ac(); music.sync();
  if (state !== "aim" || flying || failTimer > 0) return;
  canvas.setPointerCapture(e.pointerId);
  drag = toGame(e); dragStart = { x: drag.x, y: drag.y };
  sfx.pull();
});
canvas.addEventListener("pointermove", (e) => { if (drag && state === "aim" && !spaceCharge) drag = toGame(e); });
function endDrag() {
  if (!drag || state !== "aim" || spaceCharge) { drag = null; dragStart = null; return; }
  const v = dragVelocity();
  drag = null; dragStart = null;
  // chỉ nhắc khi gần như chưa kéo (chạm nhầm) hoặc kéo ngược hướng
  if (v.x > 10 && Math.hypot(v.x, v.y) > 110) launch(v.x, v.y, v.hx, v.hy);
  else floater(monkeyPos().x + 30, monkeyPos().y - 110, t("f_pull"), "#fff");
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", () => { drag = null; dragStart = null; });
window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (e.code === "Space") {
    e.preventDefault();
    if (state === "aim" && !spaceCharge && !flying && failTimer <= 0) {
      ac();
      const mn = Math.min(minPowerToFrontier(0.907), 900);
      spaceCharge = { t0: performance.now(), power: mn, min: mn };
      sfx.pull();
    }
  }
  if (e.code === "KeyR" && playing()) UI.restartLevel();
  if ((e.code === "KeyP" || e.code === "Escape") && (playing() || state === "pause")) UI.togglePause();
  const n = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(e.code);
  if (n >= 0) usePower(POWERUPS[n].id);
});
window.addEventListener("keyup", (e) => {
  if (e.code === "Space" && spaceCharge) {
    e.preventDefault();
    const p = spaceCharge.power; spaceCharge = null; drag = null; dragStart = null;
    if (state === "aim") {
      const m = monkeyPos(), ang = 0.907; // 52°
      const hp = launchOrigin(m);
      launch(Math.cos(ang) * p, -Math.sin(ang) * p, hp.x, hp.y);
    }
  }
});
