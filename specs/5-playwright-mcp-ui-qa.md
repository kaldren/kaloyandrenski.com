# Feature: Playwright MCP UI QA

## What / Why

Provide the same local Playwright MCP browser-QA capability to VS Code/Copilot, Claude Code, and Codex so agents can validate rendered-site work consistently before visual regressions reach the live portfolio, without deploying or changing the site's runtime stack.

## Requirements

- VS Code/Copilot, Claude Code, and Codex can each discover a project-scoped Playwright MCP server for this repository.
- The VS Code/Copilot configuration remains in `.vscode/mcp.json`; Claude Code uses a project-scoped `.mcp.json` stdio-server configuration; and trusted Codex projects use `.codex/config.toml` with a `[mcp_servers.playwright]` entry containing `command` and `args`.
- Each supported client starts the same `npx -y @playwright/mcp@latest --headless --isolated --allowed-hosts localhost,127.0.0.1,[::1]` server command, preserving the existing loopback-only host policy.
- Repository agents can access Playwright MCP through local development configuration without adding website runtime dependencies, a build step, or changes to the GitHub Pages deployment workflow.
- A dedicated UI QA agent validates the locally served site in a real browser and reports each check as passed, failed, or not applicable, with enough detail to reproduce failures.
- The QA agent checks that the affected page loads without browser console errors, that relevant feature acceptance criteria are satisfied, and that existing primary navigation and interactive elements affected by the change remain usable.
- UI checks cover a small phone viewport and a desktop viewport, including keyboard-visible focus and the absence of horizontal overflow, overlapping content, or clipped essential content in affected areas.
- The feature-delivery workflow automatically invokes the UI QA agent after implementation of a feature that changes the rendered site, before reporting the feature as complete; infrastructure-only changes are explicitly outside this automatic browser QA scope.
- Claude Code users can invoke the existing `/ui-qa` workflow manually against the current local site with an optional feature or page scope.
- Codex agents use the configured Playwright MCP tools to perform the same local QA checks and report contract when asked; no Codex slash-command workflow is claimed or required, and `/mcp` remains limited to MCP server inspection.
- Automated and manual QA use a local preview of the files served as-is from `src/`; they do not require a production deployment, external website changes, or modifications to the site source.
- All supported clients use Playwright MCP only against a loopback-served local preview and never against the deployed portfolio or another external site.
- QA failures are surfaced to the calling workflow or developer as failures rather than being silently ignored, while an unavailable local browser or preview is reported clearly as a blocked verification.

## Acceptance criteria

- [ ] VS Code/Copilot recognizes the `playwright` server defined in `.vscode/mcp.json`, Claude Code recognizes the `playwright` stdio server defined in project-scoped `.mcp.json`, and Codex recognizes the `playwright` server in `.codex/config.toml` for a trusted project.
- [ ] The Claude configuration is valid JSON containing a stdio Playwright server, and the Codex configuration is valid TOML containing `[mcp_servers.playwright]` with `command` and `args`.
- [ ] The three client configurations specify the identical Playwright MCP invocation: `npx -y @playwright/mcp@latest --headless --isolated --allowed-hosts localhost,127.0.0.1,[::1]`.
- [ ] A developer using Claude Code can run `/ui-qa` and receive a browser-based pass/fail report for the current local site without deploying it.
- [ ] When asked to perform UI QA, a Codex agent can use its configured Playwright MCP server to produce the same browser-based pass/fail report for the current local site without deploying it; this does not require or advertise a Codex `/ui-qa` command.
- [ ] Running the manual QA command opens the local home page successfully and reports whether browser console errors occurred during the check.
- [ ] The manual QA report verifies the site at both a small phone-sized viewport and a desktop-sized viewport, identifying any horizontal overflow, overlapping content, or clipped essential content it finds in the checked area.
- [ ] For an interactive UI change, the QA report verifies the changed interaction in the browser and verifies that affected controls can receive a visible keyboard focus indicator.
- [ ] After a rendered-site feature is implemented through the normal feature-delivery workflow, the workflow automatically produces the same UI-QA result before it reports completion.
- [ ] A failed UI check is clearly reported as failed with the page, viewport, and observed problem, so it can be reproduced locally.
- [ ] When browser QA cannot run because the local preview or Playwright MCP is unavailable, the result is explicitly reported as blocked rather than as a passing check.
- [ ] QA performed through any supported client runs only against the locally served static site at `localhost`, `127.0.0.1`, or `[::1]`, leaves the deployed GitHub Pages site unchanged, and does not open an external or production site.
- [ ] Adding the supported-client QA configurations does not add a website runtime dependency, build step, or GitHub Pages deployment change.
