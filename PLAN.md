# Abroad: plan for the language app

## What it is
A phone app where you practise a language by talking out loud with a local: a barista in Madrid, a ticket agent in Lisbon, a waiter in Athens. You can put the phone down and keep the conversation going hands-free, for example while driving. Typing and speaking exercises sit next to the conversation.

Launch languages: Spanish (Madrid), French (Paris), Italian (Rome), Portuguese (Lisbon, European Portuguese), German (Berlin), Greek (Athens).

## How a conversation works
1. You pick a city, a situation (café, directions, hotel, market, train station, dinner, small talk) and your level.
2. Claude plays the local. It replies in short, spoken-style lines matched to your level, keeps the scene moving, and ends with something you can answer.
3. The phone speaks the line out loud, then opens the microphone by itself.
4. You answer out loud. Your speech is turned into text and sent back to Claude.
5. If you made a mistake, you hear a short tip in English and the better way to say it, then the conversation continues.
6. Spoken commands work at any time, in English or the language you're learning: "repeat", "slower", "help" (hear a suggested answer), "English" (hear the translation), "stop".

## Building it in stages
**Stage 1: prototype (done, in `prototype/`).** A web page that already does the full loop above. It runs inside Claude as a private page, where the local talks and you type back, because pages inside Claude can't use the microphone. The same file also works as a normal website on your phone with the microphone, once it's hosted somewhere (see "Decisions").

**Stage 2: real phone app (started, in `mobile/`).** The AI partner is the phone's own built-in AI (Apple Intelligence on iPhone, Gemini Nano on Android), which is free for everyone; phones without it use the free scenes. Built with Expo (React Native), so one codebase makes both the iPhone and Android app. What a real app adds over the website:
- keeps listening with the screen locked and through car Bluetooth, which a website can't do reliably;
- better voices (the phone's own voices for now, natural-sounding voices later);
- saves your progress, words you struggled with, and streaks;
- later: CarPlay and Android Auto.

**Stage 3: smarter practice.** Exercises built from your own conversations (the phrases you got wrong come back as typing and speaking drills), and a review schedule.

## Technology, in plain words
- **The local's brain:** Claude, through Anthropic's API. In the real app the key lives on a small server we control, never inside the app.
- **Hearing you:** the phone's built-in speech recognition to start. If it struggles with accents, switch to a dedicated speech-to-text service.
- **Speaking:** the phone's built-in voices to start.
- **Hands-free safety:** you set everything up before driving; after that it's all voice, with big tap targets and the screen kept on.

## Decisions waiting on Elijah
- Where to host the prototype so it can be opened on a phone with the microphone. The free option is GitHub Pages, which needs a GitHub account and a repository.
- The website version needs an Anthropic API key, which is a paid account (charged per use). The version inside Claude doesn't need one.

## Files
- `prototype/app.html`: the app (the page published inside Claude).
- `prototype/index.html`: the same app as a standalone website, built by `prototype/wrap.sh app.html index.html`.
