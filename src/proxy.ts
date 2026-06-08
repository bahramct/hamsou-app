// ─────────────────────────────────────────────────────────────────────────────
// Middleware — محافظت از مسیرهای خصوصی همسو
// اگر کاربر session معتبر نداشته باشد، به /login هدایت می‌شود.
// اگر کاربر logged-in به /login رفت، به /dashboard هدایت می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/utils/session";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin/session";

// مسیرهایی که بدون ورود قابل دسترسی هستند
// نکته: "/" (صفحه اصلی/لندینگ) هم public است — هر کسی می‌تواند آن را ببیند.
// "/share" عمومی است (DECISION-052/054): گزارشِ اشتراکی + OG image + تصویرِ
// قابل‌دانلود، همه با گِیتِ isShared در خودِ هندلر محافظت می‌شوند (نه با auth).
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/plans",
  "/share",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/auth",
  "/api/dev",
];

// مسیرهایی که کاملاً بیرون از middleware هستند (static, assets)
const SKIP_PREFIXES = ["/_next/", "/favicon.ico", "/Fonts/", "/logo.png", "/landing.html"];

// مسیرهای ادمینِ عمومی (بدون نیاز به admin session)
const ADMIN_PUBLIC_PATHS = ["/admin/login", "/api/admin/auth"];

// ───── محافظ پنل ادمین — جدا از auth کاربر (DECISION-036) ─────
// فقط authentication چک می‌شود؛ permission در صفحه/route handler enforce می‌شود.
async function adminMiddleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/admin");

  const isAdminPublic = ADMIN_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token
    ? await verifyAdminSessionToken(token)
    : { valid: false as const, payload: null };

  if (isAdminPublic) {
    // ادمینِ لاگین‌شده روی صفحه login → به داشبورد پنل
    if (session.valid && pathname === "/admin/login") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!session.valid) {
    if (isApi) {
      return NextResponse.json({ error: "احراز هویت ادمین لازم است." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // بی‌خیال asset ها و next internal
  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // پنل ادمین مسیر auth کاملاً مستقل دارد
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return adminMiddleware(req);
  }

  // مسیرهای عمومی (landing + login + API auth)
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // بررسی session
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : { valid: false as const, payload: null };

  if (!session.valid && !isPublic) {
    // → به login ریدایرکت
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (session.valid && (pathname === "/" || pathname === "/login")) {
    // کاربر وارد شده روی صفحات عمومی → به dashboard
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * تطابق با همه مسیرها به جز:
     * - فایل‌های static (_next/static, _next/image, ...)
     * - فایل‌های public که پیشوند آنها در SKIP_PREFIXES است
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
