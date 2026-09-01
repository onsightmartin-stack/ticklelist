import { fuzzyRank } from "@/lib/fuzzy";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Seo from "@/components/Seo";
import { Link } from "@/lib/router-compat";
import {
  Search,
  Mountain,
  Maximize,
  Minimize,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Hammer,
  Backpack,
  ScrollText,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import MemberAvatar from "@/components/community/MemberAvatar";
import AvatarTurntable from "@/components/community/AvatarTurntable";
import BaseCampScene from "@/components/community/BaseCampScene";
import CampBuild from "@/components/community/CampBuild";
import CampBuildMenu from "@/components/community/CampBuildMenu";
import CampInventory from "@/components/community/CampInventory";
import PanZoom from "@/components/community/PanZoom";
import { useMotionAllowed } from "@/hooks/useMotionAllowed";
import BaseCampHint from "@/components/community/BaseCampHint";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";
import { useCampBuilds } from "@/hooks/useCampBuilds";
import { rankFor } from "@/lib/badges";
import { computeXp } from "@/lib/xp";
import { buildInventory } from "@/lib/camp-inventory";
import { CampAudio } from "@/lib/camp-audio";
import {
  buildUnlocked,
  campBuilds,
  defaultLabel,
  CAMP_GROUND,
  type CampBuildKind,
} from "@/lib/camp-builds";
import { groundPosition } from "@/lib/camp-terrain";
import { campZones, wrapZone, zoneAt } from "@/lib/camp-zones";
import {
  PICKUP_RADIUS,
  loadQuestProgress,
  questForZone,
  saveQuestProgress,
  tokenUnlocked,

  zoneQuests,
} from "@/lib/camp-quests";
import { countryFlag } from "@/lib/country-flag";
import {
  CRITICAL_SECONDS,
  DOUBLE_TAP_MS,
  DOWN_SUIT_SECONDS,
  HYPOTHERMIA_SECONDS,
  HYPOXIA_SECONDS,
  LADDER_BASE_Y,
  LADDER_TOP_Y,
  LADDER_X,
  MAX_HYPOTHERMIA_SECONDS,
  OXYGEN_SECONDS,
  SUIT_RADIUS,
  SUIT_X,
  SUIT_Y,
  TENT_COOLDOWN_MS,
  TENT_RADIUS,
  TENT_X,
  TENT_Y,
  formatCountdown,
  nearLadder,
} from "@/lib/camp-death-zone";
import {
  DEHYDRATION_SECONDS,
  MAX_HYDRATION_SECONDS,
  PARCHED_SECONDS,
  WATER_SECONDS,
  WELL_RADIUS,
  WELL_REFILL_MS,
} from "@/lib/camp-desert";
import {
  MUSHROOM_BOOST_SECONDS,
  MUSHROOM_RADIUS,
  MUSHROOM_STAMINA_MULTIPLIER,
  MUSHROOM_X,
  MUSHROOM_Y,
} from "@/lib/camp-mushroom";



/** Intrinsic size of the base camp world, in world pixels. */
const WORLD_W = 1800;
const WORLD_H = 900;

/** How far the avatar walks per key press / button tap, in world pixels. */
const STEP = 26;

/** Deterministic pseudo-random 0..1 from an id, so figures don't jump around. */
const jitter = (id: string, salt: number) => {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

const BaseCampPage = () => {
  const { user } = useAuth();
  const { profiles, ascents, fetching } = useCommunityData();
  const { builds, mine, save, remove } = useCampBuilds(user?.id);
  const [query, setQuery] = useState("");
  const motionOk = useMotionAllowed();

  /** Where the player's climber is standing, and which way they face. */
  const [pos, setPos] = useState(() => groundPosition(WORLD_W / 2, 820));
  /** Which screen of the ring world the player is standing on. */
  const [zoneIndex, setZoneIndex] = useState(0);
  const zone = zoneAt(zoneIndex);

  const [facing, setFacing] = useState<1 | -1>(1);
  const [walking, setWalking] = useState(false);
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Death Zone survival: seconds of consciousness left (null = not up there),
   * whether the oxygen cache has been opened and whether we're mid-climb.
   */
  const [hypoxia, setHypoxia] = useState<number | null>(null);
  const [oxygenTaken, setOxygenTaken] = useState(false);
  const [climbing, setClimbing] = useState(false);
  const oxygenRef = useRef(false);
  oxygenRef.current = oxygenTaken;
  const lastUpRef = useRef(0);

  /**
   * Once the oxygen is flowing the cold takes over: five minutes of warmth,
   * reset in the tent and topped up by the down suit lying on the col.
   */
  const [cold, setCold] = useState<number | null>(null);
  const [suit, setSuit] = useState(false);
  const lastTentRef = useRef(0);

  /** Desert survival: seconds before you drop from thirst, plus your dug well. */
  const [thirst, setThirst] = useState<number | null>(null);
  const [well, setWell] = useState<{ x: number; y: number } | null>(null);
  const wellDrunkRef = useRef(0);
  const lastDownRef = useRef(0);

  /** Magic mushroom stamina boost: seconds left (0 = no boost, cap is grown). */
  const [boost, setBoost] = useState(0);

  const [fullscreen, setFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const [pickedBuild, setPickedBuild] = useState<string>("");
  const [buildName, setBuildName] = useState("");
  const [saving, setSaving] = useState(false);
  const [panel, setPanel] = useState<
    "none" | "build" | "inventory" | "find" | "help" | "quests"
  >("none");

  /** Which quest tokens have been picked up, per quest id. Local to this device. */
  const [questProgress, setQuestProgress] = useState<Record<string, string[]>>({});
  useEffect(() => setQuestProgress(loadQuestProgress()), []);

  const quest = questForZone(zone.id);
  const collected = quest ? (questProgress[quest.id] ?? []) : [];
  const questDone = Boolean(quest) && collected.length >= (quest?.tokens.length ?? 0);
  const completedQuests = useMemo(
    () =>
      zoneQuests
        .filter((q) => (questProgress[q.id] ?? []).length >= q.tokens.length)
        .map((q) => q.id),
    [questProgress],
  );
  const questsCompleted = completedQuests.length;

  const myProfile = user ? profiles[user.id] : undefined;

  const myAscents = useMemo(
    () => (user ? ascents.filter((a) => a.user_id === user.id) : []),
    [ascents, user],
  );

  /** Climbing level drives which shelters are unlocked. */
  const myLevel = useMemo(() => (user ? computeXp(myAscents).level.level : 1), [myAscents, user]);

  const inventory = useMemo(() => buildInventory(myAscents), [myAscents]);

  const unlocked = useMemo(
    () => campBuilds.filter((b) => buildUnlocked(b, myLevel, completedQuests)),
    [myLevel, completedQuests],
  );


  useEffect(() => {
    if (!pickedBuild && unlocked.length) setPickedBuild(unlocked[unlocked.length - 1]!.id);
  }, [unlocked, pickedBuild]);

  // Remember where the player left their climber standing, and in which zone.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("ticklelist-basecamp-pos");
      if (raw) {
        const v = JSON.parse(raw) as { x: number; y: number; zone?: number };
        if (Number.isFinite(v.x) && Number.isFinite(v.y)) setPos(groundPosition(v.x, v.y));
        if (Number.isFinite(v.zone)) setZoneIndex(wrapZone(Number(v.zone)));
      }
    } catch {
      /* ignore unreadable storage */
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "ticklelist-basecamp-pos",
        JSON.stringify({ ...pos, zone: zoneIndex }),
      );
    } catch {
      /* ignore full storage */
    }
  }, [pos, zoneIndex]);


  /** Camp audio: chill tribal loop + footsteps, synthesised on demand. */
  const audioRef = useRef<CampAudio | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const soundRef = useRef(false);
  soundRef.current = soundOn;

  const getAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new CampAudio();
    return audioRef.current;
  }, []);

  useEffect(() => () => audioRef.current?.dispose(), []);

  const toggleSound = useCallback(() => {
    const audio = getAudio();
    setSoundOn((on) => {
      if (on) audio.stopMusic();
      else audio.startMusic();
      try {
        window.localStorage.setItem("ticklelist-basecamp-sound", on ? "off" : "on");
      } catch {
        /* ignore full storage */
      }
      return !on;
    });
  }, [getAudio]);

  /** Live copies so wrapping can read the current position without stale state. */
  const posRef = useRef(pos);
  posRef.current = pos;
  const zoneRef = useRef(zoneIndex);
  zoneRef.current = zoneIndex;

  /**
   * Momentum: keep moving (holding a key or tapping fast) and the climber
   * builds up from a walk into a run. Pause and the speed bleeds away.
   */
  const [running, setRunning] = useState(false);
  const momentumRef = useRef(0);
  const lastStepRef = useRef(0);
  const stepSoundRef = useRef(0);

  /**
   * Stamina: sprinting burns it, standing still refills it. Empty means the
   * climber is winded and drops back to a walk until it has recovered a bit.
   * Fitter (higher level) climbers carry a bigger tank.
   */
  const baseStamina = 100 + (myLevel - 1) * 12;
  // A magic mushroom doubles the tank while it lasts.
  const maxStamina = boost > 0 ? baseStamina * MUSHROOM_STAMINA_MULTIPLIER : baseStamina;
  const staminaRef = useRef(maxStamina);
  const [stamina, setStamina] = useState(maxStamina);
  const windedRef = useRef(false);
  const [winded, setWinded] = useState(false);

  // Recovery ticks whenever the climber isn't sprinting.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (running) return;
      if (staminaRef.current >= maxStamina) return;
      staminaRef.current = Math.min(maxStamina, staminaRef.current + maxStamina * 0.05);
      setStamina(staminaRef.current);
      if (windedRef.current && staminaRef.current > maxStamina * 0.3) {
        windedRef.current = false;
        setWinded(false);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [running, maxStamina]);

  const walk = useCallback((dx: number, dy = 0) => {
    if (dx !== 0) setFacing(dx > 0 ? 1 : -1);
    setWalking(true);

    // Build momentum while steps keep coming; reset after a short pause.
    const now = Date.now();
    momentumRef.current = now - lastStepRef.current < 260 ? Math.min(momentumRef.current + 1, 14) : 0;
    lastStepRef.current = now;
    // Winded climbers can't push past a walk.
    if (windedRef.current) momentumRef.current = Math.min(momentumRef.current, 5);
    const speed = 1 + momentumRef.current * 0.1; // 1x walking → 2.4x sprinting
    const sprinting = speed >= 1.6;
    setRunning(sprinting);

    if (sprinting) {
      staminaRef.current = Math.max(0, staminaRef.current - 1.6);
      setStamina(staminaRef.current);
      if (staminaRef.current === 0 && !windedRef.current) {
        windedRef.current = true;
        setWinded(true);
        momentumRef.current = 0;
        setRunning(false);
        toast("Out of breath 😮‍💨", { description: "Catch your breath — you're back to walking pace." });
      }
    }

    // Footsteps get quicker but shouldn't machine-gun while sprinting.
    if (soundRef.current && now - stepSoundRef.current > (sprinting ? 95 : 150)) {
      stepSoundRef.current = now;
      audioRef.current?.step();
    }
    if (walkTimer.current) clearTimeout(walkTimer.current);
    walkTimer.current = setTimeout(() => {
      setWalking(false);
      setRunning(false);
      momentumRef.current = 0;
    }, 320);


    const rawX = posRef.current.x + dx * speed;
    // The world is a ring: walk off one edge and you arrive on the far edge of
    // the neighbouring screen.
    if (rawX > CAMP_GROUND.maxX || rawX < CAMP_GROUND.minX) {
      const step = rawX > CAMP_GROUND.maxX ? 1 : -1;
      const next = wrapZone(zoneRef.current + step);
      zoneRef.current = next;
      setZoneIndex(next);
      const landing = groundPosition(
        step > 0 ? CAMP_GROUND.minX + 6 : CAMP_GROUND.maxX - 6,
        posRef.current.y + dy * speed,
      );
      posRef.current = landing;
      setPos(landing);
      const z = zoneAt(next);
      if (soundRef.current) audioRef.current?.zoneEnter();
      toast(`${z.icon} ${z.name}`, { description: z.blurb });
      return;
    }

    // Feet always land on terrain: never above the mountain tops, never
    // floating below the valley floor.
    const nextPos = groundPosition(rawX, posRef.current.y + dy * speed);
    posRef.current = nextPos;
    setPos(nextPos);
  }, []);


  /**
   * Stumble off the col to the neighbouring (lower) zone. Dying is expensive:
   * every quest in every world is wiped, so you start the whole ring again.
   */
  const descend = useCallback((toast_: string, description: string) => {
    setQuestProgress({});
    saveQuestProgress({});
    const next = wrapZone(zoneRef.current - 1);
    zoneRef.current = next;
    setZoneIndex(next);
    const landing = groundPosition(CAMP_GROUND.maxX - 40, 830);
    posRef.current = landing;
    setPos(landing);
    toast.error(toast_, { description });
    toast.warning("All quest progress lost", {
      description: "Dying wipes every zone quest across the whole world — start again.",
    });
  }, []);

  // Arriving on the col starts the altitude-sickness clock; leaving clears it.
  useEffect(() => {
    if (!user || zone.id !== "deathZone") {
      setHypoxia(null);
      setOxygenTaken(false);
      setClimbing(false);
      setCold(null);
      setSuit(false);
      return;
    }
    setOxygenTaken(false);
    setCold(null);
    setSuit(false);
    setHypoxia(HYPOXIA_SECONDS);
    toast.error("8,000 m — altitude sickness!", {
      description:
        "30 seconds of consciousness. Walk off the col, or double-tap ↑ at the ladder on the serac to reach the oxygen cache.",
    });
  }, [zone.id, user]);

  // The countdown itself.
  useEffect(() => {
    if (hypoxia === null) return;
    if (hypoxia <= 0) {
      setHypoxia(null);
      if (soundRef.current) audioRef.current?.collapse();
      descend(
        "You blacked out at 8,000 m ☠️",
        "Your rope team dragged you down to the glacier. Try the oxygen next time.",
      );
      return;
    }
    if (hypoxia <= CRITICAL_SECONDS && soundRef.current) audioRef.current?.alarm(hypoxia <= 5);
    const id = window.setTimeout(
      () => setHypoxia((h) => (h === null ? null : h - 1)),
      1000,
    );
    return () => window.clearTimeout(id);
  }, [hypoxia, descend]);

  // The hypothermia clock ticking down once you're breathing bottled oxygen.
  useEffect(() => {
    if (cold === null) return;
    if (cold <= 0) {
      setCold(null);
      if (soundRef.current) audioRef.current?.collapse();
      descend(
        "Hypothermia took you 🥶",
        "Five minutes is all the cold gives you. Warm up in the tent, and wear the down suit.",
      );
      return;
    }
    if (cold <= CRITICAL_SECONDS && soundRef.current) audioRef.current?.alarm(cold <= 5);
    const id = window.setTimeout(() => setCold((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [cold, descend]);

  // Ducking into the abandoned tent resets the warmth clock.
  useEffect(() => {
    if (zone.id !== "deathZone" || cold === null) return;
    if (Math.hypot(TENT_X - pos.x, TENT_Y - pos.y) > TENT_RADIUS) return;
    const now = Date.now();
    if (now - lastTentRef.current < TENT_COOLDOWN_MS) return;
    lastTentRef.current = now;
    setCold(HYPOTHERMIA_SECONDS + (suit ? DOWN_SUIT_SECONDS : 0));
    if (soundRef.current) audioRef.current?.questComplete();
    toast.success("Warming up in the tent ⛺", {
      description: "The hypothermia clock is back to five minutes.",
    });
  }, [pos, zone.id, cold, suit]);

  // Picking up the down suit dumped on the col: one extra minute of warmth.
  useEffect(() => {
    if (zone.id !== "deathZone" || suit) return;
    if (Math.hypot(SUIT_X - pos.x, SUIT_Y - pos.y) > SUIT_RADIUS) return;
    setSuit(true);
    setCold((c) =>
      c === null ? c : Math.min(MAX_HYPOTHERMIA_SECONDS, c + DOWN_SUIT_SECONDS),
    );
    if (soundRef.current) audioRef.current?.pickup();
    toast.success("Down suit on 🧥", {
      description: "Another minute before the cold bites — and the tent tops you up higher too.",
    });
  }, [pos, zone.id, suit]);


  // Walking into the desert starts the dehydration clock; leaving clears it.
  useEffect(() => {
    if (!user || zone.id !== "desert") {
      setThirst(null);
      setWell(null);
      wellDrunkRef.current = 0;
      return;
    }
    setWell(null);
    wellDrunkRef.current = 0;
    setThirst(DEHYDRATION_SECONDS);
    toast.error("Dehydration!", {
      description:
        "90 seconds of water left. Double-tap ↓ on the sand to dig a well — every drink buys you another minute.",
    });
  }, [zone.id, user]);

  // The thirst countdown.
  useEffect(() => {
    if (thirst === null) return;
    if (thirst <= 0) {
      setThirst(null);
      if (soundRef.current) audioRef.current?.collapse();
      descend(
        "You collapsed in the heat 💀",
        "Dehydration got you. Dig a well earlier next time — double-tap ↓ on the sand.",
      );
      return;
    }
    if (thirst <= PARCHED_SECONDS && soundRef.current) audioRef.current?.alarm(thirst <= 5);
    const id = window.setTimeout(() => setThirst((t) => (t === null ? null : t - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [thirst, descend]);

  // The mushroom boost ticking away.
  useEffect(() => {
    if (boost <= 0) return;
    const id = window.setTimeout(() => {
      setBoost((b) => {
        const next = b - 1;
        if (next <= 0) {
          toast("The mushroom wears off 🍄", { description: "Back to your normal lungs." });
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearTimeout(id);
  }, [boost]);

  // Walk onto the glowing cap in Fungal Hollow and you eat it.
  useEffect(() => {
    if (zone.id !== "mushroom" || boost > 0) return;
    if (Math.hypot(MUSHROOM_X - pos.x, MUSHROOM_Y - pos.y) > MUSHROOM_RADIUS) return;
    setBoost(MUSHROOM_BOOST_SECONDS);
    staminaRef.current = baseStamina * MUSHROOM_STAMINA_MULTIPLIER;
    setStamina(staminaRef.current);
    windedRef.current = false;
    setWinded(false);
    if (soundRef.current) audioRef.current?.questComplete();
    toast.success("You ate the magic mushroom 🍄", {
      description: "Double stamina for five minutes. Run, climber, run.",
    });
  }, [pos, zone.id, boost, baseStamina]);



  /** Double-tap ↑ at the ladder: climb the serac and grab the oxygen bottle. */
  const climbLadder = useCallback(() => {
    if (oxygenRef.current) {
      toast("Nothing left up there", { description: "The cache is empty — you took the bottle." });
      return;
    }
    setClimbing(true);
    const top = { x: LADDER_X, y: LADDER_TOP_Y };
    posRef.current = top;
    setPos(top);
    oxygenRef.current = true;
    setOxygenTaken(true);
    setHypoxia(OXYGEN_SECONDS);
    lastTentRef.current = 0;
    setCold(HYPOTHERMIA_SECONDS);
    if (soundRef.current) audioRef.current?.oxygen();
    toast.success("Oxygen on 🫁", {
      description:
        "Ten minutes on the col — but the cold starts now: five minutes before hypothermia. Warm up in the tent, grab the down suit.",
    });
    window.setTimeout(() => {
      const landing = groundPosition(LADDER_X + 40, LADDER_BASE_Y);
      posRef.current = landing;
      setPos(landing);
      setClimbing(false);
    }, 1200);
  }, []);

  /** "Up" input: a double-tap at the ladder climbs, anything else walks. */
  const pressUp = useCallback(
    (fromTap = true) => {
      const now = Date.now();
      // Only fresh taps count towards the ladder double-tap; a held key that
      // auto-repeats should just keep climbing the slope.
      const isDouble = fromTap && now - lastUpRef.current < DOUBLE_TAP_MS;
      if (fromTap) lastUpRef.current = now;
      const onCol = zoneAt(zoneRef.current).id === "deathZone";
      if (isDouble && onCol && nearLadder(posRef.current.x, posRef.current.y)) {
        climbLadder();
        return;
      }
      walk(0, -STEP / 2);
    },
    [climbLadder, walk],
  );

  /** Live copy of the dug well so the input handler never reads stale state. */
  const wellRef = useRef<{ x: number; y: number } | null>(null);
  wellRef.current = well;

  /** Double-tap ↓ on the sand: dig a well, or drink from the one you dug. */
  const digWell = useCallback(() => {
    const here = posRef.current;
    const existing = wellRef.current;
    const atWell =
      existing && Math.hypot(existing.x - here.x, existing.y - here.y) <= WELL_RADIUS;

    if (existing && !atWell) {
      toast("Dry sand", { description: "Your well is back the way you came — go drink there." });
      return;
    }
    if (atWell && Date.now() - wellDrunkRef.current < WELL_REFILL_MS) {
      toast("The well is seeping", { description: "Give it a few seconds to refill." });
      return;
    }

    wellDrunkRef.current = Date.now();
    if (!existing) {
      wellRef.current = here;
      setWell(here);
    }
    setThirst((t) => Math.min(MAX_HYDRATION_SECONDS, (t ?? 0) + WATER_SECONDS));
    if (soundRef.current) audioRef.current?.oxygen();
    toast.success(existing ? "You drink deep 💧" : "Water! You dug a well 💧", {
      description: "That's another minute on the clock.",
    });
  }, []);

  /** "Down" input: a double-tap in the desert digs, anything else walks. */
  const pressDown = useCallback(
    (fromTap = true) => {
      const now = Date.now();
      const isDouble = fromTap && now - lastDownRef.current < DOUBLE_TAP_MS;
      if (fromTap) lastDownRef.current = now;
      if (isDouble && zoneAt(zoneRef.current).id === "desert") {
        digWell();
        return;
      }
      walk(0, STEP / 2);
    },
    [digWell, walk],
  );


  // Walk over a quest token and it is picked up — if it isn't locked.
  const lockedHintRef = useRef(0);
  useEffect(() => {
    if (!quest) return;
    const have = questProgress[quest.id] ?? [];
    const near = quest.tokens.filter(
      (t) => !have.includes(t.id) && Math.hypot(t.x - pos.x, t.y - pos.y) <= PICKUP_RADIUS,
    );
    const hit = near.find((t) => tokenUnlocked(quest, t, have, oxygenTaken));
    if (!hit) {
      const locked = near[0];
      if (locked && Date.now() - lockedHintRef.current > 6000) {
        lockedHintRef.current = Date.now();
        toast(`🔒 ${locked.name}`, {
          description:
            quest.requiresOxygen && !oxygenTaken
              ? "Not without bottled oxygen — climb the serac ladder first."
              : (locked.lockedHint ?? "Something else has to happen first."),
        });
      }
      return;
    }
    const next = { ...questProgress, [quest.id]: [...have, hit.id] };
    setQuestProgress(next);
    saveQuestProgress(next);
    const done = next[quest.id]!.length >= quest.tokens.length;
    if (soundRef.current) {
      if (done) audioRef.current?.questComplete();
      else audioRef.current?.pickup(next[quest.id]!.length - 1);
    }
    if (done) toast.success(`${quest.title} complete!`, { description: quest.reward });
    else
      toast(`${hit.icon} ${hit.name}`, {
        description: `${next[quest.id]!.length}/${quest.tokens.length} for ${quest.title}`,
      });
  }, [pos, quest, questProgress, oxygenTaken]);


  /**
   * Hold-to-move: while a direction is held (key or on-screen button) we tick
   * steps on a timer, which feeds the momentum ramp above and turns the walk
   * into a run. Tapping fast does the same thing.
   */
  const heldRef = useRef<Set<"left" | "right" | "up" | "down">>(new Set());
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stepDir = useCallback(
    (dir: "left" | "right" | "up" | "down", fromTap = true) => {
      if (dir === "left") walk(-STEP);
      else if (dir === "right") walk(STEP);
      else if (dir === "up") pressUp(fromTap);
      else pressDown(fromTap);
    },
    [walk, pressUp, pressDown],

  );


  const stopHold = useCallback((dir?: "left" | "right" | "up" | "down") => {
    if (dir) heldRef.current.delete(dir);
    else heldRef.current.clear();
    if (heldRef.current.size === 0 && holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const startHold = useCallback(
    (dir: "left" | "right" | "up" | "down") => {
      if (heldRef.current.has(dir)) return;
      heldRef.current.add(dir);
      stepDir(dir);
      if (holdTimer.current) return;
      holdTimer.current = setInterval(() => {
        for (const d of heldRef.current) stepDir(d, false);
      }, 90);
    },
    [stepDir],
  );

  /** Touch/mouse props that make an on-screen arrow hold-to-run. */
  const holdProps = useCallback(
    (dir: "left" | "right" | "up" | "down") => ({
      onPointerDown: (e: ReactPointerEvent) => {
        e.preventDefault();
        startHold(dir);
      },
      onPointerUp: () => stopHold(dir),
      onPointerLeave: () => stopHold(dir),
      onPointerCancel: () => stopHold(dir),
    }),
    [startHold, stopHold],
  );


  useEffect(
    () => () => {
      if (holdTimer.current) clearInterval(holdTimer.current);
    },
    [],
  );

  const keyDir = (k: string): "left" | "right" | "up" | "down" | null => {
    if (k === "arrowleft" || k === "a") return "left";
    if (k === "arrowright" || k === "d") return "right";
    if (k === "arrowup" || k === "w") return "up";
    if (k === "arrowdown" || k === "s") return "down";
    return null;
  };

  // Arrow keys / WASD walk the climber around camp — hold to break into a run.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      const dir = keyDir(e.key.toLowerCase());
      if (!dir) return;
      e.preventDefault();
      // Browser auto-repeat is slower than our loop; our timer drives movement.
      if (e.repeat) return;
      startHold(dir);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = keyDir(e.key.toLowerCase());
      if (dir) stopHold(dir);
    };
    const onBlur = () => stopHold();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [startHold, stopHold]);


  useEffect(() => {
    const onChange = () => {
      const on = Boolean(document.fullscreenElement);
      setFullscreen(on);
      if (!on) {
        const o = window.screen?.orientation as { unlock?: () => void } | undefined;
        try {
          o?.unlock?.();
        } catch {
          /* orientation lock unsupported */
        }
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /** Double-tap anywhere on the game world toggles full screen. */
  const lastTapRef = useRef(0);
  const onStageClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      lastTapRef.current = 0;
      void toggleFullscreen();
      return;
    }
    lastTapRef.current = now;
  };

  const toggleFullscreen = async () => {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await el.requestFullscreen();
      // Phones: play the game sideways. Best effort — desktops and iOS ignore it.
      const o = window.screen?.orientation as
        | { lock?: (v: string) => Promise<void> }
        | undefined;
      try {
        await o?.lock?.("landscape");
      } catch {
        /* browser refused the orientation lock; the user can rotate manually */
      }
    } catch {
      toast.error("Your browser blocked full screen here.");
    }
  };

  const build = async (kind: CampBuildKind) => {
    if (!user) return;
    if (!zone.social) {
      toast.error("You can only pitch shelters back in the Home Valley.");
      return;
    }
    setSaving(true);

    const label = (buildName.trim() || defaultLabel(myProfile?.display_name ?? "Climber", kind)).slice(0, 40);
    const { error } = await save({ build_id: kind.id, label, x: Math.round(pos.x), y: Math.round(pos.y) });
    setSaving(false);
    if (error) toast.error(error);
    else {
      toast.success(`${label} is standing at camp 🏕️`);
      setPanel("none");
    }
  };


  const members = useMemo(() => {
    const counts: Record<string, number> = {};
    ascents.forEach((a) => {
      counts[a.user_id] = (counts[a.user_id] ?? 0) + 1;
    });
    return fuzzyRank(Object.values(profiles), query, (p) => [p.display_name, p.country])
      .filter((p) => p.id !== user?.id)
      .map((p) => ({ ...p, ascentCount: counts[p.id] ?? 0 }))
      .sort((a, b) => b.ascentCount - a.ascentCount || a.display_name.localeCompare(b.display_name));
  }, [profiles, ascents, query, user?.id]);

  const myAscentCount = useMemo(
    () => (user ? ascents.filter((a) => a.user_id === user.id).length : 0),
    [ascents, user],
  );

  /**
   * Scatter climbers in a tight, organically jittered cluster around the camp
   * so many are visible at once.
   */
  const placed = useMemo(() => {
    const cols = 4;
    const rows = Math.max(1, Math.ceil(members.length / cols));
    const clusterW = 960;
    const clusterX = (WORLD_W - clusterW) / 2;
    const clusterH = 460;
    const clusterY = WORLD_H - 110;
    return members.map((m, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const rowSize = Math.min(cols, members.length - row * cols);
      const depth = rows === 1 ? 0 : row / (rows - 1);
      const slot = (col + 0.5) / rowSize;
      const x = clusterX + slot * clusterW + (jitter(m.id, 1) - 0.5) * 70;
      const y = clusterY - depth * clusterH + (jitter(m.id, 2) - 0.5) * 90;
      const ground = groundPosition(x, y);
      const scale = (1.05 - depth * 0.34) * (0.94 + jitter(m.id, 4) * 0.14);
      return { m, x: ground.x, y: ground.y, scale };
    });
  }, [members]);

  if (!user) {
    return (
      <CommunityLayout>
        <Seo
          title="Base Camp — Ticklelist"
          description="See every Ticklelist climber gathered at base camp."
          noindex
        />
        <MembersOnly
          title="Base Camp is members only"
          description="Sign in to see every climber gathered at base camp."
        />
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <Seo
        title="Base Camp — Ticklelist"
        description="See every Ticklelist climber gathered at base camp."
        noindex
      />

      <div className="mb-4">
        <h1 className="font-display text-2xl tracking-wider">Base Camp</h1>
        <p className="text-sm text-muted-foreground">
          Everything happens inside the game window — walk, build, check your inventory and find
          climbers without leaving full screen.
        </p>
      </div>

      {/* The world: a colourful alpine valley you can zoom into and pan around. */}
      <div
        ref={stageRef}
        className="relative rounded-xl border border-border shadow-2xl overflow-hidden bg-slate-950"
      >
        <BaseCampHint />

        {/* Game HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-2">
          <div className="pointer-events-auto flex flex-col items-start gap-1">
            <span className="rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-display tracking-wider text-slate-100 ring-1 ring-white/20">
              Level {myLevel} · {myAscentCount} ascents
            </span>
            <span className="rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-display tracking-wider text-slate-100 ring-1 ring-white/20">
              {zone.icon} {zone.name}
              <span className="ml-2 text-slate-400">
                {campZones.map((z, i) => (i === wrapZone(zoneIndex) ? "●" : "○")).join(" ")}
              </span>
            </span>
            {quest && (
              <button
                type="button"
                onClick={() => setPanel("quests")}
                className="rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-display tracking-wider text-amber-100 ring-1 ring-amber-300/40"
              >
                📜 {quest.title} · {collected.length}/{quest.tokens.length}
                {questDone ? " ✓" : ""}
              </button>
            )}
            {hypoxia !== null && (
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-display tracking-wider ring-1 ${
                  hypoxia <= CRITICAL_SECONDS
                    ? "animate-pulse bg-red-600/90 text-white ring-red-300"
                    : oxygenTaken
                      ? "bg-emerald-700/85 text-emerald-50 ring-emerald-300/60"
                      : "bg-amber-600/85 text-amber-50 ring-amber-200/60"
                }`}
              >
                {oxygenTaken ? "🫁 Oxygen" : "☠️ Altitude sickness"} {formatCountdown(hypoxia)}
              </span>
            )}
            {thirst !== null && (
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-display tracking-wider ring-1 ${
                  thirst <= PARCHED_SECONDS
                    ? "animate-pulse bg-red-600/90 text-white ring-red-300"
                    : well
                      ? "bg-sky-700/85 text-sky-50 ring-sky-300/60"
                      : "bg-orange-600/85 text-orange-50 ring-orange-200/60"
                }`}
              >
                {well ? "💧 Water" : "🥵 Dehydration"} {formatCountdown(thirst)}
              </span>
            )}
            {boost > 0 && (
              <span className="rounded-full bg-fuchsia-700/85 px-3 py-1 text-[11px] font-display tracking-wider text-fuchsia-50 ring-1 ring-fuchsia-300/60">
                🍄 Double stamina {formatCountdown(boost)}
              </span>
            )}
            {cold !== null && (
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-display tracking-wider ring-1 ${
                  cold <= CRITICAL_SECONDS
                    ? "animate-pulse bg-red-600/90 text-white ring-red-300"
                    : "bg-sky-800/85 text-sky-50 ring-sky-300/60"
                }`}
              >
                {suit ? "🧥 Hypothermia" : "🥶 Hypothermia"} {formatCountdown(cold)}
              </span>
            )}
          </div>



          <div className="camp-controls pointer-events-auto flex max-w-[78vw] flex-wrap items-center justify-end gap-1 sm:max-w-none sm:gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={panel === "build" ? "default" : "secondary"}
              className="h-7 w-7 px-0 sm:h-8 sm:w-auto sm:px-3"
              aria-label="Open build menu"
              onClick={() => setPanel((p) => (p === "build" ? "none" : "build"))}
            >
              <Hammer className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Build</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={panel === "quests" ? "default" : "secondary"}
              className="h-7 w-7 px-0 sm:h-8 sm:w-auto sm:px-3"
              aria-label="Open zone quests"
              onClick={() => setPanel((p) => (p === "quests" ? "none" : "quests"))}
            >
              <ScrollText className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Quests</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={panel === "inventory" ? "default" : "secondary"}
              className="h-7 w-7 px-0 sm:h-8 sm:w-auto sm:px-3"
              aria-label="Open inventory"
              onClick={() => setPanel((p) => (p === "inventory" ? "none" : "inventory"))}
            >
              <Backpack className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Inventory</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={panel === "find" ? "default" : "secondary"}
              className="h-7 w-7 px-0 sm:h-8 sm:w-auto sm:px-3"
              aria-label="Find a climber"
              onClick={() => setPanel((p) => (p === "find" ? "none" : "find"))}
            >
              <Search className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Find</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={soundOn ? "default" : "secondary"}
              className="h-7 w-7 px-0 sm:h-8 sm:w-auto sm:px-3"
              aria-label={soundOn ? "Turn camp music off" : "Turn camp music on"}
              aria-pressed={soundOn}
              onClick={toggleSound}
            >
              <span aria-hidden className="text-base leading-none">
                {soundOn ? "🔊" : "🔇"}
              </span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={panel === "help" ? "default" : "secondary"}
              className="h-7 w-7 px-0 sm:h-8 sm:w-auto sm:px-3"
              aria-label="How to play"
              onClick={() => setPanel((p) => (p === "help" ? "none" : "help"))}
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7 w-7 px-0 sm:h-8 sm:w-auto sm:px-3"
              aria-label={fullscreen ? "Exit full screen" : "Enter full screen"}
              title={fullscreen ? "Exit full screen" : "Full screen"}
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Walk controls */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="camp-controls pointer-events-auto flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Walk left (hold to run)"
              {...holdProps("left")}
              className="h-11 w-11 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Walk right (hold to run)"
              {...holdProps("right")}
              className="h-11 w-11 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Walk up the slope (double-tap at the ladder to climb)"
              {...holdProps("up")}
              className="h-11 w-11 rounded-full"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label="Walk down the slope (double-tap in the desert to dig a well)"
              {...holdProps("down")}
              className="h-11 w-11 rounded-full"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
          <div className="pointer-events-none hidden items-center gap-1.5 rounded-full bg-slate-950/60 px-2.5 py-1 sm:flex">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-200">Stamina</span>
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700" role="img" aria-label={`Stamina ${Math.round((stamina / maxStamina) * 100)} percent`}>
              <span
                className={`block h-full rounded-full transition-[width] duration-150 ${winded ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${Math.max(0, Math.min(100, (stamina / maxStamina) * 100))}%` }}
              />
            </span>
          </div>
          <span className="pointer-events-none hidden rounded-full bg-slate-950/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200 sm:inline">
            {winded ? "Out of breath 😮‍💨" : running ? "Running! 🏃" : "Arrow keys or WASD — hold or tap fast to run"}
          </span>


        </div>


        {/* Turn-sideways nudge while playing full screen on a portrait phone */}
        {fullscreen && (
          <p className="pointer-events-none absolute inset-x-0 top-14 z-30 text-center text-[11px] uppercase tracking-[0.2em] text-slate-200 landscape:hidden">
            Turn your phone sideways 📱↻
          </p>
        )}

        {panel === "build" && (
          <CampBuildMenu
            level={myLevel}
            picked={pickedBuild}
            onPick={setPickedBuild}
            name={buildName}
            onName={setBuildName}
            placeholder={defaultLabel(myProfile?.display_name ?? "Climber", campBuilds[0]!)}
            saving={saving}
            hasBuild={Boolean(mine)}
            completedQuests={completedQuests}
            onBuild={build}
            onRemove={() => {
              void remove();
              setPanel("none");
            }}
            onClose={() => setPanel("none")}
          />
        )}
        {panel === "inventory" && (
          <CampInventory items={inventory} onClose={() => setPanel("none")} />
        )}

        {panel === "quests" && (
          <div className="absolute inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-md rounded-xl border-4 border-slate-600 bg-slate-800/95 p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.2em] text-slate-100">
                  <ScrollText className="h-4 w-4 text-primary" /> Zone quests
                  <span className="text-[11px] text-slate-400">
                    {questsCompleted}/{zoneQuests.length}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setPanel("none")}
                  aria-label="Close quests"
                  className="grid h-8 w-8 place-items-center rounded-md border border-slate-500 bg-slate-700 text-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="grid max-h-[46vh] gap-2 overflow-y-auto pr-1">
                {zoneQuests.map((q) => {
                  const have = questProgress[q.id] ?? [];
                  const done = have.length >= q.tokens.length;
                  const here = q.zone === zone.id;
                  const z = campZones.find((c) => c.id === q.zone);
                  return (
                    <li
                      key={q.id}
                      className={`rounded-md border-2 p-2 ${
                        here ? "border-primary bg-slate-900/80" : "border-slate-600 bg-slate-900/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-xs tracking-wider text-slate-100">
                          {z?.icon} {q.title}
                        </span>
                        <span className={`text-[11px] ${done ? "text-emerald-300" : "text-slate-400"}`}>
                          {done ? "Complete ✓" : `${have.length}/${q.tokens.length}`}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {done ? q.reward : q.brief}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1 text-base">
                        {q.tokens.map((t) => (
                          <span
                            key={t.id}
                            title={t.name}
                            className={have.includes(t.id) ? "opacity-100" : "opacity-25 grayscale"}
                          >
                            {t.icon}
                          </span>
                        ))}
                      </div>
                      {!here && (
                        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                          Walk to {z?.name}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[11px] text-slate-400">
                Walk your climber over a glowing item to pick it up.
              </p>
            </div>
          </div>
        )}


        {panel === "find" && (
          <div className="absolute inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-xl rounded-xl border-4 border-slate-600 bg-slate-800/95 p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.2em] text-slate-100">
                  <Search className="h-4 w-4 text-primary" /> Find a climber
                </h2>
                <button
                  type="button"
                  onClick={() => setPanel("none")}
                  aria-label="Close climber search"
                  className="grid h-8 w-8 place-items-center rounded-md border border-slate-500 bg-slate-700 text-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or country"
                className="h-9 bg-slate-900 text-slate-100"
                aria-label="Search climbers at base camp"
              />
              <ul className="mt-2 grid max-h-[36vh] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                {members.slice(0, 40).map((m) => (
                  <li key={m.id}>
                    <Link
                      to={`/community/members/${m.id}`}
                      className="flex items-center gap-2 rounded-md border-2 border-slate-600 bg-slate-900/60 p-2 hover:bg-slate-700"
                    >
                      <MemberAvatar path={m.avatar_url} name={m.display_name} className="h-8 w-8" />
                      <span className="min-w-0">
                        <span className="block truncate font-display text-xs tracking-wider text-slate-100">
                          {m.display_name}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {m.ascentCount} ascents{m.country ? ` · ${m.country}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                {members.length === 0 && (
                  <li className="text-[11px] text-slate-400">No climbers match that search.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {panel === "help" && (
          <div className="absolute inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-md rounded-xl border-4 border-slate-600 bg-slate-800/95 p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.2em] text-slate-100">
                  <Info className="h-4 w-4 text-primary" /> How to play
                </h2>
                <button
                  type="button"
                  onClick={() => setPanel("none")}
                  aria-label="Close help"
                  className="grid h-8 w-8 place-items-center rounded-md border border-slate-500 bg-slate-700 text-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="space-y-1.5 text-[12px] text-slate-300">
                <li>Arrow keys, WASD or the round buttons walk your climber.</li>
                <li>Drag to pan, scroll or pinch to zoom the camp.</li>
                <li>
                  <span className="text-slate-100">Build</span> pitches a shelter where you stand —
                  bigger builds unlock as you level up.
                </li>
                <li>
                  <span className="text-slate-100">Inventory</span> shows loot earned from challenge
                  lists and milestones.
                </li>
                <li>
                  <span className="text-slate-100">🔊</span> toggles the chill tribal camp tune and
                  footstep sounds.
                </li>
                <li>
                  Keep walking left or right and the world wraps around: Home Valley → Glacier
                  Basin → the Death Zone → Desert Range → Fungal Hollow → Grey Wastes → Ashfall Caldera → Coral
                  Cay → back home.
                </li>
                <li>
                  <span className="text-slate-100">Quests</span> — every zone hides collectibles.
                  Walk over a glowing item to pick it up and finish the zone quest.
                </li>
                <li>
                  <span className="text-slate-100">☠️ The Death Zone</span> — the col at 8,000 m
                  between Glacier Basin and Desert Range. You have 30 seconds before altitude
                  sickness drops you (your climber flashes red for the last 10). Walk off the col,
                  or stand at the foot of the ladder on the serac and double-tap ↑ to climb up and
                  crack open the oxygen bottle: that buys you 10 minutes. The moment the oxygen is
                  on, a five minute hypothermia clock starts: walk into the half-buried tent to
                  reset it, and pick up the 🧥 down suit on the col for an extra minute.
                </li>
                <li>
                  <span className="text-slate-100">🥵 Desert Range</span> — the heat starts a 90
                  second dehydration clock. Double-tap ↓ on the sand to dig a well; every drink
                  adds a minute (up to 3). Let it hit zero and you collapse.
                </li>
                <li>
                  <span className="text-slate-100">🍄 Fungal Hollow</span> — walk over the glowing
                  magic mushroom to eat it: double stamina for five minutes. A new cap grows once
                  it wears off.
                </li>
                <li>On a phone, go full screen and turn it sideways.</li>


              </ul>
              <Link
                to="/community/settings#avatar"
                className="mt-3 inline-block text-[12px] text-primary underline"
              >
                Design your 3D avatar
              </Link>
            </div>
          </div>
        )}




        {/* Double-tap the world to toggle full screen */}
        <div onClick={onStageClick} className="contents">
        <PanZoom
          worldWidth={WORLD_W}
          worldHeight={WORLD_H}
          className="w-full"
          storageKey="onsight-basecamp-view"
          showControls={false}
          style={{ height: fullscreen ? "100dvh" : "min(72vh, 620px)" }}
        >
          <div className="relative h-full w-full">
            <BaseCampScene zone={zone.id} />

            {/* Quest tokens lying around this zone (locked ones sit greyed out) */}
            {quest?.tokens
              .filter((t) => !collected.includes(t.id))
              .map((t) => {
                const unlocked = tokenUnlocked(quest, t, collected, oxygenTaken);
                return (
                <span
                  key={t.id}
                  aria-hidden
                  className={`pointer-events-none absolute -translate-x-1/2 -translate-y-full select-none text-3xl ${
                    unlocked
                      ? `drop-shadow-[0_0_10px_rgba(253,224,71,0.8)] ${motionOk ? "animate-pulse" : ""}`
                      : "opacity-40 grayscale"
                  }`}
                  style={{ left: t.x, top: t.y, zIndex: Math.round(t.y) }}
                >
                  {unlocked ? t.icon : "🔒"}
                </span>
                );
              })}



            {/* Everyone's shelters — they all stand in the home valley */}
            {zone.social &&
              builds.map((b) => (
                <CampBuild
                  key={b.id}
                  buildId={b.build_id}
                  label={b.label}
                  x={groundPosition(b.x, b.y).x}
                  y={groundPosition(b.x, b.y).y}
                  mine={b.user_id === user.id}
                />
              ))}


            {/* Death Zone: the oxygen cache on top of the serac */}
            {zone.id === "deathZone" && !oxygenTaken && (
              <span
                aria-hidden
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-full select-none text-4xl drop-shadow-[0_0_14px_rgba(56,189,248,0.9)] ${
                  motionOk ? "animate-pulse" : ""
                }`}
                style={{ left: LADDER_X, top: LADDER_TOP_Y, zIndex: Math.round(LADDER_TOP_Y) }}
              >
                🫙
              </span>
            )}
            {zone.id === "deathZone" &&
              !oxygenTaken &&
              !climbing &&
              nearLadder(pos.x, pos.y) && (
                <span
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-full bg-slate-950/85 px-3 py-1 text-[11px] font-display tracking-wider text-cyan-200 ring-1 ring-cyan-300/50"
                  style={{ left: LADDER_X, top: LADDER_BASE_Y - 150, zIndex: 9999 }}
                >
                  Double-tap ↑ to climb the ladder
                </span>
              )}

            {/* Death Zone: the down suit lying on the col */}
            {zone.id === "deathZone" && !suit && (
              <span
                aria-hidden
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-full select-none text-3xl drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] ${
                  motionOk ? "animate-bounce" : ""
                }`}
                style={{ left: SUIT_X, top: SUIT_Y, zIndex: Math.round(SUIT_Y) }}
              >
                🧥
              </span>
            )}
            {zone.id === "deathZone" && cold !== null && (
              <span
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-full bg-slate-950/80 px-3 py-1 text-[10px] font-display tracking-wider text-sky-200 ring-1 ring-sky-300/40"
                style={{ left: TENT_X, top: TENT_Y - 90, zIndex: 9998 }}
              >
                ⛺ Warm up here
              </span>
            )}


            {/* Fungal Hollow: the magic mushroom, back once the boost wears off */}
            {zone.id === "mushroom" && boost === 0 && (
              <span
                aria-hidden
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-full select-none text-4xl drop-shadow-[0_0_14px_rgba(232,121,249,0.9)] ${
                  motionOk ? "animate-pulse" : ""
                }`}
                style={{ left: MUSHROOM_X, top: MUSHROOM_Y, zIndex: Math.round(MUSHROOM_Y) }}
              >
                🍄
              </span>
            )}

            {/* Desert: the well you dug, and the prompt to dig one */}
            {zone.id === "desert" && well && (
              <span
                aria-hidden
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full select-none text-4xl drop-shadow-[0_0_14px_rgba(56,189,248,0.9)]"
                style={{ left: well.x, top: well.y, zIndex: Math.round(well.y) }}
              >
                💧
              </span>
            )}
            {zone.id === "desert" && !well && (
              <span
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-full bg-slate-950/85 px-3 py-1 text-[11px] font-display tracking-wider text-amber-200 ring-1 ring-amber-300/50"
                style={{ left: pos.x, top: pos.y - 150, zIndex: 9999 }}
              >
                Double-tap ↓ to dig for water
              </span>
            )}

            {/* The player */}
            <div
              className="absolute flex w-28 -translate-x-1/2 -translate-y-full flex-col items-center text-center"
              style={{
                left: pos.x,
                top: pos.y,
                zIndex: Math.round(pos.y) + 1,
                transform: `scaleX(${facing})`,
                transformOrigin: "bottom center",
                transition: motionOk ? "left 220ms linear, top 220ms linear" : undefined,
              }}
            >
              <div
                className={`${walking && motionOk ? "animate-bounce" : ""} ${
                  running && motionOk ? "camp-running" : ""
                } ${
                  (hypoxia !== null && hypoxia <= CRITICAL_SECONDS) ||
                  (cold !== null && cold <= CRITICAL_SECONDS) ||
                  (thirst !== null && thirst <= PARCHED_SECONDS)
                    ? "camp-hypoxia"
                    : ""
                }`}

              >
                <AvatarTurntable
                  path={myProfile?.avatar_url ?? null}
                  name={myProfile?.display_name ?? "You"}
                  controls={false}
                  spinSpeed={0}
                  className="h-32 w-24 drop-shadow-xl"
                />
                {!myProfile?.avatar_url?.startsWith("gen:") && (
                  <div className="flex h-32 w-24 items-end justify-center">
                    <MemberAvatar
                      path={myProfile?.avatar_url ?? null}
                      name={myProfile?.display_name ?? "You"}
                      className="h-16 w-16 border-2 border-primary shadow-xl"
                    />
                  </div>
                )}
              </div>
              <span
                className="mt-2 max-w-full truncate rounded-full bg-primary/90 px-2 py-0.5 text-[11px] font-display tracking-wider text-primary-foreground"
                style={{ transform: `scaleX(${facing})` }}
              >
                {countryFlag(myProfile?.country) ? `${countryFlag(myProfile?.country)} ` : ""}You
              </span>
            </div>

            {!zone.social ? null : fetching ? (
              <p className="absolute inset-x-0 top-1/2 text-center text-sm text-slate-100 drop-shadow">
                Gathering climbers…
              </p>
            ) : (

              placed.map(({ m, x, y, scale }) => (
                <Link
                  key={m.id}
                  to={`/community/members/${m.id}`}
                  className="group absolute flex w-28 -translate-x-1/2 -translate-y-full flex-col items-center text-center"
                  style={{
                    left: x,
                    top: y,
                    zIndex: Math.round(y),
                    transform: `scale(${scale})`,
                    transformOrigin: "bottom center",
                    transition: motionOk
                      ? "left 620ms cubic-bezier(0.22, 1, 0.36, 1), top 620ms cubic-bezier(0.22, 1, 0.36, 1), transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease"
                      : undefined,
                  }}
                  aria-label={`View ${m.display_name}'s profile`}
                >
                  <div className="relative transition-transform duration-300 group-hover:-translate-y-2">
                    <AvatarTurntable
                      path={m.avatar_url}
                      name={m.display_name}
                      controls={false}
                      spinSpeed={10 + jitter(m.id, 3) * 14}
                      className="h-32 w-24 drop-shadow-xl"
                    />
                    {/* Photo avatars have no figure — show the portrait on a plinth instead. */}
                    {!m.avatar_url?.startsWith("gen:") && (
                      <div className="flex h-32 w-24 items-end justify-center">
                        <MemberAvatar
                          path={m.avatar_url}
                          name={m.display_name}
                          className="h-16 w-16 border-2 border-white/70 shadow-xl"
                        />
                      </div>
                    )}
                    <span
                      className="absolute inset-x-2 -bottom-1 h-2 rounded-[50%] bg-slate-950/40 blur-[2px]"
                      aria-hidden
                    />
                  </div>
                  <span className="mt-2 max-w-full truncate rounded-full bg-slate-950/70 px-2 py-0.5 text-[11px] font-display tracking-wider text-slate-100 ring-1 ring-white/20">
                    {countryFlag(m.country) ? `${countryFlag(m.country)} ` : ""}
                    {m.display_name}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 rounded-full bg-slate-950/45 px-2 text-[10px] text-amber-100">
                    <Mountain className="h-3 w-3" />
                    {m.ascentCount} · {rankFor(m.ascentCount).current.name}
                  </span>
                </Link>
              ))
            )}
          </div>
        </PanZoom>
        </div>
      </div>
    </CommunityLayout>
  );
};

export default BaseCampPage;
