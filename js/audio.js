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
const sfx = {
  throwIt() { if (!sfxOn()) return; noiseBurst(0.18, 0.10, 1600); tone(300, 0.16, "sine", 0.05, 620); },
  splash(big) { if (!sfxOn()) return; noiseBurst(big ? 0.4 : 0.25, big ? 0.28 : 0.18, 700); },
  thud() { if (!sfxOn()) return; tone(120, 0.14, "sine", 0.22, 55); },
  golden() { if (!sfxOn()) return; tone(880, 0.12, "triangle", 0.14); setTimeout(() => tone(1318, 0.16, "triangle", 0.12), 70); },
  ring() { if (!sfxOn()) return; tone(1046, 0.1, "sine", 0.14); setTimeout(() => tone(1568, 0.14, "sine", 0.12), 60); },
  complete() { if (!sfxOn()) return; [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.16, "triangle", 0.13), i * 70)); },
  win() { if (!sfxOn()) return; [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.22, "triangle", 0.13), i * 95)); },
  lose() { if (!sfxOn()) return; [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.22, "sine", 0.13), i * 130)); },
  click() { if (!sfxOn()) return; tone(660, 0.06, "square", 0.05); },
  boom() { if (!sfxOn()) return; noiseBurst(0.45, 0.32, 420); tone(90, 0.3, "sine", 0.25, 40); },
  fireBlock() { if (!sfxOn()) return; noiseBurst(0.2, 0.18, 2400); tone(740, 0.1, "triangle", 0.12, 1480); },
  chomp() { if (!sfxOn()) return; tone(160, 0.12, "square", 0.12, 70); setTimeout(() => tone(130, 0.12, "square", 0.1, 60), 110); },
  growl() { if (!sfxOn()) return; tone(110, 0.32, "sawtooth", 0.09, 55); tone(82, 0.36, "square", 0.05, 45); },
  coin() { if (!sfxOn()) return; tone(988, 0.08, "square", 0.06); setTimeout(() => tone(1318, 0.12, "square", 0.06), 70); },
  unlock() { if (!sfxOn()) return; [659, 880, 1175, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.18, "triangle", 0.11), i * 80)); },
  blip() { if (!sfxOn()) return; tone(520 + Math.random() * 120, 0.03, "triangle", 0.025); },
  star(i) { if (!sfxOn()) return; tone(880 * Math.pow(1.26, i), 0.22, "triangle", 0.12); tone(1760 * Math.pow(1.26, i), 0.12, "sine", 0.05); },
  tick() { if (!sfxOn()) return; tone(1400 + Math.random() * 300, 0.04, "square", 0.025); },
  whoosh() { if (!sfxOn()) return; noiseBurst(0.35, 0.08, 1200); }
};
/* Rung trên điện thoại (Android; iOS Safari không hỗ trợ) */
function buzz(pattern) { if (SAVE.haptic && navigator.vibrate) try { navigator.vibrate(pattern); } catch (e) { /* bỏ qua */ } }

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
