import { useEffect, useMemo, useState } from "react";
import { useListDensity } from "@/hooks/useListDensity";
import DensityToggle from "@/components/community/DensityToggle";
import { cn } from "@/lib/utils";
import { BarChart3, Check, ChevronDown, Circle, ListChecks, MapPin, Mountain, Pencil, Plus, Trash2, Trophy } from "lucide-react";

import Seo from "@/components/Seo";
import { Link } from "@/lib/router-compat";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import VisitForm from "@/components/community/VisitForm";
import AscentAnalytics from "@/components/community/AscentAnalytics";
import SortSelect from "@/components/community/SortSelect";
import { isUnCountry } from "@/lib/profile-goals";
import { ascentSortOptions, listSortOptions, sortAscents, sortListProgress, sortVisits, visitSortOptions } from "@/lib/sorting";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";
import { useVisits } from "@/hooks/useVisits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { countries } from "@/data/countries";
import { adventureChallenges } from "@/data/adventure-challenges";
import { peakLists } from "@/data/peak-lists";
import { frontRunnersHref, listBoardId, challengeBoardId } from "@/lib/frontrunners";
import { findPlace } from "@/data/places";
import { findPeak, formatAscentDate } from "@/lib/peak-catalog";
import { computeXp, formatXp, LIST_COMPLETION_BONUS, xpForAscent } from "@/lib/xp";
import { computeExplorerXp } from "@/lib/explorer-xp";
import { useNavigate } from "@/lib/router-compat";
import type { Visit } from "@/data/places";
import type { Ascent } from "@/lib/peak-catalog";

type Tab = "ascents" | "places" | "lists" | "challenges";

const tabs: { id: Tab; label: string; icon: typeof Mountain }[] = [
  { id: "ascents", label: "Mountain ascents", icon: Mountain },
  { id: "places", label: "Places visited", icon: MapPin },
  { id: "lists", label: "My list of lists", icon: ListChecks },
  { id: "challenges", label: "Challenges", icon: Trophy },
];


const continentOf = (country: string | null) =>
  country ? countries.find((c) => c.country === country)?.continent ?? null : null;

const MyAdventuresPage = () => {
  const { user } = useAuth();
  const { ascents, reload: reloadAscents } = useCommunityData();
  const navigate = useNavigate();
  const { visits, reload } = useVisits();
  const [tab, setTab] = useState<Tab>("ascents");
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [initialPlaceKey, setInitialPlaceKey] = useState("");
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "places" || t === "challenges" || t === "ascents" || t === "lists") setTab(t);
    if (params.get("new") === "1") setShowVisitForm(true);
    const place = params.get("place");
    if (place) {
      setInitialPlaceKey(place);
      setShowVisitForm(true);
      setTab("places");
    }
  }, []);

  const [ascentSort, setAscentSort] = useState("date_desc");
  const [visitSort, setVisitSort] = useState("date_desc");
  const [visitType, setVisitType] = useState<"all" | "country" | "sightseeing">("all");
  const [listSort, setListSort] = useState("pct_desc");
  const [openList, setOpenList] = useState<string | null>(null);
  const [openChallenge, setOpenChallenge] = useState<string | null>(null);
  const [openStat, setOpenStat] = useState<string | null>(null);

  const myAscents = useMemo(
    () => (user ? sortAscents(ascents.filter((a) => a.user_id === user.id), ascentSort) : []),
    [ascents, user, ascentSort],
  );
  const myVisits = useMemo(
    () =>
      user
        ? sortVisits(
            visits.filter(
              (v) =>
                v.user_id === user.id &&
                (visitType === "all" ||
                  (visitType === "country" ? v.place_type === "country" : v.place_type !== "country")),
            ),
            visitSort,
          )
        : [],
    [visits, user, visitSort, visitType],
  );
  const [ascentDensity, setAscentDensity] = useListDensity("my-ascents", myAscents.length);
  const [visitDensity, setVisitDensity] = useListDensity("my-visits", myVisits.length);



  const peakKeys = useMemo(() => {
    const s = new Set<string>();
    myAscents.forEach((a) =>
      s.add(a.peak_type === "country_highpoint" ? `hp:${a.country ?? a.peak_name}` : `fp:${a.peak_name}`),
    );
    return s;
  }, [myAscents]);

  const placeKeys = useMemo(() => new Set(myVisits.map((v) => v.place_key)), [myVisits]);

  const ascentStats = useMemo(() => {
    const highpoints = new Set<string>();
    const uniquePeaks = new Set<string>();
    const ascentCountries = new Set<string>();
    myAscents.forEach((a) => {
      uniquePeaks.add(a.peak_name.trim().toLowerCase());
      if (a.country) ascentCountries.add(a.country);
      if (a.peak_type === "country_highpoint" && isUnCountry(a.country ?? a.peak_name))
        highpoints.add(a.country ?? a.peak_name);
    });
    return {
      total: myAscents.length,
      highpoints: highpoints.size,
      uniquePeaks: uniquePeaks.size,
      countries: ascentCountries.size,
    };
  }, [myAscents]);

  const statDetails = useMemo(() => {
    const unHighpoints = myAscents
      .filter((a) => a.peak_type === "country_highpoint" && isUnCountry(a.country ?? a.peak_name))
      .map((a) => ({ country: a.country ?? a.peak_name, peak: a.peak_name }));
    const seen = new Map<string, { peak: string; country: string | null }>();
    myAscents.forEach((a) => {
      const key = a.peak_name.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, { peak: a.peak_name, country: a.country });
    });
    const uniquePeaks = [...seen.values()];
    const countriesMap = new Map<string, number>();
    myAscents.forEach((a) => {
      if (!a.country) return;
      countriesMap.set(a.country, (countriesMap.get(a.country) ?? 0) + 1);
    });
    const countries = [...countriesMap.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
    return { unHighpoints, uniquePeaks, countries };
  }, [myAscents]);

  const listProgress = useMemo(
    () =>
      peakLists
        .map((list) => {
          const done = list.entries.filter(
            (e) => peakKeys.has(e.key) || (e.alt ?? []).some((k) => peakKeys.has(k)),
          ).length;
          const total = list.entries.length;
          return { list, done, total, pct: total ? Math.round((done / total) * 100) : 0 };
        })
        .map((x) => x),
    [peakKeys],
  );

  const sortedLists = useMemo(() => sortListProgress(listProgress, listSort), [listProgress, listSort]);

  const completedLists = listProgress.filter((l) => l.total > 0 && l.done === l.total).length;

  const visitedContinents = useMemo(() => {
    const s = new Set<string>();
    myVisits.forEach((v) => {
      const c = continentOf(v.country);
      if (c) s.add(c);
      if (v.place_type === "pole" && v.place_name !== "North Pole") s.add("Antarctica");
    });
    myAscents.forEach((a) => {
      const c = continentOf(a.country);
      if (c) s.add(c);
    });
    return s;
  }, [myVisits, myAscents]);

  const removeVisit = async (id: string) => {
    const { error } = await supabase.from("visits").delete().eq("id", id);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Removed from your travel log" });
    reload();
  };

  const xpSummary = computeXp(myAscents);
  const explorerSummary = computeExplorerXp(user ? visits.filter((v) => v.user_id === user.id) : []);

  const removeAscent = async (a: Ascent) => {
    const lost = xpForAscent(a).xp;
    const ok = window.confirm(
      `Delete "${a.peak_name}"? You'll lose about ${formatXp(lost)} XP, and any list bonus it unlocked.`,
    );
    if (!ok) return;
    const { error } = await supabase.from("ascents").delete().eq("id", a.id);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ascent removed", description: `−${formatXp(lost)} XP` });
    reloadAscents();
  };

  if (!user) {
    return (
      <CommunityLayout>
        <Seo title="My Adventures — Ticklelist" description="Your ascents, the places you've been and your challenge progress in one place." noindex />
        <MembersOnly
          title="My adventures is members only"
          description="Sign in to see your ascents, the places you've been and your challenge progress."
        />
      </CommunityLayout>
    );
  }

  const allMyVisits = visits.filter((v) => v.user_id === user.id);
  const visitedCountries = allMyVisits.filter((v) => v.place_type === "country");

  return (
    <CommunityLayout>
      <Seo title="My Adventures — Ticklelist" description="Your ascents, the places you've been and your challenge progress in one place." noindex />

      <h1 className="font-display text-2xl tracking-wider mb-1">My adventures</h1>
      <p className="text-sm text-muted-foreground mb-5">
        Everything you've ticked — mountains, places and challenges.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => setTab(t.id)}
          >
            <t.icon className="w-4 h-4 mr-1" /> {t.label}
          </Button>
        ))}
      </div>

      {tab === "ascents" && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { id: "total", label: "Total ascents", value: ascentStats.total },
              { id: "unhp", label: "UN country high points", value: ascentStats.highpoints },
              { id: "unique", label: "Unique peaks", value: ascentStats.uniquePeaks },
              { id: "countries", label: "Countries climbed in", value: ascentStats.countries },
            ] as const).map((s) => {
              const active = openStat === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setOpenStat(active ? null : s.id)}
                  aria-expanded={active}
                  className={cn(
                    "rounded-lg border bg-card p-3 text-left transition-colors",
                    active ? "border-primary" : "border-border hover:border-primary/60",
                  )}
                >
                  <p className="font-display text-2xl tracking-wider text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="truncate">{s.label}</span>
                    <ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform", active && "rotate-180")} />
                  </p>
                </button>
              );
            })}
          </div>

          {openStat && (
            <div className="rounded-lg border border-border bg-card p-4">
              <ul className="max-h-72 overflow-y-auto grid sm:grid-cols-2 gap-x-4 gap-y-1 pr-1">
                {openStat === "total" &&
                  myAscents.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{a.peak_name}</span>
                      {a.country && <span className="text-muted-foreground text-xs shrink-0">{a.country}</span>}
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">{formatAscentDate(a.ascent_date, a.date_precision ?? "day")}</span>
                    </li>
                  ))}
                {openStat === "unhp" &&
                  statDetails.unHighpoints.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{h.country}</span>
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">{h.peak}</span>
                    </li>
                  ))}
                {openStat === "unique" &&
                  statDetails.uniquePeaks.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{p.peak}</span>
                      {p.country && <span className="ml-auto text-xs text-muted-foreground shrink-0">{p.country}</span>}
                    </li>
                  ))}
                {openStat === "countries" &&
                  statDetails.countries.map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{c.country}</span>
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">{c.count} {c.count === 1 ? "ascent" : "ascents"}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {myAscents.length} logged ascents · Climber {xpSummary.level.level} {xpSummary.level.title} ({formatXp(xpSummary.total)} XP) · Explorer {explorerSummary.level.level} {explorerSummary.level.title} ({formatXp(explorerSummary.total)} XP)
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowAnalytics((v) => !v)}>
                <BarChart3 className="w-4 h-4 mr-1" /> My analytics
              </Button>
              <Button asChild size="sm">
                <Link to="/community/ascents?new=1"><Plus className="w-4 h-4 mr-1" /> Log an ascent</Link>
              </Button>
            </div>
          </div>
          {showAnalytics && (
            <AscentAnalytics ascents={myAscents} onClose={() => setShowAnalytics(false)} />
          )}
          {myAscents.length > 1 && (
            <div className="flex justify-end items-center gap-2">
              <SortSelect value={ascentSort} onChange={setAscentSort} options={ascentSortOptions} label="Sort ascents" />
              {myAscents.length > 3 && <DensityToggle value={ascentDensity} onChange={setAscentDensity} />}
            </div>
          )}
          {myAscents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ascents yet — search a peak above to log your first.</p>
          ) : (
            <ul className={cn("grid sm:grid-cols-2", ascentDensity === "small" ? "gap-1.5" : "gap-3")}>
              {myAscents.map((a) => (
                <li key={a.id} className={cn("rounded-lg border border-border bg-card grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-hidden", ascentDensity === "small" ? "px-2 py-1" : ascentDensity === "medium" ? "p-2.5" : "p-3")}>
                  <div className="min-w-0">
                    <p className={cn("font-display tracking-wider truncate flex items-center gap-1.5", ascentDensity === "small" ? "text-[13px] leading-tight" : "text-sm")}>
                      <span className="truncate">{a.peak_name}</span>
                      {ascentDensity === "small" && (a.country || a.elevation) && (
                        <span className="text-muted-foreground font-normal text-[11px] shrink-0">
                          {a.country}{a.country && a.elevation ? " · " : ""}{a.elevation && `${a.elevation}m`}
                        </span>
                      )}
                    </p>
                    <p className={cn("text-muted-foreground truncate", ascentDensity === "small" ? "text-[10px] leading-tight" : "text-xs")}>
                      {ascentDensity === "small"
                        ? formatAscentDate(a.ascent_date, a.date_precision ?? "day")
                        : [a.country, a.elevation, formatAscentDate(a.ascent_date, a.date_precision ?? "day")].filter(Boolean).join(" · ")}
                    </p>
                    {ascentDensity === "large" && <p className="text-xs text-primary mt-1">+{formatXp(xpForAscent(a).xp)} XP</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => navigate(`/community/ascents?edit=${a.id}`)}
                      aria-label={`Edit ${a.peak_name}`}
                      className="text-muted-foreground hover:text-primary p-1"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeAscent(a)}
                      aria-label={`Delete ${a.peak_name}`}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "lists" && (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Every tick list at a glance — {completedLists} completed of {listProgress.length}
            {completedLists > 0 && (
              <span className="text-primary"> · +{formatXp(completedLists * LIST_COMPLETION_BONUS)} XP bonus</span>
            )}
            . Each completed list is worth {formatXp(LIST_COMPLETION_BONUS)} XP. Open a list for maps and details.
          </p>
          <div className="flex justify-end">
            <SortSelect value={listSort} onChange={setListSort} options={listSortOptions} label="Sort lists" />
          </div>
          <ul className="space-y-2">
            {sortedLists.map(({ list, done, total, pct }) => {
              const isOpen = openList === list.id;
              return (
                <li key={list.id} className="rounded-lg border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setOpenList(isOpen ? null : list.id)}
                    className="w-full text-left p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        <div className="min-w-0">
                          <p className="font-display tracking-wider truncate">{list.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{list.category} · {list.blurb}</p>
                        </div>
                      </div>
                      <span className="text-sm font-display shrink-0">
                        {done}/{total} <span className="text-muted-foreground">({pct}%)</span>
                      </span>
                    </div>
                    <Progress value={pct} className="mt-2 h-2" />
                  </button>
                  <div className="px-3 pb-2 -mt-1">
                    <Link
                      to={frontRunnersHref(listBoardId(list.id))}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Trophy className="w-3 h-3" /> Front runners
                    </Link>
                  </div>
                  {isOpen && (
                    <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 px-3 pb-3 pt-1">
                      {list.entries.map((e) => {
                        const peak = findPeak(e.key);
                        const ticked = peakKeys.has(e.key) || (e.alt ?? []).some((k) => peakKeys.has(k));
                        return (
                          <li key={e.key} className="flex items-center gap-2 text-sm py-0.5">
                            {ticked ? (
                              <Check className="w-4 h-4 text-primary shrink-0" />
                            ) : (
                              <Circle className="w-3 h-3 text-muted-foreground shrink-0" />
                            )}
                            <span className={ticked ? "" : "text-muted-foreground"}>
                              {peak
                                ? peak.type === "country_highpoint"
                                  ? `${peak.country} — ${peak.name}`
                                  : peak.name
                                : e.key.slice(3)}
                            </span>
                            {peak?.elevation && (
                              <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                                {peak.elevation}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}


      {tab === "places" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {visitedCountries.length} countries · {allMyVisits.length - visitedCountries.length} sightseeing places
            </p>
            <Button size="sm" onClick={() => setShowVisitForm((v) => !v)}>
              <Plus className="w-4 h-4 mr-1" /> Add a place
            </Button>
          </div>

          {(showVisitForm || editingVisit) && (
            <VisitForm
              key={editingVisit?.id ?? initialPlaceKey ?? "new"}
              userId={user.id}
              initialPlaceKey={initialPlaceKey}
              editing={editingVisit ?? undefined}
              onSaved={() => { setInitialPlaceKey(""); setShowVisitForm(false); setEditingVisit(null); reload(); }}
              onCancel={() => { setInitialPlaceKey(""); setShowVisitForm(false); setEditingVisit(null); }}
            />
          )}

          <div className="flex flex-wrap gap-1.5">
            {([
              { id: "all", label: "All" },
              { id: "country", label: "Countries" },
              { id: "sightseeing", label: "Sightseeing" },
            ] as const).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setVisitType(o.id)}
                className={cn(
                  "px-2.5 py-1 rounded-full border text-xs font-display tracking-wider transition-colors",
                  visitType === o.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {myVisits.length > 1 && (
            <div className="flex justify-end items-center gap-2">
              <SortSelect value={visitSort} onChange={setVisitSort} options={visitSortOptions} label="Sort places" />
              {myVisits.length > 3 && <DensityToggle value={visitDensity} onChange={setVisitDensity} />}
            </div>
          )}
          {myVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {visitType === "all"
                ? "Nothing ticked yet — add the first place you've been."
                : `No ${visitType === "country" ? "countries" : "sightseeing places"} ticked yet.`}
            </p>
          ) : (
            <ul className={cn("grid sm:grid-cols-2", visitDensity === "small" ? "gap-1.5" : "gap-3")}>
              {myVisits.map((v) => (
                <li key={v.id} className={cn("rounded-lg border border-border bg-card grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-hidden", visitDensity === "small" ? "px-2 py-1" : visitDensity === "medium" ? "p-2.5" : "p-3")}>
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin className={cn("text-primary shrink-0", visitDensity === "small" ? "w-3 h-3" : "w-4 h-4")} />
                    <div className="min-w-0">
                      <p className={cn("font-display tracking-wider truncate flex items-center gap-1.5", visitDensity === "small" ? "text-[13px] leading-tight" : "text-sm")}>
                        <span className="truncate">{v.place_name}</span>
                        {visitDensity === "small" && v.country && (
                          <span className="text-muted-foreground font-normal text-[11px] shrink-0">{v.country}</span>
                        )}
                      </p>
                      <p className={cn("text-muted-foreground truncate", visitDensity === "small" ? "text-[10px] leading-tight" : "text-xs")}>
                        {visitDensity === "small"
                          ? (v.visit_date ? formatAscentDate(v.visit_date, v.date_precision ?? "day") : "Visited")
                          : ([v.country, v.visit_date ? formatAscentDate(v.visit_date, v.date_precision ?? "day") : null].filter(Boolean).join(" · ") || "Visited")}
                      </p>
                      {v.notes && visitDensity === "large" && <p className="text-xs mt-1 text-muted-foreground">{v.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingVisit(v); setShowVisitForm(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    aria-label={`Edit ${v.place_name}`}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Remove ${v.place_name} from your travel log?`)) removeVisit(v.id); }}
                    aria-label={`Remove ${v.place_name}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "challenges" && (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Mixed challenges counting both summits and places. Tap a challenge to see details. Pure climbing lists live on the Lists tab.
          </p>

          {adventureChallenges.map((ch) => {
            const items =
              ch.id === "seven-continents"
                ? ["Europe", "Asia", "Africa", "North America", "South America", "Oceania", "Antarctica"].map((c) => ({
                    label: c,
                    done: visitedContinents.has(c),
                  }))
                : [
                    ...(ch.peaks ?? []).map((p) => ({
                      label: findPeak(p.key)?.name ?? p.key.replace(/^\w+:/, ""),
                      done: peakKeys.has(p.key) || (p.alt ?? []).some((k) => peakKeys.has(k)),
                    })),
                    ...(ch.places ?? []).map((k) => ({
                      label: findPlace(k)?.name ?? k.replace(/^\w+:/, ""),
                      done: placeKeys.has(k),
                    })),
                  ];
            const done = items.filter((i) => i.done).length;
            const pct = items.length ? Math.round((done / items.length) * 100) : 0;
            const isOpen = openChallenge === ch.id;

            return (
              <div key={ch.id} className="rounded-lg border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setOpenChallenge(isOpen ? null : ch.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-1.5">
                      <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      <div className="min-w-0">
                        <h2 className="font-display tracking-wider">{ch.name}</h2>
                        <p className="text-xs text-muted-foreground truncate">{ch.blurb}</p>
                      </div>
                    </div>
                    <span className="text-sm font-display shrink-0">{done}/{items.length}</span>
                  </div>
                  <Progress value={pct} className="mt-3 h-2" />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <ul className="grid sm:grid-cols-2 gap-1">
                      {items.map((i) => (
                        <li key={i.label} className="flex items-center gap-2 text-sm">
                          {i.done ? (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className={i.done ? "" : "text-muted-foreground"}>{i.label}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center gap-4">
                      <Link
                        to={frontRunnersHref(challengeBoardId(ch.id))}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Trophy className="w-3 h-3" /> Front runners
                      </Link>
                      <Link
                        to={`/community/challenge-map/${ch.id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <MapPin className="w-3 h-3" /> See map
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </CommunityLayout>
  );
};

export default MyAdventuresPage;
