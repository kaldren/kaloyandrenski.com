---
name: ui-qa
description: Run local browser QA for a browser-visible feature through the repository's Playwright MCP server.
argument-hint: [feature or page scope]
---

Delegate to the `ui-qa` agent with the supplied scope, relevant spec, and acceptance criteria. If no scope is supplied, use the home page (`/`).

The agent first decides whether the change is browser-visible:

- Browser-visible: serve `src/` locally and run the Playwright MCP checks.
- Not browser-visible: return **NOT APPLICABLE** without opening a browser.

Return the agent's report without changing its substance. A **FAILED** result requires a fix and rerun. A **BLOCKED** result means browser verification is incomplete.
