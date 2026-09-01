import { useEffect, useRef, useState } from "react";

/**
 * Xbox-style controller support for the community app navigation.
 *
 * Polls the Gamepad API each frame (the spec gives no input events) and turns
 * the standard mapping into edge-triggered semantic actions, so a held stick
 * repeats slowly instead of firing 60 times a second.
 */
export type GamepadAction = "left" | "right" | "up" | "down" | "confirm" | "back" | "menu";

/** Stick deflection before it counts as a direction. */
const DEADZONE = 0.55;
/** Delay before a held direction starts repeating (ms). */
const REPEAT_DELAY = 420;
/** Repeat interval while a direction stays held (ms). */
const REPEAT_RATE = 140;

/** Standard-mapping button indices we care about. */
const BUTTONS: Record<number, GamepadAction> = {
  0: "confirm", // A
  1: "back", // B
  3: "menu", // Y
  9: "menu", // Start / Menu
  12: "up",
  13: "down",
  14: "left",
  15: "right",
};

/** Short controller rumble; silently ignored on pads without actuators. */
export const rumble = (duration = 60, strength = 0.35) => {
  if (typeof navigator === "undefined" || !navigator.getGamepads) return;
  for (const pad of navigator.getGamepads()) {
    const actuator = (pad as Gamepad & {
      vibrationActuator?: { playEffect?: (t: string, o: Record<string, number>) => Promise<unknown> };
    })?.vibrationActuator;
    try {
      void actuator?.playEffect?.("dual-rumble", {
        duration,
        strongMagnitude: strength,
        weakMagnitude: strength * 0.7,
      });
    } catch {
      /* actuator unavailable — visual feedback still plays */
    }
  }
};

interface Options {
  /** Fired once per press, or on a slow repeat while held. */
  onAction: (action: GamepadAction) => void;
  /** Turn polling off when the surface is not interactive. */
  enabled?: boolean;
}

/** Returns whether a controller is currently connected. */
export const useGamepad = ({ onAction, enabled = true }: Options) => {
  const [connected, setConnected] = useState(false);
  const handler = useRef(onAction);
  handler.current = onAction;

  // Connection state drives the on-screen button legend.
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.getGamepads) return;
    const sync = () => setConnected(Array.from(navigator.getGamepads()).some(Boolean));
    sync();
    window.addEventListener("gamepadconnected", sync);
    window.addEventListener("gamepaddisconnected", sync);
    return () => {
      window.removeEventListener("gamepadconnected", sync);
      window.removeEventListener("gamepaddisconnected", sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !navigator.getGamepads) return;

    let frame = 0;
    /** action -> timestamp when it may next fire (0 = released). */
    const held = new Map<GamepadAction, number>();

    const press = (action: GamepadAction, now: number) => {
      const next = held.get(action);
      if (next === undefined) {
        held.set(action, now + REPEAT_DELAY);
        handler.current(action);
        return;
      }
      // Only directions auto-repeat; buttons must be released and pressed again.
      if (action === "confirm" || action === "back" || action === "menu") return;
      if (now >= next) {
        held.set(action, now + REPEAT_RATE);
        handler.current(action);
      }
    };

    const poll = () => {
      frame = requestAnimationFrame(poll);
      const pads = navigator.getGamepads?.() ?? [];
      const now = performance.now();
      const active = new Set<GamepadAction>();

      for (const pad of pads) {
        if (!pad) continue;
        pad.buttons.forEach((button, i) => {
          const action = BUTTONS[i];
          if (action && button.pressed) active.add(action);
        });
        const [x = 0, y = 0] = pad.axes;
        if (x <= -DEADZONE) active.add("left");
        if (x >= DEADZONE) active.add("right");
        if (y <= -DEADZONE) active.add("up");
        if (y >= DEADZONE) active.add("down");
      }

      active.forEach((action) => press(action, now));
      held.forEach((_, action) => {
        if (!active.has(action)) held.delete(action);
      });
    };

    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, [enabled]);

  return connected;
};
