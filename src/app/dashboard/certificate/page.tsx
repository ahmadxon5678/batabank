import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { PrintButton } from "@/components/print-button";
import { getBadgeForContainers } from "@/lib/badges";
import { formatNumber } from "@/lib/format";
import { getLocale } from "@/lib/i18n";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Profile, Submission } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CertificatePage() {
  const locale = await getLocale();

  if (!hasSupabaseEnv()) redirect("/dashboard?error=Supabase sozlamalari kiritilmagan");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?error=Avval tizimga kiring");

  const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as Profile | null;

  if (profile?.approval_status !== "approved") {
    redirect("/dashboard?error=Sertifikat faqat tasdiqlangan tashkilotlar uchun");
  }

  const { data: approvedSubmissions } = await supabase
    .from("submissions")
    .select("containers_count")
    .eq("profile_id", user.id)
    .eq("status", "approved");
  const totalContainers = ((approvedSubmissions ?? []) as Pick<Submission, "containers_count">[]).reduce(
    (sum, row) => sum + row.containers_count,
    0,
  );
  const badge = getBadgeForContainers(totalContainers);
  const date = new Date().toLocaleDateString(locale === "ru" ? "ru-RU" : "uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-10 print:bg-white">
      <div className="mx-auto mb-5 flex max-w-4xl justify-between gap-3 print:hidden">
        <Link className="focus-ring rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--foreground)]" href="/dashboard">
          Kabinetga qaytish
        </Link>
        <PrintButton />
      </div>

      <section className="mx-auto max-w-4xl rounded-[28px] border-2 border-[var(--brand-primary)] bg-white p-8 shadow-[var(--shadow-soft)] print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <BrandLogo size="md" />
          <div className={`rounded-[18px] px-5 py-3 text-sm font-bold ${badge.tone}`}>{badge.label}</div>
        </div>

        <div className="my-12 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--brand-deep)]">BataBank sertifikati</p>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-[var(--foreground)] sm:text-5xl">
            {profile.institution_name}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--brand-muted)]">
            Ushbu sertifikat tashkilotning BataBank platformasida ishlatilgan batareyalarni xavfsiz yig'ish tashabbusida ishtirok etayotganini tasdiqlaydi.
          </p>
          {totalContainers > 0 ? (
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[var(--brand-muted)]">
              Tashkilot {formatNumber(totalContainers, locale)} ta to'lgan xavfsiz konteyner bo'yicha tasdiqlangan natijaga ega.
            </p>
          ) : (
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[var(--brand-muted)]">
              Tashkilot admin tomonidan tasdiqlangan ishtirokchi sifatida ro'yxatga olingan.
            </p>
          )}
        </div>

        <div className="grid gap-4 border-t border-[var(--brand-line)] pt-6 sm:grid-cols-3">
          <Info label="Hudud" value={profile.region_city} />
          <Info label="Tasdiqlangan konteyner" value={formatNumber(totalContainers, locale)} />
          <Info label="Berilgan sana" value={date} />
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[var(--background)] p-4 print:border print:border-[var(--brand-line)] print:bg-white">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--brand-muted)]">{label}</p>
      <p className="mt-2 font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
