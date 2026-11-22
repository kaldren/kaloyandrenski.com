# Changelog

All notable changes to kaloyandrenski.com are documented in this file. Entries are grouped by date, newest first, and cover feature-level additions and changes — not every commit.

## 2026-11-22

### Changed
- **Job title** — the homepage now shows the title as "Global AI Solutions Architect" with no employer name, in the hero, the About intro and the page's search description.

### Added
- **Architecture Patterns page** — a new `/patterns/` field guide, linked from the main nav on every page and from the About section, collects architecture patterns for agentic AI on one page with a sticky contents list, category filters and search. Each numbered pattern has a diagram, an everyday comparison, notes on where it fits in an agent system and in a large company, steps, a short code sketch, a "Be careful" warning and links to related patterns, starting with Prompt Chaining, Orchestrator–Workers and Evaluator–Optimizer.
- **Patterns page build** — adding a pattern is now just adding its markdown file and diagram. The deploy builds the page automatically and stops if a pattern uses a category that isn't on the fixed list, is missing one of the six sections or has them out of order, lacks its diagram, has a diagram that hardcodes its own colors, shares a position with another pattern, or has a "related" link to a pattern that doesn't exist.
- **Microsoft Azure architectures** — the patterns page is now split into tracks. Generic architecture patterns come first, then a "Cloud · Microsoft Azure" section of reference architectures built from real Azure services, each with its own categories and AZ- numbering. Every Azure entry lists its services in a table and links to the generic pattern it implements, and that pattern links back under "In the cloud". The first is Multi-Agent Orchestration on Azure. The sidebar and filters now work by track and category, so adding Google Cloud later is just another track.
- **Pattern entry skill** — a new `/pattern-entry` skill adds or revises patterns and cloud architectures the same way every time. It files each one under the right track and category, writes the fixed sections, draws the diagram in the page's diagram language, links related patterns both ways and checks the build.

## 2026-11-21

### Removed
- **Spec-driven development** — the site is no longer built spec-first. The `specs/` folder, the spec-writer agent and the build-feature and build-spec skills are gone, the agents page shows the slimmer crew with a feature lane that runs from request to changelog, and the footer simply reads "Built with Human + AI collaboration."

## 2026-10-20

### Added
- **Agents page** — a new `/agents/` "mission control" page, linked from the end of the About section and the footer's "built with human + AI collaboration" line, shows the AI agents and skills that build this site in a Feature lane and a Content lane. Hover, focus or tap an agent and it introduces itself in a console with what it does, its real tools and model, and a link to its definition, while "Run build-feature" replays a feature moving through the pipeline.
- **Agents page build** — the agents page is generated from the real agent and skill definitions on every deploy, so it never drifts from how the site is actually built. A new agent shows up automatically, and a persona pointing at an agent that doesn't exist stops the deploy.

## 2026-10-18

### Added
- **Markdown blog** — a new Blog page, linked from the main nav, lists posts newest first. Each post is written as a single markdown file and reads cleanly, with framed images, styled tables, dark syntax-highlighted code blocks and dark pills for inline code like `SKILL.md`.
- **Blog build pipeline** — publishing a post is now just pushing its markdown file. The deploy workflow turns posts into finished pages, updates the blog index automatically, and stops the deploy if a post's metadata is missing or malformed.

## 2026-09-11

### Added
- **Playwright MCP UI QA** — added local browser-based QA for rendered-site features in VS Code/Copilot and Claude Code, available automatically through the feature workflow or on demand with Claude Code’s `/ui-qa`.

## 2026-08-27

### Added
- **Agentic AI Business Solutions Architect certification** — added the new Microsoft Certified: Agentic AI Business Solutions Architect credential to the Certifications section, earned August 27, 2026 and expiring August 27, 2027.

## 2026-08-04

### Added
- **GitHub Pages deploy pipeline** — automated GitHub Actions workflow that publishes `src/` to GitHub Pages on every push to `main`, preserving the custom domain via `CNAME`.
- **Focus card images** — wired the two About section focus cards ("Agentic AI & Multi-Agent Systems" and "Enterprise AI Architecture & Transformation") up with their supporting infographic images, each clickable to open full resolution in a new tab.
- **Footer social links** — added LinkedIn, System Shogun, and YouTube links to the footer, each with a hand-authored inline SVG icon.
- **Initial site structure** — built the first version of the single-page site: hero/intro, About/Expertise, Certifications, and footer/Contact sections.
- Footer attribution message noting the site is built with human + AI collaboration via spec-driven development, linking to the source repo.

### Changed
- Certification entries now link to their real Microsoft/GitHub credential verification pages instead of placeholder links.

### Removed
- Outside-work section removed from the initial site structure.
