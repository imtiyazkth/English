# Push to GitHub from Termux

Target repository: `https://github.com/imtiyazkth/English.git` — branch `main`.

Pushing to GitHub **does not deploy** the app. See [DEPLOYMENT.md](DEPLOYMENT.md).

## 1. One-time setup
```bash
pkg update && pkg install -y git unzip nodejs-lts
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

## 2. Unpack
```bash
cd ~/storage/downloads 2>/dev/null || cd ~     # run `termux-setup-storage` first if needed
unzip English-Saathi-App.zip -d english-saathi
cd english-saathi
```

## 3. Initialise and add the remote (safely)
```bash
[ -d .git ] || git init
git checkout -B main
git remote get-url origin >/dev/null 2>&1 \
  && git remote set-url origin https://github.com/imtiyazkth/English.git \
  || git remote add origin https://github.com/imtiyazkth/English.git
git remote -v
```
This never runs `git remote add origin` twice.

## 4. Commit
```bash
git add .
git status            # confirm no .env / .dev.vars / key files are listed
git commit -m "Add English Saathi app"
```

## 5. Push
```bash
git push -u origin main
```
If the remote already has commits and the push is rejected, **do not force-push**. Instead:
```bash
git pull --rebase origin main
git push -u origin main
```

## Authentication
GitHub no longer accepts account passwords for Git. When asked for a password, use a **personal access token** (or install the GitHub CLI: `pkg install gh && gh auth login`).
**Never put a token in the remote URL** (e.g. `https://TOKEN@github.com/...`) — it is stored in `.git/config` in plain text.

## Never commit
`.dev.vars`, `.env*`, `node_modules/`, `dist/`, any Gemini key. They are already in `.gitignore`.
