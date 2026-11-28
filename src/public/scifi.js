// Sci-fi homepage theme (experimental): the intro video overlay and the
// animated "agentic grid" background. Plain JS, no dependencies.
//
// The intro plays whenever the homepage is opened directly, and is skipped
// when arriving from another page of this site, under prefers-reduced-motion,
// or with ?nointro. The decision is made by the inline script in <head>,
// which sets html.intro-on before first paint so the page never flashes.

(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     Intro video
     ------------------------------------------------------------------------ */

  const intro = document.getElementById('intro');
  const video = intro && intro.querySelector('.intro__video');
  const pageParts = document.querySelectorAll('body > header, body > main, body > footer');
  let introFinished = !root.classList.contains('intro-on') || !intro || !video;

  function teardownIntro() {
    if (!root.classList.contains('intro-on')) return;
    root.classList.remove('intro-on');
    pageParts.forEach((el) => { el.inert = false; });
    video.pause();
    video.removeAttribute('src');
    video.load();
    startBackground();
  }

  function finishIntro() {
    if (introFinished) return;
    introFinished = true;
    if (reduceMotion) {
      teardownIntro();
      return;
    }
    intro.classList.add('intro--leaving');
    intro.addEventListener('transitionend', (e) => {
      if (e.target === intro) teardownIntro();
    });
    // Fallback in case transitionend never fires.
    window.setTimeout(teardownIntro, 1400);
  }

  if (!introFinished) {
    pageParts.forEach((el) => { el.inert = true; });

    const start = intro.querySelector('[data-intro-start]');
    const skip = intro.querySelector('[data-intro-skip]');
    const sound = intro.querySelector('[data-intro-sound]');
    const status = intro.querySelector('[data-intro-status]');
    const progress = intro.querySelector('.intro__progress');

    video.addEventListener('ended', finishIntro);
    video.addEventListener('error', finishIntro);
    video.addEventListener('timeupdate', () => {
      if (video.duration) progress.style.setProperty('--progress', String(video.currentTime / video.duration));
    });

    function setMuted(muted) {
      video.muted = muted;
      sound.setAttribute('aria-pressed', String(!muted));
      sound.textContent = muted ? 'Sound off' : 'Sound on';
    }

    // The video waits on its first frame until the visitor clicks. Because
    // the click is a user gesture, browsers let it play with sound.
    start.addEventListener('click', () => {
      intro.classList.add('intro--playing');
      status.textContent = 'Uplink established';
      setMuted(false);
      video.play().catch(() => {
        // Some browsers still refuse sound (e.g. iOS silent mode): play muted.
        setMuted(true);
        video.play().catch(finishIntro);
      });
      sound.focus({ preventScroll: true });
    });

    skip.addEventListener('click', finishIntro);
    sound.addEventListener('click', () => setMuted(!video.muted));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') finishIntro();
    });

    video.src = video.dataset.src; // start buffering while the visitor reads the gate
    start.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------------------
     Background: circuit traces, agent pulses travelling along them, and a
     faint digital rain. Drawn on one fixed canvas behind the page.
     ------------------------------------------------------------------------ */

  const canvas = document.querySelector('.matrix-bg');
  let backgroundStarted = false;

  if (introFinished) startBackground();

  function startBackground() {
    if (backgroundStarted || !canvas || !canvas.getContext) return;
    backgroundStarted = true;

    const ctx = canvas.getContext('2d');
    const css = getComputedStyle(root);
    const token = (name) => css.getPropertyValue(name).trim();
    const COLORS = {
      blue: token('--color-neon-blue'),
      violet: token('--color-neon-violet'),
      cyan: token('--color-syntax-function'),
      mint: token('--color-syntax-type'),
    };
    const TRACE_COLORS = [COLORS.blue, COLORS.blue, COLORS.violet, COLORS.cyan];
    const GLYPHS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ<>{}[]/=+*#$agentAI'.split('');
    const GRID = 24;
    const RAIN_STEP = 20;
    const FRAME_MS = 1000 / 30;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let traces = [];
    let pulses = [];
    let flashes = [];
    let rain = [];
    let traceLayer = null;
    let lastFrame = 0;
    let lastSpawn = 0;
    let rafId = 0;

    const rand = (min, max) => min + Math.random() * (max - min);
    const pick = (list) => list[Math.floor(Math.random() * list.length)];

    // A trace walks horizontally on the grid, outwards from the middle like
    // the traces in the intro video, with occasional 45-degree jogs.
    function makeTrace() {
      const side = Math.random() < 0.5 ? -1 : 1;
      const startX = width / 2 + side * rand(width * 0.08, width * 0.42);
      const points = [{ x: Math.round(startX / GRID) * GRID, y: Math.round(rand(0, height) / GRID) * GRID }];
      const steps = Math.floor(rand(5, 16));
      for (let i = 0; i < steps; i += 1) {
        const last = points[points.length - 1];
        const jog = Math.random() < 0.28 ? pick([-1, 1]) : 0;
        const run = jog ? 1 : Math.floor(rand(1, 4));
        points.push({ x: last.x + side * GRID * run, y: last.y + jog * GRID });
      }
      let length = 0;
      const segments = [];
      for (let i = 1; i < points.length; i += 1) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        const len = Math.hypot(dx, dy);
        segments.push({ from: points[i - 1], dx, dy, len, start: length });
        length += len;
      }
      return { points, segments, length, color: pick(TRACE_COLORS) };
    }

    function pointAt(trace, distance) {
      const d = Math.max(0, Math.min(trace.length, distance));
      for (const seg of trace.segments) {
        if (d <= seg.start + seg.len) {
          const t = seg.len ? (d - seg.start) / seg.len : 0;
          return { x: seg.from.x + seg.dx * t, y: seg.from.y + seg.dy * t };
        }
      }
      return trace.points[trace.points.length - 1];
    }

    function drawTraceLayer() {
      traceLayer = document.createElement('canvas');
      traceLayer.width = canvas.width;
      traceLayer.height = canvas.height;
      const t = traceLayer.getContext('2d');
      t.scale(dpr, dpr);
      t.lineWidth = 1.25;
      t.lineJoin = 'round';
      for (const trace of traces) {
        t.strokeStyle = trace.color;
        t.globalAlpha = 0.22;
        t.beginPath();
        trace.points.forEach((p, i) => (i ? t.lineTo(p.x, p.y) : t.moveTo(p.x, p.y)));
        t.stroke();
        // terminal pads at both ends
        t.globalAlpha = 0.55;
        t.fillStyle = trace.color;
        const a = trace.points[0];
        const b = trace.points[trace.points.length - 1];
        t.beginPath();
        t.arc(a.x, a.y, 1.6, 0, Math.PI * 2);
        t.arc(b.x, b.y, 2.4, 0, Math.PI * 2);
        t.fill();
      }
    }

    function makeDrop(column, anywhere) {
      return {
        x: column * RAIN_STEP + RAIN_STEP / 2,
        y: anywhere ? rand(-height, height) : rand(-height * 0.6, -40),
        speed: rand(40, 120),
        length: Math.floor(rand(6, 18)),
        glyphs: Array.from({ length: 18 }, () => pick(GLYPHS)),
        active: Math.random() < 0.35,
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const traceCount = Math.min(70, Math.max(18, Math.floor((width * height) / 26000)));
      traces = Array.from({ length: traceCount }, makeTrace);
      pulses = [];
      flashes = [];
      rain = Array.from({ length: Math.ceil(width / RAIN_STEP) }, (_, i) => makeDrop(i, true));
      drawTraceLayer();
    }

    function spawnPulse(trace) {
      pulses.push({ trace: trace || pick(traces), d: 0, speed: rand(110, 260) });
    }

    function step(dt, now) {
      if (now - lastSpawn > 260 && pulses.length < 26) {
        spawnPulse();
        lastSpawn = now;
      }
      for (const p of pulses) p.d += p.speed * dt;
      for (const p of pulses) {
        if (p.d >= p.trace.length) {
          // the "handoff": the receiving node flashes, and sometimes passes
          // the message on to another trace
          flashes.push({ at: p.trace.points[p.trace.points.length - 1], age: 0, color: p.trace.color });
          if (Math.random() < 0.35) spawnPulse();
        }
      }
      pulses = pulses.filter((p) => p.d < p.trace.length);
      for (const f of flashes) f.age += dt;
      flashes = flashes.filter((f) => f.age < 0.8);

      for (let i = 0; i < rain.length; i += 1) {
        const drop = rain[i];
        if (!drop.active) {
          if (Math.random() < 0.004) rain[i] = { ...makeDrop(i, false), active: true };
          continue;
        }
        drop.y += drop.speed * dt;
        if (Math.random() < 0.05) drop.glyphs[Math.floor(Math.random() * drop.glyphs.length)] = pick(GLYPHS);
        if (drop.y - drop.length * RAIN_STEP > height) rain[i] = makeDrop(i, false);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // digital rain
      ctx.font = `13px ${token('--font-mono')}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.mint;
      for (const drop of rain) {
        if (!drop.active) continue;
        for (let k = 0; k < drop.length; k += 1) {
          const y = drop.y - k * RAIN_STEP;
          if (y < -RAIN_STEP || y > height + RAIN_STEP) continue;
          ctx.globalAlpha = k === 0 ? 0.6 : 0.3 * (1 - k / drop.length);
          ctx.fillText(drop.glyphs[k], drop.x, y);
        }
      }

      // static traces
      ctx.globalAlpha = 1;
      ctx.drawImage(traceLayer, 0, 0, width, height);

      // pulses: a bright head with a short fading tail
      ctx.lineCap = 'round';
      for (const p of pulses) {
        const head = pointAt(p.trace, p.d);
        const tail = pointAt(p.trace, p.d - 36);
        const grad = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, p.trace.color);
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tail.x, tail.y);
        ctx.lineTo(head.x, head.y);
        ctx.stroke();
        ctx.fillStyle = p.trace.color;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // node flashes: an expanding ring
      ctx.lineWidth = 1.5;
      for (const f of flashes) {
        const t = f.age / 0.8;
        ctx.globalAlpha = 0.7 * (1 - t);
        ctx.strokeStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.at.x, f.at.y, 3 + t * 16, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      rafId = window.requestAnimationFrame(loop);
      if (now - lastFrame < FRAME_MS) return;
      const dt = Math.min(0.1, (now - (lastFrame || now)) / 1000);
      lastFrame = now;
      step(dt, now);
      draw();
    }

    function play() {
      if (rafId || reduceMotion) return;
      lastFrame = 0;
      rafId = window.requestAnimationFrame(loop);
    }

    function stop() {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        if (reduceMotion) draw();
      }, 150);
    });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));

    resize();
    draw(); // reduced motion gets this single still frame
    play();
  }
})();
