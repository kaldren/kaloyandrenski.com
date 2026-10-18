# Feature: Markdown blog

## What / Why

Kaloyan wants a blog on kaloyandrenski.com for his technical writing. Each post should be one markdown file that is easy to write, and it should still look polished when read. Fonts should read well. Images should sit in an attractive frame. Tables should be styled instead of using the browser's plain defaults. Code, both code blocks and inline mentions of file names like `SKILL.md` or `README.md`, should sit on a dark background with syntax highlighting. Right now the site has nowhere to publish writing.

This spec covers the frontend side:
- where posts are written and what metadata they carry
- the HTML templates for a post page and for the blog index
- all blog styling
- the "Blog" nav link

A build step turns the markdown into finished pages using these templates. It runs in CI when publishing, and can optionally be run locally. That build is specified separately in `specs/7-blog-build-pipeline.md`. Per AGENTS.md, blog posts are the only content that gets dedicated pages.

## Requirements

- **Post source folder:** each post is one markdown file in `src/blog/posts/`. The file name is the post's slug, so `src/blog/posts/my-post.md` is published at `/blog/my-post.html`. This folder sits inside `src/` because posts are site content, owned by the frontend domain next to the templates and styles that present them. Writing a post never requires creating or editing any HTML file.
- **Frontmatter:** each post file starts with a frontmatter block. It has three required fields:
  - `title`
  - `date`, in `YYYY-MM-DD` form
  - `summary`, one or two sentences

  These fields are the only source for the post's title, date, and index entry. There is no hand-edited manifest.
- **Post images:** images used in posts live under `src/public/blog/` and are referenced from the markdown with normal image syntax.
- **Post page template:** a template for a single post page lives in `src/blog/templates/`. The build fills in the post's title, date, and rendered body. The template includes:
  - the site's header and nav, with the "Blog" link
  - the site footer
  - a page title and meta description taken from the post's frontmatter
  - a link back to the blog index and a link back to the main site
- **Blog index template:** a template for the blog index lives in `src/blog/templates/` and is published at `/blog/`. The build fills it with every post, newest first, each showing title, date, and summary and linking to the post page. It keeps the same header, nav, and footer, and a link back to the main site.
- **Template conventions:** the templates use clear, documented placeholders for the content the build inserts. The build must not need to change any other part of a template.
- **Placeholder content:** each template's placeholder content works as a styling sample that the build replaces.
  - **Post template:** the placeholder body includes sample markup in the same shape the build produces. It covers headings, paragraphs, a list, a blockquote, a framed image, a table, a syntax-highlighted code block, and inline code such as `SKILL.md`.
  - **Index template:** the placeholder includes a sample post entry.

  Opening a template from `src/` therefore shows the blog styling at work.
- **Nav link:** the main site nav (`src/index.html`) has a "Blog" link to `/blog/`. The single page itself gets no blog section.
- **No browser-side processing:** the browser does no markdown parsing and no syntax highlighting. Post pages arrive as finished HTML, and no markdown or highlighting library loads in the browser.
- **Supported markdown:** rendered posts support at least:
  - headings, paragraphs, bold/italic, and links
  - ordered and unordered lists
  - blockquotes and horizontal rules
  - images and tables
  - fenced code blocks, with a language tag that drives highlighting
  - inline code
- **Typography:** post text is comfortable for long-form reading. It uses the site's font tokens with a limited line length, clear heading sizes, and generous spacing between elements.
- **Images:** post images appear inside a styled frame: a background surround with padding and rounded corners. They scale down to fit narrow screens without overflowing.
- **Tables:** post tables are styled rather than browser defaults. They have a distinct header row, cell padding, and subtle row dividers or striping. On narrow screens they scroll sideways instead of breaking the layout.
- **Code blocks:** fenced code blocks use a dark background, a monospace font, padding, and rounded corners. Long lines scroll sideways instead of wrapping or overflowing the page.
- **Syntax colors:** syntax highlighting is applied at build time. A dark syntax theme stylesheet, part of the blog CSS under `src/`, colors the highlighted markup the build produces. The colors are readable on the dark code background.
- **Inline code:** inline code, including file names like `SKILL.md` and `README.md` written in backticks, gets the same dark background and monospace treatment as code blocks, shown as small inline pills sized to fit within body text.
- **Design tokens:** all blog styling, including the syntax theme, uses `DESIGN_SYSTEM.md` tokens. Any code background or syntax colors the design system doesn't already cover are added to `DESIGN_SYSTEM.md` first, as a deliberate addition, then used.
- **Responsive:** blog index and post templates share the site's look (header/nav, footer, colors, fonts) and work at desktop and phone sizes.
- **Sample post:** one sample post ships in `src/blog/posts/`. It uses every supported element: an image in its frame, a table, at least one fenced code block with a language tag, and inline file names such as `SKILL.md` and `README.md`.
- **Verification scope:** generated post pages and the generated blog index are exempt from Local UI QA.
  - **Local UI QA covers** only what `src/` can serve: the "Blog" nav link on the home page, and the two templates opened with their placeholder content, including the blog CSS and design-system tokens.
  - **Generated pages** are checked by a successful build (see spec 7). A failed build signals a problem. Generated output gets no visual QA.
  - **Local preview:** running the build locally to preview posts is a convenience offered by spec 7, not a requirement of this spec.

## Acceptance criteria

- [ ] The main nav on the home page has a "Blog" link pointing to `/blog/`, and the home page has no blog section.
- [ ] Opened from `src/` with placeholder content, the post template and the blog index template both show the site's header/nav (with the "Blog" link), footer, colors, and fonts. They look correct at desktop and phone sizes.
- [ ] The post template has working links back to the blog index and the main site, and the index template has a link back to the main site.
- [ ] In the post template's placeholder body, the text is comfortable to read at desktop width: line length is limited, spacing is clear, and the site fonts are used.
- [ ] In the post template's placeholder body, the sample image sits inside a visible framed background with padding and rounded corners, and it doesn't overflow on a phone-sized screen.
- [ ] In the post template's placeholder body, the sample table has a distinct header row, padded cells, and row dividers or striping, and it scrolls sideways on a phone instead of breaking the layout.
- [ ] In the post template's placeholder body, the sample code block has a dark background, monospace font, and rounded corners, with syntax-colored keywords and strings. Long lines scroll sideways inside the block.
- [ ] In the post template's placeholder body, inline code such as `SKILL.md` appears as a dark monospace pill inside the surrounding text.
- [ ] Neither template loads a markdown-parsing or syntax-highlighting script.
- [ ] Any new code or syntax colors are documented as tokens in `DESIGN_SYSTEM.md`, and blog styles use those tokens.
- [ ] `src/blog/posts/` holds a sample post whose frontmatter has `title`, `date`, and `summary`, and whose body uses an image, a table, a fenced code block with a language tag, and inline file names such as `SKILL.md` and `README.md`.
- [ ] With the spec 7 pipeline in place, the build succeeds with the sample post and the templates. That successful build is the acceptance check for the generated post page and the blog index, and there is no visual QA of generated output.
