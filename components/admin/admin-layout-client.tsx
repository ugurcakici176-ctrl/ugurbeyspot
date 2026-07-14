"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import AdminGuard from "@/components/admin/admin-guard";
import AdminShell from "@/components/admin/admin-shell";
import {
  ADMIN_LOGIN_ROUTE,
  ADMIN_REGISTER_ROUTE,
} from "@/lib/admin-auth";

const PUBLIC_ADMIN_ROUTES = new Set([
  ADMIN_LOGIN_ROUTE,
  ADMIN_REGISTER_ROUTE,
]);

export default function AdminLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (
    PUBLIC_ADMIN_ROUTES.has(pathname)
  ) {
    return <>{children}</>;
  }

  return (
    <AdminGuard>
      <AdminShell>
        {children}
      </AdminShell>
    </AdminGuard>
  );
}
