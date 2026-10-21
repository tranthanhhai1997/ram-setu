"use strict";
/* =====================================================================
   ĐA NGÔN NGỮ — vi (gốc trong data.js) · en · hi
   - STR: chuỗi giao diện, dùng t("key", {biến})
   - CONTENT: bản dịch nội dung game (nhân vật, màn, cốt truyện…);
     thiếu bản dịch sẽ tự lấy tiếng Việt trong data.js
   ===================================================================== */
const LANGS = [
  { id: "vi", label: "Tiếng Việt", short: "VI" },
  { id: "en", label: "English",    short: "EN" },
  { id: "hi", label: "हिन्दी",       short: "हिं" }
];

const STR = {
  vi: {
    doc_title: "Xây Cầu Ram Setu — Hành trình Ramayana",
    brand_html: "Xây Cầu <em>Ram Setu</em>", logo: "Ram Setu",
    coin_t: "Vàng", next_t: "Viên đá sắp ném", daily_t: "Quà đăng nhập hằng ngày", music_t: "Bật/tắt nhạc nền", sound_t: "Bật/tắt hiệu ứng âm thanh",
    help_t: "Cách chơi (H)", settings_t: "Cài đặt", lang_t: "Ngôn ngữ", menu: "☰ Menu", share: "📣 Chia sẻ", install: "📲 Cài đặt game",
    hud_wind: "Gió", hud_combo: "Combo", hud_stones: "Đá còn", pause_t: "Tạm dừng (P)",
    kicker: "Hành trình Ramayana", hero_sub: "Chỉ huy đội quân vanara ném những tảng đá khắc tên Rama, nối cây cầu huyền thoại vượt biển tới Lanka.",
    tab_story: "📜 Cốt truyện", tab_modes: "♾️ Chế độ", tab_shop: "🛕 Cửa hàng", tab_cards: "🃏 Thẻ", tab_ach: "🏆 Thành tựu",
    skip: "Bỏ qua ⏭", next: "Tiếp ▸", start: "Bắt đầu ▸",
    replay: "↻ Chơi lại", fail_title: "Hết đá rồi!", fail_ad: "📺 Xem quảng cáo · Nhận +8 đá", fail_bag: "🪨 Dùng Túi đá (+5)",
    fail_share: "📣 Chia sẻ kỷ lục", menu_btn: "☰ Menu",
    pause_title: "Tạm dừng", resume: "▶ Tiếp tục", restart_level: "↻ Chơi lại màn", help_btn: "? Cách chơi", back_menu: "☰ Về menu",
    daily_title: "🎁 Quà đăng nhập", daily_note: "Đăng nhập liên tục 7 ngày để nhận quà lớn. Bỏ lỡ một ngày, chuỗi sẽ bắt đầu lại.",
    later: "Để sau", claim_day: "🎁 Nhận quà ngày {n}", claimed_today: "✓ Đã nhận hôm nay", streak: "Chuỗi đăng nhập: {n} ngày", day: "Ngày {n}",
    ad_tag: "Quảng cáo · Mô phỏng", ad_brand: "Du lịch Tâm Linh Ấn Độ", ad_head: "Hành hương Rameswaram — chạm tay vào cầu Ram Setu huyền thoại",
    ad_desc: "Nội dung quảng cáo mẫu. Trong bản phát hành, SDK quảng cáo sẽ hiển thị quảng cáo thật tại đây.",
    ad_playing: "Đang phát…", ad_watch_full: "Xem hết để nhận thưởng…", ad_left: "Quảng cáo kết thúc sau {n} giây…",
    ad_left_rew: "Quảng cáo kết thúc sau {n} giây — xem hết để nhận thưởng.", ad_claim: "🎁 Nhận thưởng & đóng", ad_close: "✕ Đóng quảng cáo",
    help_title: "Cách chơi", got_it: "Đã hiểu!", close: "Đóng", settings_title: "Cài đặt", reset: "🧹 Xóa tiến trình", done: "Xong",
    saved_note: "Tiến trình được lưu tự động trên thiết bị này.",
    vib_on: "📳 Rung: Bật", vib_off: "📳 Rung: Tắt",
    music_on: "🎵 Nhạc nền: Bật", music_off: "🎵 Nhạc nền: Tắt", sfx_on: "🔊 Hiệu ứng: Bật", sfx_off: "🔇 Hiệu ứng: Tắt",
    ios_install: "Trên iPhone/iPad: nhấn Chia sẻ ⎋ trong Safari → \"Thêm vào MH chính\" để cài game.",
    banner_tag: "Quảng cáo", banner: "Vị trí banner 728×90 (mô phỏng)",
    help_html: `<p><b>🎯 Ngắm bắn:</b> nhấn giữ, kéo chuột/ngón tay về phía sau như kéo ná, thả ra để ném. Bàn phím: giữ <kbd>Space</kbd> nạp lực, thả để ném.</p>
<p><b>🧱 Xếp đá:</b> mỗi ô cầu cần đủ số lớp đá. Đá rơi vào ô đã đầy là phí một viên.</p>
<p><b>✦ Đá thiêng:</b> cứ 5 lần ném có 1 viên vàng, tính bằng 2 viên thường.</p>
<p><b>🌬️ Gió:</b> gió đẩy đá lệch khi bay — kéo bù. Gió giật 🌪 có thể đổi hướng giữa đường bay.</p>
<p><b>💫 Vòng vàng:</b> ném xuyên qua để được +1 đá.</p>
<p><b>🕊 Chim mòng biển:</b> đá trúng chim sẽ rơi thẳng xuống biển.</p>
<p><b>🐊 Makara:</b> thủy quái trồi lên ở một ô — đá rơi vào miệng nó sẽ mất.</p>
<p><b>☄️ Cầu lửa Ravana:</b> rơi trúng ô đang xây dở sẽ thiêu một lớp đá (ô đã xong thì an toàn). Ném trúng cầu lửa giữa không trung để chặn và nhận +5 vàng.</p>
<p><b>🧪 Vật phẩm:</b> phím <kbd>1</kbd>–<kbd>4</kbd> hoặc thanh dưới góc trái: Lặng gió, Mắt Rama, Phúc lành, Túi đá.</p>
<p><b>⭐ Sao & vàng:</b> càng ít lần ném càng nhiều sao. Combo cao, đá dư nhiều = thêm vàng.</p>
<p><b>⌨️ Phím tắt:</b> <kbd>P</kbd>/<kbd>Esc</kbd> tạm dừng · <kbd>R</kbd> chơi lại · <kbd>H</kbd> hướng dẫn.</p>`,
    panel1_html: `<h2>🌉 Huyền thoại Ram Setu</h2><p><b>Ram Setu</b> (còn gọi là Cầu Adam) là dải đá vôi và bãi cát ngầm nối đảo Pamban của Ấn Độ với đảo Mannar của Sri Lanka. Trong sử thi <b>Ramayana</b>, đây là cây cầu do đội quân vanara xây dưới sự chỉ huy của <b>Nala</b>, con trai thần thợ Vishwakarma.</p><p>Những tảng đá được khắc tên <b>Rama (राम)</b> nên nổi trên mặt biển — trong game, mỗi viên đá bạn ném đều mang dòng chữ ấy.</p>`,
    panel2_html: `<h2>🎮 Có gì trong game</h2><ul><li><b>12 màn cốt truyện</b> qua 3 chương, có hội thoại cùng Rama, Hanuman, Nala, Ravana…</li><li><b>Biển vô tận</b> và <b>Thử thách ngày</b> để so kỷ lục với bạn bè.</li><li><b>13 thẻ nhân vật</b> kể truyền thuyết Ramayana — sưu tầm đủ bộ!</li><li><b>Cửa hàng</b>: trang phục Hanuman, Sugriva, Angada… và đá cẩm thạch, ngọc lam.</li><li><b>15 thành tựu</b> và <b>quà đăng nhập 7 ngày</b>.</li></ul>`,
    panel3_html: `<h2>🎬 Ramayana trên màn ảnh rộng</h2><p>Sử thi về Rama, Sita và Hanuman sắp được kể lại trên màn ảnh rộng. Hoàn thành cây cầu trong game trước ngày công chiếu và chia sẻ thành tích của bạn với <b>#RamSetuChallenge</b>!</p>`,
    footer: "Game \"Xây Cầu Ram Setu\" — lấy cảm hứng từ sử thi Ramayana. Hỗ trợ chuột, cảm ứng, bàn phím và chơi offline.",
    film_soon: "🎬 <b>{t}</b> — sắp ra mắt", film_days: "🎬 <b>{t}</b> lên màn ảnh rộng — còn <b class='big'>{d}</b> ngày",
    film_now: "🎬 <b>{t}</b> đang công chiếu — ra rạp ngay!", film_tag: "🎬 <b>{t}</b> — sử thi vĩ đại nhất trên màn ảnh rộng",
    share_title: "Xây Cầu Ram Setu", share_copied: "Đã sao chép nội dung chia sẻ", share_copied_sub: "Dán vào mạng xã hội để thách đấu bạn bè!",
    share_progress: "Tôi đã xây {a}/12 đoạn cầu Ram Setu với {s}⭐ và {c} thẻ nhân vật Ramayana. Bạn dám thử không?",
    share_endless: "Tôi đã vượt {n} chặng trên Biển vô tận trong game Xây Cầu Ram Setu! Ai phá được kỷ lục này?",
    begin_journey: "Bắt đầu hành trình", continue_lv: "Tiếp tục — Màn {n}", stars_cards: "⭐ {s}/{S} sao · 🃏 {c}/{C} thẻ",
    level: "Màn {n}", slots_layers: "{s} ô × {n} lớp", view_ending: "📜 Xem lại phần kết",
    endless_name: "Biển vô tận", endless_desc: "Các chặng cầu ngẫu nhiên nối tiếp nhau, đá dư được mang sang chặng sau. Bạn đi được bao xa?",
    record: "Kỷ lục: <b>{n}</b> chặng", play_endless: "▶ Chơi Vô tận",
    daily_name: "Thử thách ngày", daily_desc: "Một màn chơi mới mỗi ngày, giống nhau cho mọi người chơi — so tài cùng bạn bè!",
    daily_done: "✅ Đã hoàn thành hôm nay — quay lại ngày mai", daily_reward: "Thưởng lần đầu hoàn thành: <b>150 vàng</b>",
    replay2: "Chơi lại", take_challenge: "Nhận thử thách",
    shop_items: "Vật phẩm hỗ trợ", shop_items_hint: "dùng trong màn bằng phím 1–4", owned: "Đang có: {n}",
    shop_skins: "Trang phục chiến binh", equipped: "✓ Đang dùng", equip: "Trang bị", need_card: "🔒 Cần thẻ {c}",
    shop_stones: "Đá khắc tên Rama", unlock_ch3: "🔒 Mở ở Chương III", bought: "Đã mua {x}", owned_now: "Đã sở hữu: {x}",
    cards_count_html: "Đã sưu tầm <b>{n}/{N}</b> thẻ nhân vật Ramayana — nhấn vào thẻ để đọc truyền thuyết.",
    card_free: "Có sẵn", card_cond: "Hoàn thành màn {n}",
    ach_count_html: "Hoàn thành <b>{n}/{N}</b> thành tựu", share_ach: "📣 Chia sẻ thành tích",
    stage: "Chặng {n}", endless_sub: "♾️ Biển vô tận", daily_lv: "Thử thách {d}", daily_sub: "🗓️ Thử thách ngày",
    win_bridge: "Nối xong đoạn cầu!", win_final: "Cầu Ram Setu hoàn thành!",
    win_text: "Ném <b>{u} viên</b> · Nhận <b>+{c} vàng</b>", win_first: " <small>(gồm +100 lần đầu)</small>",
    win_combo: "🔥 Combo cao nhất <b>×{n}</b>", win_fire: "🛡️ Chặn <b>{n}</b> cầu lửa", win_tip: "<small>Mẹo 3 sao: ném ≤ {n} viên.</small>",
    see_ending: "Xem phần kết →", next_level: "Màn tiếp theo →", new_card: "Thẻ mới: {c}", tap_view: "Nhấn để xem", card_toast: "Mở khóa thẻ {c}",
    endless_win: "Vượt chặng {n}!", endless_win_text: "Mang theo <b>{s} đá</b> sang chặng sau · <b>+{c} vàng</b><br>Kỷ lục: <b>{b}</b> chặng",
    stage_next: "Chặng {n} →", daily_win: "Thử thách ngày hoàn thành!", daily_win_first: "Nhận <b>+150 vàng</b>. Hẹn gặp lại vào thử thách ngày mai!",
    daily_win_again: "Bạn đã nhận thưởng hôm nay. Ngày mai có thử thách mới!", home: "Về màn hình chính",
    fail_endless: "Hết đá ở chặng {n}", fail_endless_text: "Bạn đã nối <b>{b} ô cầu</b> trên biển vô tận.<br>Kỷ lục: <b>{r}</b> chặng.",
    fail_text: "Cây cầu còn dang dở giữa biển khơi. Xem quảng cáo ngắn để xin thêm đá của thần linh, hoặc thử lại với lối ném khéo hơn.",
    fail_bag_note: "<br><small>Bạn còn {n} Túi đá — có thể dùng ngay.</small>",
    journey_done: "Hành trình hoàn tất!", journey_sub: "Đón xem {t} trên màn ảnh rộng", stones_plus: "+{n} đá — cố lên!",
    ach_toast: "Thành tựu: {n}", coins_plus: "+{n} vàng", daily_toast: "Nhận +{c} vàng", daily_toast_item: " và 1 vật phẩm",
    daily_toast_sub: "Quay lại ngày mai để nhận quà lớn hơn!",
    reset_confirm: "Xóa toàn bộ tiến trình, vàng, thẻ và thành tựu? Thao tác này không thể hoàn tác.", reset_done: "Đã đặt lại tiến trình",
    pw_key: "phím {n}", pw_ad_title: "Xem quảng cáo để nhận 5 đá (1 lần mỗi màn)",
    installed: "Đã cài game lên thiết bị", offline_ready: "Sẵn sàng chơi offline",
    hud_lv: "Màn {n} · {ch}", wind_calm: "Lặng 🌬️", wind_none: "Yên", wind_tail: "Xuôi →", wind_head: "← Ngược",
    stone_gold: "Đá thiêng ✦", stone_normal: "Đá thường",
    f_barrier: 'Kết giới quỷ chặn cầu!', f_shield: 'Quỷ đỡ bằng khiên!', f_demon_down: 'Diệt quỷ! Kết giới tan!', f_demon_heal: 'Quỷ hồi máu +1', f_demon_appear: 'Quỷ Rakshasa xuất hiện!', f_demon_tip: 'Ném trúng quỷ để phá kết giới!', help_demon: `<p><b>👺 Quỷ Rakshasa:</b> dựng kết giới chặn cầu — đá rơi vào ô bị chặn sẽ mất. Ném trúng quỷ cho đến hết máu (đá thiêng = 2 sát thương). Quỷ có thể giơ khiên hoặc tự hồi máu nếu bạn chậm tay.</p>`,
    f_stones5: "+5 đá!", f_calm: "🌬️ Biển lặng gió!", f_sight: "🎯 Mắt Rama khai mở!", f_bless: "✨ Phúc lành Rama!",
    tut_drag: "Nhấn giữ, kéo về sau rồi thả!", f_makara: "Makara nuốt mất đá!", f_full: "Ô đã đầy — phí đá!", f_combo: "🔥 Combo ×{n}!",
    f_gold2: "Đá thiêng +2!", f_slot_done: "Nối xong một ô!", f_sink_combo: "Chìm rồi! Mất combo ×{n}", f_sink: "Chìm rồi!",
    f_shield: "Phép thuật bảo vệ cầu!", f_burn: "🔥 Lửa thiêu mất đá!", f_gust_r: "🌪 Gió giật →", f_gust_l: "← Gió giật 🌪",
    f_gull: "Trúng chim mòng biển!", f_fire_block: "Chặn lửa! +5 vàng", f_ring: "+1 đá!", f_pull: "Kéo xa hơn nữa!"
  },

  en: {
    doc_title: "Ram Setu Bridge Builder — A Ramayana Adventure",
    brand_html: "Build the <em>Ram Setu</em>", logo: "Ram Setu",
    coin_t: "Gold", next_t: "Next stone", daily_t: "Daily login reward", music_t: "Toggle music", sound_t: "Toggle sound effects",
    help_t: "How to play (H)", settings_t: "Settings", lang_t: "Language", menu: "☰ Menu", share: "📣 Share", install: "📲 Install game",
    hud_wind: "Wind", hud_combo: "Combo", hud_stones: "Stones", pause_t: "Pause (P)",
    kicker: "A Ramayana Adventure", hero_sub: "Lead the vanara army as they hurl stones inscribed with Rama's name, building the legendary bridge across the sea to Lanka.",
    tab_story: "📜 Story", tab_modes: "♾️ Modes", tab_shop: "🛕 Shop", tab_cards: "🃏 Cards", tab_ach: "🏆 Achievements",
    skip: "Skip ⏭", next: "Next ▸", start: "Begin ▸",
    replay: "↻ Replay", fail_title: "Out of stones!", fail_ad: "📺 Watch an ad · Get +8 stones", fail_bag: "🪨 Use Stone Bag (+5)",
    fail_share: "📣 Share my record", menu_btn: "☰ Menu",
    pause_title: "Paused", resume: "▶ Resume", restart_level: "↻ Restart level", help_btn: "? How to play", back_menu: "☰ Main menu",
    daily_title: "🎁 Daily Reward", daily_note: "Log in 7 days in a row for the big prize. Miss a day and the streak starts over.",
    later: "Later", claim_day: "🎁 Claim day {n}", claimed_today: "✓ Claimed today", streak: "Login streak: {n} days", day: "Day {n}",
    ad_tag: "Ad · Simulated", ad_brand: "India Pilgrimage Tours", ad_head: "Pilgrimage to Rameswaram — touch the legendary Ram Setu",
    ad_desc: "Sample ad content. In the release build, the ad SDK will show real ads here.",
    ad_playing: "Playing…", ad_watch_full: "Watch to the end for your reward…", ad_left: "Ad ends in {n}s…",
    ad_left_rew: "Ad ends in {n}s — watch to the end to get your reward.", ad_claim: "🎁 Claim & close", ad_close: "✕ Close ad",
    help_title: "How to play", got_it: "Got it!", close: "Close", settings_title: "Settings", reset: "🧹 Reset progress", done: "Done",
    saved_note: "Progress is saved automatically on this device.",
    vib_on: "📳 Vibration: On", vib_off: "📳 Vibration: Off",
    music_on: "🎵 Music: On", music_off: "🎵 Music: Off", sfx_on: "🔊 Sound: On", sfx_off: "🔇 Sound: Off",
    ios_install: "On iPhone/iPad: tap Share ⎋ in Safari → \"Add to Home Screen\" to install.",
    banner_tag: "Ad", banner: "728×90 banner slot (simulated)",
    help_html: `<p><b>🎯 Aim:</b> press and hold, drag back like a slingshot, release to throw. Keyboard: hold <kbd>Space</kbd> to charge, release to throw.</p>
<p><b>🧱 Stack:</b> each bridge section needs enough layers of stone. A stone dropped on a full section is wasted.</p>
<p><b>✦ Sacred Stone:</b> every 5th throw is golden and counts as 2 stones.</p>
<p><b>🌬️ Wind:</b> wind pushes stones in flight — compensate. Gusts 🌪 can change direction mid-flight.</p>
<p><b>💫 Golden ring:</b> throw through it for +1 stone.</p>
<p><b>🕊 Seagulls:</b> a stone that hits a gull drops straight into the sea.</p>
<p><b>🐊 Makara:</b> this sea monster surfaces at a section — stones falling into its jaws are lost.</p>
<p><b>☄️ Ravana's fireballs:</b> burn one layer off an unfinished section (finished sections are safe). Hit a fireball mid-air to block it and earn +5 gold.</p>
<p><b>🧪 Power-ups:</b> keys <kbd>1</kbd>–<kbd>4</kbd> or the bar at the bottom left: Calm, Rama's Sight, Blessing, Stone Bag.</p>
<p><b>⭐ Stars & gold:</b> fewer throws = more stars. High combos and leftover stones = more gold.</p>
<p><b>⌨️ Shortcuts:</b> <kbd>P</kbd>/<kbd>Esc</kbd> pause · <kbd>R</kbd> restart · <kbd>H</kbd> help.</p>`,
    panel1_html: `<h2>🌉 The Legend of Ram Setu</h2><p><b>Ram Setu</b> (also called Adam's Bridge) is a chain of limestone shoals linking Pamban Island in India with Mannar Island in Sri Lanka. In the <b>Ramayana</b>, it is the bridge built by the vanara army under <b>Nala</b>, son of the divine craftsman Vishwakarma.</p><p>The stones bore the name <b>Rama (राम)</b> and floated on the sea — in this game, every stone you throw carries that name.</p>`,
    panel2_html: `<h2>🎮 What's inside</h2><ul><li><b>12 story levels</b> across 3 chapters, with dialogue featuring Rama, Hanuman, Nala, Ravana…</li><li><b>Endless Sea</b> and <b>Daily Challenge</b> to compete with friends.</li><li><b>13 character cards</b> telling Ramayana legends — collect them all!</li><li><b>Shop</b>: Hanuman, Sugriva and Angada outfits… plus marble and jade stones.</li><li><b>15 achievements</b> and a <b>7-day login reward</b>.</li></ul>`,
    panel3_html: `<h2>🎬 Ramayana on the big screen</h2><p>The epic of Rama, Sita and Hanuman is coming to the big screen. Finish the bridge before release day and share your progress with <b>#RamSetuChallenge</b>!</p>`,
    footer: "\"Ram Setu Bridge Builder\" — inspired by the Ramayana. Mouse, touch, keyboard and offline play supported.",
    film_soon: "🎬 <b>{t}</b> — coming soon", film_days: "🎬 <b>{t}</b> hits the big screen in <b class='big'>{d}</b> days",
    film_now: "🎬 <b>{t}</b> is now in cinemas!", film_tag: "🎬 <b>{t}</b> — the greatest epic on the big screen",
    share_title: "Ram Setu Bridge Builder", share_copied: "Share text copied", share_copied_sub: "Paste it on social media to challenge your friends!",
    share_progress: "I've built {a}/12 sections of the Ram Setu with {s}⭐ and {c} Ramayana character cards. Can you beat me?",
    share_endless: "I crossed {n} stages of the Endless Sea in Ram Setu Bridge Builder! Who can beat my record?",
    begin_journey: "Begin the journey", continue_lv: "Continue — Level {n}", stars_cards: "⭐ {s}/{S} stars · 🃏 {c}/{C} cards",
    level: "Level {n}", slots_layers: "{s} sections × {n} layers", view_ending: "📜 Watch the ending again",
    endless_name: "Endless Sea", endless_desc: "Random bridge stages one after another; leftover stones carry over. How far can you go?",
    record: "Best: <b>{n}</b> stages", play_endless: "▶ Play Endless",
    daily_name: "Daily Challenge", daily_desc: "A new level every day, the same for every player — compete with your friends!",
    daily_done: "✅ Completed today — come back tomorrow", daily_reward: "First clear reward: <b>150 gold</b>",
    replay2: "Play again", take_challenge: "Take the challenge",
    shop_items: "Power-ups", shop_items_hint: "use in a level with keys 1–4", owned: "Owned: {n}",
    shop_skins: "Warrior outfits", equipped: "✓ Equipped", equip: "Equip", need_card: "🔒 Needs {c} card",
    shop_stones: "Stones inscribed with Rama's name", unlock_ch3: "🔒 Unlocks in Chapter III", bought: "Bought {x}", owned_now: "Now yours: {x}",
    cards_count_html: "Collected <b>{n}/{N}</b> Ramayana character cards — tap a card to read its legend.",
    card_free: "Starter card", card_cond: "Complete level {n}",
    ach_count_html: "Completed <b>{n}/{N}</b> achievements", share_ach: "📣 Share my progress",
    stage: "Stage {n}", endless_sub: "♾️ Endless Sea", daily_lv: "Challenge {d}", daily_sub: "🗓️ Daily Challenge",
    win_bridge: "Section complete!", win_final: "The Ram Setu is complete!",
    win_text: "Threw <b>{u} stones</b> · Earned <b>+{c} gold</b>", win_first: " <small>(incl. +100 first clear)</small>",
    win_combo: "🔥 Best combo <b>×{n}</b>", win_fire: "🛡️ Blocked <b>{n}</b> fireballs", win_tip: "<small>3-star tip: use ≤ {n} throws.</small>",
    see_ending: "See the ending →", next_level: "Next level →", new_card: "New card: {c}", tap_view: "Tap to view", card_toast: "Card unlocked: {c}",
    endless_win: "Stage {n} cleared!", endless_win_text: "Carrying <b>{s} stones</b> to the next stage · <b>+{c} gold</b><br>Best: <b>{b}</b> stages",
    stage_next: "Stage {n} →", daily_win: "Daily Challenge complete!", daily_win_first: "You earned <b>+150 gold</b>. See you at tomorrow's challenge!",
    daily_win_again: "You've already claimed today's reward. A new challenge arrives tomorrow!", home: "Back to main menu",
    fail_endless: "Out of stones at stage {n}", fail_endless_text: "You built <b>{b} sections</b> on the Endless Sea.<br>Best: <b>{r}</b> stages.",
    fail_text: "The bridge stands unfinished in the open sea. Watch a short ad to ask the gods for more stones, or try again with better aim.",
    fail_bag_note: "<br><small>You have {n} Stone Bag(s) — use one now.</small>",
    journey_done: "Journey complete!", journey_sub: "Watch {t} on the big screen", stones_plus: "+{n} stones — keep going!",
    ach_toast: "Achievement: {n}", coins_plus: "+{n} gold", daily_toast: "Got +{c} gold", daily_toast_item: " and 1 power-up",
    daily_toast_sub: "Come back tomorrow for a bigger reward!",
    reset_confirm: "Delete all progress, gold, cards and achievements? This cannot be undone.", reset_done: "Progress reset",
    pw_key: "key {n}", pw_ad_title: "Watch an ad for 5 stones (once per level)",
    installed: "Game installed on your device", offline_ready: "Ready to play offline",
    hud_lv: "Level {n} · {ch}", wind_calm: "Calm 🌬️", wind_none: "Still", wind_tail: "Tail →", wind_head: "← Head",
    stone_gold: "Sacred ✦", stone_normal: "Stone",
    f_barrier: 'A demon barrier blocks the bridge!', f_shield: "Blocked by the demon's shield!", f_demon_down: 'Demon defeated! Barrier gone!', f_demon_heal: 'Demon heals +1', f_demon_appear: 'A Rakshasa appears!', f_demon_tip: 'Hit the demon to break the barrier!', help_demon: `<p><b>👺 Rakshasa demons:</b> raise a barrier that blocks the bridge — stones landing on blocked sections are lost. Hit the demon until its health runs out (Sacred Stone = 2 damage). Demons may raise a shield or heal if you are too slow.</p>`,
    f_stones5: "+5 stones!", f_calm: "🌬️ The sea is calm!", f_sight: "🎯 Rama's Sight!", f_bless: "✨ Rama's Blessing!",
    tut_drag: "Press, drag back, then release!", f_makara: "Makara swallowed it!", f_full: "Section full — stone wasted!", f_combo: "🔥 Combo ×{n}!",
    f_gold2: "Sacred Stone +2!", f_slot_done: "Section complete!", f_sink_combo: "Sunk! Combo ×{n} lost", f_sink: "Sunk!",
    f_shield: "The bridge is protected!", f_burn: "🔥 Fire burned a stone!", f_gust_r: "🌪 Gust →", f_gust_l: "← Gust 🌪",
    f_gull: "Hit a seagull!", f_fire_block: "Blocked! +5 gold", f_ring: "+1 stone!", f_pull: "Pull back further!"
  },

  hi: {
    doc_title: "राम सेतु निर्माण — रामायण की यात्रा",
    brand_html: "<em>राम सेतु</em> बनाओ", logo: "राम सेतु",
    coin_t: "सिक्के", next_t: "अगला पत्थर", daily_t: "दैनिक इनाम", music_t: "संगीत चालू/बंद", sound_t: "ध्वनि प्रभाव चालू/बंद",
    help_t: "कैसे खेलें (H)", settings_t: "सेटिंग्स", lang_t: "भाषा", menu: "☰ मेनू", share: "📣 शेयर", install: "📲 गेम इंस्टॉल करें",
    hud_wind: "हवा", hud_combo: "कॉम्बो", hud_stones: "पत्थर", pause_t: "रोकें (P)",
    kicker: "रामायण की यात्रा", hero_sub: "वानर सेना का नेतृत्व करें — राम नाम लिखे पत्थर फेंककर समुद्र पार लंका तक दिव्य सेतु बनाएँ।",
    tab_story: "📜 कथा", tab_modes: "♾️ मोड", tab_shop: "🛕 दुकान", tab_cards: "🃏 कार्ड", tab_ach: "🏆 उपलब्धियाँ",
    skip: "छोड़ें ⏭", next: "आगे ▸", start: "शुरू करें ▸",
    replay: "↻ फिर खेलें", fail_title: "पत्थर ख़त्म!", fail_ad: "📺 विज्ञापन देखें · +8 पत्थर पाएँ", fail_bag: "🪨 पत्थरों का थैला (+5)",
    fail_share: "📣 रिकॉर्ड शेयर करें", menu_btn: "☰ मेनू",
    pause_title: "रुका हुआ", resume: "▶ जारी रखें", restart_level: "↻ स्तर फिर से", help_btn: "? कैसे खेलें", back_menu: "☰ मुख्य मेनू",
    daily_title: "🎁 दैनिक इनाम", daily_note: "बड़ा इनाम पाने के लिए लगातार 7 दिन लॉग इन करें। एक दिन चूके तो सिलसिला फिर से शुरू होगा।",
    later: "बाद में", claim_day: "🎁 दिन {n} का इनाम लें", claimed_today: "✓ आज का इनाम मिल गया", streak: "लॉगिन सिलसिला: {n} दिन", day: "दिन {n}",
    ad_tag: "विज्ञापन · नमूना", ad_brand: "भारत तीर्थ यात्रा", ad_head: "रामेश्वरम की तीर्थ यात्रा — दिव्य राम सेतु के दर्शन करें",
    ad_desc: "नमूना विज्ञापन। रिलीज़ संस्करण में यहाँ असली विज्ञापन दिखेंगे।",
    ad_playing: "चल रहा है…", ad_watch_full: "इनाम के लिए पूरा देखें…", ad_left: "विज्ञापन {n} सेकंड में ख़त्म…",
    ad_left_rew: "विज्ञापन {n} सेकंड में ख़त्म — इनाम के लिए पूरा देखें।", ad_claim: "🎁 इनाम लें और बंद करें", ad_close: "✕ विज्ञापन बंद करें",
    help_title: "कैसे खेलें", got_it: "समझ गया!", close: "बंद करें", settings_title: "सेटिंग्स", reset: "🧹 प्रगति मिटाएँ", done: "हो गया",
    saved_note: "प्रगति इस डिवाइस पर अपने-आप सहेजी जाती है।",
    vib_on: "📳 कंपन: चालू", vib_off: "📳 कंपन: बंद",
    music_on: "🎵 संगीत: चालू", music_off: "🎵 संगीत: बंद", sfx_on: "🔊 ध्वनि: चालू", sfx_off: "🔇 ध्वनि: बंद",
    ios_install: "iPhone/iPad पर: Safari में शेयर ⎋ दबाएँ → \"Add to Home Screen\" चुनें।",
    banner_tag: "विज्ञापन", banner: "728×90 बैनर स्थान (नमूना)",
    help_html: `<p><b>🎯 निशाना:</b> दबाकर रखें, गुलेल की तरह पीछे खींचें, फेंकने के लिए छोड़ें। कीबोर्ड: <kbd>Space</kbd> दबाकर शक्ति भरें, छोड़कर फेंकें।</p>
<p><b>🧱 पत्थर जमाएँ:</b> सेतु के हर खंड को पर्याप्त परतें चाहिए। भरे हुए खंड पर गिरा पत्थर व्यर्थ जाता है।</p>
<p><b>✦ पवित्र पत्थर:</b> हर 5वाँ पत्थर सुनहरा होता है और 2 पत्थरों के बराबर है।</p>
<p><b>🌬️ हवा:</b> हवा उड़ते पत्थर को धकेलती है — उसी हिसाब से खींचें। झोंके 🌪 बीच उड़ान में दिशा बदल सकते हैं।</p>
<p><b>💫 सुनहरा छल्ला:</b> इसके बीच से फेंकें और +1 पत्थर पाएँ।</p>
<p><b>🕊 समुद्री पक्षी:</b> पक्षी से टकराया पत्थर सीधा समुद्र में गिरता है।</p>
<p><b>🐊 मकर:</b> यह जलदानव किसी खंड पर ऊपर आता है — उसके जबड़ों में गिरा पत्थर खो जाता है।</p>
<p><b>☄️ रावण के आग के गोले:</b> अधूरे खंड की एक परत जला देते हैं (पूरे खंड सुरक्षित हैं)। हवा में गोले को मारकर रोकें और +5 सिक्के पाएँ।</p>
<p><b>🧪 सहायक वस्तुएँ:</b> कुंजी <kbd>1</kbd>–<kbd>4</kbd> या नीचे बाईं ओर की पट्टी: वायु शांति, राम दृष्टि, आशीर्वाद, पत्थरों का थैला।</p>
<p><b>⭐ सितारे और सिक्के:</b> जितने कम पत्थर, उतने ज़्यादा सितारे। ऊँचा कॉम्बो और बचे पत्थर = ज़्यादा सिक्के।</p>
<p><b>⌨️ शॉर्टकट:</b> <kbd>P</kbd>/<kbd>Esc</kbd> रोकें · <kbd>R</kbd> फिर से · <kbd>H</kbd> सहायता।</p>`,
    panel1_html: `<h2>🌉 राम सेतु की कथा</h2><p><b>राम सेतु</b> (जिसे एडम्स ब्रिज भी कहते हैं) चूना-पत्थर की उथली चट्टानों की श्रृंखला है जो भारत के पम्बन द्वीप को श्रीलंका के मन्नार द्वीप से जोड़ती है। <b>रामायण</b> में यह वह सेतु है जिसे वानर सेना ने दिव्य शिल्पी विश्वकर्मा के पुत्र <b>नल</b> के नेतृत्व में बनाया।</p><p>पत्थरों पर <b>राम</b> नाम लिखा था और वे समुद्र पर तैरते थे — इस गेम में आपका हर पत्थर यही नाम लिए है।</p>`,
    panel2_html: `<h2>🎮 गेम में क्या है</h2><ul><li>3 अध्यायों में <b>12 कथा स्तर</b>, राम, हनुमान, नल, रावण… के संवादों के साथ।</li><li>दोस्तों से मुक़ाबले के लिए <b>अनंत सागर</b> और <b>दैनिक चुनौती</b>।</li><li>रामायण की कथाएँ सुनाते <b>13 चरित्र कार्ड</b> — सभी इकट्ठा करें!</li><li><b>दुकान</b>: हनुमान, सुग्रीव, अंगद की वेशभूषा… और संगमरमर, हरितमणि पत्थर।</li><li><b>15 उपलब्धियाँ</b> और <b>7 दिन का लॉगिन इनाम</b>।</li></ul>`,
    panel3_html: `<h2>🎬 बड़े पर्दे पर रामायण</h2><p>राम, सीता और हनुमान की महागाथा जल्द ही बड़े पर्दे पर आ रही है। रिलीज़ से पहले गेम में सेतु पूरा करें और <b>#RamSetuChallenge</b> के साथ अपनी उपलब्धि शेयर करें!</p>`,
    footer: "\"राम सेतु निर्माण\" — रामायण से प्रेरित। माउस, टच, कीबोर्ड और ऑफ़लाइन खेल समर्थित।",
    film_soon: "🎬 <b>{t}</b> — जल्द आ रही है", film_days: "🎬 <b>{t}</b> बड़े पर्दे पर — बस <b class='big'>{d}</b> दिन बाकी",
    film_now: "🎬 <b>{t}</b> अब सिनेमाघरों में!", film_tag: "🎬 <b>{t}</b> — बड़े पर्दे पर महागाथा",
    share_title: "राम सेतु निर्माण", share_copied: "शेयर संदेश कॉपी हो गया", share_copied_sub: "दोस्तों को चुनौती देने के लिए सोशल मीडिया पर पेस्ट करें!",
    share_progress: "मैंने {s}⭐ और {c} रामायण चरित्र कार्ड के साथ राम सेतु के {a}/12 खंड बना लिए। क्या आप मुझसे आगे निकल सकते हैं?",
    share_endless: "मैंने राम सेतु निर्माण गेम में अनंत सागर के {n} चरण पार किए! कौन तोड़ेगा मेरा रिकॉर्ड?",
    begin_journey: "यात्रा शुरू करें", continue_lv: "जारी रखें — स्तर {n}", stars_cards: "⭐ {s}/{S} सितारे · 🃏 {c}/{C} कार्ड",
    level: "स्तर {n}", slots_layers: "{s} खंड × {n} परत", view_ending: "📜 अंत फिर से देखें",
    endless_name: "अनंत सागर", endless_desc: "एक के बाद एक बेतरतीब चरण; बचे पत्थर अगले चरण में जाते हैं। आप कितनी दूर जा सकते हैं?",
    record: "रिकॉर्ड: <b>{n}</b> चरण", play_endless: "▶ अनंत मोड खेलें",
    daily_name: "दैनिक चुनौती", daily_desc: "हर दिन एक नया स्तर, सभी खिलाड़ियों के लिए एक जैसा — दोस्तों से मुक़ाबला करें!",
    daily_done: "✅ आज पूरा हो गया — कल फिर आएँ", daily_reward: "पहली बार पूरा करने पर: <b>150 सिक्के</b>",
    replay2: "फिर खेलें", take_challenge: "चुनौती स्वीकारें",
    shop_items: "सहायक वस्तुएँ", shop_items_hint: "स्तर में 1–4 कुंजी से इस्तेमाल करें", owned: "आपके पास: {n}",
    shop_skins: "योद्धा वेशभूषा", equipped: "✓ पहना हुआ", equip: "पहनें", need_card: "🔒 {c} कार्ड चाहिए",
    shop_stones: "राम नाम के पत्थर", unlock_ch3: "🔒 अध्याय III में खुलेगा", bought: "{x} ख़रीदा", owned_now: "अब आपका: {x}",
    cards_count_html: "<b>{n}/{N}</b> रामायण चरित्र कार्ड इकट्ठे — कथा पढ़ने के लिए कार्ड पर टैप करें।",
    card_free: "शुरुआती कार्ड", card_cond: "स्तर {n} पूरा करें",
    ach_count_html: "<b>{n}/{N}</b> उपलब्धियाँ पूरी", share_ach: "📣 प्रगति शेयर करें",
    stage: "चरण {n}", endless_sub: "♾️ अनंत सागर", daily_lv: "चुनौती {d}", daily_sub: "🗓️ दैनिक चुनौती",
    win_bridge: "खंड पूरा हुआ!", win_final: "राम सेतु पूरा हुआ!",
    win_text: "<b>{u} पत्थर</b> फेंके · <b>+{c} सिक्के</b> मिले", win_first: " <small>(+100 पहली जीत सहित)</small>",
    win_combo: "🔥 सर्वश्रेष्ठ कॉम्बो <b>×{n}</b>", win_fire: "🛡️ <b>{n}</b> आग के गोले रोके", win_tip: "<small>3 सितारों के लिए: ≤ {n} पत्थर।</small>",
    see_ending: "अंत देखें →", next_level: "अगला स्तर →", new_card: "नया कार्ड: {c}", tap_view: "देखने के लिए टैप करें", card_toast: "कार्ड खुला: {c}",
    endless_win: "चरण {n} पार!", endless_win_text: "<b>{s} पत्थर</b> अगले चरण में · <b>+{c} सिक्के</b><br>रिकॉर्ड: <b>{b}</b> चरण",
    stage_next: "चरण {n} →", daily_win: "दैनिक चुनौती पूरी!", daily_win_first: "आपको <b>+150 सिक्के</b> मिले। कल की चुनौती में फिर मिलेंगे!",
    daily_win_again: "आज का इनाम आप ले चुके हैं। कल नई चुनौती आएगी!", home: "मुख्य मेनू पर जाएँ",
    fail_endless: "चरण {n} में पत्थर ख़त्म", fail_endless_text: "आपने अनंत सागर पर <b>{b} खंड</b> बनाए।<br>रिकॉर्ड: <b>{r}</b> चरण।",
    fail_text: "सेतु बीच समुद्र में अधूरा है। देवताओं से और पत्थर माँगने के लिए छोटा विज्ञापन देखें, या बेहतर निशाने के साथ फिर कोशिश करें।",
    fail_bag_note: "<br><small>आपके पास {n} पत्थरों का थैला है — अभी इस्तेमाल करें।</small>",
    journey_done: "यात्रा पूरी हुई!", journey_sub: "{t} को बड़े पर्दे पर देखें", stones_plus: "+{n} पत्थर — लगे रहो!",
    ach_toast: "उपलब्धि: {n}", coins_plus: "+{n} सिक्के", daily_toast: "+{c} सिक्के मिले", daily_toast_item: " और 1 सहायक वस्तु",
    daily_toast_sub: "बड़ा इनाम पाने के लिए कल फिर आएँ!",
    reset_confirm: "सारी प्रगति, सिक्के, कार्ड और उपलब्धियाँ मिटा दें? यह वापस नहीं होगा।", reset_done: "प्रगति मिटा दी गई",
    pw_key: "कुंजी {n}", pw_ad_title: "5 पत्थरों के लिए विज्ञापन देखें (हर स्तर में एक बार)",
    installed: "गेम आपके डिवाइस पर इंस्टॉल हो गया", offline_ready: "ऑफ़लाइन खेलने के लिए तैयार",
    hud_lv: "स्तर {n} · {ch}", wind_calm: "शांत 🌬️", wind_none: "स्थिर", wind_tail: "अनुकूल →", wind_head: "← विपरीत",
    stone_gold: "पवित्र ✦", stone_normal: "पत्थर",
    f_barrier: 'राक्षस का कवच सेतु रोक रहा है!', f_shield: 'राक्षस ने ढाल से रोका!', f_demon_down: 'राक्षस पराजित! कवच टूटा!', f_demon_heal: 'राक्षस ठीक हुआ +1', f_demon_appear: 'राक्षस प्रकट हुआ!', f_demon_tip: 'कवच तोड़ने के लिए राक्षस पर पत्थर मारो!', help_demon: `<p><b>👺 राक्षस:</b> सेतु के आगे कवच खड़ा करता है — रुके हुए खंड पर गिरा पत्थर खो जाता है। राक्षस का बल ख़त्म होने तक उस पर पत्थर मारें (पवित्र पत्थर = 2 चोट)। देर करने पर राक्षस ढाल उठा सकता है या ठीक हो सकता है।</p>`,
    f_stones5: "+5 पत्थर!", f_calm: "🌬️ सागर शांत हुआ!", f_sight: "🎯 राम दृष्टि!", f_bless: "✨ राम का आशीर्वाद!",
    tut_drag: "दबाएँ, पीछे खींचें, फिर छोड़ें!", f_makara: "मकर पत्थर निगल गया!", f_full: "खंड भरा है — पत्थर व्यर्थ!", f_combo: "🔥 कॉम्बो ×{n}!",
    f_gold2: "पवित्र पत्थर +2!", f_slot_done: "खंड पूरा!", f_sink_combo: "डूब गया! कॉम्बो ×{n} गया", f_sink: "डूब गया!",
    f_shield: "सेतु सुरक्षित है!", f_burn: "🔥 आग ने पत्थर जलाया!", f_gust_r: "🌪 झोंका →", f_gust_l: "← झोंका 🌪",
    f_gull: "पक्षी से टकराया!", f_fire_block: "रोका! +5 सिक्के", f_ring: "+1 पत्थर!", f_pull: "और पीछे खींचें!"
  }
};

/* ---------- Bản dịch nội dung (tiếng Việt gốc nằm trong data.js) ---------- */
const CONTENT = {
  en: {
    chars: {
      narrator: { name: "Narrator" },
      rama: { name: "Rama", role: "Prince of Ayodhya", lore: "The embodiment of righteousness and resolve. When Sita is abducted, Rama leads the vanara army across the sea to Lanka." },
      hanuman: { name: "Hanuman", role: "Devoted monkey god", lore: "Son of the wind god Vayu, with unmatched strength. Hanuman leapt across the sea, found Sita and set Lanka ablaze." },
      nala: { name: "Nala", role: "Architect of the bridge", lore: "Son of the divine craftsman Vishwakarma. Legend says every stone Nala placed floated on the water." },
      squirrel: { name: "Little Squirrel", role: "The humble helper", lore: "Legend says a squirrel rolled in the sand to fill the gaps between stones. Moved, Rama stroked its back — leaving the three stripes squirrels carry to this day." },
      sugriva: { name: "Sugriva", role: "King of the vanaras", lore: "King of Kishkindha and Rama's ally, who rallied the whole vanara army for the rescue." },
      samudra: { name: "Samudra, the Ocean God", role: "Lord of the ocean", lore: "After Rama prayed for three days, the ocean god appeared, promised to bear the stones, and named Nala as the builder." },
      jambavan: { name: "Jambavan", role: "Wise king of bears", lore: "The learned elder of the army, who reminded Hanuman of his divine powers." },
      angada: { name: "Angada", role: "Vanara prince", lore: "Son of Vali, brave and bold. Angada once went alone to Ravana's court to deliver a message of peace." },
      lakshmana: { name: "Lakshmana", role: "The loyal brother", lore: "Rama's younger brother, at his side through fourteen years of exile and the war in Lanka." },
      vibhishana: { name: "Vibhishana", role: "He who chose righteousness", lore: "Ravana's brother. When his advice to return Sita was rejected, he left Lanka to join Rama." },
      kumbhakarna: { name: "Kumbhakarna", role: "The sleeping giant", lore: "Ravana's giant brother, who sleeps for months at a time. When he wakes, all of Lanka trembles." },
      ravana: { name: "Ravana", role: "The ten-headed demon king", lore: "King of Lanka — learned but proud. He abducted Sita and sparked the great war." },
      sita: { name: "Sita", role: "Princess of Mithila", lore: "Rama's faithful wife. Held captive in Lanka's Ashoka grove, she never stopped believing Rama would come." }
    },
    chapters: [
      { name: "Chapter I · The Shores of Rameswaram", desc: "The vanara army begins the legendary bridge." },
      { name: "Chapter II · The Open Ocean", desc: "Rough seas, storms and the sea monster Makara." },
      { name: "Chapter III · The Gates of Lanka", desc: "Ravana rains fire upon the bridge." }
    ],
    levels: [
      { name: "Groundbreaking", story: ["Sita has been carried off to the island of Lanka by the demon king Ravana. Before Prince Rama lies the endless ocean.", "For three days I prayed to the ocean god. Now he has shown the way: build a bridge across the waves.", "My lord, the vanara army is ready! Every stone will bear your name — राम.", "Pull back like a slingshot to aim, release to throw. Stack enough stones in each section to extend the bridge!"] },
      { name: "Nala's Vow", story: ["I am Nala, son of the divine craftsman Vishwakarma. The stones I lay will float upon the waves.", "This great work rests on your shoulders, Nala.", "Every 5th throw is a golden Sacred Stone — worth two normal stones. Don't waste it on a full section!"] },
      { name: "The Squirrel's Sand", story: ["I'm too small to carry stones… but I'll roll in the sand to fill every gap!", "No effort is too small. Thank you, little friend.", "Throw through a floating golden ring to earn an extra stone.", "Careful! Rakshasa demons will raise barriers across the bridge. Hit them until their health runs out before you can build on!"] },
      { name: "Setu at Sunset", story: ["Seagulls are circling the worksite! A stone that hits a gull drops straight into the sea.", "Wait until the gull flies off, then throw, brothers!"] },
      { name: "Stormy Seas", story: ["The bridge now stretches far from shore. Out at sea, the wind and waves are much fiercer.", "I promised to bear the stones. But the sea wind obeys no one!", "Gusts can change direction mid-flight. When the wind box flashes red, a gust just hit."] },
      { name: "Makara Awakens", story: ["Careful! The sea monster Makara is surfacing between the pillars.", "Any stone that falls into its jaws is lost. Aim for another section while it's up!"] },
      { name: "A Sleepless Moonlit Night", story: ["Night has fallen, but the vanaras do not rest. The bright moon lights our way!"] },
      { name: "Varuna's Tempest", story: ["Brother Rama, the shores of Lanka are on the horizon!", "Just this one storm left to cross. Onward!"] },
      { name: "The Righteous Choice", story: ["Vibhishana, Ravana's brother, leaves Lanka to join Rama.", "Ravana will rain fireballs on the bridge. Throw stones to stop the fire in mid-air!", "A fireball that hits an unfinished section burns one layer — finished sections are safe. Block fire mid-air to earn gold!"] },
      { name: "Lanka Trembles", story: ["A rumble from deep within the island — the giant Kumbhakarna stirs in his sleep.", "Ignore him! Keep building — however thick the fire rain, we'll block it!"] },
      { name: "Eve of the Great War", story: ["You monkeys! No bridge will ever reach my Lanka!", "I've burned Lanka once already, Ravana!"] },
      { name: "Ravana's Wrath", story: ["This is the final stretch of the bridge. For Sita — throw!", "Go on, try! My fire will burn every last stone!"] }
    ],
    ending: ["According to Valmiki's epic, in just five days the Ram Setu joined the two shores.", "Rama… I knew you would come.", "Wait for me, Sita. Our army has set foot on Lanka.", "The greatest battle lies ahead — see it on the big screen!"],
    diffs: [
      { name: "Easy", desc: "Easy: +30% stones, light wind, slower fireballs — great for relaxing and for kids." },
      { name: "Normal", desc: "Normal: balanced as designed, for every player." },
      { name: "Hard", desc: "Hard: −15% stones, 35% stronger wind and gusts on every level!" }
    ],
    powerups: {
      calm: { name: "Vayu's Calm", desc: "No wind for 3 throws." },
      sight: { name: "Rama's Sight", desc: "Aim line includes wind for 3 throws." },
      bless: { name: "Blessing", desc: "Next 3 stones are Sacred Stones." },
      stones: { name: "Stone Bag +5", desc: "Add 5 stones right away." }
    },
    skins: { vanara: "Vanara Warrior", hanuman: "Hanuman", nala: "Architect Nala", angada: "Prince Angada", sugriva: "King Sugriva" },
    stones: { granite: "Rameswaram Granite", marble: "White Marble", jade: "Sea Jade", lanka: "Lanka Red Stone" },
    ach: {
      first: { name: "First Stone", desc: "Complete level 1." },
      power1: { name: "Divine Power", desc: "Use a power-up." },
      combo5: { name: "Chain Throw", desc: "Reach a ×5 combo." },
      combo10: { name: "Wind God", desc: "Reach a ×10 combo." },
      rings10: { name: "Ring Catcher", desc: "Throw through 10 golden rings." },
      fire10: { name: "Vanara Shield", desc: "Block 10 fireballs mid-air." },
      ch1: { name: "Leaving Rameswaram", desc: "Complete Chapter I." },
      ch2: { name: "Master of the Ocean", desc: "Complete Chapter II." },
      ch3: { name: "Reaching Lanka", desc: "Complete Chapter III." },
      stars5: { name: "Architect", desc: "Get 3 stars on 5 levels." },
      allstar: { name: "Nala Reborn", desc: "Get 3 stars on all 12 levels." },
      endless5: { name: "Endless Sea", desc: "Clear stage 5 in Endless mode." },
      daily1: { name: "Daily Challenger", desc: "Complete a Daily Challenge." },
      streak3: { name: "Dedicated", desc: "Log in 3 days in a row." },
      slayer: { name: "Demon Slayer", desc: "Defeat 10 Rakshasa demons." },
      rich: { name: "Treasure of Kishkindha", desc: "Earn 2,000 gold in total." }
    }
  },

  hi: {
    chars: {
      narrator: { name: "सूत्रधार" },
      rama: { name: "राम", role: "अयोध्या के राजकुमार", lore: "धर्म और दृढ़ संकल्प के प्रतीक। सीता के हरण के बाद राम वानर सेना के साथ समुद्र पार लंका की ओर बढ़ते हैं।" },
      hanuman: { name: "हनुमान", role: "निष्ठावान वानर देव", lore: "पवनदेव वायु के पुत्र, अतुलनीय बलशाली। हनुमान ने समुद्र लाँघकर सीता को खोजा और लंका में आग लगा दी।" },
      nala: { name: "नल", role: "सेतु के शिल्पी", lore: "दिव्य शिल्पी विश्वकर्मा के पुत्र। कथा के अनुसार नल द्वारा रखा हर पत्थर पानी पर तैरता था।" },
      squirrel: { name: "नन्ही गिलहरी", role: "छोटी-सी सहायक", lore: "कथा है कि एक गिलहरी रेत में लोटकर पत्थरों के बीच की दरारें भरती रही। प्रसन्न होकर राम ने उसकी पीठ सहलाई — तभी से गिलहरी की पीठ पर तीन धारियाँ हैं।" },
      sugriva: { name: "सुग्रीव", role: "वानरों के राजा", lore: "किष्किंधा के राजा और राम के मित्र, जिन्होंने सीता को छुड़ाने के लिए पूरी वानर सेना जुटाई।" },
      samudra: { name: "समुद्र देव", role: "सागर के स्वामी", lore: "राम की तीन दिन की प्रार्थना के बाद समुद्र देव प्रकट हुए, पत्थरों को थामने का वचन दिया और नल को सेतु-निर्माता बताया।" },
      jambavan: { name: "जाम्बवान", role: "बुद्धिमान ऋक्षराज", lore: "सेना के ज्ञानी बुज़ुर्ग, जिन्होंने हनुमान को उनकी दिव्य शक्तियाँ याद दिलाईं।" },
      angada: { name: "अंगद", role: "वानर राजकुमार", lore: "वाली के पुत्र, वीर और निडर। अंगद अकेले रावण के दरबार में शांति का संदेश लेकर गए थे।" },
      lakshmana: { name: "लक्ष्मण", role: "निष्ठावान भाई", lore: "राम के छोटे भाई, जो चौदह वर्ष के वनवास और लंका के युद्ध में सदा उनके साथ रहे।" },
      vibhishana: { name: "विभीषण", role: "धर्म का मार्ग चुनने वाले", lore: "रावण के भाई। सीता को लौटाने की उनकी सलाह ठुकराई गई, तो वे लंका छोड़कर राम के पास आ गए।" },
      kumbhakarna: { name: "कुंभकर्ण", role: "सोता हुआ दानव", lore: "रावण का विशालकाय भाई, जो महीनों तक सोता है। उसके जागने पर पूरी लंका काँप उठती है।" },
      ravana: { name: "रावण", role: "दशानन राक्षसराज", lore: "लंका का राजा — विद्वान पर अहंकारी। उसने सीता का हरण किया और महायुद्ध छेड़ दिया।" },
      sita: { name: "सीता", role: "मिथिला की राजकुमारी", lore: "राम की पतिव्रता पत्नी। लंका की अशोक वाटिका में बंदी रहकर भी उन्होंने राम के आने का विश्वास नहीं छोड़ा।" }
    },
    chapters: [
      { name: "अध्याय I · रामेश्वरम का तट", desc: "वानर सेना ने दिव्य सेतु का निर्माण आरंभ किया।" },
      { name: "अध्याय II · बीच समुद्र", desc: "उफनती लहरें, तूफ़ान और जलदानव मकर।" },
      { name: "अध्याय III · लंका का द्वार", desc: "रावण सेतु पर आग बरसाता है।" }
    ],
    levels: [
      { name: "निर्माण आरंभ", story: ["राक्षसराज रावण सीता का हरण कर लंका द्वीप ले गया है। राजकुमार राम के सामने अथाह सागर फैला है।", "तीन दिन मैंने समुद्र देव से प्रार्थना की। अब उन्होंने मार्ग दिखाया है: लहरों पर एक सेतु बनाओ।", "प्रभु, वानर सेना तैयार है! हर पत्थर पर आपका नाम लिखा होगा — राम।", "निशाना लगाने के लिए गुलेल की तरह पीछे खींचें, फेंकने के लिए छोड़ें। सेतु बढ़ाने के लिए हर खंड में पर्याप्त पत्थर जमाएँ!"] },
      { name: "नल का संकल्प", story: ["मैं नल हूँ, दिव्य शिल्पी विश्वकर्मा का पुत्र। मेरे रखे पत्थर लहरों पर तैरेंगे।", "यह महान कार्य तुम्हारे कंधों पर है, नल।", "हर 5वाँ पत्थर सुनहरा पवित्र पत्थर होता है — दो साधारण पत्थरों के बराबर। इसे भरे हुए खंड पर व्यर्थ न करें!"] },
      { name: "गिलहरी की रेत", story: ["मैं पत्थर उठाने के लिए बहुत छोटी हूँ… पर रेत में लोटकर हर दरार भर दूँगी!", "कोई भी प्रयास छोटा नहीं होता। धन्यवाद, नन्ही मित्र।", "हवा में तैरते सुनहरे छल्ले के बीच से पत्थर फेंकें और एक अतिरिक्त पत्थर पाएँ।", "सावधान! राक्षस सेतु पर कवच खड़ा करेंगे। आगे बनाने के लिए उन पर तब तक पत्थर मारो जब तक उनका बल ख़त्म न हो!"] },
      { name: "सूर्यास्त में सेतु", story: ["निर्माण स्थल पर समुद्री पक्षी मँडरा रहे हैं! पक्षी से टकराया पत्थर सीधा समुद्र में गिरता है।", "भाइयो, पक्षी के दूर जाने पर ही पत्थर फेंको!"] },
      { name: "उफनता सागर", story: ["सेतु अब तट से बहुत दूर तक फैल चुका है। बीच समुद्र में हवा और लहरें कहीं अधिक प्रचंड हैं।", "मैंने पत्थरों को थामने का वचन दिया था। पर समुद्री हवा किसी की नहीं सुनती!", "झोंके उड़ान के बीच दिशा बदल सकते हैं। हवा का बॉक्स लाल चमके तो समझें झोंका आया है।"] },
      { name: "मकर जाग उठा", story: ["सावधान! जलदानव मकर खंभों के बीच से ऊपर आ रहा है।", "उसके जबड़ों में गिरा पत्थर खो जाता है। जब वह ऊपर हो, दूसरे खंड पर निशाना लगाओ!"] },
      { name: "चाँदनी की जागती रात", story: ["रात हो गई, पर वानर विश्राम नहीं करते। उजला चाँद हमें राह दिखा रहा है!"] },
      { name: "वरुण का तूफ़ान", story: ["भैया राम, क्षितिज पर लंका का तट दिख रहा है!", "बस यह एक तूफ़ान पार करना है। आगे बढ़ो!"] },
      { name: "धर्म का चुनाव", story: ["रावण का भाई विभीषण लंका छोड़कर राम से आ मिला।", "रावण सेतु पर आग के गोले बरसाएगा। पत्थर फेंककर आग को हवा में ही रोको!", "अधूरे खंड पर गिरा आग का गोला एक परत जला देता है — पूरे खंड सुरक्षित हैं। हवा में आग रोककर सिक्के कमाएँ!"] },
      { name: "काँपती लंका", story: ["द्वीप की गहराई से गड़गड़ाहट — विशालकाय कुंभकर्ण नींद में करवट ले रहा है।", "उसकी परवाह मत करो! निर्माण जारी रखो — आग की वर्षा कितनी भी घनी हो, हम उसे रोकेंगे!"] },
      { name: "महायुद्ध की पूर्वसंध्या", story: ["अरे वानरो! कोई सेतु मेरी लंका तक नहीं पहुँचेगा!", "मैं एक बार पहले ही लंका जला चुका हूँ, रावण!"] },
      { name: "रावण का प्रकोप", story: ["यह सेतु का अंतिम भाग है। सीता के लिए — फेंको!", "कोशिश करके देखो! मेरी आग हर पत्थर को भस्म कर देगी!"] }
    ],
    ending: ["वाल्मीकि रामायण के अनुसार, केवल पाँच दिनों में राम सेतु ने दोनों तटों को जोड़ दिया।", "राम… मुझे पता था आप आएँगे।", "मेरी प्रतीक्षा करो, सीता। हमारी सेना लंका की धरती पर उतर चुकी है।", "सबसे महान युद्ध आगे है — इसे बड़े पर्दे पर देखें!"],
    diffs: [
      { name: "आसान", desc: "आसान: +30% पत्थर, हल्की हवा, धीमे आग के गोले — आराम और बच्चों के लिए बढ़िया।" },
      { name: "सामान्य", desc: "सामान्य: सभी खिलाड़ियों के लिए संतुलित।" },
      { name: "कठिन", desc: "कठिन: −15% पत्थर, 35% तेज़ हवा और हर स्तर पर झोंके!" }
    ],
    powerups: {
      calm: { name: "वायु शांति", desc: "3 बार फेंकने तक हवा शांत।" },
      sight: { name: "राम दृष्टि", desc: "3 बार तक निशाना-रेखा में हवा भी शामिल।" },
      bless: { name: "आशीर्वाद", desc: "अगले 3 पत्थर पवित्र पत्थर होंगे।" },
      stones: { name: "पत्थरों का थैला +5", desc: "तुरंत 5 पत्थर जोड़ें।" }
    },
    skins: { vanara: "वानर योद्धा", hanuman: "हनुमान", nala: "शिल्पी नल", angada: "राजकुमार अंगद", sugriva: "राजा सुग्रीव" },
    stones: { granite: "रामेश्वरम ग्रेनाइट", marble: "श्वेत संगमरमर", jade: "सागर हरितमणि", lanka: "लंका का लाल पत्थर" },
    ach: {
      first: { name: "पहला पत्थर", desc: "स्तर 1 पूरा करें।" },
      power1: { name: "दिव्य शक्ति", desc: "कोई सहायक वस्तु इस्तेमाल करें।" },
      combo5: { name: "लगातार वार", desc: "×5 कॉम्बो पाएँ।" },
      combo10: { name: "पवनदेव", desc: "×10 कॉम्बो पाएँ।" },
      rings10: { name: "छल्ला पकड़", desc: "10 सुनहरे छल्लों के बीच से पत्थर फेंकें।" },
      fire10: { name: "वानर कवच", desc: "हवा में 10 आग के गोले रोकें।" },
      ch1: { name: "रामेश्वरम से प्रस्थान", desc: "अध्याय I पूरा करें।" },
      ch2: { name: "सागर विजेता", desc: "अध्याय II पूरा करें।" },
      ch3: { name: "लंका पहुँचे", desc: "अध्याय III पूरा करें।" },
      stars5: { name: "शिल्पकार", desc: "5 स्तरों पर 3 सितारे पाएँ।" },
      allstar: { name: "नल का अवतार", desc: "सभी 12 स्तरों पर 3 सितारे पाएँ।" },
      endless5: { name: "अनंत सागर", desc: "अनंत मोड में चरण 5 पार करें।" },
      daily1: { name: "दैनिक चुनौती", desc: "एक दैनिक चुनौती पूरी करें।" },
      streak3: { name: "नियमित", desc: "लगातार 3 दिन लॉग इन करें।" },
      slayer: { name: "राक्षस संहारक", desc: "10 राक्षसों को हराएँ।" },
      rich: { name: "किष्किंधा का ख़ज़ाना", desc: "कुल 2,000 सिक्के कमाएँ।" }
    }
  }
};

/* ---------- Chọn & tra cứu ngôn ngữ ---------- */
function detectLang() {
  const list = navigator.languages || [navigator.language || "en"];
  for (const l of list) {
    const c = String(l).toLowerCase().slice(0, 2);
    if (STR[c]) return c;
  }
  return "en";
}
let LANG = (SAVE.lang && STR[SAVE.lang]) ? SAVE.lang : detectLang();

function t(key, vars) {
  let s = (STR[LANG] && STR[LANG][key]) != null ? STR[LANG][key] : (STR.vi[key] != null ? STR.vi[key] : key);
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
  return s;
}
function C(kind, key, field) {
  const pack = CONTENT[LANG] && CONTENT[LANG][kind];
  const o = pack && pack[key];
  if (o == null) return undefined;
  return field ? o[field] : o;
}
/* Truy xuất nội dung đã dịch, rơi về tiếng Việt khi thiếu */
const Tx = {
  ch: (id) => {
    const b = CHARACTERS[id];
    return { icon: b.icon, color: b.color, name: C("chars", id, "name") || b.name, role: C("chars", id, "role") || b.role, lore: C("chars", id, "lore") || b.lore };
  },
  chapterName: (i) => C("chapters", i, "name") || CHAPTERS[i].name,
  chapterDesc: (i) => C("chapters", i, "desc") || CHAPTERS[i].desc,
  levelName: (i) => C("levels", i, "name") || LEVELS[i].name,
  story: (i) => {
    const tr = C("levels", i, "story");
    return LEVELS[i].story.map((ln, j) => [ln[0], (tr && tr[j]) || ln[1]]);
  },
  ending: () => {
    const tr = CONTENT[LANG] && CONTENT[LANG].ending;
    return ENDING.map((ln, j) => [ln[0], (tr && tr[j]) || ln[1]]);
  },
  diffName: (i) => C("diffs", i, "name") || DIFFS[i].name,
  diffDesc: (i) => C("diffs", i, "desc") || DIFFS[i].desc,
  pw: (id) => { const p = POWERUPS.find(x => x.id === id); return { icon: p.icon, price: p.price, name: C("powerups", id, "name") || p.name, desc: C("powerups", id, "desc") || p.desc }; },
  skin: (id) => C("skins", id) || SKINS.find(x => x.id === id).name,
  stone: (id) => C("stones", id) || STONE_SKINS.find(x => x.id === id).name,
  ach: (id) => { const a = ACHIEVEMENTS.find(x => x.id === id); return { name: C("ach", id, "name") || a.name, desc: C("ach", id, "desc") || a.desc }; }
};

/* Áp dụng bản dịch cho phần HTML tĩnh: data-i18n / data-i18n-html / data-i18n-title */
function applyStatic() {
  document.documentElement.lang = LANG;
  document.title = t("doc_title");
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); el.setAttribute("aria-label", t(el.dataset.i18nTitle)); });
}
