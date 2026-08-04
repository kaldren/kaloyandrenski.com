# Feature: GitHub Pages deploy pipeline

## What / Why

The site currently has no automated deployment — there is no `.github/workflows` directory, and the site source lives in `src/` (not the repo root), so it cannot simply be served by GitHub Pages' default branch-root publishing without extra configuration. This feature adds a CI/CD pipeline (a GitHub Actions workflow) that automatically publishes the site to GitHub Pages every time changes are pushed to `main`, so the live site at kaloyandrenski.com always reflects the latest pushed content without any manual publish step.

Note: this is an infrastructure/tooling feature, not a visual one. Requirements and acceptance criteria below are scoped to deploy behavior; DESIGN_SYSTEM.md and visual/UX conventions do not apply here.

## Requirements

- Every push to `main` automatically triggers a deployment that publishes the current contents of `src/` (the site source: `src/index.html` as the entry point, `src/public/` as static assets) to GitHub Pages — no manual build or publish steps required.
- Deployment is a publish-only step, not a build step: the site source is used as-is, with nothing compiled or transformed, consistent with `AGENTS.md`'s no-build-tooling rule.
- After a successful deploy, the live site at the custom domain kaloyandrenski.com reflects the pushed content.
- The custom domain continues to resolve correctly after every deploy — the published output carries whatever GitHub Pages needs (e.g. a `CNAME` file) so it keeps serving `kaloyandrenski.com` rather than reverting to the default `*.github.io` URL.
- The workflow triggers only on pushes to `main` — pushes to other branches, and other events, do not trigger a deployment, so in-progress work elsewhere doesn't affect the live site.
- If a deployment run fails, the failure is visible in the repository's GitHub Actions run history, and the previously deployed live site is left unaffected (no partial or broken publish).
- The pipeline introduces no new runtime dependencies, frameworks, or package managers into the website itself (no `package.json`, no build scripts added under `src/`) — it is CI/CD configuration only, living under `.github/workflows/`.

## Acceptance criteria

- [ ] A GitHub Actions workflow file exists under `.github/workflows/` that triggers automatically on every push to `main`.
- [ ] The workflow publishes the contents of `src/` to GitHub Pages, with `src/index.html` served at the site root.
- [ ] After a push to `main`, the workflow run completes successfully and the pushed change is visible live at kaloyandrenski.com with no manual publish step.
- [ ] The custom domain kaloyandrenski.com continues to serve the site correctly after a deploy (no reversion to a `*.github.io` URL, no domain-verification breakage).
- [ ] Static assets under `src/public/` (images, `styles.css`, certification badges, etc.) load correctly on the live site after a deploy.
- [ ] Pushing to a branch other than `main` does not trigger a deployment.
- [ ] If a workflow run fails, the failure is visible in the repository's Actions tab, and the previously live site remains unchanged.
- [ ] No new files or dependencies are added inside `src/` as part of this feature (e.g. no `package.json`, no build scripts) — only workflow file(s) under `.github/workflows/` and, if required for the custom domain, a `CNAME` file.
- [ ] The repository's GitHub Pages source setting is configured to deploy via GitHub Actions (a one-time manual repository settings change, not a code change) so the workflow's deployments actually go live.
