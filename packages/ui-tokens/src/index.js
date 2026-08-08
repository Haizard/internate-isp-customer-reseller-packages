export const colors = {
  bgBase: "#F2F4F8",
  bgGradient: "linear-gradient(160deg, #F6F8FC 0%, #ECEFF6 45%, #E7EBF5 100%)",
  bgElevated: "#FFFFFF",
  accentBlue: "#0A84FF",
  accentGreen: "#30D158",
  accentOrange: "#FF9F0A",
  accentRed: "#FF453A",
  accentPurple: "#BF5AF2",
  accentTeal: "#40C8E0",
  textPrimary: "#1C1C1E",
  textSecondary: "#6E6E73",
  textTertiary: "#AEAEB2",
  textOnAccent: "#FFFFFF",
  statusActive: "#30D158",
  statusPending: "#FF9F0A",
  statusSuspended: "#FF453A",
  statusOffline: "#8E8E93",
} as const;

export const glass = {
  surface: "rgba(255, 255, 255, 0.55)",
  surfaceStrong: "rgba(255, 255, 255, 0.72)",
  surfaceSubtle: "rgba(255, 255, 255, 0.35)",
  border: "rgba(255, 255, 255, 0.6)",
  blur: "blur(20px)",
  blurStrong: "blur(32px)",
} as const;

export const radius = {
  sm: "10px",
  md: "16px",
  lg: "20px",
  xl: "28px",
  pill: "999px",
} as const;

export const shadow = {
  sm: "0 1px 2px rgba(30, 41, 59, 0.04), 0 1px 1px rgba(30, 41, 59, 0.03)",
  md: "0 8px 24px rgba(30, 41, 59, 0.08)",
  lg: "0 16px 40px rgba(30, 41, 59, 0.12)",
} as const;

export const typography = {
  largeTitle: "34px",
  title1: "28px",
  title2: "22px",
  title3: "20px",
  body: "17px",
  callout: "15px",
  footnote: "13px",
  caption: "12px",
} as const;

export const space = {
  s1: "4px",
  s2: "8px",
  s3: "12px",
  s4: "16px",
  s5: "20px",
  s6: "24px",
  s7: "32px",
  s8: "40px",
} as const;
