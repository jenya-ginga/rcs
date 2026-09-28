/* Интерактивные виджеты для теории и заданий */
(function (G) {
  'use strict';
  var R = G.RKS, RK = R.RANKS, fmt = R.fmt, pw = R.pow10;
  var SHORT = { 1: 'ед.', 2: 'дес.', 3: 'сот.' };
  var ORD = [null, 'первый', 'второй', 'третий', 'четвёртый'];

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ---------- разрядная таблица ---------- */
  R.tableHTML = function (n, o) {
    o = o || {};
    var s = (n === '' || n == null) ? '' : String(n), d = s.length;
    var cl = Math.max(o.classes || 2, Math.ceil(d / 3), 1);
    var h1 = '', h2 = '', h3 = '', row = '', c, k;
    for (c = cl; c >= 1; c--) {
      h1 += '<th colspan="3" class="cls">' + R.CLASSES[c].name + '<small>' + ORD[c] + ' класс</small></th>';
      for (k = 3; k >= 1; k--) {
        var r = (c - 1) * 3 + k, ch = (r <= d) ? s.charAt(d - r) : '';
        h2 += '<th>' + SHORT[k] + '</th>';
        h3 += '<td class="rk">' + r + '</td>';
        row += '<td class="dg' + (ch === '0' ? ' zero' : '') + (o.hl === r ? ' hl' : '') + (k === 1 && c > 1 ? ' edge' : '') + '">' + ch + '</td>';
      }
    }
    return '<div class="tbl-wrap"><table class="ptable"><thead><tr>' + h1 + '</tr><tr>' + h2 +
      '</tr></thead><tbody><tr class="rkrow">' + h3 + '</tr><tr class="digrow">' + row + '</tr></tbody></table></div>';
  };

  /* ---------- счёты ---------- */
  R.Abacus = function (host, o) {
    o = o || {};
    var wires = o.wires || 6, mode = o.mode || 'set';
    var counts = [], i;
    for (i = 0; i < wires; i++) counts.push(0);
    var root = el('div', 'abacus-box');
    var frame = el('div', 'abacus');
    var read = el('div', 'abacus-read');
    var msg = el('div', 'abacus-msg');
    var tools = el('div', 'abacus-tools');
    var self = this;

    function value() {
      var v = 0;
      for (var j = 0; j < wires; j++) v += counts[j] * pw(j);
      return v;
    }
    function draw() {
      frame.innerHTML = '';
      for (var r = wires; r >= 1; r--) {
        var w = el('div', 'wire' + ((r - 1) % 3 === 2 && r < wires ? ' gap' : '') + ((r - 1) % 3 === 0 ? ' cl-first' : ''));
        w.appendChild(el('div', 'wire-name', RK[r].abbr));
        var beads = el('div', 'beads');
        for (var b = 1; b <= 9; b++) {
          var btn = el('button', 'bead' + (b <= counts[r - 1] ? ' on' : ''));
          btn.type = 'button';
          btn.setAttribute('data-r', r); btn.setAttribute('data-i', b);
          btn.setAttribute('aria-label', RK[r].name + ': ' + b);
          if (mode === 'static') btn.disabled = true;
          beads.appendChild(btn);
        }
        w.appendChild(beads);
        w.appendChild(el('div', 'wire-dig', String(counts[r - 1])));
        if (mode === 'play') {
          var plus = el('button', 'wire-plus', '+1');
          plus.type = 'button'; plus.setAttribute('data-plus', r);
          plus.setAttribute('aria-label', 'Добавить одну единицу: ' + RK[r].name);
          w.appendChild(plus);
        }
        frame.appendChild(w);
      }
      var v = value();
      read.innerHTML = v > 0
        ? '<span class="num">' + fmt(v) + '</span><span class="abacus-words">' + R.words(v) + '</span>'
        : '<span class="num">0</span>';
      if (o.onChange) o.onChange(v);
    }
    function addOne(r) {
      var idx = r - 1, first = 0, last = 0;
      counts[idx]++;
      while (counts[idx] === 10) {
        counts[idx] = 0;
        if (!first) first = idx + 1;
        last = idx + 1;
        if (idx + 1 >= wires) break;
        counts[idx + 1]++;
        idx++;
      }
      if (first && first < wires) {
        msg.textContent = '10 ' + RK[first].abbr + ' заменили одной единицей следующего разряда: 1 ' + RK[first + 1].abbr +
          (last > first && last < wires ? ' (замена пошла дальше — до разряда «' + RK[last + 1].name + '»)' : '') + '.';
      } else if (first) {
        msg.textContent = 'Проволоки закончились: чтобы записать такое число, нужен ещё один разряд.';
      } else {
        msg.textContent = '';
      }
      draw();
    }
    frame.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t) return;
      if (t.hasAttribute('data-plus')) { addOne(Number(t.getAttribute('data-plus'))); return; }
      if (mode === 'static') return;
      var r = Number(t.getAttribute('data-r')), b = Number(t.getAttribute('data-i'));
      counts[r - 1] = (counts[r - 1] === b) ? b - 1 : b;
      msg.textContent = '';
      draw();
    });
    var reset = el('button', 'btn ghost', 'Сбросить');
    reset.type = 'button';
    reset.addEventListener('click', function () { self.set(0); msg.textContent = ''; });
    if (mode === 'play' && o.preset) {
      var pre = el('button', 'btn soft', 'Поставить ' + fmt(o.preset));
      pre.type = 'button';
      pre.addEventListener('click', function () { self.set(o.preset); msg.textContent = 'Теперь нажми «+1» под самой правой проволокой.'; });
      tools.appendChild(pre);
    }
    if (mode !== 'static') tools.appendChild(reset);

    this.set = function (n) {
      for (var j = 0; j < wires; j++) counts[j] = Math.floor(n / pw(j)) % 10;
      draw();
    };
    this.value = value;
    root.appendChild(el('div', 'abacus-scroll')).appendChild(frame);
    root.appendChild(read);
    if (mode === 'play') root.appendChild(msg);
    root.appendChild(tools);
    host.appendChild(root);
    if (o.value != null) this.set(o.value); else draw();
  };

  /* ---------- исследователь чисел ---------- */
  function mountExplorer(host) {
    var maxD = Number(host.getAttribute('data-max')) || 12;
    var start = host.getAttribute('data-n') || '';
    host.innerHTML =
      '<label class="wlabel">Впиши любое число (до ' + maxD + ' цифр):</label>' +
      '<input class="winput" inputmode="numeric" autocomplete="off" maxlength="' + (maxD + 5) + '" placeholder="например, 4 639 000">' +
      '<div class="w-out"></div>';
    var inp = host.querySelector('input'), out = host.querySelector('.w-out');
    function render() {
      var digits = inp.value.replace(/\D/g, '').slice(0, maxD).replace(/^0+(?=\d)/, '');
      var n = digits === '' ? null : Number(digits);
      if (n == null) {
        out.innerHTML = R.tableHTML('', { classes: Math.ceil(Math.min(maxD, 12) / 3) > 2 ? 3 : 2 });
        return;
      }
      var d = String(n).length, top = d;
      out.innerHTML = R.tableHTML(n, { classes: maxD > 6 ? Math.max(3, Math.ceil(d / 3)) : 2 }) +
        '<p class="facts">Разрядов: <b>' + d + '</b>. Классов: <b>' + Math.ceil(d / 3) + '</b>. ' +
        'Старшая цифра стоит на ' + RK[top].loc + ' месте справа — это <b>' + RK[top].name + '</b>.</p>' +
        '<p class="facts">Читается: <span class="words">' + R.words(n) + '</span></p>';
    }
    R.groupInput(inp, maxD);
    inp.addEventListener('input', render);
    if (start) inp.value = fmt(start);
    render();
  }

  /* ---------- раздробление: конвертер ---------- */
  function mountConverter(host) {
    var opts = '';
    for (var r = 2; r <= 12; r++) opts += '<option value="' + r + '">' + RK[r].abbr + '</option>';
    host.innerHTML =
      '<div class="conv-row"><input class="winput sm" inputmode="numeric" autocomplete="off" value="58" aria-label="Сколько единиц">' +
      '<select class="wsel" aria-label="Какие единицы">' + opts + '</select>' +
      '<span class="conv-eq">=</span><span class="conv-res num">?</span>' +
      '<select class="wsel" aria-label="Во что раздробить"></select></div>' +
      '<p class="facts conv-why"></p>';
    var inp = host.querySelector('input'), sel = host.querySelectorAll('select'),
      res = host.querySelector('.conv-res'), why = host.querySelector('.conv-why');
    sel[0].value = '2';
    function fillTarget() {
      var ru = Number(sel[0].value), cur = Number(sel[1].value) || 1, h = '';
      for (var t = 1; t < ru; t++) h += '<option value="' + t + '">' + RK[t].abbr + '</option>';
      sel[1].innerHTML = h;
      sel[1].value = String(Math.min(cur, ru - 1));
    }
    function calc() {
      var a = Number(inp.value.replace(/\D/g, '').slice(0, 4)) || 0;
      var ru = Number(sel[0].value), rt = Number(sel[1].value), k = ru - rt;
      res.textContent = fmt(a * pw(k));
      why.innerHTML = R.tidy('1 ' + RK[ru].abbr + ' = ' + fmt(pw(k)) + ' ' + RK[rt].abbr + '. Значит ' + fmt(a) + ' ' + RK[ru].abbr +
        ' = ' + fmt(a) + ' × ' + fmt(pw(k)) + ' = <b>' + fmt(a * pw(k)) + ' ' + RK[rt].abbr + '</b> ' +
        'Проще говоря: к ' + fmt(a) + ' приписали справа ' + k + ' ' + R.plural(k, ['ноль', 'нуля', 'нулей']) + '.');
    }
    sel[0].addEventListener('change', function () { fillTarget(); calc(); });
    sel[1].addEventListener('change', calc);
    inp.addEventListener('input', calc);
    fillTarget(); sel[1].value = '1'; calc();
  }

  /* ---------- превращение: отсекатель ---------- */
  function mountCut(host) {
    var opts = '';
    for (var r = 2; r <= 12; r++) opts += '<option value="' + r + '">' + RK[r].pl + '</option>';
    host.innerHTML =
      '<div class="conv-row">' +
      '<div class="fld"><label class="wlabel" for="cutn">Число</label><input id="cutn" class="winput" inputmode="numeric" autocomplete="off"></div>' +
      '<div class="fld"><label class="wlabel" for="cuts">Сколько всего</label><select id="cuts" class="wsel">' + opts + '</select></div>' +
      '</div><div class="w-out"></div>';
    var inp = host.querySelector('input'), sel = host.querySelector('select'), out = host.querySelector('.w-out');
    inp.value = fmt(92617400);
    sel.value = '3';
    R.groupInput(inp, 12);
    function calc() {
      var digits = inp.value.replace(/\D/g, '').slice(0, 12).replace(/^0+(?=\d)/, '');
      if (!digits) { out.innerHTML = ''; return; }
      var n = Number(digits), r = Number(sel.value), ans = Math.floor(n / pw(r - 1));
      out.innerHTML = '<p class="cutline"><span class="num">' + R.fmtCut(n, r - 1) + '</span></p>' +
        '<p class="facts">Отбрасываем справа <b>' + (r - 1) + '</b> ' + R.plural(r - 1, ['цифру', 'цифры', 'цифр']) +
        ' (они выделены цветом). Оставшееся число — это и есть ответ: <b>' + fmt(ans) + ' ' + RK[r].abbr + '</b>' +
        (ans === 0 ? ' — в этом числе меньше одной такой единицы' : '') + '</p>';
    }
    inp.addEventListener('input', calc); sel.addEventListener('change', calc); calc();
  }

  /* ---------- монтаж ---------- */
  R.mountWidgets = function (root) {
    Array.prototype.forEach.call(root.querySelectorAll('[data-widget]'), function (h) {
      if (h.getAttribute('data-mounted')) return;
      h.setAttribute('data-mounted', '1');
      var t = h.getAttribute('data-widget');
      if (t === 'table') {
        h.innerHTML = R.tableHTML(h.getAttribute('data-n'), { classes: Number(h.getAttribute('data-classes')) || 2 });
      } else if (t === 'explorer') {
        mountExplorer(h);
      } else if (t === 'abacus') {
        new R.Abacus(h, { wires: Number(h.getAttribute('data-wires')) || 6, mode: 'play', preset: Number(h.getAttribute('data-preset')) || 0 });
      } else if (t === 'converter') {
        mountConverter(h);
      } else if (t === 'cut') {
        mountCut(h);
      }
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
