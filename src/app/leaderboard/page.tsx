import { ButtonLink, Footer, MetricCard, Navbar, SectionHeading } from "@/components/ui";
import { formatNumber, formatWeight } from "@/lib/format";
import { getDictionary, getLocale, institutionTypeLabelsByLocale, type Locale } from "@/lib/i18n";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Profile, Submission } from "@/lib/types";

export const dynamic = "force-dynamic";

type ApprovedRow = Pick<
  Submission,
  "profile_id" | "containers_count" | "estimated_battery_count" | "estimated_weight_kg"
> & {
  profiles: Pick<Profile, "institution_name" | "institution_type" | "region_city"> | null;
};

type LeaderboardRow = {
  profileId: string;
  name: string;
  type: Profile["institution_type"];
  region: string;
  containers: number;
  batteries: number;
  weight: number | null;
};

async function getLeaderboard() {
  if (!hasSupabaseEnv()) return [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("submissions")
      .select("profile_id, containers_count, estimated_battery_count, estimated_weight_kg, profiles(institution_name, institution_type, region_city)")
      .eq("status", "approved");

    const grouped = new Map<string, LeaderboardRow>();
    ((data ?? []) as unknown as ApprovedRow[]).forEach((row) => {
      if (!row.profiles) return;
      const current =
        grouped.get(row.profile_id) ??
        ({
          profileId: row.profile_id,
          name: row.profiles.institution_name,
          type: row.profiles.institution_type,
          region: row.profiles.region_city,
          containers: 0,
          batteries: 0,
          weight: null,
        } satisfies LeaderboardRow);

      current.containers += row.containers_count;
      current.batteries += row.estimated_battery_count;
      current.weight =
        current.weight === null && row.estimated_weight_kg === null
          ? null
          : (current.weight ?? 0) + (row.estimated_weight_kg ?? 0);
      grouped.set(row.profile_id, current);
    });

    return [...grouped.values()].sort((a, b) => b.batteries - a.batteries);
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const rows = await getLeaderboard();
  const totals = rows.reduce(
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
            eyebrow={t.leaderboard.eyebrow}
            title={t.leaderboard.title}
            text={t.leaderboard.text}
          />
          <ButtonLink href="/register" className="sm:mb-1">
            {t.common.join}
          </ButtonLink>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <MetricCard label={t.leaderboard.institutions} value={formatNumber(totals.institutions, locale)} />
          <MetricCard label={t.leaderboard.containers} value={formatNumber(totals.containers, locale)} />
          <MetricCard label={t.leaderboard.batteries} value={formatNumber(totals.batteries, locale)} />
        </div>

        <div className="brand-panel mt-8 overflow-hidden rounded-[24px]">
          <div className="grid grid-cols-[80px_1.4fr_1fr_1fr_1fr] gap-4 border-b border-[var(--brand-line)] bg-white px-6 py-4 text-sm font-bold text-[var(--brand-muted)] max-md:hidden">
            <span>{t.leaderboard.rank}</span>
            <span>{t.leaderboard.institution}</span>
            <span>{t.leaderboard.region}</span>
            <span>{t.leaderboard.containers}</span>
            <span>{t.leaderboard.batteryWeight}</span>
          </div>
          {rows.length ? (
            rows.map((row, index) => <LeaderboardItem key={row.profileId} row={row} rank={index + 1} locale={locale} />)
          ) : (
            <div className="p-8">
              <p className="rounded-[20px] bg-[var(--background)] p-5 text-[var(--brand-muted)]">
                {t.common.noApproved}
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer locale={locale} />
    </main>
  );
}

function LeaderboardItem({ row, rank, locale }: { row: LeaderboardRow; rank: number; locale: Locale }) {
  const rankTone =
    rank === 1
      ? "bg-[var(--brand-primary)] text-white"
      : rank <= 3
        ? "bg-[var(--brand-mint)] text-[var(--brand-deep)]"
        : "bg-[var(--background)] text-[var(--brand-muted)]";

  return (
    <article className="grid gap-4 border-b border-[var(--brand-line)] px-6 py-5 last:border-b-0 md:grid-cols-[80px_1.4fr_1fr_1fr_1fr] md:items-center">
      <div className={`flex size-12 items-center justify-center rounded-[16px] text-base font-bold ${rankTone}`}>
        #{rank}
      </div>
      <div>
        <h2 className="font-bold text-[var(--foreground)]">{row.name}</h2>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">{institutionTypeLabelsByLocale[locale][row.type]}</p>
      </div>
      <p className="font-medium text-[var(--brand-muted)]">{row.region}</p>
      <p className="font-bold text-[var(--foreground)]">{formatNumber(row.containers, locale)}</p>
      <p className="font-bold text-[var(--foreground)]">
        {formatNumber(row.batteries, locale)}{" "}
        <span className="text-sm font-medium text-[var(--brand-muted)]">/ {formatWeight(row.weight, locale)}</span>
      </p>
    </article>
  );
}
