export const typography = {
  display: {
    fontSize: "3rem",
    lineHeight: "1.05",
    fontWeight: "800",
    letterSpacing: "-0.03em",
  },
  heading: {
    fontSize: "2rem",
    lineHeight: "1.15",
    fontWeight: "700",
    letterSpacing: "-0.02em",
  },
  title: {
    fontSize: "1.25rem",
    lineHeight: "1.3",
    fontWeight: "600",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: "1rem",
    lineHeight: "1.45",
    fontWeight: "500",
    letterSpacing: "0",
  },
  body: {
    fontSize: "0.9375rem",
    lineHeight: "1.6",
    fontWeight: "400",
    letterSpacing: "0",
  },
  caption: {
    fontSize: "0.75rem",
    lineHeight: "1.45",
    fontWeight: "500",
    letterSpacing: "0.02em",
  },
} as const;

export type TypographyVariant = keyof typeof typography;

export const typographyClass: Record<TypographyVariant, string> = {
  display: "text-5xl font-extrabold tracking-tight",
  heading: "text-3xl font-bold tracking-tight",
  title: "text-xl font-semibold",
  subtitle: "text-base font-medium text-slate-300",
  body: "text-[15px] leading-relaxed text-slate-300",
  caption: "text-xs font-medium tracking-wide text-slate-400",
};
