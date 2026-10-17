import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const urlCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL_MS = 240000;

export const useR2SignedUrl = (r2Key: string | null) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!r2Key) {
      setUrl(null);
      setLoading(false);
      return;
    }
    let isMounted = true;
    const fetchUrl = async () => {
      const cached = urlCache.get(r2Key);
      const now = Date.now();
      if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
        if (isMounted) { setUrl(cached.url); setLoading(false); }
        return;
      }
      if (isMounted) setLoading(true);
      try {
        const { data, error: fnError } = await supabase.functions.invoke('r2-sign-download', {
          body: { r2_key: r2Key }
        });
        if (fnError) throw fnError;
        if (isMounted) {
          if (data?.url) {
            urlCache.set(r2Key, { url: data.url, timestamp: now });
            setUrl(data.url);
            setError(false);
          } else { setError(true); }
        }
      } catch {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUrl();
    return () => { isMounted = false; };
  }, [r2Key]);

  return { url, loading, error };
};
