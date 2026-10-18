# Feature: Blog build pipeline

## What / Why

Kaloyan wants to publish a blog post just by adding a markdown file to the repo. The blog's frontend is specified in `specs/6-markdown-blog.md`: post files in `src/blog/posts/`, plus the post and index templates and blog styling in `src/blog/templates/` and the site CSS. Something has to turn those markdown files into finished, styled HTML pages and a current blog index. The site has no build step today, and the deploy pipeline from `specs/4-github-pages-deploy-pipeline.md` publishes `src/` unchanged.

This feature adds a blog build script, run as an npm script. Its dependencies are dev dependencies in the repo's existing root `package.json`. The existing deploy pipeline runs the script on push to `main` and publishes the generated pages with the rest of `src/`. Generated HTML exists only in build output and is never committed.

This follows a rule change by the user: npm dev dependencies and a build script are now allowed when they make things easier. The site's runtime stays plain HTML/CSS/vanilla JS.

Note: this is an infrastructure feature. Its requirements are scoped to build and deploy behavior. Visual requirements for the generated pages belong to spec 6.

## Requirements

- **Dependencies:** the build's dependencies are `devDependencies` in the existing root `package.json`, pinned by `package-lock.json`:
  - `marked`
  - `marked-highlight`
  - `highlight.js`
  - `gray-matter`, for frontmatter
- **Build script:** the build is a script outside `src/` (e.g. `scripts/build-blog.mjs`), run through an npm script such as `npm run build:blog`.
- **Triggers:** the existing GitHub Pages deploy workflow from spec 4 is extended, not duplicated, so there is still exactly one Pages deployment path. It runs on every push to `main`, which covers changes to:
  - post files in `src/blog/posts/`
  - blog templates in `src/blog/templates/`
  - blog CSS
  - any other site files
- **CI install:** the workflow installs dependencies with `npm ci`, then runs the blog build before publishing.
- **Build steps:** the build:
  - generates one HTML page per `src/blog/posts/<slug>.md`, published at `/blog/<slug>.html`
  - generates the blog index at `/blog/`, listing all posts newest first by frontmatter date
- **Templates:** generated pages are made from the spec 6 templates in `src/blog/templates/`. Only the documented placeholders are filled in. Title, date, and summary come from each post's frontmatter.
- **Syntax highlighting:** done during the build. Fenced code blocks with a language tag come out as highlighted markup that the dark syntax theme from spec 6 colors. No highlighting or markdown library is shipped to the browser.
- **Markup for styling:** the build's HTML for images, tables, code blocks, and inline code is structured so spec 6's styling works, e.g. tables can scroll sideways on narrow screens and images can be framed.
- **Build output:** the build writes a complete site into an output folder, e.g. a gitignored `_site/`. That folder holds the rest of `src/`, unchanged, plus the generated blog pages. CI publishes this output. The output does not include the raw templates or the source `.md` files.
- **Nothing committed back:** generated HTML is never committed to the repository. The output folder is gitignored, and the workflow makes no commits. CI remains the only publishing path.
- **Local build:** running the build locally (e.g. `npm install` then `npm run build:blog`) is possible as a convenience for previewing. It is not required for writing or publishing a post.
- **Malformed posts:** the build fails clearly on a malformed post, and nothing is published. Malformed means a missing or unreadable frontmatter block, a missing `title`, `date`, or `summary`, or a `date` not in `YYYY-MM-DD` form. The failure message names the offending file and the problem, and the build exits with a non-zero status. In CI, the previously deployed site stays live and unchanged.
- **No posts:** if `src/blog/posts/` is empty or missing, the build still succeeds and generates a blog index with no posts.
- **Verification:** a successful build run is the acceptance check for generated post pages and the generated blog index. Generated output gets no visual or UI QA, even when built locally. A failed run is the signal that something is wrong.
- **AGENTS.md update:** three parts of AGENTS.md change.
  - **Tooling & build process:** say that npm dev dependencies and a blog build script are allowed when they make things easier. The site's runtime stays plain HTML/CSS/vanilla JS with no frameworks. No JS library is shipped to the browser unless a spec justifies it.
  - **Rules > Simplicity:** state the same allowance.
  - **Local UI QA:** say generated blog pages (post pages and the blog index) are exempt from Local UI QA and are verified by a successful build instead. Local UI QA still covers the blog templates and CSS as served from `src/`.
- **DESIGN_SYSTEM.md update:** any "no build step" wording in its intro is updated to match the new rule.
- **Spec 4 update:** `specs/4-github-pages-deploy-pipeline.md` is updated to match. Its "publish-only, not a build step" requirement and its "no `package.json` / no build scripts" items, in both requirements and acceptance criteria, are revised to allow the npm-based blog build stage. The update points to this spec.

## Acceptance criteria

- [ ] Pushing a new `.md` file with valid frontmatter to `src/blog/posts/` on `main` triggers the deploy workflow. When it finishes, the live site serves the new post at `/blog/<slug>.html`, and `/blog/` lists it, with no HTML written by hand.
- [ ] Editing an existing post, a blog template, or the blog CSS and pushing to `main` updates the live blog pages to match.
- [ ] The root `package.json` lists `marked`, `marked-highlight`, `highlight.js`, and `gray-matter` as `devDependencies`, and `package-lock.json` pins their versions.
- [ ] `package.json` defines an npm script (e.g. `build:blog`) that runs a build script located outside `src/`.
- [ ] The deploy workflow installs dependencies with `npm ci` and runs the blog build before publishing.
- [ ] Code blocks in the generated post pages contain syntax-highlighted markup, and no markdown or highlighting script loads in the browser.
- [ ] The repository contains no generated blog HTML, the build output folder is gitignored, and the workflow makes no commits.
- [ ] The deployed site does not serve the raw templates or the source `.md` files.
- [ ] Running the build locally produces the generated post pages and blog index in the gitignored output folder.
- [ ] Pushing a post with missing frontmatter, or missing `title`, `date`, or `summary`, makes the workflow run fail. The run log names the file and the problem, and the previously live site stays unchanged.
- [ ] A build run with the sample post from spec 6 finishes successfully. That successful run is the acceptance check for the generated pages, with no visual QA of generated output.
- [ ] There is still exactly one GitHub Pages deploy workflow, and non-blog pages (home page, assets, custom domain) keep deploying exactly as before.
- [ ] AGENTS.md's "Tooling & build process" section and "Simplicity" rule allow npm dev dependencies and a blog build script. They state that the runtime stays plain HTML/CSS/vanilla JS with no frameworks, and that no JS library is shipped to the browser without a spec justifying it.
- [ ] AGENTS.md's "Local UI QA" section exempts generated blog pages and names a successful build as their verification.
- [ ] DESIGN_SYSTEM.md's intro no longer claims there is no build step.
- [ ] `specs/4-github-pages-deploy-pipeline.md` no longer forbids the npm-based blog build stage and references this spec.
