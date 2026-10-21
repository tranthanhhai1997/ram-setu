"use strict";
/* ================= Lưu tiến trình (localStorage) ================= */
const SAVE_KEY = "ramsetu_save_v1";

function defaultSave() {
  return {
    v: 1,
    coins: 0,
    unlocked: 1,              // số màn đã mở
    stars: {},                // levelIdx -> sao
    diff: 1,
    lang: null,               // null = tự nhận theo trình duyệt
    sound: true, music: true, haptic: true,
    inv: { calm: 1, sight: 1, bless: 0, stones: 0 },   // quà khởi đầu
    skins: ["vanara"], skin: "vanara",
    stoneSkins: ["granite"], stoneSkin: "granite",
    cards: ["rama"],
    ach: {},                  // id -> true
    seen: {},                 // hội thoại đã xem
    endlessBest: 0,
    daily: { lastClaim: null, streak: 0, challengeDone: null },
    interCount: 0,
    stats: { maxCombo: 0, rings: 0, fire: 0, powerUsed: 0, coinsEarned: 0, dailyWins: 0, throws: 0, demons: 0 }
  };
}

function loadSave() {
  const base = defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    const s = JSON.parse(raw);
    // gộp sâu 1 cấp để bản lưu cũ vẫn có các trường mới
    for (const k of Object.keys(base)) {
      if (s[k] === undefined) s[k] = base[k];
      else if (base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) s[k] = Object.assign({}, base[k], s[k]);
    }
    return s;
  } catch (e) { return base; }
}

let SAVE = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { /* chế độ riêng tư: bỏ qua */ } }
function resetSave() { SAVE = defaultSave(); persist(); }

function addCoins(n) {
  SAVE.coins += n;
  if (n > 0) SAVE.stats.coinsEarned += n;
  persist();
}

/* Ngày theo giờ máy người chơi, dạng YYYY-MM-DD */
function todayStr(offsetDays) {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() + offsetDays);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
