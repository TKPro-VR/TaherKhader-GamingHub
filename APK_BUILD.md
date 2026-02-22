# Build Midnight Hallway as an APK

This project is a web game. The easiest way to make a playable APK is to wrap it with Capacitor.

## 1) Install tools
- Node.js 18+
- Java 17+
- Android Studio (SDK + emulator or USB phone)

## 2) Create a clean build folder
From your project root:

```bash
mkdir -p apk-build && cp -r index.html horror.html horror.css horror.js style.css script.js games.html manifest.webmanifest service-worker.js img apk-build/
cd apk-build
```

## 3) Add Capacitor
```bash
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init midnight.hallway "Midnight Hallway" --web-dir .
npx cap add android
```

## 4) Open Android project and build APK
```bash
npx cap open android
```
In Android Studio:
- Wait for Gradle sync.
- Test with **Run** (emulator/phone).
- Build APK from **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

Output path is usually:
`android/app/build/outputs/apk/debug/app-debug.apk`

## 5) Install APK on phone
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Notes
- The game already supports keyboard and touch controls.
- For release to Play Store, generate a signed release APK/AAB in Android Studio.
