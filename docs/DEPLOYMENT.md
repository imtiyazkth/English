# Deploying to Cloudflare Pages

Pushing code to GitHub only stores it. The app goes live when a host such as Cloudflare Pages builds it.

## 1. Create the Pages project
1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Choose the `imtiyazkth/English` repository, branch `main`.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - Node version: 20 or newer (set `NODE_VERSION` if needed).
4. The `functions/` folder is detected automatically and served at `/api/health` and `/api/tutor`.

## 2. Add the Gemini key (secret) and model (variable)
In the project: **Settings → Variables and Secrets** (Production, and Preview if you use it):
| Name | Type | Value |
|---|---|---|
| `GEMINI_API_KEY` | **Secret / encrypted** | your key from Google AI Studio |
| `GEMINI_MODEL` | Plain variable | `gemini-3.1-flash-lite` (default; change here without code changes) |

Redeploy after changing variables. Never put the key in the repo, `wrangler.toml`, `.env.example` or client code.

## 3. Verify
Open `https://<your-project>.pages.dev/api/health`. It reports whether the tutor is configured (`true`/`false`) and never reveals the key. The Tutor screen shows a clear "not configured" message until the secret is set.

## Limits and costs — be realistic
- Free tiers have **rate and usage limits** and can change; nothing here is "unlimited" or guaranteed free. Check current [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) and [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/).
- On Gemini's **free tier, Google may use submitted content to improve its products.** Tell learners not to type personal information into the tutor (also stated in [PRIVACY.md](PRIVACY.md)).
- The in-function throttle is best-effort per isolate. If the app becomes public and popular, add Cloudflare rate-limiting / Turnstile.
- Because the key is shared by every user, usage from all learners counts against one quota.

## Local test
```bash
cp .dev.vars.example .dev.vars   # add your own key there
npm run build && npx wrangler pages dev dist
```
