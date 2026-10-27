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
  let width = 0, height = 0, frame = 0, previous = 0;
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
  }
  steps.forEach((step, i) => step.addEventListener('click', () => { demoPaused = true; renderStep(i); schedule(); }));
  playToggle.addEventListener('click', () => { demoPaused = !demoPaused; schedule(); });
  motionToggle.addEventListener('click', () => { paused = !paused; try { localStorage.setItem('cal-motion', paused ? 'paused' : 'running'); } catch (_) {} applyMotion(); });
  preference.addEventListener('change', event => { paused = event.matches; try { localStorage.removeItem('cal-motion'); } catch (_) {} applyMotion(); });
  function resize() {
    const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = width * dpr; canvas.height = height * dpr;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderStep(index); draw(false);
  }
  function draw(advance, elapsed = 16) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p, i) => {
      if (advance) p.x = (p.x + p.speed * elapsed) % 1;
      const x = p.x * width, y = (.22 + p.y * .58 + Math.sin(p.x * 7 + i) * .025) * height;
      ctx.fillStyle = i % 4 === 0 ? '#edb182' : '#86e6cd'; ctx.globalAlpha = .2 + p.x * .5;
      ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
      if (i % 4 === 0) { ctx.globalAlpha = .12; ctx.strokeStyle = '#86e6cd'; ctx.beginPath(); ctx.moveTo(x - 30, y + 6); ctx.lineTo(x, y); ctx.stroke(); }
    }); ctx.globalAlpha = 1;
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
  motionToggle.hidden = false; playToggle.hidden = false;
  resize(); applyMotion(); root.classList.add('motion-ready');
})();
