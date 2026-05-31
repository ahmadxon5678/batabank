import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { reviewInstitution, reviewSubmission, updatePickupStatus } from "@/app/actions";
import { Footer, Navbar, SectionHeading } from "@/components/ui";
import { getBadgeForContainers } from "@/lib/badges";
import { formatNumber, formatWeight } from "@/lib/format";
import { getLocale, institutionTypeLabelsByLocale, type Locale } from "@/lib/i18n";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/server";
import type { PickupStatus, Profile, Submission, SubmissionPhoto } from "@/lib/types";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

type SubmissionRow = Submission & {
  profiles: Pick<Profile, "institution_name" | "institution_type" | "region_city" | "contact_person" | "contact"> | null;
  submission_photos: SubmissionPhoto[];
  signedPhotos: { id: string; url: string | null }[];
};

type ProfileWithTotals = Profile & {
  approvedContainers: number;
};

const pickupLabels: Record<PickupStatus, string> = {
  not_requested: "So'ralmagan",
  requested: "So'ralgan",
  scheduled: "Rejalashtirilgan",
  picked_up: "Olib ketilgan",
  delivered_to_partner: "Hamkorga topshirilgan",
  cancelled: "Bekor qilingan",
};

export default async function AdminPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const params = await searchParams;

  if (!hasSupabaseEnv()) return <SetupMissing />;

  const gate = (await cookies()).get("batabank-admin-gate")?.value;
  if (gate !== "unlocked") redirect("/?error=Admin panel uchun logo orqali maxfiy kirishni oching");

  if (!hasSupabaseAdminEnv()) redirect("/?error=SUPABASE_SERVICE_ROLE_KEY Railway sozlamasiga kiritilmagan");

  const supabase = createAdminClient();

  const { data: pendingProfiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });

  const { data: allApprovedProfiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("approval_status", "approved")
    .eq("role", "institution")
    .order("approved_at", { ascending: true });

  const { data: allApprovedSubmissions } = await supabase
    .from("submissions")
    .select("profile_id, containers_count")
    .eq("status", "approved");

  const containerTotals = new Map<string, number>();
  ((allApprovedSubmissions ?? []) as Pick<Submission, "profile_id" | "containers_count">[]).forEach((row) => {
    containerTotals.set(row.profile_id, (containerTotals.get(row.profile_id) ?? 0) + row.containers_count);
  });

  const approvedProfiles: ProfileWithTotals[] = ((allApprovedProfiles ?? []) as Profile[]).map((item) => ({
    ...item,
    approvedContainers: containerTotals.get(item.id) ?? 0,
  }));

  const inactive = approvedProfiles.filter((item) => {
    const start = new Date(item.approved_at ?? item.created_at).getTime();
    const days = Math.floor((Date.now() - start) / 86_400_000);
    return days >= 150 && item.approvedContainers === 0;
  });

  const pendingRequests = await getSubmissionRows(supabase, "pending");
  const reviewedRequests = await getReviewedRows(supabase);
  const pickupRows = reviewedRequests.filter((row) => row.pickup_status !== "not_requested" && row.pickup_status !== "delivered_to_partner");

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar active="admin" locale={locale} />

      <section className="mx-auto max-w-6xl px-5 py-10">
        <SectionHeading
          eyebrow="Moderatsiya"
          title="Admin panel"
          text="Tashkilot arizalari, to'lgan konteyner so'rovlari, dalillar va olib ketish jarayonini boshqaring."
        />
        <Message error={params.error} message={params.message} />

        <AdminSection title="Tashkilot arizalari" empty="Hozir pending tashkilot arizasi yo'q.">
          {((pendingProfiles ?? []) as Profile[]).map((item) => (
            <InstitutionApplicationCard key={item.id} profile={item} locale={locale} />
          ))}
        </AdminSection>

        <AdminSection title="Pending to'lgan konteyner so'rovlari" empty="Hozir pending konteyner so'rovi yo'q.">
          {pendingRequests.map((submission) => (
            <RequestCard key={submission.id} submission={submission} locale={locale} />
          ))}
        </AdminSection>

        <AdminSection title="Olib ketish navbati" empty="Hozir olib ketish bo'yicha ochiq so'rov yo'q.">
          {pickupRows.map((submission) => (
            <PickupCard key={submission.id} submission={submission} />
          ))}
        </AdminSection>

        <AdminSection title="150+ kun faol bo'lmagan tashkilotlar" empty="Hozir 150+ kun faol bo'lmagan tasdiqlangan tashkilot yo'q.">
          {inactive.map((item) => (
            <InactiveCard key={item.id} profile={item} />
          ))}
        </AdminSection>

        <AdminSection title="So'nggi ko'rib chiqilgan so'rovlar" empty="Hali ko'rib chiqilgan so'rovlar yo'q.">
          {reviewedRequests.slice(0, 6).map((submission) => (
            <ReviewedCard key={submission.id} submission={submission} locale={locale} />
          ))}
        </AdminSection>
      </section>

      <Footer locale={locale} />
    </main>
  );
}

async function getSubmissionRows(supabase: ReturnType<typeof createAdminClient>, status: "pending") {
  const { data } = await supabase
    .from("submissions")
    .select("*, profiles(institution_name, institution_type, region_city, contact_person, contact), submission_photos(*)")
    .eq("status", status)
    .order("created_at", { ascending: true });

  return signRows(supabase, (data ?? []) as unknown as SubmissionRow[]);
}

async function getReviewedRows(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase
    .from("submissions")
    .select("*, profiles(institution_name, institution_type, region_city, contact_person, contact), submission_photos(*)")
    .neq("status", "pending")
    .order("reviewed_at", { ascending: false })
    .limit(20);

  return signRows(supabase, (data ?? []) as unknown as SubmissionRow[]);
}

async function signRows(supabase: ReturnType<typeof createAdminClient>, rows: SubmissionRow[]) {
  return Promise.all(
    rows.map(async (submission) => {
      const signedPhotos = await Promise.all(
        (submission.submission_photos ?? []).map(async (photo) => {
          const { data: signed } = await supabase.storage.from("collection-photos").createSignedUrl(photo.storage_path, 3600);
          return { id: photo.id, url: signed?.signedUrl ?? null };
        }),
      );
      return { ...submission, signedPhotos };
    }),
  );
}

function AdminSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] | React.ReactNode }) {
  const list = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasItems = Array.isArray(list) ? list.length > 0 : Boolean(list);
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold text-[var(--foreground)]">{title}</h2>
      <div className="mt-4 space-y-4">
        {hasItems ? list : <p className="brand-panel rounded-[24px] p-6 text-[var(--brand-muted)]">{empty}</p>}
      </div>
    </section>
  );
}

function InstitutionApplicationCard({ profile, locale }: { profile: Profile; locale: Locale }) {
  return (
    <article className="brand-panel rounded-[24px] p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <h3 className="text-2xl font-bold text-[var(--foreground)]">{profile.institution_name}</h3>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">
            {institutionTypeLabelsByLocale[locale][profile.institution_type]} · {profile.region_city}
          </p>
          <p className="mt-3 text-sm text-[var(--brand-muted)]">
            Mas'ul: {profile.contact_person} · Aloqa: {profile.contact}
          </p>
          <p className="mt-2 text-sm text-[var(--brand-muted)]">
            Ariza sanasi: {new Date(profile.created_at).toLocaleDateString("uz-UZ")}
          </p>
        </div>
        <form action={reviewInstitution} className="grid gap-3">
          <input type="hidden" name="profile_id" value={profile.id} />
          <input className="focus-ring rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-3" name="approval_note" placeholder="Ixtiyoriy izoh" />
          <div className="grid grid-cols-2 gap-2">
            <button className="focus-ring rounded-[14px] border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-800 hover:bg-red-50" name="decision" value="rejected">
              Rad etish
            </button>
            <button className="focus-ring rounded-[14px] bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] hover:bg-[var(--brand-deep)]" name="decision" value="approved">
              Tasdiqlash
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}

function RequestCard({ submission, locale }: { submission: SubmissionRow; locale: Locale }) {
  return (
    <article className="brand-panel rounded-[24px] p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div>
          <h3 className="text-2xl font-bold text-[var(--foreground)]">{submission.profiles?.institution_name ?? "Noma'lum tashkilot"}</h3>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">
            {submission.profiles ? institutionTypeLabelsByLocale[locale][submission.profiles.institution_type] : "-"} · {submission.profiles?.region_city ?? "-"}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Konteyner" value={formatNumber(submission.containers_count, locale)} />
            <Metric label="Batareya" value={formatNumber(submission.estimated_battery_count, locale)} />
            <Metric label="Vazn" value={formatWeight(submission.estimated_weight_kg, locale)} />
          </dl>
          <p className="mt-4 text-sm text-[var(--brand-muted)]">
            Sana: {new Date(submission.collection_date).toLocaleDateString("uz-UZ")} · Mas'ul: {submission.profiles?.contact_person ?? "-"} · Aloqa: {submission.profiles?.contact ?? "-"}
          </p>
          {submission.message ? <p className="mt-3 text-sm text-[var(--brand-muted)]">Xabar: {submission.message}</p> : null}
          {submission.pickup_requested ? (
            <p className="mt-3 rounded-[14px] bg-[var(--background)] p-3 text-sm text-[var(--brand-muted)]">
              Olib ketish: {pickupLabels[submission.pickup_status]} · {submission.pickup_address ?? ""} {submission.pickup_note ?? ""}
            </p>
          ) : null}

          <form action={reviewSubmission} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input type="hidden" name="submission_id" value={submission.id} />
            <input className="focus-ring rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-3" name="admin_note" placeholder="Ixtiyoriy admin izohi" />
            <button className="focus-ring rounded-[14px] border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-800 hover:bg-red-50" name="decision" value="rejected">
              Rad etish
            </button>
            <button className="focus-ring rounded-[14px] bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] hover:bg-[var(--brand-deep)]" name="decision" value="approved">
              Tasdiqlash
            </button>
          </form>
        </div>
        <PhotoGrid submission={submission} />
      </div>
    </article>
  );
}

function PickupCard({ submission }: { submission: SubmissionRow }) {
  return (
    <article className="brand-panel rounded-[24px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-[var(--foreground)]">{submission.profiles?.institution_name ?? "Noma'lum tashkilot"}</h3>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">{submission.profiles?.region_city ?? "-"} · {submission.pickup_address ?? "Manzil kiritilmagan"}</p>
          <p className="mt-2 text-sm text-[var(--brand-muted)]">Holat: {pickupLabels[submission.pickup_status]}</p>
        </div>
        <form action={updatePickupStatus} className="flex flex-wrap gap-2">
          <input type="hidden" name="submission_id" value={submission.id} />
          <select className="focus-ring rounded-[14px] border border-[var(--brand-line)] bg-white px-3 py-2" name="pickup_status" defaultValue={submission.pickup_status}>
            {Object.entries(pickupLabels)
              .filter(([value]) => value !== "not_requested")
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
          <button className="focus-ring rounded-[14px] bg-[var(--brand-primary)] px-4 py-2 text-sm font-bold text-white">Saqlash</button>
        </form>
      </div>
    </article>
  );
}

function InactiveCard({ profile }: { profile: ProfileWithTotals }) {
  const start = new Date(profile.approved_at ?? profile.created_at);
  const days = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return (
    <article className="brand-panel rounded-[24px] p-6">
      <h3 className="text-xl font-bold text-[var(--foreground)]">{profile.institution_name}</h3>
      <p className="mt-1 text-sm text-[var(--brand-muted)]">
        {profile.region_city} · {days} kundan beri tasdiqlangan, lekin bitta ham konteyner so'rovi tasdiqlanmagan.
      </p>
      <p className="mt-2 text-sm text-[var(--brand-muted)]">Mas'ul: {profile.contact_person} · Aloqa: {profile.contact}</p>
    </article>
  );
}

function ReviewedCard({ submission, locale }: { submission: SubmissionRow; locale: Locale }) {
  const statusTone = submission.status === "approved" ? "bg-[var(--brand-primary)] text-white" : "bg-red-50 text-red-800";
  const badge = getBadgeForContainers(submission.containers_count);
  return (
    <article className="rounded-[20px] border border-[var(--brand-line)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[var(--foreground)]">{submission.profiles?.institution_name ?? "Noma'lum tashkilot"}</h3>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">
            {formatNumber(submission.containers_count, locale)} konteyner · {formatNumber(submission.estimated_battery_count, locale)} batareya · {badge.label}
          </p>
        </div>
        <span className={`rounded-[12px] px-3 py-1 text-sm font-bold ${statusTone}`}>{submission.status === "approved" ? "Tasdiqlangan" : "Rad etilgan"}</span>
      </div>
      {submission.admin_note ? <p className="mt-3 text-sm text-[var(--brand-muted)]">Admin izohi: {submission.admin_note}</p> : null}
    </article>
  );
}

function PhotoGrid({ submission }: { submission: SubmissionRow }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
      {submission.signedPhotos.length ? (
        submission.signedPhotos.map((photo) =>
          photo.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={photo.id} src={photo.url} alt="Pending yig'im fotosurati" className="h-32 w-full rounded-[16px] object-cover" />
          ) : null,
        )
      ) : (
        <div className="rounded-[16px] bg-[var(--background)] p-4 text-sm text-[var(--brand-muted)]">Foto yuklanmagan</div>
      )}
    </div>
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

function SetupMissing() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <section className="brand-panel max-w-lg rounded-[24px] p-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Admin panel</h1>
        <p className="mt-3 text-[var(--brand-muted)]">
          Supabase ulanishi uchun `.env.local` sozlang.
        </p>
      </section>
    </main>
  );
}
