import { useEffect, useState } from "react";
import { Bug, LifeBuoy, Send } from "lucide-react";

import Seo from "@/components/Seo";
import CommunityLayout from "@/components/community/CommunityLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Category = "bug" | "idea" | "question" | "other";

interface BugReport {
  id: string;
  reporter_id: string | null;
  contact_email: string | null;
  page_path: string | null;
  category: string;
  subject: string;
  details: string;
  status: string;
  created_at: string;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "idea", label: "Idea" },
  { value: "question", label: "Question" },
  { value: "other", label: "Other" },
];

const STATUSES = ["open", "in_progress", "resolved", "closed"];

const when = (iso: string) => new Date(iso).toLocaleString();

/** Help & support: file a bug report that lands in the admin inbox. */
const HelpPage = () => {
  const { user, isAdmin } = useAuth();
  const [category, setCategory] = useState<Category>("bug");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [reports, setReports] = useState<BugReport[]>([]);

  const loadReports = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bug_reports")
      .select("id, reporter_id, contact_email, page_path, category, subject, details, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setReports((data as BugReport[]) ?? []);
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const submit = async () => {
    if (!subject.trim() || !details.trim()) {
      toast({ title: "Almost there", description: "Add a short title and a description." });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("bug_reports").insert({
      reporter_id: user?.id ?? null,
      contact_email: email.trim() || null,
      page_path: typeof window !== "undefined" ? window.location.pathname : null,
      category,
      subject: subject.trim().slice(0, 140),
      details: details.trim().slice(0, 4000),
    });
    setSending(false);
    if (error) {
      toast({ title: "Could not send", description: error.message, variant: "destructive" });
      return;
    }
    setSubject("");
    setDetails("");
    toast({ title: "Thanks!", description: "Your report landed in the admin inbox." });
    loadReports();
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bug_reports").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
      return;
    }
    setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <CommunityLayout>
      <Seo
        title="Help & bug reports — Ticklelist"
        description="Found something broken on Ticklelist? Report a bug or send an idea straight to the team."
        path="/community/help"
      />

      <div className="flex items-center gap-2 mb-2">
        <LifeBuoy className="w-5 h-5 text-primary" />
        <h1 className="font-display text-2xl tracking-wider">Help & bug reports</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Something not working, a wrong elevation, or an idea for the app? Send it here — it goes straight to the admin
        inbox in the community.
      </p>

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div>
          <Label className="mb-2 block">Type</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Button
                key={c.value}
                size="sm"
                variant={category === c.value ? "default" : "secondary"}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="subject">Title</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={140}
            placeholder="Heights show in feet instead of metres"
          />
        </div>

        <div>
          <Label htmlFor="details">What happened?</Label>
          <Textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={6}
            maxLength={4000}
            placeholder="Where you were, what you did, what you expected and what happened instead."
          />
        </div>

        {!user && (
          <div>
            <Label htmlFor="email">Your email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={120}
              placeholder="so we can reply"
            />
          </div>
        )}

        <Button onClick={submit} disabled={sending}>
          <Send className="w-4 h-4 mr-1" /> {sending ? "Sending…" : "Send report"}
        </Button>
      </div>

      {user && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Bug className="w-4 h-4 text-primary" />
            <h2 className="font-display tracking-wider text-lg">{isAdmin ? "Report inbox" : "Your reports"}</h2>
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing here yet.</p>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="text-primary">{r.category}</span>
                    <span>· {r.status.replace("_", " ")}</span>
                    <span>· {when(r.created_at)}</span>
                    {r.page_path && <span>· {r.page_path}</span>}
                  </div>
                  <p className="font-display tracking-wide mt-1">{r.subject}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{r.details}</p>
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {STATUSES.map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={r.status === s ? "default" : "secondary"}
                          onClick={() => setStatus(r.id, s)}
                        >
                          {s.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </CommunityLayout>
  );
};

export default HelpPage;
