# Design System

The single source of truth for the visual language of kaloyandrenski.com. Every UI implementation must follow this document. If a spec under `specs/` conflicts with this file on visual details (color, type, spacing), this file wins unless the spec explicitly overrides it for a stated reason.

This site is a minimal, fast, content-focused professional portfolio. Every choice below optimizes for clarity and performance over decoration — plain CSS3, no preprocessors, no external font/icon services, no build step (see `AGENTS.md`).

## Colors

Palette source: 5 brand colors (blue → orange gradient), assigned roles below plus a small neutral scale needed for text/backgrounds that the brand palette doesn't cover.

### Brand colors

| Role | Name | Hex | Custom property |
|---|---|---|---|
| Primary | Deep Space Blue | `#023047` | `--color-primary` |
| Primary accent | Blue Green | `#219EBC` | `--color-accent` |
| Secondary | Sky Blue (Light) | `#8ECAE6` | `--color-secondary` |
| Secondary accent | Amber Flame | `#FFB703` | `--color-accent-warm` |
| Secondary accent | Tiger Orange | `#FB8500` | `--color-accent-warm-strong` |

**Why this assignment:**
- **Deep Space Blue** is near-black-navy (contrast ratio ~13.9:1 on white) — it does the job normally given to black: body text, headings, primary button fills (with white text), dark section backgrounds (footer/hero). It's the anchor color of the site.
- **Blue Green** is the brand's signature color — used for links, icons, borders, focus outlines, and small/medium UI accents. Its contrast on white (~3.1:1) is enough for large text, icons, and UI components, but **not** for small body text — never set small paragraph text in Blue Green on a white background.
- **Sky Blue (Light)** is too light for text on white. Use it as a background tint (section backgrounds, cards, tags, hover states) or as text/icon color on top of Deep Space Blue or Blue Green dark backgrounds.
- **Amber Flame** and **Tiger Orange** are the "energy" colors — reserved for calls to action, highlights, and badges. Use sparingly (this is a minimal site, not a playful one): a primary CTA button, an active nav indicator, a "new" badge. Amber Flame paired with Deep Space Blue text has excellent contrast (~7.9:1) — that's the standard CTA-button combo. Don't use either as a body text color.

### Neutrals

Not part of the brand palette but required for a readable content site. Keep these desaturated so the brand blues/oranges stay the accent, not the neutrals.

| Role | Hex | Custom property |
|---|---|---|
| Background (page) | `#FFFFFF` | `--color-bg` |
| Background (subtle/alt section) | `#F7F9FA` | `--color-bg-subtle` |
| Border / divider | `#E2E8ED` | `--color-border` |
| Text (body) | `#1A2530` | `--color-text` |
| Text (muted / secondary) | `#5B6B78` | `--color-text-muted` |
| Text on dark backgrounds | `#F7F9FA` | `--color-text-on-dark` |

`--color-text` is a near-black derived from Deep Space Blue's hue rather than pure black, so text stays visually consistent with the brand navy. Use `--color-primary` itself (not `--color-text`) for headings if you want them to read as more "brand," but body copy should use `--color-text` for slightly softer contrast on long-form reading.

### Usage rules

- Links and interactive text: `--color-accent` (Blue Green), underlined or otherwise distinguished from body text since its contrast alone doesn't meet AA for small text.
- Primary buttons: `--color-primary` background, `--color-text-on-dark` text. Hover: darken slightly or switch to `--color-accent`.
- Call-to-action / highlight buttons (used sparingly, e.g. one primary CTA per page): `--color-accent-warm` background, `--color-primary` text. Hover: `--color-accent-warm-strong`.
- Section backgrounds alternate between `--color-bg` and `--color-bg-subtle` or `--color-secondary` at low usage for visual rhythm — never stack more than one saturated brand color as a full-bleed background per screen.
- Dark sections (hero, footer): `--color-primary` background with `--color-text-on-dark` text and `--color-secondary` or `--color-accent-warm` for accents/links on top of it.
- Never place body text in `--color-secondary`, `--color-accent-warm`, or `--color-accent-warm-strong` on a light background — none meet AA contrast for text at that size.

### CSS custom properties

Define these once (e.g. in a root stylesheet) and reference them everywhere — no hardcoded hex values in component CSS.

```css
:root {
  /* brand */
  --color-primary: #023047;
  --color-accent: #219EBC;
  --color-secondary: #8ECAE6;
  --color-accent-warm: #FFB703;
  --color-accent-warm-strong: #FB8500;

  /* neutrals */
  --color-bg: #FFFFFF;
  --color-bg-subtle: #F7F9FA;
  --color-border: #E2E8ED;
  --color-text: #1A2530;
  --color-text-muted: #5B6B78;
  --color-text-on-dark: #F7F9FA;
}
```

## Typography

No external font requests (no Google Fonts / CDN) — the site loads instantly and stays dependency-free, consistent with the no-build, no-unnecessary-assets philosophy in `AGENTS.md`. Use the platform's native font stack instead of a webfont.

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
    "Liberation Mono", monospace;
}
```

- `--font-sans` is used for everything — headings, body, nav, UI. There is one typeface on this site; hierarchy comes from size/weight, not font-switching.
- `--font-mono` is reserved for code snippets, technical labels, and inline tags (e.g. tech-stack pills on a project card) — fits the AI/engineering subject matter without adding a font file.

### Scale

Mobile-first modular scale, base 16px:

| Token | Size | Usage |
|---|---|---|
| `--text-xs` | 0.75rem (12px) | captions, metadata, timestamps |
| `--text-sm` | 0.875rem (14px) | secondary/UI text |
| `--text-base` | 1rem (16px) | body copy |
| `--text-lg` | 1.125rem (18px) | lead paragraphs |
| `--text-xl` | 1.5rem (24px) | h3 |
| `--text-2xl` | 2rem (32px) | h2 |
| `--text-3xl` | 2.75rem (44px) | h1 |

Scale up h1/h2 on wider viewports (e.g. `clamp()`), but keep body text at `--text-base` regardless of viewport for readability.

### Weights & line height

- Body text: weight 400, line-height 1.6.
- Headings: weight 600–700, line-height 1.2.
- Don't use more than two weights on a single page (regular + one bold/semibold) — no font weight soup.

## Spacing

4px base unit. Use these tokens instead of arbitrary pixel/rem values so rhythm stays consistent:

```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-24: 6rem;    /* 96px */
}
```

Use `--space-16`/`--space-24` for section-level vertical rhythm, `--space-4`/`--space-6` for component-internal spacing.

## Shape & elevation

Keep it flat and restrained — this is a content site, not a dashboard.

- Border radius: `--radius-sm: 4px` (tags, badges, inputs), `--radius-md: 8px` (cards, buttons). Nothing fully rounded/pill-shaped except tags.
- Borders: `1px solid var(--color-border)` for card/section dividers rather than shadows where possible.
- Shadows: one subtle elevation only, for things that truly float (e.g. a sticky nav on scroll): `0 1px 3px rgba(2, 48, 71, 0.08)`. Don't stack multiple shadow depths.

## Layout & breakpoints

Mobile-first. Standard breakpoints:

```css
/* base: mobile */
@media (min-width: 640px)  { /* sm: large phones */ }
@media (min-width: 768px)  { /* md: tablets */ }
@media (min-width: 1024px) { /* lg: small desktops */ }
@media (min-width: 1280px) { /* xl: large desktops */ }
```

Max content width: `72rem` (1152px), centered, with `--space-4`–`--space-6` horizontal padding on mobile.

## Interaction states

- Focus: visible focus ring on all interactive elements using `--color-accent` (`outline: 2px solid var(--color-accent); outline-offset: 2px;`) — never remove focus outlines without replacing them.
- Hover on links/buttons: shift toward the adjacent brand shade (e.g. `--color-accent` → darker, `--color-accent-warm` → `--color-accent-warm-strong`), not an unrelated color.
- Transitions: short and subtle, `150–200ms ease`, on color/background/transform only. No animation for its own sake.

## Accessibility

- Minimum contrast: 4.5:1 for body text, 3:1 for large text (≥24px or ≥19px bold) and UI components/icons — per the per-color notes above.
- Never convey state (error, success, required) by color alone — pair with an icon or text label.
- Respect `prefers-reduced-motion` for any transition/animation beyond simple color fades.

## Compliance

Any agent or contributor implementing UI on this site must use the tokens and rules in this document — no hardcoded hex colors, no ad hoc font stacks, no arbitrary spacing values outside the scale. If a design need isn't covered here, extend this document first (as a deliberate, reviewed addition), then implement — don't improvise silently in component CSS.
