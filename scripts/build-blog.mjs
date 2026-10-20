// Blog build (specs/7-blog-build-pipeline.md).
//
// Copies the site source into an output folder and turns every markdown post in
// <src>/blog/posts/<slug>.md into <out>/blog/<slug>.html, plus a newest-first
// <out>/blog/index.html, using the templates in <src>/blog/templates/ (contract
// in specs/6-markdown-blog.md). Raw posts and templates are not published.
// Syntax highlighting happens here, so no JS library is shipped to the browser.
//
// It also generates the /agents/ page (specs/9-agents-page-build.md): the agent and
// skill definitions in <repo>/.claude/ are merged with the personas in
// <src>/agents/crew.json and filled into <src>/agents/template.html (contract in that
// template's top comment), written to <out>/agents/index.html. <repo> is the parent
// of <src>, so the default src/ reads the repository's own .claude/.
//
// Usage: node scripts/build-blog.mjs [srcDir=src] [outDir=_site]
// Exits non-zero, naming the file and the problem, on a malformed post, crew.json or
// definition. Nothing is written to <out> unless every input is valid.

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
const agentsDir = path.join(srcDir, 'agents');
const repoDir = path.dirname(srcDir);
const claudeDir = path.join(repoDir, '.claude');
const REPO_URL = 'https://github.com/kaldren/kaloyandrenski.com/blob/main/';

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

function readTemplate(file, marker) {
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

// ---------- Agents page ----------

const LANES = ['feature', 'content', 'support'];
const LANE_TITLES = { feature: 'Feature lane', content: 'Content lane' };

function repoPath(file) {
  return path.relative(repoDir, file).split(path.sep).join('/');
}

// `tools` may be a comma-separated string ("Read, Write") or a YAML list.
function parseTools(value) {
  if (value == null) return null;
  const list = Array.isArray(value) ? value.map(String) : String(value).split(',');
  return list.map((t) => t.trim()).filter(Boolean);
}

function readDefinition(file, kind) {
  let parsed;
  try {
    parsed = matter(fs.readFileSync(file, 'utf8'), {});
  } catch (err) {
    throw new BuildError(file, `unreadable frontmatter (${err.reason || err.message})`);
  }
  const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {};
  const id = requireText(file, data, 'name');
  const description = requireText(file, data, 'description');
  const p = repoPath(file);
  return {
    file,
    kind,
    id,
    description,
    tools: parseTools(data.tools),
    model: typeof data.model === 'string' && data.model.trim() ? data.model.trim() : null,
    path: p,
    url: REPO_URL + p,
  };
}

// Every .claude/agents/*.md (kind agent) and .claude/skills/*/SKILL.md (kind skill).
function definitionFiles() {
  const agents = path.join(claudeDir, 'agents');
  const skills = path.join(claudeDir, 'skills');
  const files = [];
  if (fs.existsSync(agents)) {
    for (const f of fs.readdirSync(agents).filter((f) => f.endsWith('.md')).sort()) {
      files.push([path.join(agents, f), 'agent']);
    }
  }
  if (fs.existsSync(skills)) {
    for (const d of fs.readdirSync(skills).sort()) {
      const file = path.join(skills, d, 'SKILL.md');
      if (fs.existsSync(file)) files.push([file, 'skill']);
    }
  }
  return files;
}

function readCrewFile(file) {
  if (!fs.existsSync(file)) throw new BuildError(file, 'crew file not found');
  let crew;
  try {
    crew = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new BuildError(file, `invalid JSON (${err.message})`);
  }
  if (!Array.isArray(crew)) throw new BuildError(file, 'must be a JSON array of crew entries');
  return crew;
}

const isText = (v) => typeof v === 'string' && v.trim() !== '';

// Returns a list of problems with one crew.json entry (empty when valid).
function entryProblems(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return ['must be an object'];
  const problems = [];
  if (!isText(entry.id)) problems.push('"id" must be a non-empty string');
  if (!['agent', 'skill', 'human'].includes(entry.kind)) problems.push('"kind" must be "agent", "skill" or "human"');
  if (entry.kind !== 'human' && !LANES.includes(entry.lane)) problems.push(`"lane" must be one of ${LANES.join(', ')}`);
  if (typeof entry.order !== 'number' || !Number.isFinite(entry.order)) problems.push('"order" must be a number');
  if (!isText(entry.glyph)) problems.push('"glyph" must be a non-empty string');
  if (!isText(entry.line)) problems.push('"line" must be a non-empty string');
  if (entry.name != null && !isText(entry.name)) problems.push('"name" must be a non-empty string when present');
  if (entry.owns != null && !(Array.isArray(entry.owns) && entry.owns.every(isText))) problems.push('"owns" must be an array of strings');
  if (entry.replay != null && !isText(entry.replay)) problems.push('"replay" must be a non-empty string or null');
  if (entry.lane === 'feature' && !isText(entry.replay)) problems.push('feature-lane entries need a "replay" line');
  return problems;
}

function member(entry, def) {
  return {
    key: `${entry.kind}:${entry.id}`,
    id: entry.id,
    kind: entry.kind,
    lane: entry.kind === 'human' ? null : entry.lane,
    order: entry.order,
    glyph: entry.glyph,
    name: entry.name ?? entry.id,
    line: entry.line,
    owns: entry.owns ?? [],
    replay: entry.replay ?? null,
    description: def ? def.description : null,
    tools: def ? def.tools : null,
    model: def ? def.model : null,
    path: def ? def.path : null,
    url: def ? def.url : null,
  };
}

// Reads and validates everything the agents page needs, pushing BuildErrors onto
// `errors`. Returns null when anything is wrong.
function readCrew(errors) {
  const before = errors.length;
  const collect = (fn) => {
    try {
      return fn();
    } catch (err) {
      if (!(err instanceof BuildError)) throw err;
      errors.push(err);
      return null;
    }
  };

  const template = collect(() => readTemplate(path.join(agentsDir, 'template.html'), 'crew'));

  const defs = new Map();
  for (const [file, kind] of definitionFiles()) {
    const def = collect(() => readDefinition(file, kind));
    if (!def) continue;
    const key = `${kind}:${def.id}`;
    if (defs.has(key)) {
      errors.push(new BuildError(file, `${kind} name "${def.id}" is already used by ${defs.get(key).path}`));
      continue;
    }
    defs.set(key, def);
  }

  const crewFile = path.join(agentsDir, 'crew.json');
  const crew = collect(() => readCrewFile(crewFile)) ?? [];
  const seen = new Set();
  const members = [];
  let human = null;
  crew.forEach((entry, i) => {
    const problems = entryProblems(entry);
    const label = isText(entry?.id) ? `entry ${i + 1} ("${entry.id}")` : `entry ${i + 1}`;
    if (problems.length) {
      for (const p of problems) errors.push(new BuildError(crewFile, `${label}: ${p}`));
      // Still counts as listed, so its definition isn't also reported as missing.
      if (isText(entry?.id)) seen.add(`${entry.kind}:${entry.id}`);
      return;
    }
    const key = `${entry.kind}:${entry.id}`;
    if (seen.has(key)) {
      errors.push(new BuildError(crewFile, `${entry.kind} "${entry.id}" appears more than once`));
      return;
    }
    seen.add(key);
    if (entry.kind === 'human') {
      if (human) errors.push(new BuildError(crewFile, `more than one human entry ("${human.id}" and "${entry.id}")`));
      else human = member(entry, null);
      return;
    }
    const def = defs.get(key);
    if (!def) {
      errors.push(new BuildError(crewFile, `${entry.kind} "${entry.id}" has no .claude/${entry.kind}s definition`));
      return;
    }
    members.push(member(entry, def));
  });
  if (!human && errors.length === before) {
    errors.push(new BuildError(crewFile, 'needs exactly one entry with kind "human"'));
  }

  // Every definition needs a persona, so a new agent or skill can't ship unplaced.
  for (const def of defs.values()) {
    if (seen.has(`${def.kind}:${def.id}`)) continue;
    errors.push(new BuildError(def.file, `${def.kind} "${def.id}" has no entry in ${rel(crewFile)}; add one (lane, order, glyph, line) so it appears on /agents/`));
  }

  const homeTemplate = collect(() => readTemplate(path.join(srcDir, 'index.html'), 'crew-glyphs'));

  if (errors.length > before) return null;
  const count = (kind) => [...defs.values()].filter((d) => d.kind === kind).length;
  return { template, homeTemplate, human, members, agents: count('agent'), skills: count('skill') };
}

// Homepage callout glyphs: the human, then every agent by lane and order (stable
// sort keeps crew.json order for ties).
function crewGlyphs(crew) {
  const agents = crew.members
    .filter((m) => m.kind === 'agent')
    .sort((a, b) => LANES.indexOf(a.lane) - LANES.indexOf(b.lane) || a.order - b.order);
  return [
    `<li class="agents-callout__glyph agents-callout__glyph--human">${escapeHtml(crew.human.glyph)}</li>`,
    ...agents.map((m) => `<li class="agents-callout__glyph">${escapeHtml(m.glyph)}</li>`),
  ].join('\n');
}

function crewNode(m) {
  return (
    `<button type="button" class="node node--${m.kind}" data-key="${escapeHtml(m.key)}" aria-pressed="false">` +
    `<span class="node__glyph" aria-hidden="true">${escapeHtml(m.glyph)}</span>` +
    `<span class="node__name">${escapeHtml(m.name)}</span>` +
    `<span class="node__kind">${m.kind}</span></button>`
  );
}

// Lane steps: the human first, then entries grouped by `order` (equal orders share
// one branch step, in crew.json order).
function crewLane(lane, crew) {
  const groups = new Map();
  for (const m of crew.members.filter((m) => m.lane === lane)) {
    if (!groups.has(m.order)) groups.set(m.order, []);
    groups.get(m.order).push(m);
  }
  const steps = [`<li class="lane__step" data-order="${crew.human.order}">${crewNode(crew.human)}</li>`];
  for (const order of [...groups.keys()].sort((a, b) => a - b)) {
    const nodes = groups.get(order);
    const cls = nodes.length > 1 ? 'lane__step lane__step--branch' : 'lane__step';
    steps.push(`<li class="${cls}" data-order="${order}">${nodes.map(crewNode).join('')}</li>`);
  }
  return [
    `<section class="lane" data-lane="${lane}" aria-labelledby="lane-${lane}">`,
    `<h2 class="lane__title" id="lane-${lane}">${escapeHtml(LANE_TITLES[lane])}</h2>`,
    `<ol class="lane__steps">`,
    ...steps,
    `</ol>`,
    `</section>`,
  ];
}

// JSON that cannot close the <script> element: <, > and & become \u escapes.
function scriptJson(value) {
  return JSON.stringify(value).replace(/[<>&]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function crewRegion(crew) {
  const support = crew.members.filter((m) => m.lane === 'support').sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const data = [crew.human, ...crew.members];
  return [
    `<p class="crew-status"><span class="crew-status__dot" aria-hidden="true"></span>${plural(crew.agents, 'agent')} online · ${plural(crew.skills, 'skill')} loaded</p>`,
    ...crewLane('feature', crew),
    ...crewLane('content', crew),
    `<section class="crew-support" aria-labelledby="lane-support">`,
    `<h2 class="lane__title" id="lane-support">On call</h2>`,
    `<ul class="crew-support__list">`,
    ...support.map((m) => `<li class="crew-support__item">${crewNode(m)}</li>`),
    `</ul>`,
    `</section>`,
    `<script type="application/json" id="crew-data">`,
    '[',
    data.map(scriptJson).join(',\n'),
    ']',
    `</script>`,
  ].join('\n');
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
      templates[key] = readTemplate(path.join(templatesDir, name), marker);
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
  const crew = readCrew(errors);
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

  const agentsOut = path.join(outDir, 'agents');
  fs.rmSync(path.join(agentsOut, 'template.html'), { force: true });
  fs.rmSync(path.join(agentsOut, 'crew.json'), { force: true });
  fs.writeFileSync(path.join(agentsOut, 'index.html'), crew.template.before + crewRegion(crew) + crew.template.after);
  fs.writeFileSync(path.join(outDir, 'index.html'), crew.homeTemplate.before + crewGlyphs(crew) + crew.homeTemplate.after);

  console.log(`Blog build: ${posts.length} post(s) written to ${rel(path.join(outDir, 'blog'))}/`);
  console.log(`Agents page: ${plural(crew.agents, 'agent')}, ${plural(crew.skills, 'skill')} written to ${rel(agentsOut)}/`);
}

main();
