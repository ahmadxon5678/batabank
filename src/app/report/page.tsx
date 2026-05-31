import { Footer, MetricCard, Navbar, SectionHeading } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { getLocale } from "@/lib/i18n";
import { getApprovedStats } from "@/lib/public-stats";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const locale = await getLocale();
  const { institutions, regions, rows } = await getApprovedStats();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRows = rows.filter((row) => new Date(row.reviewed_at ?? row.collection_date) >= monthStart);
  const monthlyProfileIds = new Set(monthlyRows.map((row) => row.profile_id));
  const monthlyTotals = monthlyRows.reduce(
    (acc, row) => ({
      containers: acc.containers + row.containers_count,
      batteries: acc.batteries + row.estimated_battery_count,
    }),
    { containers: 0, batteries: 0 },
  );
  const monthTitle = now.toLocaleDateString("uz-UZ", { month: "long", year: "numeric" });

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar active="report" locale={locale} />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <SectionHeading
          eyebrow="Oylik hisobot"
          title={`${monthTitle} hisoboti`}
          text="Ekologiya agentligi va hamkorlar uchun tasdiqlangan yig'imlar bo'yicha qisqa, ko'chirib ishlatish mumkin bo'lgan hisobot."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <MetricCard label="Bu oy konteynerlar" value={formatNumber(monthlyTotals.containers, locale)} />
          <MetricCard label="Bu oy batareyalar" value={formatNumber(monthlyTotals.batteries, locale)} />
          <MetricCard label="Bu oy faol tashkilotlar" value={formatNumber(monthlyProfileIds.size, locale)} />
        </div>

        <section className="brand-panel mt-8 rounded-[24px] p-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Hududlar bo'yicha natijalar</h2>
          <div className="mt-4 space-y-3">
            {regions.slice(0, 5).map((region, index) => (
              <div key={region.region} className="grid gap-2 rounded-[16px] bg-[var(--background)] p-4 md:grid-cols-[52px_1fr_1fr_1fr]">
                <span className="font-bold text-[var(--brand-deep)]">#{index + 1}</span>
                <span className="font-bold text-[var(--foreground)]">{region.region}</span>
                <span className="text-[var(--brand-muted)]">{formatNumber(region.institutions, locale)} tashkilot</span>
                <span className="font-bold text-[var(--foreground)]">{formatNumber(region.containers, locale)} konteyner</span>
              </div>
            ))}
            {!regions.length ? <Empty /> : null}
          </div>
        </section>

        <section className="brand-panel mt-8 rounded-[24px] p-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Eng faol tashkilotlar</h2>
          <div className="mt-4 space-y-3">
            {institutions.slice(0, 10).map((institution, index) => (
              <div key={institution.profileId} className="grid gap-2 rounded-[16px] bg-[var(--background)] p-4 md:grid-cols-[52px_1.4fr_1fr_1fr]">
                <span className="font-bold text-[var(--brand-deep)]">#{index + 1}</span>
                <span className="font-bold text-[var(--foreground)]">{institution.name}</span>
                <span className="text-[var(--brand-muted)]">{institution.region}</span>
                <span className="font-bold text-[var(--foreground)]">{formatNumber(institution.containers, locale)} konteyner</span>
              </div>
            ))}
            {!institutions.length ? <Empty /> : null}
          </div>
        </section>

        <section className="brand-panel mt-8 rounded-[24px] p-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Umumiy natija</h2>
          <p className="mt-3 leading-7 text-[var(--brand-muted)]">
            BataBank platformasida hozircha {formatNumber(institutions.length, locale)} ta faol tashkilot,{" "}
            {formatNumber(institutions.reduce((sum, row) => sum + row.containers, 0), locale)} ta tasdiqlangan konteyner va{" "}
            {formatNumber(institutions.reduce((sum, row) => sum + row.batteries, 0), locale)} ta taxminiy batareya qayd etilgan.
          </p>
        </section>
      </section>
      <Footer locale={locale} />
    </main>
  );
}

function Empty() {
  return <p className="rounded-[16px] bg-[var(--background)] p-4 text-[var(--brand-muted)]">Hali tasdiqlangan ma'lumot yo'q.</p>;
}
