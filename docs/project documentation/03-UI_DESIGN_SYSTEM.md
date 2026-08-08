# UI Design System — iOS-Native Glassmorphism

## 1. Design Direction
The app must feel like a **native iOS app running on a light, airy, translucent canvas** —
never a dark dashboard. On desktop it should feel like an iPadOS/macOS "big screen" native app;
on mobile it should be close enough to iOS that a user glancing at it can't immediately tell
it's a website. Every page, container, form, button, and card follows the **same** tokens below
— nothing is one-off.

## 2. Color Tokens

### 2.1 Background (never black / never dark)
```css
--bg-base: #F2F4F8;              /* app canvas, soft cool gray */
--bg-gradient: linear-gradient(160deg, #F6F8FC 0%, #ECEFF6 45%, #E7EBF5 100%);
--bg-elevated: #FFFFFF;          /* solid white, used behind glass when extra contrast needed */
```
The app root always uses `--bg-gradient`. Never `#000`, never `#111827`-style dark grays as a
page background — those are reserved (sparingly) for text only.

### 2.2 Glass Surfaces
```css
--glass-surface: rgba(255, 255, 255, 0.55);
--glass-surface-strong: rgba(255, 255, 255, 0.72);
--glass-surface-subtle: rgba(255, 255, 255, 0.35);
--glass-border: rgba(255, 255, 255, 0.6);
--glass-blur: blur(20px);
--glass-blur-strong: blur(32px);
```
Rule: any "card", "panel", "sidebar", "modal", "tab bar", or "top bar" is a glass surface:
`background: var(--glass-surface); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); border: 1px solid var(--glass-border);`

### 2.3 Accent Colors (iOS system-color inspired)
```css
--accent-blue:   #0A84FF;   /* primary actions, links, active tab */
--accent-green:  #30D158;   /* success, active status */
--accent-orange: #FF9F0A;   /* warning, pending status */
--accent-red:    #FF453A;   /* destructive, error, suspended status */
--accent-purple: #BF5AF2;   /* reseller-role accent */
--accent-teal:   #40C8E0;   /* customer-role accent */
```
Role color-coding: **ISP Admin = blue**, **Reseller = purple**, **Customer = teal**. Used only
for small accents (active nav icon, role badge, chart line) — never as a full background.

### 2.4 Text
```css
--text-primary:   #1C1C1E;   /* near-black, iOS label color — text only, never a bg */
--text-secondary: #6E6E73;
--text-tertiary:  #AEAEB2;
--text-on-accent: #FFFFFF;
```

### 2.5 Status Colors
```css
--status-active:    var(--accent-green);
--status-pending:   var(--accent-orange);
--status-suspended: var(--accent-red);
--status-offline:   #8E8E93;
```

## 3. Typography
```css
--font-family: -apple-system, "SF Pro Display", "SF Pro Text", "Inter", "Segoe UI", Roboto, sans-serif;
```
| Token | Size / Weight | Use |
|---|---|---|
| `--text-large-title` | 34px / 700 | Page hero title (mobile "large title" nav) |
| `--text-title-1` | 28px / 700 | Section headers, desktop page title |
| `--text-title-2` | 22px / 600 | Card group headers |
| `--text-title-3` | 20px / 600 | Card title |
| `--text-body` | 17px / 400 | Default body/paragraph |
| `--text-callout` | 15px / 400 | Secondary body text |
| `--text-footnote` | 13px / 400 | Meta text, timestamps |
| `--text-caption` | 12px / 500 | Badge/label text, uppercase tracking 0.02em |

## 4. Spacing (4pt / 8pt grid)
```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
--space-5: 20px; --space-6: 24px; --space-7: 32px; --space-8: 40px;
```
Card internal padding: `--space-4` (16px) on mobile, `--space-5`–`--space-6` on desktop.
Page horizontal margin: `--space-4` on mobile, `--space-8` on desktop.

## 5. Radius (iOS uses large, continuous corners — never sharp)
```css
--radius-sm: 10px;   /* small controls, chips */
--radius-md: 16px;   /* buttons, inputs */
--radius-lg: 20px;   /* cards */
--radius-xl: 28px;   /* sheets, modals, large hero cards */
--radius-pill: 999px;/* pill buttons, segmented controls, tab bar */
```

## 6. Elevation / Shadow
Shadows are soft and diffuse, never hard-edged — this is what makes glass feel like it's
floating above the light background instead of pasted on top:
```css
--shadow-sm: 0 1px 2px rgba(30, 41, 59, 0.04), 0 1px 1px rgba(30, 41, 59, 0.03);
--shadow-md: 0 8px 24px rgba(30, 41, 59, 0.08);
--shadow-lg: 0 16px 40px rgba(30, 41, 59, 0.12);
```
Cards use `--shadow-sm` at rest, `--shadow-md` on hover/press (desktop only — mobile uses
scale/opacity feedback instead of shadow change).

## 7. Motion
Use iOS-style spring easing everywhere, no linear/ease-in-out:
```css
--ease-spring: cubic-bezier(0.32, 0.72, 0, 1);
--duration-fast: 180ms;
--duration-base: 280ms;
```
- Tab switches / sheet open: slide + fade, `--duration-base`, `--ease-spring`
- Button press: `scale(0.97)` on `:active`, `--duration-fast`
- Card tap: `scale(0.98)` on `:active`

## 8. Core Components — Rules

### 8.1 Buttons
- **Primary:** solid `--accent-blue` fill, white text, `--radius-md`, height 50px (mobile) / 44px
  (desktop), full-width on mobile forms, auto-width on desktop toolbars.
- **Secondary:** `--glass-surface-strong` fill, `--accent-blue` text, same radius/height.
- **Destructive:** same shape as primary, fill `--accent-red`.
- **Ghost/Text:** no fill, `--accent-blue` text, used for tertiary actions ("Cancel").
- All buttons: `active:scale-[0.97]`, no sharp corners ever.

### 8.2 Cards
- Base: `--glass-surface`, `backdrop-filter: --glass-blur`, `border: 1px solid --glass-border`,
  `border-radius: --radius-lg`, `box-shadow: --shadow-sm`.
- Stat card (dashboard tiles): icon in a tinted circle (accent color at 15% opacity background),
  big number in `--text-title-1`, label in `--text-footnote`.
- List-row card (customer row, router row): glass background, leading icon/avatar, title +
  subtitle, trailing chevron (iOS list convention) on mobile.

### 8.3 Forms & Inputs
- Grouped **iOS list-style forms**: fields live inside one glass "grouped section" card with
  hairline `1px solid rgba(60,60,67,0.1)` dividers between rows — not individually boxed inputs.
- Input height 44px, no visible border by default, `--accent-blue` focus ring
  (`box-shadow: 0 0 0 3px rgba(10,132,255,0.25)`), label floats above or sits left (iOS-form style).
- Toggles: iOS-style pill switch (`--accent-green` when on).
- Segmented control: pill container, active segment gets white glass fill + shadow, used for
  filters like "Active / Pending / Suspended".

### 8.4 Navigation
- **Desktop (≥1024px):** fixed left sidebar, glass surface, 260px wide, role-colored active
  item indicator, top bar (glass, 64px) with search + avatar.
- **Tablet (768–1023px):** collapsible/icon-only sidebar (72px), same top bar.
- **Mobile (<768px):** no sidebar. iOS-style **bottom tab bar** (glass, 5 items max, SF-Symbol-
  style line icons, active = filled icon + `--accent-blue`/role color + label). Top uses an
  iOS **large title** nav bar that collapses to a small centered title on scroll.

### 8.5 Modals / Sheets
- **Desktop:** centered modal, `--radius-xl`, `--shadow-lg`, glass-strong background, dimmed
  backdrop (`rgba(0,0,0,0.25)` — backdrop dimming only, page background itself stays light).
- **Mobile:** **bottom sheet** that slides up, rounded top corners only (`--radius-xl` top-left/
  top-right), drag handle bar at top, exactly like iOS action sheets / share sheets.

### 8.6 Status Badges
Pill shape (`--radius-pill`), tinted background at 15% opacity of the status color, text in the
full-strength status color, `--text-caption` weight/size. E.g. Active = green-tinted pill,
Suspended = red-tinted pill.

### 8.7 Icons
Rounded, line-weight (1.5–2px stroke) icon set in the SF Symbols spirit (e.g. Lucide/Feather
icons configured to `strokeWidth: 1.75`) — no filled/solid icon sets, no flat clip-art icons.

## 9. What "Feels Like a Web App" (avoid these)
- Hard drop shadows, sharp 0–4px corners, dense data tables with visible grid lines as the
  primary UI (use grouped glass cards/lists instead, tables only for advanced/desktop reports)
- Any dark gray/black full-page background
- Default browser form controls (checkbox/select) left unstyled
- Hover-only interactions with no equivalent tap/press affordance for touch

## 10. Implementation Notes
- Implement tokens as CSS custom properties in `styles/tokens.css`, consumed via Tailwind config
  (`theme.extend.colors`, `theme.extend.borderRadius`, `theme.extend.boxShadow`) so every
  component uses `bg-glass`, `rounded-lg`, `shadow-sm` utility classes instead of raw hex values.
- `backdrop-filter` requires a semi-transparent ancestor background to read as "glass" — always
  render glass surfaces on top of `--bg-gradient`, never on top of solid white, or the blur
  effect becomes invisible.
