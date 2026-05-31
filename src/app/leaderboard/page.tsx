import { Award } from "lucide-react";
import { ButtonLink, Footer, MetricCard, Navbar, SectionHeading } from "@/components/ui";
import { formatNumber, formatWeight } from "@/lib/format";
import { getLocale, institutionTypeLabelsByLocale, type Locale } from "@/lib/i18n";
import { getApprovedStats, type PublicInstitutionStat } from "@/lib/public-stats";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const locale = await getLocale();
  const { institutions } = await getApprovedStats();
  const totals = institutions.reduce(
    (acc, row) => ({
      institutions: acc.institutions + 1,
      containers: acc.containers + row.containers,
      batteries: acc.batteries + row.batteries,
    }),
    { institutions: 0, containers: 0, batteries: 0 },
  );

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar active="leaderboard" locale={locale} />

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Ochiq natijalar"
            title="BataBank reytingi"
            text="Faqat admin tomonidan tasdiqlangan to'lgan konteyner so'rovlari hisoblanadi."
          />
          <ButtonLink href="/register" className="sm:mb-1">
            Tashkilotni qo'shish
          </ButtonLink>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <MetricCard label="Tashkilotlar" value={formatNumber(totals.institutions, locale)} />
          <MetricCard label="Tasdiqlangan konteynerlar" value={formatNumber(totals.containers, locale)} />
          <MetricCard label="Taxminiy batareyalar" value={formatNumber(totals.batteries, locale)} />
        </div>

        <div className="brand-panel mt-8 overflow-hidden rounded-[24px]">
          <div className="grid grid-cols-[80px_1.3fr_1fr_1fr_1.2fr_1fr] gap-4 border-b border-[var(--brand-line)] bg-white px-6 py-4 text-sm font-bold text-[var(--brand-muted)] max-lg:hidden">
            <span>Rank</span>
            <span>Tashkilot</span>
            <span>Hudud</span>
            <span>Konteyner</span>
            <span>Batareya / vazn</span>
            <span>Nishon</span>
          </div>
          {institutions.length ? (
            institutions.map((row, index) => <LeaderboardItem key={row.profileId} row={row} rank={index + 1} locale={locale} />)
          ) : (
            <div className="p-8">
              <p className="rounded-[20px] bg-[var(--background)] p-5 text-[var(--brand-muted)]">
                Hali tasdiqlangan natijalar yo'q.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer locale={locale} />
    </main>
  );
}

function LeaderboardItem({ row, rank, locale }: { row: PublicInstitutionStat; rank: number; locale: Locale }) {
  const rankTone =
    rank === 1
      ? "bg-[var(--brand-primary)] text-white"
      : rank <= 3
        ? "bg-[var(--brand-mint)] text-[var(--brand-deep)]"
        : "bg-[var(--background)] text-[var(--brand-muted)]";

  return (
    <article className="grid gap-4 border-b border-[var(--brand-line)] px-6 py-5 last:border-b-0 lg:grid-cols-[80px_1.3fr_1fr_1fr_1.2fr_1fr] lg:items-center">
      <div className={`flex size-12 items-center justify-center rounded-[16px] text-base font-bold ${rankTone}`}>#{rank}</div>
      <div>
        <h2 className="font-bold text-[var(--foreground)]">{row.name}</h2>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">{institutionTypeLabelsByLocale[locale][row.type]}</p>
      </div>
      <p className="font-medium text-[var(--brand-muted)]">{row.region}</p>
      <p className="font-bold text-[var(--foreground)]">{formatNumber(row.containers, locale)}</p>
      <p className="font-bold text-[var(--foreground)]">
        {formatNumber(row.batteries, locale)} <span className="text-sm font-medium text-[var(--brand-muted)]">/ {formatWeight(row.weight, locale)}</span>
      </p>
      <span className="inline-flex items-center gap-2 rounded-[12px] bg-[var(--brand-mint)] px-3 py-1 text-xs font-bold text-[var(--brand-deep)]">
        <Award size={15} />
        {row.badgeLabel}
      </span>
    </article>
  );
}
