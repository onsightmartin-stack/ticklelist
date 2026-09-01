import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { idleLimitMs, shouldDropTransientSession, setRememberMe } from "@/lib/session-policy";
import { toast } from "@/hooks/use-toast";

export interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  country: string | null;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const lastActivity = useRef(Date.now());

  const loadRole = async (uid: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, bio, country, avatar_url")
      .eq("id", uid)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
      if (newSession?.user) {
        setTimeout(() => {
          loadProfile(newSession.user.id);
          loadRole(newSession.user.id);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      // "Remember me" off + browser fully closed → drop the session.
      if (data.session && shouldDropTransientSession()) {
        supabase.auth.signOut();
        setLoading(false);
        return;
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
        loadRole(data.session.user.id);
      }
    });

    // Idle auto-logout
    const bump = () => { lastActivity.current = Date.now(); };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart", "visibilitychange"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const interval = window.setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      if (Date.now() - lastActivity.current >= idleLimitMs()) {
        lastActivity.current = Date.now();
        await supabase.auth.signOut();
        setProfile(null);
        setIsAdmin(false);
        toast({ title: "Signed out", description: "You were inactive, so we ended the session for safety." });
      }
    }, 60_000);

    return () => {
      sub.subscription.unsubscribe();
      events.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(interval);
    };
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    isAdmin,
    refreshProfile: async () => {
      if (user) await loadProfile(user.id);
    },
    signOut: async () => {
      await supabase.auth.signOut();
      setRememberMe(false);
      setProfile(null);
      setIsAdmin(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
