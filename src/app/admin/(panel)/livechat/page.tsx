// ─────────────────────────────────────────────────────────────────────────────
// /admin/livechat — کنسول چت آنلاین پشتیبانی (DECISION-049) — enforce: support.read
// پاسخ‌دادن به مجوز support.respond نیاز دارد (داخل کنسول گیت می‌شود).
// namespace مستقل از /admin/support (تیکت) تا با مسیر داینامیک [id] تداخل نکند.
// ─────────────────────────────────────────────────────────────────────────────

import { requirePermission } from "@/lib/admin/auth-server";
import { LiveChatConsole } from "@/components/admin/livechat/LiveChatConsole";

export const dynamic = "force-dynamic";

export default async function AdminLiveChatPage() {
  const ctx = await requirePermission("support.read");
  return <LiveChatConsole canRespond={ctx.permissions.has("support.respond")} />;
}
