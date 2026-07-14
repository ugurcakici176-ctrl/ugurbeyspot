import type {
  Metadata,
} from "next";

import GlobalSettingsAdminClient from "@/components/admin/global-settings-admin-client";

export const metadata: Metadata = {
  title: "Genel Site Yönetimi",

  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminGlobalSettingsPage() {
  return (
    <GlobalSettingsAdminClient />
  );
}
