// src/hooks/usePurchase.ts
import { useCallback, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type PurchaseState = "idle" | "loading" | "error";

interface UsePurchaseResult {
  state: PurchaseState;
  error: string | null;
  startCheckout: () => Promise<void>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function usePurchase(): UsePurchaseResult {
  const [state, setState] = useState<PurchaseState>("idle");
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
    setState("loading");
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Necesitás iniciar sesión primero.");
        setState("error");
        return;
      }

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          setError(data?.error || "Ya tenés Pathfinder Pro activo.");
        } else {
          setError(data?.error || "No pudimos iniciar el pago. Intentá de nuevo.");
        }
        setState("error");
        return;
      }

      if (!data?.url) {
        setError("No recibimos la URL de pago. Intentá de nuevo.");
        setState("error");
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("[usePurchase] error:", err);
      setError(
        err instanceof Error ? err.message : "Error inesperado al iniciar el pago.",
      );
      setState("error");
    }
  }, []);

  return { state, error, startCheckout };
}
