const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/UASUQAYNUK';

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => Math.round(n).toLocaleString('ru-RU');

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* header */
  const header = $('#header'), burger = $('#burger'), nav = $('#nav');
  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open'); nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  /* hero title by words */
  const title = $('[data-split]');
  if (title) {
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', words.join(' '));
    title.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  }

  /* phone mask */
  $$('input[type="tel"]').forEach(input => {
    input.addEventListener('input', e => {
      const raw = e.target.value;
      if (/[a-zA-Zа-яА-Я@]/.test(raw)) return;
      let v = raw.replace(/\D/g, '');
      if (!v) { e.target.value = ''; return; }
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) out += ' (' + v.slice(1, 4);
      if (v.length >= 4) out += ') ' + v.slice(4, 7);
      if (v.length >= 7) out += '-' + v.slice(7, 9);
      if (v.length >= 9) out += '-' + v.slice(9, 11);
      e.target.value = out;
    });
  });

  /* smooth anchors */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    const t = $(href);
    if (!t) return;
    e.preventDefault();
    const top = t.getBoundingClientRect().top + window.scrollY - 56;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* reveal */
  const revealEls = $$('[data-reveal]');
  const parents = new Map();
  revealEls.forEach(el => {
    const p = el.parentElement, n = parents.get(p) || 0;
    el.style.setProperty('--d', Math.min(n, 5) * 80 + 'ms');
    parents.set(p, n + 1);
  });
  const countUp = el => {
    const target = parseInt(el.dataset.target, 10);
    if (reduce || Number.isNaN(target)) return;
    const dur = 1400, t0 = performance.now();
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const drawMarks = el => $$('[data-pen],[data-hl]', el).forEach((m, i) => setTimeout(() => m.classList.add('is-drawn'), 450 + i * 250));

  /* ---------- call wave in scene ---------- */
  const callWave = $('#callWave');
  const bars = [];
  if (callWave) {
    for (let i = 0; i < 56; i++) { const b = document.createElement('i'); callWave.appendChild(b); bars.push(b); }
  }
  let waveT = 0;
  const animWave = () => {
    waveT += 0.045;
    bars.forEach((b, i) => {
      const v = Math.abs(Math.sin(i * 0.5 + waveT * 1.6) * Math.sin(i * 0.17 - waveT * .7)) ;
      b.style.height = Math.max(8, v * 100) + '%';
    });
  };
  if (!reduce) setInterval(() => { if (callActive) animWave(); }, 90); else animWave();
  let callActive = false;

  /* ---------- scene (pinned) ---------- */
  const track = $('#howTrack');
  const panes = $$('.pane'), steps = $$('#howSteps li'), marks = $$('[data-mark]');
  const desktop = () => window.matchMedia('(min-width: 900px)').matches;
  let phase = -1;
  const MARK_AT = [0.035, 0.085, 0.135];
  function updateScene() {
    if (!track) return;
    const r = track.getBoundingClientRect(), vh = window.innerHeight;
    callActive = r.top < vh && r.bottom > 0;
    if (!desktop()) {
      if (callActive) marks.forEach(m => m.classList.add('is-drawn'));
      return;
    }
    const p = Math.max(0, Math.min(1, -r.top / (r.height - vh)));
    marks.forEach((m, i) => m.classList.toggle('is-drawn', p > MARK_AT[i]));
    const ph = Math.min(3, Math.floor(p * 4));
    if (ph !== phase) {
      phase = ph;
      panes.forEach((el, i) => el.classList.toggle('is-on', i === ph));
      steps.forEach((el, i) => el.classList.toggle('is-on', i === ph));
    }
  }
  // bars for "internalize" pane
  $$('.bars').forEach(el => {
    el.dataset.bars.split(',').forEach((v, k) => {
      const b = document.createElement('b');
      b.style.height = (v * 10) + '%'; b.style.setProperty('--k', k);
      el.appendChild(b);
    });
  });

  /* ---------- scroll loop ---------- */
  let ticking = false;
  const check = () => {
    ticking = false;
    const vh = window.innerHeight;
    header?.classList.toggle('scrolled', window.scrollY > 8);
    revealEls.forEach(el => {
      if (el.classList.contains('is-in')) return;
      if (el.getBoundingClientRect().top < vh * 0.94) {
        el.classList.add('is-in');
        $$('[data-target]', el).forEach(countUp);
        if (el.classList.contains('sheet')) drawMarks(el);
      }
    });
    updateScene();
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  window.addEventListener('load', req);
  req(); setTimeout(req, 400);
  document.documentElement.style.setProperty('--vh', window.innerHeight + 'px');

  /* magnetic button */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .12}px, ${(e.clientY - r.top - r.height / 2) * .25}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- 316 map ---------- */
  const INDUSTRIES = [
    ['Клиника', 'администраторов записи'],
    ['Производство и опт', 'менеджеров по входящим и повторным заказам'],
    ['Мебель, стройка, недвижимость', 'менеджеров по заявкам с рекламы'],
    ['Юристы и консалтинг', 'специалистов по первичным консультациям'],
    ['Онлайн-образование', 'менеджеров по продаже обучения'],
    ['Доставка воды и повторные заказы', 'операторов и менеджеров по клиентской базе'],
    ['Контакт-центр, авто и сервис', 'операторов контакт-центра и приёмщиков'],
    ['Другая сфера', 'сотрудников, от чьих разговоров зависит выручка']
  ];
  const TASKS = {
    'Поднять конверсию': ['Выявление потребности до называния цены', 'Отработка возражения «дорого» по примерам ваших лучших звонков', 'Договорённость о следующем шаге в конце каждого разговора'],
    'Контролировать звонки': ['Оценка всех звонков вместо выборки', 'Уведомление руководителю о потере клиента в день звонка', 'Рейтинг сотрудников по критериям, которые выбрали вы'],
    'Внедрить изменения': ['Разбор ошибок в Telegram сразу после звонка', 'Контроль применения рекомендаций по неделям', 'Скрипты с живыми примерами из ваших разговоров'],
    'Навести порядок в CRM': ['Автозаполнение карточки сделки по разговору', 'Причины отказов из звонков, а не из ручных пометок', 'Задача менеджеру по итогам звонка'],
    'Допродажи и повторные': ['Сигнал о допродаже прямо в разговоре', 'Возврат заинтересованных, которым не перезвонили', 'Напоминание о повторной покупке'],
    'Качество лидов': ['Оценка качества лидов по источникам', 'Причины отказов по рекламным каналам', 'Сигнал маркетингу, когда лиды стали хуже']
  };
  const optInd = $('#optInd'), optTask = $('#optTask'), grid = $('#grid316');
  if (optInd && grid) {
    const mk = (box, name, items, checkedIdx) => items.forEach((label, i) => {
      const l = document.createElement('label'); l.className = 'opt';
      l.innerHTML = `<input type="radio" name="${name}" value="${i}" ${i === checkedIdx ? 'checked' : ''}><span></span>`;
      l.querySelector('span').textContent = label; box.appendChild(l);
    });
    mk(optInd, 'ind', INDUSTRIES.map(x => x[0]), 0);
    const taskNames = Object.keys(TASKS);
    mk(optTask, 'task', taskNames, 0);
    const cells = [];
    for (let i = 0; i < 316; i++) { const c = document.createElement('i'); grid.appendChild(c); cells.push(c); }
    const rnd = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const out = $('#mapOut'), list = $('#mapList'), ctx = $('#mapCtx'), pickedField = $('#pickedField');
    let swapT;
    const render = anim => {
      const ii = +($('input[name="ind"]:checked') || {}).value || 0;
      const ti = +($('input[name="task"]:checked') || {}).value || 0;
      const r = rnd((ii + 1) * 7919 + (ti + 1) * 104729);
      const n = 36 + Math.floor(r() * 36);
      const on = new Set();
      while (on.size < n) on.add(Math.floor(r() * 316));
      const hot = [...on].slice(0, 3);
      cells.forEach((c, i) => {
        c.style.setProperty('--td', anim && !reduce ? Math.floor(r() * 400) + 'ms' : '0ms');
        c.classList.toggle('on', on.has(i));
        c.classList.toggle('y', hot.includes(i));
      });
      const apply = () => {
        list.innerHTML = '';
        TASKS[taskNames[ti]].forEach(t => { const li = document.createElement('li'); li.textContent = t; list.appendChild(li); });
        ctx.textContent = 'Для вашей сферы начнём с ' + INDUSTRIES[ii][1] + ' и подберём остальное под ваши данные.';
        out.classList.remove('is-swap');
      };
      if (anim && !reduce) { out.classList.add('is-swap'); clearTimeout(swapT); swapT = setTimeout(apply, 220); } else apply();
      if (pickedField) pickedField.value = 'Сфера: ' + INDUSTRIES[ii][0] + '; задача: ' + taskNames[ti];
    };
    $$('.picker input').forEach(i => i.addEventListener('change', () => render(true)));
    render(false);
  }

  /* ---------- price calc ---------- */
  const cm = $('#calcMin'), cc = $('#calcChk');
  if (cm) {
    const upd = () => {
      const m = +cm.value, chk = Math.max(1000, +cc.value || 50000);
      $('#calcMinOut').textContent = fmt(m);
      const lo = 10000 + 5 * m, hi = 10000 + 6 * m;
      $('#calcLo').textContent = fmt(lo); $('#calcHi').textContent = fmt(hi);
      const be = Math.max(1, Math.ceil(hi / chk));
      $('#calcBe').innerHTML = `При среднем чеке ${fmt(chk)} ₽ сервис окупается от <b>${be}</b> дополнительн${be % 10 === 1 && be % 100 !== 11 ? 'ой сделки' : 'ых сделок'} в месяц.` + (m > 10000 ? ' Объём больше 10 000 минут: возможен бесплатный пилот.' : '');
    };
    cm.addEventListener('input', upd); cc.addEventListener('input', upd); upd();
  }

  /* ---------- form → Worker → Telegram ---------- */
  const form = $('#leadForm'), note = $('#formNote');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    const payload = {};
    new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.phone) { note.textContent = 'Укажите телефон или Telegram для связи'; return; }
    if (!form.consent.checked) { note.textContent = 'Нужно согласие на обработку данных'; return; }
    delete payload.consent;
    btn.disabled = true; btn.firstChild.textContent = 'Отправляем…'; note.textContent = '';
    try {
      const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.firstChild.textContent = 'Заявка отправлена';
      note.textContent = 'Спасибо! Специалист EvGrade Tech свяжется с вами и согласует время Zoom-разбора.';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.firstChild.textContent = 'Ошибка, попробуйте ещё раз';
      note.textContent = 'Не удалось отправить. Попробуйте ещё раз или загляните на evgrade.tech';
    } finally {
      setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 3500);
    }
  });
})();
