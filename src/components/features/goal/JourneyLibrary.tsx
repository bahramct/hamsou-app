"use client";

// ─────────────────────────────────────────────────────────────────────────────
// JourneyLibrary — شبکهٔ «کتابخانهٔ مسیرها» + مدیریتِ مودالِ بازخوانی (TASK-28 فاز ۳)
// کلاینت‌محور تا کلیکِ کارت → بازخوانیِ سفر را مدیریت کند. داده از سرور می‌آید.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { JourneyCard } from "@/components/features/goal/JourneyCard";
import { JourneyRecapModal } from "@/components/features/goal/JourneyRecapModal";
import type { SerializedJourneyCard } from "@/types/goal";

export function JourneyLibrary({
  cards,
  emptyMessage,
}: {
  cards: SerializedJourneyCard[];
  emptyMessage?: string;
}) {
  const [openCard, setOpenCard] = useState<SerializedJourneyCard | null>(null);

  if (cards.length === 0) {
    if (!emptyMessage) return null;
    return (
      <p className="rounded-2xl border border-bone bg-white/40 px-4 py-10 text-center text-[13px] text-fog">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <div className="jp-journeys">
        {cards.map((card) => (
          <JourneyCard key={card.id} card={card} onOpen={() => setOpenCard(card)} />
        ))}
      </div>
      {openCard && <JourneyRecapModal card={openCard} onClose={() => setOpenCard(null)} />}
    </>
  );
}
