"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  observePublicSession,
  type PublicSession,
} from "@/lib/public-auth";

export function usePublicSession() {
  const [
    session,
    setSession,
  ] = useState<PublicSession | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe =
      observePublicSession(
        (nextSession) => {
          if (!active) {
            return;
          }

          setSession(nextSession);
          setLoading(false);
        },
      );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return {
    session,
    loading,
    authenticated:
      Boolean(session),
    isAdmin:
      Boolean(session?.isAdmin),
  };
}