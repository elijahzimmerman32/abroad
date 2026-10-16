# Abroad

Practise a language by talking out loud with a local: a barista in Madrid, a ticket agent in Lisbon, a waiter in Athens. Put the phone down and keep the conversation going hands-free.

Languages: Spanish, French, Italian, Portuguese (European), German, Greek.

## Try it
Open the site on your phone (Safari on iPhone, Chrome on Android): https://elijahzimmerman32.github.io/abroad/

It works for free out of the box: "Free scenes" follow a script in each language, no account needed. For open conversation with corrections, switch to "AI partner" on the Trip tab and add your Anthropic API key, which is stored only in your phone's browser.

## Phone app
The `mobile/` folder is the iPhone and Android app. Its AI partner is the AI built into the phone (Apple Intelligence on iPhone, Gemini Nano on Android), so it's free. Phones without it get the free scenes. Android users can install it from the [android-preview release](https://github.com/elijahzimmerman32/abroad/releases/tag/android-preview). See [mobile/README.md](mobile/README.md).

## Files
- `app.html`: the app itself (one file: layout, styles and code).
- `index.html`: the website version, made from `app.html` by running `./wrap.sh app.html index.html`.
- `mobile/`: the phone app.
- `PLAN.md`: the plan for turning this into a real iPhone and Android app.
