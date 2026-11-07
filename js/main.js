/* ═══════════════════════════════════════════════════════════
   STYLE HAVEN HUB — interactions
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const finePointer = window.matchMedia('(pointer:fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const byId = id => PRODUCTS.find(p => p.id === id);
  const pad = n => String(n).padStart(2, '0');

  /* ─────────────── Preloader ─────────────── */
  (function preloader() {
    const loader = $('#loader');
    const count = $('#loaderCount');
    const bar = $('#loaderBar');
    if (!loader) return;

    let pct = 0;
    let finished = false;
    const started = Date.now();
    const paint = () => {
      count.textContent = pad(Math.min(100, Math.floor(pct)));
      bar.style.width = Math.min(100, pct) + '%';
    };
    const timer = setInterval(() => {
      pct = Math.min(92, pct + Math.random() * 9 + 2);
      paint();
    }, 110);

    function complete() {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      pct = 100;
      paint();
      setTimeout(() => {
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-ready');
        loader.setAttribute('aria-hidden', 'true');
      }, 380);
    }

    const kick = () => setTimeout(complete, Math.max(300, 1000 - (Date.now() - started)));
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', kick, { once: true });
    } else {
      kick();
    }
    setTimeout(complete, 3200);
  })();

  /* ─────────────── Cursor ─────────────── */
  (function cursor() {
    if (!finePointer || reduceMotion) return;
    const el = $('#cursor');
    if (!el) return;
    const dot = $('.cursor__dot', el);
    const ring = $('.cursor__ring', el);
    document.documentElement.classList.add('has-cursor');

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();

    const isInteractive = t => t.closest('a, button, [data-hover], .card__media, .look__media, input, textarea, iframe');
    document.addEventListener('mouseover', e => {
      el.classList.toggle('is-hover', !!isInteractive(e.target));
    });
    document.addEventListener('mouseleave', () => { el.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { el.style.opacity = '1'; });
  })();

  /* ─────────────── Magnetic buttons ─────────────── */
  if (finePointer && !reduceMotion) {
    $$('[data-magnet]').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.32;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ─────────────── Scroll reveals ─────────────── */
  (function reveals() {
    const els = $$('[data-reveal]');
    if (!els.length) return;

    els.forEach(el => {
      const parent = el.parentElement;
      if (!parent) return;
      const sibs = Array.from(parent.children).filter(c => c.hasAttribute('data-reveal'));
      const i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--rd', (i * 0.09).toFixed(2) + 's');
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'));
      $$('.stats').forEach(animateCounters);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        if (entry.target.classList.contains('stats')) animateCounters(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });

    els.forEach(el => io.observe(el));
  })();

  function animateCounters(root) {
    if (!root || root.dataset.counted) return;
    root.dataset.counted = '1';
    $$('[data-count]', root).forEach(el => {
      const target = parseInt(el.dataset.count, 10) || 0;
      if (reduceMotion) { el.textContent = target; return; }
      const dur = 1400;
      const t0 = performance.now();
      (function step(t) {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target;
      })(t0);
    });
  }

  /* ─────────────── Nav / progress / parallax ─────────────── */
  (function chrome() {
    const nav = $('#nav');
    const progress = $('#progressBar');
    const heroMedia = $('#heroMedia');
    let lastY = window.scrollY;
    let ticking = false;

    function update() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

      if (nav) {
        nav.classList.toggle('is-scrolled', y > 30);
        const locked = document.body.classList.contains('menu-open') ||
          $('#drawer').classList.contains('is-open') ||
          $('#lightbox').classList.contains('is-open');
        if (!locked) {
          if (y > 700 && y > lastY + 6) nav.classList.add('is-hidden');
          else if (y < lastY - 6) nav.classList.remove('is-hidden');
        }
      }

      if (heroMedia && !reduceMotion) {
        const shift = Math.min(y, window.innerHeight * 1.2) * 0.16;
        heroMedia.style.transform = `translate3d(0, ${shift}px, 0)`;
      }

      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ─────────────── Mobile menu ─────────────── */
  (function menu() {
    const burger = $('#burger');
    const menuEl = $('#menu');
    if (!burger || !menuEl) return;

    function setOpen(open) {
      const wasOpen = document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open);
      document.body.classList.toggle('no-scroll', open);
      menuEl.classList.toggle('is-open', open);
      menuEl.setAttribute('aria-hidden', String(!open));
      menuEl.toggleAttribute('inert', !open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open) setTimeout(() => { const first = $('a', menuEl); if (first) first.focus({ preventScroll: true }); }, 250);
      else if (wasOpen) burger.focus({ preventScroll: true });
    }

    burger.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));
    $$('a, button', menuEl).forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Tab' && document.body.classList.contains('menu-open')) trapFocus(menuEl, e);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1080) setOpen(false);
    });
  })();

  /* ─────────────── Toast ─────────────── */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-show'), 2800);
  }

  /* ─────────────── Catalogue ─────────────── */
  const grid = $('#grid');
  const filtersEl = $('#filters');
  const countEl = $('#resultCount');
  const loadMoreBtn = $('#loadMore');
  const PER_PAGE = 16;

  let filter = 'all';
  let shown = PER_PAGE;
  let filtered = PRODUCTS.slice();

  function countFor(key) {
    return key === 'all' ? PRODUCTS.length : PRODUCTS.filter(p => p.cat === key).length;
  }

  function buildFilters() {
    const defs = [
      { key: 'all', label: 'All' },
      { key: 'sneaker', label: 'Sneakers' },
      { key: 'boot', label: 'Boots' },
      { key: 'apparel', label: 'Apparel' }
    ];
    filtersEl.innerHTML = defs.map(d => `
      <button class="chip${d.key === 'all' ? ' is-active' : ''}" type="button"
        data-filter="${d.key}" aria-pressed="${d.key === 'all'}" data-hover>
        ${d.label}<span>${countFor(d.key)}</span>
      </button>`).join('');
  }

  function cardHTML(p, i) {
    return `
      <article class="card" style="--i:${i % PER_PAGE}">
        <button class="card__media" type="button" data-open="${p.id}" aria-label="View ${p.name} in ${p.color}">
          <img src="assets/img/thumbs/${p.id}.jpg" alt="${p.name}, ${p.color} ${p.type.toLowerCase()} photographed at Style Haven Hub"
               loading="lazy" decoding="async" width="560" height="700">
          <span class="card__cat">${CATS[p.cat]}</span>
          <span class="card__view">View
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </button>
        <button class="card__add" type="button" data-add="${p.id}" aria-label="Add ${p.name} in ${p.color} to your order">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <div class="card__meta">
          <div>
            <h3 class="card__name">${p.name}</h3>
            <p class="card__sub">${p.color} · ${p.type}</p>
          </div>
          <span class="card__idx">${pad(i + 1)}</span>
        </div>
      </article>`;
  }

  function render(reset) {
    filtered = filter === 'all' ? PRODUCTS.slice() : PRODUCTS.filter(p => p.cat === filter);
    if (reset) shown = PER_PAGE;
    const slice = filtered.slice(0, shown);

    if (reset) {
      grid.innerHTML = slice.map((p, i) => cardHTML(p, i)).join('');
    } else {
      const start = grid.children.length;
      grid.insertAdjacentHTML('beforeend', slice.slice(start).map((p, i) => cardHTML(p, start + i)).join(''));
    }

    countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'style' : 'styles'}`;
    loadMoreBtn.hidden = shown >= filtered.length;
  }

  buildFilters();
  render(true);

  filtersEl.addEventListener('click', e => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    filter = chip.dataset.filter;
    $$('.chip', filtersEl).forEach(c => {
      const on = c === chip;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    render(true);
  });

  loadMoreBtn.addEventListener('click', () => {
    shown += PER_PAGE;
    render(false);
  });

  grid.addEventListener('click', e => {
    const open = e.target.closest('[data-open]');
    if (open) { openLightbox(open.dataset.open); return; }
    const add = e.target.closest('[data-add]');
    if (add) { addToCart(add.dataset.add, add); }
  });

  /* ─────────────── Cart ─────────────── */
  const CART_KEY = 'shh.order.v1';
  let cart = [];

  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (Array.isArray(saved)) {
      cart = saved.filter(it => it && byId(it.id) && it.qty > 0).map(it => ({ id: it.id, qty: Math.min(20, it.qty | 0) }));
    }
  } catch (err) { cart = []; }

  const cartItemsEl = $('#cartItems');
  const drawerEmpty = $('#drawerEmpty');
  const orderForm = $('#orderForm');
  const countNav = $('#cartCountNav');
  const countBar = $('#cartCountBar');

  const cartQty = () => cart.reduce((n, it) => n + it.qty, 0);

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (err) { /* private mode */ }
  }

  function renderCart() {
    const total = cartQty();

    [countNav, countBar].forEach(el => {
      if (!el) return;
      el.textContent = total;
      el.classList.remove('is-bump');
      void el.offsetWidth;
      el.classList.add('is-bump');
    });

    cartItemsEl.innerHTML = cart.map(it => {
      const p = byId(it.id);
      return `
        <li class="citem" data-id="${p.id}">
          <div class="citem__img"><img src="assets/img/thumbs/${p.id}.jpg" alt="" loading="lazy"></div>
          <div>
            <p class="citem__name">${p.name}</p>
            <p class="citem__meta">${p.color}</p>
            <div class="citem__qty">
              <button type="button" data-step="-1" data-id="${p.id}" aria-label="One less ${p.name}">−</button>
              <span>${it.qty}</span>
              <button type="button" data-step="1" data-id="${p.id}" aria-label="One more ${p.name}">+</button>
            </div>
          </div>
          <button class="citem__remove" type="button" data-remove="${p.id}" aria-label="Remove ${p.name} from order">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </li>`;
    }).join('');

    drawerEmpty.hidden = cart.length > 0;
    orderForm.classList.toggle('is-active', cart.length > 0);
    saveCart();
  }

  function addToCart(id, btn) {
    const p = byId(id);
    if (!p) return;
    const found = cart.find(it => it.id === id);
    if (found) found.qty = Math.min(20, found.qty + 1);
    else cart.push({ id, qty: 1 });

    renderCart();
    toast(`${p.name} · ${p.color} added to your order`);

    if (btn) {
      btn.classList.add('is-added');
      setTimeout(() => btn.classList.remove('is-added'), 1100);
    }
  }

  cartItemsEl.addEventListener('click', e => {
    const step = e.target.closest('[data-step]');
    if (step) {
      const it = cart.find(i => i.id === step.dataset.id);
      if (!it) return;
      it.qty += parseInt(step.dataset.step, 10);
      if (it.qty <= 0) cart = cart.filter(i => i.id !== it.id);
      renderCart();
      return;
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      cart = cart.filter(i => i.id !== rm.dataset.remove);
      renderCart();
    }
  });

  renderCart();

  /* ─────────────── Drawer ─────────────── */
  const drawer = $('#drawer');
  const scrim = $('#scrim');
  let lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.removeAttribute('inert');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    scrim.classList.add('is-open');
    document.body.classList.add('no-scroll');
    setTimeout(() => {
      const first = cart.length ? $('.citem__qty button', drawer) : $('#drawerEmpty .btn', drawer);
      (first || $('[data-drawer-close]', drawer)).focus();
    }, 120);
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('inert', '');
    scrim.classList.remove('is-open');
    if (!document.body.classList.contains('menu-open') && !$('#lightbox').classList.contains('is-open')) {
      document.body.classList.remove('no-scroll');
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $$('[data-drawer-open]').forEach(b => b.addEventListener('click', openDrawer));
  $$('[data-drawer-close]').forEach(b => b.addEventListener('click', closeDrawer));
  scrim.addEventListener('click', closeDrawer);

  /* ─────────────── Order form ─────────────── */
  const orderFormEl = $('#orderForm');

  orderFormEl.addEventListener('submit', e => {
    e.preventDefault();
    if (!cart.length) return;

    const nameEl = $('#ofName');
    const phoneEl = $('#ofPhone');
    const noteEl = $('#ofNote');
    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const digits = phone.replace(/\D/g, '');

    nameEl.parentElement.classList.toggle('has-error', name.length < 2);
    phoneEl.parentElement.classList.toggle('has-error', digits.length < 7);

    if (name.length < 2) { nameEl.focus(); toast('Add your name so the shop knows who is asking'); return; }
    if (digits.length < 7) { phoneEl.focus(); toast('Add a phone number so the shop can reply'); return; }

    const lines = cart.map((it, i) => {
      const p = byId(it.id);
      return `${i + 1}. ${p.name} — ${p.color} · ${p.type} × ${it.qty}`;
    });

    const message = [
      'Hi Style Haven Hub! I would like to order:',
      '',
      ...lines,
      '',
      `Name: ${name}`,
      `Phone: ${phone}`,
      noteEl.value.trim() ? `Notes: ${noteEl.value.trim()}` : null,
      '',
      `Sent from the website · ${new Date().toLocaleDateString('en-GB')}`
    ].filter(line => line !== null).join('\n');

    const url = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast('Opening WhatsApp with your order…');
    setTimeout(closeDrawer, 700);
  });

  $$('#ofName, #ofPhone').forEach(input => {
    input.addEventListener('input', () => input.parentElement.classList.remove('has-error'));
  });

  /* ─────────────── Lightbox ─────────────── */
  const lightbox = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbName = $('#lbName');
  const lbColor = $('#lbColor');
  const lbCat = $('#lbCat');
  const lbIndex = $('#lbIndex');
  const lbTotal = $('#lbTotal');
  const lbAdd = $('#lbAdd');
  const lbAsk = $('.lb__actions .btn--ghost');
  const lbPrev = $('#lbPrev');
  const lbNext = $('#lbNext');
  const lbNote = $('.lb__note');
  const lbNoteText = lbNote ? lbNote.textContent : '';
  let lbList = PRODUCTS.slice();
  let lbIdx = 0;

  function paintLightbox() {
    const p = lbList[lbIdx];
    if (!p) return;
    const isLook = !!p.isLook;
    const single = lbList.length < 2;
    lbImg.src = `assets/img/${p.id}.jpg`;
    lbImg.alt = isLook
      ? `${p.name} — Style Haven Hub, Kathmandu`
      : `${p.name}, ${p.color} ${p.type.toLowerCase()} — Style Haven Hub, Kathmandu`;
    lbName.textContent = p.name;
    lbColor.textContent = isLook ? 'Shot at Style Haven Hub' : `${p.color} · ${p.type}`;
    lbCat.textContent = isLook ? p.color : CATS[p.cat];
    lbIndex.textContent = pad(lbIdx + 1);
    lbTotal.textContent = pad(lbList.length);
    lbAdd.dataset.id = p.id;
    lbAdd.hidden = isLook;
    lbPrev.hidden = single;
    lbNext.hidden = single;
    lbAsk.href = isLook
      ? `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(`Hi Style Haven Hub, I saw the "${p.name}" photo on your website. Can you tell me what is in store today?`)}`
      : `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(`Hi Style Haven Hub, I'd like to ask about the ${p.name} in ${p.color}. Is it available?`)}`;
    if (lbNote) {
      lbNote.textContent = isLook
        ? 'A real corner of the shop in Kathmandu. Ask on WhatsApp what is on the shelves today.'
        : lbNoteText;
    }
  }

  function openLightbox(id) {
    const pool = filtered.length ? filtered : PRODUCTS;
    const poolIdx = pool.findIndex(p => p.id === id);
    if (poolIdx >= 0) {
      lbList = pool;
      lbIdx = poolIdx;
    } else {
      const allIdx = PRODUCTS.findIndex(p => p.id === id);
      if (allIdx >= 0) {
        lbList = PRODUCTS;
        lbIdx = allIdx;
      } else {
        const look = LOOKBOOK.find(l => l.id === id);
        if (!look) return;
        lbList = [{ id: look.id, name: look.title, color: look.tag, type: '', cat: null, isLook: true }];
        lbIdx = 0;
      }
    }
    paintLightbox();
    lastFocus = document.activeElement;
    lightbox.removeAttribute('inert');
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setTimeout(() => $('.lightbox__close').focus(), 120);
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.setAttribute('inert', '');
    if (!drawer.classList.contains('is-open') && !document.body.classList.contains('menu-open')) {
      document.body.classList.remove('no-scroll');
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function stepLightbox(dir) {
    if (!lbList.length) return;
    lbIdx = (lbIdx + dir + lbList.length) % lbList.length;
    lbImg.style.opacity = '0';
    setTimeout(() => {
      paintLightbox();
      lbImg.style.opacity = '';
    }, reduceMotion ? 0 : 160);
  }

  $$('[data-lb-close]').forEach(b => b.addEventListener('click', closeLightbox));
  $('#lbPrev').addEventListener('click', () => stepLightbox(-1));
  $('#lbNext').addEventListener('click', () => stepLightbox(1));
  lbAdd.addEventListener('click', () => {
    addToCart(lbAdd.dataset.id, null);
  });

  /* swipe on the lightbox image */
  (function swipe() {
    const stage = $('.lightbox__figure');
    let sx = 0, sy = 0, active = false;
    stage.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; active = true; });
    stage.addEventListener('pointerup', e => {
      if (!active) return;
      active = false;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) stepLightbox(dx < 0 ? 1 : -1);
    });
    stage.addEventListener('pointercancel', () => { active = false; });
  })();

  /* ─────────────── Keyboard ─────────────── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (lightbox.classList.contains('is-open')) closeLightbox();
      else if (drawer.classList.contains('is-open')) closeDrawer();
      else if (document.body.classList.contains('menu-open')) $('#burger').click();
      return;
    }
    if (lightbox.classList.contains('is-open')) {
      if (e.key === 'Tab') trapFocus(lightbox, e);
      else if (e.key === 'ArrowRight') stepLightbox(1);
      else if (e.key === 'ArrowLeft') stepLightbox(-1);
      return;
    }
    if (drawer.classList.contains('is-open') && e.key === 'Tab') {
      trapFocus(drawer, e);
    }
  });

  function trapFocus(container, e) {
    const items = $$('a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])', container)
      .filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ─────────────── Lookbook rail ─────────────── */
  (function rail() {
    const track = $('#railTrack');
    const railEl = $('#rail');
    if (!track || !railEl) return;

    track.innerHTML = LOOKBOOK.map((l, i) => {
      const p = byId(l.id);
      return `
        <article class="look${l.wide ? ' look--wide' : ''}" style="--i:${i}">
          <button class="look__media" type="button" data-look="${l.id}" aria-label="View ${l.title}">
            <img src="assets/img/thumbs/${l.id}.jpg" alt="${l.title} — Style Haven Hub, Kathmandu" loading="lazy" decoding="async">
            <span class="look__cap"><em>${pad(i + 1)}</em><span>${l.title}</span></span>
          </button>
        </article>`;
    }).join('');

    /* drag to scroll */
    let down = false, moved = false, startX = 0, startScroll = 0, pid = null;

    railEl.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = true; moved = false;
      startX = e.clientX;
      startScroll = railEl.scrollLeft;
      pid = e.pointerId;
    });

    railEl.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) {
        moved = true;
        railEl.classList.add('is-dragging');
        railEl.scrollLeft = startScroll - dx;
        if (pid !== null && railEl.setPointerCapture && !railEl.hasPointerCapture(pid)) {
          try { railEl.setPointerCapture(pid); } catch (err) { /* noop */ }
        }
      }
    });

    const end = () => {
      down = false;
      railEl.classList.remove('is-dragging');
      if (moved) {
        setTimeout(() => { moved = false; }, 60);
      }
    };
    railEl.addEventListener('pointerup', end);
    railEl.addEventListener('pointercancel', end);
    railEl.addEventListener('pointerleave', () => { if (down) end(); });

    railEl.addEventListener('click', e => {
      if (moved) { e.preventDefault(); e.stopPropagation(); return; }
      const btn = e.target.closest('[data-look]');
      if (btn) openLightbox(btn.dataset.look);
    }, true);

    /* progress + arrows */
    const prog = $('#railProgress');
    const update = () => {
      const max = railEl.scrollWidth - railEl.clientWidth;
      const p = max > 0 ? railEl.scrollLeft / max : 0;
      prog.style.left = (p * 80) + '%';
      prog.style.width = max > 0 ? '20%' : '100%';
    };
    railEl.addEventListener('scroll', update, { passive: true });
    update();

    const amount = () => Math.min(railEl.clientWidth * 0.75, 560);
    $('#railNext').addEventListener('click', () => railEl.scrollBy({ left: amount(), behavior: 'smooth' }));
    $('#railPrev').addEventListener('click', () => railEl.scrollBy({ left: -amount(), behavior: 'smooth' }));
  })();

  /* ─────────────── Back to top + year ─────────────── */
  const toTop = $('#toTop');
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
