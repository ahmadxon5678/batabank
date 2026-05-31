import { ArrowDown, ArrowLeft, ArrowRight, BatteryCharging, Camera, CheckCircle2, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ButtonLink, FeatureCard, Footer, MetricCard, Navbar, SectionHeading } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getApprovedStats } from "@/lib/public-stats";

export const dynamic = "force-dynamic";

async function getTotals() {
  const { institutions } = await getApprovedStats();
  return {
    institutions: institutions.length,
    containers: institutions.reduce((sum, item) => sum + item.containers, 0),
    batteries: institutions.reduce((sum, item) => sum + item.batteries, 0),
  };
}

export default async function Home() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const totals = await getTotals();

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)]">
      <Navbar locale={locale} />

      <section className="relative border-b border-[var(--brand-line)]">
        <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[linear-gradient(180deg,#ffffff_0%,#f8f7f2_72%)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-24">
          <div>
            <p className="mb-6 inline-flex rounded-[14px] border border-[var(--brand-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-deep)] shadow-sm">
              {t.home.eyebrow}
            </p>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-normal text-[var(--foreground)] sm:text-7xl">
              {t.home.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--brand-muted)]">
              {t.home.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register">{t.common.join}</ButtonLink>
              <ButtonLink href="/login" variant="secondary">
                {t.common.login}
              </ButtonLink>
              <ButtonLink href="/leaderboard" variant="ghost">
                {t.home.leaderboardCta}
              </ButtonLink>
            </div>
          </div>

          <div className="brand-panel min-w-0 rounded-[24px] p-6 sm:p-8">
            <div className="min-w-0 rounded-[24px] bg-[var(--background)] p-8">
              <div className="flex flex-col items-center text-center">
                <BrandLogo size="lg" />
                {t.home.visualText ? (
                  <p className="mt-5 max-w-md text-base font-medium leading-7 text-[var(--brand-muted)]">
                    {t.home.visualText}
                  </p>
                ) : null}
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <MetricCard label={t.home.metrics.institutions} value={formatNumber(totals.institutions, locale)} />
                <MetricCard label={t.home.metrics.containers} value={formatNumber(totals.containers, locale)} />
                <MetricCard label={t.home.metrics.batteries} value={formatNumber(totals.batteries, locale)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <SectionHeading
          eyebrow={t.home.missionEyebrow}
          title={t.home.missionTitle}
          text={t.home.missionText}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {t.home.features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              marker={`0${index + 1}`}
              title={feature.title}
              text={feature.text}
            />
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="brand-panel overflow-hidden rounded-[24px] p-5 sm:p-8">
            <ProcessDiagram />
          </div>
          <div>
            <SectionHeading
              eyebrow={t.home.processEyebrow}
              title={t.home.processTitle}
              text={t.home.processText}
            />
            <div className="mt-8 grid gap-3">
              {t.home.steps.map((item, index) => (
                <div key={item} className="flex gap-4 rounded-[20px] border border-[var(--brand-line)] bg-[var(--background)] p-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[12px] bg-[var(--brand-mint)] text-sm font-bold text-[var(--brand-deep)]">
                    {index + 1}
                  </span>
                  <p className="font-medium text-[var(--foreground)]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <SectionHeading
          eyebrow={t.home.partnersEyebrow}
          title={t.home.partnersTitle}
          text={t.home.partnersText}
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <PartnerCard
            image="/partners/orikguli-afisha.jpg"
            name={t.home.partners.orikguliName}
            role={t.home.partners.orikguliRole}
            text={t.home.partners.orikguliText}
            imageFit="cover"
          />
          <PartnerCard
            image="/partners/goethe-reference.jpg"
            name={t.home.partners.goetheName}
            role={t.home.partners.goetheRole}
            text={t.home.partners.goetheText}
            imageFit="contain"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="brand-panel rounded-[24px] bg-white p-8 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <SectionHeading
                eyebrow={t.home.ctaEyebrow}
                title={t.home.ctaTitle}
                text={t.home.ctaText}
              />
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <ButtonLink href="/register">{t.home.addInstitution}</ButtonLink>
              <ButtonLink href="/leaderboard" variant="secondary">
                {t.nav.leaderboard}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <Footer locale={locale} />
    </main>
  );
}

function PartnerCard({
  image,
  name,
  role,
  text,
  imageFit,
}: {
  image: string;
  name: string;
  role: string;
  text: string;
  imageFit: "cover" | "contain";
}) {
  return (
    <article className="brand-panel overflow-hidden rounded-[24px] bg-white">
      <div className={`aspect-[16/10] ${imageFit === "contain" ? "bg-white p-8" : "bg-[var(--background)]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={name}
          className={`h-full w-full ${imageFit === "contain" ? "object-contain" : "object-cover"}`}
        />
      </div>
      <div className="p-6">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--brand-deep)]">{role}</p>
        <h3 className="mt-3 text-2xl font-bold text-[var(--foreground)]">{name}</h3>
        {text ? <p className="mt-4 leading-7 text-[var(--brand-muted)]">{text}</p> : null}
      </div>
    </article>
  );
}

function ProcessDiagram() {
  const steps = [
    { label: "1", icon: UserRound, title: "Profil" },
    { label: "2", icon: BatteryCharging, title: "Konteyner" },
    { label: "3", icon: Camera, title: "Foto" },
    { label: "4", icon: CheckCircle2, title: "Tasdiq" },
  ];

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden">
      <div className="grid w-full grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] grid-rows-[auto_32px_auto] items-center gap-2">
        <ProcessStep step={steps[0]} />
        <ArrowRight className="mx-auto text-[var(--brand-deep)]" size={22} strokeWidth={2.4} />
        <ProcessStep step={steps[1]} />

        <div />
        <div />
        <ArrowDown className="mx-auto text-[var(--brand-deep)]" size={22} strokeWidth={2.4} />

        <ProcessStep step={steps[3]} />
        <ArrowLeft className="mx-auto text-[var(--brand-deep)]" size={22} strokeWidth={2.4} />
        <ProcessStep step={steps[2]} />
      </div>
    </div>
  );
}

function ProcessStep({ step }: { step: { label: string; icon: LucideIcon; title: string } }) {
  const Icon = step.icon;

  return (
    <div className="min-w-0 rounded-[20px] border border-[var(--brand-line)] bg-[var(--background)] p-3 text-center sm:p-4">
      <div className="mx-auto flex size-11 items-center justify-center rounded-[16px] bg-[var(--brand-mint)] text-[var(--brand-deep)] sm:size-12">
        <Icon size={22} strokeWidth={2.4} />
      </div>
      <div className="mt-3 inline-flex size-7 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-bold text-white">
        {step.label}
      </div>
      <p className="mt-2 text-xs font-bold leading-tight text-[var(--foreground)] sm:text-sm">{step.title}</p>
    </div>
  );
}
