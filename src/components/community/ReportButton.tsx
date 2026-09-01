import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_REASONS, useReporting, type ReportTarget } from "@/hooks/useReports";
import { cn } from "@/lib/utils";

interface Props {
  targetType: ReportTarget;
  targetId: string;
  className?: string;
  size?: "sm" | "xs";
}

/** Lets a member flag a post or comment for moderator review. */
const ReportButton = ({ targetType, targetId, className, size = "sm" }: Props) => {
  const { report, canReport } = useReporting();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0].value);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  if (!canReport) return null;

  const submit = async () => {
    setBusy(true);
    const ok = await report(targetType, targetId, reason, details);
    setBusy(false);
    if (ok) {
      setOpen(false);
      setDetails("");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Report this ${targetType}`}
        title={`Report this ${targetType}`}
        className={cn("text-muted-foreground hover:text-destructive", className)}
      >
        <Flag className={size === "xs" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Report this {targetType}</DialogTitle>
            <DialogDescription>
              Tell us what is wrong. Moderators review every report and can remove content.
            </DialogDescription>
          </DialogHeader>

          <fieldset className="space-y-2">
            <legend className="sr-only">Reason</legend>
            {REPORT_REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="report-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="accent-[hsl(var(--primary))]"
                />
                {r.label}
              </label>
            ))}
          </fieldset>

          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Extra details (optional)"
            aria-label="Report details"
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={submit} disabled={busy}>
              {busy ? "Sending…" : "Send report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportButton;
