---
name: build-feature
description: End-to-end feature delivery pipeline for kaloyandrenski.com. Classifies the request (trivial tweak vs. feature), delegates spec creation to spec-writer when a spec is needed, researches DESIGN_SYSTEM.md and existing src/ conventions to produce a concrete implementation brief, hands the spec + brief to frontend-developer, then visually verifies the result in a browser against acceptance criteria. Use whenever the user asks to build, add, change, or fix something on the site.
argument-hint: <feature or change description>
---

You are orchestrating a full feature-delivery pass for kaloyandrenski.com. Read `AGENTS.md` first if you haven't already — it's the source of truth for goals, tech stack, and rules this whole pipeline enforces.

## 1. Classify the request

Decide whether the request is:
- **Trivial** — a copy/content tweak, a single CSS value change, or an obvious bug fix in existing markup that introduces no new structure or behavior.
- **Feature** — anything that adds or changes structure, behavior, or a new component/section/page.

Default to **feature** when it's ambiguous. The trivial path is only for unambiguous cases. State your classification and one-line reasoning to the user before continuing.

## 2. Get or skip the spec

- **Trivial** → skip `spec-writer` entirely. Carry the request text forward as the working "spec" for the rest of this pipeline.
- **Feature** → check `specs/*.md` for an existing spec that already covers this request.
  - If one exists, read it in full.
  - If none exists, invoke the `spec-writer` agent (Agent tool, `subagent_type: "spec-writer"`) with the feature request and any context you've gathered (user's own wording, relevant existing files). Wait for it to report the spec path, then read the resulting spec in full.
  - Sanity-check the spec against `AGENTS.md`'s Rules and Tech Stack sections. If something conflicts (scope creep, a disallowed dependency, something that contradicts the single-page/no-build-step rules), flag it to the user rather than silently accepting the spec.

## 3. Build an implementation brief yourself — do not delegate this step

This is the part that makes the pipeline worth running instead of just handing the spec straight to `frontend-developer`. Do the research yourself:

- Read `DESIGN_SYSTEM.md` in full. Identify which existing tokens/components/colors apply to this feature. If the feature needs something the design system doesn't cover, note that `DESIGN_SYSTEM.md` needs a small, deliberate addition first (per its own extension rule) rather than letting the implementer invent one-off values.
- Skim existing files under `src/` for structural conventions already in use — naming, file/module organization, how nav/sections/scripts are wired together — so the new work matches instead of introducing a new pattern. If `src/` is empty (true for the very first feature on this site), skip this and note there's no existing convention to match yet.
- Write a short, concrete brief covering:
  - Which files to create or touch.
  - The HTML structural approach (semantic elements, where it sits in the page/nav).
  - Which `DESIGN_SYSTEM.md` tokens to use for color/type/spacing.
  - Any new component pattern needed, and whether `DESIGN_SYSTEM.md` must be extended first.
  - JS module boundaries, if the feature needs interactivity.
  - Accessibility notes (keyboard nav, contrast, semantics) relevant to this specific feature.

Show this brief — plus the spec, if there is one — to the user and wait for their go-ahead before moving to implementation. This is the review checkpoint: it's about the *how*, not just the *what* the spec already covered.

## 4. Implement

Invoke the `frontend-developer` agent (Agent tool, `subagent_type: "frontend-developer"`). Pass it:
- The spec file path (or the trivial request text, if you skipped spec-writer).
- The full implementation brief from step 3, as explicit guidance — it should be implementing against a concrete plan, not re-deriving one from the spec alone.

## 5. Verify

After `frontend-developer` reports back:
- Serve the site locally with a simple static file server (no build step exists for this site per `AGENTS.md`).
- Use the Chrome browser tool to open the changed page(s).
- Walk through each acceptance criterion from the spec (or the original request, for trivial changes) and confirm it visually.
- If something can't be verified this way (e.g. it depends on a specific device/viewport, or on content you can't see in a static preview), say so explicitly rather than claiming full verification.

## 6. Report

Summarize for the user:
- Classification (trivial/feature) and why.
- The spec used, if any.
- Key points from the implementation brief.
- Files created/changed.
- Verification outcome per acceptance criterion.
- Anything flagged or left unresolved (design-system conflicts, criteria you couldn't verify, scope the implementer couldn't fully satisfy).
