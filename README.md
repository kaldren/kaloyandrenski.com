# About kaloyandrenski.com

kaloyandrenski.com is a personal website that serves as a professional portfolio for Kaloyan Drenski - an AI Solution Architect specializing in agentic AI, multi-agent systems, and enterprise AI architecture and transformation. It highlights his expertise in software development, certifications, and technical writing.

The goal is to build a minimal, fast, and content-focused website that showcases my professional profile, expertise, certifications, and technical writing.

The website is a single-page experience, with dedicated pages only for blog posts.

This project follows a **Specs-First Development** approach, where specifications are written before implementation.

---

## Building a Feature

There are two ways to build a feature or change on this site:

1. **Manual**: ask the `spec-writer` agent to write a spec in `specs/`, then ask the `frontend-developer` agent to implement it against that spec.
2. **`build-feature` skill**: run `/build-feature <description>` to drive the whole pipeline in one go — it classifies the request, delegates to `spec-writer` when a spec is needed, builds an implementation brief, hands off to the matching implementer, and runs browser QA for rendered-site work before completion.

Either way, no code is implemented without a spec in `specs/` (see `AGENTS.md`).

### UI QA

The repository configures the same loopback-only Playwright MCP server for three supported clients. It may provision the server and browser through `npx` on the developer machine, without adding a website dependency. QA serves `src/` locally and never uses or changes the deployed site.

| Client | Project configuration | How to use it |
| --- | --- | --- |
| Claude Code | `.mcp.json` | Trust/open the repository and approve the project MCP server if prompted, then run `/ui-qa [optional feature or page scope]`. It delegates to the `ui-qa` agent and reports each check as PASSED, FAILED, BLOCKED, or NOT APPLICABLE. |
| Codex | `.codex/config.toml` | Open the repository as a trusted project and approve the configured MCP server or `npx` execution if prompted. Ask Codex to run UI QA; it performs the same local QA and report contract in `AGENTS.md`. Codex has no `/ui-qa` command. |
| VS Code/Copilot | `.vscode/mcp.json` | Open the repository as a trusted workspace and approve the configured MCP server if prompted. |

With no scope, Claude Code UI QA checks the home page; provide a changed page or feature scope to check affected pages. In every client, `/mcp` only inspects connected MCP servers; it does not run UI QA.

---

## Project Structure

```text
kaloyandrenski.com/
├── .claude/             # Claude Code configuration for this repo
│   ├── agents/          # Agent definitions (spec-writer, frontend-developer, devops, ui-qa)
│   └── skills/          # Skill definitions (build-feature, build-spec, ui-qa, update-changelog)
├── .codex/
│   └── config.toml      # Trusted-project Playwright MCP configuration for Codex
├── .vscode/
│   └── mcp.json         # Workspace-local Playwright MCP configuration
├── .mcp.json            # Project-scoped Playwright MCP configuration for Claude Code
├── src/                 # Website source code
│   ├── index.html       # Single-page site entry point
│   └── public/          # Static assets served as-is (images, styles.css, etc.)
├── specs/               # Feature specifications (one file per feature)
│   └── TEMPLATE.md      # Spec format for new features
├── AGENTS.md            # Goals, tech stack, and rules for AI agents
├── DESIGN_SYSTEM.md     # Source of truth for colors, type, spacing, shape
└── README.md
```