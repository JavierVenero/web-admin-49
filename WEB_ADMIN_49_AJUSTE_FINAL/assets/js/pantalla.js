(() => {
  const main = document.querySelector('main');
  if (!main || main.classList.contains('home')) { window.__screenReady = true; return; }
  const source = main.cloneNode(true);
  const kind = location.pathname.split('/').pop().replace('.html', '');
  if (kind !== 'premios') { window.__screenReady = true; return; }
  let selected = 0, rebuilding = false;
  const node = (tag, className) => Object.assign(document.createElement(tag), { className });
  const clone = e => e.cloneNode(true);
  const text = e => e.textContent.replace(/\s+/g, ' ').trim();
  window.__originalTextUnits = [...source.querySelectorAll('p,h1,h2,figcaption,.minor-kicker,.minor-sub,.award-inner,.rank-grid')].map(text);
  function build() {
    if (rebuilding) return;
    rebuilding = true;
    window.__screenReady = false;
    main.replaceChildren();
    main.className = `viewport-page ${kind === 'contacto' ? 'contact-page' : ''}`;
    const layout = node('div', 'view-layout');
    const stage = node('div', 'screen-stage');
    const controls = node('nav', 'page-controls');
    controls.setAttribute('aria-label', 'Vistas de esta página');
    const prev = node('button', ''), next = node('button', ''), count = node('span', 'page-counter');
    prev.type = next.type = 'button'; prev.textContent = '← Anterior'; next.textContent = 'Siguiente →';
    count.setAttribute('aria-live', 'polite');
    controls.append(prev, count, next);
    layout.append(stage); main.append(layout, controls);
    main.style.setProperty('--stage-height', stage.clientHeight + 'px');
    const frames = [];
    function frame(className = '') {
      frames.forEach(f => f.hidden = true);
      const f = node('section', `screen ${className}`), flow = node('div', 'flow');
      f.append(flow); stage.append(f); frames.push(f);
      f.setAttribute('aria-label', `Vista ${frames.length}`);
      return { f, flow };
    }
    function fits(f) { return f.scrollHeight <= f.clientHeight + 1 && f.scrollWidth <= f.clientWidth + 1; }
    function splitAt(el, offset) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n, remain = offset;
      while ((n = walker.nextNode())) {
        if (remain <= n.length) break;
        remain -= n.length;
      }
      if (!n) return null;
      const a = document.createRange(), b = document.createRange();
      a.selectNodeContents(el); b.selectNodeContents(el);
      a.setEnd(n, remain); b.setStart(n, remain);
      const first = el.cloneNode(false), rest = el.cloneNode(false);
      first.append(a.cloneContents()); rest.append(b.cloneContents());
      return [first, rest];
    }
    function fragments(el) {
      // Los contenedores grandes se dividen por sus nodos originales antes de dividir una frase.
      if (el.children.length > 1 && !['P', 'H1', 'H2', 'A', 'FIGURE'].includes(el.tagName) && !el.classList.contains('award')) {
        return [...el.childNodes].filter(n => n.nodeType === 1 || n.textContent.trim()).map(child => {
          const wrapper = el.cloneNode(false); wrapper.append(child.cloneNode(true)); return wrapper;
        });
      }
      const raw = el.textContent;
      const gaps = [...raw.matchAll(/\s+/g)].map(m => m.index + m[0].length);
      if (gaps.length < 2) return null;
      return splitAt(el, gaps[Math.floor(gaps.length / 2)]);
    }
    function pack(items, className = '', factory = null) {
      let view = frame(className), units = 0;
      const queue = items.map(clone);
      const targetFor = item => {
        if (!factory) return view.flow;
        return factory(view, item);
      };
      while (queue.length) {
        const item = queue.shift();
        let target = targetFor(item); target.append(item);
        if (fits(view.f)) { units++; continue; }
        item.remove();
        if (units) { view = frame(className); units = 0; queue.unshift(item); continue; }
        const pieces = fragments(item);
        if (pieces && pieces.length > 1) { queue.unshift(...pieces); continue; }
        // Se registra cualquier unidad imposible de alojar para que la verificación la detecte.
        target = targetFor(item); target.append(item); units++;
        view.f.dataset.fitError = item.tagName;
      }
    }
      const awardSlides = [...source.querySelectorAll('.award-slide')];
      for (const [slideIndex, slide] of awardSlides.entries()) {
        const items = [];
        for (const child of slide.children) {
          if (child.classList.contains('awards-grid')) items.push(...child.children);
          else items.push(child);
        }
        if (slideIndex === awardSlides.length - 1) items.push(...source.querySelectorAll('.awards-disclaimer,main > .back'));
        pack(items, 'prize-view', (view, item) => {
          if (!item.classList.contains('award')) return view.flow;
          if (!view.grid) { view.grid = node('div', 'awards-grid'); view.flow.append(view.grid); }
          return view.grid;
        });
      }
    function show(i) {
      selected = Math.max(0, Math.min(frames.length - 1, i));
      frames.forEach((f, n) => { f.hidden = n !== selected; });
      prev.disabled = selected === 0; next.disabled = selected === frames.length - 1;
      count.textContent = `${selected + 1} / ${frames.length}`;
      if (document.activeElement === next && next.disabled) prev.focus({ preventScroll: true });
      if (document.activeElement === prev && prev.disabled && !next.disabled) next.focus({ preventScroll: true });
    }
    prev.addEventListener('click', () => show(selected - 1));
    next.addEventListener('click', () => show(selected + 1));
    if (frames.length === 1) controls.style.visibility = 'hidden';
    show(selected);
    window.__screenCount = frames.length;
    window.__showScreen = show;
    window.__screenReady = true;
    rebuilding = false;
  }
  const ready = async () => {
    build();
    window.__screenReady = false;
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
    build();
  };
  let timer;
  window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(build, 120); });
  document.addEventListener('keydown', e => {
    if (['ArrowRight', 'PageDown', 'ArrowLeft', 'PageUp'].includes(e.key) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      e.preventDefault(); window.__showScreen?.(selected + (['ArrowRight', 'PageDown'].includes(e.key) ? 1 : -1));
    }
  });
  ready();
})();
