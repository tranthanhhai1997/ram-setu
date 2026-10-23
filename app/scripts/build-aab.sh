#!/usr/bin/env bash
# Build AAB (Android App Bundle) để tải lên Google Play.
# Có android/keystore.properties → AAB đã ký; chưa có → AAB chưa ký (chỉ để kiểm tra build).
set -euo pipefail
cd "$(dirname "$0")/.."
export JAVA_HOME="${JAVA_HOME_OVERRIDE:-/opt/android-studio/jbr}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}" ANDROID_SDK_ROOT="${ANDROID_HOME:-$HOME/Android/Sdk}"
[ -d "$HOME/.nvm/versions/node/v24.22.0/bin" ] && export PATH="$HOME/.nvm/versions/node/v24.22.0/bin:$PATH"
[ -f android/local.properties ] || echo "sdk.dir=$ANDROID_HOME" > android/local.properties
[ -f android/keystore.properties ] || echo "⚠ Chưa có android/keystore.properties — AAB sẽ CHƯA KÝ, Google Play không nhận."
npm run sync
cd android && ./gradlew bundleRelease -Dorg.gradle.java.installations.paths="$JAVA_HOME" -Dorg.gradle.java.installations.auto-detect=false
ls -lh app/build/outputs/bundle/release/*.aab
