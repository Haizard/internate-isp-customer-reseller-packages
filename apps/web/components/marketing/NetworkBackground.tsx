"use client";

/**
 * Renders a fixed-position circuit-board grid background.
 * Uses an inline SVG pattern that is guaranteed to render
 * regardless of CSS bundling or Tailwind configuration.
 */
export function NetworkBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          {/* Grid pattern: horizontal + vertical lines + node dots */}
          <pattern
            id="networkGrid"
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            {/* Horizontal line */}
            <line x1="0" y1="60" x2="60" y2="60" stroke="rgba(10, 132, 255, 0.08)" strokeWidth="1" />
            {/* Vertical line */}
            <line x1="60" y1="0" x2="60" y2="60" stroke="rgba(10, 132, 255, 0.08)" strokeWidth="1" />
            {/* Node dot at intersection */}
            <circle cx="60" cy="60" r="2" fill="rgba(10, 132, 255, 0.12)" />
            {/* Smaller dot in center of cell */}
            <circle cx="30" cy="30" r="1" fill="rgba(10, 132, 255, 0.06)" />
          </pattern>
          {/* Diagonal circuit traces */}
          <pattern
            id="circuitTraces"
            x="0"
            y="0"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="60" y2="60" stroke="rgba(10, 132, 255, 0.03)" strokeWidth="1" />
            <line x1="120" y1="0" x2="60" y2="60" stroke="rgba(10, 132, 255, 0.03)" strokeWidth="1" />
            <line x1="60" y1="60" x2="120" y2="120" stroke="rgba(10, 132, 255, 0.03)" strokeWidth="1" />
            <circle cx="60" cy="60" r="3" fill="rgba(10, 132, 255, 0.05)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#networkGrid)" />
        <rect width="100%" height="100%" fill="url(#circuitTraces)" />
      </svg>
    </div>
  );
}
