import { permanentRedirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";

// "Genel Site Yönetimi" ekranı ile /admin/ayarlar aynı Firestore belgesini
// (site_settings/global_control_center) yazıyor ve birbirlerinin
// değişikliklerini geri alıyordu. Herkese açık sitenin kullandığı tüm alanlar
// /admin/ayarlar ekranında yönetildiği için tek kaynak orasıdır.
export default function AdminGlobalSettingsPage() {
  permanentRedirect(ROUTES.adminSettings);
}
