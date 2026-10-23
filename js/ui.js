"use strict";
/* ================= Giao diện & luồng màn hình ================= */
const UI = (() => {
  const OVERLAYS = ["#menuOverlay", "#storyOverlay", "#winOverlay", "#failOverlay", "#adOverlay", "#pauseOverlay", "#dailyOverlay"];
  const TOP_OVERLAYS = ["#helpOverlay", "#cardOverlay", "#settingsOverlay"];
  let curTab = "story";

  /* Biểu tượng ảnh (ART.ui / POWERUPS.img), thiếu ảnh thì dùng emoji */
  function ico(src, fallback, cls) { return src ? '<img class="ico' + (cls ? " " + cls : "") + '" src="' + src + '" alt="">' : (fallback || ""); }
  const COIN = ico(ART.ui.coin, "🪙") + " ";
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function hideAll() { OVERLAYS.concat(TOP_OVERLAYS).forEach(s => { $(s).hidden = true; }); }
  function show(sel) { $(sel).hidden = false; }
  /* ---------- Chế độ chơi toàn màn hình trên điện thoại ---------- */
  const mobileMQ = window.matchMedia("(pointer: coarse), (max-width: 900px)");
  function setInGame(on) {
    $("#stage").classList.toggle("in-menu", !on);
    const imm = on && mobileMQ.matches;
    if (imm !== document.body.classList.contains("immersive")) {
      document.body.classList.toggle("immersive", imm);
      if (!imm) exitFullscreen();
      fitStage();
    }
  }
  /* Khung game phủ kín màn hình; cầm dọc thì xoay 90° để luôn hiển thị ngang */
  function fitStage() {
    const st = $("#stage"), cv = canvas;
    const imm = document.body.classList.contains("immersive");
    if (!imm && !IS_APP) {
      document.body.classList.remove("rot");
      st.style.width = st.style.height = st.style.transform = st.style.top = cv.style.width = cv.style.height = "";
      cv.style.position = cv.style.left = cv.style.top = "";
      return;
    }
    // app: ở menu chừa chỗ cho thanh công cụ; app đã khóa ngang nên không cần xoay giả
    const tb = IS_APP && !imm ? $(".toolbar").offsetHeight : 0;
    st.style.top = tb + "px";
    const vw = window.innerWidth, vh = window.innerHeight - tb, rot = !IS_APP && vh > vw;
    document.body.classList.toggle("rot", rot);
    const W = rot ? vh : vw, H = rot ? vw : vh;
    st.style.width = W + "px"; st.style.height = H + "px";
    st.style.transform = rot ? "translateX(" + vw + "px) rotate(90deg)" : "";
    // màn hình dài (điện thoại ngang): phóng to khung, cắt bớt tối đa 18% chiều cao (trời trên, nước dưới)
    // để giảm dải trống hai bên; điểm chạm vẫn đúng vì toGame tính theo kích thước thật của canvas
    const k = Math.min(W / LW, H / (LH * 0.82));
    const cw = LW * k, ch = LH * k, over = Math.max(0, ch - H);
    cv.style.width = cw + "px"; cv.style.height = ch + "px";
    cv.style.position = "absolute";
    cv.style.left = ((W - cw) / 2) + "px";
    cv.style.top = (over > 0 ? -over * 0.35 : (H - ch) / 2) + "px";
  }
  /* Xin toàn màn hình + khóa ngang (Android/Chrome); phải gọi trong thao tác chạm của người chơi */
  function enterFullscreen() {
    if (IS_APP || !mobileMQ.matches || document.fullscreenElement || !document.documentElement.requestFullscreen) return;
    document.documentElement.requestFullscreen({ navigationUI: "hide" })
      .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape").catch(() => {}))
      .catch(() => {});
  }
  function exitFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }
  function reduceMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

  /* ---------- Số vàng chạy dần & xu bay về ví ---------- */
  let shownCoins = null, coinRaf = 0;
  function bumpChip() { const chip = $("#coinChip"); chip.classList.remove("bump"); void chip.offsetWidth; chip.classList.add("bump"); }
  function refreshCoins() {
    const el = $("#coinCount"), target = SAVE.coins;
    if (shownCoins === null || reduceMotion()) { shownCoins = target; el.textContent = target; return; }
    if (target === shownCoins) { el.textContent = target; return; }
    if (target > shownCoins) bumpChip();
    const from = shownCoins, t0 = performance.now(), dur = Math.min(900, 300 + Math.abs(target - from) * 3);
    cancelAnimationFrame(coinRaf);
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      shownCoins = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      el.textContent = shownCoins;
      if (p < 1) coinRaf = requestAnimationFrame(tick);
    };
    coinRaf = requestAnimationFrame(tick);
  }
  /* x, y: tọa độ màn hình; fromCanvas = true nếu là tọa độ trong canvas game */
  function flyCoins(x, y, n, fromCanvas) {
    if (reduceMotion() || !document.body.animate) return;
    if (fromCanvas) {
      const r = canvas.getBoundingClientRect();
      if (document.body.classList.contains("rot")) { const gx = x; x = r.right - y * r.width / LH; y = r.top + gx * r.height / LW; }
      else { x = r.left + x * r.width / LW; y = r.top + y * r.height / LH; }
    }
    const chip = $("#coinChip").getBoundingClientRect();
    if (!chip.width) return;   // ví đang ẩn (chế độ toàn màn hình)
    const tx = chip.left + 18, ty = chip.top + chip.height / 2;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("span");
      c.className = "fly-coin"; c.innerHTML = ico(ART.ui.coin, "🪙");
      c.style.left = x + "px"; c.style.top = y + "px";
      document.body.appendChild(c);
      const sx = (Math.random() - 0.5) * 140, sy = -40 - Math.random() * 90;
      const a = c.animate([
        { transform: "translate(-50%,-50%) scale(.3)", opacity: 0 },
        { transform: "translate(calc(-50% + " + sx + "px), calc(-50% + " + sy + "px)) scale(1.15)", opacity: 1, offset: 0.3 },
        { transform: "translate(calc(-50% + " + (tx - x) + "px), calc(-50% + " + (ty - y) + "px)) scale(.55)", opacity: 0.9 }
      ], { duration: 650 + i * 50, delay: i * 45, easing: "cubic-bezier(.5,0,.75,1)", fill: "forwards" });
      a.onfinish = () => { c.remove(); sfx.tick(); bumpChip(); };
    }
  }
  /* Chuyển cảnh dạng vòng tròn mở/đóng, kèm tên màn */
  function wipe(label, cb) {
    const el = $("#wipe");
    if (reduceMotion() || !el.animate) { cb(); return; }
    $("#wipeText").textContent = label || "";
    el.hidden = false; sfx.whoosh();
    const k = [{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(85% at 50% 50%)" }];
    el.animate(k, { duration: 340, easing: "cubic-bezier(.6,0,.4,1)", fill: "forwards" }).onfinish = () => {
      try { cb(); } catch (e) { console.error(e); } // lỗi trong cb không được làm kẹt lớp phủ
      setTimeout(() => {
        el.animate(k.slice().reverse(), { duration: 440, easing: "cubic-bezier(.6,0,.4,1)", fill: "forwards" }).onfinish = () => { el.hidden = true; };
      }, 380);
    };
  }
  function goLevel(i) { enterFullscreen(); goLevel2(i); }
  function goLevel2(i) { wipe(t("level", { n: i + 1 }) + " · " + Tx.levelName(i), () => playStoryLevel(i)); }
  /* Ảnh chân dung (nếu có trong ART.portraits) hoặc biểu tượng emoji */
  function portrait(id) {
    const src = ART.portraits[id];
    return src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : CHARACTERS[id].icon;
  }

  /* ---------- Toast ---------- */
  function toast(icon, title, sub) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<span class="ti">' + icon + '</span><span><b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : "") + '</span>';
    $("#toasts").appendChild(el);
    setTimeout(() => el.classList.add("out"), 3200);
    setTimeout(() => el.remove(), 3700);
  }

  /* ---------- Thành tựu ---------- */
  function checkAchievements() {
    let changed = false;
    ACHIEVEMENTS.forEach(a => {
      if (!SAVE.ach[a.id] && a.test(SAVE)) {
        SAVE.ach[a.id] = true; changed = true;
        addCoins(a.reward);
        toast(a.icon, t("ach_toast", { n: Tx.ach(a.id).name }), t("coins_plus", { n: a.reward }));
        sfx.unlock();
      }
    });
    persist();
    if (changed) refreshCoins();
  }

  /* ---------- Dòng giới thiệu phim (không đếm ngược) ---------- */
  function filmTitle() { return (FILM.titles && FILM.titles[LANG]) || FILM.title; }
  function filmLine() { return t("film_tag", { t: filmTitle() }); }
  function renderFilm() { const s = filmLine(); $("#filmText").innerHTML = s; $("#heroFilm").innerHTML = s; }

  /* ---------- Chia sẻ ---------- */
  async function share(text) {
    const url = FILM.shareUrl || location.href;
    const full = text + " " + FILM.hashtag;
    try {
      if (await Native.share({ title: t("share_title"), text: full, url })) return;
      if (navigator.share) { await navigator.share({ title: t("share_title"), text: full, url }); return; }
      await navigator.clipboard.writeText(full + " " + url);
      toast("📋", t("share_copied"), t("share_copied_sub"));
    } catch (e) { /* người chơi hủy chia sẻ */ }
  }
  function starsTotal() { return Object.values(SAVE.stars).reduce((a, b) => a + b, 0); }
  function shareProgress() {
    share(t("share_progress", { a: Math.min(SAVE.unlocked - 1, LEVELS.length), s: starsTotal(), c: SAVE.cards.length }));
  }

  /* ---------- Menu chính ---------- */
  function showMenu(tab) {
    hideAll(); state = "menu"; setInGame(false);
    if (tab) curTab = tab;
    renderTab(); renderFilm(); refreshCoins();
    show("#menuOverlay");
    $("#dailyDot").hidden = SAVE.daily.lastClaim === todayStr();
  }
  function heroPlayLabel() {
    const next = Math.min(SAVE.unlocked - 1, LEVELS.length - 1);
    return "▶ " + (SAVE.unlocked === 1 && !SAVE.stars[0] ? t("begin_journey") : t("continue_lv", { n: next + 1 }));
  }
  function renderTab() {
    $("#heroPlay").textContent = heroPlayLabel();
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("on", b.dataset.tab === curTab));
    const box = $("#tabBody");
    box.innerHTML = ({ story: tabStory, modes: tabModes, shop: tabShop, cards: tabCards, ach: tabAch })[curTab]();
    bindTab(box);
    if (!reduceMotion()) box.querySelectorAll(".node-wrap, .shop-item, .ccard, .ach, .mode-card").forEach((el, i) => {
      el.classList.add("rise"); el.style.setProperty("--i", Math.min(i, 24));
    });
  }
  function tabStory() {
    const next = Math.min(SAVE.unlocked - 1, LEVELS.length - 1);
    let h = '<div class="story-head"><button class="btn big" data-act="continue">▶ ' +
      (SAVE.unlocked === 1 && !SAVE.stars[0] ? t("begin_journey") : t("continue_lv", { n: next + 1 })) + '</button>' +
      '<div class="diff-row" role="group">' +
      DIFFS.map((d, i) => '<button class="diff-btn' + (SAVE.diff === i ? " on" : "") + '" data-diff="' + i + '" type="button">' + ["🌱", "⚖️", "🔥"][i] + " " + Tx.diffName(i) + "</button>").join("") +
      '</div><p class="mini">' + Tx.diffDesc(SAVE.diff) + '</p>' +
      '<p class="mini">' + t("stars_cards", { s: starsTotal(), S: LEVELS.length * 3, c: SAVE.cards.length, C: CARD_ORDER.length }) + '</p></div>';
    const heroImg = ART.monkey[SAVE.skin] ? '<img class="node-hero" src="' + ART.monkey[SAVE.skin].src + '" alt="">' : '<span class="node-hero">🐒</span>';
    CHAPTERS.forEach((c, ci) => {
      const lvls = LEVELS.map((lv, i) => [lv, i]).filter(x => x[0].ch === ci);
      const th = THEMES[lvls[0][0].theme];
      h += '<div class="chapter" style="--c1:' + th.sky[0] + ';--c2:' + th.sea[1] + '"><div class="ch-title"><b>' + Tx.chapterName(ci) + '</b><span>' + Tx.chapterDesc(ci) + '</span></div><div class="map-row">';
      lvls.forEach(([lv, i]) => {
        const st = SAVE.stars[i] || 0, locked = i >= SAVE.unlocked, cur = i === next && !locked;
        const tags = (lv.gull ? "🕊" : "") + (lv.gust ? "🌪" : "") + (lv.makara ? "🐊" : "") + (lv.fire ? "☄️" : "") + (lv.demons && lv.demons.length ? "👺" : "");
        h += '<div class="node-wrap' + (st ? " done" : "") + (cur ? " cur" : "") + (locked ? " locked" : "") + (lv.boss ? " boss" : "") + '">' + (cur ? heroImg : "") +
          '<button class="node" data-lvl="' + i + '" type="button"' + (locked ? " disabled" : "") + ' style="--nc:' + THEMES[lv.theme].sky[0] + '" aria-label="' + esc(t("level", { n: i + 1 }) + " · " + Tx.levelName(i)) + '">' +
          (locked ? "🔒" : lv.boss ? "👹" : (i + 1)) + '</button>' +
          '<span class="node-name">' + Tx.levelName(i) + '</span>' +
          '<span class="node-meta">' + t("slots_layers", { s: lv.slots, n: lv.need }) + (tags ? " " + tags : "") + '</span>' +
          '<span class="st">' + "★".repeat(st) + "☆".repeat(3 - st) + '</span></div>';
      });
      h += "</div></div>";
    });
    if (SAVE.stars[LEVELS.length - 1]) h += '<div class="btn-row"><button class="btn ghost" data-act="ending">' + t("view_ending") + '</button></div>';
    return h;
  }
  function tabModes() {
    const done = SAVE.daily.challengeDone === todayStr();
    return '<div class="mode-grid">' +
      '<div class="mode-card endless"><div class="mc-ico">' + ico(ART.ui.endless, "♾️") + '</div><h4>' + t("endless_name") + '</h4><p>' + t("endless_desc") + '</p>' +
      '<p class="mini">' + t("record", { n: SAVE.endlessBest }) + '</p><button class="btn" data-act="endless">' + t("play_endless") + '</button></div>' +
      '<div class="mode-card daily"><div class="mc-ico">' + ico(ART.ui.daily, "🗓️") + '</div><h4>' + t("daily_name") + '</h4><p>' + t("daily_desc") + '</p>' +
      '<p class="mini">' + (done ? t("daily_done") : t("daily_reward")) + '</p><button class="btn teal" data-act="daily">▶ ' + (done ? t("replay2") : t("take_challenge")) + '</button></div>' +
      '</div>';
  }
  function tabShop() {
    let h = '<h4 class="sec">' + t("shop_items") + ' <small>' + t("shop_items_hint") + '</small></h4><div class="shop-grid">';
    POWERUPS.forEach(p => {
      const tp = Tx.pw(p.id);
      h += '<div class="shop-item"><span class="si-ico">' + ico(p.img, p.icon) + '</span><b>' + tp.name + '</b><small>' + tp.desc + '</small>' +
        '<span class="own">' + t("owned", { n: SAVE.inv[p.id] || 0 }) + '</span>' +
        '<button class="btn sm" data-buy="' + p.id + '"' + (SAVE.coins < p.price ? " disabled" : "") + '>' + COIN + p.price + '</button></div>';
    });
    h += '</div><h4 class="sec">' + t("shop_skins") + '</h4><div class="shop-grid">';
    SKINS.forEach(s => {
      const own = SAVE.skins.includes(s.id), eq = SAVE.skin === s.id;
      const lockedCard = s.card && !SAVE.cards.includes(s.card);
      h += '<div class="shop-item' + (eq ? " eq" : "") + '">' + (ART.monkey[s.id] ? '<img class="skin-thumb" src="' + ART.monkey[s.id].src + '" alt="" loading="lazy">' : '<span class="swatch" style="background:linear-gradient(135deg,' + s.fur + ' 55%,' + s.band + ' 55%)"></span>') + '<b>' + Tx.skin(s.id) + '</b>' +
        (own ? '<button class="btn sm ghost" data-skin="' + s.id + '"' + (eq ? " disabled" : "") + '>' + (eq ? t("equipped") : t("equip")) + '</button>'
          : lockedCard ? '<small>' + t("need_card", { c: Tx.ch(s.card).name }) + '</small><button class="btn sm" disabled>' + COIN + s.price + '</button>'
          : '<button class="btn sm" data-buyskin="' + s.id + '"' + (SAVE.coins < s.price ? " disabled" : "") + '>' + COIN + s.price + '</button>') + '</div>';
    });
    h += '</div><h4 class="sec">' + t("shop_stones") + '</h4><div class="shop-grid">';
    STONE_SKINS.forEach(s => {
      const own = SAVE.stoneSkins.includes(s.id), eq = SAVE.stoneSkin === s.id;
      const locked = s.needCh && SAVE.unlocked <= 8;
      h += '<div class="shop-item' + (eq ? " eq" : "") + '"><span class="swatch stone" style="background:rgb(' + s.rgb.join(",") + ')">राम</span><b>' + Tx.stone(s.id) + '</b>' +
        (own ? '<button class="btn sm ghost" data-stone="' + s.id + '"' + (eq ? " disabled" : "") + '>' + (eq ? t("equipped") : t("equip")) + '</button>'
          : locked ? '<small>' + t("unlock_ch3") + '</small><button class="btn sm" disabled>' + COIN + s.price + '</button>'
          : '<button class="btn sm" data-buystone="' + s.id + '"' + (SAVE.coins < s.price ? " disabled" : "") + '>' + COIN + s.price + '</button>') + '</div>';
    });
    return h + "</div>";
  }
  function cardCondition(id) {
    if (id === "rama") return t("card_free");
    return t("card_cond", { n: LEVELS.findIndex(l => l.card === id) + 1 });
  }
  function tabCards() {
    let h = '<p class="mini">' + t("cards_count_html", { n: SAVE.cards.length, N: CARD_ORDER.length }) + '</p><div class="card-grid">';
    CARD_ORDER.forEach(id => {
      const c = Tx.ch(id), own = SAVE.cards.includes(id);
      h += '<button class="ccard' + (own ? "" : " locked") + '" data-card="' + id + '" type="button"' + (own ? "" : " disabled") + ' style="--cc:' + c.color + '">' +
        '<span class="cc-ico">' + (own ? portrait(id) : "❔") + '</span><b>' + (own ? c.name : "???") + '</b><small>' + (own ? c.role : cardCondition(id)) + '</small></button>';
    });
    return h + "</div>";
  }
  function tabAch() {
    const n = ACHIEVEMENTS.filter(a => SAVE.ach[a.id]).length;
    let h = '<p class="mini">' + t("ach_count_html", { n, N: ACHIEVEMENTS.length }) + '</p><div class="ach-list">';
    ACHIEVEMENTS.forEach(a => {
      const d = !!SAVE.ach[a.id], ta = Tx.ach(a.id);
      h += '<div class="ach' + (d ? " done" : "") + '"><span class="ai">' + a.icon + '</span><span class="at"><b>' + ta.name + '</b><small>' + ta.desc + '</small></span><span class="ar">' + (d ? "✓" : COIN + a.reward) + '</span></div>';
    });
    return h + '</div><div class="btn-row"><button class="btn ghost" data-act="share">' + t("share_ach") + '</button></div>';
  }
  function buy(price) {
    if (SAVE.coins < price) return false;
    SAVE.coins -= price; persist(); refreshCoins(); sfx.coin();
    return true;
  }
  function bindTab(box) {
    box.querySelectorAll("[data-lvl]").forEach(b => b.addEventListener("click", () => { sfx.click(); goLevel(+b.dataset.lvl); }));
    box.querySelectorAll("[data-diff]").forEach(b => b.addEventListener("click", () => { sfx.click(); SAVE.diff = +b.dataset.diff; persist(); renderTab(); }));
    box.querySelectorAll("[data-buy]").forEach(b => b.addEventListener("click", () => {
      const p = POWERUPS.find(x => x.id === b.dataset.buy);
      if (buy(p.price)) { SAVE.inv[p.id] = (SAVE.inv[p.id] || 0) + 1; persist(); toast(p.icon, t("bought", { x: Tx.pw(p.id).name })); renderTab(); }
    }));
    box.querySelectorAll("[data-buyskin]").forEach(b => b.addEventListener("click", () => {
      const s = SKINS.find(x => x.id === b.dataset.buyskin);
      if (buy(s.price)) { SAVE.skins.push(s.id); SAVE.skin = s.id; persist(); toast("🐒", t("owned_now", { x: Tx.skin(s.id) })); renderTab(); }
    }));
    box.querySelectorAll("[data-skin]").forEach(b => b.addEventListener("click", () => { sfx.click(); SAVE.skin = b.dataset.skin; persist(); renderTab(); }));
    box.querySelectorAll("[data-buystone]").forEach(b => b.addEventListener("click", () => {
      const s = STONE_SKINS.find(x => x.id === b.dataset.buystone);
      if (buy(s.price)) { SAVE.stoneSkins.push(s.id); SAVE.stoneSkin = s.id; persist(); toast("🪨", t("owned_now", { x: Tx.stone(s.id) })); renderTab(); }
    }));
    box.querySelectorAll("[data-stone]").forEach(b => b.addEventListener("click", () => { sfx.click(); SAVE.stoneSkin = b.dataset.stone; persist(); renderTab(); }));
    box.querySelectorAll("[data-card]").forEach(b => b.addEventListener("click", () => { sfx.click(); openCard(b.dataset.card); }));
    box.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => {
      sfx.click();
      const a = b.dataset.act;
      if (a === "continue") goLevel(Math.min(SAVE.unlocked - 1, LEVELS.length - 1));
      if (a === "endless" || a === "daily") enterFullscreen();
      if (a === "endless") wipe(t("endless_name"), () => playEndless());
      if (a === "daily") wipe(t("daily_name"), playDaily);
      if (a === "share") shareProgress();
      if (a === "ending") { hideAll(); showStory(Tx.ending(), () => showMenu("story")); }
    }));
  }
  function openCard(id) {
    const c = Tx.ch(id);
    $("#cardBody").style.setProperty("--cc", c.color);
    $("#cardBody").innerHTML = '<div class="big-ico">' + portrait(id) + '</div><h3>' + c.name + '</h3><p class="role">' + c.role + '</p><p>' + c.lore + '</p>';
    show("#cardOverlay");
  }

  /* ---------- Hội thoại cốt truyện ---------- */
  let story = null;
  function showStory(lines, done) {
    if (!lines || !lines.length) { done(); return; }
    state = "story"; setInGame(true);
    story = { lines, i: 0, done, typing: null };
    show("#storyOverlay");
    storyLine();
  }
  function storyLine() {
    const [who, text] = story.lines[story.i];
    const c = Tx.ch(who);
    $("#storyBox").classList.toggle("villain", who === "ravana" || who === "kumbhakarna");
    $("#storyPortrait").innerHTML = portrait(who);
    $("#storyPortrait").style.background = c.color;
    $("#storyName").textContent = c.name;
    $("#storyStep").textContent = (story.i + 1) + "/" + story.lines.length;
    const el = $("#storyText"); el.textContent = "";
    // tách theo ký tự hiển thị để không cắt đôi dấu tiếng Việt / tiếng Hindi
    const chars = Array.from(text);
    let k = 0;
    clearInterval(story.typing);
    story.typing = setInterval(() => {
      k += 2; el.textContent = chars.slice(0, k).join("");
      if (k % 6 === 0) sfx.blip();
      if (k >= chars.length) { clearInterval(story.typing); story.typing = null; }
    }, 22);
    $("#storyNext").textContent = story.i === story.lines.length - 1 ? t("start") : t("next");
  }
  function storyAdvance() {
    if (!story) return;
    if (story.typing) { clearInterval(story.typing); story.typing = null; $("#storyText").textContent = story.lines[story.i][1]; return; }
    story.i++;
    if (story.i >= story.lines.length) storyEnd(); else storyLine();
  }
  function storyEnd() {
    if (!story) return;
    clearInterval(story.typing);
    const d = story.done; story = null;
    $("#storyOverlay").hidden = true;
    d();
  }

  /* ---------- Bắt đầu các chế độ ---------- */
  function beginPlay() { state = "aim"; setInGame(true); updateHUD(); sfx.conch(); }
  function playStoryLevel(i, skipStory) {
    hideAll(); mode = "story"; levelIdx = i;
    startLevel(LEVELS[i]);
    setInGame(true);
    const go = () => { beginPlay(); floater(LW / 2, 200, t("level", { n: i + 1 }) + " · " + Tx.levelName(i), "#ffe6a8"); };
    if (!skipStory && !SAVE.seen[i]) showStory(Tx.story(i), () => { SAVE.seen[i] = true; persist(); go(); });
    else go();
  }
  function playEndless(stage, carry) {
    hideAll(); mode = "endless";
    stage = stage || 1;
    if (stage === 1) endless = { stage: 1, built: 0, revived: false };
    endless.stage = stage;
    const cfg = genLevel(stage, Math.random, t("stage", { n: stage }), t("endless_sub"));
    const stones = stage === 1 ? Math.round(cfg.stones * diff().stoneMul) : carry + Math.ceil(cfg.slots * cfg.need * 0.85);
    startLevel(cfg, stones);
    beginPlay();
    floater(LW / 2, 200, t("stage", { n: stage }), "#ffe6a8");
  }
  function dailySeed() { return +todayStr().replace(/-/g, ""); }
  function playDaily() {
    hideAll(); mode = "daily";
    const seed = dailySeed(), d = new Date();
    const cfg = genLevel(6 + seed % 4, mulberry32(seed), t("daily_lv", { d: d.getDate() + "/" + (d.getMonth() + 1) }), t("daily_sub"));
    startLevel(cfg);
    beginPlay();
  }
  function restartLevel() {
    sfx.click();
    if (mode === "story") playStoryLevel(levelIdx, true);
    else if (mode === "endless") playEndless();
    else playDaily();
  }

  /* ---------- Thắng / thua ---------- */
  function starBurst(el) {
    for (let k = 0; k < 12; k++) {
      const b = document.createElement("i"), a = k / 12 * Math.PI * 2, r = 34 + Math.random() * 20;
      b.className = "burst";
      b.style.setProperty("--x", Math.cos(a) * r + "px"); b.style.setProperty("--y", Math.sin(a) * r + "px");
      el.appendChild(b); setTimeout(() => b.remove(), 800);
    }
  }
  function setStars(n) {
    const box = $("#winStars"), els = box.children;
    box.hidden = n < 0;
    for (let i = 0; i < 3; i++) {
      els[i].classList.remove("lit"); void els[i].offsetWidth;
      els[i].classList.toggle("lit", i < n);
      if (i < n && !reduceMotion()) setTimeout(() => { starBurst(els[i]); sfx.star(i); }, 280 + i * 150);
    }
  }
  function onWin() {
    hideAll();
    const extra = [];
    let title, text, nextLabel, gained = 0;
    if (mode === "story") {
      const total = L.slots * L.need + (run.demonHp || 0), used = throwCount;   // máu quỷ cũng tính vào số lần ném chuẩn
      const par = Math.ceil(total * 1.15), par2 = Math.ceil(total * 1.5);
      const stars = used <= par ? 3 : used <= par2 ? 2 : 1;
      const first = !SAVE.stars[levelIdx];
      const earned = stars * 40 + stonesLeft * 4 + bestCombo * 4 + (first ? 100 : 0);
      addCoins(earned); gained = earned;
      SAVE.stars[levelIdx] = Math.max(SAVE.stars[levelIdx] || 0, stars);
      SAVE.unlocked = Math.max(SAVE.unlocked, Math.min(LEVELS.length, levelIdx + 2));
      if (levelIdx === LEVELS.length - 1) SAVE.unlocked = LEVELS.length + 1;
      if (L.card && !SAVE.cards.includes(L.card)) {
        SAVE.cards.push(L.card);
        const c = Tx.ch(L.card);
        extra.push('<button class="new-card" data-card="' + L.card + '" style="--cc:' + c.color + '"><span>' + portrait(L.card) + '</span><b>' + t("new_card", { c: c.name }) + '</b><small>' + t("tap_view") + '</small></button>');
        setTimeout(() => toast("🃏", t("card_toast", { c: c.name }), c.role), 600);
      }
      setStars(stars);
      const last = levelIdx === LEVELS.length - 1;
      title = last ? t("win_final") : t("win_bridge");
      text = t("win_text", { u: used, c: earned }) + (first ? t("win_first") : "") +
        (bestCombo >= 3 ? "<br>" + t("win_combo", { n: bestCombo }) : "") +
        (run.fire ? "<br>" + t("win_fire", { n: run.fire }) : "") +
        (stars < 3 ? "<br>" + t("win_tip", { n: par }) : "");
      nextLabel = last ? t("see_ending") : t("next_level");
    } else if (mode === "endless") {
      endless.built += L.slots;
      SAVE.endlessBest = Math.max(SAVE.endlessBest, endless.stage);
      const earned = 20 + endless.stage * 10;
      addCoins(earned); gained = earned;
      setStars(-1);
      title = t("endless_win", { n: endless.stage });
      text = t("endless_win_text", { s: stonesLeft, c: earned, b: SAVE.endlessBest });
      nextLabel = t("stage_next", { n: endless.stage + 1 });
    } else {
      const first = SAVE.daily.challengeDone !== todayStr();
      if (first) { SAVE.daily.challengeDone = todayStr(); SAVE.stats.dailyWins++; addCoins(150); gained = 150; }
      setStars(-1);
      title = t("daily_win");
      text = first ? t("daily_win_first") : t("daily_win_again");
      nextLabel = t("home");
    }
    persist(); refreshCoins(); checkAchievements();
    $("#winTitle").textContent = title;
    $("#winText").innerHTML = text;
    $("#winExtra").innerHTML = extra.join("");
    $("#winExtra").querySelectorAll("[data-card]").forEach(b => b.addEventListener("click", () => openCard(b.dataset.card)));
    $("#winNextBtn").textContent = nextLabel;
    $("#winReplayBtn").hidden = mode === "endless";
    show("#winOverlay");
    if (gained) setTimeout(() => { const r = $("#winText").getBoundingClientRect(); flyCoins(r.left + r.width / 2, r.top + 12, Math.min(14, 4 + Math.round(gained / 30))); }, 650);
  }
  function winNext() {
    sfx.click();
    if (mode === "endless") { const carry = stonesLeft, n = endless.stage + 1; wipe(t("stage", { n }), () => playEndless(n, carry)); return; }
    if (mode === "daily") { showMenu("modes"); return; }
    if (levelIdx >= LEVELS.length - 1) {
      hideAll();
      showStory(Tx.ending(), () => { showMenu("cards"); toast("🪷", t("journey_done"), t("journey_sub", { t: filmTitle() })); });
      return;
    }
    const next = levelIdx + 1;
    SAVE.interCount++; persist();
    if (SAVE.interCount % 2 === 0) openAd("interstitial", 3, () => goLevel(next));
    else goLevel(next);
  }
  function onFail() {
    hideAll();
    const canRevive = mode === "endless" ? !endless.revived : !reviveUsed;
    if (mode === "endless") {
      $("#failTitle").textContent = t("fail_endless", { n: endless.stage });
      $("#failText").innerHTML = t("fail_endless_text", { b: endless.built + slots.filter(s => s.done).length, r: SAVE.endlessBest });
    } else {
      $("#failTitle").textContent = t("fail_title");
      $("#failText").innerHTML = t("fail_text") + ((SAVE.inv.stones || 0) > 0 ? t("fail_bag_note", { n: SAVE.inv.stones }) : "");
    }
    $("#failRewardBtn").hidden = !canRevive;
    $("#failBagBtn").hidden = !((SAVE.inv.stones || 0) > 0);
    $("#failShareBtn").hidden = mode !== "endless";
    show("#failOverlay");
  }
  function revive(n) {
    stonesLeft += n; failTimer = -1;
    hideAll(); state = "aim"; setInGame(true);
    floater(monkeyPos().x + 40, monkeyPos().y - 120, t("stones_plus", { n }), "#ffd166");
    updateHUD();
  }

  /* ---------- Tạm dừng ---------- */
  let pausedFrom = null;
  function togglePause() {
    if (state === "pause") { hideAll(); state = pausedFrom || "aim"; pausedFrom = null; return; }
    if (!playing()) return;
    drag = null; spaceCharge = null;
    pausedFrom = state; state = "pause";
    syncToggles(); show("#pauseOverlay");
  }

  /* ---------- Quảng cáo: AdMob thật trong app, mô phỏng khi chưa có ---------- */
  let adTimer = null, adDone = null, adPrev = null;
  function openAd(kind, seconds, onDone) {
    if (Ads.ready(kind)) { openRealAd(kind, onDone); return; }
    if (IS_APP && kind === "interstitial") { onDone(); return; } // app: không tải được thì bỏ qua, không bắt chờ
    adDone = onDone; adPrev = state;
    hideAll(); show("#adOverlay");
    state = "ad";
    const btn = $("#adCloseBtn"), bar = $("#adProgressBar"), txt = $("#adCountText");
    btn.disabled = true;
    btn.textContent = kind === "rewarded" ? t("ad_watch_full") : t("ad_playing");
    let remain = seconds;
    const renderAd = () => {
      bar.style.width = ((seconds - remain) / seconds * 100) + "%";
      txt.textContent = t(kind === "rewarded" ? "ad_left_rew" : "ad_left", { n: Math.max(0, Math.ceil(remain)) });
      if (remain <= 0) {
        clearInterval(adTimer); adTimer = null;
        btn.disabled = false;
        btn.textContent = kind === "rewarded" ? t("ad_claim") : t("ad_close");
      }
    };
    renderAd();
    adTimer = setInterval(() => { remain -= 0.1; renderAd(); }, 100);
  }
  function openRealAd(kind, onDone) {
    const prev = state;
    state = "ad";
    if (audioCtx) audioCtx.suspend();
    Ads.show(kind).then((ok) => {
      if (audioCtx) { audioCtx.resume(); music.sync(); }
      if (kind === "interstitial" || ok) { state = prev === "fail" ? "aim" : prev; onDone(); return; }
      state = prev; // đóng rewarded sớm: không thưởng, giữ nguyên màn hình cũ
    });
  }

  /* ---------- Quà đăng nhập ---------- */
  function openDaily() {
    const today = todayStr(), claimed = SAVE.daily.lastClaim === today;
    const streak = claimed ? SAVE.daily.streak : (SAVE.daily.lastClaim === todayStr(-1) ? SAVE.daily.streak + 1 : 1);
    const dayIdx = (streak - 1) % 7;
    $("#dailyGrid").innerHTML = DAILY_REWARDS.map((r, i) => {
      const cls = i < dayIdx || (claimed && i === dayIdx) ? "got" : i === dayIdx ? "today" : "";
      const it = r.item ? POWERUPS.find(p => p.id === r.item) : null;
      return '<div class="dday ' + cls + '"><small>' + t("day", { n: i + 1 }) + '</small><b>' + COIN + r.coins + '</b>' + (it ? "<span>+" + ico(it.img, it.icon, "sm") + "</span>" : "") + '</div>';
    }).join("");
    $("#dailyStreak").textContent = t("streak", { n: streak });
    $("#dailyClaimBtn").disabled = claimed;
    $("#dailyClaimBtn").textContent = claimed ? t("claimed_today") : t("claim_day", { n: dayIdx + 1 });
    show("#dailyOverlay");
  }
  function claimDaily() {
    const today = todayStr();
    if (SAVE.daily.lastClaim === today) return;
    SAVE.daily.streak = SAVE.daily.lastClaim === todayStr(-1) ? SAVE.daily.streak + 1 : 1;
    SAVE.daily.lastClaim = today;
    const r = DAILY_REWARDS[(SAVE.daily.streak - 1) % 7];
    addCoins(r.coins);
    if (r.item) SAVE.inv[r.item] = (SAVE.inv[r.item] || 0) + 1;
    persist(); refreshCoins(); sfx.coin();
    toast("🎁", t("daily_toast", { c: r.coins }) + (r.item ? t("daily_toast_item") : ""), t("daily_toast_sub"));
    checkAchievements();
    $("#dailyDot").hidden = true;
    const br = $("#dailyClaimBtn").getBoundingClientRect();
    flyCoins(br.left + br.width / 2, br.top + br.height / 2, Math.min(14, 4 + Math.round(r.coins / 40)));
    $("#dailyOverlay").hidden = true;
    if (state === "menu") showMenu();
  }

  /* ---------- Cài đặt & ngôn ngữ ---------- */
  function syncToggles() {
    document.querySelectorAll("[data-toggle=sound]").forEach(b => { b.textContent = SAVE.sound ? t("sfx_on") : t("sfx_off"); b.classList.toggle("off", !SAVE.sound); });
    document.querySelectorAll("[data-toggle=haptic]").forEach(b => { b.textContent = SAVE.haptic ? t("vib_on") : t("vib_off"); b.classList.toggle("off", !SAVE.haptic); b.hidden = !navigator.vibrate; });
    document.querySelectorAll("[data-toggle=music]").forEach(b => { b.textContent = SAVE.music ? t("music_on") : t("music_off"); b.classList.toggle("off", !SAVE.music); });
    $("#soundBtn").textContent = SAVE.sound ? "🔊" : "🔇";
    $("#musicBtn").classList.toggle("off", !SAVE.music);
    $("#soundBtn").classList.toggle("off", !SAVE.sound);
  }
  function toggle(kind) {
    SAVE[kind] = !SAVE[kind]; persist();
    if (kind === "music") music.sync();
    if (kind === "haptic") buzz(30);
    sfx.click(); syncToggles();
  }
  function buildLangPickers() {
    document.querySelectorAll(".lang-sel").forEach(sel => {
      sel.innerHTML = LANGS.map(l => '<option value="' + l.id + '">' + (sel.classList.contains("short") ? l.short : l.label) + '</option>').join("");
      sel.value = LANG;
      sel.addEventListener("change", () => setLang(sel.value));
    });
  }
  function setLang(id) {
    if (!STR[id]) return;
    LANG = id; SAVE.lang = id; persist();
    document.querySelectorAll(".lang-sel").forEach(s => { s.value = id; });
    applyStatic(); buildPowerBar(); syncToggles(); renderFilm(); updateHUD(); updateWindHUD();
    if (state === "menu") renderTab();
  }

  /* ---------- PWA: đăng ký service worker & nút cài đặt ---------- */
  let installEvt = null;
  function isStandalone() { return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }
  function setupPWA() {
    if (IS_APP) { document.querySelectorAll(".install-btn").forEach(b => { b.hidden = true; }); $("#iosHint").hidden = true; return; }
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register("sw.js").then(reg => {
        if (!navigator.serviceWorker.controller) {
          reg.addEventListener("updatefound", () => {
            const w = reg.installing;
            if (w) w.addEventListener("statechange", () => { if (w.state === "activated") toast("📶", t("offline_ready")); });
          });
        }
      }).catch(() => { /* không hỗ trợ: game vẫn chạy online */ });
    }
    const showBtns = (on) => document.querySelectorAll(".install-btn").forEach(b => { b.hidden = !on; });
    showBtns(false);
    window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; showBtns(true); });
    window.addEventListener("appinstalled", () => { installEvt = null; showBtns(false); toast("📲", t("installed")); });
    document.querySelectorAll(".install-btn").forEach(b => b.addEventListener("click", async () => {
      if (!installEvt) return;
      installEvt.prompt();
      await installEvt.userChoice.catch(() => null);
      installEvt = null; showBtns(false);
    }));
    // iOS Safari không có beforeinstallprompt: hiện hướng dẫn thủ công
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    $("#iosHint").hidden = !(ios && !isStandalone());
  }

  /* ---------- Gắn sự kiện ---------- */
  function buildPowerBar() {
    $("#powerBar").innerHTML = POWERUPS.map((p, i) => {
      const tp = Tx.pw(p.id);
      return '<button class="pw" data-pw="' + p.id + '" type="button" title="' + esc(tp.name + " — " + tp.desc + " (" + t("pw_key", { n: i + 1 }) + ")") + '">' +
        '<span class="pi">' + ico(p.img, p.icon) + '</span><span class="cnt">0</span><span class="act"></span></button>';
    }).join("") +
      '<button class="pw ad" id="rewardBtn" type="button" title="' + esc(t("pw_ad_title")) + '"><span class="pi">📺</span><span class="lbl">+5</span></button>';
    document.querySelectorAll(".pw[data-pw]").forEach(b => b.addEventListener("click", () => usePower(b.dataset.pw)));
    $("#rewardBtn").addEventListener("click", () => {
      if (rewardUsedThisLevel || state !== "aim" || flying) return;
      openAd("rewarded", 5, () => { rewardUsedThisLevel = true; revive(5); });
    });
    updatePowerBar();
  }
  function init() {
    applyStatic();
    buildLangPickers();
    const fx = $("#menuFx");
    for (let i = 0; i < 26; i++) {
      const e = document.createElement("i");
      e.style.left = (Math.random() * 100) + "%";
      e.style.setProperty("--dx", (Math.random() * 90 - 45) + "px");
      e.style.setProperty("--s", (2 + Math.random() * 3.5) + "px");
      e.style.animationDuration = (6 + Math.random() * 8) + "s";
      e.style.animationDelay = (-Math.random() * 14) + "s";
      fx.appendChild(e);
    }
    buildPowerBar();
    setupPWA();
    document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => { sfx.click(); curTab = b.dataset.tab; renderTab(); }));
    $("#heroPlay").addEventListener("click", () => { sfx.click(); goLevel(Math.min(SAVE.unlocked - 1, LEVELS.length - 1)); });
    $("#storyNext").addEventListener("click", storyAdvance);
    $("#storySkip").addEventListener("click", () => { sfx.click(); storyEnd(); });
    $("#storyOverlay").addEventListener("click", (e) => { if (e.target.id === "storyOverlay") storyAdvance(); });
    $("#winNextBtn").addEventListener("click", winNext);
    $("#winReplayBtn").addEventListener("click", restartLevel);
    $("#winMenuBtn").addEventListener("click", () => { sfx.click(); showMenu(); });
    $("#failRewardBtn").addEventListener("click", () => openAd("rewarded", 5, () => {
      if (mode === "endless") endless.revived = true; else reviveUsed = true;
      revive(8);
    }));
    $("#failBagBtn").addEventListener("click", () => { SAVE.inv.stones--; SAVE.stats.powerUsed++; persist(); revive(5); });
    $("#failRetryBtn").addEventListener("click", restartLevel);
    $("#failMenuBtn").addEventListener("click", () => { sfx.click(); showMenu(); });
    $("#failShareBtn").addEventListener("click", () => share(t("share_endless", { n: endless.stage })));
    $("#adCloseBtn").addEventListener("click", () => {
      const cb = adDone; adDone = null;
      $("#adOverlay").hidden = true;
      if (cb) { state = adPrev === "fail" ? "aim" : adPrev; cb(); }
    });
    $("#pauseResumeBtn").addEventListener("click", togglePause);
    $("#pauseRestartBtn").addEventListener("click", () => { pausedFrom = null; restartLevel(); });
    $("#pauseMenuBtn").addEventListener("click", () => { pausedFrom = null; sfx.click(); showMenu(); });
    $("#pauseHelpBtn").addEventListener("click", () => { sfx.click(); show("#helpOverlay"); });
    $("#pauseBtn").addEventListener("click", togglePause);
    $("#menuBtn").addEventListener("click", () => { sfx.click(); showMenu(); });
    $("#helpBtn").addEventListener("click", () => { sfx.click(); show("#helpOverlay"); });
    $("#helpCloseBtn").addEventListener("click", () => { sfx.click(); $("#helpOverlay").hidden = true; });
    $("#cardCloseBtn").addEventListener("click", () => { sfx.click(); $("#cardOverlay").hidden = true; });
    $("#dailyBtn").addEventListener("click", () => { sfx.click(); openDaily(); });
    $("#dailyClaimBtn").addEventListener("click", claimDaily);
    $("#dailyCloseBtn").addEventListener("click", () => { sfx.click(); $("#dailyOverlay").hidden = true; });
    $("#settingsBtn").addEventListener("click", () => { sfx.click(); syncToggles(); show("#settingsOverlay"); });
    $("#settingsCloseBtn").addEventListener("click", () => { sfx.click(); $("#settingsOverlay").hidden = true; });
    // app: đổi trang trong WebView sang tên miền ngoài → Capacitor mở bằng trình duyệt hệ thống
    $("#privacyBtn").addEventListener("click", () => { sfx.click(); if (IS_APP) location.href = PRIVACY_URL; else window.open(PRIVACY_URL, "_blank", "noopener"); });
    $("#adPrivacyBtn").addEventListener("click", () => { sfx.click(); Ads.showPrivacyOptions(); });
    ADS_READY.then(() => { $("#adPrivacyBtn").hidden = !Ads.privacyRequired(); });
    $("#resetBtn").addEventListener("click", () => {
      if (!confirm(t("reset_confirm"))) return;
      const keepLang = SAVE.lang;
      resetSave(); SAVE.lang = keepLang; persist();
      syncToggles(); $("#settingsOverlay").hidden = true; showMenu("story");
      toast("🧹", t("reset_done"));
    });
    $("#soundBtn").addEventListener("click", () => toggle("sound"));
    $("#musicBtn").addEventListener("click", () => toggle("music"));
    document.querySelectorAll("[data-toggle]").forEach(b => b.addEventListener("click", () => toggle(b.dataset.toggle)));
    $("#filmShareBtn").addEventListener("click", shareProgress);
    window.addEventListener("resize", fitStage);
    // rời app / chuyển tab: tạm dừng game và âm thanh
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { if (playing()) togglePause(); if (audioCtx) audioCtx.suspend(); }
      else if (audioCtx) { audioCtx.resume(); music.sync(); }
    });
    // nút Back Android: đóng lớp phủ → tạm dừng → về menu → thoát app
    Native.on("App", "backButton", () => {
      for (const sel of ["#helpOverlay", "#cardOverlay", "#settingsOverlay", "#dailyOverlay"]) { if (!$(sel).hidden) { $(sel).hidden = true; return; } }
      if (state === "ad") return;
      if (state === "story") { storyEnd(); return; }
      if (playing() || state === "pause") { togglePause(); return; }
      if (state === "win" || state === "fail") { showMenu(); return; }
      Native.exitApp();
    });
    window.addEventListener("orientationchange", () => setTimeout(fitStage, 200));
    window.addEventListener("keydown", (e) => {
      if (e.target && e.target.tagName === "SELECT") return;
      if (e.code === "KeyH" && state !== "story") show("#helpOverlay");
      if ((e.code === "Enter" || e.code === "Space") && state === "story") { e.preventDefault(); storyAdvance(); }
    });
    // nhạc nền cần thao tác người dùng đầu tiên để khởi động
    document.addEventListener("pointerdown", function once() { ac(); music.sync(); document.removeEventListener("pointerdown", once); });

    syncToggles(); renderFilm();
    startLevel(LEVELS[Math.min(SAVE.unlocked - 1, LEVELS.length - 1)]);
    showMenu("story");
    fitStage();
    if (SAVE.daily.lastClaim !== todayStr()) setTimeout(openDaily, 500);
    checkAchievements();
    requestAnimationFrame(loop);
  }

  return { init, onWin, onFail, togglePause, restartLevel, checkAchievements, toast, refreshCoins, flyCoins };
})();
UI.init();
