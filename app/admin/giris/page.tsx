import type { Metadata } from "next";

import AdminLoginClient from "@/components/admin/admin-login-client";

export const metadata: Metadata = {
  title: "Yönetici Girişi",
  description:
    "Uğur Bey Spot güvenli yönetim paneli girişi.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return <AdminLoginClient />;
}
