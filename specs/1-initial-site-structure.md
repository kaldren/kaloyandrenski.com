# Feature: Initial website structure

## What / Why

`src/index.html` and `src/public/styles.css` currently exist but are empty. This feature builds out the first version of the single-page site so kaloyandrenski.com actually presents Kaloyan Drenski's professional profile instead of a blank page. It establishes the page's section structure, base semantic HTML, and styling foundation (using the tokens in `DESIGN_SYSTEM.md`) that later features (e.g. individual blog post pages, a real certifications list) will build on top of.

## Requirements

- Single HTML page (`src/index.html`) with semantic structure: `<header>`, one `<main>` containing the content sections below, and a `<footer>`.
- A sticky/top navigation in the header with the site owner's name/mark and exactly 3 anchor links, in this order: Home, About, Certifications. Each link jumps/scrolls to its corresponding in-page section — "Home" jumps to the hero/top of the page using the same anchor-link pattern as the other nav items. Contact is not a nav item (the Contact/footer section still exists on the page, just without a nav link).
- **Hero/intro section**: the site owner's name, professional title ("AI Solution Architect @ KPMG"), a short tagline covering the two stated focus areas (Agentic AI & Multi-Agent Systems; Enterprise AI Architecture & Transformation), and the headshot image at `src/public/me.png`. This is the section the "Home" nav link targets.
  - The image must use a real `<img>` element (not a CSS background) with descriptive `alt` text, load eagerly (it's above the fold), and be sized/cropped responsively (e.g. via `object-fit`) so it reads as a portrait at any viewport width without distorting.
  - Include one primary call-to-action link in the hero (e.g. to the Contact section or an external profile) styled per the design system's CTA button rules.
- **About/Expertise section**: a short bio paragraph plus a highlighted breakdown of the two focus areas (Agentic AI & Multi-Agent Systems; Enterprise AI Architecture & Transformation) as distinct, scannable items (not just prose).
- **Certifications section**: a list/grid layout rendering the eight real certification entries below. Each entry shows the correct tier/type SVG badge as its own `<img>` element (not a shared CSS background), the certification name, and — where available — earned date and expiry date. Badge assets already exist in `src/public/`: `microsoft-certified-expert-badge.svg` (Expert tier), `microsoft-certified-associate-badge.svg` (Associate tier), `microsoft-certified-fundamentals-badge.svg` (Fundamentals tier), and `github-copilot.svg` (used only for the GitHub Copilot entry, not as a tier badge).
  - Entries are grouped and ordered by tier — Expert first, then Associate, then Fundamentals — reflecting the site owner's stated grouping logic rather than an incidental list order. The GitHub Copilot entry's position (last, after the Fundamentals-tier certs) follows the order in the reference screenshot the site owner supplied.
  - Display order (top to bottom):
    1. Microsoft Certified: Azure Solutions Architect Expert — badge: expert — Earned December 29, 2024 — Expires December 30, 2027
    2. Microsoft Certified: DevOps Engineer Expert — badge: expert — Earned January 28, 2024 — Expires June 16, 2027
    3. Microsoft Certified: Azure AI Apps and Agents Developer Associate — badge: associate — Earned July 31, 2026 — Expires August 1, 2027
    4. Microsoft Certified: Azure Developer Associate — badge: associate — Earned November 27, 2022 — Expires November 28, 2027
    5. Microsoft Certified: Azure Administrator Associate — badge: associate — Earned June 15, 2024 — Expires June 16, 2027
    6. Microsoft Certified: Azure AI Fundamentals — badge: fundamentals — Earned August 28, 2024 — no expiry
    7. Microsoft Certified: Azure Fundamentals — badge: fundamentals — Earned July 2, 2022 — no expiry
    8. GitHub Copilot — badge: github-copilot (dedicated svg) — Earned March 19, 2026 — Expires March 20, 2028
  - Each entry includes a "View certification details" style link out to the credential. Real Microsoft Learn / GitHub credential URLs haven't been supplied yet, so each link uses a clearly-marked placeholder `href` (same placeholder-link convention as the Contact section's profile link below), not a fabricated real-looking URL.
- **Contact/footer**: at minimum an email contact link and space for professional profile links (e.g. LinkedIn); footer includes a copyright line. Where an actual profile URL isn't available yet, use a clearly-marked placeholder `href` rather than inventing one. This section remains on the page but is not linked from the nav.
- All colors, type sizes, spacing, radii, and breakpoints must come from the tokens defined in `DESIGN_SYSTEM.md` (no hardcoded hex/px values in `styles.css`).
- Page must be mobile-first responsive per the breakpoints in `DESIGN_SYSTEM.md`, remaining usable and legible from small phone widths up through large desktop.
- Page must have a `<title>` and basic meta tags (charset, viewport, meta description summarizing the professional profile) in `<head>`.
- No frameworks, build tooling, or external font/CDN requests — plain HTML/CSS/vanilla JS only, per `AGENTS.md`.

## Acceptance criteria

- [ ] Opening `src/index.html` directly in a browser renders a complete single page with header/nav, hero (Home), About, Certifications, and footer/Contact sections in that order.
- [ ] The nav shows exactly 3 links — Home, About, Certifications — in that order, and each scrolls to the corresponding section on the same page (Home scrolls to the hero/top).
- [ ] The headshot at `src/public/me.png` is visible in the hero section, is not stretched/distorted, and has meaningful `alt` text.
- [ ] The hero clearly states the name "Kaloyan Drenski", the title "AI Solution Architect @ KPMG", and both focus areas (Agentic AI & Multi-Agent Systems; Enterprise AI Architecture & Transformation).
- [ ] The Certifications section renders all 8 entries in this exact order: Azure Solutions Architect Expert, DevOps Engineer Expert, Azure Administrator Associate, Azure AI Apps and Agents Developer Associate, Azure Developer Associate, Azure AI Fundamentals, Azure Fundamentals, GitHub Copilot.
- [ ] Each Certifications entry shows the correct badge svg for its tier/type (`microsoft-certified-expert-badge.svg` for the two Expert entries, `microsoft-certified-associate-badge.svg` for the three Associate entries, `microsoft-certified-fundamentals-badge.svg` for the two Fundamentals entries, `github-copilot.svg` for the GitHub Copilot entry) rendered as its own `<img>`, plus the certification name and earned date, with an expiry date shown for every entry except Azure AI Fundamentals and Azure Fundamentals (no expiry).
- [ ] Each Certifications entry has a "View certification details" style link with a clearly-marked placeholder `href`.
- [ ] The footer/contact area includes a working `mailto:` link and a visible (even if placeholder) professional profile link, and is reachable by scrolling even though it has no nav link.
- [ ] The page is legible and usable with no horizontal scrolling or overlapping content at mobile (~360px), tablet, and desktop widths.
- [ ] No hardcoded colors, fonts, or spacing values appear in `styles.css` outside the custom properties defined per `DESIGN_SYSTEM.md`.
- [ ] No console errors on load; no external network requests for fonts/frameworks/CDNs.
- [ ] The page is mobile-friendly and responsive, with the nav, hero, About, Certifications, and footer sections all visible and usable at small phone widths (~360px) up through large desktop widths.
