# Building the Ticklelist AAB with GitHub Actions (no Android Studio needed)

The workflow in `.github/workflows/android-release.yml` builds your signed
Android App Bundle in the cloud. You trigger it from GitHub and download the
`.aab` — no Android Studio required.

## One-time setup

### 1. Create your release keystore [YOU]

On any computer with a terminal (or ask a friend):

```bash
keytool -genkey -v -keystore ticklelist-release.keystore -alias ticklelist -keyalg RSA -keysize 2048 -validity 10000
```

Pick a keystore password and save it safely. **Never lose this file** — it's
required for every future update of the app.

### 2. Convert the keystore to Base64 [YOU]

```bash
base64 -w 0 ticklelist-release.keystore > keystore.b64.txt
```

(On Windows PowerShell: `certutil -encode ticklelist-release.keystore keystore.b64.txt`
then strip the header/footer lines.)

### 3. Add GitHub secrets [YOU]

In your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | contents of `keystore.b64.txt` |
| `KSTORE_PW` | your keystore password |
| `KEY_PW` | your key password (same as keystore password if you reused it) |

Do NOT commit the keystore file itself to the repo.

## Every build

1. Go to your repo on GitHub → **Actions** tab → **Build Android App Bundle (AAB)**.
2. Click **Run workflow** → fill in:
   - `version_code`: increase by 1 every upload (1, 2, 3…)
   - `version_name`: e.g. `1.0`, `1.1`
3. Wait ~10 minutes. When it turns green, open the run and download the
   **app-release-aab** artifact (a zip containing `app-release.aab`).
4. Upload that `.aab` in Play Console → Production → Create release.

## Notes

- The web app is built and synced into the Android shell during the workflow,
  so the AAB always matches the current codebase. (The app still loads
  `ticklelist.org/community` live at runtime.)
- If the build fails, open the failing step's logs in the Actions run — the
  error is usually shown at the bottom.
- Keep `versionCode` strictly increasing; Google Play rejects duplicates.
