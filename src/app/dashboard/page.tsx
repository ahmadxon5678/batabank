import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Lock, LogOut } from "lucide-react";
import { createSubmission, logout, updateProfile } from "@/app/actions";
import { Footer, MetricCard, Navbar, PrimaryButton, TextInput } from "@/components/ui";
import { getBadgeForContainers, getNextBadgeProgress } from "@/lib/badges";
import { formatNumber, formatWeight } from "@/lib/format";
import { getLocale, institutionTypeLabelsByLocale, statusLabelsByLocale, type Locale } from "@/lib/i18n";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { PickupStatus, Profile, Submission, SubmissionPhoto } from "@/lib/types";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

type SubmissionWithPhotos = Submission & {
  photos: { id: string; url: string | null }[];
};

const pickupLabels: Record<PickupStatus, string> = {
  not_requested: "So'ralmagan",
  requested: "So'ralgan",
  scheduled: "Rejalashtirilgan",
  picked_up: "Olib ketilgan",
  delivered_to_partner: "Hamkorga topshirilgan",
  cancelled: "Bekor qilingan",
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const params = await searchParams;

  if (!hasSupabaseEnv()) {
    return <SetupMissing />;
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
  const profileRow = profile as Profile | null;
  const approvedRows = rows.filter((row) => row.status === "approved");
  const totals = {
    containers: approvedRows.reduce((sum, row) => sum + row.containers_count, 0),
    batteries: approvedRows.reduce((sum, row) => sum + row.estimated_battery_count, 0),
    pending: rows.filter((row) => row.status === "pending").length,
  };
  const notifications = getNotifications(profileRow, rows);
  const approved = profileRow?.approval_status === "approved";

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar active="dashboard" locale={locale} notifications={notifications} />
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--brand-deep)]">Tashkilot kabineti</p>
            <h1 className="mt-2 text-4xl font-bold text-[var(--foreground)]">Kabinet</h1>
            <p className="mt-2 text-[var(--brand-muted)]">Ariza, to'lgan konteyner so'rovlari va nishonlaringizni boshqaring.</p>
          </div>
          <form action={logout}>
            <button className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-2 font-semibold text-[var(--foreground)] hover:border-[var(--brand-primary)]">
              <LogOut size={17} />
              Chiqish
            </button>
          </form>
        </div>

        <Message error={params.error} message={params.message} />
        <ApprovalStatus profile={profileRow} />

        <div className="mb-5 mt-5 grid gap-4 md:grid-cols-3">
          <MetricCard label="Tasdiqlangan konteynerlar" value={formatNumber(totals.containers, locale)} />
          <MetricCard label="Tasdiqlangan batareyalar" value={formatNumber(totals.batteries, locale)} />
          <MetricCard label="Ko'rib chiqilmoqda" value={formatNumber(totals.pending, locale)} />
        </div>

        {approved ? <BadgeCard totalContainers={totals.containers} /> : <LockedBenefits />}

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <ProfileForm profile={profileRow} email={user.email ?? ""} locale={locale} />
          {approved ? <SubmissionForm /> : <LockedRequestForm />}
        </div>

        <section className="brand-panel mt-6 rounded-[24px] p-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Mening to'lgan konteyner so'rovlarim</h2>
          <div className="mt-4 space-y-3">
            {rows.length ? (
              rows.map((submission) => <SubmissionCard key={submission.id} submission={submission} locale={locale} />)
            ) : (
              <p className="rounded-[20px] bg-[var(--background)] p-5 text-[var(--brand-muted)]">
                Hali so'rov yuborilmagan.
              </p>
            )}
          </div>
        </section>
      </section>

      <Footer locale={locale} />
    </main>
  );
}

function getNotifications(profile: Profile | null, rows: Submission[]) {
  const messages: string[] = [];
  if (profile?.approval_status === "pending") {
    messages.push("Sizning arizangiz admin tomonidan ko'rib chiqilmoqda.");
  }
  if (profile?.approval_status === "approved") {
    messages.push("Tashkilotingiz tasdiqlandi. Endi to'lgan konteyner bo'yicha so'rov yuborishingiz mumkin.");
  }
  if (profile?.approval_status === "rejected") {
    messages.push("Arizangiz rad etildi. Admin izohini dashboardda ko'ring.");
  }
  if (rows.some((row) => row.status === "pending")) {
    messages.push("To'lgan konteyner so'rovingiz admin tekshiruvida.");
  }
  if (rows.some((row) => row.pickup_status === "requested")) {
    messages.push("Konteyner olib ketish so'rovi kutilmoqda.");
  }
  return messages;
}

function ApprovalStatus({ profile }: { profile: Profile | null }) {
  if (!profile) return null;
  const tone = {
    pending: "bg-[var(--brand-mint)] text-[var(--brand-deep)]",
    approved: "bg-[var(--brand-primary)] text-white",
    rejected: "bg-red-50 text-red-800",
  }[profile.approval_status];
  const text = {
    pending: "Sizning arizangiz admin tomonidan ko'rib chiqilmoqda.",
    approved: "Tashkilotingiz tasdiqlangan. Endi to'lgan konteyner so'rovlarini yuborishingiz mumkin.",
    rejected: "Arizangiz rad etilgan. Kerak bo'lsa, profilni yangilab admin bilan bog'laning.",
  }[profile.approval_status];

  return (
    <section className={`rounded-[20px] px-5 py-4 font-medium ${tone}`}>
      {text}
      {profile.approval_note ? <span className="block pt-2 text-sm opacity-90">Admin izohi: {profile.approval_note}</span> : null}
    </section>
  );
}

function BadgeCard({ totalContainers }: { totalContainers: number }) {
  const badge = getBadgeForContainers(totalContainers);
  const progress = getNextBadgeProgress(totalContainers);

  return (
    <section className="brand-panel rounded-[24px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--brand-deep)]">Nishon va sertifikat</p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--foreground)]">Joriy nishon: {badge.label}</h2>
          <p className="mt-2 text-[var(--brand-muted)]">
            Tasdiqlangan konteynerlar: {totalContainers}. {progress.text}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-2 rounded-[16px] px-4 py-2 text-sm font-bold ${badge.tone}`}>
            <Award size={18} />
            {badge.label}
          </span>
          <Link className="focus-ring rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--foreground)] hover:border-[var(--brand-primary)]" href="/dashboard/certificate">
            Sertifikat
          </Link>
        </div>
      </div>
    </section>
  );
}

function LockedBenefits() {
  return (
    <section className="brand-panel rounded-[24px] p-6">
      <div className="flex gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[16px] bg-[var(--brand-mint)] text-[var(--brand-deep)]">
          <Lock size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Tasdiqdan keyin ochiladi</h2>
          <p className="mt-2 text-[var(--brand-muted)]">
            Admin tasdiqlagandan so'ng to'lgan konteyner so'rovlari, nishonlar, sertifikat va reytingda ishtirok etish imkoniyati ochiladi.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProfileForm({ profile, email, locale }: { profile: Profile | null; email: string; locale: Locale }) {
  return (
    <form action={updateProfile} className="brand-panel rounded-[24px] p-6">
      <h2 className="text-2xl font-bold text-[var(--foreground)]">Profil</h2>
      <p className="mt-1 text-sm text-[var(--brand-muted)]">Login email: {email}</p>
      <div className="mt-4 grid gap-4">
        <TextInput label="Tashkilot nomi" name="institution_name" defaultValue={profile?.institution_name} required />
        <label className="block">
          <span className="text-sm font-semibold text-[var(--foreground)]">Tashkilot turi</span>
          <select
            className="focus-ring mt-2 w-full rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)]"
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
        <TextInput label="Hudud/shahar" name="region_city" defaultValue={profile?.region_city} required />
        <TextInput label="Mas'ul shaxs" name="contact_person" defaultValue={profile?.contact_person} required />
        <TextInput label="Telefon yoki qo'shimcha email" name="contact" defaultValue={profile?.contact} required />
      </div>
      <PrimaryButton className="mt-5">Profilni saqlash</PrimaryButton>
    </form>
  );
}

function SubmissionForm() {
  return (
    <form action={createSubmission} className="brand-panel rounded-[24px] p-6">
      <h2 className="text-2xl font-bold text-[var(--foreground)]">Yangi to'lgan konteyner so'rovi</h2>
      <p className="mt-1 text-sm text-[var(--brand-muted)]">Konteyner to'lganda sonlar, izoh va isbot fotosuratlarini yuboring.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TextInput label="To'lgan xavfsiz konteynerlar" name="containers_count" type="number" min="1" required />
        <TextInput label="Taxminiy batareya soni" name="estimated_battery_count" type="number" min="1" required />
        <TextInput label="Taxminiy vazn, kg" name="estimated_weight_kg" type="number" step="0.1" min="0" />
        <TextInput label="Yig'im sanasi" name="collection_date" type="date" required />
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">Adminga xabar</span>
          <textarea
            className="focus-ring mt-2 min-h-24 w-full rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)]"
            name="message"
            placeholder="Masalan: 2 ta konteyner to'ldi, suratlar ilova qilindi."
          />
        </label>
        <label className="flex items-center gap-3 rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-3 sm:col-span-2">
          <input name="pickup_requested" type="checkbox" />
          <span className="text-sm font-semibold text-[var(--foreground)]">Konteynerni olib ketish kerak</span>
        </label>
        <TextInput label="Olib ketish manzili" name="pickup_address" />
        <TextInput label="Olib ketish izohi" name="pickup_note" />
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">Isbot fotosuratlari</span>
          <input
            className="focus-ring mt-2 w-full rounded-[14px] border border-dashed border-[var(--brand-line)] bg-[var(--background)] px-4 py-4 text-[var(--brand-muted)] focus:border-[var(--brand-primary)]"
            name="photos"
            type="file"
            accept="image/*"
            multiple
          />
          <span className="mt-2 block text-xs text-[var(--brand-muted)]">Foto yuklash majburiy emas, lekin admin tasdiqlashi uchun kuchli dalil bo'ladi.</span>
        </label>
      </div>
      <PrimaryButton className="mt-5">Tekshiruvga yuborish</PrimaryButton>
    </form>
  );
}

function LockedRequestForm() {
  return (
    <section className="brand-panel rounded-[24px] p-6">
      <h2 className="text-2xl font-bold text-[var(--foreground)]">To'lgan konteyner so'rovi yopiq</h2>
      <p className="mt-2 leading-7 text-[var(--brand-muted)]">
        Bu forma faqat admin tasdiqlagan tashkilotlar uchun ochiladi. Hozircha profilingizni to'liq va aniq saqlang.
      </p>
    </section>
  );
}

function SubmissionCard({ submission, locale }: { submission: SubmissionWithPhotos; locale: Locale }) {
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
            {formatNumber(submission.containers_count, locale)} konteyner, {formatNumber(submission.estimated_battery_count, locale)} batareya,{" "}
            {formatWeight(submission.estimated_weight_kg, locale)}
          </p>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">Olib ketish: {pickupLabels[submission.pickup_status]}</p>
        </div>
        <span className={`rounded-[12px] px-3 py-1 text-sm font-bold ${statusClass}`}>
          {statusLabelsByLocale[locale][submission.status]}
        </span>
      </div>
      {submission.message ? <p className="mt-3 text-sm text-[var(--brand-muted)]">Xabar: {submission.message}</p> : null}
      {submission.admin_note ? <p className="mt-3 text-sm text-[var(--brand-muted)]">Admin izohi: {submission.admin_note}</p> : null}
      {submission.photos.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {submission.photos.map((photo) =>
            photo.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo.id} src={photo.url} alt="Yig'im fotosurati" className="h-20 w-24 rounded-[14px] object-cover" />
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

function SetupMissing() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5">
      <section className="brand-panel max-w-lg rounded-[24px] p-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Kabinet</h1>
        <p className="mt-3 text-[var(--brand-muted)]">
          Supabase ulanishi uchun `.env.local` sozlang. Kerakli nomlar `.env.example` faylida bor.
        </p>
      </section>
    </main>
  );
}
