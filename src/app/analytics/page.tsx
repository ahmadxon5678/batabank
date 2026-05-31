import { Award } from "lucide-react";
import { Footer, MetricCard, Navbar, SectionHeading } from "@/components/ui";
import { badges } from "@/lib/badges";
import { formatNumber, formatWeight } from "@/lib/format";
import { getLocale, institutionTypeLabelsByLocale, type Locale } from "@/lib/i18n";
import { getApprovedStats, type PublicInstitutionStat, type RegionStat } from "@/lib/public-stats";
import type { PickupStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const pickupLabels: Record<PickupStatus, string> = {
  not_requested: "So'ralmagan",
  requested: "So'ralgan",
  scheduled: "Rejalashtirilgan",
  picked_up: "Olib ketilgan",
  delivered_to_partner: "Hamkorga topshirilgan",
  cancelled: "Bekor qilingan",
};

export default async function AnalyticsPage() {
  const locale = await getLocale();
  const { institutions, regions, rows, pickup } = await getApprovedStats();
  const totals = institutions.reduce(
    (acc, row) => ({
      institutions: acc.institutions + 1,
      containers: acc.containers + row.containers,
      batteries: acc.batteries + row.batteries,
      weight: acc.weight + (row.weight ?? 0),
    }),
    { institutions: 0, containers: 0, batteries: 0, weight: 0 },
  );
  const badgeCounts = badges.map((badge) => ({
    ...badge,
    count: institutions.filter((item) => item.badgeKey === badge.key).length,
  }));

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar active="analytics" locale={locale} />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <SectionHeading
          eyebrow="Davlat va ekologiya agentliklari uchun"
          title="Hududiy tahlil"
          text="Tasdiqlangan to'lgan konteyner so'rovlari asosida hududlar, tashkilotlar va olib ketish jarayoni bo'yicha ochiq ko'rsatkichlar."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <MetricCard label="Faol tashkilotlar" value={formatNumber(totals.institutions, locale)} />
          <MetricCard label="Konteynerlar" value={formatNumber(totals.containers, locale)} />
          <MetricCard label="Batareyalar" value={formatNumber(totals.batteries, locale)} />
          <MetricCard label="Taxminiy vazn" value={formatWeight(totals.weight || null, locale)} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Panel title="Hududlar reytingi">
            {regions.length ? regions.map((region, index) => <RegionRow key={region.region} region={region} rank={index + 1} locale={locale} />) : <Empty />}
          </Panel>
          <Panel title="Nishonlar taqsimoti">
            {badgeCounts.map((badge) => (
              <div key={badge.key} className="flex items-center justify-between gap-4 rounded-[16px] bg-[var(--background)] p-4">
                <span className="inline-flex items-center gap-2 font-bold text-[var(--foreground)]">
                  <Award size={17} />
                  {badge.label}
                </span>
                <span className="font-bold text-[var(--brand-deep)]">{formatNumber(badge.count, locale)}</span>
              </div>
            ))}
          </Panel>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Panel title="Eng faol tashkilotlar">
            {institutions.slice(0, 10).map((row, index) => <InstitutionRow key={row.profileId} row={row} rank={index + 1} locale={locale} />)}
            {!institutions.length ? <Empty /> : null}
          </Panel>
          <Panel title="Olib ketish ko'rsatkichlari">
            {Object.entries(pickupLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-4 rounded-[16px] bg-[var(--background)] p-4">
                <span className="font-bold text-[var(--foreground)]">{label}</span>
                <span className="font-bold text-[var(--brand-deep)]">{formatNumber(pickup[key as PickupStatus] ?? 0, locale)}</span>
              </div>
            ))}
          </Panel>
        </div>

        <Panel title="So'nggi tasdiqlangan faoliyat" className="mt-8">
          {rows
            .slice()
            .sort((a, b) => new Date(b.reviewed_at ?? b.collection_date).getTime() - new Date(a.reviewed_at ?? a.collection_date).getTime())
            .slice(0, 8)
            .map((row) => (
              <div key={`${row.profile_id}-${row.collection_date}-${row.containers_count}`} className="grid gap-2 rounded-[16px] bg-[var(--background)] p-4 md:grid-cols-[1.2fr_1fr_1fr]">
                <span className="font-bold text-[var(--foreground)]">{row.profiles?.institution_name}</span>
                <span className="text-[var(--brand-muted)]">{row.profiles?.region_city}</span>
                <span className="font-bold text-[var(--brand-deep)]">{formatNumber(row.containers_count, locale)} konteyner</span>
              </div>
            ))}
          {!rows.length ? <Empty /> : null}
        </Panel>
      </section>
      <Footer locale={locale} />
    </main>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`brand-panel rounded-[24px] p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-[var(--foreground)]">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function RegionRow({ region, rank, locale }: { region: RegionStat; rank: number; locale: Locale }) {
  return (
    <div className="grid gap-2 rounded-[16px] bg-[var(--background)] p-4 md:grid-cols-[52px_1fr_1fr_1fr]">
      <span className="font-bold text-[var(--brand-deep)]">#{rank}</span>
      <span className="font-bold text-[var(--foreground)]">{region.region}</span>
      <span className="text-[var(--brand-muted)]">{formatNumber(region.institutions, locale)} tashkilot</span>
      <span className="font-bold text-[var(--foreground)]">{formatNumber(region.containers, locale)} konteyner</span>
    </div>
  );
}

function InstitutionRow({ row, rank, locale }: { row: PublicInstitutionStat; rank: number; locale: Locale }) {
  return (
    <div className="grid gap-2 rounded-[16px] bg-[var(--background)] p-4 md:grid-cols-[52px_1.2fr_1fr_1fr]">
      <span className="font-bold text-[var(--brand-deep)]">#{rank}</span>
      <span>
        <span className="block font-bold text-[var(--foreground)]">{row.name}</span>
        <span className="text-sm text-[var(--brand-muted)]">{institutionTypeLabelsByLocale[locale][row.type]}</span>
      </span>
      <span className="text-[var(--brand-muted)]">{row.region}</span>
      <span className="font-bold text-[var(--foreground)]">{formatNumber(row.containers, locale)} konteyner</span>
    </div>
  );
}

function Empty() {
  return <p className="rounded-[16px] bg-[var(--background)] p-4 text-[var(--brand-muted)]">Hali tasdiqlangan ma'lumot yo'q.</p>;
}
