import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const CACHE_KEY = 'pf_r2_url_cache_v1';
const CACHE_TTL_MS = 82800000; // 23 horas

function getCache(): Record<string, { url: string; timestamp: number }> {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCache(cache: Record<string, { url: string; timestamp: number }>) {
  try {
    const now = Date.now();
    const cleaned = Object.fromEntries(
      Object.entries(cache).filter(([_, v]) => now - v.timestamp < CACHE_TTL_MS)
    );
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cleaned));
  } catch {}
}

export const useR2SignedUrl = (r2Key: string | null) => {
  const [url, setUrl] = useState<string | null>(() => {
    if (!r2Key) return null;
    const cache = getCache();
    const cached = cache[r2Key];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.url;
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!!r2Key && !url);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!r2Key) {
      setUrl(null);
      setError(false);
      setLoading(false);
      return;
    }

    // Cache hit: no fetch, no parpadeo
    const cache = getCache();
    const cached = cache[r2Key];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setUrl(cached.url);
      setError(false);
      setLoading(false);
      return;
    }

    // Cache miss: reset y fetch
    setUrl(null);
    setError(false);
    setLoading(true);

    let cancelled = false;
    const fetchUrl = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('r2-sign-download', {
          body: { r2_key: r2Key },
        });
        if (cancelled) return;
        if (fnError) throw fnError;
        if (data?.url) {
          const now = Date.now();
          const currentCache = getCache();
          currentCache[r2Key] = { url: data.url, timestamp: now };
          setCache(currentCache);
          setUrl(data.url);
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUrl();
    return () => { cancelled = true; };
  }, [r2Key]); // ← SOLO r2Key. Sin `url` en deps. Sin loop.

  return { url, loading, error };
};
