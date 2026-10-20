# Feature: Agents page

## What / Why

Kaloyan wants visitors to see that kaloyandrenski.com is built by a crew of AI agents, and to meet them. This feature adds one dedicated page at `/agents/` styled as a dark "mission control" console. It shows the site's real agents and skills as nodes in two pipelines, the Feature lane and the Content lane. Hovering, focusing, or tapping a node makes that agent introduce itself in a console panel, saying what it does for the site. A "Run build-feature" replay walks through the feature pipeline step by step. The page reinforces the "built with Human + AI collaboration" message already in the footer, and it shows the spec-driven, multi-agent way of working that is Kaloyan's professional focus.

This spec covers the frontend side: the page template, the persona file, the page's CSS and JS, the footer entry point, and a small `DESIGN_SYSTEM.md` extension. The page's data comes from the real agent and skill definitions in `.claude/`, merged with the persona file at build time. That build step is specified in `specs/9-agents-page-build.md`. Per AGENTS.md, `/agents/` is the only dedicated page besides blog posts.

## Requirements

- **DESIGN_SYSTEM.md extension, done first:** add a short "Dark showcase surface" section before any page styling is written. It states:
  - The `/agents/` page may use the existing code tokens as its page surface: `--color-code-bg` for the background, `--color-code-text` for text, and `--color-code-border` for edges. The syntax tokens may be used as accents on this page, and `--font-mono` may be used for labels. This is an explicit exception to the "code tokens only inside code surfaces" rule, and it applies to this page only.
  - The human node's accent is `--color-accent-warm`.
  - One sanctioned motion exception for this page covers three effects: a status-dot pulse, a typing caret, and the replay highlight. All three are disabled under `prefers-reduced-motion`.
  - No new hex values are introduced. Every text/background pairing used on the page meets the existing contrast rules.
- **Template:** `src/agents/template.html` is the page template. The build publishes it at `/agents/`.
  - It shares the site header, primary nav, and footer with the blog templates. All asset and nav links are root-absolute, because the page is served from `/agents/`.
  - It has its own page title and meta description.
  - It has a link back to the main site.
  - The primary nav is unchanged: no "Agents" item.
- **Template contract:** a comment at the top of the template documents exactly what the build inserts, following the blog template convention:
  - A single `<!-- BUILD:crew -->` … `<!-- /BUILD:crew -->` region. The build replaces this region (markers included) and changes nothing else in the file.
  - The exact markup shape the build produces inside the region:
    - the status line (e.g. "● 5 agents online")
    - each lane with its heading and ordered nodes
    - the support row
    - the node markup, with distinct shapes or classes for agents, skills, and the human
    - a `<script type="application/json" id="crew-data">` data block
  - The fields of each data-block entry: a unique key combining kind and id, plus id, kind, lane, order, glyph, display name, first-person line, owns, replay line, description, tools, model, definition path, and definition GitHub URL.
- **Sample region:** the region in `src/` holds sample nodes and a sample data block in exactly the documented shape. They cover:
  - both lanes and the support row
  - at least one agent, one skill, and the human
  - one branch step

  Opening the template from `src/` therefore previews and QAs the full page, including its interactions.
- **Persona file:** `src/agents/crew.json` is a hand-authored array, with one entry per crew member. Each entry has:
  - `id`, matching the definition name
  - `kind`: `"agent"`, `"skill"`, or `"human"`
  - `lane`: `"feature"`, `"content"`, or `"support"`. Omitted for the human.
  - `order`: position in the lane. Entries in the same lane with equal `order` form a branch and light together during replay.
  - `glyph`: 1–3 characters, e.g. `"SW"`
  - `line`: a first-person sentence about what it does for this site
  - `owns`: a list of files or areas
  - `replay`: a line printed during the pipeline replay. Needed for feature-lane entries and the human.
- **Crew coverage:** `crew.json` includes:
  - **Feature lane:** build-feature (skill), spec-writer, frontend-developer and devops as one branch step, ui-qa (agent), update-changelog (skill)
  - **Content lane:** blog-writer (agent), seo-review (skill)
  - **Support row:** build-spec (skill) and ui-qa (skill). These are real but on-demand helpers. They sit outside both lanes and are not part of the replay, so every current definition is still shown and the build warns about nothing.
  - **Human:** one human entry ("you", Kaloyan). It heads both lanes.
- **Accurate personas:** each `line` and `owns` matches what the real definition says the agent or skill does. They invent no capabilities. In particular:
  - spec-writer writes `specs/`
  - frontend-developer implements under `src/` following `DESIGN_SYSTEM.md`
  - devops owns the workflows, `CNAME`, and the build script
  - ui-qa tests the locally served site through Playwright and does not edit files
  - blog-writer writes `src/blog/posts/`
  - seo-review reviews post SEO and suggests fixes
  - update-changelog writes `CHANGELOG.md`
  - build-feature classifies, briefs, delegates, and verifies
  - build-spec is the interactive front end to spec-writer
  - the ui-qa skill delegates to the ui-qa agent
  - the human sets direction and approves specs and briefs
- **Layout:**
  - **Header:** shows the status line, a short intro saying the site is built by these agents, and the replay control.
  - **Lanes:** each lane runs left to right on desktop, with connectors between nodes. On phones each lane stacks vertically with vertical connectors. There is no horizontal page overflow at phone width.
  - **Support row:** appears below the lanes.
  - **Console panel:** sits beside the lanes on wide screens and below them on narrow ones.
- **Node styles:** agents, skills, and the human are visually distinct:
  - agents are solid cards
  - skills are outlined chips
  - the human node uses the warm amber accent

  Each node also shows its kind as a text label, so kind is not conveyed by shape or color alone.
- **Node interaction:** every node is a keyboard-focusable button. Hovering, focusing, or tapping a node selects it. The selected node is marked visibly, not by color alone, and the console shows:
  - its glyph, name, and kind
  - its first-person `line`, typed out with a caret. Under reduced motion the line appears instantly.
  - its real tools and model from its definition. A skill without its own tools or model shows that it runs inside its caller, and the human shows neither.
  - what it owns
  - a link to its definition file on GitHub (`https://github.com/kaldren/kaloyandrenski.com/blob/main/...`), opening in a new tab. The human has no definition link.
- **Console accessibility:** the console is an `aria-live="polite"` region. Screen readers hear each selection's complete line once, not character by character.
- **Pipeline replay:**
  - **Starting:** a "Run build-feature" button starts a replay of the Feature lane in order: you → build-feature → spec-writer → frontend-developer / devops (one branch step, both lit) → ui-qa → update-changelog.
  - **Each step:** lights the step's node(s) and incoming connector, and prints that step's `replay` line in the console.
  - **Stopping:** while running, the button reads as a stop control. Pressing it stops the replay and clears the highlight. Selecting a node by hand also stops the replay.
  - **Reduced motion:** there is no autoplay. The control becomes a "Next step" stepper that advances one step per press and starts over after the last step.
- **Script:** behavior lives in `src/public/agents.js`, an ES module that reads the `#crew-data` block. It uses no libraries.
- **No-JS fallback:** without JavaScript, the page still shows the lanes, every node with its name and kind, and a static console intro.
- **Styles:** page styling lives in `src/public/agents.css`. It uses `DESIGN_SYSTEM.md` tokens only: no hardcoded colors, fonts, or spacing.
- **Entry points:** the footer attribution in `src/index.html` ("Built with Human + AI collaboration…") links to `/agents/`. The existing "View the source" link stays. The About section also ends with a dark callout card ("Built by AI agents" / "Want to see how this website was built?"), a row of agent glyphs, and a "Meet the agents" button linking to `/agents/`. The glyph row sits in a `BUILD:crew-glyphs` region that the build fills from `crew.json` (spec 9); the `src/` copy holds the current crew as a sample.
- **Verification scope:** Local UI QA covers the template opened from `src/` with its sample region, the CSS/JS, and the footer link on the home page. The generated `/agents/` page is verified by a successful build (spec 9), the same way generated blog pages are.

## Acceptance criteria

- [ ] `DESIGN_SYSTEM.md` has a "Dark showcase surface" section that allows the code tokens as the `/agents/` page surface, names `--color-accent-warm` for the human node, and sanctions only the status-dot pulse, typing caret, and replay highlight, all disabled under reduced motion. No new hex values are added.
- [ ] On the home page, the footer attribution text links to `/agents/`, the "View the source" link still works, and the primary nav has no new item.
- [ ] Served from `src/`, `/agents/template.html` shows the site header, nav, and footer on a dark console-style surface. It has a status line, a link back to the main site, a Feature lane, a Content lane, a support row, and a console panel.
- [ ] The template begins with a contract comment describing the `BUILD:crew` region, the node markup shape, and the `crew-data` JSON fields.
- [ ] At desktop width, lanes run horizontally with connectors. At phone width, lanes stack vertically and the page has no horizontal scroll.
- [ ] Agent nodes, skill nodes, and the human node look different (solid card, outlined chip, amber accent), and each shows a text kind label.
- [ ] Hovering, focusing via Tab, or tapping a node updates the console with its glyph, name, kind, typed first-person line, tools and model (or the skill/human equivalent), owned areas, and a GitHub link to its definition that opens in a new tab.
- [ ] Every node can be reached and selected with the keyboard alone, with a visible focus ring, and the selected node is marked by more than color.
- [ ] "Run build-feature" lights you → build-feature → spec-writer → frontend-developer + devops together → ui-qa → update-changelog in order, with each incoming connector, printing each step's line in the console. Pressing the control again stops the replay and clears the highlight.
- [ ] With reduced motion emulated, there is no pulse, caret animation, or autoplay. Lines appear instantly, and a "Next step" control advances the replay one step per press.
- [ ] With JavaScript disabled, all nodes with names and kinds and a static console intro are still visible.
- [ ] `src/agents/crew.json` covers the human, spec-writer, frontend-developer, devops, ui-qa (agent), blog-writer, build-feature, seo-review, update-changelog, build-spec, and ui-qa (skill), each with the required fields. Every `line` and `owns` matches the real definition.
- [ ] No library script loads on the page, and `agents.css` contains no hardcoded hex colors.
