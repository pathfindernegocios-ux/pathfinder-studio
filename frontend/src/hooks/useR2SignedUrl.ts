import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const CACHE_KEY = 'pf_r2_url_cache_v1';
const CACHE_TTL_MS = 82800000; // 23 horas (alineado con la expiración de 24h de R2)

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
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.url;
    }
    return null;
  });
  
  const [loading, setLoading] = useState<boolean>(() => !url && !!r2Key);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!r2Key) {
      setUrl(null);
      setLoading(false);
      return;
    }

    if (url) return;

    const cache = getCache();
    const cached = cache[r2Key];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setUrl(cached.url);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchUrl = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('r2-sign-download', {
          body: { r2_key: r2Key }
        });
        if (fnError) throw fnError;
        
        if (isMounted && data?.url) {
          const now = Date.now();
          const currentCache = getCache();
          currentCache[r2Key] = { url: data.url, timestamp: now };
          setCache(currentCache);
          
          setUrl(data.url);
          setError(false);
        } else if (isMounted) {
          setError(true);
        }
      } catch {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUrl();
    return () => { isMounted = false; };
  }, [r2Key, url]);

  return { url, loading, error };
};
