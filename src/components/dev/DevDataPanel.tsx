"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DevDataPanel — پنل اصلی ابزارهای dev (گوشه پایین-چپ)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { IS_DEV_MODE } from "@/lib/env";
import { DevTimeTravel } from "@/components/dev/DevTimeTravel";
import { DevSeedPanel } from "@/components/dev/DevSeedPanel";
import { DevAIInspector } from "@/components/dev/DevAIInspector";

type Tab = "time" | "seed" | "ai";

export function DevDataPanel() {
  if (!IS_DEV_MODE) return null;
  return <DevDataPanelInner />;
}

function DevDataPanelInner() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("time");

  return (
    <div
      className="fixed bottom-3 left-21 z-50 flex flex-col items-start gap-1"
      dir="ltr"
    >
      {/* پنل باز‌شده */}
      {isOpen && (
        <div
          className="
            mb-1 w-80 rounded-xl
            bg-charcoal border border-white/20
            shadow-paper
            overflow-hidden
          "
        >
          {/* هدر */}
          <div
            className="
              flex items-center justify-between gap-2
              px-3 py-2 border-b border-white/15
              bg-white/5
            "
          >
            <span className="text-[10px] font-bold tracking-widest text-ember uppercase">
              DEV TOOLS
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="بستن پنل"
              className="text-fog hover:text-paper text-[16px] leading-none transition-colors"
            >
              ×
            </button>
          </div>

          {/* تب‌ها */}
          <div className="flex border-b border-white/15">
            {(["time", "seed", "ai"] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 py-2 text-[11px] font-medium transition-colors
                  ${
                    activeTab === tab
                      ? "text-ember border-b-2 border-ember -mb-px"
                      : "text-fog hover:text-bone"
                  }
                `}
              >
                {tab === "time" ? "⏰ زمان" : tab === "seed" ? "🌱 دیتا" : "🧠 AI"}
              </button>
            ))}
          </div>

          {/* محتوا */}
          <div className="p-3 max-h-80 overflow-y-auto">
            {activeTab === "time" && <DevTimeTravel />}
            {activeTab === "seed" && <DevSeedPanel />}
            {activeTab === "ai" && <DevAIInspector />}
          </div>
        </div>
      )}

      {/* دکمه تاگل */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "بستن ابزارهای dev" : "باز کردن ابزارهای dev"}
        className={`
          w-7 h-7 rounded-lg flex items-center justify-center
          text-[13px] transition-all duration-200
          ${
            isOpen
              ? "bg-ember text-paper shadow-paper-sm"
              : "bg-charcoal text-ember border border-ember/40 hover:border-ember/70"
          }
        `}
        dir="ltr"
      >
        ⚙
      </button>
    </div>
  );
}
