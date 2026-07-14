import type {
  ReactNode,
} from "react";

import AdminLayoutClient from "@/components/admin/admin-layout-client";

import "./admin.css";
import "./auth-final.css";
import "./global-settings-final.css";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
