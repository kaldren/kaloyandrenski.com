# Design System

The single source of truth for the visual language of kaloyandrenski.com. Every UI implementation must follow this document. If a request conflicts with this file on visual details (color, type, spacing), this file wins unless the change deliberately updates it.

This site is a minimal, fast, content-focused professional portfolio. Every choice below optimizes for clarity and performance over decoration — plain CSS3, no preprocessors, no external font/icon services, no runtime JS libraries; the only build step is the blog generator described in `AGENTS.md`.

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
- Buttons on dark backgrounds (`--color-primary` panels): `--color-secondary` background, `--color-primary` text (~7.7:1). Hover: `--color-text-on-dark` background. Use this instead of a second amber CTA when the page already has one.
- Call-to-action / highlight buttons (used sparingly, e.g. one primary CTA per page): `--color-accent-warm` background, `--color-primary` text. Hover: `--color-accent-warm-strong`.
- Section backgrounds alternate between `--color-bg` and `--color-bg-subtle` or `--color-secondary` at low usage for visual rhythm — never stack more than one saturated brand color as a full-bleed background per screen.
- Dark sections (hero, footer): `--color-primary` background with `--color-text-on-dark` text and `--color-secondary` or `--color-accent-warm` for accents/links on top of it.
- Never place body text in `--color-secondary`, `--color-accent-warm`, or `--color-accent-warm-strong` on a light background — none meet AA contrast for text at that size.

### Code

Used only for code blocks, inline code, and build-time syntax highlighting on blog posts. The code surface is a dark navy derived from `--color-primary` (same hue, darker), so code reads as part of the brand rather than a foreign theme. Syntax colors stay in the brand families where possible. Every text/syntax color meets at least 4.5:1 on `--color-code-bg` (WCAG 2.x relative-luminance ratios, computed against `#011E2C`).

| Role | Hex | Custom property | Contrast on code bg |
|---|---|---|---|
| Code background | `#011E2C` | `--color-code-bg` | n/a |
| Code text (default) | `#E6EEF2` | `--color-code-text` | 14.61:1 |
| Code border | `#0E4A66` | `--color-code-border` | n/a (decorative edge) |
| Keyword (sky-blue family, = Sky Blue) | `#8ECAE6` | `--color-syntax-keyword` | 9.60:1 |
| String (amber family, = Amber Flame) | `#FFB703` | `--color-syntax-string` | 9.83:1 |
| Number / literal (orange family, = Tiger Orange) | `#FB8500` | `--color-syntax-number` | 6.91:1 |
| Comment (muted) | `#7E909D` | `--color-syntax-comment` | 5.20:1 |
| Function / title (blue-green family, lightened) | `#3CC2DE` | `--color-syntax-function` | 8.14:1 |
| Type / attribute (soft mint) | `#9FE0C8` | `--color-syntax-type` | 11.42:1 |

Rules:
- Use these tokens only inside code surfaces (`pre`/`code`). They aren't general-purpose UI colors.
- Inline code uses the same `--color-code-bg`/`--color-code-text` pair as code blocks, as a small `--radius-sm` pill.
- Comments are intentionally the lowest-contrast syntax color, but never below 4.5:1.

### Dark showcase surface (`/agents/` page only)

The `/agents/` page is a dark "mission control" console. It is an **explicit, page-scoped exception** to the "code tokens only inside code surfaces" rule above. It applies to that page's `main` content only; the shared header and footer stay as they are everywhere else. No new hex values are introduced.

- **Surface:** `--color-code-bg` is the page background, `--color-code-text` the default text, and `--color-code-border` the edge color for panels and connectors.
- **Accents:** the syntax tokens may be used as accents (borders, glyphs, kind labels, highlighted connectors). `--color-syntax-comment` is the muted text color on this surface. `--font-mono` may be used for labels (kind labels, glyphs, status line, console).
- **Node kinds:** agents are solid cards (`--color-primary` fill, `--color-accent` border). Skills are outlined chips (transparent fill, `--color-syntax-type` border). The human node's accent is `--color-accent-warm`. Every node also carries a text kind label, so kind never relies on shape or color alone.
- **Contrast:** only these text/background pairings are used. All meet 4.5:1 (WCAG 2.x):

  | Text | Background | Ratio |
  |---|---|---|
  | `--color-code-text` | `--color-code-bg` | 14.61:1 |
  | `--color-syntax-comment` | `--color-code-bg` | 5.20:1 |
  | `--color-syntax-function` (links) | `--color-code-bg` | 8.14:1 |
  | `--color-syntax-type` / `--color-accent-warm` | `--color-code-bg` | 11.42:1 / 9.83:1 |
  | `--color-code-text` | `--color-primary` | 11.79:1 |
  | `--color-syntax-keyword` | `--color-primary` | 7.74:1 |
  | `--color-code-text` | `--color-code-border` | 8.16:1 |
  | `--color-code-bg` | `--color-syntax-keyword` / `--color-syntax-type` | 9.60:1 / 11.42:1 |
  | `--color-primary` | `--color-accent-warm` | 7.93:1 |

  `--color-syntax-comment` is not used on `--color-primary` or `--color-code-border` (below 4.5:1). The focus ring stays `--color-accent` (5.46:1 on `--color-code-bg`, 4.41:1 on `--color-primary`, both above the 3:1 UI minimum).
- **Sanctioned motion (this page only):** exactly three effects are allowed beyond simple color fades: a slow **status-dot pulse** (opacity), a blinking **typing caret** in the console, and the **replay highlight** (nodes and connectors lighting step by step). Under `prefers-reduced-motion: reduce` all three are off: the dot and caret are static, console lines appear instantly, and the replay never autoplays (it becomes a manual "Next step" control).

### Pattern diagrams (`/patterns/` page)

Each entry on the `/patterns/` page has a hand-written inline SVG diagram. Diagrams sit on the normal light surface (`--color-bg` canvas with a `1px solid var(--color-border)` frame, `--radius-md`). The SVG files carry **classes only, never colors or inline styles**: `patterns.css` maps the classes to the tokens below, and the build rejects any color or `style` attribute in a diagram. No new hex values are introduced.

- **Node kinds** (`<g class="node node--{kind}">` with a `rect` and `text`):

  | Kind | Fill | Edge | Text | Text contrast |
  |---|---|---|---|---|
  | `agent` | `--color-primary` | none | `--color-text-on-dark` | 13.11:1 |
  | `model` (a model call) | `--color-secondary` | none | `--color-primary` | 7.74:1 |
  | `tool` | `--color-bg` | 2px `--color-accent` (3.14:1) | `--color-primary` | 13.85:1 |
  | `store` (memory, rubric, data) | `--color-bg-subtle` | 1px `--color-text-muted` (5.21:1) | `--color-text` | 14.72:1 |
  | `check` (gate, evaluator verdict) | `--color-accent-warm` | none | `--color-primary` | 7.93:1 |
  | `human` | `--color-bg` | 2px `--color-primary` (13.85:1) | `--color-primary` | 13.85:1 |
  | `io` (input or output) | `--color-bg` | 1px `--color-text-muted` (5.5:1) | `--color-primary` | 13.85:1 |

- **Boundaries (cloud diagrams):** `<g class="zone">` draws a boundary such as a subscription, virtual network or hosting environment: a `--color-bg-subtle` fill with a 1px `--color-border` edge, drawn behind the nodes. A boundary nested inside another adds `zone--inner`, which switches the fill to `--color-bg` so the nesting reads. Its `zone-label` is `--font-mono` at `--text-xs` in `--color-text-muted` (5.21:1 on `--color-bg-subtle`), top-left inside the box. Boundaries are never dashed, because dashed means optional flow.
- **Edges:** `edge` is 1.5px `--color-text-muted`; `edge--main` (the pattern's main path) is 2.5px `--color-accent`; `edge--optional` (optional, delayed or failure flow) is a dashed `--color-text-muted` line. Arrowheads match their edge. Edge labels (`edge-label`) are `--color-text-muted` at `--text-xs` (5.5:1 on the canvas).
- **Type:** node labels use `--font-sans` at `--text-sm`, weight 700; node subtitles (`node-sub`) use `--text-xs`, weight 400. Below 768px diagrams render at their natural size (the build sets `width`/`height` from the `viewBox`) and scroll horizontally inside their frame, so their text never shrinks; from 768px they scale to the frame's width.
- **Never color alone:** every node has a text label, the legend on the page names every kind and edge style, and the figure caption says what the diagram shows.
- **Tracks:** the page is split into tracks: the generic patterns, then one per cloud. Each track opens with a dark header band (`--color-primary` with `--radius-md`). It shows the group label (e.g. "Cloud") in `--font-mono` `--text-xs` `--color-accent-warm` (7.93:1), the track name as the h2 in `--color-text-on-dark`, and its description and count in `--color-secondary` (7.74:1). In the sidebar, tracks are separated by a 1px `--color-border` rule, and their categories are indented behind a 2px `--color-border` line. Small labels there use `--color-text-muted`, never `--color-accent`.
- **Cloud entries** add a provider tag (`--color-primary` fill, `--color-text-on-dark` text, 13.11:1) before the category tag. Their services table reuses the blog table style, with service names as `--color-primary` row headers.
- **Rest of the page:** category and related-pattern chips are tags (`--radius-sm`, `--font-mono`, `--text-xs`). The "Be careful" callout is `--color-bg-subtle` with a 4px `--color-accent-warm` left border and a `--color-primary` heading. The hero is a dark section like the homepage hero.

### Sci-fi homepage (homepage only, experimental)

The homepage is a dark "agentic grid" surface, styled by `public/scifi.css` (loaded only on the homepage and scoped to `body.theme-scifi`). It is an **explicit, page-scoped exception** to the light surface, the single-shadow rule and the motion rule. The blog, `/agents/` and `/patterns/` pages are unaffected.

- **Tokens:** four additions, used only by `scifi.css`.

  | Role | Hex | Custom property |
  |---|---|---|
  | Page background | `#020814` | `--color-void` |
  | Panel surface (cards, frames) | `#061226` | `--color-void-panel` |
  | Neon accent (borders, traces, glow) | `#3D7BFF` | `--color-neon-blue` |
  | Neon accent (glow, glitch, rules) | `#A46BFF` | `--color-neon-violet` |

  The code and syntax tokens are reused as accents: `--color-syntax-function` (cyan) for links, labels and focus, and `--color-syntax-type` (mint) for the digital rain and status line. Translucent variants are made with `color-mix()` on these tokens, never new hex values.
- **Contrast:** body text is `--color-code-text` (about 16:1 on `--color-void-panel`), lead text `--color-secondary`, secondary text `--color-syntax-comment` (above 5:1) and links `--color-syntax-function` (above 8:1). Neon blue and violet are for borders, glows and large text, not small body text. The amber CTA is unchanged.
- **Background:** one fixed canvas (`.matrix-bg`, `public/scifi.js`) draws circuit traces, light pulses travelling between nodes and a faint digital rain at 30fps. It pauses when the tab is hidden. A CSS veil adds scanlines, a faint grid and a darker centre so text stays readable.
- **Intro:** a full-screen overlay holds the intro video on its poster frame behind a round play button, the only fully round control on the site. A click plays it with sound, and it fades into the page when it ends. The overlay always has "Skip intro" and Esc. It plays when the homepage is opened directly and is skipped when arriving from another page of the site, with `?nointro`, or under reduced motion.
- **Sanctioned motion (this page only):** the hero boot-in, the typing line and caret, the name glitch, the portrait scan line, the status pulse, the play-button ring and the canvas animation. Glows may use `box-shadow`/`text-shadow` in the neon tokens. Under `prefers-reduced-motion: reduce` all CSS animation is off, the canvas draws a single still frame and the intro does not play.

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

  /* code (blog) */
  --color-code-bg: #011E2C;
  --color-code-text: #E6EEF2;
  --color-code-border: #0E4A66;
  --color-syntax-keyword: #8ECAE6;
  --color-syntax-string: #FFB703;
  --color-syntax-number: #FB8500;
  --color-syntax-comment: #7E909D;
  --color-syntax-function: #3CC2DE;
  --color-syntax-type: #9FE0C8;

  /* sci-fi homepage (scifi.css only) */
  --color-void: #020814;
  --color-void-panel: #061226;
  --color-neon-blue: #3D7BFF;
  --color-neon-violet: #A46BFF;
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
- Transitions: short and subtle, `150–200ms ease`, on color/background/transform only. No animation for its own sake. The only sanctioned exception is the `/agents/` page's motion listed under "Dark showcase surface".

## Accessibility

- Minimum contrast: 4.5:1 for body text, 3:1 for large text (≥24px or ≥19px bold) and UI components/icons — per the per-color notes above.
- Never convey state (error, success, required) by color alone — pair with an icon or text label.
- Respect `prefers-reduced-motion` for any transition/animation beyond simple color fades.

## Compliance

Any agent or contributor implementing UI on this site must use the tokens and rules in this document — no hardcoded hex colors, no ad hoc font stacks, no arbitrary spacing values outside the scale. If a design need isn't covered here, extend this document first (as a deliberate, reviewed addition), then implement — don't improvise silently in component CSS.
