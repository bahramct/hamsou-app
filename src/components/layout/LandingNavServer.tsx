// ─────────────────────────────────────────────────────────────────────────────
// LandingNavServer — wrapper سرور-ساید برای LandingNav
// session را می‌خواند و CTA مناسب را به LandingNav پاس می‌دهد.
// در Admin Preview نباید استفاده شود (LandingNav مستقیم برای آن کافی است).
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { LandingNav } from "./LandingNav";
import { getSessionUser } from "@/lib/utils/auth-server";

interface Props {
  landing?: boolean;
  /** مسیر فعلی — اگر پاس شود، کاربرِ برگشتی بعد از لاگین اینجا بازمی‌گردد */
  returnPath?: string;
}

export async function LandingNavServer({ landing, returnPath }: Props) {
  const session = await getSessionUser();

  const loginHref = returnPath
    ? `/login?returnUrl=${encodeURIComponent(returnPath)}`
    : "/login";

  const cta = session ? (
    <Link href="/dashboard" className="btn btn-primary" style={{ padding: ".65rem 1.25rem", fontSize: "14px" }}>
      ورود به اپلیکیشن
    </Link>
  ) : (
    <Link href={loginHref} className="btn btn-primary" style={{ padding: ".65rem 1.25rem", fontSize: "14px" }}>
      شروع کن
    </Link>
  );

  return <LandingNav landing={landing} cta={cta} />;
}
