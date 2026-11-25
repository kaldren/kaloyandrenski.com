# Agent Instructions

Instructions for AI agents working in this repo. This is the single source of truth for goals, tech stack, and rules — there is no separate constitution or tech-stack file.

## Goals

kaloyandrenski.com is a personal website that serves as a professional portfolio for Kaloyan Drenski - an AI Solution Architect specializing in agentic AI, multi-agent systems, and enterprise AI architecture and transformation. It highlights his expertise in software development, certifications, and technical writing.

The goal is to build a minimal, fast, and content-focused website that showcases his professional profile, expertise, certifications, and technical writing.

The website is a single-page experience, with dedicated pages only for blog posts, a single `/agents/` page showcasing the AI agents that build the site, and a single `/patterns/` page: a field guide to architecture patterns for agentic AI, with generic patterns (AI architecture and software architecture) plus cloud-specific architectures (Microsoft Azure today) built from real services.

## Project Structure

```text
kaloyandrenski.com/
├── .claude/             # Claude Code configuration for this repo
│   ├── agents/          # Agent definitions (frontend-developer, devops, ui-qa, blog-writer)
│   └── skills/          # Skill definitions (update-changelog, ui-qa, seo-review, pattern-entry)
├── scripts/             # Build scripts (build-blog.mjs, run via `npm run build:blog`)
├── src/                 # Website source code
│   ├── index.html       # Single-page site entry point
│   ├── agents/          # Agents page sources: template.html and crew.json (personas)
│   ├── blog/            # Blog sources: posts/ (markdown) and templates/ (HTML)
│   ├── patterns/        # Patterns page sources: template.html, catalog.json (tracks + categories), entries/<track>/ and diagrams/<track>/
│   └── public/          # Static assets served as-is (images, styles.css, etc.)
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
- The blog build (`scripts/build-blog.mjs`, run with `npm run build:blog`) copies `src/` into the gitignored `_site/` and generates the blog post pages and blog index from `src/blog/`. It also generates the `/agents/` page from `src/agents/` and the agent/skill definitions in `.claude/`, and the `/patterns/` page from `src/patterns/`. That page is organised in tracks listed in `catalog.json`: two generic tracks (AI architecture, software architecture), then one track per cloud. Each entry is one markdown file plus one class-only SVG diagram, in the track's folder. The build fails on an unknown track or category, missing or reordered sections, bad cloud `services` or `implements`, a missing or non-conforming diagram, a duplicate `order` or a broken link. CI publishes `_site/`; generated HTML is never committed.
- The site's runtime stays plain HTML/CSS/vanilla JS with no frameworks. Avoid shipping JS libraries to the browser unless there's a clear reason.
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

- **Simplicity**: no frameworks and no unnecessary dependencies. npm dev dependencies and the blog build script (`npm run build:blog`, producing `_site/`) are allowed when they make things easier; otherwise there is no build step.
- **Agents page stays in sync**: the `/agents/` page and the homepage agents callout show the AI crew that builds this site. Whenever an agent or skill is added to, renamed in, or removed from `.claude/agents/` or `.claude/skills/`, update `src/agents/crew.json` in the same change: give it a `lane` (`feature`, `content` or `support`), an `order`, a `glyph`, a first-person `line` that matches its definition, what it `owns`, and a `replay` line if it's in the feature lane. The build fails until every definition has an entry, so an unplaced agent can never ship.

## Local UI QA

For changes with a browser-visible result, UI QA is available on demand. Generated pages (the blog post pages, the blog index, the `/agents/` page and the `/patterns/` page produced by `npm run build:blog`) are verified by a successful build.

Use the repository's configured Playwright MCP server for browser checks. Serve `src/` on loopback only, test the local HTTP URL at desktop and phone sizes, and never use `file://` or the deployed site. The `.claude/agents/ui-qa.md` agent owns the detailed checks and report format.

In Claude Code, `/ui-qa [optional feature or page scope]` delegates to that agent.

## Helper agents and skills

All optional — use them when they help:

- **`frontend-developer`** (`.claude/agents/frontend-developer.md`) — site content, markup, styling, and client-side behavior under `src/`, governed by `DESIGN_SYSTEM.md`.
- **`devops`** (`.claude/agents/devops.md`) — CI/CD, GitHub Actions workflows, GitHub Pages publishing configuration, and repo-root deployment files (e.g. `CNAME`).
- **`blog-writer`** (`.claude/agents/blog-writer.md`) — writes or edits blog posts. A successful `npm run build:blog` is their verification.
- **`seo-review` skill** (`.claude/skills/seo-review/SKILL.md`) — checks a post's on-page SEO (title, summary, slug, headings, links, alt text). `blog-writer` also runs it as its final pass.
- **`pattern-entry` skill** (`.claude/skills/pattern-entry/SKILL.md`) — adds or revises an entry on the `/patterns/` page, generic or cloud (Azure): picks the track and category from `src/patterns/catalog.json`, writes that track's fixed sections, draws the diagram in the site's diagram language (`reference/diagram-spec.md`), cross-links related patterns and runs the build. Use it for every pattern so entries stay consistent.
- **`update-changelog` skill** (`.claude/skills/update-changelog/SKILL.md`) — adds an entry to `CHANGELOG.md` for a notable change.
