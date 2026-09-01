import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { detectBrowser, type BrowserKind } from "@/lib/install";

type Guide = { label: string; steps: string[]; note?: string };

const GUIDES: Record<BrowserKind, Guide> = {
  "chrome-android": {
    label: "Chrome on Android",
    steps: [
      "Tap the \u22ee menu in the top-right of Chrome.",
      "Choose \u201cAdd to Home screen\u201d (or \u201cInstall app\u201d).",
      "Confirm with \u201cInstall\u201d.",
      "The Ticklelist icon appears on your home screen.",
    ],
  },
  "chrome-desktop": {
    label: "Chrome on desktop",
    steps: [
      "Look for the install icon (a screen with a down arrow) at the right of the address bar.",
      "If it is missing, open the \u22ee menu \u2192 \u201cCast, save and share\u201d \u2192 \u201cInstall page as app\u201d.",
      "Click \u201cInstall\u201d in the dialog.",
    ],
    note: "Chrome hides the install option until the page has been loaded once over HTTPS \u2014 reload if you don't see it.",
  },
  "edge-desktop": {
    label: "Microsoft Edge",
    steps: [
      "Open the \u2026 menu in the top-right.",
      "Choose \u201cApps\u201d \u2192 \u201cInstall this site as an app\u201d.",
      "Click \u201cInstall\u201d.",
    ],
  },
  "safari-ios": {
    label: "Safari on iPhone / iPad",
    steps: [
      "Tap the Share button (square with an up arrow) in the toolbar.",
      "Scroll down and tap \u201cAdd to Home Screen\u201d.",
      "Tap \u201cAdd\u201d in the top-right.",
    ],
    note: "Safari is the only iOS browser that can install apps \u2014 Chrome or Firefox on iPhone will not offer it.",
  },
  "safari-desktop": {
    label: "Safari on Mac",
    steps: [
      "Open the File menu in the menu bar.",
      "Choose \u201cAdd to Dock\u2026\u201d.",
      "Confirm the name and click \u201cAdd\u201d.",
    ],
    note: "Requires macOS Sonoma (Safari 17) or newer.",
  },
  firefox: {
    label: "Firefox",
    steps: [
      "On Android: tap the \u22ee menu \u2192 \u201cInstall\u201d or \u201cAdd to Home screen\u201d.",
      "On desktop: Firefox cannot install web apps \u2014 use Chrome, Edge or Safari instead.",
    ],
  },
  samsung: {
    label: "Samsung Internet",
    steps: [
      "Tap the \u2261 menu at the bottom-right.",
      "Choose \u201cAdd page to\u201d \u2192 \u201cHome screen\u201d.",
      "Confirm with \u201cAdd\u201d.",
    ],
  },
  other: {
    label: "Your browser",
    steps: [
      "Open your browser's main menu.",
      "Look for \u201cInstall app\u201d, \u201cAdd to Home screen\u201d or \u201cAdd to Dock\u201d.",
      "Confirm to finish.",
    ],
    note: "If none of these appear, open onsightmartin.com in Chrome (Android/desktop) or Safari (iPhone).",
  },
};

const ORDER: BrowserKind[] = [
  "chrome-android",
  "chrome-desktop",
  "safari-ios",
  "safari-desktop",
  "edge-desktop",
  "samsung",
  "firefox",
  "other",
];

/** Manual step-by-step install instructions, used when no automatic prompt fires. */
const InstallGuide = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [selected, setSelected] = useState<BrowserKind>("other");

  useEffect(() => {
    if (open) setSelected(detectBrowser());
  }, [open]);

  const guide = GUIDES[selected];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Install Ticklelist</DialogTitle>
          <DialogDescription>
            No install button? Follow the steps for your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {ORDER.map((kind) => (
            <button
              key={kind}
              onClick={() => setSelected(kind)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                selected === kind
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {GUIDES[kind].label}
            </button>
          ))}
        </div>

        <ol className="mt-2 space-y-2">
          {guide.steps.map((step, index) => (
            <li key={step} className="flex gap-2.5 text-sm text-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {guide.note && <p className="text-xs text-muted-foreground">{guide.note}</p>}
      </DialogContent>
    </Dialog>
  );
};

export default InstallGuide;
