import Link from "next/link";
import type { CSSProperties } from "react";

type BrandLogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

const sizes = {
  sm: "footer-logo",
  md: "nav-logo",
  lg: "hero-logo",
};

const logoStyles: Record<NonNullable<BrandLogoProps["size"]>, CSSProperties> = {
  sm: { display: "block", width: "var(--footer-logo-width, 280px)", maxWidth: "80vw", height: "auto", objectFit: "contain", background: "transparent" },
  md: { display: "block", width: "auto", height: "var(--nav-logo-height, 54px)", objectFit: "contain", background: "transparent" },
  lg: { display: "block", width: "100%", maxWidth: "360px", height: "auto", objectFit: "contain", background: "transparent" },
};

export function BrandLogo({ href, size = "md", className = "" }: BrandLogoProps) {
  const content = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/batabank-logo-transparent.png"
      alt="BataBank"
      className={`${sizes[size]} ${className}`}
      style={logoStyles[size]}
    />
  );

  if (!href) return content;

  return (
    <Link href={href} className="logo-link focus-ring rounded-[14px]">
      {content}
    </Link>
  );
}
