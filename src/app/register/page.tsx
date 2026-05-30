import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitch } from "@/components/language-switch";
import { PrimaryButton, TextInput } from "@/components/ui";
import { registerInstitution } from "@/app/actions";
import { getDictionary, getLocale, institutionTypeLabelsByLocale } from "@/lib/i18n";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8">
      <section className="mx-auto max-w-4xl rounded-[24px] border border-[var(--brand-line)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BrandLogo href="/" size="md" />
          <div className="flex items-center gap-2">
            <LanguageSwitch locale={locale} />
            <Link className="focus-ring rounded-[14px] px-4 py-2 text-sm font-semibold text-[var(--brand-muted)] hover:bg-[var(--background)]" href="/login">
              {t.nav.login}
            </Link>
          </div>
        </div>
        <div className="mt-10 max-w-2xl">
          <h1 className="text-4xl font-bold text-[var(--foreground)]">{t.auth.registerTitle}</h1>
          <p className="mt-4 text-lg leading-8 text-[var(--brand-muted)]">
            {t.auth.registerText}
          </p>
        </div>

        {params.error ? (
          <p className="mt-5 rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-800">{params.error}</p>
        ) : null}

        <form action={registerInstitution} className="mt-8 grid gap-5 sm:grid-cols-2">
          <TextInput label={t.auth.fields.institutionName} name="institution_name" required />
          <label className="block">
            <span className="text-sm font-semibold text-[var(--foreground)]">{t.auth.fields.institutionType}</span>
            <select className="focus-ring mt-2 w-full rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-3 text-[var(--foreground)] focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_4px_rgb(168_237_194/0.34)]" name="institution_type" required>
              {Object.entries(institutionTypeLabelsByLocale[locale]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <TextInput label={t.auth.fields.regionCity} name="region_city" required />
          <TextInput label={t.auth.fields.contactPerson} name="contact_person" required />
          <TextInput label={t.auth.fields.contact} name="contact" required />
          <TextInput label={t.auth.fields.email} name="email" type="email" required />
          <TextInput label={t.auth.fields.password} name="password" type="password" required />
          <div className="flex items-end">
            <PrimaryButton className="w-full">{t.auth.registerButton}</PrimaryButton>
          </div>
        </form>
      </section>
    </main>
  );
}
