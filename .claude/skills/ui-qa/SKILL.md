---
name: ui-qa
description: Run browser-based UI QA for the locally served static site through Playwright MCP. Use `/ui-qa [optional feature or page scope]` after rendered-site changes or whenever a local UI check is needed.
argument-hint: [feature or page scope]
---

Run `/ui-qa [optional feature or page scope]` to validate the current local site without deploying it.

## Prerequisites

- In Claude Code, open and trust this repository so project-scoped `.mcp.json` makes the official `@playwright/mcp` server available, approving it if prompted. The same invocation is configured in `.codex/config.toml` for trusted Codex projects and `.vscode/mcp.json` for VS Code/Copilot workspaces. The server and browser may be provisioned locally by `npx`; they are not project dependencies.
- A local static preview must be possible for `src/` (for example, Python's `http.server` bound to `127.0.0.1`). Do not use `file://` URLs or the production site.

`/ui-qa [optional feature or page scope]` is a Claude Code workflow. Codex has no `/ui-qa` command: when a developer asks Codex to run UI QA, it uses the same local Playwright MCP checks and report contract described in `AGENTS.md`. In either client, `/mcp` only inspects connected MCP servers; it does not run QA.

## Workflow

1. Delegate to the `ui-qa` agent, passing the optional scope exactly as provided. If no scope was supplied, tell it to test the home page (`/`).
2. Provide the relevant spec path and implementation brief when they are known. The agent uses the specification's acceptance criteria to determine feature checks.
3. Return the agent's report unchanged in substance. It must list every check as **PASSED**, **FAILED**, **BLOCKED**, or **NOT APPLICABLE**, including page and viewport.

The QA result is a completion gate: FAILED requires a fix and another QA run; BLOCKED requires resolving the unavailable Playwright MCP server, browser, preview, or connection before claiming browser verification. The agent starts and cleans up only a local loopback preview server and never tests or changes the deployed site.
