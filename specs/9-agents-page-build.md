# Feature: Agents page build

## What / Why

The `/agents/` page from `specs/8-agents-page.md` should show the site's real crew: the agents and skills actually defined in `.claude/`, with their real descriptions, tools, and model. Its data should not be a hand-maintained copy that drifts out of date. This feature extends the existing blog build (`specs/7-blog-build-pipeline.md`) to generate the page. At build time it reads the agent and skill definitions, merges them with the hand-authored personas in `src/agents/crew.json`, and fills the page template. When an agent or skill is added or changed in `.claude/`, the live page updates on the next deploy with no hand-edited HTML.

This is a build/infrastructure feature. Visual and interaction requirements for the page belong to spec 8.

## Requirements

- **Same script, same command:** the existing build script (`scripts/build-blog.mjs`) is extended, and it still runs as `npm run build:blog`. The deploy workflow needs no change. No new dependencies are added; frontmatter is read with the existing `gray-matter`.
- **Definition sources:** the build reads the agent and skill definitions from the repository root:
  - every `.claude/agents/*.md`, as kind `agent`, id from the frontmatter `name`
  - every `.claude/skills/*/SKILL.md`, as kind `skill`, id from the frontmatter `name`

  From each it takes `name`, `description`, and, when present, `tools` and `model`. A definition missing `name` or `description`, or with unreadable frontmatter, is a build error naming the file.
- **Merge:** each definition is matched to its `crew.json` entry by kind and id. An agent and a skill may share an id, e.g. `ui-qa`. The merged entry combines:
  - the persona fields: glyph, line, owns, lane, order, replay
  - the definition's real description, tools, and model
  - the definition's repo path and GitHub URL (`https://github.com/kaldren/kaloyandrenski.com/blob/main/<path>`)

  The single `human` entry comes from `crew.json` only.
- **Filling the template:** the build fills the `<!-- BUILD:crew -->` … `<!-- /BUILD:crew -->` region of `src/agents/template.html` with exactly the markup shape documented in that template's contract comment (spec 8). This includes:
  - the status line with the real agent and skill counts
  - the lanes with nodes in `order`, the human heading each lane, and branch steps grouped
  - the support row
  - the `<script type="application/json" id="crew-data">` block

  No other part of the template is changed. A missing or duplicated region marker is a build error naming the template, as with the blog templates.
- **Escaping:** all definition and persona text inserted as markup is HTML-escaped. The JSON data block is serialized so its content cannot close the script element: `<`, `>`, and `&` are escaped as JSON unicode escapes.
- **Output:** the build writes the filled page to `_site/agents/index.html`. `_site/agents/template.html` and `_site/agents/crew.json` are not published. The rest of `src/` is copied unchanged, as before.
- **crew.json errors:** these are build errors naming `src/agents/crew.json` and the problem, reported with the existing `BuildError`/`fail` pattern (non-zero exit, GitHub Actions error annotation, nothing published):
  - **Malformed file:** the file is missing, unparseable JSON, or not an array.
  - **Bad entry:** an entry has a missing or invalid `id`, `kind`, `lane`, `order`, `glyph`, or `line`.
  - **Duplicates:** two entries share the same kind and id, or there is more than one human.
  - **Unknown reference:** an agent or skill entry has no matching definition. The message names the missing id and kind, e.g. `agent "foo" has no .claude/agents definition`.
- **Missing personas:** every agent and skill in `.claude/` must have a `crew.json` entry, so a new or renamed definition can never ship without being placed on the page. A definition with no entry is a build error naming the definition file and saying to add it to `src/agents/crew.json`. Feature-lane entries must also have a `replay` line, so the replay never has a silent step.
- **Homepage glyph row:** `src/index.html` has a `<!-- BUILD:crew-glyphs -->` … `<!-- /BUILD:crew-glyphs -->` region inside the About section's agents callout. The build fills it with one `<li>` per crew member: the human first, then every agent in lane order (feature, content, support) and `order`, keeping crew.json order for ties. Skills are not shown there. Adding or removing an agent updates the homepage row too.
- **Build log:** a successful build reports the agents page alongside the blog summary, e.g. `Agents page: 5 agents, 5 skills written to _site/agents/`.
- **Verification:** like the generated blog pages, the generated `/agents/` page is exempt from Local UI QA, and a successful build is its verification. The template, CSS, and JS are QA'd from `src/` under spec 8.
- **AGENTS.md update:** the "Local UI QA" section's exemption sentence also covers the generated `/agents/` page. Local UI QA still covers the agents template, CSS, and JS as served from `src/`.

## Acceptance criteria

- [ ] `npm run build:blog` succeeds and produces `_site/agents/index.html`. `_site/agents/` contains no `template.html` or `crew.json`, and the blog pages are still generated as before.
- [ ] The generated page lists every agent in `.claude/agents/` and every skill in `.claude/skills/` exactly once. Its status line counts match those definitions.
- [ ] In the generated page's `crew-data` block, each agent's description, tools, and model match its definition file, and each definition link points to that file on GitHub.
- [ ] Changing an agent's `description` or `tools` in `.claude/` and pushing to `main` updates the live `/agents/` page after the deploy, with no other edits.
- [ ] Adding a `crew.json` entry for a nonexistent agent or skill makes the build fail with a message naming `src/agents/crew.json` and the missing id. In CI, the previously live site stays unchanged.
- [ ] Making `crew.json` invalid JSON makes the build fail with a message naming the file.
- [ ] Adding a new agent or skill definition with no `crew.json` entry makes the build fail with a message naming the definition file and `src/agents/crew.json`. Once the entry is added, the build succeeds and the new member appears in its lane on `/agents/`.
- [ ] A feature-lane `crew.json` entry without a `replay` line makes the build fail, naming the entry.
- [ ] The homepage agents callout shows the human glyph followed by one glyph per agent, generated from `crew.json`. Adding an agent with a persona adds its glyph after the next build.
- [ ] A persona or description containing `<script>` or `</script>` appears as literal text on the generated page and does not break the page or the data block.
- [ ] `package.json` gains no new dependencies, and the deploy workflow is unchanged.
- [ ] AGENTS.md's "Local UI QA" section exempts the generated `/agents/` page and names a successful build as its verification.
