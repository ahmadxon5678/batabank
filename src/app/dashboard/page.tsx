import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSubmission, logout, updateProfile } from "@/app/actions";
import { formatNumber, formatWeight } from "@/lib/format";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { Footer, MetricCard, Navbar, PrimaryButton, TextInput } from "@/components/ui";
import { getDictionary, getLocale, institutionTypeLabelsByLocale, statusLabelsByLocale, type Locale } from "@/lib/i18n";
import type { Profile, Submission, SubmissionPhoto } from "@/lib/types";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

type SubmissionWithPhotos = Submission & {
  photos: { id: string; url: string | null }[];
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const params = await searchParams;

  if (!hasSupabaseEnv()) {
    return <SetupMissing title={t.common.dashboard} message={t.common.setupMissing} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?error=Avval tizimga kiring");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });
  const { data: photos } = await supabase.from("submission_photos").select("*").eq("profile_id", user.id);

  const signedPhotos = await Promise.all(
    ((photos ?? []) as SubmissionPhoto[]).map(async (photo) => {
      const { data } = await supabase.storage.from("collection-photos").createSignedUrl(photo.storage_path, 3600);
      return { ...photo, url: data?.signedUrl ?? null };
    }),
  );

  const photoMap = new Map<string, { id: string; url: string | null }[]>();
  signedPhotos.forEach((photo) => {
    const list = photoMap.get(photo.submission_id) ?? [];
    list.push({ id: photo.id, url: photo.url });
    photoMap.set(photo.submission_id, list);
  });

  const rows: SubmissionWithPhotos[] = ((submissions ?? []) as Submission[]).map((submission) => ({
    ...submission,
    photos: photoMap.get(submission.id) ?? [],
  }));
  const approvedRows = rows.filter((row) => row.status === "approved");
  const totals = {
    containers: approvedRows.reduce((sum, row) => sum + row.containers_count, 0),
    batteries: approvedRows.reduce((sum, row) => sum + row.estimated_battery_count, 0),
    pending: rows.filter((row) => row.status === "pending").length,
  };

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar active="dashboard" locale={locale} />
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--brand-deep)]">{t.dashboard.panel}</p>
            <h1 className="mt-2 text-4xl font-bold text-[var(--foreground)]">{t.common.dashboard}</h1>
            <p className="mt-2 text-[var(--brand-muted)]">{t.dashboard.subtitle}</p>
          </div>
          <form action={logout}>
            <button className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-2 font-semibold text-[var(--foreground)] hover:border-[var(--brand-primary)]">
              <LogOut size={17} />
              {t.dashboard.logout}
            </button>
          </form>
        </div>

        <Message error={params.error} message={params.message} />

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <MetricCard label={t.dashboard.approvedContainers} value={formatNumber(totals.containers, locale)} />
          <MetricCard label={t.dashboard.approvedBatteries} value={formatNumber(totals.batteries, locale)} />
          <MetricCard label={t.dashboard.pending} value={formatNumber(totals.pending, locale)} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <ProfileForm profile={profile as Profile | null} email={user.email ?? ""} locale={locale} />
          <SubmissionForm locale={locale} />
        </div>

        <section className="brand-panel mt-6 rounded-[24px] p-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">{t.dashboard.mySubmissions}</h2>
          <div className="mt-4 space-y-3">
            {rows.length ? (
              rows.map((submission) => <SubmissionCard key={submission.id} submission={submission} locale={locale} />)
            ) : (
              <p className="rounded-[20px] bg-[var(--background)] p-5 text-[var(--brand-muted)]">
                {t.dashboard.empty}
              </p>
            )}
          </div>
        </section>
      </section>

      <Footer locale={locale} />
    </main>
  );
}

function ProfileForm({ profile, email, locale }: { profile: Profile | null; email: string; locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <form action={updateProfile} className="brand-panel rounded-[24px] p-6">
      <h2 className="text-2xl font-bold text-[var(--foreground)]">{t.dashboard.profile}</h2>
      <p className="mt-1 text-sm text-[var(--brand-muted)]">{t.dashboard.loginEmail}: {email}</p>
      <div className="mt-4 grid gap-4">
        <TextInput label={t.auth.fields.institutionName} name="institution_name" defaultValue={profile?.institution_name} required />
        <label className="block">
          <span className="text-sm font-semibold text-[var(--foreground)]">{t.auth.fields.institutionType}</span>
          <select
            className="focus-ring mt-2 w-full rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_4px_rgb(168_237_194/0.34)]"
            name="institution_type"
            defaultValue={profile?.institution_type ?? "school"}
            required
          >
            {Object.entries(institutionTypeLabelsByLocale[locale]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <TextInput label={t.auth.fields.regionCity} name="region_city" defaultValue={profile?.region_city} required />
        <TextInput label={t.auth.fields.contactPerson} name="contact_person" defaultValue={profile?.contact_person} required />
        <TextInput label={t.auth.fields.contact} name="contact" defaultValue={profile?.contact} required />
      </div>
      <PrimaryButton className="mt-5">{t.common.saveProfile}</PrimaryButton>
    </form>
  );
}

function SubmissionForm({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <form action={createSubmission} className="brand-panel rounded-[24px] p-6">
      <h2 className="text-2xl font-bold text-[var(--foreground)]">{t.dashboard.newSubmission}</h2>
      <p className="mt-1 text-sm text-[var(--brand-muted)]">{t.dashboard.newSubmissionText}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TextInput label={t.dashboard.containersField} name="containers_count" type="number" min="1" required />
        <TextInput label={t.dashboard.batteriesField} name="estimated_battery_count" type="number" min="1" required />
        <TextInput label={t.dashboard.weightField} name="estimated_weight_kg" type="number" step="0.1" min="0" />
        <TextInput label={t.dashboard.dateField} name="collection_date" type="date" required />
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">{t.dashboard.photosField}</span>
          <input
            className="focus-ring mt-2 w-full rounded-[14px] border border-dashed border-[var(--brand-line)] bg-[var(--background)] px-4 py-4 text-[var(--brand-muted)] focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_4px_rgb(168_237_194/0.34)]"
            name="photos"
            type="file"
            accept="image/*"
            multiple
          />
        </label>
      </div>
      <PrimaryButton className="mt-5">{t.common.submitReview}</PrimaryButton>
    </form>
  );
}

function SubmissionCard({ submission, locale }: { submission: SubmissionWithPhotos; locale: Locale }) {
  const t = getDictionary(locale);
  const statusClass = {
    pending: "bg-[var(--brand-mint)] text-[var(--brand-deep)]",
    approved: "bg-[var(--brand-primary)] text-white",
    rejected: "bg-red-50 text-red-800",
  }[submission.status];

  return (
    <article className="rounded-[20px] border border-[var(--brand-line)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-[var(--foreground)]">{new Date(submission.collection_date).toLocaleDateString(locale === "ru" ? "ru-RU" : "uz-UZ")}</p>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">
            {formatNumber(submission.containers_count, locale)} {locale === "ru" ? "конт." : "konteyner"},{" "}
            {formatNumber(submission.estimated_battery_count, locale)} {locale === "ru" ? "батареек" : "batareya"},{" "}
            {formatWeight(submission.estimated_weight_kg, locale)}
          </p>
        </div>
        <span className={`rounded-[12px] px-3 py-1 text-sm font-bold ${statusClass}`}>
          {statusLabelsByLocale[locale][submission.status]}
        </span>
      </div>
      {submission.admin_note ? <p className="mt-3 text-sm text-[var(--brand-muted)]">{t.dashboard.adminNote}: {submission.admin_note}</p> : null}
      {submission.photos.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {submission.photos.map((photo) =>
            photo.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo.id} src={photo.url} alt={t.dashboard.photoAlt} className="h-20 w-24 rounded-[14px] object-cover" />
            ) : null,
          )}
        </div>
      ) : null}
    </article>
  );
}

function Message({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <p className={`mb-5 rounded-[14px] px-4 py-3 text-sm ${error ? "bg-red-50 text-red-800" : "bg-[var(--brand-mint)] text-[var(--brand-deep)]"}`}>
      {error ?? message}
    </p>
  );
}

function SetupMissing({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <section className="brand-panel max-w-lg rounded-[24px] p-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
        <p className="mt-3 text-[var(--brand-muted)]">
          {message}
        </p>
      </section>
    </main>
  );
}
