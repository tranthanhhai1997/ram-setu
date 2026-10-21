"use strict";
/* =====================================================================
   DỮ LIỆU GAME — chỉnh sửa nội dung, cân bằng, chiến dịch phim tại đây
   ===================================================================== */

/* ---------- Chiến dịch phim ----------
   releaseDate: ngày công chiếu dùng cho bộ đếm ngược.
   ⚠ Giá trị hiện tại là GIẢ ĐỊNH (dịp Diwali 2026) — cần xác nhận ngày
   công chiếu chính thức tại thị trường phát hành trước khi ra mắt game. */
const FILM = {
  title: "Ramayana",
  titles: { hi: "रामायण" },        // tên phim theo ngôn ngữ (tùy chọn)
  releaseDate: "2026-11-08T00:00:00+07:00",
  tagline: "Sử thi vĩ đại nhất sắp lên màn ảnh rộng",
  hashtag: "#RamSetuChallenge",
  shareUrl: "https://tranthanhhai1997.github.io/ram-setu/" // URL game đã phát hành (GitHub Pages)
};

/* ---------- Nhân vật & thẻ sưu tập ---------- */
const CHARACTERS = {
  narrator:   { name: "Người kể chuyện", icon: "📜", color: "#8a6a3c" },
  rama:       { name: "Rama",        icon: "🏹", color: "#2f6fd6", role: "Hoàng tử xứ Ayodhya",
                lore: "Hiện thân của chính nghĩa và lòng kiên định. Khi nàng Sita bị bắt cóc, Rama dẫn đại quân vanara vượt biển tới Lanka." },
  hanuman:    { name: "Hanuman",     icon: "🐒", color: "#e0662a", role: "Thần khỉ trung thành",
                lore: "Con trai thần gió Vayu, sức mạnh vô song. Hanuman đã bay qua biển tìm thấy Sita và châm lửa đốt thành Lanka." },
  nala:       { name: "Nala",        icon: "🔨", color: "#2fa3b2", role: "Kiến trúc sư của cây cầu",
                lore: "Con trai thần thợ Vishwakarma. Theo truyền thuyết, những tảng đá do Nala đặt xuống đều nổi trên mặt nước." },
  squirrel:   { name: "Chú sóc nhỏ", icon: "🐿️", color: "#b07a3a", role: "Người góp sức nhỏ bé",
                lore: "Tương truyền chú sóc lăn mình trong cát để lấp kẽ đá. Rama cảm động vuốt lưng chú — để lại ba vệt sọc trên lưng loài sóc." },
  sugriva:    { name: "Sugriva",     icon: "👑", color: "#d1a03a", role: "Vua của tộc vanara",
                lore: "Vị vua xứ Kishkindha, đồng minh của Rama. Ông huy động toàn bộ đội quân vanara cho cuộc giải cứu." },
  samudra:    { name: "Thần biển Samudra", icon: "🌊", color: "#2a7fb8", role: "Chúa tể đại dương",
                lore: "Sau ba ngày Rama cầu nguyện, thần biển hiện ra, hứa nâng đỡ những tảng đá và chỉ Nala là người xây cầu." },
  jambavan:   { name: "Jambavan",    icon: "🐻", color: "#6d5a4a", role: "Vua gấu thông thái",
                lore: "Vị trưởng lão uyên bác của đại quân, người đã nhắc Hanuman nhớ lại sức mạnh thần thánh của mình." },
  angada:     { name: "Angada",      icon: "🛡️", color: "#3fae6a", role: "Hoàng tử vanara",
                lore: "Con trai của Vali, dũng mãnh và gan dạ. Angada từng một mình đến triều đình Ravana để truyền thông điệp hòa bình." },
  lakshmana:  { name: "Lakshmana",   icon: "🗡️", color: "#c0453a", role: "Người em trung thành",
                lore: "Em trai Rama, luôn sát cánh bên anh suốt mười bốn năm lưu đày và trong cuộc chiến ở Lanka." },
  vibhishana: { name: "Vibhishana",  icon: "🕯️", color: "#7a5ab8", role: "Người chọn chính nghĩa",
                lore: "Em trai Ravana. Khuyên anh trả Sita không thành, ông rời Lanka để theo Rama." },
  kumbhakarna:{ name: "Kumbhakarna", icon: "💤", color: "#5b4a6a", role: "Gã khổng lồ ngủ say",
                lore: "Em trai khổng lồ của Ravana, mỗi lần ngủ kéo dài nhiều tháng. Khi tỉnh giấc, cả Lanka rung chuyển." },
  ravana:     { name: "Ravana",      icon: "👹", color: "#b3262e", role: "Quỷ vương mười đầu",
                lore: "Vua của Lanka, thông thái nhưng kiêu ngạo. Hắn bắt cóc Sita và châm ngòi cho cuộc chiến vĩ đại." },
  sita:       { name: "Sita",        icon: "🪷", color: "#d6559a", role: "Công chúa xứ Mithila",
                lore: "Người vợ kiên trinh của Rama. Bị giam trong vườn Ashoka ở Lanka, nàng chưa từng thôi tin Rama sẽ đến." }
};
/* Thứ tự hiển thị trong bộ sưu tập */
const CARD_ORDER = ["rama", "hanuman", "nala", "squirrel", "sugriva", "samudra", "jambavan", "angada", "lakshmana", "vibhishana", "kumbhakarna", "ravana", "sita"];

/* ---------- Bối cảnh ---------- */
const THEMES = [
  { sky: ["#7ec3ec", "#dff3fb"], sea: ["#2f83ad", "#1b5a80"], sun: "#ffd76a", sunX: 795, sunY: 86,  night: false }, // 0 bình minh
  { sky: ["#a5d8f0", "#eef9ff"], sea: ["#3590ba", "#1f648c"], sun: "#ffe9a3", sunX: 480, sunY: 64,  night: false }, // 1 trưa
  { sky: ["#f6a55c", "#ffd9a0"], sea: ["#2c6f96", "#17486a"], sun: "#ff9d4d", sunX: 215, sunY: 120, night: false, tint: "rgba(255,120,50,.14)" }, // 2 hoàng hôn
  { sky: ["#5d8fb4", "#b9d4e2"], sea: ["#276a8f", "#14425f"], sun: "#f4f7f9", sunX: 795, sunY: 70,  night: false }, // 3 gió lộng
  { sky: ["#0d2547", "#274b73"], sea: ["#17456b", "#0b2a47"], sun: "#f2ecd9", sunX: 775, sunY: 78,  night: true, tint: "rgba(10,24,60,.55)" }, // 4 đêm trăng
  { sky: ["#3d4857", "#7f8e9c"], sea: ["#2a4f66", "#16303f"], sun: "#cfd8df", sunX: 640, sunY: 90,  night: false, storm: true, tint: "rgba(50,60,75,.35)" }, // 5 bão
  { sky: ["#2a0d1f", "#8f3426"], sea: ["#4a2440", "#241228"], sun: "#ff6a3d", sunX: 765, sunY: 110, night: true,  lanka: true, tint: "rgba(60,8,24,.5)" }  // 6 lửa Lanka
];

/* ---------- Chương & màn chơi ----------
   slots: số ô cầu · need: số lớp đá mỗi ô · stones: đá cấp (độ khó Thường)
   wind: sức gió tối đa · gull/gust/makara: chướng ngại · fire: chu kỳ cầu lửa (giây, 0 = tắt)
   card: thẻ mở khóa khi thắng lần đầu · story: hội thoại trước màn (hiện lần đầu) */
const CHAPTERS = [
  { name: "Chương I · Bờ biển Rameswaram", desc: "Đại quân vanara khởi công cây cầu thần thoại." },
  { name: "Chương II · Giữa đại dương",    desc: "Sóng dữ, bão giông và thủy quái Makara." },
  { name: "Chương III · Cổng thành Lanka", desc: "Ravana trút mưa lửa xuống cây cầu." }
];
const LEVELS = [
  { ch: 0, name: "Khởi công",           slots: 5,  need: 2, stones: 14, wind: 14,  theme: 0, card: "hanuman",
    story: [["narrator", "Nàng Sita bị quỷ vương Ravana bắt về đảo Lanka. Trước mặt hoàng tử Rama là đại dương mênh mông."],
            ["rama", "Ba ngày ta cầu nguyện thần biển. Nay thần đã chỉ lối: hãy xây một cây cầu vượt sóng."],
            ["hanuman", "Thưa chủ nhân, đội vanara đã sẵn sàng! Mỗi viên đá sẽ được khắc tên Ngài — राम."],
            ["narrator", "Kéo ngược như ná cao su để ngắm, thả tay để ném. Chồng đủ đá vào từng ô để nối cầu!"]] },
  { ch: 0, name: "Lời thề của Nala",    slots: 7,  need: 2, stones: 19, wind: 34,  theme: 1, card: "nala",
    story: [["nala", "Ta là Nala, con của thần thợ Vishwakarma. Đá ta đặt xuống sẽ nổi trên sóng."],
            ["rama", "Công trình này trông cậy cả vào ngươi, Nala."],
            ["narrator", "Cứ 5 lần ném sẽ có 1 viên Đá thiêng vàng — một viên bằng hai viên thường. Đừng phí vào ô đã đầy!"]] },
  { ch: 0, name: "Chú sóc góp cát",     slots: 8,  need: 2, stones: 20, wind: 48,  theme: 2, demons: [[4, 1]], card: "squirrel", ring: 0.55,
    story: [["squirrel", "Cháu nhỏ quá, không vác nổi đá… nhưng cháu sẽ lăn cát lấp từng kẽ hở!"],
            ["rama", "Không có công sức nào là nhỏ bé. Cảm ơn em, bạn nhỏ."],
            ["narrator", "Ném xuyên qua vòng vàng lơ lửng để nhận thêm 1 viên đá."],
            ["narrator", "Cẩn thận! Quỷ Rakshasa sẽ dựng kết giới chặn cầu. Ném đá trúng hắn cho đến khi hết máu thì mới xây tiếp được!"]] },
  { ch: 0, name: "Hoàng hôn Setu",      slots: 9,  need: 3, stones: 31, wind: 62,  theme: 2, demons: [[3, 1], [6, 2]], card: "sugriva", gull: true,
    story: [["sugriva", "Đàn chim biển đang lượn quanh công trường! Đá trúng chim sẽ rơi thẳng xuống biển."],
            ["hanuman", "Canh lúc chim bay xa rồi hãy ném, anh em!"]] },
  { ch: 1, name: "Biển động",           slots: 10, need: 3, stones: 34, wind: 78,  theme: 3, demons: [[4, 2], [7, 2]], card: "samudra", gull: true, gust: true,
    story: [["narrator", "Cây cầu đã vươn xa khỏi bờ. Giữa khơi, sóng gió dữ dội hơn nhiều."],
            ["samudra", "Ta đã hứa nâng đỡ những tảng đá. Nhưng gió biển thì chẳng nghe lời ai cả!"],
            ["narrator", "Gió giật có thể đổi hướng ngay giữa đường bay. Hộp gió nhấp nháy đỏ là gió vừa giật."]] },
  { ch: 1, name: "Makara thức giấc",    slots: 10, need: 3, stones: 36, wind: 82,  theme: 1, demons: [[3, 2], [7, 2]], demonShield: true, card: "jambavan", makara: true,
    story: [["jambavan", "Cẩn thận! Thủy quái Makara đang ngoi lên giữa các trụ cầu."],
            ["jambavan", "Đá rơi trúng miệng nó sẽ bị nuốt mất. Hãy ném vào ô khác khi nó trồi lên!"]] },
  { ch: 1, name: "Đêm trăng không ngủ", slots: 11, need: 3, stones: 40, wind: 94,  theme: 4, demons: [[3, 2], [6, 2], [9, 2]], demonShield: true, card: "angada", gull: true, gust: true,
    story: [["angada", "Đêm đã xuống, nhưng đội vanara không nghỉ. Trăng sáng soi đường cho chúng ta!"]] },
  { ch: 1, name: "Bão Varuna",          slots: 12, need: 3, stones: 46, wind: 108, theme: 5, demons: [[4, 3], [8, 3]], demonShield: true, card: "lakshmana", gust: true, makara: true,
    story: [["lakshmana", "Anh Rama, bờ Lanka đã hiện ra nơi chân trời!"],
            ["rama", "Chỉ cần vượt qua cơn bão này nữa thôi. Tiến lên!"]] },
  { ch: 2, name: "Người chọn chính nghĩa", slots: 12, need: 3, stones: 48, wind: 98, theme: 6, demons: [[3, 2], [7, 2], [10, 2]], demonShield: true, demonHeal: true, card: "vibhishana", fire: 11,
    story: [["narrator", "Vibhishana, em trai Ravana, rời bỏ Lanka để theo Rama."],
            ["vibhishana", "Ravana sẽ trút cầu lửa xuống cây cầu. Hãy ném đá chặn lửa ngay giữa không trung!"],
            ["narrator", "Cầu lửa rơi trúng ô đang xây dở sẽ thiêu một lớp đá — ô đã hoàn thành thì an toàn. Chặn lửa giữa không trung để nhận vàng!"]] },
  { ch: 2, name: "Lanka rung chuyển",   slots: 13, need: 3, stones: 50, wind: 110, theme: 6, demons: [[4, 3], [8, 3], [11, 3]], demonShield: true, demonHeal: true, card: "kumbhakarna", fire: 10, gull: true,
    story: [["narrator", "Tiếng ầm vang từ lòng đảo — gã khổng lồ Kumbhakarna trở mình trong giấc ngủ."],
            ["hanuman", "Mặc kệ hắn! Cứ nối cầu, mưa lửa có dày đến đâu cũng phải chặn!"]] },
  { ch: 2, name: "Đêm trước đại chiến", slots: 13, need: 4, stones: 68, wind: 120, theme: 6, demons: [[3, 3], [6, 3], [9, 3], [11, 3]], demonShield: true, demonHeal: true, card: "ravana", fire: 9.5, makara: true, gust: true,
    story: [["ravana", "Lũ khỉ kia! Không cây cầu nào chạm được tới Lanka của ta!"],
            ["hanuman", "Ta đã từng đốt Lanka một lần rồi đấy, Ravana!"]] },
  { ch: 2, name: "Cơn thịnh nộ Ravana", slots: 14, need: 4, stones: 80, wind: 130, theme: 6, demons: [[4, 3], [8, 3], [13, 6, "boss"]], demonShield: true, demonHeal: true, card: "sita", fire: 8, gull: true, gust: true, makara: true, boss: true,
    story: [["rama", "Đây là đoạn cầu cuối cùng. Vì Sita — hãy ném!"],
            ["ravana", "Cứ thử đi! Lửa của ta sẽ thiêu rụi từng tảng đá!"]] }
];
const ENDING = [
  ["narrator", "Theo sử thi Valmiki, chỉ sau năm ngày, cây cầu Ram Setu đã nối liền hai bờ biển."],
  ["sita", "Rama… thiếp biết chàng sẽ đến."],
  ["rama", "Đợi ta, Sita. Đại quân đã đặt chân lên Lanka."],
  ["narrator", "Trận chiến vĩ đại nhất đang chờ phía trước — hãy đón xem trên màn ảnh rộng!"]
];

/* ---------- Độ khó ---------- */
const DIFFS = [
  { name: "Dễ",     stoneMul: 1.3,  windMul: 0.6,  fireMul: 0.75, desc: "Dễ: +30% đá, gió nhẹ, cầu lửa rơi chậm — hợp để thư giãn và cho trẻ em." },
  { name: "Thường", stoneMul: 1.0,  windMul: 1.0,  fireMul: 1.0,  desc: "Thường: cân bằng theo thiết kế gốc cho mọi người chơi." },
  { name: "Khó",    stoneMul: 0.85, windMul: 1.35, fireMul: 1.25, desc: "Khó: −15% đá, gió mạnh hơn 35% và có gió giật ở mọi màn!" }
];

/* ---------- Vật phẩm hỗ trợ (mua bằng vàng) ---------- */
const POWERUPS = [
  { id: "calm", img: "img/ui/icon-calm.webp",   icon: "🌬️", name: "Vayu tĩnh lặng", desc: "Lặng gió trong 3 lần ném.",               price: 60 },
  { id: "sight", img: "img/ui/icon-sight.webp",  icon: "🎯", name: "Mắt Rama",       desc: "Đường ngắm tính cả gió trong 3 lần ném.", price: 80 },
  { id: "bless", img: "img/ui/icon-bless.webp",  icon: "✨", name: "Phúc lành",      desc: "3 viên kế tiếp đều là Đá thiêng.",         price: 120 },
  { id: "stones", img: "img/ui/icon-stones.webp", icon: "🪨", name: "Túi đá +5",      desc: "Thêm ngay 5 viên đá vào màn chơi.",       price: 50 }
];

/* ---------- Trang phục ---------- */
const SKINS = [
  { id: "vanara",  name: "Chiến binh Vanara", price: 0,   card: null,
    fur: "#96683c", dark: "#7a4e2a", belly: "#d9b98c", face: "#ecd3a6", band: "#e07b24", scarf: "#c93b2a", acc: null },
  { id: "hanuman", name: "Hanuman",           price: 300, card: "hanuman",
    fur: "#c8622a", dark: "#9c4519", belly: "#f0c48a", face: "#f6d7a8", band: "#ffd166", scarf: "#e8b23a", acc: "mace" },
  { id: "nala",    name: "Kiến trúc sư Nala", price: 350, card: "nala",
    fur: "#8a6a4a", dark: "#6a4e33", belly: "#dcc2a0", face: "#ecd6b2", band: "#2fb3c2", scarf: "#1f6f8b", acc: null },
  { id: "angada",  name: "Hoàng tử Angada",   price: 400, card: "angada",
    fur: "#7d5a3c", dark: "#5f4129", belly: "#d4b38a", face: "#e8cda2", band: "#3fae6a", scarf: "#2f8f5b", acc: "crown" },
  { id: "sugriva", name: "Vua Sugriva",       price: 500, card: "sugriva",
    fur: "#b98a3a", dark: "#8f6725", belly: "#efd29a", face: "#f5dfb0", band: "#b3262e", scarf: "#7a1f2a", acc: "crown" }
];
const STONE_SKINS = [
  { id: "granite", name: "Đá xám Rameswaram", price: 0,   rgb: [128, 138, 148] },
  { id: "marble",  name: "Cẩm thạch trắng",   price: 200, rgb: [206, 202, 192] },
  { id: "jade",    name: "Ngọc lam biển",     price: 300, rgb: [86, 156, 146] },
  { id: "lanka",   name: "Đá đỏ Lanka",       price: 400, rgb: [168, 92, 72], needCh: 2 }
];

/* ---------- Quà đăng nhập 7 ngày ---------- */
const DAILY_REWARDS = [
  { coins: 50 }, { coins: 75 }, { coins: 100, item: "calm" }, { coins: 125 },
  { coins: 150, item: "sight" }, { coins: 200 }, { coins: 400, item: "bless" }
];

/* ---------- Thành tựu ----------
   test(s): s là dữ liệu lưu (save) */
const ACHIEVEMENTS = [
  { id: "first",   icon: "🏗️", name: "Viên đá đầu tiên",   desc: "Hoàn thành màn 1.",                      reward: 50,  test: s => (s.stars[0] || 0) > 0 },
  { id: "power1",  icon: "🧪", name: "Thần lực",           desc: "Dùng một vật phẩm hỗ trợ.",              reward: 30,  test: s => s.stats.powerUsed >= 1 },
  { id: "combo5",  icon: "🔥", name: "Liên hoàn",          desc: "Đạt combo ×5.",                           reward: 80,  test: s => s.stats.maxCombo >= 5 },
  { id: "combo10", icon: "☄️", name: "Thần gió",           desc: "Đạt combo ×10.",                          reward: 200, test: s => s.stats.maxCombo >= 10 },
  { id: "rings10", icon: "💫", name: "Bắt vòng thần",      desc: "Ném xuyên 10 vòng vàng.",                 reward: 100, test: s => s.stats.rings >= 10 },
  { id: "fire10",  icon: "🛡️", name: "Lá chắn vanara",     desc: "Chặn 10 cầu lửa giữa không trung.",       reward: 150, test: s => s.stats.fire >= 10 },
  { id: "ch1",     icon: "🌅", name: "Rời bờ Rameswaram",  desc: "Hoàn thành Chương I.",                    reward: 150, test: s => (s.stars[3] || 0) > 0 },
  { id: "ch2",     icon: "🌊", name: "Chinh phục đại dương", desc: "Hoàn thành Chương II.",                 reward: 250, test: s => (s.stars[7] || 0) > 0 },
  { id: "ch3",     icon: "🏯", name: "Chạm bờ Lanka",      desc: "Hoàn thành Chương III.",                  reward: 500, test: s => (s.stars[11] || 0) > 0 },
  { id: "stars5",  icon: "⭐", name: "Kiến trúc sư",        desc: "Đạt 3 sao ở 5 màn.",                     reward: 150, test: s => Object.values(s.stars).filter(v => v >= 3).length >= 5 },
  { id: "allstar", icon: "🌟", name: "Nala tái thế",       desc: "Đạt 3 sao ở toàn bộ 12 màn.",             reward: 600, test: s => Object.values(s.stars).filter(v => v >= 3).length >= LEVELS.length },
  { id: "endless5",icon: "♾️", name: "Biển vô tận",        desc: "Vượt chặng 5 ở chế độ Vô tận.",           reward: 200, test: s => s.endlessBest >= 5 },
  { id: "daily1",  icon: "🗓️", name: "Thử thách ngày",     desc: "Hoàn thành một Thử thách ngày.",          reward: 80,  test: s => s.stats.dailyWins >= 1 },
  { id: "streak3", icon: "📅", name: "Chuyên cần",         desc: "Đăng nhập 3 ngày liên tiếp.",             reward: 100, test: s => s.daily.streak >= 3 },
  { id: "slayer",  icon: "👺", name: "Diệt quỷ",           desc: "Đánh bại 10 quỷ Rakshasa.",              reward: 150, test: s => (s.stats.demons || 0) >= 10 },
  { id: "rich",    icon: "💰", name: "Kho báu Kishkindha", desc: "Tích lũy tổng cộng 2.000 vàng.",          reward: 150, test: s => s.stats.coinsEarned >= 2000 }
];

/* ---------- Ảnh minh họa chuyên nghiệp (tùy chọn) ----------
   Để trống = game dùng hình vẽ bằng code. Khi nhận ảnh từ họa sĩ, chỉ cần khai báo đường dẫn:
   portraits: chân dung vuông cho hội thoại & thẻ (khuyến nghị 512×512 WebP, nền trong suốt)
   monkey:    sprite nhân vật ném đá theo trang phục; w/h = kích thước vẽ (px game),
              ax/ay = điểm neo dưới chân, tính trong khung w×h. Tay ném & viên đá vẫn do code vẽ. */
const ART = {
  // bầu trời theo chỉ số THEMES; bờ biển: x/y/w = vị trí & bề rộng vẽ (px game), đã căn theo địa hình ảnh
  bg: {
    sky: [0, 1, 2, 3, 4, 5, 6].map(i => "img/bg/sky-" + i + ".webp"),
    india:      { src: "img/bg/shore-india.webp",       x: -62, y: 288, w: 330 },
    lanka:      { src: "img/bg/shore-lanka.webp",       x: 783, y: 330, w: 215 },
    lankaNight: { src: "img/bg/shore-lanka-night.webp", x: 815, y: 351, w: 190 }
  },
  // rakshasa / rakshasaBoss: ảnh quỷ canh cầu (tùy chọn, nhìn sang TRÁI); thiếu thì vẽ bằng code
  fx: { makara: "img/ui/makara.webp", fireball: "img/ui/fireball.webp", gull: "img/ui/gull.webp", rakshasa: "img/ui/rakshasa.webp", rakshasaBoss: "img/ui/rakshasa-boss.webp" },
  ui: {
    keyart: "img/ui/keyart.webp", emblem: "img/ui/emblem.webp", frame: "img/ui/frame.webp",
    coin: "img/ui/icon-coin.webp", stone: "img/ui/icon-stone.webp", gift: "img/ui/icon-gift.webp",
    endless: "img/ui/icon-endless.webp", daily: "img/ui/icon-daily.webp", trophy: "img/ui/icon-trophy.webp"
  },
  portraits: {
    rama: "img/portraits/rama.webp",
    hanuman: "img/portraits/hanuman.webp",
    nala: "img/portraits/nala.webp",
    squirrel: "img/portraits/squirrel.webp",
    sugriva: "img/portraits/sugriva.webp",
    samudra: "img/portraits/samudra.webp",
    jambavan: "img/portraits/jambavan.webp",
    angada: "img/portraits/angada.webp",
    lakshmana: "img/portraits/lakshmana.webp",
    vibhishana: "img/portraits/vibhishana.webp",
    kumbhakarna: "img/portraits/kumbhakarna.webp",
    ravana: "img/portraits/ravana.webp",
    sita: "img/portraits/sita.webp",
    narrator: "img/portraits/narrator.webp",
  },
  // hx/hy = vị trí bàn tay cầm đá trong khung w×h. windup = tư thế kéo về sau, throw = tư thế vung tay (rx/ry = bàn tay buông đá)
  // (cùng tỉ lệ với tư thế đứng; thiếu tư thế nào thì game dùng ảnh đứng + nghiêng người)
  monkey: {
    vanara:  { src: "img/sprites/vanara.webp",  w: 83.3, h: 84, ax: 43.5, ay: 84, hx: 17.6, hy: 11.0,
      windup: { src: "img/sprites/vanara_windup.webp", w: 85.9, h: 84.1, ax: 49.7, ay: 84.1, hx: 4.3, hy: 51.5 },
      throw: { src: "img/sprites/vanara_throw.webp", w: 86.7, h: 83.4, ax: 40.7, ay: 83.4, rx: 83.5, ry: 11.3 } },
    hanuman: { src: "img/sprites/hanuman.webp", w: 77.6, h: 84, ax: 39.4, ay: 84, hx: 19.8, hy: 12.5,
      windup: { src: "img/sprites/hanuman_windup.webp", w: 83.4, h: 83.0, ax: 46.0, ay: 83.0, hx: 5.0, hy: 41.7 },
      throw: { src: "img/sprites/hanuman_throw.webp", w: 82.8, h: 82.7, ax: 44.4, ay: 82.7, rx: 79.8, ry: 19.7 } },
    nala:    { src: "img/sprites/nala.webp",    w: 79.4, h: 84, ax: 39.7, ay: 84, hx: 17.3, hy: 13.4,
      windup: { src: "img/sprites/nala_windup.webp", w: 84.2, h: 82.1, ax: 47.4, ay: 82.1, hx: 5.6, hy: 42.1 },
      throw: { src: "img/sprites/nala_throw.webp", w: 82.1, h: 82.4, ax: 41.2, ay: 82.4, rx: 79.2, ry: 13.3 } },
    angada:  { src: "img/sprites/angada.webp",  w: 80.9, h: 84, ax: 39.6, ay: 84, hx: 16.1, hy: 12.7,
      windup: { src: "img/sprites/angada_windup.webp", w: 84.9, h: 82.8, ax: 45.4, ay: 82.8, hx: 5.7, hy: 47.5 },
      throw: { src: "img/sprites/angada_throw.webp", w: 86.0, h: 80.4, ax: 41.1, ay: 80.4, rx: 82.8, ry: 15.4 } },
    sugriva: { src: "img/sprites/sugriva.webp", w: 83.5, h: 84, ax: 44.5, ay: 84, hx: 18.4, hy: 12.3,
      windup: { src: "img/sprites/sugriva_windup.webp", w: 84.0, h: 84.4, ax: 47.5, ay: 84.4, hx: 5.0, hy: 44.8 },
      throw: { src: "img/sprites/sugriva_throw.webp", w: 85.4, h: 81.1, ax: 43.4, ay: 81.1, rx: 82.3, ry: 9.9 } }
  }
};
