"use client";

import { useState } from "react";
import { unlockAdminGate } from "@/app/actions";
import { BrandLogo } from "@/components/brand-logo";

export function AdminGateLogo() {
  const [clicks, setClicks] = useState(0);
  const [open, setOpen] = useState(false);

  function handleClick() {
    const next = clicks + 1;
    setClicks(next);
    if (next >= 5) {
      setClicks(0);
      setOpen(true);
    }
  }

  return (
    <div className="relative">
      <button className="rounded-[14px]" onClick={handleClick} type="button" aria-label="BataBank">
        <BrandLogo size="md" />
      </button>
      {open ? (
        <div className="absolute left-0 z-40 mt-2 w-[min(320px,calc(100vw-32px))] rounded-[18px] border border-[var(--brand-line)] bg-white p-4 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-bold text-[var(--foreground)]">Admin kirish</p>
          <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">
            Maxfiy parol admin rolini almashtirmaydi. Admin panel uchun hisobingiz ham admin bo'lishi kerak.
          </p>
          <form action={unlockAdminGate} className="mt-3 flex gap-2">
            <input
              className="focus-ring min-w-0 flex-1 rounded-[14px] border border-[var(--brand-line)] px-3 py-2 text-sm"
              name="secret"
              placeholder="Maxfiy parol"
              type="password"
            />
            <button className="focus-ring rounded-[14px] bg-[var(--brand-primary)] px-4 py-2 text-sm font-bold text-white">
              Kirish
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
