# Feature: Footer social links

## What / Why

The footer/Contact section built in `specs/1-initial-site-structure.md` currently has only a placeholder LinkedIn link (`#placeholder-linkedin`). This feature fills the footer's social/profile links in with real destinations — LinkedIn, System Shogun (Kaloyan's site on system design and software architecture), and his YouTube channel (@SystemShogun, also system design and software architecture content) — so visitors reaching the bottom of the single page have a clear way to connect with him and find more of his writing/video content elsewhere. Each link is paired with a small icon so the set is instantly scannable as a row of external destinations, not just a line of plain text.

## Requirements

- The footer's existing placeholder LinkedIn link is replaced with the real URL: `https://www.linkedin.com/in/kaloyan-drenski/`.
- Two additional links are added to the footer, alongside the existing email and LinkedIn links:
  - System Shogun — `https://systemshogun.com`
  - YouTube (@SystemShogun) — `https://www.youtube.com/@SystemShogun`
- The three links (LinkedIn, System Shogun, YouTube) are presented together as a distinct set of external/social links in the footer, in this order: LinkedIn, System Shogun, YouTube.
- Each link is presented as icon + visible text together (e.g. a LinkedIn glyph next to the word "LinkedIn"), not icon-only. Text labels stay visible rather than being visually hidden, because:
  - System Shogun has no widely recognized brand mark the way LinkedIn and YouTube do, so a generic icon alone wouldn't identify the destination — the label carries the meaning there regardless of icon support.
  - Keeping the label visible is simpler and more robust for accessibility than relying on a correctly-maintained `aria-label`/visually-hidden span, with no downside given the footer has room for both.
- Icons are sourced as inline SVG markup authored directly in `src/index.html` (not `<img>` references to separate files, and not an icon font or CDN request):
  - Inline SVG lets each icon inherit the link's text color via `fill="currentColor"`, so it automatically matches the existing link color and its hover-state color change (`--color-secondary` → `--color-accent-warm`) defined in `.site-footer a` / `.site-footer a:hover`, without introducing separate icon color rules.
  - This differs from the existing `<img src="public/*.svg">` pattern used for certification badges — that pattern suits static multi-color badge artwork, not single-color icons that need to track link/hover color.
- LinkedIn and YouTube use simple, single-color, hand-authored recreations of their standard recognizable marks (the "in" glyph and the play-button glyph respectively) — not copied from a third-party icon library or fetched from any external service. System Shogun uses a generic single-color icon appropriate for a personal site/blog link (e.g. a globe or link glyph), since it has no distinct brand mark to reference.
- Each SVG icon is marked `aria-hidden="true"` (and/or `focusable="false"`) since the adjacent visible text already supplies the link's accessible name — the icon must not be independently announced or focusable.
- Icons are sized and spaced consistently with each other and with the footer's existing type/spacing scale (`DESIGN_SYSTEM.md` `--space-*` tokens), sitting inline with their text label without disrupting the footer's flat, restrained visual style (no shadows/elevation on icons).
- Each link opens in a new tab (`target="_blank"`) with `rel="noopener noreferrer"`, since all three navigate away from the single-page site to external destinations.
- Styling follows `DESIGN_SYSTEM.md`'s dark-section rules for the footer (`--color-primary` background, `--color-text-on-dark` body text, `--color-secondary` or `--color-accent-warm` for the links/icons/hover state) — no hardcoded colors.
- No new dependencies or external requests: inline SVG markup only, no icon font, no CDN, consistent with `AGENTS.md`'s no-build rule and `DESIGN_SYSTEM.md`'s no external font/icon services rule.

## Acceptance criteria

- [ ] The footer/Contact section shows three external links — LinkedIn, System Shogun, YouTube — in that order, in addition to the existing email link.
- [ ] The LinkedIn link points to `https://www.linkedin.com/in/kaloyan-drenski/` and no placeholder LinkedIn href remains anywhere on the page.
- [ ] The System Shogun link points to `https://systemshogun.com`.
- [ ] The YouTube link points to `https://www.youtube.com/@SystemShogun`.
- [ ] All three links open in a new tab and include `rel="noopener noreferrer"`.
- [ ] Each link displays an inline SVG icon alongside its visible text label (LinkedIn / System Shogun / YouTube) — no icon-only links, no separate icon image files, no icon font/CDN request.
- [ ] Each icon's SVG element has `aria-hidden="true"` and is not independently reachable by keyboard focus; the link's accessible name comes from the visible text.
- [ ] Icon color matches the link's default text color and changes color on hover together with the text (via `currentColor`), consistent with `DESIGN_SYSTEM.md`'s dark-section and interaction-state rules.
- [ ] Text is readable against the footer's dark background with adequate contrast per `DESIGN_SYSTEM.md`.
- [ ] Each link (icon + text) shows a visible focus outline (`--color-accent`) when tabbed to, consistent with `DESIGN_SYSTEM.md`'s interaction rules.
- [ ] The footer's link set — icons and text together — is legible and usable with no overlap or wrapping issues at mobile (~360px), tablet, and desktop widths.
- [ ] No console errors on load; no new external network requests (no icon font/CDN/image files added for the social icons).
