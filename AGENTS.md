# Agent Instructions

Instructions for AI agents working in this repo. This is the single source of truth for goals, tech stack, and rules — there is no separate constitution or tech-stack file.

## Goals

kaloyandrenski.com is a personal website that serves as a professional portfolio for Kaloyan Drenski - an AI Solution Architect specializing in agentic AI, multi-agent systems, and enterprise AI architecture and transformation. It highlights his expertise in software development, certifications, and technical writing.

The goal is to build a minimal, fast, and content-focused website that showcases his professional profile, expertise, certifications, and technical writing.

The website is a single-page experience, with dedicated pages only for blog posts.

## Project Structure

```text
kaloyandrenski.com/
├── .claude/             # Claude Code configuration for this repo
│   ├── agents/          # Agent definitions (spec-writer, frontend-developer, devops, ui-qa, blog-writer)
│   └── skills/          # Skill definitions (build-feature, build-spec, update-changelog, ui-qa, seo-review)
├── scripts/             # Build scripts (build-blog.mjs, run via `npm run build:blog`)
├── src/                 # Website source code
│   ├── index.html       # Single-page site entry point
│   ├── blog/            # Blog sources: posts/ (markdown) and templates/ (HTML), see specs 6 and 7
│   └── public/          # Static assets served as-is (images, styles.css, etc.)
├── specs/               # Feature specifications (one file per feature)
│   └── TEMPLATE.md      # Spec format for new features
├── AGENTS.md            # This file
├── CHANGELOG.md         # Record of notable feature additions/changes
├── DESIGN_SYSTEM.md     # Source of truth for colors, type, spacing, shape
└── README.md
```

## Tech Stack

### Frontend

- Plain HTML5, CSS3, and vanilla JavaScript (ES modules where needed).
- No frameworks or libraries (no React, Vue, etc.).
- No CSS preprocessors (no Sass/Less) — plain CSS only.

### Tooling & build process

- npm dev dependencies (in the root `package.json`, pinned by `package-lock.json`) and a blog build script are allowed when they make things easier. No bundler, and nothing compiled or transformed except the blog build.
- The blog build (`scripts/build-blog.mjs`, run with `npm run build:blog`) copies `src/` into the gitignored `_site/` and generates the blog post pages and blog index from `src/blog/` (see `specs/7-blog-build-pipeline.md`). CI publishes `_site/`; generated HTML is never committed.
- The site's runtime stays plain HTML/CSS/vanilla JS with no frameworks. No JS library is shipped to the browser unless a spec justifies it.
- All other files are authored directly and served as-is.
- Local preview: open the HTML files directly in a browser, or use any simple static file server. Run `npm install` then `npm run build:blog` to preview generated blog pages in `_site/`.

### Hosting & deployment

- **GitHub Pages**, serving directly from this repository.
- Custom domain `kaloyandrenski.com` configured via a `CNAME` file.

### Rationale

This site is meant to be minimal, fast, and content-focused. A plain HTML/CSS/JS stack with minimal build tooling (only the blog build) keeps the project simple to maintain, avoids dependency upkeep, and matches the small scope of a personal portfolio site.

## Design System

`DESIGN_SYSTEM.md` is the single source of truth for colors, typography, spacing, shape, and interaction states. Any frontend implementation must follow it strictly — no hardcoded colors/fonts/spacing outside its tokens.

## Rules

- **Specs-first**: no implementation without a corresponding spec. Specifications are written before implementation.
- **Spec required, no exceptions**: a feature MUST have a spec file in `specs/` before any code is written. This is a hard guardrail — never implement "just this once" without one.
- **One spec per feature**: each feature gets a single markdown file in `specs/`, following the format in `specs/TEMPLATE.md`.
- **Numbered spec filenames**: each spec file is named `specs/<n>-<kebab-case-feature-name>.md`, where `<n>` is the next sequential integer across all specs in `specs/` (1, 2, 3, ...) in the order they were created. This keeps spec creation order visible at a glance.
- **Simplicity**: no frameworks and no unnecessary dependencies. npm dev dependencies and the blog build script (`npm run build:blog`, producing `_site/`) are allowed when they make things easier; otherwise there is no build step. The runtime stays plain HTML/CSS/vanilla JS, with no JS library shipped to the browser unless a spec justifies it.
- **Changelog required**: every feature implementation (not trivial tweaks) gets an entry in `CHANGELOG.md`, written via the `update-changelog` skill (`.claude/skills/update-changelog/SKILL.md`) — see the Workflow section below.

## Local UI QA

Run UI QA for every change with a browser-visible result. Skip it for backend, infrastructure, or other changes with no rendered or interactive effect.

Generated blog pages (post pages and the blog index produced by `npm run build:blog`) are exempt from Local UI QA; a successful build is their verification. Local UI QA still covers the blog templates and CSS as served from `src/`.

Use the repository's configured Playwright MCP server for all browser checks. Serve `src/` on loopback only, test the local HTTP URL at desktop and phone sizes, and never use `file://` or the deployed site. The `.claude/agents/ui-qa.md` agent owns the detailed checks and report format.

In Claude Code, `/ui-qa [optional feature or page scope]` delegates to that agent.

## Workflow for agents

There are two implementer agents, split by domain:

- **`frontend-developer`** (`.claude/agents/frontend-developer.md`) — site content, markup, styling, and client-side behavior under `src/`, governed by `DESIGN_SYSTEM.md`.
- **`devops`** (`.claude/agents/devops.md`) — CI/CD, GitHub Actions workflows, GitHub Pages publishing configuration, and repo-root deployment files (e.g. `CNAME`). Never touches `src/`.

Route each request to the implementer matching its domain. A request that spans both should be split into separate spec/implement passes, one per domain.

Two equivalent ways to deliver a feature:

- **Manual**: delegate spec creation to the spec-writer agent (`.claude/agents/spec-writer.md`), then implementation to whichever implementer agent matches the request's domain.
- **`build-feature` skill** (`.claude/skills/build-feature/SKILL.md`): runs the same pipeline end to end — domain + weight classification, spec-writer, a domain-specific implementation brief, the matching implementer agent, and verification.

To just start or iterate on a spec without building yet, use the **`build-spec` skill** (`.claude/skills/build-spec/SKILL.md`) — an interactive front end to `spec-writer` that stops once the spec is finalized.

To write or edit a blog post, delegate to the **`blog-writer`** agent (`.claude/agents/blog-writer.md`). Posts are content, not features: they need no spec or changelog entry, and a successful `npm run build:blog` is their verification.

To check a post's on-page SEO (title, summary, slug, headings, links, alt text), use the **`seo-review` skill** (`.claude/skills/seo-review/SKILL.md`) — `blog-writer` also runs it as its final pass.

To add or fix a changelog entry outside the full pipeline (a manual change, a retroactive entry), use the **`update-changelog` skill** (`.claude/skills/update-changelog/SKILL.md`) directly — `build-feature` also calls it internally at delivery time.

Manual steps, if not using the skill:

1. Before implementing a feature, check `specs/` for an existing spec covering it.
2. If no spec exists, stop and delegate spec creation to the spec-writer agent (`.claude/agents/spec-writer.md`), passing along the feature request and any other inputs/context gathered so far. Do not implement without a spec.
3. Once the spec-writer agent produces the spec, review it against the Rules and Tech Stack sections above before proceeding.
4. Consult the Rules and Tech Stack sections above before making implementation decisions.
5. Decide the domain (frontend vs. devops/infra) and delegate implementation to the matching agent above. Implement only what the spec describes — keep scope matched to the spec.
