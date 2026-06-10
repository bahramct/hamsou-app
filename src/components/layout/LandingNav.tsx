import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface Props {
  /** اگر true باشد، لینک‌های anchor به #section می‌روند (صفحه لندینگ).
   *  اگر false باشد، به /#section هدایت می‌کنند (صفحات فرعی). */
  landing?: boolean;
}

export function LandingNav({ landing = false }: Props) {
  const a = (id: string) => (landing ? `#${id}` : `/#${id}`);

  return (
    <nav className="glass-nav fixed top-0 inset-x-0 z-50 anim-fade-in">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png" alt="همسو"
            width={40} height={40}
            className="h-9 w-auto"
            style={{ width: "auto", height: "auto" }}
            priority
          />
        </Link>

        <div className="nav-links flex items-center gap-1">
          <a href={a("solution")} className="px-4 py-2 rounded-full text-sm font-medium text-stone hover:text-ink hover:bg-black/5 transition-all duration-300">چطور کار می‌کند</a>
          <a href={a("difference")} className="px-4 py-2 rounded-full text-sm font-medium text-stone hover:text-ink hover:bg-black/5 transition-all duration-300">آنچه نیست</a>
          <a href={a("testimonial")} className="px-4 py-2 rounded-full text-sm font-medium text-stone hover:text-ink hover:bg-black/5 transition-all duration-300">از کاربران</a>
          <Link href="/blog" className="px-4 py-2 rounded-full text-sm font-medium text-stone hover:text-ink hover:bg-black/5 transition-all duration-300">بلاگ</Link>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link href="/login" className="btn btn-primary" style={{ padding: ".65rem 1.25rem", fontSize: "14px" }}>
            شروع کن
          </Link>
        </div>
      </div>
    </nav>
  );
}
