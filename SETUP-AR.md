# AR Try-On Setup Guide

## Prerequisites
- Node.js 18+, Expo CLI, Android Studio / Xcode

## Setup Commands (Windows PowerShell)

```powershell
# 1. Install dependencies
npm install

# 2. Install AR dependencies
npx expo install @reactvision/react-viro@2.54.0 react-native-view-shot expo-media-library expo-sharing

# 3. Prebuild with New Architecture (REQUIRED for ViroReact)
npx expo prebuild --clean

# 4. Build and run (requires Android Studio / Xcode)
# Android:
npx expo run:android

# iOS (macOS only):
npx expo run:ios
```

## ⚠️ Critical Requirements

### 1. Development Build Required
**ViroReact (AR) does NOT work in Expo Go.** You MUST build a development client:

```powershell
# Build once, then run
npx expo run:android    # or expo run:ios on macOS
# After first build, use:
npx expo start --dev-client
```

### 2. New Architecture (Fabric) Required
ViroReact requires React Native New Architecture (Fabric).
- Android: `android/gradle.properties` → `newArchEnabled=true` ✅ Already set
- iOS: Requires `npx expo prebuild --clean` then `pod install`

### 3. Expo Go Limitation
**AR features do NOT work in Expo Go.** The app will automatically detect Expo Go and show fallback UI with a message.

## Testing the AR Features

1. Build dev client: `npx expo run:android`
2. Open app on device
3. Navigate to a product → Tap "Try On"
4. Choose "AR" mode (requires dev build) or "Overlay" (works everywhere)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "expo not recognized" | Use `npx expo` instead of `expo` |
| ViroReact native module not found | Run `npx expo prebuild --clean` then rebuild |
| "New Architecture required" | Ensure `newArchEnabled=true` in `android/gradle.properties` |
| iOS build fails | Run `cd ios && pod install` then rebuild |
| Metro bundler issues | `npx expo start -c` to clear cache |

## Required Environment Variables

Create `.env` file:
```env
EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your-token
```

## Useful Commands

```powershell
# Start with cleared cache
npx expo start -c

# Build APK for testing
npx expo run:android --variant release

# View logs
npx expo logs

# Clear everything and rebuild
Remove-Item -Recurse -Force android, ios -ErrorAction SilentlyContinue
npx expo prebuild --clean
```