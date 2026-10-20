# Changelog

All notable changes to kaloyandrenski.com are documented in this file. Entries are grouped by date, newest first, and cover feature-level additions and changes — not every commit.

## 2026-10-20

### Added
- **Agents page** — a new `/agents/` "mission control" page, linked from the end of the About section and the footer's "built with human + AI collaboration" line, shows the AI agents and skills that build this site in a Feature lane and a Content lane. Hover, focus or tap an agent and it introduces itself in a console with what it does, its real tools and model, and a link to its definition, while "Run build-feature" replays a feature moving through the pipeline. ([spec](specs/8-agents-page.md))
- **Agents page build** — the agents page is generated from the real agent and skill definitions on every deploy, so it never drifts from how the site is actually built. A new agent shows up automatically, and a persona pointing at an agent that doesn't exist stops the deploy. ([spec](specs/9-agents-page-build.md))

## 2026-10-18

### Added
- **Markdown blog** — a new Blog page, linked from the main nav, lists posts newest first. Each post is written as a single markdown file and reads cleanly, with framed images, styled tables, dark syntax-highlighted code blocks and dark pills for inline code like `SKILL.md`. ([spec](specs/6-markdown-blog.md))
- **Blog build pipeline** — publishing a post is now just pushing its markdown file. The deploy workflow turns posts into finished pages, updates the blog index automatically, and stops the deploy if a post's metadata is missing or malformed. ([spec](specs/7-blog-build-pipeline.md))

## 2026-09-11

### Added
- **Playwright MCP UI QA** — added local browser-based QA for rendered-site features in VS Code/Copilot and Claude Code, available automatically through the feature workflow or on demand with Claude Code’s `/ui-qa`. ([spec](specs/5-playwright-mcp-ui-qa.md))

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
