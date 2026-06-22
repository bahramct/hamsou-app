// ─────────────────────────────────────────────────────────────────────────────
// redirect — تنظیمات چت آنلاین به تنظیمات سایت منتقل شد (DECISION-114)
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";

export default function LiveChatSettingsRedirect() {
  redirect("/admin/settings/livechat");
}
