import { redirect } from "next/navigation";

// /wallet دیگر وجود ندارد — بخش «امور مالی و تراکنش‌ها» در پروفایل کاربر است (DECISION-062)
export default function WalletPage() {
  redirect("/settings/profile#finance");
}
