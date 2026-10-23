// Sao chép game web (thư mục gốc repo) vào app/www để Capacitor đóng gói.
// Không chép service worker / manifest PWA / tài liệu — app đã chứa sẵn mọi file.
import { cpSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "www");
const items = ["index.html", "css", "js", "img", "icons", "fonts"];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const it of items) {
  const src = join(root, it);
  if (!existsSync(src)) throw new Error("Thiếu " + it);
  cpSync(src, join(out, it), { recursive: true, filter: (p) => !p.endsWith(".png") || p.includes("/icons/") });
}
console.log("Đã chép game web vào", out);
