"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] hover:bg-[var(--brand-deep)] print:hidden"
      onClick={() => window.print()}
      type="button"
    >
      <Printer size={17} />
      Chop etish
    </button>
  );
}
