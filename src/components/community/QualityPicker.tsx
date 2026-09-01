import { useEffect, useRef, useState } from "react";
import { Check, Gauge, Loader2 } from "lucide-react";
import {
  DEFAULT_QUALITY,
  detectQuality,
  getAutoTier,
  getStoredQuality,
  setAutoTier,
  AUTO_TIER_EVENT,
  QUALITY_OPTIONS,
  setQuality,
  type QualityPref,
} from "@/lib/quality";
import { runQualityBenchmark, type BenchmarkResult } from "@/lib/benchmark";
import { Button } from "@/components/ui/button";

const TIER_NAME: Record<string, string> = {
  high: "High detail",
  balanced: "Balanced",
  low: "Performance",
};

const QualityPicker = () => {
  const [active, setActive] = useState<QualityPref>(DEFAULT_QUALITY);
  const [detected, setDetected] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    setActive(getStoredQuality());
    setDetected(detectQuality());
    setTier(getAutoTier());
    const onTier = () => setTier(getAutoTier());
    window.addEventListener(AUTO_TIER_EVENT, onTier);
    return () => {
      alive.current = false;
      window.removeEventListener(AUTO_TIER_EVENT, onTier);
    };
  }, []);

  const choose = (id: QualityPref) => {
    setQuality(id);
    setActive(id);
  };

  /** Measure this device, then switch straight to the tier it can handle. */
  const runTest = async () => {
    if (running) return;
    setRunning(true);
    setProgress(0);
    setResult(null);
    const outcome = await runQualityBenchmark((p) => {
      if (alive.current) setProgress(p);
    });
    if (!alive.current) return;
    setResult(outcome);
    // Keep "auto" adaptive but seed it with the measured tier; otherwise pin it.
    if (getStoredQuality() === "auto") setAutoTier(outcome.tier);
    else choose(outcome.tier);
    setTier(getAutoTier());
    setRunning(false);
  };


  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Graphics quality" className="grid gap-3 sm:grid-cols-2">
        {QUALITY_OPTIONS.map((option) => {
          const selected = option.id === active;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(option.id)}
              className={`text-left rounded-lg border p-4 transition-colors ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-display tracking-wider text-sm uppercase">{option.name}</span>
                {selected && <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{option.description}</p>
              {option.id === "auto" && detected && (
                <p className="text-[11px] text-primary/80 mt-2 uppercase tracking-wider">
                  This device: {detected}
                  {tier && tier !== detected ? ` · now running: ${tier}` : ""}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* One-tap benchmark: measures this device, then applies the best tier. */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm uppercase tracking-wider">Test performance</p>
            <p className="text-xs text-muted-foreground mt-1">
              Runs a ~1.5 second graphics benchmark and applies the settings your device handles
              smoothly.
            </p>
          </div>
          <Button type="button" onClick={runTest} disabled={running} className="shrink-0">
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Testing…
              </>
            ) : (
              <>
                <Gauge className="h-4 w-4" aria-hidden="true" />
                Test performance
              </>
            )}
          </Button>
        </div>

        {running && (
          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Benchmark progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}

        <p className="mt-3 text-xs text-primary/90" aria-live="polite">
          {result
            ? result.fallback
              ? "3D isn't available on this device — switched to Performance."
              : `Measured ${result.fps} fps · applied ${TIER_NAME[result.tier] ?? result.tier}.`
            : ""}
        </p>
      </div>
    </div>
  );

};

export default QualityPicker;
