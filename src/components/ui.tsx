import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitch } from "@/components/language-switch";
import { getDictionary, type Locale } from "@/lib/i18n";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

const buttonStyles = {
  primary:
    "bg-[var(--brand-primary)] text-white shadow-[var(--shadow-button)] hover:bg-[var(--brand-deep)]",
  secondary:
    "border border-[var(--brand-line)] bg-white text-[var(--foreground)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-deep)]",
  ghost: "text-[var(--brand-muted)] hover:bg-white hover:text-[var(--foreground)]",
};

export function ButtonLink({ href, children, variant = "primary", className = "" }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`focus-ring inline-flex min-h-11 items-center justify-center rounded-[14px] px-5 py-3 text-sm font-semibold ${buttonStyles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function PrimaryButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center rounded-[14px] bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] hover:bg-[var(--brand-deep)] ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center rounded-[14px] border border-[var(--brand-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-deep)] ${className}`}
    >
      {children}
    </button>
  );
}

export function Navbar({ active, locale }: { active?: "leaderboard" | "dashboard" | "admin"; locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <header className="border-b border-[var(--brand-line)] bg-[rgb(248_247_242/0.88)] backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <BrandLogo href="/" size="md" />
        <div className="flex flex-wrap items-center justify-end gap-1 text-sm font-medium max-sm:w-full max-sm:justify-start">
          <NavLink href="/leaderboard" active={active === "leaderboard"}>
            {t.nav.leaderboard}
          </NavLink>
          <NavLink href="/dashboard" active={active === "dashboard"}>
            {t.nav.dashboard}
          </NavLink>
          <NavLink href="/admin" active={active === "admin"}>
            {t.nav.admin}
          </NavLink>
          <LanguageSwitch locale={locale} />
          <ButtonLink href="/login" className="ml-2 px-4 py-2" variant="primary">
            {t.nav.login}
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`focus-ring rounded-[14px] px-3 py-2 ${
        active
          ? "bg-white text-[var(--brand-deep)] shadow-sm"
          : "text-[var(--brand-muted)] hover:bg-white hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </Link>
  );
}

export function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  return (
    <footer className="border-t border-[var(--brand-line)] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-[var(--brand-muted)] sm:flex-row sm:items-center sm:justify-between">
        <BrandLogo href="/" size="sm" />
        <p>{t.footer}</p>
      </div>
    </footer>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--brand-deep)]">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-bold tracking-normal text-[var(--foreground)] sm:text-4xl">{title}</h2>
      {text ? <p className="mt-4 text-lg leading-8 text-[var(--brand-muted)]">{text}</p> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="brand-panel rounded-[20px] p-5">
      <p className="text-sm font-semibold text-[var(--brand-muted)]">{label}</p>
      <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">{value}</p>
      {detail ? <p className="mt-2 text-sm text-[var(--brand-muted)]">{detail}</p> : null}
    </div>
  );
}

export const DashboardStatCard = MetricCard;

export function FeatureCard({
  title,
  text,
  marker,
}: {
  title: string;
  text: string;
  marker: string;
}) {
  return (
    <article className="brand-panel rounded-[20px] p-6 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="mb-5 flex size-11 items-center justify-center rounded-[16px] bg-[var(--brand-mint)] text-sm font-bold text-[var(--brand-deep)]">
        {marker}
      </div>
      <h3 className="text-xl font-bold text-[var(--foreground)]">{title}</h3>
      <p className="mt-3 leading-7 text-[var(--brand-muted)]">{text}</p>
    </article>
  );
}

export const UploadCard = FeatureCard;
export const InstitutionProfileCard = FeatureCard;

export function TextInput({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  min,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
      <input
        className="focus-ring mt-2 w-full rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--brand-muted)] focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_4px_rgb(168_237_194/0.34)]"
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        min={min}
        step={step}
      />
    </label>
  );
}
