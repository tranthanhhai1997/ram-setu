"use strict";
/* =====================================================================
   NỀN TẢNG: web (trình duyệt / PWA) hay app native (Capacitor: Android, iOS)
   - IS_APP: đang chạy trong app; plugin native gọi qua window.Capacitor.Plugins
   - Native.*: hàm tiện ích, tự rơi về API web khi không có plugin
   ===================================================================== */
const IS_APP = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
if (IS_APP) document.body.classList.add("app");

const Native = {
  plugin(name) { return IS_APP && window.Capacitor.Plugins ? window.Capacitor.Plugins[name] : null; },
  /* Rung: mảng kiểu navigator.vibrate ([rung, nghỉ, rung…]) được quy về tổng thời gian rung */
  vibrate(pattern) {
    const H = this.plugin("Haptics");
    if (H) {
      const ms = Array.isArray(pattern) ? pattern.reduce((a, v, i) => i % 2 === 0 ? a + v : a, 0) : pattern;
      H.vibrate({ duration: Math.max(10, Math.min(400, ms)) }).catch(() => {});
      return true;
    }
    return false;
  },
  /* Chia sẻ: bảng chia sẻ của hệ điều hành */
  async share(data) {
    const S = this.plugin("Share");
    if (S) { await S.share({ title: data.title, text: data.text, url: data.url, dialogTitle: data.title }); return true; }
    return false;
  },
  on(pluginName, event, cb) { const P = this.plugin(pluginName); if (P && P.addListener) P.addListener(event, cb); },
  exitApp() { const A = this.plugin("App"); if (A) A.exitApp(); }
};

/* =====================================================================
   QUẢNG CÁO THẬT (AdMob, chỉ trong app): interstitial + rewarded
   - testing = true: dùng ID mẫu của Google (luôn có quảng cáo "Test Ad", không
     tính tiền, an toàn khi tự bấm). Phát hành lên Google Play: đặt testing = false.
     App ID nằm ở app/android/app/src/main/res/values/strings.xml
   - Web / chưa tải xong quảng cáo: Ads.ready() = false → UI dùng bản mô phỏng
   ===================================================================== */
const AD_CONFIG = {
  testing: false,
  interstitial: "ca-app-pub-6386233826905968/6992996679",
  rewarded: "ca-app-pub-6386233826905968/1280882879"
};
const AD_TEST_IDS = { // ID mẫu chính thức của Google
  interstitial: "ca-app-pub-3940256099942544/1033173712",
  rewarded: "ca-app-pub-3940256099942544/5224354917"
};

const Ads = (() => {
  const loaded = { interstitial: false, rewarded: false };
  let A = null, onDismiss = null, rewarded = false, privacyRequired = false;
  const opts = (kind) => ({ adId: (AD_CONFIG.testing ? AD_TEST_IDS : AD_CONFIG)[kind], isTesting: AD_CONFIG.testing, immersiveMode: true });
  const prepare = (kind) => {
    if (!A || loaded[kind]) return;
    const p = kind === "rewarded" ? A.prepareRewardVideoAd(opts(kind)) : A.prepareInterstitial(opts(kind));
    p.then(() => { loaded[kind] = true; })
      .catch(() => setTimeout(() => prepare(kind), 30000)); // lỗi mạng / hết quảng cáo: thử lại sau 30s
  };
  const finish = (ok) => { const cb = onDismiss; onDismiss = null; if (cb) cb(ok); };

  return {
    async init() {
      A = Native.plugin("AdMob");
      if (!A) return;
      try {
        await A.initialize({ initializeForTesting: AD_CONFIG.testing });
        // Form đồng ý GDPR (UMP): chỉ hiện ở vùng bắt buộc (EU/UK…)
        const info = await A.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === "REQUIRED") await A.showConsentForm();
        privacyRequired = info.privacyOptionsRequirementStatus === "REQUIRED";
      } catch (e) { /* vẫn thử tải quảng cáo */ }
      A.addListener("interstitialAdDismissed", () => finish(true));
      A.addListener("interstitialAdFailedToShow", () => finish(true));
      A.addListener("onRewardedVideoAdReward", () => { rewarded = true; });
      A.addListener("onRewardedVideoAdDismissed", () => finish(rewarded));
      A.addListener("onRewardedVideoAdFailedToShow", () => finish(false));
      prepare("interstitial"); prepare("rewarded");
    },
    ready(kind) { return !!A && loaded[kind]; },
    /* Vùng GDPR: phải có nút để người dùng đổi lựa chọn đồng ý */
    privacyRequired() { return privacyRequired; },
    showPrivacyOptions() { return A ? A.showPrivacyOptionsForm().catch(() => {}) : Promise.resolve(); },
    /* Hiện quảng cáo; resolve(true) = interstitial đã đóng / rewarded đã xem đủ để nhận thưởng */
    show(kind) {
      return new Promise((resolve) => {
        loaded[kind] = false; rewarded = false;
        onDismiss = (ok) => { prepare(kind); resolve(ok); };
        (kind === "rewarded" ? A.showRewardVideoAd() : A.showInterstitial()).catch(() => finish(false));
      });
    }
  };
})();
const ADS_READY = Ads.init();
const PRIVACY_URL = "https://tranthanhhai1997.github.io/ram-setu/privacy.html";
