"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getCustomerProfile,
} from "@/lib/customer-profile";
import {
  observePublicSession,
  type PublicSession,
} from "@/lib/public-auth";
import type {
  CustomerProfile,
} from "@/lib/types";

export function usePublicSession() {
  const [
    session,
    setSession,
  ] =
    useState<PublicSession | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    profile,
    setProfile,
  ] =
    useState<CustomerProfile | null>(
      null,
    );

  const [
    profileLoading,
    setProfileLoading,
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
    const uid =
      session?.user.uid;

    if (!uid) {
      const timeoutId =
        window.setTimeout(() => {
          setProfile(null);
          setProfileLoading(false);
        }, 0);

      return () => {
        window.clearTimeout(
          timeoutId,
        );
      };
    }

    let active = true;

    const loadProfile =
      async (): Promise<void> => {
        try {
          const nextProfile =
            await getCustomerProfile(uid);

          if (active) {
            setProfile(nextProfile);
          }
        } catch (reason: unknown) {
          console.error(
            "Müşteri profili yüklenemedi:",
            reason,
          );

          if (active) {
            setProfile(null);
          }
        } finally {
          if (active) {
            setProfileLoading(false);
          }
        }
      };

    const timeoutId =
      window.setTimeout(() => {
        setProfileLoading(true);
        void loadProfile();
      }, 0);

    function handleProfileChanged(
      event: Event,
    ): void {
      const customEvent =
        event as CustomEvent<
          CustomerProfile
        >;

      if (
        customEvent.detail?.uid === uid
      ) {
        setProfile(
          customEvent.detail,
        );
      } else {
        void loadProfile();
      }
    }

    window.addEventListener(
      "customer-profile-changed",
      handleProfileChanged,
    );

    return () => {
      active = false;

      window.clearTimeout(
        timeoutId,
      );

      window.removeEventListener(
        "customer-profile-changed",
        handleProfileChanged,
      );
    };
  }, [session?.user.uid]);

  useEffect(() => {
    const email =
      session?.user.email ?? "";

    if (!email) {
      return;
    }

    let active = true;

    async function refreshVerificationStatus():
      Promise<void> {
      try {
        const response = await fetch(
          `/api/auth/verification-status?email=${encodeURIComponent(email)}`,
          {
            cache: "no-store",
          },
        );

        const payload =
          (await response
            .json()
            .catch(() => null)) as {
            verified?: boolean;
          } | null;

        if (active) {
          setVerifiedByCode(
            response.ok &&
              payload?.verified === true,
          );
        }
      } catch {
        if (active) {
          setVerifiedByCode(false);
        }
      }
    }

    void refreshVerificationStatus();

    function handleVerificationChanged():
      void {
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
    profile,
    loading,
    profileLoading,

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