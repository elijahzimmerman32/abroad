# Abroad phone app

The iPhone and Android app, built with Expo (React Native). It runs the same `app.html` as the website, so the scenes, levels, practice and "Start over" button are identical, and it adds what a website can't do well:

- **Free AI partner built into the phone.** No API key, no account, nothing sent to a server.
  - iPhone: Apple Intelligence (Apple's Foundation Models), on iPhone 15 Pro, iPhone 16, iPhone 17 and newer, with iOS 26 and Apple Intelligence turned on in Settings.
  - Android: Gemini Nano, on phones Google lists for its ML Kit Prompt API, such as Pixel 9 and newer, Galaxy S26, OnePlus 13/15, Xiaomi 15 and others.
- **The phone's own microphone and voices**, including car and headset microphones over Bluetooth.
- **Screen stays on** during a conversation.

## What falls back to the free scenes

The app checks the phone when it opens and whenever you change language. If the phone's AI can't do the conversation, you get the free scenes automatically, and the Trip tab says why.

| | iPhone (Apple Intelligence) | Android (Gemini Nano) |
|---|---|---|
| Spanish, French, Italian, German, Portuguese | Yes | Works, labeled a preview: Google has only validated English and Korean so far |
| Greek | No, Apple's model doesn't speak Greek yet: free scenes | Works, labeled a preview |
| Older phones, or Apple Intelligence off | Free scenes | Free scenes |

## Try it

**Android:** open the [android-preview release](https://github.com/elijahzimmerman32/abroad/releases/tag/android-preview) on your phone, download `Abroad.apk`, and open it. Android asks once to allow installing apps from your browser; allow it. Every change to the code builds a new APK there automatically (see `.github/workflows/phone-app.yml`).

**iPhone:** Apple only lets you install apps outside the App Store in two ways: from a Mac with Xcode (free Apple ID, the app expires after 7 days), or through TestFlight, which needs the paid Apple Developer Program ($99 a year). With a Mac: install Xcode 26, then in this folder run `npm install`, `npm run sync-web` and `npx expo run:ios --device`.

## How it fits together

- `App.tsx`: shows `app.html` full screen and answers its requests for the microphone, voices and AI.
- `src/bridge.ts`: runs inside the page and gives it the phone's microphone and voices through the same browser features the website uses, plus `window.AbroadNative.ai` for the phone's AI.
- `modules/abroad-ai/`: the small native module that talks to Apple Intelligence (`ios/AbroadAiModule.swift`) and Gemini Nano (`android/.../AbroadAiModule.kt`).
- `src/web/appHtml.ts`: a copy of `../app.html`. After changing `app.html`, run `npm run sync-web` (the automatic build does this too).
