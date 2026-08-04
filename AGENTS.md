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
│   ├── agents/          # Agent definitions (spec-writer, frontend-developer)
│   └── skills/          # Skill definitions (build-feature, build-spec)
├── src/                 # Website source code
│   ├── index.html       # Single-page site entry point
│   └── public/          # Static assets served as-is (images, styles.css, etc.)
├── specs/               # Feature specifications (one file per feature)
│   └── TEMPLATE.md      # Spec format for new features
├── AGENTS.md            # This file
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
- **Simplicity**: no frameworks, no build step, no unnecessary dependencies. Keep it plain HTML/CSS/JS per the tech stack above.

## Workflow for agents

Two equivalent ways to deliver a feature:

- **Manual**: delegate spec creation to the spec-writer agent (`.claude/agents/spec-writer.md`), then implementation to the frontend-developer agent (`.claude/agents/frontend-developer.md`).
- **`build-feature` skill** (`.claude/skills/build-feature/SKILL.md`): runs the same pipeline end to end — classification, spec-writer, implementation brief, frontend-developer, and browser verification.

To just start or iterate on a spec without building yet, use the **`build-spec` skill** (`.claude/skills/build-spec/SKILL.md`) — an interactive front end to `spec-writer` that stops once the spec is finalized.

Manual steps, if not using the skill:

1. Before implementing a feature, check `specs/` for an existing spec covering it.
2. If no spec exists, stop and delegate spec creation to the spec-writer agent (`.claude/agents/spec-writer.md`), passing along the feature request and any other inputs/context gathered so far. Do not implement without a spec.
3. Once the spec-writer agent produces the spec, review it against the Rules and Tech Stack sections above before proceeding.
4. Consult the Rules and Tech Stack sections above before making implementation decisions.
5. Implement only what the spec describes — keep scope matched to the spec.
