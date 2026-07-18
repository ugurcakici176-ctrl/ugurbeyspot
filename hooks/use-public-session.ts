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

  const [
    verifiedByCode,
    setVerifiedByCode,
  ] = useState(false);

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

  useEffect(() => {
    const email = session?.user.email ?? "";

    if (!email) {
      return;
    }

    let active = true;

    async function refreshVerificationStatus() {
      try {
        const response = await fetch(
          `/api/auth/verification-status?email=${encodeURIComponent(email)}`,
          { cache: "no-store" },
        );

        const payload = (await response.json().catch(() => null)) as {
          verified?: boolean;
        } | null;

        if (active) {
          setVerifiedByCode(response.ok && payload?.verified === true);
        }
      } catch {
        if (active) {
          setVerifiedByCode(false);
        }
      }
    }

    void refreshVerificationStatus();

    function handleVerificationChanged() {
      void refreshVerificationStatus();
    }

    window.addEventListener(
      "public-email-verification-changed",
      handleVerificationChanged,
    );

    return () => {
      active = false;
      window.removeEventListener(
        "public-email-verification-changed",
        handleVerificationChanged,
      );
    };
  }, [session?.user.email]);

  return {
    session,
    loading,
    authenticated:
      Boolean(session),
    isAdmin:
      Boolean(session?.isAdmin),
    emailVerified:
      Boolean(
        session?.user.emailVerified ||
        verifiedByCode,
      ),
  };
}
