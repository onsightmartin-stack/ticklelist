import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { celebrate } from "@/components/Celebration";
import ClimbPartners from "@/components/community/ClimbPartners";
import PeakSelector from "@/components/community/PeakSelector";
import type { TimingType } from "@/lib/community";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const YEARS = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + i);

interface AdventureFormProps {
  userId: string;
  onCreated: () => void;
  onCancel: () => void;
}

const AdventureForm = ({ userId, onCreated, onCancel }: AdventureFormProps) => {
  const [peakName, setPeakName] = useState("");
  const [country, setCountry] = useState("");
  const [elevation, setElevation] = useState("");
  const [timingType, setTimingType] = useState<TimingType>("anytime");
  const [targetDate, setTargetDate] = useState("");
  const [targetMonth, setTargetMonth] = useState<string>("");
  const [targetYear, setTargetYear] = useState<string>(String(new Date().getFullYear()));
  const [difficulty, setDifficulty] = useState("");
  const [maxGroupSize, setMaxGroupSize] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [notes, setNotes] = useState("");
  const [inviteIds, setInviteIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peakName.trim()) {
      toast({ title: "Peak name is required", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data: created, error } = await supabase.from("adventures").insert({
      creator_id: userId,
      peak_name: peakName.trim().slice(0, 120),
      country: country.trim().slice(0, 80) || null,
      elevation: elevation.trim().slice(0, 40) || null,
      timing_type: timingType,
      target_date: timingType === "exact" && targetDate ? targetDate : null,
      target_month: timingType === "month" && targetMonth ? Number(targetMonth) : null,
      target_year: timingType === "month" || timingType === "year" ? Number(targetYear) : null,
      difficulty: difficulty || null,
      max_group_size: maxGroupSize ? Number(maxGroupSize) : null,
      meeting_point: meetingPoint.trim().slice(0, 200) || null,
      notes: notes.trim().slice(0, 1500) || null,
    }).select("id").single();

    let inviteError: string | null = null;
    if (!error && created && inviteIds.length > 0) {
      const { error: sErr } = await supabase.from("adventure_signups").insert(
        inviteIds.map((id) => ({ adventure_id: created.id, user_id: id, status: "invited" })),
      );
      if (sErr) inviteError = sErr.message;
    }

    setBusy(false);
    if (error) {
      toast({ title: "Could not post adventure", description: error.message, variant: "destructive" });
      return;
    }
    celebrate();
    toast({
      title: "Adventure posted",
      description: inviteError
        ? `Posted, but the invites failed: ${inviteError}`
        : inviteIds.length > 0
          ? `${inviteIds.length} member${inviteIds.length > 1 ? "s" : ""} invited — others can still sign up.`
          : "Other climbers can now sign up.",
      ...(inviteError ? { variant: "destructive" as const } : {}),
    });
    onCreated();
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h3 className="font-display tracking-wider text-lg">New adventure</h3>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="peak">Peak or place *</Label>
          <PeakSelector
            id="peak"
            value={peakName}
            onChange={setPeakName}
            nameOnly
            placeholder="Search any peak or place…"
            onPick={(p) => {
              if (p.country) setCountry(p.country);
              if (p.elevation && p.elevation !== "—") setElevation(p.elevation);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="elev">Elevation</Label>
          <Input id="elev" value={elevation} onChange={(e) => setElevation(e.target.value)} maxLength={40} placeholder="4,808 m" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} maxLength={80} placeholder="France" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger id="difficulty"><SelectValue placeholder="Not specified" /></SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="Hike">Hike</SelectItem>
              <SelectItem value="Scramble">Scramble</SelectItem>
              <SelectItem value="Alpine">Alpine</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Expedition">Expedition</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>When</Label>
        <Select value={timingType} onValueChange={(v) => setTimingType(v as TimingType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="asap">ASAP</SelectItem>
            <SelectItem value="anytime">Any time</SelectItem>
            <SelectItem value="year">A specific year</SelectItem>
            <SelectItem value="month">A specific month</SelectItem>
            <SelectItem value="exact">An exact day</SelectItem>
          </SelectContent>
        </Select>

        {timingType === "exact" && (
          <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} aria-label="Exact date" />
        )}
        {(timingType === "month" || timingType === "year") && (
          <div className="grid grid-cols-2 gap-4">
            {timingType === "month" && (
              <Select value={targetMonth} onValueChange={setTargetMonth}>
                <SelectTrigger aria-label="Month"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={targetYear} onValueChange={setTargetYear}>
              <SelectTrigger aria-label="Year"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent className="bg-popover">
                {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="group">Max group size</Label>
          <Input id="group" type="number" min={1} max={100} value={maxGroupSize} onChange={(e) => setMaxGroupSize(e.target.value)} placeholder="Open" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meet">Meeting point</Label>
          <Input id="meet" value={meetingPoint} onChange={(e) => setMeetingPoint(e.target.value)} maxLength={200} placeholder="Chamonix town centre" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1500} rows={3} placeholder="Route plan, gear expectations, experience level..." />
      </div>

      <ClimbPartners
        userId={userId}
        partnerIds={inviteIds}
        partnerNames={[]}
        withGroup={false}
        hideNames
        hideGroup
        label="Invite members (optional)"
        searchPlaceholder="Search members to invite…"
        onChange={(next) => setInviteIds(next.partnerIds)}
        peakName={peakName || undefined}
      />

      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>Post adventure</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

export default AdventureForm;
