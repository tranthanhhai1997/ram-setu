/* Service worker — cho phép cài đặt và chơi offline.
   Tăng VERSION mỗi lần phát hành để người chơi nhận bản mới. */
const VERSION = "ramsetu-v16";
const SHELL = [
  "./", "index.html", "manifest.webmanifest", "css/style.css", "css/fonts.css",
  "fonts/BeVietnamPro-400-latin-ext.woff2", "fonts/BeVietnamPro-400-latin.woff2", "fonts/BeVietnamPro-400-vietnamese.woff2", "fonts/BeVietnamPro-500-latin-ext.woff2", "fonts/BeVietnamPro-500-latin.woff2", "fonts/BeVietnamPro-500-vietnamese.woff2", "fonts/BeVietnamPro-600-latin-ext.woff2", "fonts/BeVietnamPro-600-latin.woff2", "fonts/BeVietnamPro-600-vietnamese.woff2", "fonts/BeVietnamPro-700-latin-ext.woff2", "fonts/BeVietnamPro-700-latin.woff2", "fonts/BeVietnamPro-700-vietnamese.woff2", "fonts/BeVietnamPro-800-latin-ext.woff2", "fonts/BeVietnamPro-800-latin.woff2", "fonts/BeVietnamPro-800-vietnamese.woff2", "fonts/NotoSansDevanagari-400-devanagari.woff2", "fonts/NotoSansDevanagari-400-latin-ext.woff2", "fonts/NotoSansDevanagari-400-latin.woff2", "fonts/PlayfairDisplay-700-latin-ext.woff2", "fonts/PlayfairDisplay-700-latin.woff2", "fonts/PlayfairDisplay-700-vietnamese.woff2",
  "js/data.js", "js/save.js", "js/i18n.js", "js/platform.js", "js/audio.js", "js/game.js", "js/ui.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png",
  "img/portraits/rama.webp", "img/portraits/hanuman.webp", "img/portraits/nala.webp", "img/portraits/squirrel.webp", "img/portraits/sugriva.webp", "img/portraits/samudra.webp", "img/portraits/jambavan.webp", "img/portraits/angada.webp", "img/portraits/lakshmana.webp", "img/portraits/vibhishana.webp", "img/portraits/kumbhakarna.webp", "img/portraits/ravana.webp", "img/portraits/sita.webp", "img/portraits/narrator.webp",
  "img/sprites/vanara.webp", "img/sprites/hanuman.webp", "img/sprites/nala.webp", "img/sprites/angada.webp", "img/sprites/sugriva.webp",
  "img/sprites/vanara_windup.webp", "img/sprites/vanara_throw.webp", "img/sprites/hanuman_windup.webp", "img/sprites/hanuman_throw.webp", "img/sprites/nala_windup.webp", "img/sprites/nala_throw.webp", "img/sprites/angada_windup.webp", "img/sprites/angada_throw.webp", "img/sprites/sugriva_windup.webp", "img/sprites/sugriva_throw.webp",
  "img/bg/sky-0.webp", "img/bg/sky-1.webp", "img/bg/sky-2.webp", "img/bg/sky-3.webp", "img/bg/sky-4.webp", "img/bg/sky-5.webp", "img/bg/sky-6.webp", "img/bg/shore-india.webp", "img/bg/shore-lanka.webp", "img/bg/shore-lanka-night.webp", "img/ui/keyart.webp", "img/ui/emblem.webp", "img/ui/frame.webp", "img/ui/makara.webp", "img/ui/fireball.webp", "img/ui/gull.webp", "img/ui/icon-calm.webp", "img/ui/icon-sight.webp", "img/ui/icon-bless.webp", "img/ui/icon-stones.webp", "img/ui/icon-coin.webp", "img/ui/icon-stone.webp", "img/ui/icon-gift.webp", "img/ui/icon-endless.webp", "img/ui/icon-daily.webp", "img/ui/icon-trophy.webp", "img/ui/rakshasa.webp", "img/ui/rakshasa-boss.webp"
];
const FONT_CACHE = "ramsetu-fonts";

self.addEventListener("install", (e) => {
  // cache: "reload" — luôn lấy bản mới từ máy chủ, không dùng bộ nhớ đệm HTTP cũ của trình duyệt
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FONT_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts: ưu tiên cache (font không đổi)
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONT_CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); c.put(req, res.clone()); return res; }
      catch (err) { return Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // Tài nguyên cùng nguồn: trả cache ngay, cập nhật nền (stale-while-revalidate)
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: req.mode === "navigate" });
    const net = fetch(req).then(res => {
      if (res && res.ok) c.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    if (res) return res;
    if (req.mode === "navigate") return c.match("index.html");
    return Response.error();
  }));
});
