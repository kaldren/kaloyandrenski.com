---
name: update-changelog
description: Adds an entry to CHANGELOG.md for kaloyandrenski.com, following the project's Keep a Changelog style (grouped by date, newest first, categorized as Added/Changed/Removed). Callable standalone for a manual or retroactive entry, or invoked by the build-feature skill at the end of a feature delivery pass. Use whenever the user asks to log, record, or add a changelog entry for a change.
argument-hint: <change description (optional)>
---

You are updating `CHANGELOG.md` for kaloyandrenski.com. Read `AGENTS.md` first if you haven't already.

## 1. Gather what to log

Collect three things:
- **Description** — from the skill argument if given, from context already established by the caller (e.g. `build-feature` handing off a completed feature), or by asking the user directly if neither is available.
- **Category** — `Added`, `Changed`, or `Removed`.
- **Spec link** — if the change has a corresponding file in `specs/`, note its path.

If the description or category is ambiguous, ask rather than guess.

## 2. Locate or create today's date section

Read `CHANGELOG.md`. Entries are grouped under `## YYYY-MM-DD` headings, newest first, at the top of the file (below the intro paragraph).

- If a section for today's date already exists, use it.
- If not, create a new `## YYYY-MM-DD` section above all existing date sections.

## 3. Write the entry

Under the matching `### Added` / `### Changed` / `### Removed` subheading (create the subheading if it doesn't exist yet in today's section), add a bullet:

- One or two sentences, written from a user-facing/product angle — what changed for someone using the site, not implementation detail.
- Bold the feature/change name at the start of the bullet, matching the existing style in the file.
- Append the spec link if one exists: `([spec](specs/<n>-<name>.md))`.

## 4. Report

State the exact entry text added and which date section it went under.
