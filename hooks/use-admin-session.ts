"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  observeAdminSession,
  type AdminSession,
} from "@/lib/admin-auth";

export function useAdminSession() {
  const [session, setSession] =
    useState<AdminSession | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe =
      observeAdminSession(
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
    authenticated: Boolean(session),
  };
}
