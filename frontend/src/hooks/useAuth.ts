import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { clearLiveCache } from "../lib/liveCache";
import { markVoluntaryLogout, wasRecentVoluntaryLogout, clearVoluntaryLogout } from "../lib/voluntaryLogout";
import type { Profile, AccountStatus } from "../types";

interface UseAuthResult {
  session: any | null;
  profile: Profile | null;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  authMode: "login" | "signup";
  setAuthMode: (m: "login" | "signup") => void;
  authError: string | null;
  handleAuth: () => Promise<void>;
  handleLogout: () => Promise<void>;
  hasEnteredStudio: boolean;
  setHasEnteredStudio: (v: boolean) => void;
  // Helpers nuevos
  accountStatus: AccountStatus | null;
  isOnboarded: boolean;
  isProfileLoading: boolean;
  /** Timestamp del ultimo SIGNED_OUT involuntario detectado. null si no
   *  hubo. Se resetea cuando llega una sesion nueva (re-login). */
  sessionRevokedAt: number | null;
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionRevokedAt, setSessionRevokedAt] = useState<number | null>(null);
  // Trackea si alguna vez tuvimos sesion en el ciclo de vida del hook.
  // Si recibimos SIGNED_OUT pero nunca tuvimos sesion, no fue una
  // revocacion — el user simplemente nunca se logueo.
  const hadSessionRef = useRef<boolean>(false);

  const [hasEnteredStudio, setHasEnteredStudio] = useState<boolean>(() => {
    try {
      return localStorage.getItem("pathfinder_has_entered_studio") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (hasEnteredStudio) {
        localStorage.setItem("pathfinder_has_entered_studio", "true");
      } else {
        localStorage.removeItem("pathfinder_has_entered_studio");
      }
    } catch (e) {
      void 0;
    }
  }, [hasEnteredStudio]);

  const fetchProfile = useCallback(async (userId: string) => {
    if (profile?.id === userId) {
      setIsProfileLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single<Profile>();

      if (!error && data) {
        setProfile(data);
      } else if (error) {
        void 0;
        if (error.code === "PGRST116") setProfile(null);
      }
    } catch (e) {
      void 0;
    } finally {
      setIsProfileLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    // 1. Sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      hadSessionRef.current = !!session;
      if (session?.user?.id) {
        fetchProfile(session.user.id);
      } else {
        setIsProfileLoading(false);
      }
    });

    // 2. Cambios de auth
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (!session) {
          // Distinguir logout voluntario de revocacion server-side.
          // Si ya teniamos sesion y NO fue un logout pedido por el user,
          // es una revocacion involuntaria — disparamos el modal de
          // sesion expirada via sessionRevokedAt.
          if (hadSessionRef.current && !wasRecentVoluntaryLogout()) {
            setSessionRevokedAt(Date.now());
          } else {
            clearVoluntaryLogout();
          }
          hadSessionRef.current = false;
          clearLiveCache();
          setHasEnteredStudio(false);
          setProfile(null);
          setIsProfileLoading(false);
          try {
            localStorage.removeItem("pathfinder_has_entered_studio");
          } catch {}
        } else if (session.user?.id) {
          // Nueva sesion activa: resetear el flag de revocacion.
          hadSessionRef.current = true;
          setSessionRevokedAt(null);
          await fetchProfile(session.user.id);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  async function handleAuth() {
    setAuthError(null);
    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else setAuthError("Revisa tu correo para confirmar la cuenta (si está activado).");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    }
  }

  async function handleLogout() {
    // Marcar ANTES del signOut: cuando el SIGNED_OUT llegue, el flag
    // estara fresco y no vamos a disparar el modal de sesion expirada.
    markVoluntaryLogout();
    clearLiveCache();
    await supabase.auth.signOut({ scope: "local" });
    setSession(null);
    setProfile(null);
    setHasEnteredStudio(false);
  }

  return {
    session,
    profile,
    email,
    setEmail,
    password,
    setPassword,
    authMode,
    setAuthMode,
    authError,
    handleAuth,
    handleLogout,
    hasEnteredStudio,
    setHasEnteredStudio,
    accountStatus: profile?.account_status ?? null,
    isOnboarded: profile?.onboarding_completed_at != null,
    isProfileLoading,
    sessionRevokedAt,
  };
}
