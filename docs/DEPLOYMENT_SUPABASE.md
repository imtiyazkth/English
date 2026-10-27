# Free option: GitHub Pages (site) + Supabase (AI tutor)

Use this when you do not want to add a card to Cloudflare or Firebase.

- **Site:** built by GitHub Actions and published on GitHub Pages (repo Settings > Pages > Source: GitHub Actions).
- **Tutor:** `supabase/functions/api` is deployed as a Supabase Edge Function. The Gemini key lives only in a Supabase secret.
- The workflow `.github/workflows/deploy.yml` does both. It needs three repository secrets:

| Secret | Value |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | A personal access token from supabase.com/dashboard/account/tokens. It must start with `sbp_`. |
| `SUPABASE_PROJECT_REF` | The project's Reference ID (Project Settings > General). |
| `GEMINI_API_KEY` | Your Gemini key. |

The site is built with `VITE_API_BASE=https://<ref>.supabase.co/functions/v1`, so the app calls the function on another origin. The function allows the origins listed in `ALLOWED_ORIGINS` (default: `https://imtiyazkth.github.io`, `http://localhost:5173`).

Check: open `https://<ref>.supabase.co/functions/v1/api/health` — it shows `tutorConfigured: true` and never the key.

Limits: free-tier projects can be paused after a period of inactivity and have usage limits; check Supabase's current terms. The Gemini free tier may use submitted content to improve Google products — see PRIVACY.md.
