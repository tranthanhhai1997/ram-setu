"""Tạo icon & màn hình chờ cho app Android từ ảnh trong game (huy hiệu + ảnh chủ đạo).
Chạy: python3 app/scripts/make-icons.py   (từ thư mục gốc repo)
Xuất thêm app/assets/icon-1024.png, splash-2732.png để dùng cho iOS sau này."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
RES = ROOT / "app/android/app/src/main/res"
ASSETS = ROOT / "app/assets"
EMBLEM = Image.open(ROOT / "img/ui/emblem.webp").convert("RGBA")
KEYART = Image.open(ROOT / "img/ui/keyart.webp").convert("RGB")
DENS = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}


def gradient(size):
    """Nền nghệ (trên) → chàm (dưới), có quầng sáng giữa."""
    w, h = size
    img = Image.new("RGB", size)
    d = ImageDraw.Draw(img)
    for y in range(h):
        k = y / max(1, h - 1)
        d.line([(0, y), (w, y)], fill=(int(239 * (1 - k) + 36 * k), int(125 * (1 - k) + 16 * k), int(31 * (1 - k) + 60 * k)))
    glow = Image.new("L", size, 0)
    ImageDraw.Draw(glow).ellipse([w * 0.15, h * 0.12, w * 0.85, h * 0.82], fill=150)
    glow = glow.filter(ImageFilter.GaussianBlur(w * 0.12))
    img.paste(Image.new("RGB", size, (255, 214, 140)), (0, 0), glow)
    return img


def emblem_on(canvas, frac):
    """Đặt huy hiệu vào giữa, chiếm `frac` chiều rộng."""
    w, h = canvas.size
    ew = int(w * frac)
    e = EMBLEM.resize((ew, int(ew * EMBLEM.height / EMBLEM.width)), Image.LANCZOS)
    canvas.alpha_composite(e, ((w - e.width) // 2, (h - e.height) // 2))
    return canvas


def round_mask(size, radius_frac):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=int(size[0] * radius_frac), fill=255)
    return m


# Icon gốc 1024 (dùng cho iOS / cửa hàng)
ASSETS.mkdir(parents=True, exist_ok=True)
master = emblem_on(gradient((1024, 1024)).convert("RGBA"), 0.78)
master.convert("RGB").save(ASSETS / "icon-1024.png")

for name, k in DENS.items():
    folder = RES / f"mipmap-{name}"
    s = int(48 * k)                      # icon kiểu cũ
    fg = int(108 * k)                    # adaptive icon: lớp trước 108dp, vùng an toàn 66dp
    legacy = master.resize((s, s), Image.LANCZOS)
    legacy.putalpha(round_mask((s, s), 0.22))
    legacy.save(folder / "ic_launcher.png")
    rnd = master.resize((s, s), Image.LANCZOS)
    m = Image.new("L", (s, s), 0); ImageDraw.Draw(m).ellipse([0, 0, s - 1, s - 1], fill=255)
    rnd.putalpha(m)
    rnd.save(folder / "ic_launcher_round.png")
    emblem_on(Image.new("RGBA", (fg, fg), (0, 0, 0, 0)), 0.60).save(folder / "ic_launcher_foreground.png")
    gradient((fg, fg)).save(folder / "ic_launcher_background.png")

# Màn hình chờ: ảnh chủ đạo làm mờ + tối, huy hiệu ở giữa
def splash(size):
    w, h = size
    kw, kh = KEYART.size
    scale = max(w / kw, h / kh)
    bg = KEYART.resize((int(kw * scale) + 1, int(kh * scale) + 1), Image.LANCZOS)
    bg = bg.crop(((bg.width - w) // 2, (bg.height - h) // 2, (bg.width - w) // 2 + w, (bg.height - h) // 2 + h))
    bg = bg.filter(ImageFilter.GaussianBlur(min(w, h) * 0.012)).convert("RGBA")
    bg.alpha_composite(Image.new("RGBA", size, (20, 10, 34, 150)))
    return emblem_on(bg, 0.34 * min(w, h) / w)

splash((2732, 2732)).convert("RGB").save(ASSETS / "splash-2732.png")
for folder in RES.glob("drawable*"):
    f = folder / "splash.png"
    if not f.exists():
        continue
    w, h = Image.open(f).size
    splash((w, h)).convert("RGB").save(f)
print("Đã tạo icon & splash")
