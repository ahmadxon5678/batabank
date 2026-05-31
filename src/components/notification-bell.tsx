"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

export function NotificationBell({ messages }: { messages: string[] }) {
  const [open, setOpen] = useState(false);
  const count = messages.length;

  return (
    <div className="relative">
      <button
        className="focus-ring relative inline-flex size-11 items-center justify-center rounded-[14px] border border-[var(--brand-line)] bg-white text-[var(--foreground)] hover:border-[var(--brand-primary)]"
        onClick={() => setOpen((value) => !value)}
        type="button"
        aria-label="Bildirishnomalar"
      >
        <Bell size={18} />
        {count ? (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[10px] font-bold text-white">
            {count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(320px,calc(100vw-32px))] rounded-[18px] border border-[var(--brand-line)] bg-white p-3 shadow-[var(--shadow-soft)]">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--brand-muted)]">
            Bildirishnomalar
          </p>
          {count ? (
            <div className="space-y-2">
              {messages.map((message) => (
                <p key={message} className="rounded-[14px] bg-[var(--background)] px-3 py-2 text-sm leading-6 text-[var(--foreground)]">
                  {message}
                </p>
              ))}
            </div>
          ) : (
            <p className="rounded-[14px] bg-[var(--background)] px-3 py-2 text-sm text-[var(--brand-muted)]">
              Yangi bildirishnoma yo'q.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
