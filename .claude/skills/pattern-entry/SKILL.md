---
name: pattern-entry
description: Adds a new entry to the /patterns/ page of kaloyandrenski.com, or revises one. That covers a generic architecture pattern, or a cloud architecture built from real services (Microsoft Azure today, more clouds later). It follows the page's fixed tracks, categories, entry formats and diagram language. It writes the markdown entry and its class-only SVG diagram, files it under the right track and category, numbers it, cross-links related entries and runs the build. Use whenever the user asks to add, write, draft, document, diagram or revise an architecture pattern, design pattern, agentic AI pattern or cloud (Azure, Google Cloud, AWS) reference architecture for the patterns page, e.g. "add a pattern for routing", "add an Azure architecture for RAG" or "/pattern-entry Circuit Breaker".
argument-hint: '<pattern or architecture name, optionally the track, e.g. "Routing" or "Azure: RAG with AI Search">'
---

You are adding or revising an entry on the `/patterns/` page of kaloyandrenski.com. Every entry must look and read like the ones already in its track: same sections, same diagram language, same tone. Don't invent a new layout, node kind, color, section or track. If something doesn't fit the format, say so and ask instead of improvising.

## 0. Load the rules

Read these before writing anything:

- `AGENTS.md`, for the site's rules.
- `src/patterns/catalog.json`, the tracks (the generic AI and software architecture tracks, then one per cloud), each with its `format`, number `prefix` and allowed `categories`.
- The format for the track you're writing in:
  - generic tracks (`"format": "pattern"`): [reference/entry-format.md](reference/entry-format.md)
  - cloud track (`"format": "cloud"`): [reference/cloud-format.md](reference/cloud-format.md)
- [reference/diagram-spec.md](reference/diagram-spec.md), the diagram language shared by every track, plus the cloud additions.
- The "Pattern diagrams" section of `DESIGN_SYSTEM.md`.
- Every entry and diagram in the track you're writing in (`src/patterns/entries/<track>/`, `src/patterns/diagrams/<track>/`). They are the canonical examples. For a cloud entry, also read the generic patterns it could implement.

## 1. Pin down the entry

Use the skill argument. If it names an existing entry, you are revising. Keep its slug, track and `order`, because other pages may link to `/patterns/#<slug>`. Then skip to step 4.

For a new entry:
- **Track:** an idea that works on any platform belongs in a generic track: patterns for agentic AI in the AI Architecture track (`generic`), patterns for structuring application code, such as layers, modules and feature slices, in the Software Architecture track (`software`). A design built from one provider's real services belongs in that provider's track.
  - If the user names a cloud that has no track yet (say Google Cloud), stop and follow "Adding a cloud track" below. Never add a track on your own.
  - If the track is ambiguous, ask.
- **Duplicates:** check the entry isn't already covered under another name. Compare it against every `title` and `aliases` in the track. If it's a variant, propose an alias or a revision instead, and ask.
- **Vagueness:** if the request is too vague to identify one entry ("add something about memory"), ask which one.

## 2. File it

- **Category:** pick the entry in the track's `categories` whose `description` fits best, and copy its `name` exactly, including `&`.
  - If none fits, stop and ask the user, proposing a name and a one-line description.
  - Never add a category on your own. Once agreed, add it to that track in `catalog.json`, in the position the user chooses; that order is the order of the sidebar groups.
- **Slug:** the file name, in lowercase kebab-case. It becomes the anchor `/patterns/#<slug>`, which must be unique across all tracks. Cloud entries end with the provider: `rag-with-ai-search-azure`.
- **Paths:** `src/patterns/entries/<track>/<slug>.md` and `src/patterns/diagrams/<track>/<slug>.svg`.
- **Order:** one more than the highest `order` in the same track. You don't set the number shown on the page: the build groups entries by category, numbers them per track and adds the track prefix (`03`, `AZ-02`).

## 3. Write the entry

Copy the template for the track's format: [templates/entry.md](templates/entry.md) for generic, [templates/cloud-entry.md](templates/cloud-entry.md) for cloud. Fill it in, following that format's reference exactly.

**Never invent anything.** Entries go out under Kaloyan's name.
- Every source and "Learn more" link must be real and reachable. Check each one with WebFetch when you have it. If you can't confirm a link, leave `TODO: source` and list it in your report.
- For cloud entries, every service name, feature and limit must match the provider's current documentation. Services get renamed often; check the name on the provider's docs before using it, and say in the text which parts follow a provider reference architecture and which are your own additions.
- Don't invent personal experiences, client stories or numbers. Use a `TODO:` where one is needed.

## 4. Draw the diagram

Copy [templates/diagram.svg](templates/diagram.svg) to the diagram path. Then:
1. Pick the closest layout from the diagram spec.
2. Open the existing diagram with that layout and reuse its geometry, so sizes, gaps and label positions match.
3. Follow [reference/diagram-spec.md](reference/diagram-spec.md) for node kinds, edge types, boundaries and label rules. In cloud diagrams, the node label is the short service name and the subtitle is its role.
4. Write the `<title>` and the entry's `figure` caption so they describe the same flow.

## 5. Cross-link

- **`related`:** 0–3 entries a reader of this one should read next, in any track. Add this entry's slug to their `related` lists too, so the links go both ways. Keep every list at 3 or fewer.
- **`implements`** (cloud entries only): the generic patterns this architecture builds. The build adds the "In the cloud" link back on each generic pattern automatically, so don't edit those entries for it. If the architecture implements an idea that has no generic entry yet, say so in your report and suggest writing it.

## 6. Build and look

1. Run `npm run build:blog`. It checks the track folder, category, sections and their order, `services` and `implements`, the diagram rules, `order` uniqueness per track and every link. Fix every error. Don't work around a check.
2. Look at the diagram at desktop and phone widths. If a Playwright MCP server is available, serve `_site/` on loopback, open `/patterns/#<slug>`, and screenshot the figure at 1280px and 390px wide. Otherwise ask the user to open it, or suggest `/ui-qa patterns page`. Check for:
   - labels overlapping arrows or nodes
   - text running outside its box
   - arrows that don't meet their target
   - boundary labels colliding with nodes

   Fix what you find. The build can't catch these.

## 7. Checklist

- [ ] The entry is in the right track folder, and `category` matches one of that track's categories exactly.
- [ ] The sections match the track's format, in order. Generic entries open with a `###` scene title.
- [ ] `summary` is one sentence; `figure` matches the diagram; `caution` names a real failure mode and what to do about it.
- [ ] Cloud entries only: every service in `services` uses its current official name, appears in the diagram or text, and has a one-line role. `implements` names at least one generic pattern.
- [ ] The diagram uses only the node kinds, edge classes and boundaries in the spec, with no colors, styles, `width` or `height`, and every id starts with `<slug>-`.
- [ ] The main path is `edge--main`; failure, optional and re-plan flows are `edge--optional`.
- [ ] Code follows its format's conventions: Python helpers for generic entries, Bicep (or the provider's IaC) for cloud entries.
- [ ] `related` links go both ways, with 3 or fewer per entry.
- [ ] Every link is verified, or marked `TODO`.
- [ ] The build passes, and the diagram has no overlaps at either width.

## 8. Report

Tell the user:
- the files created or changed
- the track, the category and the number the entry now has on the page
- the links added (`related`, and what it implements)
- every `TODO:`, and every name or source you couldn't confirm
- which parts of a cloud design are your own additions rather than the provider's reference
- what you checked visually

A new or revised entry is content, like a blog post, so it needs no `CHANGELOG.md` entry unless the user asks for one.

## Adding a cloud track

Only when the user asks for a new cloud (e.g. Google Cloud, AWS):

1. Propose a track and get the user's OK on the name, prefix and starting categories. For example:

   ```json
   { "id": "gcp", "name": "Google Cloud", "group": "Cloud", "prefix": "GCP", "format": "cloud", "provider": "Google Cloud", "description": "…", "categories": [ … ] }
   ```

   Mirror the Azure track's category structure where it fits, so tracks are easy to compare.
2. Add the track to `catalog.json`, after the existing cloud tracks, and create `src/patterns/entries/<id>/` and `src/patterns/diagrams/<id>/`.
3. The `cloud-format.md` rules apply unchanged. For the Deploy it section, use the provider's usual IaC: Terraform for Google Cloud or AWS, unless the user prefers another.
4. A track with no entries doesn't appear on the page, so add its first entry in the same change.
5. Adding a track is a site change, so add a `CHANGELOG.md` entry with the update-changelog skill.
