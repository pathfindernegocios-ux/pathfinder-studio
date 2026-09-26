// src/hooks/usePurchase.ts
import { useCallback, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type PlanId = "creator" | "founder";

type PurchaseState = "idle" | "loading" | "error";

interface UsePurchaseResult {
  state: PurchaseState;
  error: string | null;
  /** Plan actualmente en proceso de checkout, o null si ninguno */
  loadingPlan: PlanId | null;
  startCheckout: (planId: PlanId) => Promise<void>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function usePurchase(): UsePurchaseResult {
  const [state, setState] = useState<PurchaseState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  const startCheckout = useCallback(async (planId: PlanId) => {
    setState("loading");
    setError(null);
    setLoadingPlan(planId);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Necesitas iniciar sesión primero.");
        setState("error");
        setLoadingPlan(null);
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
          body: JSON.stringify({ plan: planId }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          setError(data?.error || "Ya tienes acceso activo.");
        } else {
          setError(data?.error || "No pudimos iniciar el pago. Intenta de nuevo.");
        }
        setState("error");
        setLoadingPlan(null);
        return;
      }

      if (!data?.url) {
        setError("No recibimos la URL de pago. Intenta de nuevo.");
        setState("error");
        setLoadingPlan(null);
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
      setLoadingPlan(null);
    }
  }, []);

  return { state, error, loadingPlan, startCheckout };
}
