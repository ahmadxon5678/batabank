import type { Locale } from "@/lib/i18n";

export function formatNumber(value: number, locale: Locale = "uz") {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "uz-UZ").format(value);
}

export function formatWeight(value: number | null | undefined, locale: Locale = "uz") {
  if (!value) return "-";
  return `${new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "uz-UZ", { maximumFractionDigits: 1 }).format(value)} kg`;
}

export function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getNumber(formData: FormData, key: string) {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) ? value : 0;
}
