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
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#18392b]/30 px-4 pb-8 pt-28 backdrop-blur-sm sm:pt-32">
          <div className="mx-auto w-full max-w-md rounded-[24px] border border-[var(--brand-line)] bg-white p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-bold text-[var(--foreground)]">Admin kirish</p>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
                  Avval hisobga kirgan bo'ling. Maxfiy parol to'g'ri bo'lsa, hozirgi hisob admin sifatida faollashadi.
                </p>
              </div>
              <button
                className="focus-ring rounded-[12px] border border-[var(--brand-line)] px-3 py-1.5 text-sm font-bold text-[var(--brand-muted)] hover:bg-[var(--background)]"
                onClick={() => setOpen(false)}
                type="button"
              >
                X
              </button>
            </div>
            <form action={unlockAdminGate} className="mt-5 grid gap-3">
              <label className="block">
                <span className="text-sm font-semibold text-[var(--foreground)]">Maxfiy parol</span>
                <input
                  autoFocus
                  className="focus-ring mt-2 w-full rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-3 text-[var(--foreground)]"
                  name="secret"
                  placeholder="Parolni kiriting"
                  type="password"
                />
              </label>
              <button className="focus-ring min-h-11 rounded-[14px] bg-[var(--brand-primary)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-button)] hover:bg-[var(--brand-deep)]">
                Adminni faollashtirish
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
