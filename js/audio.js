"use strict";
/* ================= Âm thanh (WebAudio, không cần file ngoài) ================= */
let audioCtx = null, sfxBus = null, musicBus = null;
function ac() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      sfxBus = audioCtx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(audioCtx.destination);
      musicBus = audioCtx.createGain(); musicBus.gain.value = 0.0001; musicBus.connect(audioCtx.destination);
    } catch (e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function tone(freq, dur, type, vol, slideTo, bus, when) {
  const c = ac(); if (!c) return;
  const t0 = when || c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || "sine"; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(bus || sfxBus); o.start(t0); o.stop(t0 + dur + 0.02);
}
function noiseBurst(dur, vol, freq, bus, when) {
  const c = ac(); if (!c) return;
  const t0 = when || c.currentTime;
  const len = Math.max(1, (c.sampleRate * dur) | 0);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq || 900;
  const g = c.createGain(); g.gain.value = vol || 0.2;
  src.connect(f); f.connect(g); g.connect(bus || sfxBus); src.start(t0);
}
function sfxOn() { return SAVE.sound; }

/* ---------- Bộ tổng hợp hiệu ứng: nén tiếng + vang, nhiễu lọc, dao động, chuông, gảy dây ---------- */
let fxOut = null, verbIn = null, noiseBuf = null;
function fx() {
  const c = ac(); if (!c) return null;
  if (!fxOut) {
    // nén nhẹ để nhiều âm cùng lúc không rè
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.18;
    comp.connect(sfxBus);
    fxOut = c.createGain(); fxOut.gain.value = 0.9; fxOut.connect(comp);
    // vang: xung phản hồi tạo bằng nhiễu tắt dần (~1,6 giây)
    const len = (c.sampleRate * 1.6) | 0, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const conv = c.createConvolver(); conv.buffer = ir;
    verbIn = c.createGain(); verbIn.gain.value = 0.32;
    verbIn.connect(conv); conv.connect(comp);
    // nhiễu trắng dùng chung (2 giây)
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return c;
}
function route(node, wet) { node.connect(fxOut); if (wet) { const g = audioCtx.createGain(); g.gain.value = wet; node.connect(g); g.connect(verbIn); } }
function env(g, t0, vol, att, dur) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
}
/* Nhiễu qua bộ lọc, tần số lọc quét f0 → f1 */
function nz({ dur = 0.2, vol = 0.2, type = "lowpass", f0 = 1000, f1 = null, q = 0.8, att = 0.005, delay = 0, wet = 0.15 }) {
  const c = fx(); if (!c) return;
  const t0 = c.currentTime + delay;
  const src = c.createBufferSource(); src.buffer = noiseBuf;
  const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t0);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = c.createGain(); env(g, t0, vol, att, dur);
  src.connect(f); f.connect(g); route(g, wet);
  src.start(t0, Math.random() * 1.5); src.stop(t0 + dur + 0.05);
}
/* Dao động có rung giọng (vibrato) và bộ lọc tùy chọn */
function os({ type = "sine", f0 = 440, f1 = null, dur = 0.2, vol = 0.15, att = 0.006, delay = 0, vib = 0, vibRate = 6, lp = 0, lp1 = 0, wet = 0.15 }) {
  const c = fx(); if (!c) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t0);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vibRate; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + dur + 0.05); }
  const g = c.createGain(); env(g, t0, vol, att, dur);
  let head = o;
  if (lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 2; f.frequency.setValueAtTime(lp, t0); if (lp1) f.frequency.exponentialRampToValueAtTime(lp1, t0 + dur * 0.6); o.connect(f); head = f; }
  head.connect(g); route(g, wet);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
/* Chuông đền: các họa âm không hài hòa tắt dần */
function bell(freq, { vol = 0.12, dur = 1.6, delay = 0, wet = 0.45 } = {}) {
  [[1, 1], [2.76, 0.45], [5.4, 0.25], [8.93, 0.12]].forEach(([r, a]) => os({ f0: freq * r, dur: dur / Math.sqrt(r), vol: vol * a, att: 0.002, delay, wet }));
}
/* Tiếng gảy dây kiểu sitar */
function pluck(freq, { vol = 0.13, dur = 0.55, delay = 0, wet = 0.3 } = {}) {
  os({ type: "sawtooth", f0: freq, dur, vol, att: 0.003, delay, lp: freq * 9, lp1: freq * 1.6, wet });
  os({ type: "triangle", f0: freq * 2.003, dur: dur * 0.6, vol: vol * 0.35, att: 0.003, delay, wet });
}
/* Tiếng trống tabla đơn giản */
function tabla(delay = 0, hi = false) {
  os({ f0: hi ? 420 : 150, f1: hi ? 340 : 70, dur: hi ? 0.14 : 0.32, vol: hi ? 0.12 : 0.28, att: 0.002, delay, wet: 0.12 });
  nz({ type: "bandpass", f0: hi ? 3200 : 900, q: 1.5, dur: 0.05, vol: hi ? 0.08 : 0.06, delay, wet: 0.05 });
}
const BHUPALI = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];   // Sa Re Ga Pa Dha… (ngũ cung)
const note = (i, base = 293.66) => base * Math.pow(2, BHUPALI[Math.max(0, Math.min(BHUPALI.length - 1, i))] / 12);
const jit = (v, p = 0.08) => v * (1 + (Math.random() * 2 - 1) * p);   // lệch nhẹ để mỗi lần nghe khác nhau

const sfx = {
  /* ném: tiếng vút gió + dây ná bật */
  throwIt() { if (!sfxOn()) return; nz({ type: "bandpass", f0: 380, f1: 2600, q: 1.2, dur: 0.32, vol: 0.34, att: 0.04, wet: 0.1 }); os({ type: "triangle", f0: jit(210), f1: 95, dur: 0.12, vol: 0.1, wet: 0 }); },
  /* bắt đầu kéo ná: tiếng dây cao su căng */
  pull() { if (!sfxOn()) return; os({ type: "sawtooth", f0: 70, f1: 140, dur: 0.22, vol: 0.035, lp: 500, wet: 0 }); },
  /* đá rơi lên cầu: tiếng đá va đá + rung trầm */
  thud() { if (!sfxOn()) return; os({ f0: jit(150), f1: 48, dur: 0.22, vol: 0.32, att: 0.002, wet: 0.08 }); nz({ type: "bandpass", f0: jit(1900, 0.15), q: 3, dur: 0.06, vol: 0.22, wet: 0.1 }); nz({ type: "lowpass", f0: 600, dur: 0.12, vol: 0.12, wet: 0.05 }); },
  /* nước bắn: nhiễu tắt dần + giọt nước */
  splash(big) {
    if (!sfxOn()) return;
    nz({ type: "lowpass", f0: big ? 3200 : 2400, f1: 300, dur: big ? 0.6 : 0.35, vol: big ? 0.3 : 0.2, att: 0.01, wet: 0.2 });
    for (let i = 0; i < (big ? 5 : 3); i++) os({ f0: jit(1100, 0.35), f1: jit(1700, 0.3), dur: 0.06, vol: 0.05, delay: 0.05 + Math.random() * 0.25, wet: 0.25 });
  },
  /* đá chìm: nước bắn + bọt nước ùng ục */
  sink() { if (!sfxOn()) return; this.splash(true); [0.18, 0.32, 0.43].forEach(d => os({ f0: jit(260, 0.2), f1: jit(620, 0.2), dur: 0.09, vol: 0.07, delay: d, wet: 0.2 })); },
  /* đá thiêng: chuông đền + lấp lánh */
  golden() { if (!sfxOn()) return; bell(587.3, { vol: 0.11 }); bell(880, { vol: 0.07, delay: 0.06 }); for (let i = 0; i < 4; i++) os({ f0: 2400 + i * 400, dur: 0.12, vol: 0.03, delay: 0.08 + i * 0.05, wet: 0.5 }); },
  /* nối xong ô: gõ gỗ + gảy đàn đi lên */
  complete() { if (!sfxOn()) return; nz({ type: "bandpass", f0: 700, q: 4, dur: 0.07, vol: 0.18, wet: 0.05 }); nz({ type: "bandpass", f0: 900, q: 4, dur: 0.07, vol: 0.14, delay: 0.09, wet: 0.05 }); [2, 4, 5, 7].forEach((n, i) => pluck(note(n), { vol: 0.09, delay: 0.1 + i * 0.07 })); },
  /* combo: mỗi lần trúng liên tiếp lên một nốt */
  combo(n) { if (!sfxOn()) return; pluck(note(Math.min(10, n)), { vol: 0.08, dur: 0.35 }); if (n >= 5) bell(note(Math.min(10, n), 587.3), { vol: 0.05, dur: 0.8 }); },
  /* vòng vàng: chuỗi chuông lấp lánh */
  ring() { if (!sfxOn()) return; [7, 9, 12].forEach((n, i) => bell(note(n, 587.3), { vol: 0.06, dur: 0.9, delay: i * 0.06 })); },
  /* vào màn: tiếng tù và (shankh) */
  conch() {
    if (!sfxOn()) return;
    os({ type: "sawtooth", f0: 196, dur: 1.5, vol: 0.18, att: 0.25, vib: 3, vibRate: 5, lp: 500, lp1: 1500, wet: 0.45 });
    os({ type: "sawtooth", f0: 392.5, dur: 1.4, vol: 0.05, att: 0.3, vib: 5, vibRate: 5, lp: 700, lp1: 2000, wet: 0.45 });
    nz({ type: "bandpass", f0: 1200, q: 0.8, dur: 1.2, vol: 0.03, att: 0.3, wet: 0.3 });
  },
  /* thắng màn: tù và + tabla dồn + gảy đàn + chuông */
  win() {
    if (!sfxOn()) return;
    this.conch();
    [0, 0.12, 0.24, 0.36, 0.42, 0.48].forEach((d, i) => tabla(0.15 + d, i % 2 === 1));
    [0, 2, 4, 5, 7, 9].forEach((n, i) => pluck(note(n + 2), { vol: 0.09, delay: 0.25 + i * 0.09 }));
    bell(587.3 * 2, { vol: 0.1, delay: 0.85, dur: 2 });
  },
  /* thua: gảy đàn đi xuống + trống trầm */
  lose() { if (!sfxOn()) return; [5, 4, 2, 0].forEach((n, i) => pluck(note(n, 220), { vol: 0.1, dur: 0.7, delay: i * 0.16 })); tabla(0.7); },
  click() { if (!sfxOn()) return; nz({ type: "bandpass", f0: 2200, q: 2, dur: 0.035, vol: 0.12, wet: 0 }); os({ f0: 880, f1: 660, dur: 0.05, vol: 0.05, wet: 0 }); },
  /* cầu lửa nổ: nổ trầm + lửa lách tách */
  boom() {
    if (!sfxOn()) return;
    nz({ type: "lowpass", f0: 1600, f1: 160, dur: 0.75, vol: 0.4, att: 0.004, wet: 0.3 });
    os({ f0: 85, f1: 32, dur: 0.5, vol: 0.35, att: 0.003, wet: 0.1 });
    for (let i = 0; i < 6; i++) nz({ type: "highpass", f0: 3000, dur: 0.02, vol: 0.08, delay: 0.1 + Math.random() * 0.5, wet: 0.1 });
  },
  /* chặn được cầu lửa: tiếng xèo + lấp lánh */
  fireBlock() { if (!sfxOn()) return; nz({ type: "highpass", f0: 1800, f1: 5000, dur: 0.3, vol: 0.16, wet: 0.2 }); bell(1174.7, { vol: 0.05, dur: 0.7 }); },
  /* Makara đớp đá */
  chomp() { if (!sfxOn()) return; [0, 0.13].forEach(d => { nz({ type: "bandpass", f0: 550, q: 2, dur: 0.1, vol: 0.25, delay: d, wet: 0.05 }); os({ type: "sawtooth", f0: 140, f1: 70, dur: 0.1, vol: 0.08, delay: d, lp: 800, wet: 0 }); }); },
  /* quỷ gầm */
  growl() { if (!sfxOn()) return; os({ type: "sawtooth", f0: jit(95), f1: 62, dur: 0.65, vol: 0.16, att: 0.04, vib: 9, vibRate: 13, lp: 700, lp1: 300, wet: 0.25 }); nz({ type: "lowpass", f0: 400, dur: 0.6, vol: 0.12, att: 0.05, wet: 0.2 }); },
  /* trúng quỷ: cú đấm + gầm ngắn */
  demonHit() { if (!sfxOn()) return; os({ f0: 130, f1: 45, dur: 0.18, vol: 0.35, att: 0.002, wet: 0.05 }); nz({ type: "bandpass", f0: 1200, q: 1, dur: 0.08, vol: 0.2, wet: 0.05 }); os({ type: "sawtooth", f0: jit(140), f1: 90, dur: 0.3, vol: 0.09, vib: 12, vibRate: 15, lp: 900, wet: 0.2, delay: 0.04 }); },
  /* quỷ hiện ra: luồng gió cuộn ngược + gầm */
  demonAppear() { if (!sfxOn()) return; nz({ type: "bandpass", f0: 200, f1: 1800, q: 1, dur: 0.6, vol: 0.18, att: 0.5, wet: 0.4 }); setTimeout(() => this.growl(), 450); },
  /* hạ quỷ: nổ + ánh sáng thần thánh đi lên */
  demonDown() { if (!sfxOn()) return; this.boom(); [4, 7, 9, 12].forEach((n, i) => bell(note(n, 587.3), { vol: 0.07, dur: 1.2, delay: 0.2 + i * 0.08 })); },
  /* khiên đỡ: kim loại keng */
  shield() { if (!sfxOn()) return; [[523, 1], [1410, 0.5], [2290, 0.3], [3520, 0.2]].forEach(([f, a]) => os({ type: "triangle", f0: f, dur: 0.5, vol: 0.09 * a, att: 0.001, wet: 0.35 })); },
  /* gió giật */
  wind() { if (!sfxOn()) return; nz({ type: "bandpass", f0: 300, f1: 900, q: 0.7, dur: 0.9, vol: 0.12, att: 0.3, wet: 0.3 }); },
  /* chim mòng biển kêu */
  gull() { if (!sfxOn()) return; [0, 0.16].forEach(d => os({ type: "sawtooth", f0: 1300, f1: 800, dur: 0.14, vol: 0.06, delay: d, vib: 60, vibRate: 30, lp: 2600, wet: 0.25 })); },
  coin() { if (!sfxOn()) return; os({ type: "triangle", f0: 1568, dur: 0.12, vol: 0.08, wet: 0.3 }); os({ type: "triangle", f0: 2093, dur: 0.3, vol: 0.08, delay: 0.07, wet: 0.35 }); },
  unlock() { if (!sfxOn()) return; [0, 2, 4, 7, 9].forEach((n, i) => bell(note(n + 3, 587.3), { vol: 0.06, dur: 1, delay: i * 0.07 })); },
  blip() { if (!sfxOn()) return; os({ type: "triangle", f0: jit(560, 0.12), dur: 0.03, vol: 0.025, wet: 0 }); },
  star(i) { if (!sfxOn()) return; bell(note(5 + i * 2, 587.3), { vol: 0.1, dur: 1.4 }); },
  tick() { if (!sfxOn()) return; os({ type: "triangle", f0: jit(2400, 0.1), dur: 0.05, vol: 0.035, wet: 0.2 }); },
  whoosh() { if (!sfxOn()) return; nz({ type: "bandpass", f0: 200, f1: 2200, q: 0.9, dur: 0.5, vol: 0.16, att: 0.15, wet: 0.3 }); }
};
/* Rung trên điện thoại (Android; iOS Safari không hỗ trợ) */
function buzz(pattern) {
  if (!SAVE.haptic) return;
  if (Native.vibrate(pattern)) return;                 // app: rung native (cả iOS)
  if (navigator.vibrate) try { navigator.vibrate(pattern); } catch (e) { /* bỏ qua */ }
}

/* ---------- Nhạc nền: drone tanpura + giai điệu thang âm Bhupali + nhịp trống ---------- */
const music = (() => {
  const SA = 196; // G3
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16]; // Sa Re Ga Pa Dha Sa' Re' Ga'
  let timer = null, nextT = 0, beat = 0, idx = 3, drones = [];
  const BEAT = 0.42;
  function hz(semi) { return SA * Math.pow(2, semi / 12); }
  function startDrone(c) {
    [[SA / 2, 0.05], [SA * 0.75, 0.03], [SA, 0.025]].forEach(([f, v]) => {
      const o = c.createOscillator(), g = c.createGain(), lf = c.createOscillator(), lg = c.createGain();
      o.type = "sawtooth"; o.frequency.value = f;
      const filt = c.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 520;
      g.gain.value = v; lf.frequency.value = 0.18 + Math.random() * 0.1; lg.gain.value = v * 0.5;
      lf.connect(lg); lg.connect(g.gain);
      o.connect(filt); filt.connect(g); g.connect(musicBus);
      o.start(); lf.start(); drones.push(o, lf);
    });
  }
  function schedule() {
    const c = audioCtx; if (!c) return;
    while (nextT < c.currentTime + 0.6) {
      const b = beat % 16;
      // nhịp tabla đơn giản (dha . ge na | dha . tin na)
      if (b % 4 === 0) { tone(110, 0.22, "sine", 0.16, 70, musicBus, nextT); }
      if (b % 4 === 2) { noiseBurst(0.06, 0.05, 3200, musicBus, nextT); }
      if (b % 8 === 6) { tone(220, 0.1, "sine", 0.06, 180, musicBus, nextT); }
      // giai điệu đi bước ngẫu nhiên trong thang âm
      if (b % 2 === 0 && Math.random() < 0.72) {
        idx = Math.max(0, Math.min(SCALE.length - 1, idx + [-2, -1, -1, 1, 1, 2][(Math.random() * 6) | 0]));
        const dur = Math.random() < 0.25 ? BEAT * 3 : BEAT * 1.6;
        tone(hz(SCALE[idx] + 12), dur, "triangle", 0.045, null, musicBus, nextT);
      }
      nextT += BEAT / 2; beat++;
    }
  }
  return {
    start() {
      const c = ac(); if (!c || timer) return;
      if (!drones.length) startDrone(c);
      musicBus.gain.cancelScheduledValues(c.currentTime);
      musicBus.gain.setTargetAtTime(0.55, c.currentTime, 0.6);
      nextT = c.currentTime + 0.1;
      timer = setInterval(schedule, 200);
    },
    stop() {
      if (!audioCtx) return;
      clearInterval(timer); timer = null;
      musicBus.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.3);
    },
    sync() { if (SAVE.music) this.start(); else this.stop(); }
  };
})();
