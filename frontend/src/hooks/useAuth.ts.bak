// src/hooks/useAuth.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAuth() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);

  // Inicializar hasEnteredStudio desde localStorage
  const [hasEnteredStudio, setHasEnteredStudio] = useState<boolean>(() => {
    try {
      return localStorage.getItem("pathfinder_has_entered_studio") === "true";
    } catch (e) {
      return false;
    }
  });

  // Persistir cambios en localStorage
  useEffect(() => {
    try {
      if (hasEnteredStudio) {
        localStorage.setItem("pathfinder_has_entered_studio", "true");
      } else {
        localStorage.removeItem("pathfinder_has_entered_studio");
      }
    } catch (e) {
      console.warn("Error accediendo a localStorage:", e);
    }
  }, [hasEnteredStudio]);

  // Memoizamos fetchProfile para evitar recreaciones en cada render
  const fetchProfile = useCallback(async (userId: string) => {
    // Evitamos hacer la petición si ya estamos cargando el mismo perfil
    if (profile?.id === userId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (!error && data) {
        setProfile(data);
      } else if (error) {
        console.error("Error fetching profile:", error);
        // Opcional: Limpiar perfil si hay error de permisos
        if (error.code === 'PGRST116') setProfile(null); 
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  }, [profile?.id]);

  useEffect(() => {
    // 1. Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        fetchProfile(session.user.id);
      }
    });

    // 2. Escuchar cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth] Event:", event, "Session:", !!session);
      
      setSession(session);
      
      if (!session) {
        // Limpieza total al cerrar sesión
        setHasEnteredStudio(false);
        setProfile(null);
        try {
          localStorage.removeItem("pathfinder_has_entered_studio");
        } catch (e) {}
      } else if (session.user?.id) {
        // Solo actualizamos perfil si cambió el usuario
        await fetchProfile(session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
    // IMPORTANTE: Añadimos fetchProfile a las dependencias gracias a useCallback
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
    await supabase.auth.signOut();
    // El estado se actualizará automáticamente vía onAuthStateChange
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
  };
}