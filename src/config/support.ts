/**
 * Where "Support the expedition" buttons point.
 *
 * Google Play policy note: donations to an individual/creator may be taken
 * outside Google Play Billing, but selling digital goods or memberships
 * inside the Android app must use Play Billing. Keep these links donation-only.
 */
export const SUPPORT_LINKS = [
  {
    id: "buymeacoffee",
    label: "Buy me a coffee",
    description: "One-off tip — fuel, ferries, and mountain hut nights.",
    url: "https://buymeacoffee.com/onsightmartin",
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Send any amount directly.",
    url: "https://www.paypal.me/onsightmartin",
  },
  {
    id: "youtube",
    label: "Subscribe on YouTube",
    description: "Free way to help — every view supports the project.",
    url: "https://www.youtube.com/@onsightmartin",
  },
] as const;
