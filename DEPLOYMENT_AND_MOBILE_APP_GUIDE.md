# MSA University — Faculty of Biotechnology Portal (Mobile PWA & Vercel Ready)

This folder is a clean, self-contained, deployment-ready package of the **Faculty of Biotechnology Portal**. It is pre-configured to be deployed to **GitHub** and **Vercel**, and installed directly on your **iPhone** or **Android** phone as a standalone mobile app.

---

## 📁 What is in this Folder?

This directory contains **ONLY** the essential project files needed to run and deploy the application (Total size: ~1.8 MB):

- `src/`: Complete application logic, pages, components, and APIs.
- `public/`:
  - `manifest.json`: Web App Manifest defining the mobile app name, icons, and display mode (`standalone`).
  - `sw.js`: Service worker for background caching and mobile push notifications.
  - `logos/`: Official high-resolution MSA University and Faculty of Biotechnology logos.
- `package.json` & `package-lock.json`: Dependencies and build scripts.
- `next.config.mjs`: Next.js configuration.
- `tsconfig.json`: TypeScript configuration.
- `schema.sql`: Database schema.
- `.gitignore`: Configured to keep build files (`.next`) and `node_modules` out of GitHub.
- `vercel.json`: Pre-configured headers for mobile PWA service worker and manifest caching.

*(Note: `node_modules` is intentionally omitted because Vercel installs dependencies automatically in the cloud in ~30 seconds).*

---

## 🚀 Step 1: Upload to GitHub

You can upload this folder to GitHub using either **GitHub Web** or the **Terminal / Git Bash**.

### Method A: Using Git Commands (Recommended)
Open a terminal (PowerShell or Git Bash) inside this folder:

```bash
# 1. Initialize git
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit - Faculty of Biotechnology Mobile Portal"

# 4. Link to your GitHub repository (create an empty repository on github.com first)
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git

# 5. Push
git push -u origin main
```

### Method B: Using GitHub Desktop
1. Open **GitHub Desktop**.
2. Click **File** -> **Add Local Repository...**.
3. Choose this folder: `Faculty-Portal-Deploy`.
4. Click **Publish Repository** to send it directly to your GitHub account.

---

## 🌐 Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and log in (or sign up with your GitHub account).
2. Click **"Add New..."** -> **"Project"**.
3. You will see your newly created GitHub repository in the list. Click **"Import"**.
4. Vercel will automatically detect **Next.js**. Leave all default settings as they are.
5. Click **"Deploy"**.
6. Within 1 minute, Vercel will give you a live production URL (e.g., `https://faculty-biotech-portal.vercel.app`).

---

## 📱 Step 3: Install as an App on Your Mobile Phone

Once deployed to Vercel, open your live link (`https://your-project.vercel.app`) on your mobile phone:

### On iPhone (Safari):
1. Open the website in **Safari**.
2. Tap the **Share** button (the square with an arrow pointing upward at the bottom of the screen).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top-right corner.
5. The **Biotech Portal** app icon will appear on your iPhone home screen! Tapping it opens the app in fullscreen mode without any browser URL bars.

### On Android (Chrome / Edge / Samsung Internet):
1. Open the website in **Chrome**.
2. Tap the three dots **(⋮)** in the top right corner.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. Tap **"Install"**.
5. The app will install to your app drawer and home screen just like an app from Google Play.

---

## 💻 Local Testing (Optional)
If you ever want to run this clean folder locally:
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.
