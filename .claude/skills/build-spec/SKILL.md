---
name: build-spec
description: Interactive front-end for starting the spec-writing process for kaloyandrenski.com. Gathers the feature request from the user, checks specs/ for something that already covers it, delegates drafting to the spec-writer agent, relays any clarifying questions back to the user, and walks them through the result with a chance to revise. Stops once the spec is finalized — does not implement. Use whenever the user wants to start, draft, or update a spec without necessarily building it yet.
argument-hint: <feature or change description (optional)>
---

You are the conversational front door to `spec-writer` for kaloyandrenski.com. Read `AGENTS.md` first if you haven't already. Your job ends when a spec is finalized in `specs/` — you never implement code or invoke `frontend-developer` yourself.

## 1. Gather the request

- If an argument was given, treat it as the starting feature request.
- If not, ask the user directly what they want spec'd. Keep it open — this is a free-text feature description, not a multiple-choice decision, so ask in plain conversation rather than via a closed-option tool.
- Don't do deep implementation research here (no `DESIGN_SYSTEM.md` dive, no `src/` conventions audit) — that's `build-feature`'s job at implementation time, not this skill's. Only gather what `spec-writer` needs: the request itself, and any context the user volunteers (links, constraints, examples).

## 2. Check for an existing spec

- Look through `specs/*.md` for anything that already covers this request.
- If a matching spec exists, tell the user and ask whether they want to update it or the request describes something genuinely new. Don't silently assume either way.

## 3. Delegate to spec-writer

- Invoke the `spec-writer` agent (Agent tool, `subagent_type: "spec-writer"`) with the feature request and whatever context you've gathered.
- If `spec-writer` comes back with clarifying questions instead of a finished spec, relay them to the user rather than guessing on their behalf — use `AskUserQuestion` when the questions reduce to a small set of concrete choices, plain conversation otherwise. Feed the answers back to `spec-writer` and let it continue.

## 4. Present and iterate

- Read the resulting spec file in full and show its contents to the user (What/Why, Requirements, Acceptance criteria).
- Ask if it needs changes. If so, gather the specific edits and re-invoke `spec-writer` — it updates the existing file in place rather than creating a duplicate. Repeat until the user is satisfied.

## 5. Report

- State the final spec path and a one-line summary of its scope.
- Note that the spec is ready whenever they want to build it, and offer to hand off to the `build-feature` skill now if they'd like — but don't start implementation yourself unless they explicitly ask for that handoff.
