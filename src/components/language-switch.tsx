"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [nextLocale, setNextLocale] = useState<Locale | null>(null);

  useEffect(() => {
    if (!nextLocale) return;
    document.cookie = `batabank-locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }, [nextLocale, router]);

  return (
    <div className="flex rounded-[14px] border border-[var(--brand-line)] bg-white p-1 text-xs font-bold">
      {(["uz", "ru"] as Locale[]).map((item) => (
        <button
          key={item}
          className={`focus-ring rounded-[10px] px-2.5 py-1.5 uppercase ${
            locale === item
              ? "bg-[var(--brand-primary)] text-white"
              : "text-[var(--brand-muted)] hover:bg-[var(--background)]"
          }`}
          onClick={() => setNextLocale(item)}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
