#!/usr/bin/env bash
# Build APK debug cho Android. Dùng JDK đi kèm Android Studio + Node 24 (Capacitor 8 cần Node ≥ 22).
set -euo pipefail
cd "$(dirname "$0")/.."
export JAVA_HOME="${JAVA_HOME_OVERRIDE:-/opt/android-studio/jbr}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}" ANDROID_SDK_ROOT="${ANDROID_HOME:-$HOME/Android/Sdk}"
[ -d "$HOME/.nvm/versions/node/v24.22.0/bin" ] && export PATH="$HOME/.nvm/versions/node/v24.22.0/bin:$PATH"
[ -f android/local.properties ] || echo "sdk.dir=$ANDROID_HOME" > android/local.properties
npm run sync
cd android && ./gradlew assembleDebug -Dorg.gradle.java.installations.paths="$JAVA_HOME" -Dorg.gradle.java.installations.auto-detect=false
ls -lh app/build/outputs/apk/debug/*.apk
