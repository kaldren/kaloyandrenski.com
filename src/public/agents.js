// Agents page behaviour (spec: specs/8-agents-page.md).
// Reads the #crew-data block written by the build (or the sample in
// src/agents/template.html) and drives node selection, the console, and the
// build-feature replay. No libraries.

const TYPE_DELAY = 18;
const STEP_DELAY = 1800;

const consoleBody = document.getElementById('console-body');
const replayButton = document.getElementById('replay-button');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const entries = readCrewData();
const byKey = new Map(entries.map((entry) => [entry.key, entry]));
const nodes = [...document.querySelectorAll('.node[data-key]')];
const steps = [...document.querySelectorAll('.lane[data-lane="feature"] .lane__step')].map((li) => ({
  li,
  nodes: [...li.querySelectorAll('.node[data-key]')],
}));

let selectedKey = null;
const typers = new Set();
const replay = { active: false, running: false, index: -1, timer: null, log: null };

function readCrewData() {
  const block = document.getElementById('crew-data');
  if (!block) return [];
  try {
    const data = JSON.parse(block.textContent);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ---------- Typing ----------

// Screen readers get the full text once (visually hidden span inside the live
// region); the visible, character-by-character copy is aria-hidden.
function makeTyped(text) {
  const full = el('span', 'visually-hidden', text);
  const typed = el('span', 'console__typed');
  typed.setAttribute('aria-hidden', 'true');
  const caret = el('span', 'console__caret');
  caret.setAttribute('aria-hidden', 'true');

  const start = () => {
    consoleBody.querySelectorAll('.console__caret').forEach((c) => {
      if (c !== caret) c.remove();
    });
    if (reducedMotion.matches) {
      typed.textContent = text;
      return;
    }
    let i = 0;
    let timer = null;
    const finish = () => {
      clearTimeout(timer);
      typed.textContent = text;
      typers.delete(finish);
    };
    const tick = () => {
      i += 1;
      typed.textContent = text.slice(0, i);
      if (i < text.length) timer = setTimeout(tick, TYPE_DELAY);
      else typers.delete(finish);
    };
    typers.add(finish);
    tick();
  };

  return { nodes: [full, typed, caret], start };
}

function finishTyping() {
  [...typers].forEach((finish) => finish());
}

// ---------- Selection ----------

function select(key) {
  if (replay.active) stopReplay({ quiet: true });
  if (key === selectedKey || !byKey.has(key)) return;
  selectedKey = key;
  nodes.forEach((node) => node.setAttribute('aria-pressed', String(node.dataset.key === key)));
  renderEntry(byKey.get(key));
}

function clearSelection() {
  selectedKey = null;
  nodes.forEach((node) => node.setAttribute('aria-pressed', 'false'));
}

function renderWho(entry) {
  const who = el('p', `console__who console__who--${entry.kind}`);
  const glyph = el('span', 'console__glyph', entry.glyph);
  glyph.setAttribute('aria-hidden', 'true');
  who.append(glyph, el('span', 'console__name', entry.name), el('span', 'console__kind', entry.kind));
  return who;
}

function renderEntry(entry) {
  finishTyping();
  const wrap = el('div', 'console__entry');
  const line = el('p', 'console__line');
  const typed = makeTyped(entry.line);
  line.append(...typed.nodes);
  wrap.append(renderWho(entry), line);

  const meta = el('dl', 'console__meta');
  const add = (term, value) => {
    const dd = el('dd');
    if (typeof value === 'string') dd.textContent = value;
    else dd.append(value);
    meta.append(el('dt', null, term), dd);
  };

  if (entry.kind !== 'human') {
    const hasTools = Array.isArray(entry.tools) && entry.tools.length > 0;
    if (hasTools) add('Tools', entry.tools.join(', '));
    if (entry.model) add('Model', entry.model);
    if (!hasTools && !entry.model) {
      add('Runs', entry.kind === 'skill'
        ? 'inside its caller, with no tools or model of its own'
        : 'with the default tools and model');
    }
  }

  if (Array.isArray(entry.owns) && entry.owns.length > 0) {
    const list = el('ul', 'console__owns');
    entry.owns.forEach((item) => list.append(el('li', null, item)));
    add('Owns', list);
  }

  if (entry.url) {
    const link = el('a', null, entry.path || 'Definition');
    link.href = entry.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.append(el('span', 'visually-hidden', ' (opens in a new tab)'));
    add('Source', link);
  }

  if (meta.childElementCount > 0) wrap.append(meta);
  consoleBody.replaceChildren(wrap);
  typed.start();
}

// ---------- Replay ----------

function updateButton() {
  if (reducedMotion.matches) {
    replayButton.textContent = 'Next step';
    delete replayButton.dataset.state;
  } else if (replay.running) {
    replayButton.textContent = 'Stop replay';
    replayButton.dataset.state = 'running';
  } else {
    replayButton.textContent = 'Run build-feature';
    delete replayButton.dataset.state;
  }
}

function clearHighlight() {
  document.querySelectorAll('.is-lit').forEach((item) => item.classList.remove('is-lit'));
}

function beginReplay() {
  finishTyping();
  clearSelection();
  clearHighlight();
  const wrap = el('div', 'console__entry');
  wrap.append(el('p', 'console__prompt', '$ run build-feature'));
  replay.log = el('ol', 'console__log');
  wrap.append(replay.log);
  consoleBody.replaceChildren(wrap);
  replay.active = true;
  replay.index = -1;
}

function logLine(entry) {
  const item = el('li');
  const who = el('span', `console__log-who console__log-who--${entry.kind}`, entry.name);
  const typed = makeTyped(entry.replay);
  item.append(who, document.createTextNode(': '), ...typed.nodes);
  replay.log.append(item);
  typed.start();
}

function logEnd(text) {
  if (!replay.log) return;
  finishTyping();
  replay.log.append(el('li', 'console__log-end', text));
}

function advance() {
  replay.index += 1;
  const step = steps[replay.index];
  if (!step) return false;
  finishTyping();
  step.li.classList.add('is-lit');
  step.nodes.forEach((node) => {
    node.classList.add('is-lit');
    const entry = byKey.get(node.dataset.key);
    if (entry && entry.replay) logLine(entry);
  });
  return replay.index < steps.length - 1;
}

function runNext() {
  if (advance()) {
    replay.timer = setTimeout(runNext, STEP_DELAY);
  } else {
    replay.timer = setTimeout(() => {
      logEnd('Done. Spec to changelog.');
      replay.running = false;
      replay.timer = null;
      updateButton();
    }, STEP_DELAY);
  }
}

function startReplay() {
  beginReplay();
  replay.running = true;
  updateButton();
  runNext();
}

function stopReplay({ quiet = false } = {}) {
  clearTimeout(replay.timer);
  replay.timer = null;
  const wasRunning = replay.running;
  replay.running = false;
  replay.active = false;
  replay.index = -1;
  clearHighlight();
  if (wasRunning && !quiet) logEnd('^C Replay stopped.');
  updateButton();
}

function stepOnce() {
  if (!replay.active || replay.index >= steps.length - 1) beginReplay();
  const more = advance();
  if (!more) logEnd('Done. Press Next step to start over.');
}

function onReplayButton() {
  if (reducedMotion.matches) stepOnce();
  else if (replay.running) stopReplay();
  else startReplay();
}

// ---------- Wiring ----------

function init() {
  if (!consoleBody || entries.length === 0) return;

  nodes.forEach((node) => {
    const key = node.dataset.key;
    node.addEventListener('click', () => select(key));
    node.addEventListener('focus', () => select(key));
    node.addEventListener('pointerenter', (event) => {
      // Hover selects, but never interrupts a running replay.
      if (event.pointerType === 'mouse' && !replay.running) select(key);
    });
  });

  if (replayButton && steps.length > 0) {
    replayButton.addEventListener('click', onReplayButton);
    replayButton.setAttribute('aria-controls', 'console-body');
    updateButton();
    replayButton.hidden = false;
  }

  const hint = document.querySelector('.console__js-hint');
  if (hint) hint.hidden = false;

  reducedMotion.addEventListener('change', () => {
    finishTyping();
    if (replay.active) stopReplay({ quiet: true });
    updateButton();
  });
}

init();
