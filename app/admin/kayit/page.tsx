import type { Metadata } from "next";

import AdminRegisterClient from "@/components/admin/admin-register-client";

export const metadata: Metadata = {
  title: "Yönetici Kurulumu",
  description:
    "Uğur Bey Spot yönetici hesabı kurulum ekranı.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRegisterPage() {
  return <AdminRegisterClient />;
}
