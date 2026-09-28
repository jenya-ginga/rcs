/* Приложение: карта курса, страница урока, тренажёр, прогресс */
(function (G) {
  'use strict';
  var R = G.RKS, fmt = R.fmt;
  var app = document.getElementById('app');
  var PK = 'rks4_progress_v1';
  var QNAMES = ['', 'I четверть', 'II четверть', 'III четверть', 'IV четверть'];
  var SEC_NAMES = { theory: 'Урок', oral: 'Устно', practice: 'Примеры', problems: 'Задачи', test: 'Проверочная' };
  var SEC_INFO = {
    oral: 'Разминка на скорость: считай в уме и записывай только ответ.',
    practice: 'Примеры по теме урока. Если ошибся — есть вторая попытка и подсказка.',
    problems: 'Прочитай задачу, продумай решение и впиши ответ. После ошибки покажу решение по действиям.',
    test: 'Один ответ на каждое задание, подсказок нет. Оценка и разбор — в конце.'
  };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ---------- прогресс ---------- */
  function prog() { return R.store.get(PK, {}); }
  function best(n, sec) { var p = prog(); return (p[n] && p[n][sec] != null) ? p[n][sec] : null; }
  function setBest(n, sec, pct) {
    var p = prog(); p[n] = p[n] || {};
    if (p[n][sec] == null || pct > p[n][sec]) p[n][sec] = pct;
    R.store.set(PK, p);
  }
  function gradeOf(pct) { return pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 50 ? 3 : 2; }
  function lessonPct(n) {
    var L = R.LESSONS[n]; if (!L) return null;
    var secs = L.test ? ['test'] : ['oral', 'practice', 'problems'], sum = 0;
    for (var i = 0; i < secs.length; i++) {
      var b = best(n, secs[i]);
      if (b == null) return null;
      sum += b;
    }
    return sum / secs.length;
  }
  function lessonGrade(n) { var p = lessonPct(n); return p == null ? null : gradeOf(p); }
  function titleOf(n) { return R.LESSONS[n] ? R.LESSONS[n].title : 'Урок ' + n; }
  function availList() { return Object.keys(R.LESSONS).map(Number).sort(function (a, b) { return a - b; }); }

  /* ---------- маршрутизация ---------- */
  function parse() {
    var p = location.hash.replace(/^#\/?/, '').split('/');
    if (p[0] === 'lesson' && p[1]) return { view: 'lesson', n: Number(p[1]), sec: p[2] || null };
    return { view: 'map' };
  }
  function go(h) { location.hash = h; }
  function render() {
    var r = parse();
    app.innerHTML = '';
    if (r.view === 'lesson') renderLesson(r.n, r.sec); else renderMap();
    window.scrollTo(0, 0);
  }

  /* ================= карта курса ================= */
  function renderMap() {
    document.title = 'Арифметика, 4 класс — тренажёр';
    var avail = availList();
    var done = avail.filter(function (n) { return lessonGrade(n) != null; }).length;
    var next = null;
    for (var i = 0; i < avail.length; i++) if (lessonGrade(avail[i]) == null) { next = avail[i]; break; }
    if (next == null) next = avail[0];

    var page = el('main', 'page');
    var hero = el('header', 'hero');
    hero.innerHTML =
      '<h1>Арифметика, 4 класс</h1>' +
      '<p class="lead">Тренажёр по арифметике: в каждом уроке короткая теория, устный счёт, примеры и задачи. Числа каждый раз новые, поэтому заниматься можно сколько угодно.</p>';
    var row = el('div', 'hero-row');
    var btn = el('a', 'btn primary big', 'Продолжить: урок ' + next);
    btn.href = '#/lesson/' + next;
    row.appendChild(btn);
    row.appendChild(el('p', 'hero-stat', 'Готово уроков: <b>' + done + '</b> из ' + avail.length + ' доступных · всего в курсе ' + R.TOTAL));
    hero.appendChild(row);
    page.appendChild(hero);
    page.appendChild(el('p', 'legend', 'На карте: красная рамка — проверочная работа, пунктир — самостоятельная. Открыты уроки ' + avail[0] + '–' + avail[avail.length - 1] + ', остальные появятся позже.'));

    var lastQ = 0;
    R.BLOCKS.forEach(function (b) {
      if (b.q !== lastQ) {
        lastQ = b.q;
        page.appendChild(el('h2', 'qhead', QNAMES[b.q]));
      }
      var has = false, n;
      for (n = b.from; n <= b.to; n++) if (R.LESSONS[n]) has = true;
      var sec = el('section', 'block' + (has ? ' open' : ''));
      var range = b.from === b.to ? 'урок ' + b.from : 'уроки ' + b.from + '–' + b.to;
      sec.appendChild(el('h3', null, b.title + ' <small>' + range + '</small>'));
      if (has) {
        var ol = el('ol', 'lessons');
        for (n = b.from; n <= b.to; n++) {
          var t = titleOf(n), k = R.KINDS[n], g = lessonGrade(n), li = el('li', 'li' + (R.LESSONS[n] ? ' avail' : ' soon'));
          var inner = '<span class="li-n">' + n + '</span><span class="li-t">' + t + '</span>' +
            (g ? '<span class="hand mark g' + g + '" title="Оценка за урок">' + g + '</span>' : (R.LESSONS[n] ? '' : '<span class="li-soon">скоро</span>'));
          if (R.LESSONS[n]) { var a = el('a', null, inner); a.href = '#/lesson/' + n; li.appendChild(a); }
          else li.innerHTML = inner;
          ol.appendChild(li);
        }
        sec.appendChild(ol);
      } else {
        var cells = el('div', 'cells');
        for (n = b.from; n <= b.to; n++) {
          var c = el('span', 'cell' + (R.KINDS[n] ? ' kind-' + R.KINDS[n] : ''), String(n));
          c.title = 'Урок ' + n + (R.KINDS[n] === 'k' ? ' · проверочная работа' : R.KINDS[n] === 's' ? ' · самостоятельная работа' : '');
          cells.appendChild(c);
        }
        sec.appendChild(cells);
      }
      page.appendChild(sec);
    });

    var foot = el('footer', 'foot');
    foot.innerHTML = '<p>Оценки и результаты хранятся только в этом браузере.</p>' +
      '<p>Независимый учебный проект: тексты и задания написаны заново. Порядок тем ориентирован на классическую программу арифметики 4 класса.</p>';
    var rst = el('button', 'linklike', 'Сбросить прогресс');
    rst.type = 'button';
    rst.addEventListener('click', function () {
      if (G.confirm('Удалить все оценки и результаты?')) { R.store.set(PK, {}); render(); }
    });
    foot.appendChild(rst);
    page.appendChild(foot);
    app.appendChild(page);
  }

  /* ================= страница урока ================= */
  function sectionsOf(n) {
    var L = R.LESSONS[n];
    return L.test ? ['test'] : ['theory', 'oral', 'practice', 'problems'];
  }

  function renderLesson(n, sec) {
    var L = R.LESSONS[n], title = titleOf(n);
    document.title = 'Урок ' + n + ' — Арифметика, 4 класс';
    var page = el('main', 'page');
    var back = el('a', 'back', '← Карта курса'); back.href = '#/';
    page.appendChild(back);

    if (!L) {
      var s0 = el('article', 'sheet');
      s0.innerHTML = '<header class="lh"><p class="lno">Урок ' + n + '</p><h1>' + (n >= 1 && n <= R.TOTAL ? title : 'Такого урока нет') + '</h1></header>' +
        '<p class="soon-note">Этот урок ещё в подготовке. Сейчас доступны уроки ' + availList()[0] + '–' + availList()[availList().length - 1] + '.</p>';
      page.appendChild(s0); app.appendChild(page); return;
    }

    var secs = sectionsOf(n);
    if (!sec || secs.indexOf(sec) < 0) sec = secs[0];

    var sheet = el('article', 'sheet');
    var g = lessonGrade(n);
    var head = el('header', 'lh');
    head.innerHTML = '<p class="lno">Урок ' + n + (R.KINDS[n] === 'k' ? ' · проверочная работа' : '') + '</p><h1>' + title + '</h1>' +
      '<p class="goal">' + L.goal + '</p>' +
      (g ? '<div class="margin-grade hand g' + g + '" title="Оценка за урок">' + g + '</div>' : '');
    sheet.appendChild(head);

    if (secs.length > 1) {
      var tabs = el('nav', 'tabs'); tabs.setAttribute('aria-label', 'Части урока');
      secs.forEach(function (s) {
        var b = best(n, s), mark = '';
        if (s === 'theory') { if (b != null) mark = '<span class="tick" aria-label="прочитано">✓</span>'; }
        else if (b != null) mark = '<span class="hand tmark g' + gradeOf(b) + '">' + gradeOf(b) + '</span>';
        var a = el('a', 'tab' + (s === sec ? ' on' : ''), SEC_NAMES[s] + mark);
        a.href = '#/lesson/' + n + '/' + s;
        if (s === sec) a.setAttribute('aria-current', 'page');
        tabs.appendChild(a);
      });
      sheet.appendChild(tabs);
    }

    var panel = el('div', 'panel');
    sheet.appendChild(panel);
    if (sec === 'theory') renderTheory(panel, n, L, secs);
    else renderTrainerIntro(panel, n, sec, L, secs);

    /* соседние уроки */
    var nav = el('nav', 'lnav');
    var prevN = R.LESSONS[n - 1] ? n - 1 : null, nextN = R.LESSONS[n + 1] ? n + 1 : null;
    if (prevN) { var pa = el('a', null, '← Урок ' + prevN); pa.href = '#/lesson/' + prevN; nav.appendChild(pa); } else nav.appendChild(el('span'));
    if (nextN) { var na = el('a', null, 'Урок ' + nextN + ' →'); na.href = '#/lesson/' + nextN; nav.appendChild(na); }
    sheet.appendChild(nav);

    page.appendChild(sheet);
    app.appendChild(page);
    R.mountWidgets(page);
  }

  function nextSection(secs, sec) { var i = secs.indexOf(sec); return secs[i + 1] || null; }

  function renderTheory(panel, n, L, secs) {
    L.theory.forEach(function (t) {
      var s = el('section', 'tblock');
      s.innerHTML = '<h2>' + t.h + '</h2>' + t.html;
      panel.appendChild(s);
    });
    var done = el('div', 'panel-foot');
    var b = el('a', 'btn primary', 'Понятно, к устному счёту');
    b.href = '#/lesson/' + n + '/oral';
    b.addEventListener('click', function () { setBest(n, 'theory', 100); });
    done.appendChild(b);
    panel.appendChild(done);
  }

  function specOf(L, sec) {
    return sec === 'oral' ? L.oral : sec === 'practice' ? L.practice : sec === 'problems' ? L.problems : L.testSpec;
  }

  function renderTrainerIntro(panel, n, sec, L, secs) {
    var spec = specOf(L, sec), total = 0;
    spec.forEach(function (s) { total += s.n || 1; });
    var wrap = el('div', 'trainer');
    var b = best(n, sec);
    var intro = el('div', 'intro');
    intro.innerHTML = '<p>' + SEC_INFO[sec] + '</p><p class="meta">Заданий: <b>' + total + '</b>' +
      (b != null ? ' · лучший результат: <b>' + Math.round(b) + '%</b> (оценка ' + gradeOf(b) + ')' : '') + '</p>';
    var start = el('button', 'btn primary big', b != null ? 'Пройти ещё раз' : 'Начать');
    start.type = 'button';
    intro.appendChild(start);
    wrap.appendChild(intro);
    panel.appendChild(wrap);
    start.addEventListener('click', function () {
      runSet(wrap, { n: n, sec: sec, spec: spec, test: sec === 'test', shuffle: sec === 'oral', secs: secs });
    });
  }

  /* ================= тренажёр ================= */
  function ansText(q) {
    if (q.kind === 'choice') return q.options[q.answer];
    if (q.kind === 'nums') return q.answer.map(function (a, i) { return '<b>' + fmt(a) + '</b> ' + q.fields[i].label; }).join(', ');
    return '<b>' + fmt(q.answer) + '</b>';
  }
  function userText(q, u) {
    if (u == null) return '—';
    if (q.kind === 'choice') return u >= 0 ? q.options[u] : '—';
    if (q.kind === 'nums') return u.map(function (a, i) { return (isNaN(a) ? '—' : fmt(a)) + ' ' + q.fields[i].label; }).join(', ');
    return isNaN(u) ? '—' : fmt(u);
  }
  function isCorrect(q, u) {
    if (q.kind === 'nums') {
      if (!u) return false;
      for (var i = 0; i < q.answer.length; i++) if (u[i] !== q.answer[i]) return false;
      return true;
    }
    return u === q.answer;
  }

  function attachGrouping(inp) { R.groupInput(inp, 14); }

  function runSet(host, cfg) {
    var qs = R.build(cfg.spec, cfg.shuffle), idx = 0, log = [];
    var test = cfg.test;

    function show() {
      var q = qs[idx];
      host.innerHTML = '';
      var top = el('div', 'qtop');
      top.innerHTML = '<span class="qcount">Задание ' + (idx + 1) + ' из ' + qs.length + '</span>' +
        '<span class="bar"><i style="width:' + Math.round(idx / qs.length * 100) + '%"></i></span>';
      host.appendChild(top);

      var card = el('div', 'qcard');
      card.appendChild(el('div', 'qtext', q.html));
      var area = el('div', 'qarea');
      card.appendChild(area);
      var fb = el('div', 'fb'); fb.setAttribute('aria-live', 'polite');
      card.appendChild(fb);
      var btns = el('div', 'qbtns');
      var check = el('button', 'btn primary', test ? 'Ответить' : 'Проверить'); check.type = 'button';
      var hintB = el('button', 'btn ghost', 'Подсказка'); hintB.type = 'button';
      var nextB = el('button', 'btn primary', idx === qs.length - 1 ? 'Результат' : 'Дальше'); nextB.type = 'button';
      nextB.style.display = 'none';
      btns.appendChild(check);
      if (!test) btns.appendChild(hintB);
      btns.appendChild(nextB);
      card.appendChild(btns);
      host.appendChild(card);

      var inputs = [], sel = -1, abVal = 0, attempts = 0, settled = false;

      /* поля ответа */
      if (q.kind === 'num') {
        var i1 = el('input', 'ans'); i1.type = 'text'; i1.inputMode = 'numeric'; i1.autocomplete = 'off';
        i1.setAttribute('aria-label', 'Ответ'); i1.placeholder = 'ответ';
        attachGrouping(i1); area.appendChild(i1); inputs.push(i1);
      } else if (q.kind === 'nums') {
        q.fields.forEach(function (f) {
          var lab = el('label', 'fld');
          var inp = el('input', 'ans'); inp.type = 'text'; inp.inputMode = 'numeric'; inp.autocomplete = 'off';
          attachGrouping(inp);
          lab.appendChild(inp); lab.appendChild(el('span', 'fld-l', f.label));
          area.appendChild(lab); inputs.push(inp);
        });
      } else if (q.kind === 'choice') {
        var list = el('div', 'choices' + (q.options[0].length <= 2 ? ' short' : ''));
        q.options.forEach(function (o, k) {
          var b = el('button', 'choice', o); b.type = 'button';
          b.addEventListener('click', function () {
            if (settled) return;
            sel = k;
            Array.prototype.forEach.call(list.children, function (c, j) { c.classList.toggle('on', j === k); });
          });
          list.appendChild(b);
        });
        area.appendChild(list);
      } else if (q.kind === 'abacus') {
        new R.Abacus(area, { wires: q.wires, mode: 'set', onChange: function (v) { abVal = v; } });
      }

      function readAnswer() {
        if (q.kind === 'num') return R.parseNum(inputs[0].value);
        if (q.kind === 'nums') return inputs.map(function (i) { return R.parseNum(i.value); });
        if (q.kind === 'choice') return sel;
        return abVal;
      }
      function incomplete(u) {
        if (q.kind === 'num') return isNaN(u);
        if (q.kind === 'nums') return u.some(isNaN);
        if (q.kind === 'choice') return u < 0;
        return false;
      }
      function lock() {
        settled = true;
        inputs.forEach(function (i) { i.readOnly = true; });
        Array.prototype.forEach.call(area.querySelectorAll('.choice'), function (c) { c.disabled = true; });
        check.style.display = 'none'; hintB.style.display = 'none';
      }
      function finishQ(score, u) {
        log.push({ q: q, u: u, score: score });
        if (test) { idx++; if (idx < qs.length) show(); else finish(); return; }
        lock();
        nextB.style.display = '';
        nextB.focus();
      }

      check.addEventListener('click', function () {
        if (settled) return;
        var u = readAnswer();
        if (incomplete(u)) {
          fb.className = 'fb warn';
          fb.textContent = q.kind === 'choice' ? 'Выбери один из вариантов.' : 'Впиши ответ цифрами во все поля.';
          return;
        }
        attempts++;
        var ok = isCorrect(q, u);
        if (test) { finishQ(ok ? 1 : 0, u); return; }
        if (ok) {
          fb.className = 'fb ok';
          fb.innerHTML = '<span class="hand tickmark">✓</span> Верно!' + (attempts === 2 ? ' Со второй попытки.' : '');
          finishQ(attempts === 1 ? 1 : 0.5, u);
        } else if (attempts < 2) {
          fb.className = 'fb bad';
          fb.innerHTML = 'Пока не так. Подумай ещё и попробуй снова — можно взять подсказку.';
          if (q.kind === 'num' || q.kind === 'nums') { inputs[0].focus(); inputs[0].select(); }
        } else {
          fb.className = 'fb bad';
          fb.innerHTML = '<p>Верный ответ: ' + ansText(q) + '.</p><p class="why">' + q.explain + '</p>';
          if (q.kind === 'choice') {
            Array.prototype.forEach.call(area.querySelectorAll('.choice'), function (c, j) { c.classList.toggle('right', j === q.answer); });
          }
          finishQ(0, u);
        }
      });
      hintB.addEventListener('click', function () {
        if (settled) return;
        var h = fb.querySelector('.hint');
        if (!h) { h = el('p', 'hint'); fb.appendChild(h); }
        h.innerHTML = '<b>Подсказка.</b> ' + q.hint;
        if (!fb.className) fb.className = 'fb';
      });
      nextB.addEventListener('click', function () {
        idx++;
        if (idx < qs.length) show(); else finish();
      });
      card.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' || e.target.tagName === 'BUTTON') return;
        e.preventDefault();
        var pos = inputs.indexOf(e.target);
        if (pos >= 0 && pos < inputs.length - 1) { inputs[pos + 1].focus(); return; }
        if (settled) nextB.click(); else check.click();
      });
      if (inputs[0]) inputs[0].focus();
    }

    function finish() {
      var sum = 0; log.forEach(function (l) { sum += l.score; });
      var pct = sum / log.length * 100, gr = gradeOf(pct);
      setBest(cfg.n, cfg.sec, pct);
      host.innerHTML = '';
      var res = el('div', 'result');
      var note = gr === 5 ? 'Отлично! Так держать.' : gr === 4 ? 'Хорошо. Ещё чуть-чуть до пятёрки.' : gr === 3 ? 'Неплохо, но стоит повторить теорию и пройти ещё раз.' : 'Пока рано двигаться дальше. Перечитай урок и попробуй снова — числа будут новые.';
      res.innerHTML = '<div class="grade-big hand g' + gr + '">' + gr + '</div>' +
        '<div class="res-txt"><h2>' + SEC_NAMES[cfg.sec] + ': ' + Math.round(pct) + '%</h2>' +
        '<p>' + note + '</p><p class="meta">Верно: ' + log.filter(function (l) { return l.score === 1; }).length + ' с первой попытки' +
        (log.some(function (l) { return l.score === 0.5; }) ? ', ' + log.filter(function (l) { return l.score === 0.5; }).length + ' со второй' : '') +
        ', ошибок: ' + log.filter(function (l) { return l.score === 0; }).length + '.</p></div>';
      host.appendChild(res);

      var wrong = log.filter(function (l) { return l.score < 1; });
      if (test && wrong.length) {
        var rv = el('div', 'review');
        rv.appendChild(el('h3', null, 'Работа над ошибками'));
        wrong.forEach(function (l) {
          var it = el('div', 'rv-item');
          it.innerHTML = '<div class="qtext">' + l.q.html + '</div>' +
            '<p class="rv-u">Твой ответ: ' + userText(l.q, l.u) + '</p>' +
            '<p class="rv-r">Верно: ' + ansText(l.q) + '</p><p class="why">' + l.q.explain + '</p>';
          rv.appendChild(it);
        });
        host.appendChild(rv);
      }

      var acts = el('div', 'qbtns');
      var again = el('button', 'btn ghost', 'Ещё раз с новыми числами'); again.type = 'button';
      again.addEventListener('click', function () { runSet(host, cfg); });
      acts.appendChild(again);
      var nx = nextSection(cfg.secs, cfg.sec);
      if (nx) {
        var na = el('a', 'btn primary', 'Дальше: ' + SEC_NAMES[nx].toLowerCase());
        na.href = '#/lesson/' + cfg.n + '/' + nx;
        acts.appendChild(na);
      } else {
        var nl = R.LESSONS[cfg.n + 1] ? cfg.n + 1 : null;
        var fa = el('a', 'btn primary', nl ? 'К уроку ' + nl : 'К карте курса');
        fa.href = nl ? '#/lesson/' + nl : '#/';
        acts.appendChild(fa);
      }
      host.appendChild(acts);
    }

    show();
  }

  G.addEventListener('hashchange', render);
  render();
})(window);
