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
│   ├── agents/          # Agent definitions (spec-writer, frontend-developer, devops)
│   └── skills/          # Skill definitions (build-feature, build-spec, update-changelog)
├── src/                 # Website source code
│   ├── index.html       # Single-page site entry point
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

- None. No `package.json`, no npm/Node dependency, no bundler, no build step.
- Files are authored directly and served as-is.
- Local preview: open the HTML files directly in a browser, or use any simple static file server.

### Hosting & deployment

- **GitHub Pages**, serving directly from this repository.
- Custom domain `kaloyandrenski.com` configured via a `CNAME` file.

### Rationale

This site is meant to be minimal, fast, and content-focused. A plain HTML/CSS/JS stack with no build tooling keeps the project simple to maintain, avoids dependency upkeep, and matches the small scope of a personal portfolio site.

## Design System

`DESIGN_SYSTEM.md` is the single source of truth for colors, typography, spacing, shape, and interaction states. Any frontend implementation must follow it strictly — no hardcoded colors/fonts/spacing outside its tokens.

## Rules

- **Specs-first**: no implementation without a corresponding spec. Specifications are written before implementation.
- **Spec required, no exceptions**: a feature MUST have a spec file in `specs/` before any code is written. This is a hard guardrail — never implement "just this once" without one.
- **One spec per feature**: each feature gets a single markdown file in `specs/`, following the format in `specs/TEMPLATE.md`.
- **Numbered spec filenames**: each spec file is named `specs/<n>-<kebab-case-feature-name>.md`, where `<n>` is the next sequential integer across all specs in `specs/` (1, 2, 3, ...) in the order they were created. This keeps spec creation order visible at a glance.
- **Simplicity**: no frameworks, no build step, no unnecessary dependencies. Keep it plain HTML/CSS/JS per the tech stack above.
- **Changelog required**: every feature implementation (not trivial tweaks) gets an entry in `CHANGELOG.md`, written via the `update-changelog` skill (`.claude/skills/update-changelog/SKILL.md`) — see the Workflow section below.

## Local UI QA

The repository configures the identical loopback-only Playwright MCP server for three clients: `.vscode/mcp.json` (VS Code/Copilot), `.mcp.json` (Claude Code), and `.codex/config.toml` (trusted Codex projects). It runs `npx -y @playwright/mcp@latest --headless --isolated --allowed-hosts localhost,127.0.0.1,[::1]`. This is local development tooling, not a website dependency or build step.

For Claude Code, use `/ui-qa [optional feature or page scope]`. Codex does not provide a `/ui-qa` slash command. When a developer asks Codex to run UI QA, it must use its configured Playwright MCP server and follow the same contract below. `/mcp` only inspects connected MCP servers; it does not run QA.

This contract applies only when UI QA is requested, including the rendered-site verification step of the feature-delivery workflow. It does not make browser QA mandatory for unrelated Codex tasks or infrastructure-only changes.

- Serve `src/` as static files on a loopback interface only, then test only its `localhost`, `127.0.0.1`, or `[::1]` HTTP URL. Never test `file://`, the deployed portfolio, or an external site. Stop only preview processes you started.
- Use Playwright MCP for every browser check. If its server/browser, the preview, or the local connection is unavailable, report affected browser checks as **BLOCKED**, never as passed.
- For the requested page or feature, read the applicable spec and verify relevant acceptance criteria. At both 1440 × 900 and 375 × 667, check page loading and console errors, affected primary navigation and controls, changed interactions, visible keyboard focus for affected controls, horizontal overflow, overlapping content, and clipped essential content. Mark irrelevant checks **NOT APPLICABLE** with a reason.
- Report every check as **PASSED**, **FAILED**, **BLOCKED**, or **NOT APPLICABLE** in a table containing the check, status, page, viewport, and notes. For each failure, give expected versus observed behavior and reproducible steps starting with the local preview URL. Do not claim overall success if a required check failed or was blocked.

## Workflow for agents

There are two implementer agents, split by domain:

- **`frontend-developer`** (`.claude/agents/frontend-developer.md`) — site content, markup, styling, and client-side behavior under `src/`, governed by `DESIGN_SYSTEM.md`.
- **`devops`** (`.claude/agents/devops.md`) — CI/CD, GitHub Actions workflows, GitHub Pages publishing configuration, and repo-root deployment files (e.g. `CNAME`). Never touches `src/`.

Route each request to the implementer matching its domain. A request that spans both should be split into separate spec/implement passes, one per domain.

Two equivalent ways to deliver a feature:

- **Manual**: delegate spec creation to the spec-writer agent (`.claude/agents/spec-writer.md`), then implementation to whichever implementer agent matches the request's domain.
- **`build-feature` skill** (`.claude/skills/build-feature/SKILL.md`): runs the same pipeline end to end — domain + weight classification, spec-writer, a domain-specific implementation brief, the matching implementer agent, and verification.

To just start or iterate on a spec without building yet, use the **`build-spec` skill** (`.claude/skills/build-spec/SKILL.md`) — an interactive front end to `spec-writer` that stops once the spec is finalized.

To add or fix a changelog entry outside the full pipeline (a manual change, a retroactive entry), use the **`update-changelog` skill** (`.claude/skills/update-changelog/SKILL.md`) directly — `build-feature` also calls it internally at delivery time.

Manual steps, if not using the skill:

1. Before implementing a feature, check `specs/` for an existing spec covering it.
2. If no spec exists, stop and delegate spec creation to the spec-writer agent (`.claude/agents/spec-writer.md`), passing along the feature request and any other inputs/context gathered so far. Do not implement without a spec.
3. Once the spec-writer agent produces the spec, review it against the Rules and Tech Stack sections above before proceeding.
4. Consult the Rules and Tech Stack sections above before making implementation decisions.
5. Decide the domain (frontend vs. devops/infra) and delegate implementation to the matching agent above. Implement only what the spec describes — keep scope matched to the spec.
