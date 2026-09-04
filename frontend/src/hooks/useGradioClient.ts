import { useCallback, useEffect, useRef } from "react";
import { Client } from "@gradio/client";

export function useGradioClient(gradioUrl: string | null) {
  const clientPromiseRef = useRef<{
    url: string;
    promise: Promise<Client>;
  } | null>(null);

  const closeClientRef = (
    entry: { url: string; promise: Promise<Client> } | null
  ) => {
    if (!entry) return;
    entry.promise
      .then((c) => {
        (c as any).close?.();
      })
      .catch(() => {
        /* noop */
      });
  };

  const getClient = useCallback(async (): Promise<Client | null> => {
    if (!gradioUrl) return null;

    if (clientPromiseRef.current?.url === gradioUrl) {
      try {
        return await clientPromiseRef.current.promise;
      } catch {
        if (clientPromiseRef.current?.url === gradioUrl) {
          clientPromiseRef.current = null;
        }
      }
    }

    if (
      clientPromiseRef.current &&
      clientPromiseRef.current.url !== gradioUrl
    ) {
      closeClientRef(clientPromiseRef.current);
    }

    const promise = Client.connect(gradioUrl).catch((err) => {
      if (clientPromiseRef.current?.url === gradioUrl) {
        clientPromiseRef.current = null;
      }
      throw err;
    });

    clientPromiseRef.current = { url: gradioUrl, promise };
    return promise;
  }, [gradioUrl]);

  useEffect(() => {
    return () => {
      const entry = clientPromiseRef.current;
      clientPromiseRef.current = null;
      closeClientRef(entry);
    };
  }, [gradioUrl]);

  return { getClient };
}