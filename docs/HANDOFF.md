# Ghi chú bàn giao — Ram Setu (cập nhật 23/10/2026)

Tài liệu để tiếp tục dự án trên máy khác: trạng thái hiện tại, cách build, việc còn dang dở.

## 1. Tổng quan

| Thành phần | Giá trị |
|---|---|
| Bản web (PWA) | https://tranthanhhai1997.github.io/ram-setu/ — GitHub Pages, nhánh `main` |
| App Android | Capacitor 8, thư mục `app/` — đóng gói nguyên game web |
| Package | `io.github.tranthanhhai1997.ramsetu` |
| Tên trên Play | `Ram Setu: Bridge Builder` (hi-IN: `Ram Setu: राम सेतु पुल बनाओ`) |
| Phiên bản hiện tại | `1.0.1` — **versionCode 2** (`app/android/app/build.gradle`) |
| Chính sách quyền riêng tư | https://tranthanhhai1997.github.io/ram-setu/privacy.html (en + hi) |
| Email liên hệ (công khai trên Play, IARC) | tranthanhhai.it1997@gmail.com |

## 2. Dựng môi trường trên máy mới

1. Clone repo, cài **Android Studio** (dùng JDK đi kèm `/opt/android-studio/jbr`) và **Node ≥ 22** (Capacitor 8).
2. `cd app && npm install`
3. **Khóa ký phát hành (BẮT BUỘC, không có trong Git):**
   - Chép `app/ram-setu-upload.jks` từ bản sao lưu riêng vào `app/`.
   - `cp app/android/keystore.properties.example app/android/keystore.properties` rồi điền mật khẩu.
   - Mất khóa này thì không cập nhật app được (phải xin Google đặt lại upload key qua Play App Signing).
4. Đường dẫn trong `app/scripts/build-*.sh` đang theo máy cũ (`/opt/android-studio/jbr`, `~/Android/Sdk`, nvm Node 24) — sửa biến `JAVA_HOME_OVERRIDE` / `ANDROID_HOME` nếu khác.

## 3. Build

```bash
bash app/scripts/build-apk.sh   # APK debug → app/android/app/build/outputs/apk/debug/
bash app/scripts/build-aab.sh   # AAB đã ký → app/android/app/build/outputs/bundle/release/
```

- Cả hai script tự chép game web vào `app/www` (`npm run sync`) — luôn sửa code ở thư mục gốc, không sửa `app/www`.
- **Quảng cáo:** `AD_CONFIG.testing` trong `js/platform.js`
  - `true` → ID mẫu của Google ("Test Ad") — dùng cho APK chơi thử. Bản trên GitHub giữ `false`.
  - Quy trình đang dùng: bật `true` → build APK chơi thử → đặt lại `false` → build AAB.
- **Mỗi lần tải AAB mới lên Play: tăng `versionCode`** (đã dùng: 1, 2).
- Bản web: tăng `VERSION` trong `sw.js` mỗi lần phát hành (đang `ramsetu-v17`).
- `app/dist/` (APK/AAB/ảnh Store) bị bỏ qua khỏi Git — tạo lại bằng build.

## 4. AdMob

| Mục | ID |
|---|---|
| App ID | `ca-app-pub-6386233826905968~5439619736` (`app/android/app/src/main/res/values/strings.xml`) |
| Interstitial ("Trung gian") | `ca-app-pub-6386233826905968/6992996679` |
| Rewarded | `ca-app-pub-6386233826905968/1280882879` |
| (không dùng) Rewarded interstitial | `ca-app-pub-6386233826905968/9374995319` — tạo nhầm loại |

- Plugin `@capacitor-community/admob@8.2.1`; logic ở `Ads` trong `js/platform.js`, giao diện ở `openAd` / `openRealAd` trong `js/ui.js`.
- Interstitial sau mỗi 2 màn thắng; rewarded ở nút 📺 +5 và hồi sinh khi thua. Web / chưa tải xong quảng cáo → màn mô phỏng (interstitial trong app thì bỏ qua).
- Thông báo GDPR (UMP) đã xuất bản trong AdMob, có nút "Không đồng ý" cho mọi nước. Nút "Ad privacy options" trong Cài đặt chỉ hiện ở vùng bắt buộc.
- **Còn lại:** sau khi app lên Store → AdMob liên kết app với Play; tạo `app-ads.txt` ở **gốc tên miền** (`tranthanhhai1997.github.io/app-ads.txt` → cần repo `tranthanhhai1997.github.io`).
- Không tự bấm quảng cáo thật (nguy cơ khóa tài khoản).

## 5. Google Play Console — trạng thái

Tài khoản cá nhân mới → **bắt buộc thử nghiệm kín ≥ 12 người trong ≥ 14 ngày** trước khi xin phát hành công khai.

Đã xong:
- Nội dung ứng dụng: chính sách quyền riêng tư, không cần đăng nhập, có quảng cáo, Advertising ID (Phân tích / Quảng cáo / Chống gian lận), không phải app chính phủ / tài chính / sức khỏe, đối tượng 13+, An toàn dữ liệu (vị trí ước chừng, tương tác app, chẩn đoán, mã thiết bị — thu thập & chia sẻ, mã hóa khi truyền, không có tài khoản).
- Phân loại nội dung IARC: ESRB E10+, PEGI 7, Úc PG, Brazil L.
- Danh mục: Trò chơi → Phổ thông (Casual). Trang web liên hệ: bản web GitHub Pages.
- Trang Cửa hàng en-US + hi-IN (mô tả, icon, ảnh đầu trang, ảnh chụp màn hình; đã gắn nhãn "do AI tạo" cho mọi ảnh vì hình trong game tạo bằng ChatGPT — xem `docs/art-prompts.md`).
- Kênh **Thử nghiệm khép kín - Alpha**: quốc gia **Việt Nam**, bản phát hành nháp có ghi chú en + hi.

Đang dở:
1. Bản nháp Alpha còn chứa AAB **versionCode 1** (thiếu các bản sửa mới) → xóa, tải `RamSetu-1.0.1-release.aab` (versionCode 2), đổi tên bản phát hành thành `1.0.1 (2) – Closed test VN`.
2. Thêm danh sách email người kiểm thử (≥ 12, nên 15–20) ở tab "Nhân viên kiểm thử".
3. Bấm "Gửi … thay đổi để được xem xét" ở **Tổng quan về việc xuất bản**.
4. Sau 14 ngày → đăng ký phát hành công khai, chọn **tất cả quốc gia** (thị trường chính: Ấn Độ).

Ảnh Store: chụp từ máy ảo với `adb shell wm size 1080x1920` (khung 1920×1080), lưu ở `app/dist/store/` (en) và `app/dist/store/hi/`.

## 6. Ghi chú kỹ thuật quan trọng

- **Ngôn ngữ:** theo ngôn ngữ chính của máy (`detectLang` trong `js/i18n.js`), không có thì tiếng Anh; người chơi chọn tay thì lưu vào `SAVE.lang`.
- **Chia sẻ:** `FILM.shareUrl` = link Google Play (chỉ mở được khi app công khai).
- **Hiệu năng (đo trên Android WebView):**
  - Hoạt ảnh CSS lặp vô hạn buộc WebView dựng lại toàn màn hình liên tục → `wakeDecor()` trong `js/ui.js` cho chạy 6 s sau mỗi lần chạm rồi tạm dừng. **Đừng thêm hoạt ảnh `infinite` mới mà không qua cơ chế này.**
  - Vòng lặp canvas (`loop` trong `js/game.js`): tối đa ~60 khung/giây; ~4 khung/giây khi menu / tạm dừng / quảng cáo / bảng kết quả; dừng khi app chạy nền.
  - Số đo: menu để yên ~100% → ~13% một nhân; đang chơi ~53% (máy ảo dựng hình bằng CPU, máy thật thấp hơn). Giảm DPR canvas không giúp gì.
- **Lỗi đã sửa gần đây:** thử thách ngày / Biển vô tận crash từ chặng 2 (`genLevel`), treo màn Ravana khi ảnh bờ tải chậm (`drawRavana`), boss bị bỏ qua khi xây cầu không theo thứ tự (`landStone` / `spawnDemon` / `hitDemon`).

## 7. Kiểm thử tự động (cách đã làm)

Chạy trong DevTools của trang (bản web local `python3 -m http.server 8765`, hoặc WebView trong app qua `adb forward tcp:9333 localabstract:webview_devtools_remote_<pid>`):
- Gọi trực tiếp `startLevel(cfg)`, `launch(vx, vy, x, y)`, `step(1/60)`; bot ngắm bằng mô phỏng quỹ đạo có tính gió; bắt lỗi qua `window.onerror` + `console.error`.
- Kết quả lần cuối: 12 màn × 3 độ khó, Biển vô tận 1–25, Thử thách ngày 30 ngày, nhánh thiếu ảnh nền, hết đá — **không lỗi JS**.
- Nhớ đặt `mode` ("story" / "endless" / "daily") trước `startLevel`, và chạy nền (không `await` quá 45 s trong một lệnh).

## 8. Việc nên làm tiếp

- Cân bằng **Thử thách ngày**: bot ngắm gần hoàn hảo vẫn thua 4/30 ngày do thiếu đá — cân nhắc cộng đá theo máu quỷ / cầu lửa trong `genLevel` (`js/game.js`).
- Nhờ người bản ngữ duyệt bản dịch tiếng Hindi (game + trang Store + `privacy.html`).
- `app-ads.txt` + liên kết AdMob ↔ Play sau khi phát hành.
