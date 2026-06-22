"use client";

import { useState } from "react";
import { WalletModal } from "./WalletModal";
import { toFaDigits } from "@/lib/utils/digits";

interface Props {
  userId: string;
  balance: number;
  canManage: boolean;
}

export function WalletTrigger({ userId, balance, canManage }: Props) {
  const [open, setOpen] = useState(false);
  if (!canManage) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="مدیریت کیف‌پول"
        className="inline-flex items-center gap-1.5 text-xs text-fog hover:text-ink transition-colors group"
      >
        <WalletIcon />
        <span className="fa-num">{toFaDigits(balance)}</span>
        <span>تومان</span>
      </button>
      {open && (
        <WalletModal userId={userId} balance={balance} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function WalletIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden className="text-fog/70 group-hover:text-stone transition-colors shrink-0">
      <rect x="0.65" y="3.25" width="11.7" height="8.45" rx="1.3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M0.65 6.5h11.7" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8.45 9.1h1.95" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M3.25 1.3h6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
