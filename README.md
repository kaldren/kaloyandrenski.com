# About kaloyandrenski.com

kaloyandrenski.com is a personal website that serves as a professional portfolio for Kaloyan Drenski - an AI Solution Architect specializing in agentic AI, multi-agent systems, and enterprise AI architecture and transformation. It highlights his expertise in software development, certifications, and technical writing.

The goal is to build a minimal, fast, and content-focused website that showcases my professional profile, expertise, certifications, and technical writing.

The website is a single-page experience, with dedicated pages only for blog posts.

This project follows a **Specs-First Development** approach, where specifications are written before implementation.

---

## Building a Feature

There are two ways to build a feature or change on this site:

1. **Manual**: ask the `spec-writer` agent to write a spec in `specs/`, then ask the `frontend-developer` agent to implement it against that spec.
2. **`build-feature` skill**: run `/build-feature <description>` to drive the whole pipeline in one go — it classifies the request, delegates to `spec-writer` when a spec is needed, builds an implementation brief, hands off to `frontend-developer`, and verifies the result in a browser.

Either way, no code is implemented without a spec in `specs/` (see `AGENTS.md`).

---

## Project Structure

```text
kaloyandrenski.com/
├── .claude/             # Claude Code configuration for this repo
│   ├── agents/          # Agent definitions (spec-writer, frontend-developer)
│   └── skills/          # Skill definitions (build-feature)
├── src/                 # Website source code
│   ├── index.html       # Single-page site entry point
│   └── public/          # Static assets served as-is (images, styles.css, etc.)
├── specs/               # Feature specifications (one file per feature)
│   └── TEMPLATE.md      # Spec format for new features
├── AGENTS.md            # Goals, tech stack, and rules for AI agents
├── DESIGN_SYSTEM.md     # Source of truth for colors, type, spacing, shape
└── README.md
```