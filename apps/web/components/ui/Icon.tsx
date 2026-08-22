import type { SVGProps } from "react";

const paths: Record<string, string> = {
  dashboard: "M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 13h7v8H3z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  router: "M4 9h16M4 15h16M10 4a2 2 0 0 1 4 0v2H10zM12 18a2 2 0 0 1 4 0M8 18a2 2 0 1 0 4 0M20 20a2 2 0 0 1-4 0",
  location: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  box: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12",
  wifi: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
  chart: "M3 3v18h18M18 17V9M13 17V5M8 17v-3",
  ticket: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2zM13 5v2M13 17v2M13 11v2",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  logOut: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  plus: "M12 5v14M5 12h14",
  chevronRight: "M9 18l6-6-6-6",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.63a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.45-1.45a2 2 0 0 1 2.11-.45c.85.3 1.73.51 2.63.63A2 2 0 0 1 22 16.92z",
  credit: "M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM1 10h22M7 15h4",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
  search: "M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  menu: "M3 12h18M3 6h18M3 18h18",
  alert: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  check: "M20 6 9 17l-5-5",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  x: "M18 6 6 18M6 6l12 12",
  qr: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
};

export type IconTone = "blue" | "green" | "orange" | "red" | "purple" | "teal" | "gray";

const toneGradients: Record<IconTone, string> = {
  blue: "linear-gradient(135deg, #5aa7ff 0%, #0a84ff 55%, #0063d6 100%)",
  green: "linear-gradient(135deg, #5ddb78 0%, #2fb45c 55%, #1d9c46 100%)",
  orange: "linear-gradient(135deg, #ffc24d 0%, #ff9f0a 55%, #f2761e 100%)",
  red: "linear-gradient(135deg, #ff6b62 0%, #ff453a 55%, #dd2f26 100%)",
  purple: "linear-gradient(135deg, #d88ff7 0%, #bf5af2 55%, #9a34d6 100%)",
  teal: "linear-gradient(135deg, #6fd9ec 0%, #40c8e0 55%, #17a9c9 100%)",
  gray: "linear-gradient(135deg, #c7c7cc 0%, #8e8e93 100%)",
};

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: keyof typeof paths | string;
  size?: number;
  /** "line" renders the classic stroke glyph; "fill" renders a colored gradient tile with a white glyph */
  variant?: "line" | "fill";
  tone?: IconTone;
}

export function Icon({ name, size = 22, variant = "line", tone = "blue", className, style, ...props }: IconProps) {
  const d = paths[name] ?? paths.alert;
  const glyph = (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={variant === "line" ? className : undefined}
      style={variant === "line" ? style : undefined}
      {...props}
    >
      <path d={d} />
    </svg>
  );

  if (variant === "fill") {
    const tileSize = size + 14;
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className ?? ""}`}
        style={{
          width: tileSize,
          height: tileSize,
          borderRadius: Math.max(8, Math.round(size * 0.4)),
          background: toneGradients[tone],
          color: "#ffffff",
          boxShadow: "0 4px 14px rgba(10, 50, 120, 0.22)",
          ...style,
        }}
      >
        {glyph}
      </span>
    );
  }

  return glyph;
}

export { paths as iconPaths };
