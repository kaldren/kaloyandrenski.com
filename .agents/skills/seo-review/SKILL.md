---
name: seo-review
description: Reviews a blog post in src/blog/posts/ for on-page SEO — title, summary (meta description), slug, headings, keyword use, link text, and image alt text — and reports each issue with a suggested fix. Applies fixes only when asked. Callable standalone on any post, and run by the blog-writer agent as its final pass. Use whenever the user asks to check, review, or improve a post's SEO or search visibility.
argument-hint: <path to post, e.g. src/blog/posts/my-post.md (optional)>
---

You are reviewing a blog post on kaloyandrenski.com for on-page SEO. Read `AGENTS.md` first if you haven't already.

This skill covers only what the post's markdown controls. The page markup around it (canonical URL, Open Graph/Twitter tags, structured data, sitemap, robots.txt) belongs to the blog templates and build — don't flag those per post, and never edit templates from here.

## 1. Pick the post

Use the path from the skill argument. If none is given, use the post the caller was just working on; failing that, ask which post to review (list the files in `src/blog/posts/`).

Read the post and remember how its fields reach the page:
- `title` → the page `<title>`, rendered as `{{title}} — Kaloyan Drenski` (the suffix adds about 18 characters)
- `summary` → `<meta name="description">`, the snippet under the title in search results
- file name → the URL slug, `/blog/<slug>.html`

## 2. Identify the main topic

Decide the one phrase a reader would most likely search to find this post (e.g. "multi-agent orchestration patterns"). If the post has no clear single topic, say so — that's the first finding.

## 3. Check

Go through each item. An item passes, or produces a finding.

**Title**
- At most about 60 characters on its own, so the full `<title>` isn't badly truncated in results.
- Contains the main topic phrase, ideally near the start.
- Specific and descriptive; not vague ("Some thoughts on agents") or clickbait.

**Summary**
- About 120–160 characters; one or two sentences of plain text.
- Says what the reader gets from the post and includes the main topic phrase naturally.
- Not a copy of the title or the first paragraph.

**Slug**
- Short (roughly 3–6 words), lowercase, kebab-case, made of meaningful keywords.
- No dates, filler words ("a", "the", "my-thoughts-on"), or leftover draft names.
- Changing the slug of an already-published post breaks its URL — flag it as a suggestion only, and say so.

**Headings**
- No `#` heading in the body (the template renders the title as the page's `<h1>`).
- `##` and `###` used in order, with no skipped levels.
- Headings describe their section; at least one includes the main topic or a close variant.

**Content**
- The main topic is stated in the opening paragraph.
- The topic phrase and its variants appear naturally — flag both absence and stuffing.
- Substantive enough to answer the topic; flag very thin posts, but don't push for length for its own sake.

**Links**
- Link text describes the destination; no "click here", "here", or bare URLs as link text.
- External claims link to authoritative sources where it matters.

**Images**
- Every image has alt text that describes what the image shows, not "image" or a file name.
- Image files live in `src/public/blog/` with descriptive file names.

## 4. Report

List findings, most important first. For each one give:
- the item (e.g. "Summary")
- what's wrong, with the current value and its length where relevant
- a concrete suggested fix — for titles and summaries, offer one or two rewritten options with character counts

End with a one-line verdict: ready, or the number of issues to address. If everything passes, say so plainly — don't invent findings.

Keep suggestions in the post's existing voice (first person, plain, practical; see the blog-writer agent). SEO never beats readability: if a fix would make the writing worse, say so and leave it as a suggestion.

## 5. Apply fixes only when asked

Don't edit the post unless the user or caller asks you to. When asked, apply just the agreed fixes, then run `npm run build:blog` to confirm the post still builds.
