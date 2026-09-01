import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.onsightmartin.ticklelist",
  appName: "Ticklelist",
  webDir: "dist",
  server: {
    // Open the community route directly. Do not rely on the domain-root
    // redirect: a cached document or missing build-time env could otherwise
    // leave the Android WebView on the Onsight Martin homepage.
    url: "https://ticklelist.org/community",
    // Force HTTPS only — modern Android (14+) blocks cleartext HTTP by default.
    androidScheme: "https",
  },
  // Tag the WebView so the site can detect the app even if the Capacitor
  // bridge hasn't been injected yet.
  appendUserAgent: "TicklelistApp",
  android: {
    backgroundColor: "#0b0f14",
    allowMixedContent: false,
    // Enforce TLS — reject connections with invalid certificates.
    captureInput: true,
    // Use the Android WebView's built-in safe browsing on supported devices.
    webContentsDebuggingEnabled: false,
  },
};

export default config;
