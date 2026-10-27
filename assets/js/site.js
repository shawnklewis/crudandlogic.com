(() => {
  'use strict';
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionToggle = document.getElementById('motion-toggle');
  const playToggle = document.getElementById('pipeline-play');
  const steps = Array.from(document.querySelectorAll('.flow-step'));
  const track = document.getElementById('flow-track');
  const marker = document.querySelector('.travelling-doc');
  const data = [
    { label: 'RECEIVE ORDER', title: 'The document starts the journey.', description: 'A person or a connected system supplies the order. This example begins with an order page and its line items.', pages: ['Order details', 'Line items'], note: 'The same context travels with the work.' },
    { label: 'CHECK DETAILS', title: 'One worker checks the inputs.', description: 'The validation worker reads the order and line-item pages. It adds a validation page. A failed check follows a defined error route rather than continuing to pricing.', pages: ['Order details', 'Line items', 'Validation: passed'], note: 'This illustration follows the successful route.' },
    { label: 'CALCULATE TOTAL', title: 'Another worker applies the rules.', description: 'The pricing worker uses the relevant inputs and adds a pricing page. It does not hide database access inside its calculation.', pages: ['Order details', 'Line items', 'Validation: passed', 'Pricing result'], note: 'The business rule has a focused, testable job.' },
    { label: 'SAVE DOCUMENT', title: 'A CRUD worker handles persistence.', description: 'The storage step preserves the checked document. In the proposed architecture, document files are versioned in Git and database lookups point back to them.', pages: ['Order details', 'Line items', 'Validation: passed', 'Pricing result', 'Storage reference'], note: 'Storage is separate from the pricing rule.' },
    { label: 'RETURN RESULT', title: 'The result becomes useful to an actor.', description: 'The gateway returns the result to a person or another system. A person might read a document; an integration can continue its own work.', pages: ['Order details', 'Line items', 'Validation: passed', 'Pricing result', 'Storage reference', 'Result summary'], note: 'The flow is explicit from input to output.' }
  ];
  let paused = preference.matches, demoPaused = false, index = 0, pipelineVisible = false, heroVisible = true, timer;
  const canvas = document.getElementById('hero-particles');
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, frame = 0, previous = 0, flowTime = 0, scrollFrame = 0;
  const panels = Array.from(document.querySelectorAll('.panel, .closing-panel'));
  const panelAnimations = [];
  // Keep all copy present. Scroll only changes emphasis and position, never visibility.
  if (typeof Element.prototype.animate === 'function') {
    panels.forEach(panel => {
      const targets = panel.querySelectorAll(':scope > .section-label, :scope > .ai-illustrated-intro, :scope > .split, :scope > h2, :scope > .wide-intro, :scope > .principles, :scope > .simulation, :scope > .translation, :scope > .system-map, :scope > .hardware-map, :scope > .transformation-bridge, :scope > .ai-flow, :scope > .film-playback, :scope > .replay-diagram, :scope > .roadmap, :scope > .deep-grid');
      targets.forEach((target, i) => {
        const animation = target.animate([
          { transform: `translateY(${i % 2 ? 42 : 26}px)`, opacity: .72 },
          { transform: 'translateY(0)', opacity: 1 }
        ], { duration: 1000, fill: 'both', easing: 'cubic-bezier(.2,.7,.2,1)' });
        animation.pause(); animation.currentTime = 1000;
        panelAnimations.push({ target, animation });
      });
    });
  }
  function updateScroll() {
    scrollFrame = 0;
    panelAnimations.forEach(({ target, animation }) => {
      // Layout offsets exclude our animated translation, avoiding feedback as we scroll.
      let top = -window.scrollY;
      for (let anchor = target; anchor; anchor = anchor.offsetParent) top += anchor.offsetTop;
      const progress = paused ? 1 : Math.max(0, Math.min(1, (window.innerHeight * .97 - top) / (window.innerHeight * .42)));
      animation.currentTime = progress * 1000;
    });
  }
  function requestScroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }
  const particles = Array.from({ length: 48 }, (_, i) => ({ x: (i * .61803398875) % 1, y: (i * .754877666) % 1, size: i % 4 === 0 ? 1.5 : .7, speed: .000015 + (i % 5) * .000004 }));
  try { const saved = localStorage.getItem('cal-motion'); if (saved !== null) paused = saved === 'paused'; } catch (_) {}
  function renderStep(next) {
    index = next; const d = data[index];
    steps.forEach((step, i) => { step.classList.toggle('active', i === index); step.setAttribute('aria-pressed', String(i === index)); });
    document.getElementById('step-label').textContent = `STEP 0${index + 1} / ${d.label}`;
    document.getElementById('step-title').textContent = d.title;
    document.getElementById('step-description').textContent = d.description;
    document.getElementById('document-note').textContent = d.note;
    document.getElementById('document-pages').replaceChildren(...d.pages.map(page => { const li = document.createElement('li'); li.textContent = page; return li; }));
    marker.style.left = `${steps[index].offsetLeft + steps[index].offsetWidth / 2 - 9}px`;
  }
  function schedule() {
    clearInterval(timer);
    if (!paused && !demoPaused && pipelineVisible && !document.hidden) timer = setInterval(() => renderStep((index + 1) % data.length), 4800);
    playToggle.textContent = paused ? 'Motion paused' : demoPaused ? 'Play demo ▷' : 'Pause demo Ⅱ';
    playToggle.disabled = paused;
    playToggle.setAttribute('aria-label', paused ? 'Demo paused by animation setting' : demoPaused ? 'Play pipeline demo' : 'Pause pipeline demo');
  }
  function applyMotion() {
    root.classList.toggle('motion-paused', paused);
    motionToggle.setAttribute('aria-pressed', String(paused));
    motionToggle.textContent = paused ? 'Resume animation ▷' : 'Pause animation Ⅱ'; schedule();
    if (paused) { cancelAnimationFrame(frame); frame = 0; draw(false); } else start();
    updateScroll();
  }
  steps.forEach((step, i) => step.addEventListener('click', () => { demoPaused = true; renderStep(i); schedule(); }));
  playToggle.addEventListener('click', () => { demoPaused = !demoPaused; schedule(); });
  motionToggle.addEventListener('click', () => { paused = !paused; try { localStorage.setItem('cal-motion', paused ? 'paused' : 'running'); } catch (_) {} applyMotion(); });
  preference.addEventListener('change', event => { paused = event.matches; try { localStorage.removeItem('cal-motion'); } catch (_) {} applyMotion(); });
  function resize() {
    const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = width * dpr; canvas.height = height * dpr;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderStep(index); draw(false); requestScroll();
  }
  function draw(advance, elapsed = 16) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (advance) flowTime += elapsed;
    drawDocumentFlow();
    particles.forEach((p, i) => {
      if (advance) p.x = (p.x + p.speed * elapsed) % 1;
      const x = p.x * width, y = (.22 + p.y * .58 + Math.sin(p.x * 7 + i) * .025) * height;
      ctx.fillStyle = i % 4 === 0 ? '#edb182' : '#86e6cd'; ctx.globalAlpha = .2 + p.x * .5;
      ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
      if (i % 4 === 0) { ctx.globalAlpha = .12; ctx.strokeStyle = '#86e6cd'; ctx.beginPath(); ctx.moveTo(x - 30, y + 6); ctx.lineTo(x, y); ctx.stroke(); }
    }); ctx.globalAlpha = 1;
  }
  function drawDocumentFlow() {
    const mobile = width <= 760;
    const centerY = height * (mobile ? .82 : .52);
    const startX = width * (mobile ? -.08 : .40);
    const endX = width * 1.14;
    const baseHeight = height * (mobile ? .24 : .59);
    const gates = [0, 1, 2].map(i => ({
      x: width * (mobile ? .26 + i * .30 : .60 + i * .185),
      h: baseHeight * (1 - i * .15),
      w: Math.max(30, width * (mobile ? .10 : .065)) * (1 - i * .13)
    }));
    ctx.save();
    // Light trails establish a continuous route through the three openings.
    for (let line = -2; line <= 2; line++) {
      ctx.beginPath(); ctx.moveTo(startX, centerY + line * 11);
      ctx.bezierCurveTo(width * .63, centerY - 40 + line * 8, width * .85, centerY + 30 + line * 7, endX, centerY + line * 6);
      ctx.strokeStyle = line % 2 ? '#edb18228' : '#86e6cd25'; ctx.lineWidth = 1; ctx.stroke();
    }
    // Back faces first, then moving sheets, then foreground jambs: real occlusion.
    gates.slice().reverse().forEach(g => drawGate(g, false));
    for (let i = 0; i < 18; i++) {
      const t = ((flowTime / 14500) + i / 18) % 1;
      const x = startX + (endX - startX) * t;
      const y = centerY + Math.sin(t * Math.PI * 2) * (mobile ? 9 : 24);
      const size = (mobile ? 30 : 76) * (1 - t * .35);
      const fade = Math.min(1, t * 7, (1 - t) * 8);
      ctx.save(); ctx.translate(x, y); ctx.rotate(-.14 + Math.sin(t * 5) * .10);
      ctx.transform(.72, -.13, .08, 1, 0, 0);
      ctx.globalAlpha = fade * .85;
      const fill = ctx.createLinearGradient(-size * .3, -size * .5, size * .3, size * .5);
      fill.addColorStop(0, i % 5 === 0 ? '#d1a46b60' : '#7de8d358'); fill.addColorStop(1, '#102e3b80');
      ctx.fillStyle = fill; ctx.strokeStyle = i % 5 === 0 ? '#edc595' : '#a3f6e3';
      ctx.shadowColor = i % 5 === 0 ? '#edb182' : '#86e6cd'; ctx.shadowBlur = 14;
      ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(-size * .31, -size * .5, size * .62, size, 3); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = '#d1fff099';
      for (let row = 0; row < 4; row++) {
        ctx.beginPath(); ctx.moveTo(-size * .20, -size * .22 + row * size * .13);
        ctx.lineTo(size * (row === 3 ? .02 : .18), -size * .22 + row * size * .13); ctx.stroke();
      }
      ctx.restore();
    }
    gates.slice().reverse().forEach(g => drawGate(g, true));
    ctx.restore();
    function drawGate(g, front) {
      const x = g.x, y = centerY - g.h / 2, depth = g.w * .27, rim = Math.max(5, g.w * .15);
      ctx.save(); ctx.globalAlpha = front ? 1 : .7;
      const metal = ctx.createLinearGradient(x - g.w / 2, 0, x + g.w / 2, 0);
      metal.addColorStop(0, '#24424d'); metal.addColorStop(.22, '#73949a'); metal.addColorStop(.45, '#172b33'); metal.addColorStop(.8, '#37565c'); metal.addColorStop(1, '#12262d');
      ctx.fillStyle = metal;
      const offset = front ? 0 : depth;
      ctx.fillRect(x - g.w / 2 + offset, y, rim, g.h);
      ctx.fillRect(x + g.w / 2 - rim + offset, y, rim, g.h);
      ctx.fillRect(x - g.w / 2 + offset, y, g.w, rim);
      ctx.fillRect(x - g.w / 2 + offset, y + g.h - rim, g.w, rim);
      ctx.shadowColor = '#86e6cd'; ctx.shadowBlur = front ? 18 : 6;
      ctx.strokeStyle = front ? '#99e7d9aa' : '#edb18277'; ctx.lineWidth = 1;
      ctx.strokeRect(x - g.w / 2 + rim + offset, y + rim, g.w - rim * 2, g.h - rim * 2);
      if (front) {
        const glow = ctx.createRadialGradient(x, centerY + g.h / 2, 0, x, centerY + g.h / 2, g.w * 1.5);
        glow.addColorStop(0, '#86e6cd18'); glow.addColorStop(1, '#86e6cd00');
        ctx.shadowBlur = 0; ctx.fillStyle = glow; ctx.fillRect(x - g.w * 1.5, centerY + g.h / 2 - 20, g.w * 3, 70);
      }
      ctx.restore();
    }
  }
  function animate(time) { const elapsed = previous ? Math.min(time - previous, 50) : 16; previous = time; draw(true, elapsed); frame = requestAnimationFrame(animate); }
  function start() { if (ctx && !frame && !paused && heroVisible && !document.hidden) { previous = 0; frame = requestAnimationFrame(animate); } }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.target === track) pipelineVisible = entry.isIntersecting; else heroVisible = entry.isIntersecting; }); schedule();
      if (!heroVisible) { cancelAnimationFrame(frame); frame = 0; } else start();
    }, { threshold: 0 });
    observer.observe(track); observer.observe(document.querySelector('.hero'));
  } else pipelineVisible = true;
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else start(); schedule(); });
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', requestScroll, { passive: true });
  motionToggle.hidden = false; playToggle.hidden = false;
  resize(); applyMotion(); root.classList.add('motion-ready');
})();
