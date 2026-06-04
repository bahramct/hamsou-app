"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DevAIInspector — نمایش آخرین فراخوانی‌های AI در dev
// منبع داده: GET /api/dev/ai/invocations
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { IS_DEV_MODE } from "@/lib/env";
import type { AIInvocationLogEntry } from "@/lib/ai/types";

interface ApiResponse {
  ok: boolean;
  invocations: AIInvocationLogEntry[];
  roles: Array<{ id: string; version: string; description: string }>;
}

export function DevAIInspector() {
  // دفاع در عمق: حتی اگر بیرونی فراموش شد چک کند، اینجا هم چک می‌شود
  if (!IS_DEV_MODE) return null;
  return <Inner />;
}

function Inner() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dev/ai/invocations");
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function clearAll() {
    await fetch("/api/dev/ai/invocations", { method: "DELETE" });
    load();
  }

  if (!data) {
    return <p className="text-[11px] text-fog">در حال بارگذاری…</p>;
  }

  return (
    <div className="space-y-3 text-bone" dir="rtl">
      {/* روله‌های ثبت‌شده */}
      <div>
        <p className="text-[10px] text-fog uppercase tracking-wider mb-1">
          نقش‌های ثبت‌شده ({data.roles.length})
        </p>
        <ul className="space-y-0.5">
          {data.roles.map((r) => (
            <li key={`${r.id}@${r.version}`} className="text-[11px] text-bone">
              <span className="text-ember">{r.id}</span>
              <span className="text-fog"> v{r.version}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={load}
          disabled={isLoading}
          className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
        >
          {isLoading ? "…" : "بازخوانی"}
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="text-[10px] px-2 py-1 rounded bg-ember/20 text-ember hover:bg-ember/30"
        >
          پاک کردن
        </button>
      </div>

      {/* فراخوانی‌ها */}
      <div>
        <p className="text-[10px] text-fog uppercase tracking-wider mb-1">
          فراخوانی‌ها ({data.invocations.length})
        </p>
        {data.invocations.length === 0 ? (
          <p className="text-[11px] text-fog italic">هنوز فراخوانی‌ای انجام نشده.</p>
        ) : (
          <ul className="space-y-1">
            {data.invocations.map((inv) => (
              <li key={inv.id} className="rounded bg-white/5">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expandedId === inv.id ? null : inv.id)
                  }
                  className="w-full text-right px-2 py-1.5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] ${
                        inv.error ? "text-red-300" : "text-ember"
                      }`}
                    >
                      {inv.roleId}
                    </span>
                    <span className="text-[10px] text-fog fa-num">
                      {inv.latencyMs}ms
                    </span>
                  </div>
                  <div className="text-[10px] text-fog mt-0.5 fa-num">
                    {inv.provider}/{inv.model} · {inv.inputTokens}→
                    {inv.outputTokens}
                  </div>
                </button>
                {expandedId === inv.id && (
                  <div className="px-2 py-2 border-t border-white/10 space-y-2 text-[10px]">
                    {inv.error && (
                      <Section title="❌ خطا" content={inv.error} highlight />
                    )}
                    <Section title="SYSTEM" content={inv.systemPromptPreview} />
                    <Section title="USER" content={inv.userPromptPreview} />
                    <Section title="OUTPUT (raw)" content={inv.rawOutput} />
                    <Section
                      title="PARSED"
                      content={inv.parsedOutputPreview}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  content,
  highlight = false,
}: {
  title: string;
  content: string;
  highlight?: boolean;
}) {
  if (!content) return null;
  return (
    <div>
      <p
        className={`text-[9px] uppercase tracking-wider mb-0.5 ${
          highlight ? "text-red-300" : "text-fog"
        }`}
      >
        {title}
      </p>
      <pre
        className="text-[10px] text-bone/80 bg-black/30 p-1.5 rounded overflow-x-auto whitespace-pre-wrap break-all max-h-24 overflow-y-auto"
        dir="ltr"
      >
        {content}
      </pre>
    </div>
  );
}
