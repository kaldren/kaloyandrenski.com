// /patterns/ page: track chips, category chips and search filter the entries, the
// track sections and the contents. Without JS every entry is shown and the filter
// controls stay hidden.

const filter = document.querySelector('.patterns-filter');
const search = document.querySelector('.patterns-filter__search');
const trackChips = [...document.querySelectorAll('.pattern-chip[data-track]')];
const categoryChips = [...document.querySelectorAll('.pattern-chip[data-category]')];
const entries = [...document.querySelectorAll('.pattern')];
const sections = [...document.querySelectorAll('.patterns-track')];
const tocTracks = [...document.querySelectorAll('.patterns-toc__track')];
const empty = document.querySelector('.patterns-empty');

let track = 'all';
let category = 'all';

function press(chips, active) {
  for (const c of chips) c.setAttribute('aria-pressed', String(c === active));
}

function apply() {
  const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visible = new Set();
  for (const e of entries) {
    const show =
      (track === 'all' || e.dataset.track === track) &&
      (category === 'all' || e.dataset.category === category) &&
      terms.every((t) => e.dataset.search.includes(t));
    e.hidden = !show;
    if (show) visible.add(e.id);
  }
  for (const s of sections) {
    s.hidden = !s.querySelector('.pattern:not([hidden])');
  }
  for (const t of tocTracks) {
    let anyInTrack = false;
    for (const group of t.querySelectorAll('.patterns-toc__group')) {
      let any = false;
      for (const item of group.querySelectorAll('.patterns-toc__item')) {
        item.hidden = !visible.has(item.dataset.slug);
        any ||= !item.hidden;
      }
      group.hidden = !any;
      anyInTrack ||= any;
    }
    t.hidden = !anyInTrack;
  }
  // Category chips only for the chosen track.
  for (const c of categoryChips) {
    if (c.dataset.category !== 'all') c.hidden = track !== 'all' && c.dataset.forTrack !== track;
  }
  empty.hidden = visible.size > 0;
}

if (filter && search && empty) {
  filter.addEventListener('click', (event) => {
    const chip = event.target.closest('.pattern-chip');
    if (!chip) return;
    if (chip.dataset.track) {
      track = chip.dataset.track;
      press(trackChips, chip);
      // A category from another track would hide everything, so reset it.
      const current = categoryChips.find((c) => c.dataset.category === category);
      if (category !== 'all' && track !== 'all' && current?.dataset.forTrack !== track) {
        category = 'all';
        press(categoryChips, categoryChips[0]);
      }
    } else if (chip.dataset.category) {
      category = chip.dataset.category;
      press(categoryChips, chip);
    }
    apply();
  });
  search.addEventListener('input', apply);
  filter.hidden = false;
}

// The contents are always open on wide screens (sticky sidebar) and start
// collapsed on narrow ones, closing again after a link is followed.
const toc = document.querySelector('.patterns-toc');
const wide = window.matchMedia('(min-width: 1024px)');

if (toc) {
  const sync = () => {
    toc.open = wide.matches;
  };
  sync();
  wide.addEventListener('change', sync);
  toc.querySelector('summary').addEventListener('click', (event) => {
    if (wide.matches) event.preventDefault();
  });
  toc.addEventListener('click', (event) => {
    if (!wide.matches && event.target.closest('a')) toc.open = false;
  });
}
