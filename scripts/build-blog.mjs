// Blog build (specs/7-blog-build-pipeline.md).
//
// Copies the site source into an output folder and turns every markdown post in
// <src>/blog/posts/<slug>.md into <out>/blog/<slug>.html, plus a newest-first
// <out>/blog/index.html, using the templates in <src>/blog/templates/ (contract
// in specs/6-markdown-blog.md). Raw posts and templates are not published.
// Syntax highlighting happens here, so no JS library is shipped to the browser.
//
// Usage: node scripts/build-blog.mjs [srcDir=src] [outDir=_site]
// Exits non-zero, naming the file and the problem, on a malformed post.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked, Renderer } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

const srcDir = path.resolve(process.argv[2] ?? 'src');
const outDir = path.resolve(process.argv[3] ?? '_site');

const postsDir = path.join(srcDir, 'blog', 'posts');
const templatesDir = path.join(srcDir, 'blog', 'templates');

class BuildError extends Error {
  constructor(file, message) {
    super(message);
    this.file = file;
  }
}

function rel(file) {
  return path.relative(process.cwd(), file) || file;
}

function fail(errors) {
  for (const err of errors) {
    const file = err.file ? rel(err.file) : null;
    console.error(file ? `${file}: ${err.message}` : err.message);
    // GitHub Actions annotation; newlines must be encoded to stay on one line.
    const msg = String(err.message).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
    console.log(file ? `::error file=${file}::${msg}` : `::error::${msg}`);
  }
  console.error(`Blog build failed with ${errors.length} error(s). Nothing was published.`);
  process.exit(1);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- Markdown rendering ----------

function resolveLang(info) {
  const lang = (info || '').match(/^\S*/)[0];
  return lang && hljs.getLanguage(lang) ? lang : 'plaintext';
}

function imageTag({ href, text }) {
  return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text ?? '')}" loading="lazy">`;
}

function isLoneImage(tokens) {
  const meaningful = (tokens || []).filter((t) => !(t.type === 'text' && t.raw.trim() === ''));
  return meaningful.length === 1 && meaningful[0].type === 'image' ? meaningful[0] : null;
}

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs language-plaintext',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      return hljs.highlight(code, { language: resolveLang(lang), ignoreIllegals: true }).value;
    },
  }),
  {
    renderer: {
      code(token) {
        const lang = resolveLang(token.lang);
        const body = token.escaped ? token.text : escapeHtml(token.text);
        return `<pre class="code-block" tabindex="0"><code class="hljs language-${escapeHtml(lang)}">${body.replace(/\n$/, '')}</code></pre>\n`;
      },
      table(token) {
        return `<div class="table-wrap" tabindex="0">${Renderer.prototype.table.call(this, token)}</div>\n`;
      },
      paragraph(token) {
        const img = isLoneImage(token.tokens);
        if (!img) return false; // fall back to the default paragraph renderer
        const caption = img.title ? `<figcaption>${escapeHtml(img.title)}</figcaption>` : '';
        return `<figure class="post-figure">${imageTag(img)}${caption}</figure>\n`;
      },
      image(token) {
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
        return imageTag(token).replace(/>$/, `${title}>`);
      },
    },
  },
);

// ---------- Posts ----------

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const displayFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

// gray-matter's YAML parser turns an unquoted 2026-10-18 into a Date (and
// silently rolls 2026-02-30 over to March), so prefer the raw text as written.
function rawDate(data, rawMatter) {
  if (typeof data.date === 'string') return data.date.trim();
  const m = rawMatter.match(/^date:[ \t]*(["']?)([^\r\n]*?)\1[ \t]*(?:#.*)?$/m);
  if (m) return m[2].trim();
  if (data.date instanceof Date && !Number.isNaN(data.date.getTime())) {
    return data.date.toISOString().slice(0, 10);
  }
  return data.date == null ? '' : String(data.date);
}

function parseDate(file, raw) {
  const m = raw.match(DATE_RE);
  if (!m) throw new BuildError(file, `frontmatter "date" must be in YYYY-MM-DD form (got "${raw}")`);
  const [y, mo, d] = m.slice(1).map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    throw new BuildError(file, `frontmatter "date" is not a valid calendar date (got "${raw}")`);
  }
  return { iso: raw, display: displayFormat.format(date), time: date.getTime() };
}

function requireText(file, data, field) {
  const value = data[field];
  if (value == null || String(value).trim() === '') {
    throw new BuildError(file, `frontmatter is missing required field "${field}"`);
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new BuildError(file, `frontmatter "${field}" must be plain text (quote it if needed)`);
  }
  return String(value).trim();
}

function readPost(file) {
  const slug = path.basename(file, '.md');
  if (slug === 'index') {
    throw new BuildError(file, '"index" is reserved for the blog index; rename the post file');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug)) {
    throw new BuildError(file, 'file name must use only letters, digits, ".", "_" or "-" (it becomes the URL slug)');
  }

  let source;
  try {
    source = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new BuildError(file, `cannot read file (${err.message})`);
  }
  if (!/^﻿?---[ \t]*\r?\n/.test(source)) {
    throw new BuildError(file, 'missing frontmatter block (the file must start with a "---" line)');
  }

  let parsed;
  try {
    // Pass an options object so gray-matter does not serve a cached result.
    parsed = matter(source, {});
  } catch (err) {
    throw new BuildError(file, `unreadable frontmatter (${err.reason || err.message})`);
  }
  const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {};
  if (Object.keys(data).length === 0) {
    throw new BuildError(file, 'missing or empty frontmatter block (needs title, date and summary)');
  }

  const title = requireText(file, data, 'title');
  if (data.date == null || String(data.date).trim() === '') {
    throw new BuildError(file, 'frontmatter is missing required field "date"');
  }
  const date = parseDate(file, rawDate(data, parsed.matter || ''));
  const summary = requireText(file, data, 'summary');

  return { file, slug, title, summary, date, html: marked.parse(parsed.content) };
}

// ---------- Templates ----------

function readTemplate(name, marker) {
  const file = path.join(templatesDir, name);
  if (!fs.existsSync(file)) throw new BuildError(file, 'template not found');
  const html = fs.readFileSync(file, 'utf8');
  const open = `<!-- BUILD:${marker} -->`;
  const close = `<!-- /BUILD:${marker} -->`;
  const start = html.indexOf(open);
  const end = html.indexOf(close);
  if (start === -1 || end === -1 || end < start) {
    throw new BuildError(file, `template must contain "${open}" followed by "${close}"`);
  }
  if (html.indexOf(open, start + 1) !== -1 || html.indexOf(close, end + 1) !== -1) {
    throw new BuildError(file, `template must contain "${open}" … "${close}" exactly once`);
  }
  return { file, before: html.slice(0, start), after: html.slice(end + close.length) };
}

// Text tokens are filled in the template parts only, never inside the inserted
// region, so a post that mentions "{{title}}" in its body is left alone.
function fill(template, tokens, region) {
  const sub = (s) => s.replace(/\{\{(title|summary|date_iso|date_display)\}\}/g, (_, k) => escapeHtml(tokens[k] ?? ''));
  return sub(template.before) + region + sub(template.after);
}

function indexItem(post) {
  return (
    `<li class="post-list__item"><article>` +
    `<h2 class="post-list__title"><a href="/blog/${encodeURIComponent(post.slug)}.html">${escapeHtml(post.title)}</a></h2>` +
    `<time datetime="${post.date.iso}">${escapeHtml(post.date.display)}</time>` +
    `<p class="post-list__summary">${escapeHtml(post.summary)}</p>` +
    `</article></li>`
  );
}

// ---------- Build ----------

function main() {
  if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) {
    fail([new BuildError(null, `source directory not found: ${rel(srcDir)}`)]);
  }
  if (outDir === srcDir || srcDir.startsWith(outDir + path.sep) || outDir.startsWith(srcDir + path.sep)) {
    fail([new BuildError(null, `output directory (${rel(outDir)}) must not overlap the source directory (${rel(srcDir)})`)]);
  }

  const errors = [];
  const templates = {};
  for (const [key, name, marker] of [['post', 'post.html', 'content'], ['index', 'index.html', 'posts']]) {
    try {
      templates[key] = readTemplate(name, marker);
    } catch (err) {
      if (!(err instanceof BuildError)) throw err;
      errors.push(err);
    }
  }

  const files = fs.existsSync(postsDir)
    ? fs.readdirSync(postsDir).filter((f) => f.endsWith('.md')).sort().map((f) => path.join(postsDir, f))
    : [];
  const posts = [];
  for (const file of files) {
    try {
      posts.push(readPost(file));
    } catch (err) {
      if (!(err instanceof BuildError)) throw err;
      errors.push(err);
    }
  }
  if (errors.length) fail(errors);

  posts.sort((a, b) => b.date.time - a.date.time || a.slug.localeCompare(b.slug));

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.cpSync(srcDir, outDir, { recursive: true });
  fs.rmSync(path.join(outDir, 'blog', 'posts'), { recursive: true, force: true });
  fs.rmSync(path.join(outDir, 'blog', 'templates'), { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'blog'), { recursive: true });

  for (const post of posts) {
    const tokens = { title: post.title, summary: post.summary, date_iso: post.date.iso, date_display: post.date.display };
    fs.writeFileSync(path.join(outDir, 'blog', `${post.slug}.html`), fill(templates.post, tokens, post.html));
  }
  const list = posts.map(indexItem).join('\n');
  fs.writeFileSync(path.join(outDir, 'blog', 'index.html'), fill(templates.index, {}, list));

  console.log(`Blog build: ${posts.length} post(s) written to ${rel(path.join(outDir, 'blog'))}/`);
}

main();
