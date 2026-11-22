// Blog build.
//
// Copies the site source into an output folder and turns every markdown post in
// <src>/blog/posts/<slug>.md into <out>/blog/<slug>.html, plus a newest-first
// <out>/blog/index.html, using the templates in <src>/blog/templates/ (contract
// in each template's top comment). Raw posts and templates are not published.
// Syntax highlighting happens here, so no JS library is shipped to the browser.
//
// It also generates the /agents/ page: the agent and
// skill definitions in <repo>/.claude/ are merged with the personas in
// <src>/agents/crew.json and filled into <src>/agents/template.html (contract in that
// template's top comment), written to <out>/agents/index.html. <repo> is the parent
// of <src>, so the default src/ reads the repository's own .claude/.
//
// And the /patterns/ page: the tracks in <src>/patterns/catalog.json, and every
// <src>/patterns/entries/<track>/<slug>.md plus its inline diagram
// <src>/patterns/diagrams/<track>/<slug>.svg, are filled into
// <src>/patterns/template.html (contract in that template's top comment), written to
// <out>/patterns/index.html.
//
// Usage: node scripts/build-blog.mjs [srcDir=src] [outDir=_site]
// Exits non-zero, naming the file and the problem, on a malformed post, crew.json,
// definition, pattern or diagram. Nothing is written to <out> unless every input is valid.

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
const patternsDir = path.join(srcDir, 'patterns');
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

const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

// Reads a markdown file with a required, non-empty frontmatter block.
function readMarkdown(file, needs) {
  let source;
  try {
    source = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new BuildError(file, `cannot read file (${err.message})`);
  }
  if (!/^\uFEFF?---[ \t]*\r?\n/.test(source)) {
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
    throw new BuildError(file, `missing or empty frontmatter block (needs ${needs})`);
  }
  return { parsed, data };
}

function readPost(file) {
  const slug = path.basename(file, '.md');
  if (slug === 'index') {
    throw new BuildError(file, '"index" is reserved for the blog index; rename the post file');
  }
  if (!SLUG_RE.test(slug)) {
    throw new BuildError(file, 'file name must use only letters, digits, ".", "_" or "-" (it becomes the URL slug)');
  }

  const { parsed, data } = readMarkdown(file, 'title, date and summary');
  const title = requireText(file, data, 'title');
  if (data.date == null || String(data.date).trim() === '') {
    throw new BuildError(file, 'frontmatter is missing required field "date"');
  }
  const date = parseDate(file, rawDate(data, parsed.matter || ''));
  const summary = requireText(file, data, 'summary');

  return { file, slug, title, summary, date, html: marked.parse(parsed.content) };
}

// ---------- Templates ----------

// Splits `html` around one <!-- BUILD:marker --> … <!-- /BUILD:marker --> region.
function splitRegion(file, html, marker) {
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
  return { before: html.slice(0, start), after: html.slice(end + close.length) };
}

function readTemplate(file, marker) {
  if (!fs.existsSync(file)) throw new BuildError(file, 'template not found');
  const html = fs.readFileSync(file, 'utf8');
  return { file, ...splitRegion(file, html, marker) };
}

const TOKEN_RE = /\{\{(title|summary|date_iso|date_display)\}\}/g;

function fillTokens(text, tokens) {
  return text.replace(TOKEN_RE, (_, k) => escapeHtml(tokens[k] ?? ''));
}

// Text tokens are filled in the template parts only, never inside the inserted
// region, so a post that mentions "{{title}}" in its body is left alone.
function fill(template, tokens, region) {
  return fillTokens(template.before, tokens) + region + fillTokens(template.after, tokens);
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

// ---------- Patterns page ----------
//
// The page is organised in tracks (src/patterns/catalog.json): the generic patterns
// plus one track per cloud. Each track has its own categories, number prefix and entry
// format, and its entries live in entries/<track>/ with diagrams in diagrams/<track>/.

// Every entry has exactly these "##" sections, in this order, per format. Keep in sync
// with the pattern-entry skill.
const FORMATS = {
  pattern: {
    needs: 'title, category, order, summary, figure and caution',
    sections: ['Everyday comparison', 'Where it comes from', 'In the agent system', 'In a large company', 'Step by step', 'Code sketch'],
    sceneTitle: true, // the first section opens with a "###" scene title
  },
  cloud: {
    needs: 'title, category, order, summary, figure, caution, services and implements',
    sections: ['Scenario', 'How it works', 'Security and identity', 'Reliability and operations', 'Cost', 'Deploy it', 'Learn more'],
    sceneTitle: false,
  },
};

function categorySlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other';
}

// Reads catalog.json: the tracks in page order, each with its categories in page order.
function readCatalog(errors) {
  const file = path.join(patternsDir, 'catalog.json');
  try {
    if (!fs.existsSync(file)) throw new BuildError(file, 'catalog file not found');
    let list;
    try {
      list = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      throw new BuildError(file, `invalid JSON (${err.message})`);
    }
    if (!Array.isArray(list) || list.length === 0) throw new BuildError(file, 'must be a non-empty JSON array of tracks');
    const tracks = [];
    list.forEach((t, i) => {
      const where = `track ${i + 1}${t && isText(t.id) ? ` ("${t.id}")` : ''}`;
      if (!t || !isText(t.id) || !SLUG_RE.test(t.id)) throw new BuildError(file, `${where} needs an "id" made of letters, digits, ".", "_" or "-"`);
      if (tracks.some((x) => x.id === t.id)) throw new BuildError(file, `${where}: id is used twice`);
      for (const key of ['name', 'group', 'description']) {
        if (!isText(t[key])) throw new BuildError(file, `${where} needs a non-empty "${key}"`);
      }
      if (typeof t.prefix !== 'string') throw new BuildError(file, `${where} needs a "prefix" string ("" for none)`);
      if (!FORMATS[t.format]) throw new BuildError(file, `${where}: "format" must be one of ${Object.keys(FORMATS).join(', ')}`);
      if (t.format === 'cloud' && !isText(t.provider)) throw new BuildError(file, `${where}: cloud tracks need a "provider" (e.g. "Azure")`);
      if (!Array.isArray(t.categories) || t.categories.length === 0) throw new BuildError(file, `${where} needs a non-empty "categories" array`);
      const categories = [];
      t.categories.forEach((c, j) => {
        if (!c || !isText(c.name) || !isText(c.description)) {
          throw new BuildError(file, `${where}, category ${j + 1} needs a non-empty "name" and "description"`);
        }
        const slug = categorySlug(c.name.trim());
        if (categories.some((x) => x.slug === slug)) throw new BuildError(file, `${where}: category "${c.name}" is listed twice`);
        categories.push({ name: c.name.trim(), slug, key: `${t.id}/${slug}`, description: c.description.trim() });
      });
      tracks.push({
        id: t.id,
        name: t.name.trim(),
        group: t.group.trim(),
        prefix: t.prefix.trim(),
        format: t.format,
        provider: t.format === 'cloud' ? t.provider.trim() : null,
        description: t.description.trim(),
        categories,
      });
    });
    return tracks;
  } catch (err) {
    if (!(err instanceof BuildError)) throw err;
    errors.push(err);
    return null;
  }
}

// Entry bodies use "##" for their sections; on the page the track is the h2 and each
// entry title the h3, so every heading in the body moves two levels down.
function demoteHeadings(html) {
  return html.replace(/<(\/?)h([1-4])(?=[\s>])/g, (_, slash, level) => `<${slash}h${Number(level) + 2}`);
}

// Checks the body's section headings against the track format.
function checkSections(file, content, format) {
  const tokens = marked.lexer(content).filter((t) => t.type !== 'space');
  const found = tokens.filter((t) => t.type === 'heading' && t.depth <= 2).map((t) => `${'#'.repeat(t.depth)} ${t.text.trim()}`);
  const expected = format.sections.map((h) => `## ${h}`);
  if (found.join('\n') !== expected.join('\n')) {
    throw new BuildError(
      file,
      `body sections must be exactly, in order: ${expected.map((h) => `"${h}"`).join(', ')}; found ${found.length ? found.map((h) => `"${h}"`).join(', ') : 'none'}`,
    );
  }
  if (format.sceneTitle) {
    const first = tokens.findIndex((t) => t.type === 'heading' && t.depth === 2);
    const next = tokens[first + 1];
    if (!next || next.type !== 'heading' || next.depth !== 3) {
      throw new BuildError(file, `"## ${format.sections[0]}" must open with a "###" scene title`);
    }
  }
}

// Checks the hand-written diagram and returns it for inlining. Colors come only
// from patterns.css (DESIGN_SYSTEM.md), so the SVG may carry classes but no colors,
// and ids must be prefixed with the slug because every diagram shares one page.
function readDiagram(file, slug, track) {
  if (!fs.existsSync(file)) throw new BuildError(file, `diagram not found (every entry needs patterns/diagrams/${track}/${slug}.svg)`);
  const svg = fs.readFileSync(file, 'utf8').trim();
  const problems = [];
  if (!svg.startsWith('<svg')) problems.push('must start with "<svg" (no XML prolog or comments before it)');
  if (!/^<svg\b[^>]*\brole="img"/.test(svg)) problems.push('the <svg> element needs role="img"');
  if (!/<title\b[^>]*>[^<]*\S[^<]*<\/title>/.test(svg)) problems.push('needs a non-empty <title> describing the diagram');
  if (/<script|\son[a-z]+\s*=/i.test(svg)) problems.push('must not contain scripts or event handlers');
  if (/\sstyle\s*=|<style/i.test(svg)) problems.push('must not use inline styles; use the classes styled in patterns.css');
  if (/(?:fill|stroke|stop-color|color)\s*[=:]\s*["']?\s*(?:#|rgb|hsl)/i.test(svg)) problems.push('must not set colors; use the classes styled in patterns.css');
  if (/<image\b|<foreignObject\b/i.test(svg)) problems.push('must not embed images or HTML; draw with the node and edge classes');
  for (const id of new Set([...svg.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]))) {
    if (!id.startsWith(`${slug}-`)) problems.push(`id "${id}" must start with "${slug}-" so it stays unique on the page`);
  }
  const box = svg.match(/^<svg\b[^>]*\bviewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (!box) problems.push('the <svg> element needs viewBox="0 0 {width} {height}"');
  if (/^<svg\b[^>]*\s(?:width|height)=/.test(svg)) problems.push('leave width and height off the <svg> element; the build sets them from viewBox');
  if (problems.length) throw new BuildError(file, problems.join('; '));
  // The natural size lets narrow screens show the diagram at full size inside a
  // scrolling frame instead of shrinking its text.
  return svg.replace(/^<svg\b/, `<svg width="${box[1]}" height="${box[2]}"`);
}

function slugList(file, data, field) {
  const list = data[field] ?? [];
  if (!Array.isArray(list) || !list.every((r) => typeof r === 'string' && r.trim())) {
    throw new BuildError(file, `frontmatter "${field}" must be a list of entry file names (without .md)`);
  }
  return list.map((r) => r.trim());
}

function readServices(file, data) {
  const list = data.services;
  const ok =
    Array.isArray(list) &&
    list.length >= 2 &&
    list.every((s) => s && typeof s === 'object' && isText(s.name) && isText(s.role));
  if (!ok) {
    throw new BuildError(file, 'frontmatter "services" must list at least two services, each with a "name" (the real product name) and a "role"');
  }
  return list.map((s) => ({ name: s.name.trim(), role: s.role.trim() }));
}

function readEntry(file, track) {
  const slug = path.basename(file, '.md');
  if (!SLUG_RE.test(slug)) {
    throw new BuildError(file, 'file name must use only letters, digits, ".", "_" or "-" (it becomes the anchor on /patterns/)');
  }
  const format = FORMATS[track.format];
  const { parsed, data } = readMarkdown(file, format.needs);
  const title = requireText(file, data, 'title');
  const category = requireText(file, data, 'category');
  const cat = track.categories.find((c) => c.name === category);
  if (!cat) {
    throw new BuildError(
      file,
      `category "${category}" is not a "${track.id}" category in patterns/catalog.json (use one of: ${track.categories.map((c) => c.name).join(', ')}, or add it there first)`,
    );
  }
  if (typeof data.order !== 'number' || !Number.isFinite(data.order)) {
    throw new BuildError(file, 'frontmatter "order" must be a number');
  }
  const summary = requireText(file, data, 'summary');
  const figure = requireText(file, data, 'figure');
  const caution = requireText(file, data, 'caution');
  const aliases = data.aliases == null ? null : requireText(file, data, 'aliases');
  const related = slugList(file, data, 'related');
  let services = null;
  let implementsList = [];
  if (track.format === 'cloud') {
    services = readServices(file, data);
    implementsList = slugList(file, data, 'implements');
    if (implementsList.length === 0) throw new BuildError(file, 'frontmatter "implements" must name at least one generic pattern');
  } else if (data.services != null || data.implements != null) {
    throw new BuildError(file, '"services" and "implements" are only for cloud tracks');
  }
  checkSections(file, parsed.content, format);
  const diagram = readDiagram(path.join(patternsDir, 'diagrams', track.id, `${slug}.svg`), slug, track.id);
  return {
    file,
    slug,
    track,
    title,
    category: cat,
    order: data.order,
    summary,
    figure,
    caution,
    aliases,
    related,
    services,
    implements: implementsList,
    implementedBy: [],
    diagram,
    html: demoteHeadings(marked.parse(parsed.content)),
  };
}

// The template has three regions, in this order: the hero stats, the contents sidebar
// and the entries.
const PATTERN_REGIONS = ['patterns-stats', 'patterns-nav', 'patterns-entries'];

function readPatternsTemplate(file) {
  if (!fs.existsSync(file)) throw new BuildError(file, 'template not found');
  let rest = fs.readFileSync(file, 'utf8');
  const parts = [];
  for (const marker of PATTERN_REGIONS) {
    const split = splitRegion(file, rest, marker);
    parts.push(split.before);
    rest = split.after;
  }
  parts.push(rest);
  const ids = new Set([...parts.join('').matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]));
  return { file, parts, ids };
}

// Reads and validates every entry, pushing BuildErrors onto `errors`. Returns the
// non-empty tracks in catalog order, each with its non-empty categories in catalog
// order and its entries sorted by `order` within a category, numbered per track
// ("01", or "AZ-01" with a prefix) in that display order.
function readPatterns(errors, template) {
  const tracks = readCatalog(errors);
  if (!tracks) return null;

  const entriesDir = path.join(patternsDir, 'entries');
  if (fs.existsSync(entriesDir)) {
    for (const name of fs.readdirSync(entriesDir)) {
      const full = path.join(entriesDir, name);
      if (!fs.statSync(full).isDirectory()) {
        errors.push(new BuildError(full, `entries go in a track folder: patterns/entries/{${tracks.map((t) => t.id).join(',')}}/`));
      } else if (!tracks.some((t) => t.id === name)) {
        errors.push(new BuildError(full, `"${name}" is not a track id in patterns/catalog.json`));
      }
    }
  }

  const files = tracks.flatMap((track) => {
    const dir = path.join(entriesDir, track.id);
    return fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => ({ file: path.join(dir, f), track }))
      : [];
  });
  const entries = [];
  for (const { file, track } of files) {
    try {
      entries.push(readEntry(file, track));
    } catch (err) {
      if (!(err instanceof BuildError)) throw err;
      errors.push(err);
    }
  }

  // Every entry file counts as existing, even one that failed to read, so a broken
  // entry is reported once and not again by every entry that links to it.
  const known = new Map();
  for (const { file, track } of files) {
    const slug = path.basename(file, '.md');
    if (known.has(slug)) errors.push(new BuildError(file, `file name "${slug}" is already used in patterns/entries/${known.get(slug).id}/ (anchors must be unique across tracks)`));
    else known.set(slug, track);
  }
  const bySlug = new Map(entries.map((e) => [e.slug, e]));
  const emittedIds = new Set([...template?.ids ?? [], 'pattern-search', ...tracks.map((t) => `track-${t.id}`)]);
  for (const t of tracks) {
    const orders = new Map();
    for (const e of entries.filter((x) => x.track === t)) {
      if (orders.has(e.order)) errors.push(new BuildError(e.file, `"order" ${e.order} is already used by ${path.basename(orders.get(e.order).file)} in this track`));
      else orders.set(e.order, e);
    }
  }
  for (const e of entries) {
    for (const r of e.related) {
      if (r === e.slug) errors.push(new BuildError(e.file, '"related" must not list the entry itself'));
      else if (!known.has(r)) errors.push(new BuildError(e.file, `"related" names "${r}", but there is no entry with that file name`));
    }
    for (const r of e.implements) {
      const track = known.get(r);
      if (!track) errors.push(new BuildError(e.file, `"implements" names "${r}", but there is no entry with that file name`));
      else if (track.format !== 'pattern') errors.push(new BuildError(e.file, `"implements" must name generic patterns; "${r}" is in the "${track.id}" track`));
      else bySlug.get(r)?.implementedBy.push(e);
    }
    if ([...emittedIds].some((id) => id === e.slug || id.startsWith(`${e.slug}-`))) {
      errors.push(new BuildError(e.file, `file name "${e.slug}" clashes with an id on the page; rename the entry`));
    }
  }

  const shown = [];
  for (const t of tracks) {
    const own = entries.filter((e) => e.track === t).sort((a, b) => a.order - b.order);
    const categories = t.categories.filter((c) => own.some((e) => e.category === c));
    if (!categories.length) continue;
    const list = categories.flatMap((c) => own.filter((e) => e.category === c));
    list.forEach((e, i) => {
      const n = String(i + 1).padStart(2, '0');
      e.number = t.prefix ? `${t.prefix}-${n}` : n;
    });
    shown.push({ ...t, categories, entries: list });
  }
  for (const e of entries) e.implementedBy.sort((a, b) => a.number.localeCompare(b.number));
  return { tracks: shown, bySlug, count: entries.length };
}

function patternStats(data) {
  return data.tracks
    .map(
      (t) =>
        `<div class="patterns-stats__item"><dt>${escapeHtml(t.name)}</dt><dd>${t.entries.length}</dd></div>`,
    )
    .join('\n');
}

function patternsNav(data) {
  const trackChips = [
    `<button type="button" class="pattern-chip" data-track="all" aria-pressed="true">All</button>`,
    ...data.tracks.map(
      (t) => `<button type="button" class="pattern-chip" data-track="${escapeHtml(t.id)}" aria-pressed="false">${escapeHtml(t.name)}</button>`,
    ),
  ];
  const categoryChips = [
    `<button type="button" class="pattern-chip" data-category="all" aria-pressed="true">All categories</button>`,
    ...data.tracks.flatMap((t) =>
      t.categories.map(
        (c) =>
          `<button type="button" class="pattern-chip" data-category="${escapeHtml(c.key)}" data-for-track="${escapeHtml(t.id)}" aria-pressed="false">${escapeHtml(c.name)}</button>`,
      ),
    ),
  ];
  const sections = data.tracks.map((t) => {
    const groups = t.categories.map((c) => {
      const items = t.entries
        .filter((e) => e.category === c)
        .map(
          (e) =>
            `<li class="patterns-toc__item" data-slug="${escapeHtml(e.slug)}"><a href="#${escapeHtml(e.slug)}">` +
            `<span class="patterns-toc__number">${escapeHtml(e.number)}</span>${escapeHtml(e.title)}</a></li>`,
        );
      return [
        `<li class="patterns-toc__group" data-category="${escapeHtml(c.key)}">`,
        `<p class="patterns-toc__heading">${escapeHtml(c.name)}</p>`,
        `<ol class="patterns-toc__items">`,
        ...items,
        `</ol>`,
        `</li>`,
      ].join('\n');
    });
    return [
      `<li class="patterns-toc__track" data-track="${escapeHtml(t.id)}">`,
      `<a class="patterns-toc__track-link" href="#track-${escapeHtml(t.id)}"><span class="patterns-toc__group-label">${escapeHtml(t.group)}</span>${escapeHtml(t.name)}</a>`,
      `<ol class="patterns-toc__groups">`,
      ...groups,
      `</ol>`,
      `</li>`,
    ].join('\n');
  });
  return [
    `<div class="patterns-filter" hidden>`,
    `<label class="patterns-filter__label" for="pattern-search">Search</label>`,
    `<input class="patterns-filter__search" id="pattern-search" type="search" autocomplete="off" placeholder="e.g. loop, delegate, AI Search">`,
    `<div class="patterns-filter__chips" role="group" aria-label="Filter by track">`,
    ...trackChips,
    `</div>`,
    `<div class="patterns-filter__chips" role="group" aria-label="Filter by category">`,
    ...categoryChips,
    `</div>`,
    `</div>`,
    `<ol class="patterns-toc__tracks">`,
    ...sections,
    `</ol>`,
  ].join('\n');
}

const entryLink = (e) =>
  `<li><a class="pattern-chip pattern-chip--link" href="#${escapeHtml(e.slug)}">${escapeHtml(e.number)} · ${escapeHtml(e.title)}</a></li>`;

function linkRow(cls, label, entries) {
  if (!entries.length) return '';
  return `<nav class="pattern-links ${cls}" aria-label="${escapeHtml(label)}"><p class="pattern-links__title">${escapeHtml(label)}</p><ul class="pattern-links__list">${entries.map(entryLink).join('')}</ul></nav>`;
}

function servicesTable(e) {
  const rows = e.services.map((s) => `<tr><th scope="row">${escapeHtml(s.name)}</th><td>${escapeHtml(s.role)}</td></tr>`);
  return [
    `<section class="pattern-services" aria-labelledby="${escapeHtml(e.slug)}-services">`,
    `<h4 class="pattern-services__title" id="${escapeHtml(e.slug)}-services">${escapeHtml(e.track.provider)} services</h4>`,
    `<div class="table-wrap" tabindex="0"><table>`,
    `<thead><tr><th scope="col">Service</th><th scope="col">Role in this architecture</th></tr></thead>`,
    `<tbody>${rows.join('')}</tbody>`,
    `</table></div>`,
    `</section>`,
  ].join('\n');
}

function patternArticle(e, data) {
  const id = escapeHtml(e.slug);
  const words = [e.title, e.aliases ?? '', e.summary, e.figure, e.category.name, e.track.name, ...(e.services ?? []).map((s) => s.name)];
  const implemented = e.implements.map((r) => data.bySlug.get(r)).filter(Boolean);
  const related = e.related.map((r) => data.bySlug.get(r)).filter(Boolean);
  return [
    `<article class="pattern pattern--${escapeHtml(e.track.format)}" id="${id}" data-track="${escapeHtml(e.track.id)}" data-category="${escapeHtml(e.category.key)}" data-search="${escapeHtml(words.join(' ').toLowerCase())}" aria-labelledby="${id}-heading">`,
    `<header class="pattern__header">`,
    `<p class="pattern__meta"><span class="pattern__number">${escapeHtml(e.number)}</span>` +
      (e.track.provider ? `<span class="pattern__provider">${escapeHtml(e.track.provider)}</span>` : '') +
      `<span class="pattern__tag">${escapeHtml(e.category.name)}</span></p>`,
    `<h3 class="pattern__title" id="${id}-heading">${escapeHtml(e.title)}</h3>`,
    e.aliases ? `<p class="pattern__aliases">Also known as: ${escapeHtml(e.aliases)}</p>` : '',
    `<p class="pattern__summary">${escapeHtml(e.summary)}</p>`,
    linkRow('pattern-links--implements', 'Implements', implemented),
    `</header>`,
    `<figure class="pattern-figure">`,
    `<div class="pattern-figure__canvas" tabindex="0" role="region" aria-label="Diagram: ${escapeHtml(e.title)}">${e.diagram}</div>`,
    `<figcaption><span class="pattern-figure__label">Fig. ${escapeHtml(e.number)}</span> ${escapeHtml(e.figure)}</figcaption>`,
    `</figure>`,
    e.services ? servicesTable(e) : '',
    `<div class="post-body pattern__body">`,
    e.html,
    `</div>`,
    `<aside class="pattern-caution" aria-label="Be careful">`,
    `<p class="pattern-caution__title">Be careful</p>`,
    `<p>${escapeHtml(e.caution)}</p>`,
    `</aside>`,
    linkRow('pattern-links--cloud', 'In the cloud', e.implementedBy),
    linkRow('pattern-links--related', 'Related', related),
    `</article>`,
  ]
    .filter(Boolean)
    .join('\n');
}

function patternTrack(t, data) {
  return [
    `<section class="patterns-track" id="track-${escapeHtml(t.id)}" data-track="${escapeHtml(t.id)}" aria-labelledby="track-${escapeHtml(t.id)}-heading">`,
    `<header class="patterns-track__header">`,
    `<p class="patterns-track__group">${escapeHtml(t.group)}</p>`,
    `<h2 class="patterns-track__title" id="track-${escapeHtml(t.id)}-heading">${escapeHtml(t.name)}</h2>`,
    `<p class="patterns-track__description">${escapeHtml(t.description)}</p>`,
    `<p class="patterns-track__count">${`${t.entries.length} ${t.entries.length === 1 ? 'entry' : 'entries'}`} · ${t.categories.map((c) => escapeHtml(c.name)).join(' · ')}</p>`,
    `</header>`,
    ...t.entries.map((e) => patternArticle(e, data)),
    `</section>`,
  ].join('\n');
}

function patternsPage(template, data) {
  const [beforeStats, beforeNav, beforeEntries, after] = template.parts;
  return (
    beforeStats +
    patternStats(data) +
    beforeNav +
    patternsNav(data) +
    beforeEntries +
    data.tracks.map((t) => patternTrack(t, data)).join('\n') +
    after
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

  let patternsTemplate = null;
  try {
    patternsTemplate = readPatternsTemplate(path.join(patternsDir, 'template.html'));
  } catch (err) {
    if (!(err instanceof BuildError)) throw err;
    errors.push(err);
  }
  const patterns = readPatterns(errors, patternsTemplate);
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

  const patternsOut = path.join(outDir, 'patterns');
  fs.rmSync(path.join(patternsOut, 'entries'), { recursive: true, force: true });
  fs.rmSync(path.join(patternsOut, 'diagrams'), { recursive: true, force: true });
  fs.rmSync(path.join(patternsOut, 'template.html'), { force: true });
  fs.rmSync(path.join(patternsOut, 'catalog.json'), { force: true });
  fs.writeFileSync(path.join(patternsOut, 'index.html'), patternsPage(patternsTemplate, patterns));

  console.log(`Blog build: ${posts.length} post(s) written to ${rel(path.join(outDir, 'blog'))}/`);
  console.log(`Agents page: ${plural(crew.agents, 'agent')}, ${plural(crew.skills, 'skill')} written to ${rel(agentsOut)}/`);
  console.log(`Patterns page: ${patterns.tracks.map((t) => `${t.name} ${t.entries.length}`).join(', ')} written to ${rel(patternsOut)}/`);
}

main();
