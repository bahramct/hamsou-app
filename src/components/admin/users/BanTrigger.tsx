"use client";

import { useState } from "react";
import { BanModal } from "./BanModal";

interface Props {
  userId: string;
  isBanned: boolean;
  canBan: boolean;
}

export function BanTrigger({ userId, isBanned, canBan }: Props) {
  const [open, setOpen] = useState(false);
  if (!canBan) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-[11px] transition-colors underline underline-offset-2 decoration-dashed ${
          isBanned
            ? "text-sage-deep hover:text-sage decoration-sage/50"
            : "text-fog hover:text-ember decoration-fog/30 hover:decoration-ember/50"
        }`}
      >
        {isBanned ? "رفع مسدودی" : "مسدودسازی"}
      </button>
      {open && (
        <BanModal userId={userId} isBanned={isBanned} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
