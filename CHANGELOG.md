# Changelog

All notable changes to kaloyandrenski.com are documented in this file. Entries are grouped by date, newest first, and cover feature-level additions and changes — not every commit.

## 2026-08-27

### Added
- **Agentic AI Business Solutions Architect certification** — added the new Microsoft Certified: Agentic AI Business Solutions Architect credential to the Certifications section, earned August 27, 2026 and expiring August 27, 2027.

## 2026-08-04

### Added
- **GitHub Pages deploy pipeline** — automated GitHub Actions workflow that publishes `src/` to GitHub Pages on every push to `main`, preserving the custom domain via `CNAME`. ([spec](specs/4-github-pages-deploy-pipeline.md))
- **Focus card images** — wired the two About section focus cards ("Agentic AI & Multi-Agent Systems" and "Enterprise AI Architecture & Transformation") up with their supporting infographic images, each clickable to open full resolution in a new tab. ([spec](specs/3-focus-card-images.md))
- **Footer social links** — added LinkedIn, System Shogun, and YouTube links to the footer, each with a hand-authored inline SVG icon. ([spec](specs/2-footer-social-links.md))
- **Initial site structure** — built the first version of the single-page site: hero/intro, About/Expertise, Certifications, and footer/Contact sections. ([spec](specs/1-initial-site-structure.md))
- Footer attribution message noting the site is built with human + AI collaboration via spec-driven development, linking to the source repo.

### Changed
- Certification entries now link to their real Microsoft/GitHub credential verification pages instead of placeholder links.

### Removed
- Outside-work section removed from the initial site structure.
