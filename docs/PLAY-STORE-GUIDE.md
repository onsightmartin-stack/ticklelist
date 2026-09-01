# Launching Ticklelist on Google Play — Beginner Guide

Your app is a **Capacitor** app: a thin Android shell that opens your live
community site (`https://ticklelist.org/community`) inside a native window.
That means you do **not** need to build the web app separately — you only
build the Android wrapper once, and the website updates automatically.

Below is the full journey, in order. Steps marked **[YOU]** happen in your
browser/computer; steps marked **[DONE]** are already set up in this project.

---

## Step 1 — Create a Google Play Developer account  [YOU]

1. Go to <https://play.google.com/console/signup>
2. Sign in with the Google account you want to own the app (this cannot be
   changed easily later — pick a long-term account).
3. Pay the **one-time $25 registration fee**.
4. Verify your identity (ID + a short developer profile). This can take
   1–3 days to review, so start it now.

## Step 2 — Install Android Studio on your computer  [YOU]

You need Java + the Android SDK to build the `.aab`. The easiest way is
Android Studio, which bundles everything:

1. Download from <https://developer.android.com/studio>
2. Install it, and on first launch let it download the **Android SDK** (it
   will offer automatically). Accept the default SDK components.
3. When the SDK Manager shows the SDK path, note it — you'll need it below.

> You do NOT need to open or edit any code. Android Studio is just the
> "kitchen" that bakes the `.aab` file.

## Step 3 — Generate your release keystore  [YOU]

The keystore is a small file that cryptographically signs your app. Google
Play requires every app to be signed. **Keep this file forever** — losing it
means you can never update the app under the same listing.

Open a terminal on your computer and run (one line):

```bash
keytool -genkey -v -keystore ticklelist-release.keystore -alias ticklelist -keyalg RSA -keysize 2048 -validity 10000
```

It will ask for:
- **Keystore password** → invent a strong password, save it somewhere safe.
- **Key alias** → just press Enter to use `ticklelist`.
- **Key password** → press Enter to reuse the keystore password, or set a different one.
- Your name, organization, etc. → fill in anything (e.g. "Martin Gårdling").

This creates a file called `ticklelist-release.keystore` in your current
folder. Move it to the **project root** (next to `package.json`).

## Step 4 — Build the Android App Bundle (.aab)  [YOU]

Open Android Studio → **Open** → select the `android/` folder inside this
project. Wait for Gradle to sync (the first time it downloads dependencies —
can take a few minutes).

Then build the release bundle:

**Menu:** Build → Generate Signed Bundle / APK → choose **Android App Bundle** →
- Keystore: browse to `ticklelist-release.keystore`
- enter the keystore + key passwords you set in Step 3
- alias: `ticklelist`

Or, from the terminal inside Android Studio:

```bash
# Set the passwords as environment variables (Windows: use set instead of export)
export KSTORE_PW='your_keystore_password'
export KEY_PW='your_key_password'

cd android
./gradlew bundleRelease
```

When it finishes, the file is at:

```
android/app/build/outputs/bundle/release/app-release.aab
```

That single `.aab` is what you upload to Google Play.

## Step 5 — Set up your store listing  [YOU]

In the Play Console (<https://play.google.com/console>):

1. **Create app** → name: "Ticklelist" → Free app → declarations.
2. **Store listing** tab — fill in:
   - Short description (80 chars) and full description
   - App icon (512×512 PNG)
   - Feature graphic (1024×500 PNG)
   - Phone screenshots (at least 2, 1080×1920 or larger)
3. **App content** tab — answer the:
   - **Data safety** form (what data you collect — for Ticklelist, mostly
     "Photos or videos" and "Approximate location" since users upload ascents)
   - **Content rating** questionnaire (answer honestly; it's mostly "No")
   - **Target audience** (13+)
   - **Privacy Policy** URL → point to `https://onsightmartin.com/privacy`

## Step 6 — Upload and release  [YOU]

1. Play Console → **Production** → **Create release**.
2. Upload `app-release.aab`.
3. Add release notes (e.g. "First release of Ticklelist!").
4. Review the release → **Start rollout to Production**.

## Step 7 — Wait for review

New apps go through Google's review. It usually takes **1–7 days**. You'll
get an email when it's live. After that, updates you push are much faster.

---

## Quick reference

| Thing | Value |
|-------|-------|
| App name | Ticklelist |
| Application ID | `com.onsightmartin.ticklelist` |
| Version | 1.0 (code 1) |
| Min Android | set in `android/variables.gradle` |
| Loads | `https://ticklelist.org/community` (live community site) |
| Keystore | `ticklelist-release.keystore` (project root) |
| Signing | configured in `android/app/build.gradle` |
| Output | `android/app/build/outputs/bundle/release/app-release.aab` |

## Tips for beginners

- **Don't lose the keystore.** Back it up to a safe place (cloud + USB).
  Google offers "Play App Signing" which can help, but enroll during your
  first upload to be safe.
- **Versioning:** before each update, bump `versionCode` and `versionName`
  in `android/app/build.gradle` (e.g. code 2, name "1.1"). Google rejects
  uploads with a version code you've already used.
- The website updates instantly without any app update — only bump the app
  version when you change something native (permissions, icons, splash
  screen, target SDK).
