import { useCallback, useEffect, useState } from "react";
import {
  getInstallState,
  promptInstall,
  subscribeInstall,
  type InstallState,
} from "@/lib/install";
import { isNativeApp } from "@/lib/native";

const SSR_STATE: InstallState = {
  deferred: null,
  installed: false,
  method: "prompt",
  supported: false,
};

/**
 * Live install availability for the current browser. Safe during SSR:
 * it reports "not available" until hydration, then feature-detects.
 */
export const useInstallPrompt = () => {
  const [state, setState] = useState<InstallState>(SSR_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setState(getInstallState());
    return subscribeInstall(setState);
  }, []);

  const install = useCallback(() => promptInstall(), []);

  const native = hydrated && isNativeApp();

  return {
    ...state,
    install,
    hydrated,
    /** True when an install CTA makes sense on screen. */
    canShowCta: hydrated && !native && !state.installed && state.supported,
    /** True when clicking triggers the browser's own install dialog. */
    hasNativePrompt: Boolean(state.deferred),
  };
};

export default useInstallPrompt;
