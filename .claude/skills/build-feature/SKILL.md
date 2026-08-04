---
name: build-feature
description: End-to-end feature delivery pipeline for kaloyandrenski.com. Classifies the request (trivial tweak vs. feature, and frontend vs. devops/infra), delegates spec creation to spec-writer when a spec is needed, researches the right conventions to produce a concrete implementation brief, hands the spec + brief to frontend-developer or devops depending on the domain, then verifies the result against acceptance criteria. Use whenever the user asks to build, add, change, or fix something on the site or its deployment pipeline.
argument-hint: <feature or change description>
---

You are orchestrating a full feature-delivery pass for kaloyandrenski.com. Read `AGENTS.md` first if you haven't already — it's the source of truth for goals, tech stack, and rules this whole pipeline enforces.

## 1. Classify the request

First, classify by **domain** — this decides which implementer agent handles the work:
- **Frontend** — anything touching site content, markup, styling, or client-side behavior under `src/` (HTML structure, CSS, vanilla JS, DESIGN_SYSTEM.md-governed UI). Implementer: `frontend-developer`.
- **DevOps/infra** — anything touching CI/CD, GitHub Actions workflows, GitHub Pages publishing configuration, or repo-root deployment files (e.g. `CNAME`) — nothing under `src/`. Implementer: `devops`.

If a single request spans both (e.g. a feature needs a new static asset path *and* a deploy workflow change), split it: run the two domains as separate passes through steps 2–5 below, each with its own implementer, rather than blending the briefs.

Then classify by **weight**:
- **Trivial** — a copy/content tweak, a single CSS value change, an obvious bug fix in existing markup, or a small config tweak in an existing workflow file — introduces no new structure or behavior.
- **Feature** — anything that adds or changes structure, behavior, or a new component/section/page/workflow.

Default to **feature** when it's ambiguous. The trivial path is only for unambiguous cases. State both classifications (domain and weight) and one-line reasoning to the user before continuing.

## 2. Get or skip the spec

- **Trivial** → skip `spec-writer` entirely. Carry the request text forward as the working "spec" for the rest of this pipeline.
- **Feature** → check `specs/*.md` for an existing spec that already covers this request.
  - If one exists, read it in full.
  - If none exists, invoke the `spec-writer` agent (Agent tool, `subagent_type: "spec-writer"`) with the feature request and any context you've gathered (user's own wording, relevant existing files). Wait for it to report the spec path, then read the resulting spec in full.
  - Sanity-check the spec against `AGENTS.md`'s Rules and Tech Stack sections. If something conflicts (scope creep, a disallowed dependency, something that contradicts the single-page/no-build-step rules), flag it to the user rather than silently accepting the spec.

## 3. Build an implementation brief yourself — do not delegate this step

This is the part that makes the pipeline worth running instead of just handing the spec straight to an implementer. Do the research yourself, tailored to the domain from step 1:

**Frontend:**
- Read `DESIGN_SYSTEM.md` in full. Identify which existing tokens/components/colors apply to this feature. If the feature needs something the design system doesn't cover, note that `DESIGN_SYSTEM.md` needs a small, deliberate addition first (per its own extension rule) rather than letting the implementer invent one-off values.
- Skim existing files under `src/` for structural conventions already in use — naming, file/module organization, how nav/sections/scripts are wired together — so the new work matches instead of introducing a new pattern. If `src/` is empty (true for the very first feature on this site), skip this and note there's no existing convention to match yet.
- Write a short, concrete brief covering:
  - Which files to create or touch.
  - The HTML structural approach (semantic elements, where it sits in the page/nav).
  - Which `DESIGN_SYSTEM.md` tokens to use for color/type/spacing.
  - Any new component pattern needed, and whether `DESIGN_SYSTEM.md` must be extended first.
  - JS module boundaries, if the feature needs interactivity.
  - Accessibility notes (keyboard nav, contrast, semantics) relevant to this specific feature.

**DevOps/infra:**
- Re-read `AGENTS.md`'s Tech Stack (Tooling & build process, Hosting & deployment) and Rules sections — these are hard constraints (no build step, no new runtime dependencies in `src/`).
- Skim existing files under `.github/workflows/` and any repo-root deployment files (e.g. `CNAME`) so new work matches current structure and doesn't duplicate or conflict with it. If none exist yet, note there's no existing convention to match yet.
- Write a short, concrete brief covering:
  - Which workflow file(s) or repo-root config to create or touch.
  - Trigger conditions (events, branches) per the spec.
  - Required permissions, kept minimal.
  - Which official GitHub Actions to use for the publish steps.
  - How the custom domain (`CNAME`) is preserved across deploys.
  - Any one-time manual GitHub repo-settings change the user will need to make (e.g. Pages source set to "GitHub Actions"), flagged clearly since no implementer can do this from the repo alone.

Show this brief — plus the spec, if there is one — to the user and wait for their go-ahead before moving to implementation. This is the review checkpoint: it's about the *how*, not just the *what* the spec already covered.

## 4. Implement

Invoke the matching implementer agent (Agent tool) for the domain classified in step 1:
- **Frontend** → `subagent_type: "frontend-developer"`.
- **DevOps/infra** → `subagent_type: "devops"`.

Pass it:
- The spec file path (or the trivial request text, if you skipped spec-writer).
- The full implementation brief from step 3, as explicit guidance — it should be implementing against a concrete plan, not re-deriving one from the spec alone.

If the request was split across both domains in step 1, run this step (and step 5) once per domain, with each implementer scoped strictly to its own brief.

## 5. Verify

**Frontend**, after `frontend-developer` reports back:
- Serve the site locally with a simple static file server (no build step exists for this site per `AGENTS.md`).
- Use the Chrome browser tool to open the changed page(s).
- Walk through each acceptance criterion from the spec (or the original request, for trivial changes) and confirm it visually.
- If something can't be verified this way (e.g. it depends on a specific device/viewport, or on content you can't see in a static preview), say so explicitly rather than claiming full verification.

**DevOps/infra**, after `devops` reports back:
- Walk through each acceptance criterion from the spec (or the original request, for trivial changes) against what was actually implemented (trigger conditions, permissions, publish steps, domain handling).
- A live deploy can't be verified from this environment — note explicitly which criteria only become verifiable after an actual push to `main` (e.g. a successful Actions run, the live site reflecting the change, the custom domain still resolving), and any manual repo-settings step the user still needs to complete.

## 6. Report

Summarize for the user:
- Classification (domain, and trivial/feature) and why.
- The spec used, if any.
- Key points from the implementation brief.
- Files created/changed.
- Verification outcome per acceptance criterion.
- Anything flagged or left unresolved (design-system conflicts, unverifiable deploy criteria, manual repo-settings steps still needed, scope the implementer couldn't fully satisfy).
