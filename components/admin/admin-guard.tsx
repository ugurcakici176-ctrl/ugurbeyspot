"use client";

import {
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import LoadingScreen from "@/components/ui/loading-screen";
import { useAdminSession } from "@/hooks/use-admin-session";
import {
  ADMIN_LOGIN_ROUTE,
} from "@/lib/admin-auth";

export default function AdminGuard({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const {
    session,
    loading,
  } = useAdminSession();

  useEffect(() => {
    if (!loading && !session) {
      router.replace(
        ADMIN_LOGIN_ROUTE,
      );
    }
  }, [
    loading,
    router,
    session,
  ]);

  if (loading) {
    return (
      <LoadingScreen label="Yönetici oturumu doğrulanıyor" />
    );
  }

  if (!session) {
    return (
      <LoadingScreen label="Giriş ekranına yönlendiriliyor" />
    );
  }

  return <>{children}</>;
}
