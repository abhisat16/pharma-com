# Pharma.com — project notes for Claude Code

Voice-first billing and inventory prototype for Indian retail pharmacies. A pharmacist speaks a command in Hindi, English, Marathi, Kannada or Telugu ("अभिजीत, 16 साल, Dolo 650 की 10 स्ट्रिप का बिल बनाओ"); the app checks stock, shows a bill draft, confirms by voice ("haan"), prints the bill and updates inventory.

Owner: Dr. Abhijeet Satapathy (product lead). Audience for demos: pharma industry leaders and faculty, so the product story (time saved per patient) matters as much as the tech.

## Structure
- `public/index.html` — markup only.
- `public/styles.css` — all styling. Design tokens on `:root`, dark theme via `prefers-color-scheme`.
- `public/core.js` — pure logic, no DOM: 50-medicine seed inventory (`SEED`), Indic → Latin transliteration, number words in 5 languages, fuzzy medicine matching, `parseCommand()`. Runs in browser and Node.
- `public/app.js` — UI, state, localStorage "database", mic capture (16 kHz WAV), Sarvam calls, browser speech fallback, receipt printing.
- `api/stt.js` — Vercel Edge Function that proxies audio to Sarvam. Holds `SARVAM_API_KEY` server-side.
- `tests/parser.test.js` — sample commands in all 5 languages; run `npm test` after any parser change.

## Speech pipeline
1. Mic → WAV (16 kHz mono, ≤29 s) in `app.js`.
2. Sarvam REST `POST https://api.sarvam.ai/speech-to-text`, header `api-subscription-key`, fields `file`, `model=saaras:v4`, `language_code` (`unknown` = auto, or hi-IN/en-IN/mr-IN/kn-IN/te-IN), `keyterms` (≤50 medicine names).
   - Key typed in Settings → browser calls Sarvam directly (local demo).
   - Otherwise → `/api/stt` adds the key on the server (public link).
3. Browser SpeechRecognition runs in parallel and is the fallback.
4. Transcript → `parseCommand()` → `bill | stock | restock | confirm | cancel | unknown`. In the claude.ai artifact build, unknown commands fall back to Claude (`sample` capability) for matching.

## Build
`python3 tools/bundle.py` → `dist/Pharma-com.html` (standalone) and `dist/artifact.html` (claude.ai artifact).

## Rules
- Never put the Sarvam key in client code or commit it. It goes in Vercel env vars only.
- Keep `core.js` free of DOM access so it stays testable in Node.
- Run `npm test` and check all sample commands still parse before committing parser changes.
- The data is demo data in localStorage. A real backend (Postgres/Supabase) is a planned next step, not built yet.

## UX direction
Keep wording minimal. Counter = green voice station (mic, waveform, transcript) + thermal bill slip. One primary action per state. Tablet-first; bottom tab bar on phones.
