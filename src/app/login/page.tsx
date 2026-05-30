import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitch } from "@/components/language-switch";
import { PrimaryButton, TextInput } from "@/components/ui";
import { loginInstitution } from "@/app/actions";
import { getDictionary, getLocale } from "@/lib/i18n";

type PageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const params = await searchParams;

  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[0.92fr_1.08fr]">
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-[24px] border border-[var(--brand-line)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-4">
            <BrandLogo href="/" size="md" />
            <LanguageSwitch locale={locale} />
          </div>
          <div className="mt-10">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">{t.auth.loginTitle}</h1>
            <p className="mt-3 leading-7 text-[var(--brand-muted)]">
              {t.auth.loginText}
            </p>
          </div>

          <Message error={params.error} message={params.message} />

          <form action={loginInstitution} className="mt-6 space-y-4">
            <TextInput label={t.auth.fields.email} name="email" type="email" required />
            <TextInput label={t.auth.fields.password} name="password" type="password" required />
            <PrimaryButton className="w-full">{t.nav.login}</PrimaryButton>
          </form>

          <p className="mt-6 text-sm text-[var(--brand-muted)]">
            {t.auth.noAccount}{" "}
            <Link className="font-semibold text-[var(--brand-deep)]" href="/register">
              {t.auth.addInstitution}
            </Link>
          </p>
        </div>
      </section>
      <section className="hidden items-center justify-center border-l border-[var(--brand-line)] bg-white px-10 lg:flex">
        <div className="max-w-lg">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--brand-deep)]">BataBank</p>
          <h2 className="mt-4 text-5xl font-bold leading-tight text-[var(--foreground)]">
            {t.auth.loginSideTitle}
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--brand-muted)]">
            {t.auth.loginSideText}
          </p>
        </div>
      </section>
    </main>
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
