import { redirect } from "next/navigation";
import { reviewSubmission } from "@/app/actions";
import { Footer, Navbar, SectionHeading } from "@/components/ui";
import { formatNumber, formatWeight } from "@/lib/format";
import { getDictionary, getLocale, institutionTypeLabelsByLocale, type Locale } from "@/lib/i18n";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Profile, Submission, SubmissionPhoto } from "@/lib/types";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

type PendingSubmission = Submission & {
  profiles: Pick<Profile, "institution_name" | "institution_type" | "region_city" | "contact_person" | "contact"> | null;
  submission_photos: SubmissionPhoto[];
  signedPhotos: { id: string; url: string | null }[];
};

export default async function AdminPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const params = await searchParams;

  if (!hasSupabaseEnv()) {
    return <SetupMissing locale={locale} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?error=Admin panel uchun login kerak");

  const { data: profileData } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const profile = profileData as { role?: string } | null;
  if (profile?.role !== "admin") redirect("/dashboard?error=Admin ruxsati kerak");

  const { data } = await supabase
    .from("submissions")
    .select(
      "*, profiles(institution_name, institution_type, region_city, contact_person, contact), submission_photos(*)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const pending = await Promise.all(
    ((data ?? []) as unknown as PendingSubmission[]).map(async (submission) => {
      const signedPhotos = await Promise.all(
        (submission.submission_photos ?? []).map(async (photo) => {
          const { data: signed } = await supabase.storage
            .from("collection-photos")
            .createSignedUrl(photo.storage_path, 3600);
          return { id: photo.id, url: signed?.signedUrl ?? null };
        }),
      );
      return { ...submission, signedPhotos };
    }),
  );

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar active="admin" locale={locale} />

      <section className="mx-auto max-w-6xl px-5 py-10">
        <SectionHeading
          eyebrow={t.admin.eyebrow}
          title={t.admin.title}
          text={t.admin.text}
        />
        <Message error={params.error} message={params.message} />

        <div className="mt-6 space-y-4">
          {pending.length ? (
            pending.map((submission) => <PendingCard key={submission.id} submission={submission} locale={locale} />)
          ) : (
            <p className="brand-panel rounded-[24px] p-6 text-[var(--brand-muted)]">
              {t.admin.empty}
            </p>
          )}
        </div>
      </section>

      <Footer locale={locale} />
    </main>
  );
}

function PendingCard({ submission, locale }: { submission: PendingSubmission; locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <article className="brand-panel rounded-[24px] p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            {submission.profiles?.institution_name ?? t.admin.unknown}
          </h2>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">
            {submission.profiles ? institutionTypeLabelsByLocale[locale][submission.profiles.institution_type] : "-"} ·{" "}
            {submission.profiles?.region_city ?? "-"}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label={locale === "ru" ? "Контейнер" : "Konteyner"} value={formatNumber(submission.containers_count, locale)} />
            <Metric label={locale === "ru" ? "Батарейки" : "Batareya"} value={formatNumber(submission.estimated_battery_count, locale)} />
            <Metric label={locale === "ru" ? "Вес" : "Vazn"} value={formatWeight(submission.estimated_weight_kg, locale)} />
          </dl>
          <p className="mt-4 text-sm text-[var(--brand-muted)]">
            {t.admin.date}: {new Date(submission.collection_date).toLocaleDateString(locale === "ru" ? "ru-RU" : "uz-UZ")} · {t.admin.responsible}:{" "}
            {submission.profiles?.contact_person ?? "-"} · {t.admin.contact}: {submission.profiles?.contact ?? "-"}
          </p>

          <form action={reviewSubmission} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input type="hidden" name="submission_id" value={submission.id} />
            <input
              className="focus-ring rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_4px_rgb(168_237_194/0.34)]"
              name="admin_note"
              placeholder={t.admin.notePlaceholder}
            />
            <button
              className="focus-ring rounded-[14px] border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-800 hover:bg-red-50"
              name="decision"
              value="rejected"
            >
              {t.common.reject}
            </button>
            <button
              className="focus-ring rounded-[14px] bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] hover:bg-[var(--brand-deep)]"
              name="decision"
              value="approved"
            >
              {t.common.approve}
            </button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {submission.signedPhotos.length ? (
            submission.signedPhotos.map((photo) =>
              photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={photo.id} src={photo.url} alt={t.admin.photoAlt} className="h-32 w-full rounded-[16px] object-cover" />
              ) : null,
            )
          ) : (
            <div className="rounded-[16px] bg-[var(--background)] p-4 text-sm text-[var(--brand-muted)]">{t.admin.noPhoto}</div>
          )}
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[var(--background)] p-4">
      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand-muted)]">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-[var(--foreground)]">{value}</dd>
    </div>
  );
}

function Message({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <p className={`mt-5 rounded-[14px] px-4 py-3 text-sm ${error ? "bg-red-50 text-red-800" : "bg-[var(--brand-mint)] text-[var(--brand-deep)]"}`}>
      {error ?? message}
    </p>
  );
}

function SetupMissing({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <section className="brand-panel max-w-lg rounded-[24px] p-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.admin.panel}</h1>
        <p className="mt-3 text-[var(--brand-muted)]">
          {t.common.setupMissing}
        </p>
      </section>
    </main>
  );
}
