(() => {
  const main = document.querySelector('main');
  const kind = location.pathname.split('/').pop().replace('.html', '');
  if (!main || kind !== 'premios') { window.__screenReady = true; return; }

  const source = main.cloneNode(true);
  const clone = element => element.cloneNode(true);
  const node = (tag, className = '') => Object.assign(document.createElement(tag), { className });
  const text = element => element.textContent.replace(/\s+/g, ' ').trim();
  window.__originalTextUnits = [...source.querySelectorAll('p,h1,h2,.minor-kicker,.minor-sub,.award-inner,.rank-grid')].map(text);

  main.replaceChildren();
  main.className = 'viewport-page';
  const layout = node('div', 'view-layout');
  const stage = node('div', 'screen-stage');
  const controls = node('nav', 'page-controls');
  controls.setAttribute('aria-label', 'Vistas de esta página');
  const prev = node('button'), next = node('button'), count = node('span', 'page-counter');
  prev.type = next.type = 'button';
  prev.textContent = '← Anterior'; next.textContent = 'Siguiente →';
  count.setAttribute('aria-live', 'polite');
  controls.append(prev, count, next);
  layout.append(stage); main.append(layout, controls);

  // Diez pasos estables: presentación, ocho grupos consecutivos y aviso final.
  // Se conservan los nodos originales de los quince diplomas, sin transcribirlos.
  const overview = source.querySelector('.award-slide');
  const headerParts = [...overview.children].filter(e => e.matches('.eyebrow,h1'));
  const overviewContent = [...overview.children].filter(e => !e.matches('.eyebrow,h1'));
  const awards = [...source.querySelectorAll('.award')];
  const groups = [overviewContent];
  for (let i = 0; i < awards.length; i += 2) groups.push(awards.slice(i, i + 2));
  groups.push([...source.querySelectorAll('.awards-disclaimer,main > .back')]);

  const frames = groups.map((items, index) => {
    const frame = node('section', 'screen prize-view');
    frame.setAttribute('aria-label', `Vista ${index + 1}`);
    const flow = node('div', 'flow');
    const heading = node('header', 'prize-heading');
    headerParts.forEach(e => heading.append(clone(e)));
    flow.append(heading);
    let grid;
    for (const item of items) {
      if (item.classList.contains('award')) {
        if (!grid) { grid = node('div', 'awards-grid'); flow.append(grid); }
        grid.append(clone(item));
      } else flow.append(clone(item));
    }
    frame.append(flow); stage.append(frame);
    return frame;
  });

  let selected = 0;
  function show(index) {
    selected = Math.max(0, Math.min(frames.length - 1, index));
    frames.forEach((frame, i) => { frame.hidden = i !== selected; });
    prev.disabled = selected === 0; next.disabled = selected === frames.length - 1;
    count.textContent = `${selected + 1} / ${frames.length}`;
    if (document.activeElement === next && next.disabled) prev.focus({ preventScroll: true });
    if (document.activeElement === prev && prev.disabled && !next.disabled) next.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  prev.addEventListener('click', () => show(selected - 1));
  next.addEventListener('click', () => show(selected + 1));
  document.addEventListener('keydown', event => {
    if (['ArrowRight','PageDown','ArrowLeft','PageUp'].includes(event.key) && !['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)) {
      event.preventDefault();
      show(selected + (['ArrowRight','PageDown'].includes(event.key) ? 1 : -1));
    }
  });
  show(0);
  window.__screenCount = frames.length;
  window.__showScreen = show;
  document.fonts.ready.then(() => { window.__screenReady = true; });
})();
