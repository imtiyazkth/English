# Privacy

## What stays on your device
Progress, vocabulary, settings and results are stored **in your browser** (IndexedDB, falling back to localStorage or memory). There is no account and no learner database. Clearing site data deletes it; use **Settings → Export** to keep a backup and **Import** to restore.

## Microphone and speech
- Text-to-speech and speech recognition use your browser's Web Speech API. On some browsers (notably Chrome) recognition is performed by the browser vendor's online service, outside this app's control.
- The app **does not record or store audio**. Only the recognised text is compared with the target sentence.
- If your browser has no support, you can type instead.

## Saathi AI Tutor
When you send a message, the last few turns plus your level and settings go to this app's server function, which forwards them to the Google Gemini API using a server-side key. The key is never in the browser.
- The function does not store messages and is written not to log their content.
- **Google's terms:** on the Gemini API free tier, submitted content may be used to improve Google's products and may be reviewed by humans. Do not enter names, phone numbers, addresses, passwords or other personal information. Paid usage is governed by different terms — check Google's current policy.

## Analytics
None. No tracking scripts or third-party fonts are used.

## Hosting
The host (e.g. Cloudflare) sees normal request metadata such as IP address in its own logs.
