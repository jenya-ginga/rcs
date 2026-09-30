/* Генераторы блока «Среднее арифметическое» и «Умножение больших чисел» (уроки 32–40). Префикс am. */
(function (G) {
  'use strict';
  var R = G.RKS;
  var rand = R.rand, pick = R.pick, shuffle = R.shuffle, fmt = R.fmt, NB = R.NB;
  var gens = R.gens;

  /* ---------- общие помощники ---------- */
  function def(name, fn) {
    if (gens[name]) throw new Error('дубль ' + name);
    gens[name] = function (o) {
      var q = fn(o || {});
      q.html = R.tidy(q.html); q.explain = R.tidy(q.explain); q.hint = R.tidy(q.hint);
      return q;
    };
  }
  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function expr(s) { return '<span class="expr">' + s + '</span>'; }
  function et(tk) { return R.exprText(tk).split(NB + NB).join(NB); }
  function rn(d) { return rand(Math.pow(10, d - 1), Math.pow(10, d) - 1); }
  function unit(n, forms) { return fmt(n) + NB + R.plural(n, forms); }
  function digs(n) { return String(n).length; }
  function rev(n) { return String(n).split('').reverse().map(Number); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function steps(list, ans) {
    return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>') + '<br>Ответ: ' + ans + '.';
  }
  function plusList(a) { return a.map(fmt).join(' + '); }
  /* «a, b и c» */
  function andList(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' и ' + a[a.length - 1]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function zeroWord(n) { return R.plural(n, ['нуль', 'нуля', 'нулей']); }
  function distinctOptions(right, cands, k) {
    var seen = {}, out = []; seen[right] = 1;
    shuffle(cands).forEach(function (c) { if (out.length < k && !seen[c]) { seen[c] = 1; out.push(c); } });
    return out;
  }
  /* варианты выбора: правильный + неправильные в случайном порядке */
  function choiceQ(html, right, wrong, hint, explain, wide) {
    var opts = shuffle([right].concat(wrong));
    return { kind: 'choice', html: html, options: opts, answer: opts.indexOf(right), wide: wide !== false, hint: hint, explain: explain };
  }
  function rangeArg(v, dflt) { if (v == null) v = dflt; return Array.isArray(v) ? rand(v[0], v[1]) : v; }
  function pw10(k) { return Math.pow(10, k); }

  /* k чисел (не все одинаковые, ≥ lo) со средним ровно m; разброс не больше sp */
  function makeVals(k, m, sp, lo) {
    lo = lo == null ? 1 : lo;
    for (var g = 0; g < 400; g++) {
      var v = [], s = 0, i, ok = true;
      for (i = 0; i < k - 1; i++) { var d = rand(-sp, sp); v.push(m + d); s += d; }
      v.push(m - s);
      for (i = 0; i < k; i++) if (v[i] < lo || Math.abs(v[i] - m) > sp * 1.5) ok = false;
      if (!ok) continue;
      if (v.every(function (x) { return x === v[0]; })) continue;
      if (k > 2 && new Set(v).size < Math.min(k, 3)) continue;
      return shuffle(v);
    }
    var w = []; for (var t = 0; t < k; t++) w.push(m + (t % 2 ? 1 : -1) * (1 + Math.floor(t / 2)));
    if (k % 2) w[k - 1] = m; else { /* чётное k: пары +d и −d дают среднее m */ }
    return w;
  }

  /* ---------- запись столбиком: умножение чисел, оканчивающихся нулями (нули «в стороне») ---------- */
  function splitZ(n) { var z = 0, v = n; while (v > 0 && v % 10 === 0) { v /= 10; z++; } return { v: v, z: z }; }
  R.amSplitZ = splitZ;

  /* R.amTrailHTML(a, b, {bare:true}) — bare: только множители, без решения */
  R.amTrailHTML = function (a, b, o) {
    o = o || {};
    var A = splitZ(a), B = splitZ(b), Z = A.z + B.z, core = A.v * B.v, sa = String(A.v), sb = String(B.v);
    var wc = Math.max(String(core).length, sa.length, sb.length), W = wc + Z, c = wc - 1, j;
    function place(str, endCol) {
      var arr = [], k;
      for (var x = 0; x < wc; x++) { k = x - (endCol - str.length + 1); arr.push(k >= 0 && k < str.length ? str.charAt(k) : ''); }
      return arr;
    }
    function row(cls, sign, arr, zeros) {
      var h = '<span class="cc-row ' + cls + '"><span class="cc-op">' + (sign || '') + '</span>';
      for (var x = 0; x < W; x++) {
        if (x <= c) {
          var p = c - x, gap = (p % 3 === 2 && x > 0) ? ' gap' : '';
          h += '<span class="cc-d' + gap + '">' + (arr[x] === '' ? '&nbsp;' : arr[x]) + '</span>';
        } else {
          h += '<span class="cc-d am-z' + (x === c + 1 ? ' am-z1' : '') + '">' + ((x - c) <= zeros ? '0' : '&nbsp;') + '</span>';
        }
      }
      return h + '</span>';
    }
    var parts = [];
    for (j = 0; j < sb.length; j++) {
      var dj = Number(sb.charAt(sb.length - 1 - j));
      if (dj) parts.push({ val: A.v * dj, shift: j });
    }
    var html = '<span class="colcalc" role="img" aria-label="' + fmt(a) + ' умножить на ' + fmt(b) + (o.bare ? '' : ' равно ' + fmt(a * b)) + '">';
    if (!o.bare && sb.length === 1) {
      var top = place('', 0), Ar = rev(A.v), cr = 0, d = Number(sb);
      for (j = 0; j < Ar.length; j++) {
        var t = Ar[j] * d + cr; cr = Math.floor(t / 10);
        if (cr && j + 1 < Ar.length) top[c - (j + 1)] = String(cr);
      }
      html += row('cc-mark', '', top, 0);
    }
    html += row('cc-a', '', place(sa, c), A.z);
    html += row('cc-b', '×', place(sb, c), B.z);
    if (o.bare) {
      html += row('cc-line', '', place('', 0), 0);
    } else if (parts.length <= 1) {
      html += row('cc-line', '', place(String(core), c), Z);
    } else {
      parts.forEach(function (p, k) {
        html += row(k === 0 ? 'cc-line' : '', k === parts.length - 1 ? '+' : '', place(String(p.val), c - p.shift), 0);
      });
      html += row('cc-line', '', place(String(core), c), Z);
    }
    return html + '</span>';
  };

  /* пошаговое пояснение к записи с нулями */
  R.amTrailSteps = function (a, b) {
    var A = splitZ(a), B = splitZ(b), Z = A.z + B.z, out = [], core = A.v * B.v;
    if (!Z) return R.mulSteps(a, b);
    function d(n, S) { return S.z ? 'в числе ' + fmt(n) + ' на конце ' + S.z + ' ' + zeroWord(S.z) : 'число ' + fmt(n) + ' нулей на конце не имеет'; }
    out.push(cap(d(a, A)) + ', ' + d(b, B) + '. Всего нулей на конце: ' + Z + '. Откладываем их в сторону (они показаны красным) и умножаем ' + fmt(A.v) + ' × ' + fmt(B.v) + '.');
    R.mulSteps(A.v, B.v).forEach(function (s) { out.push(s); });
    out.push('Теперь возвращаем ' + Z + ' ' + zeroWord(Z) + ' и приписываем справа к ' + fmt(core) + ': ' + fmt(core) + ' → ' + fmt(a * b) + '.');
    return out;
  };

  /* ---------- рисунок: столбики из кубиков, «уравнять» ---------- */
  /* R.amBarsSVG(vals, {state:'before'|'after'}) — mean = sum/k (должно делиться) */
  R.amBarsSVG = function (vals, o) {
    o = o || {};
    var k = vals.length, m = sum(vals) / k, mx = Math.max.apply(null, vals.concat([m])), after = o.state === 'after';
    var cw = 54, ch = Math.max(9, Math.min(22, Math.floor(240 / mx))), gap = 3, top = 14, w = k * cw + 16, base = top + mx * (ch + gap) + 2, h = base + 30, out = '', i, r;
    out += '<svg class="fig am-bars" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="Столбики из кубиков: ' + vals.join(', ') + '">';
    for (i = 0; i < k; i++) {
      var x = 8 + i * cw + 4, v = vals[i];
      for (r = 1; r <= Math.max(v, m); r++) {
        var y = base - r * (ch + gap), cls;
        if (r <= Math.min(v, m)) cls = 'am-sq';
        else if (r <= v) cls = after ? null : 'am-ex';
        else cls = after ? 'am-nw' : 'am-em';
        if (cls) out += '<rect class="' + cls + '" x="' + x + '" y="' + y + '" width="' + (cw - 14) + '" height="' + ch + '" rx="2"/>';
      }
      out += '<text x="' + (x + (cw - 14) / 2) + '" y="' + (base + 20) + '" text-anchor="middle">' + (after ? m : v) + '</text>';
    }
    out += '<line class="am-mean" x1="4" x2="' + (w - 4) + '" y1="' + (base - m * (ch + gap) - 1) + '" y2="' + (base - m * (ch + gap) - 1) + '"/>';
    out += '<line class="am-base" x1="4" x2="' + (w - 4) + '" y1="' + (base + 1) + '" y2="' + (base + 1) + '"/>';
    return out + '</svg>';
  };

  /* ---------- виджеты ---------- */
  R.widgetMounts = R.widgetMounts || {};
  R.widgetMounts.amLevel = function (host) {
    var vals = (host.getAttribute('data-vals') || '4,7,10').split(',').map(Number), state = 'before';
    host.innerHTML = '<div class="am-lv-fig"></div><p class="facts am-lv-txt"></p><div class="am-lv-tools">' +
      '<button class="btn primary" type="button" data-a="go">Переложить поровну</button> <button class="btn soft" type="button" data-a="new">Другие числа</button></div>';
    var fig = host.querySelector('.am-lv-fig'), txt = host.querySelector('.am-lv-txt'), go = host.querySelector('[data-a="go"]'), nw = host.querySelector('[data-a="new"]');
    function draw() {
      var k = vals.length, s = sum(vals), m = s / k;
      fig.innerHTML = R.amBarsSVG(vals, { state: state });
      if (state === 'before') {
        txt.innerHTML = 'Было: ' + vals.join(', ') + '. Красные кубики — лишние, пунктирные места — где не хватает. Всего кубиков: ' + plusList(vals) + ' = ' + fmt(s) + '. Столбиков: ' + k + '.';
        go.textContent = 'Переложить поровну';
      } else {
        txt.innerHTML = 'Красные кубики переложили на пунктирные места (теперь они зелёные). В каждом столбике стало по <b>' + m + '</b>. Проверка делением: ' + fmt(s) + ' : ' + k + ' = ' + m + ' — это и есть <b>среднее арифметическое</b>.';
        go.textContent = 'Вернуть как было';
      }
    }
    go.addEventListener('click', function () { state = state === 'before' ? 'after' : 'before'; draw(); });
    nw.addEventListener('click', function () {
      var k = rand(3, 5), m = rand(4, 8);
      vals = makeVals(k, m, 3, 1); state = 'before'; draw();
    });
    draw();
  };

  R.widgetMounts.amZeros = function (host) {
    host.innerHTML = '<div class="conv-row"><div class="fld"><label class="wlabel">Первое число</label><input class="winput sm am-in" inputmode="numeric" autocomplete="off"></div>' +
      '<span class="conv-eq">×</span><div class="fld"><label class="wlabel">Второе число</label><input class="winput sm am-in" inputmode="numeric" autocomplete="off"></div></div><div class="w-out"></div>';
    var ins = host.querySelectorAll('input'), out = host.querySelector('.w-out');
    ins[0].style.width = '9ch'; ins[1].style.width = '9ch';
    ins[0].value = fmt(host.getAttribute('data-a') || 3400); ins[1].value = fmt(host.getAttribute('data-b') || 250);
    R.groupInput(ins[0], 6); R.groupInput(ins[1], 5);
    function calc() {
      var a = R.parseNum(ins[0].value), b = R.parseNum(ins[1].value);
      if (!(a > 0) || !(b > 0)) { out.innerHTML = '<p class="facts">Впиши два числа (не нули).</p>'; return; }
      out.innerHTML = '<div class="colrow">' + R.amTrailHTML(a, b) + '<div class="colsteps">' + R.amTrailSteps(a, b).join('<br>') + '</div></div>';
    }
    ins[0].addEventListener('input', calc); ins[1].addEventListener('input', calc);
    calc();
  };

  /* ==================================================================
     СРЕДНЕЕ АРИФМЕТИЧЕСКОЕ (уроки 32–34)
     ================================================================== */
  var DAYS = ['день', 'дня', 'дней'];
  function days(k) { return R.plural(k, DAYS); }
  function withUnit(v, u) { return fmt(v) + (u ? NB + u : ''); }
  var HINT_AVG = 'Среднее арифметическое — это сумма чисел, делённая на их количество. Сначала найди сумму.';

  /* найти среднее арифметическое нескольких чисел */
  def('amAvgFind', function (o) {
    var k = rangeArg(o.k, 3), size = o.size || 'mid', vals, m;
    if (size === 'oral') {
      m = rand(3, 18) * 5;
      vals = makeVals(k, m / 5, k === 2 ? 6 : 4, 1).map(function (v) { return v * 5; });
    } else if (size === 'big') {
      m = rand(12, 90) * 100 + rand(0, 9) * 10;
      vals = makeVals(k, m / 10, 60, 1).map(function (v) { return v * 10; });
    } else {
      m = rand(20, 300);
      vals = makeVals(k, m, rand(8, 40), 1);
    }
    var S = sum(vals);
    if (o.as === 'expr') {
      var tk = ['(']; vals.forEach(function (v, i) { if (i) tk.push('+'); tk.push(v); }); tk.push(')', ':', k);
      return {
        kind: 'num', html: 'Вычисли среднее арифметическое чисел, записанное выражением: ' + expr(R.exprText(tk) + ' ='), answer: m,
        hint: 'Сначала выполни действие в скобках, потом раздели сумму на количество чисел.',
        explain: steps(['В скобках сумма: ' + plusList(vals) + ' = ' + fmt(S), 'Делим на количество чисел: ' + fmt(S) + ' : ' + k + ' = ' + fmt(m)], fmt(m))
      };
    }
    return {
      kind: 'num',
      html: 'Найди среднее арифметическое ' + (k === 2 ? 'двух чисел' : 'чисел') + ': ' + andList(vals.map(num)) + '.',
      answer: m,
      hint: HINT_AVG,
      explain: steps(['Сумма чисел: ' + plusList(vals) + ' = ' + fmt(S), 'Чисел ' + R.words(k) + ', поэтому делим сумму на ' + k + ': ' + fmt(S) + ' : ' + k + ' = ' + fmt(m)], fmt(m))
    };
  });

  /* «уравнять»: переложить поровну */
  var LEVEL_CTX = [
    { where: 'коробках', what: 'карандаши', gen: 'карандашей', each: 'в каждой коробке' },
    { where: 'стопках', what: 'тетради', gen: 'тетрадей', each: 'в каждой стопке' },
    { where: 'вазах', what: 'яблоки', gen: 'яблок', each: 'в каждой вазе' },
    { where: 'корзинах', what: 'грибы', gen: 'грибов', each: 'в каждой корзине' },
    { where: 'ящиках', what: 'мячи', gen: 'мячей', each: 'в каждом ящике' },
    { where: 'кучках', what: 'камешки', gen: 'камешков', each: 'в каждой кучке' }
  ];
  def('amAvgLevel', function (o) {
    var c = pick(LEVEL_CTX), k = rangeArg(o.k, 3), m = rand(4, 9), vals = makeVals(k, m, 4, 2), S = sum(vals), q = o.q || 'mean', fig = o.fig ? R.amBarsSVG(vals, { state: 'before' }) : '';
    var text = 'В ' + k + ' ' + c.where + ' лежат ' + c.what + ': ' + vals.join(', ') + '. Их переложили так, чтобы ' + c.each + ' стало поровну. ';
    if (q === 'move') {
      var extra = vals.filter(function (v) { return v > m; }), moved = sum(extra.map(function (v) { return v - m; }));
      return {
        kind: 'num', html: 'В ' + k + ' ' + c.where + ' лежат ' + c.what + ': ' + vals.join(', ') + '. Какое наименьшее число ' + c.gen + ' надо переложить, чтобы ' + c.each + ' стало поровну?' + fig, answer: moved,
        hint: 'Сначала узнай, сколько станет ' + c.each + '. Потом посмотри, сколько лишнего там, где больше.',
        explain: steps(['Всего: ' + plusList(vals) + ' = ' + fmt(S), 'Поровну: ' + fmt(S) + ' : ' + k + ' = ' + m,
          'Лишнее там, где больше ' + m + ': ' + extra.map(function (v) { return v + ' − ' + m + ' = ' + (v - m); }).join('; ') + (extra.length > 1 ? '. Вместе: ' + extra.map(function (v) { return v - m; }).join(' + ') + ' = ' + moved : '')], moved)
      };
    }
    return {
      kind: 'num', html: text + 'Сколько ' + c.gen + ' стало ' + c.each + '?' + fig, answer: m,
      hint: 'Сложи всё вместе и раздели поровну на ' + k + ' ' + (k < 5 ? 'части' : 'частей') + '.',
      explain: steps(['Сколько всего? ' + plusList(vals) + ' = ' + fmt(S), 'Поровну на ' + k + ': ' + fmt(S) + ' : ' + k + ' = ' + m], m) + '<br>Это число и есть среднее арифметическое.'
    };
  });

  /* задачи: одно среднее из нескольких значений */
  var AVG_CTX = [
    { k: [4, 7], m: [14, 32], sp: 5, u: 'л', lo: 6, text: function (k, L) { return 'За ' + k + ' ' + days(k) + ' корова дала молока: ' + L + '. Сколько литров молока в среднем в день давала корова?'; } },
    { k: [3, 6], m: [24, 64], sp: 12, u: 'кг', lo: 8, text: function (k, L) { return 'Ребята ' + k + ' ' + days(k) + ' собирали ягоды. По дням собрали: ' + L + '. Сколько килограммов ягод они в среднем собирали за день?'; } },
    { k: [3, 5], m: [70, 180], sp: 30, u: 'г', lo: 30, text: function (k, L) { return 'Взвесили ' + k + ' ' + R.plural(k, ['луковицу', 'луковицы', 'луковиц']) + ' по отдельности. Их масса: ' + L + '. Чему равна средняя масса одной луковицы?'; } },
    { k: [3, 6], m: [96, 148], sp: 20, u: '', lo: 60, text: function (k, L) { return 'Ученики прыгали через скакалку одну минуту. Число прыжков у них: ' + L + '. Сколько прыжков в среднем сделал один ученик?'; } },
    { k: [3, 6], m: [128, 152], sp: 9, u: 'см', lo: 110, text: function (k, L) { return 'У ' + k + ' друзей рост такой: ' + L + '. Каков средний рост этих друзей?'; } },
    { k: [4, 7], m: [48, 96], sp: 12, u: '', lo: 20, text: function (k, L) { return 'В библиотеке по дням побывало столько человек: ' + L + '. Сколько человек в среднем бывало в библиотеке за день?'; } },
    { k: [4, 6], m: [17, 27], sp: 4, u: '°C', lo: 8, text: function (k, L) { return 'Утром ' + k + ' ' + days(k) + ' подряд измеряли температуру воздуха: ' + L + '. Какой была средняя утренняя температура за эти дни?'; } },
    { k: [3, 5], m: [72, 96], sp: 8, u: 'с', lo: 60, text: function (k, L) { return 'Бегун пробежал ' + k + ' ' + R.plural(k, ['круг', 'круга', 'кругов']) + ' по стадиону. Время кругов: ' + L + '. Сколько секунд в среднем уходило у него на один круг?'; } },
    { k: [3, 5], m: [65, 92], sp: 9, u: '', lo: 40, text: function (k, L) { return 'В каждом из ' + k + ' матчей баскетбольная команда набирала разное число очков: ' + L + '. Сколько очков команда в среднем набирала за матч?'; } },
    { k: [4, 6], m: [280, 340], sp: 25, u: 'см', lo: 200, text: function (k, L) { return 'Ребята прыгнули в длину с места. Результаты: ' + L + '. Найди средний результат.'; } },
    { k: [3, 5], m: [45, 130], sp: 25, u: 'руб.', lo: 20, text: function (k, L) { return 'Один и тот же альбом для рисования стоит в разных магазинах: ' + L + '. Какова средняя цена альбома?'; } },
    { k: [4, 6], m: [220, 380], sp: 40, u: '', lo: 120, text: function (k, L) { return 'На птицеферме по дням собирали яйца: ' + L + '. Сколько яиц в среднем собирали за день?'; } }
  ];
  function pickAvgCtx(o) { return o.ctx != null ? AVG_CTX[o.ctx] : pick(AVG_CTX); }
  function avgCtxVals(c, o) {
    var k = o.k != null ? rangeArg(o.k) : rand(c.k[0], c.k[1]), m = rand(c.m[0], c.m[1]);
    if (o.big) m = m * 10;
    var vals = makeVals(k, m, o.big ? c.sp * 10 : c.sp, o.big ? c.lo * 10 : c.lo);
    return { k: k, m: m, vals: vals };
  }
  def('amAvgWord', function (o) {
    var c = pickAvgCtx(o), d = avgCtxVals(c, o), S = sum(d.vals), L = andList(d.vals.map(function (v) { return withUnit(v, c.u); }));
    return {
      kind: 'num', html: c.text(d.k, L), answer: d.m, hint: HINT_AVG,
      explain: steps(['Сколько всего? ' + plusList(d.vals) + ' = ' + fmt(S) + (c.u ? ' (' + c.u + ')' : ''),
        'Сколько в среднем? ' + fmt(S) + ' : ' + d.k + ' = ' + fmt(d.m) + (c.u ? ' (' + c.u + ')' : '')], withUnit(d.m, c.u)) + '<br>Записать решение в строчку можно так: (' + plusList(d.vals) + ') : ' + d.k + ' = ' + fmt(d.m) + '.'
    };
  });

  /* несколько одинаковых значений: 3 прыжка по 1 000 м, 2 — по 800 м … */
  var W_CTX = [
    { u: 'м', vals: [600, 700, 800, 900, 1000, 1100, 1200], name: ['прыжок', 'прыжка', 'прыжков'], sumName: 'Сумма всех высот', cntName: 'Всего прыжков', avgName: 'Средняя высота',
      text: function (N, G) { return 'Парашютист сделал ' + N + ' ' + R.plural(N, ['прыжок', 'прыжка', 'прыжков']) + ': ' + andList(G.map(function (g) { return g.c + ' ' + R.plural(g.c, ['прыжок', 'прыжка', 'прыжков']) + ' с высоты ' + fmt(g.v) + NB + 'м'; })) + '. Найди среднюю высоту, с которой прыгал парашютист.'; } },
    { u: 'см', vals: [125, 128, 130, 132, 135, 138, 140, 142, 145], name: ['мальчик', 'мальчика', 'мальчиков'], sumName: 'Сумма всех ростов', cntName: 'Всего мальчиков', avgName: 'Средний рост',
      text: function (N, G) { return 'Измерили рост мальчиков: ' + andList(G.map(function (g) { return g.c + ' ' + R.plural(g.c, ['мальчик', 'мальчика', 'мальчиков']) + ' ростом ' + g.v + NB + 'см'; })) + '. Найди средний рост мальчиков.'; } },
    { u: 'руб.', vals: [120, 140, 150, 160, 180, 200, 220, 240, 250, 280], name: ['кг', 'кг', 'кг'], sumName: 'Вся стоимость', cntName: 'Всего килограммов', avgName: 'Средняя цена 1 кг',
      text: function (N, G) { return 'В магазине купили ' + andList(G.map(function (g) { return g.c + NB + 'кг конфет по ' + g.v + NB + 'руб. за килограмм'; })) + '. Сколько рублей в среднем стоил 1 кг конфет?'; } },
    { u: 'кг', vals: [30, 35, 40, 45, 50, 55, 60, 65, 70], name: ['день', 'дня', 'дней'], sumName: 'Всего собрано', cntName: 'Всего дней', avgName: 'В среднем за день', days: true,
      minC: 2, text: function (N, G) { return 'Бригада собирала яблоки ' + N + ' ' + days(N) + ': ' + G.map(function (g, i) { return (i === 0 ? 'первые ' : i === G.length - 1 ? 'последние ' : 'следующие ') + g.c + ' ' + days(g.c) + ' — по ' + g.v + NB + 'кг'; }).join(', ') + '. Сколько килограммов яблок бригада в среднем собирала за день?'; } },
    { u: 'раз', vals: [8, 9, 10, 11, 12, 13, 14, 15, 16], name: ['ученик', 'ученика', 'учеников'], sumName: 'Всего подтягиваний', cntName: 'Всего учеников', avgName: 'В среднем на одного',
      text: function (N, G) { return 'На уроке физкультуры ' + andList(G.map(function (g) { return g.c + ' ' + R.plural(g.c, ['ученик подтянулся', 'ученика подтянулись', 'учеников подтянулись']) + ' по ' + g.v + ' ' + R.plural(g.v, ['разу', 'раза', 'раз']); })) + '. Сколько раз в среднем подтягивался один ученик?'; } }
  ];
  def('amAvgWeighted', function (o) {
    var c = pick(W_CTX), gcount = rangeArg(o.groups, 2), G, N, S, g = 0, tries = 0;
    do {
      var cs = [], vs = shuffle(c.vals).slice(0, gcount).sort(function (a, b) { return a - b; });
      for (var i = 0; i < gcount; i++) cs.push(rand(c.minC || 1, gcount === 2 ? 6 : 4));
      G = cs.map(function (cc, i) { return { c: cc, v: vs[i] }; });
      N = sum(cs); S = sum(G.map(function (x) { return x.c * x.v; }));
      tries++;
    } while (tries < 800 && (S % N !== 0 || N < 4 || (gcount === 3 && new Set(cs).size < 2)));
    if (S % N !== 0) { G = [{ c: 2, v: c.vals[0] }, { c: 2, v: c.vals[2] }]; N = 4; S = 2 * c.vals[0] + 2 * c.vals[2]; }
    var m = S / N, prods = G.map(function (x) { return x.c + ' × ' + fmt(x.v) + ' = ' + fmt(x.c * x.v); });
    if (S % N !== 0) throw new Error('amAvgWeighted не делится');
    return {
      kind: 'num', html: c.text(N, G), answer: m,
      hint: 'Сначала найди общую сумму: для каждой группы умножь количество на значение. Потом раздели сумму на общее количество.',
      explain: steps([c.sumName + ': ' + prods.join('; ') + '. Вместе: ' + G.map(function (x) { return fmt(x.c * x.v); }).join(' + ') + ' = ' + fmt(S),
        c.cntName + ': ' + G.map(function (x) { return x.c; }).join(' + ') + ' = ' + N, c.avgName + ': ' + fmt(S) + ' : ' + N + ' = ' + fmt(m)], withUnit(m, c.u))
    };
  });

  /* среднее по двум группам, зная средние в группах */
  var GR_CTX = [
    { u: 'см', a: [130, 145], d: [1, 6], text: function (c1, c2, a1, a2) {
      return 'В классе ' + c1 + ' ' + R.plural(c1, ['мальчик', 'мальчика', 'мальчиков']) + ' и ' + c2 + ' ' + R.plural(c2, ['девочка', 'девочки', 'девочек']) + '. Средний рост мальчиков ' + a1 + NB + 'см, а девочек — ' + a2 + NB + 'см. Найди средний рост всех учеников класса.'; },
      s1: 'Сумма ростов мальчиков', s2: 'Сумма ростов девочек', s3: 'Сумма ростов всех', cnt: 'Всего учеников' },
    { u: 'л', a: [14, 30], d: [2, 8], text: function (c1, c2, a1, a2) {
      return 'На ферме ' + c1 + ' ' + R.plural(c1, ['корова', 'коровы', 'коров']) + ' одной породы и ' + c2 + ' ' + R.plural(c2, ['корова', 'коровы', 'коров']) + ' другой. В среднем корова первой породы даёт ' + a1 + NB + 'л молока в день, а второй — ' + a2 + NB + 'л. Сколько литров молока в день в среднем даёт одна корова фермы?'; },
      s1: 'Молоко первой породы', s2: 'Молоко второй породы', s3: 'Всего молока за день', cnt: 'Всего коров' },
    { u: 'дет.', a: [12, 30], d: [2, 8], text: function (c1, c2, a1, a2) {
      return 'В первой бригаде ' + c1 + ' рабочих, во второй — ' + c2 + '. В среднем рабочий первой бригады делает за смену ' + a1 + ' ' + R.plural(a1, ['деталь', 'детали', 'деталей']) + ', а второй — ' + a2 + '. Сколько деталей за смену делает в среднем один рабочий из этих двух бригад?'; },
      s1: 'Детали первой бригады', s2: 'Детали второй бригады', s3: 'Всего деталей', cnt: 'Всего рабочих' }
  ];
  def('amAvgGroups', function (o) {
    var c = pick(GR_CTX), c1, c2, a1, a2, N, S, t = 0;
    do {
      c1 = rand(3, 12); c2 = rand(3, 12); a1 = rand(c.a[0], c.a[1]); a2 = a1 + pick([-1, 1]) * rand(c.d[0], c.d[1]);
      N = c1 + c2; S = c1 * a1 + c2 * a2; t++;
    } while (t < 2000 && (S % N !== 0 || c1 === c2 || a2 < c.a[0] - 10 || a2 <= 0));
    if (S % N !== 0) { c1 = 6; c2 = 4; a1 = 30; a2 = 20; N = 10; S = 260; }
    var m = S / N;
    return {
      kind: 'num', html: c.text(c1, c2, a1, a2), answer: m,
      hint: 'Средние по группам складывать нельзя. Сначала узнай общую сумму: среднее каждой группы умножь на число членов группы.',
      explain: steps([c.s1 + ': ' + c1 + ' × ' + a1 + ' = ' + fmt(c1 * a1), c.s2 + ': ' + c2 + ' × ' + a2 + ' = ' + fmt(c2 * a2),
        c.s3 + ': ' + fmt(c1 * a1) + ' + ' + fmt(c2 * a2) + ' = ' + fmt(S), c.cnt + ': ' + c1 + ' + ' + c2 + ' = ' + N, 'Среднее для всех: ' + fmt(S) + ' : ' + N + ' = ' + fmt(m)], withUnit(m, c.u === 'дет.' ? '' : c.u) + (c.u === 'дет.' ? ' ' + R.plural(m, ['деталь', 'детали', 'деталей']) : ''))
    };
  });

  /* задачи в 3–4 действия на среднее */
  def('amAvgSteps', function (o) {
    var fam = o.fam != null ? o.fam : rand(1, 3), t = 0, A, B, C, S, m, text, list, ans;
    if (fam === 1) {
      var c = pick([
        { f: ['батон', 'батона', 'батонов'], d: ['В понедельник', 'во вторник', 'в среду'], w: 'пекарня испекла', q: 'Сколько батонов хлеба в среднем пекарня выпекала в день?', a: [200, 600] },
        { f: ['книгу', 'книги', 'книг'], d: ['В понедельник', 'во вторник', 'в среду'], w: 'библиотека выдала', q: 'Сколько книг в среднем библиотека выдавала в день?', a: [120, 400] },
        { f: ['билет', 'билета', 'билетов'], d: ['В пятницу', 'в субботу', 'в воскресенье'], w: 'кинотеатр продал', q: 'Сколько билетов в среднем кинотеатр продавал в день?', a: [300, 900] },
        { f: ['кг картофеля', 'кг картофеля', 'кг картофеля'], g: ['кг', 'кг', 'кг'], d: ['В первый день', 'во второй день', 'в третий день'], w: 'фермеры собрали', q: 'Сколько килограммов картофеля в среднем собирали за день?', a: [300, 900] }
      ]);
      do { A = rand(c.a[0], c.a[1]); B = rand(2, 9) * 10; C = rand(1, 9) * 10; S = 3 * A + 2 * B - C; t++; } while (t < 600 && (S % 3 !== 0 || 2 * B === C));
      m = S / 3;
      var nn = function (x, fs) { return fmt(x) + NB + R.plural(x, fs || c.f); }, gg = c.g || c.f;
      text = c.d[0] + ' ' + c.w + ' ' + nn(A) + ', ' + c.d[1] + ' — на ' + nn(B, gg) + ' больше, чем ' + c.d[0].charAt(0).toLowerCase() + c.d[0].slice(1) + ', а ' + c.d[2] + ' — на ' + nn(C, gg) + ' меньше, чем ' + c.d[1] + '. ' + c.q;
      list = ['Сколько ' + c.d[1] + '? ' + fmt(A) + ' + ' + B + ' = ' + fmt(A + B), 'Сколько ' + c.d[2] + '? ' + fmt(A + B) + ' − ' + C + ' = ' + fmt(A + B - C),
        'Сколько всего за три дня? ' + fmt(A) + ' + ' + fmt(A + B) + ' + ' + fmt(A + B - C) + ' = ' + fmt(S), 'Сколько в среднем? ' + fmt(S) + ' : 3 = ' + fmt(m)];
      ans = nn(m);
    } else if (fam === 2) {
      var what = pick(['помидоры', 'огурцы', 'морковь']), whatG = { 'помидоры': 'помидоров', 'огурцы': 'огурцов', 'морковь': 'моркови' }[what];
      do { A = rand(12, 40) * 10; C = rand(1, 9) * 10 + rand(0, 4); S = 5 * A - C; t++; } while (t < 600 && S % 3 !== 0);
      m = S / 3;
      text = 'Три бригады собирали ' + what + '. Первая бригада собрала ' + fmt(A) + ' кг, вторая — в 2 раза больше, чем первая, а третья — на ' + C + ' кг меньше, чем вторая. Сколько килограммов ' + whatG + ' в среднем собрала одна бригада?';
      list = ['Сколько собрала вторая бригада? ' + fmt(A) + ' × 2 = ' + fmt(2 * A), 'Сколько собрала третья бригада? ' + fmt(2 * A) + ' − ' + C + ' = ' + fmt(2 * A - C),
        'Сколько всего? ' + fmt(A) + ' + ' + fmt(2 * A) + ' + ' + fmt(2 * A - C) + ' = ' + fmt(S), 'Сколько в среднем? ' + fmt(S) + ' : 3 = ' + fmt(m)];
      ans = fmt(m) + ' кг';
    } else {
      A = rand(4, 16) * 3; B = rand(2, 9) * 2;
      var P2 = A + B, P3 = 2 * P2; S = A + P2 + P3; m = S / 3;
      text = 'Ручка стоит ' + A + ' руб., тетрадь — на ' + B + ' руб. дороже ручки, а альбом — в 2 раза дороже тетради. Какова средняя цена этих трёх предметов?';
      list = ['Сколько стоит тетрадь? ' + A + ' + ' + B + ' = ' + P2, 'Сколько стоит альбом? ' + P2 + ' × 2 = ' + P3, 'Сколько стоят все три предмета? ' + A + ' + ' + P2 + ' + ' + P3 + ' = ' + S,
        'Какова средняя цена? ' + S + ' : 3 = ' + m];
      ans = m + ' руб.';
    }
    if (S % 3 !== 0) throw new Error('amAvgSteps: не делится');
    return {
      kind: 'num', html: text, answer: m,
      hint: 'Сначала найди все неизвестные числа (сколько было в каждый из трёх случаев), потом сумму, и только в конце — среднее.',
      explain: steps(list, ans)
    };
  });

  /* обратная задача: по среднему и количеству найти сумму */
  var SUM_CTX = [
    { m: [12, 60], text: function (m, k) { return 'В магазине в среднем продавали ' + m + ' кг сыра в день. Сколько килограммов сыра продали за ' + k + ' ' + days(k) + '?'; }, u: 'кг' },
    { m: [15, 30], text: function (m, k) { return 'Корова в среднем давала ' + m + ' л молока в день. Сколько литров молока она дала за ' + k + ' ' + days(k) + '?'; }, u: 'л' },
    { m: [140, 480], text: function (m, k) { return 'Пекарня в среднем выпекала ' + m + ' ' + R.plural(m, ['батон', 'батона', 'батонов']) + ' в день. Сколько батонов выпекли за ' + k + ' ' + days(k) + '?'; }, u: 'бат.' },
    { m: [120, 380], text: function (m, k) { return 'В среднем кинотеатр продавал ' + m + ' ' + R.plural(m, ['билет', 'билета', 'билетов']) + ' в день. Сколько билетов продали за ' + k + ' ' + days(k) + '?'; }, u: 'бил.' },
    { m: [21, 45], text: function (m, k) { return 'Оля читала в среднем ' + m + ' ' + R.plural(m, ['страницу', 'страницы', 'страниц']) + ' в день. Сколько страниц она прочитала за ' + k + ' ' + days(k) + '?'; }, u: 'стр.' },
    { m: [42, 95], text: function (m, k) { return 'Велосипедист в среднем проезжал ' + m + ' км в день. Сколько километров он проехал за ' + k + ' ' + days(k) + '?'; }, u: 'км' },
    { m: [3, 9], text: function (m, k) { return 'Средняя масса одного арбуза — ' + m + ' кг. Сколько килограммов весят ' + k + ' ' + R.plural(k, ['арбуз', 'арбуза', 'арбузов']) + '?'; }, u: 'кг' }
  ];
  def('amAvgSum', function (o) {
    var k = rangeArg(o.k, [5, 10]), kind = o.plain ? 'plain' : (o.word ? 'word' : pick(['plain', 'word', 'word'])), m, text, u = '';
    if (kind === 'plain') {
      m = rand(12, 90);
      text = 'Среднее арифметическое ' + k + ' чисел равно ' + num(m) + '. Найди сумму этих чисел.';
    } else {
      var c = pick(SUM_CTX); m = rand(c.m[0], c.m[1]); text = c.text(m, k); u = c.u;
    }
    var S = m * k, ansUnit = { 'бат.': ' ' + R.plural(S, ['батон', 'батона', 'батонов']), 'бил.': ' ' + R.plural(S, ['билет', 'билета', 'билетов']), 'стр.': ' ' + R.plural(S, ['страница', 'страницы', 'страниц']) }[u] || (u ? ' ' + u : '');
    return {
      kind: 'num', html: text, answer: S,
      hint: 'Среднее арифметическое — это сумма, делённая на количество. Значит, чтобы найти сумму, среднее надо умножить на количество.',
      explain: steps(['Сумма = среднее × количество: ' + fmt(m) + ' × ' + k + ' = ' + fmt(S)], fmt(S) + ansUnit) + '<br>Проверка: ' + fmt(S) + ' : ' + k + ' = ' + fmt(m) + ' — как в условии.'
    };
  });

  /* по среднему и остальным числам найти недостающее */
  var MISS_CTX = [
    { k: [4, 6], m: [30, 60], sp: 10, lo: 12, u: 'кг', text: function (k, m, L) { return 'Ребята собирали ягоды ' + k + ' ' + days(k) + ' и в среднем собирали по ' + m + ' кг в день. Известно, что в первые ' + (k - 1) + ' ' + days(k - 1) + ' они собрали ' + L + '. Сколько килограммов ягод они собрали в последний день?'; } },
    { k: [4, 5], m: [76, 92], sp: 8, lo: 60, u: 'с', text: function (k, m, L) { return 'Бегун пробежал ' + k + ' ' + R.plural(k, ['круг', 'круга', 'кругов']) + ', и в среднем на круг у него уходило ' + m + ' с. Первые ' + (k - 1) + ' ' + R.plural(k - 1, ['круг', 'круга', 'кругов']) + ' он пробежал за ' + L + '. За сколько секунд он пробежал последний круг?'; } },
    { k: [4, 6], m: [34, 46], sp: 6, lo: 24, u: 'кг', text: function (k, m, L) { return 'Средняя масса ' + k + ' друзей — ' + m + ' кг. Известна масса ' + (k - 1) + ' друзей: ' + L + '. Чему равна масса последнего друга?'; } },
    { k: [4, 5], m: [120, 300], sp: 40, lo: 60, u: 'руб.', text: function (k, m, L) { return 'Средняя цена ' + k + ' книг — ' + m + ' руб. Цена ' + (k - 1) + ' книг: ' + L + '. Сколько стоит последняя книга?'; } },
    { k: [4, 6], m: [280, 340], sp: 30, lo: 220, u: 'см', text: function (k, m, L) { return 'Спортсменка сделала ' + k + ' прыжков в длину. Средняя длина прыжка — ' + m + ' см. Первые ' + (k - 1) + ' прыжка дали такие результаты: ' + L + '. Какой результат в последнем прыжке?'; } }
  ];
  def('amAvgMissing', function (o) {
    var plain = o.plain != null ? o.plain : Math.random() < 0.35, k, m, vals, idx, miss, given, S, G, text, u = '';
    if (plain) {
      k = rangeArg(o.k, [4, 6]); m = rand(20, 80); vals = makeVals(k, m, 14, 3);
    } else {
      var c = pick(MISS_CTX); k = rand(c.k[0], c.k[1]); m = rand(c.m[0], c.m[1]); vals = makeVals(k, m, c.sp, c.lo); u = c.u;
    }
    idx = rand(0, k - 1); miss = vals[idx]; given = vals.filter(function (v, i) { return i !== idx; }); S = m * k; G = sum(given);
    if (plain) text = 'Среднее арифметическое ' + k + ' чисел равно ' + num(m) + '. Из этих чисел известны ' + (k - 1) + ': ' + andList(given.map(num)) + '. Найди последнее число.';
    else text = c.text(k, m, andList(given.map(function (v) { return withUnit(v, u); })));
    if (miss !== S - G || miss <= 0) throw new Error('amAvgMissing');
    return {
      kind: 'num', html: text, answer: miss,
      hint: 'Сначала узнай, чему равна сумма всех ' + k + ' чисел: среднее умножь на количество. Потом вычти то, что уже известно.',
      explain: steps(['Сколько всего? ' + fmt(m) + ' × ' + k + ' = ' + fmt(S), 'Сколько составляют известные числа? ' + plusList(given) + ' = ' + fmt(G), 'Сколько осталось на последнее? ' + fmt(S) + ' − ' + fmt(G) + ' = ' + fmt(miss)], withUnit(miss, u)) +
        '<br>Проверка: (' + plusList(given.concat([miss])) + ') : ' + k + ' = ' + fmt(m) + '.'
    };
  });

  /* сравнение со средним */
  var NAMES_G = [['Аня', 'Ани'], ['Боря', 'Бори'], ['Вера', 'Веры'], ['Гриша', 'Гриши'], ['Даша', 'Даши'], ['Егор', 'Егора'], ['Женя', 'Жени'], ['Ира', 'Иры'], ['Коля', 'Коли'], ['Лена', 'Лены'], ['Миша', 'Миши'], ['Оля', 'Оли'], ['Паша', 'Паши'], ['Рита', 'Риты']];
  var COWS_G = [['Зорька', 'Зорьки'], ['Бурёнка', 'Бурёнки'], ['Ромашка', 'Ромашки'], ['Майка', 'Майки'], ['Красуля', 'Красули'], ['Лыска', 'Лыски'], ['Звёздочка', 'Звёздочки']];
  var CMP_CTX = [
    { names: NAMES_G, intro: 'На уроке физкультуры ребят взвесили. Результаты: ', m: [30, 44], sp: 5, lo: 24, u: 'кг', hi: 'больше', lo2: 'меньше',
      q: function (g, hi) { return 'На сколько килограммов масса ' + g + ' ' + (hi ? 'больше' : 'меньше') + ' средней массы всех ребят?'; },
      cnt: function (hi) { return 'Сколько ребят имеют массу ' + (hi ? 'больше' : 'меньше') + ' средней?'; } },
    { names: NAMES_G, intro: 'Ребята прыгали в длину с места. Результаты: ', m: [150, 190], sp: 18, lo: 110, u: 'см',
      q: function (g, hi) { return 'На сколько сантиметров результат ' + g + ' ' + (hi ? 'выше' : 'ниже') + ' среднего результата?'; },
      cnt: function (hi) { return 'Сколько ребят показали результат ' + (hi ? 'выше' : 'ниже') + ' среднего?'; } },
    { names: NAMES_G, intro: 'Ребята пробежали дистанцию. Время: ', m: [18, 26], sp: 4, lo: 12, u: 'с',
      q: function (g, hi) { return 'На сколько секунд время ' + g + ' ' + (hi ? 'больше' : 'меньше') + ' среднего времени?'; },
      cnt: function (hi) { return 'Сколько ребят пробежали дистанцию за время ' + (hi ? 'больше' : 'меньше') + ' среднего?'; } },
    { names: COWS_G, intro: 'Коровы на ферме дали за день молока: ', m: [16, 26], sp: 5, lo: 8, u: 'л',
      q: function (g, hi) { return 'На сколько литров удой ' + g + ' ' + (hi ? 'больше' : 'меньше') + ' среднего удоя?'; },
      cnt: function (hi) { return 'Сколько коров дали молока ' + (hi ? 'больше' : 'меньше') + ' среднего удоя?'; } }
  ];
  def('amAvgCompare', function (o) {
    var c = pick(CMP_CTX), k = rangeArg(o.k, [4, 5]), m = rand(c.m[0], c.m[1]), vals, S, nm = shuffle(c.names).slice(0, k), mode = o.q || pick(['diff', 'diff', 'count']), g = 0;
    do { vals = makeVals(k, m, c.sp, c.lo); g++; } while (g < 100 && vals.every(function (v) { return v === m; }));
    S = sum(vals);
    var list = andList(vals.map(function (v, i) { return nm[i][0] + ' — ' + fmt(v) + NB + c.u; })), avgStep = 'Среднее: ' + plusList(vals) + ' = ' + fmt(S) + '; ' + fmt(S) + ' : ' + k + ' = ' + m;
    if (mode === 'count') {
      var hi = Math.random() < 0.5, who = [], cnt = 0;
      vals.forEach(function (v, i) { if (hi ? v > m : v < m) { cnt++; who.push(nm[i][0] + ' (' + v + ')'); } });
      return {
        kind: 'num', html: c.intro + list + '. ' + c.cnt(hi), answer: cnt,
        hint: 'Сначала найди среднее арифметическое, потом сравни с ним каждое число.',
        explain: steps([avgStep, (hi ? 'Больше ' : 'Меньше ') + m + ': ' + who.join(', ') + ' — всего ' + cnt], cnt)
      };
    }
    var idx, tries = 0;
    do { idx = rand(0, k - 1); tries++; } while (vals[idx] === m && tries < 50);
    var above = vals[idx] > m, d = Math.abs(vals[idx] - m);
    return {
      kind: 'num', html: c.intro + list + '. ' + c.q(nm[idx][1], above), answer: d,
      hint: 'Сначала найди среднее арифметическое. Потом вычти из большего числа меньшее.',
      explain: steps([avgStep, above ? nm[idx][0] + ': ' + vals[idx] + ' − ' + m + ' = ' + d : nm[idx][0] + ': ' + m + ' − ' + vals[idx] + ' = ' + d], d + NB + c.u)
    };
  });

  /* среднее лежит между наименьшим и наибольшим */
  def('amAvgRange', function (o) {
    var k = rangeArg(o.k, [3, 4]), m = rand(20, 90), vals = makeVals(k, m, 12, 3), mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    var cands = [mn, mx, mn - rand(1, 6), mx + rand(1, 8), mx + rand(9, 20), Math.max(1, mn - rand(7, 15))].filter(function (x) { return x >= 1 && (x <= mn || x >= mx); });
    var wrong = distinctOptions(m, cands, 3);
    if (wrong.length < 3) return gens.amAvgRange(o);
    var right = fmt(m);
    return choiceQ('Числа: ' + andList(vals.map(num)) + '. Какое из чисел может быть их средним арифметическим?', right, wrong.map(fmt),
      'Среднее арифметическое не может быть меньше наименьшего числа или больше наибольшего. Оно лежит между ними.',
      'Наименьшее число ' + mn + ', наибольшее — ' + mx + '. Среднее лежит между ними, поэтому подходит только ' + right + '. Проверка: (' + plusList(vals) + ') : ' + k + ' = ' + fmt(m) + '.', false);
  });

  /* задумал число … получилось … (обратный ход) */
  def('amThink', function (o) {
    var n = rangeArg(o.steps, [3, 3]), x = rand(2, 30), v = x, ops = [], g = 0, i;
    for (i = 0; i < n; i++) {
      var op, kk, ok = false, tries = 0, prevAdd = ops.length ? (ops[ops.length - 1].op === 'add' || ops[ops.length - 1].op === 'sub') : Math.random() < 0.5;
      while (!ok && tries++ < 60) {
        op = prevAdd ? pick(['mul', 'mul', 'div']) : pick(['add', 'add', 'sub']);
        if (op === 'add') { kk = rand(2, 30); ok = v + kk <= 400; }
        else if (op === 'sub') { kk = rand(2, 20); ok = v - kk >= 1; }
        else if (op === 'mul') { kk = rand(2, 9); ok = v * kk <= 400; }
        else { var ds = []; for (var q = 2; q <= 9; q++) if (v % q === 0 && v / q >= 2) ds.push(q); ok = ds.length > 0; kk = ok ? pick(ds) : 0; }
      }
      if (!ok) { op = prevAdd ? 'mul' : 'add'; kk = prevAdd ? 2 : 5; }
      v = op === 'add' ? v + kk : op === 'sub' ? v - kk : op === 'mul' ? v * kk : v / kk;
      ops.push({ op: op, k: kk, res: v });
    }
    var parts = ops.map(function (p, j) {
      var first = j === 0;
      return p.op === 'add' ? (first ? 'прибавил к нему ' : 'прибавил ') + p.k : p.op === 'sub' ? 'вычел ' + p.k : p.op === 'mul' ? (first ? 'умножил его на ' : 'умножил результат на ') + p.k : (first ? 'разделил его на ' : 'разделил результат на ') + p.k;
    });
    var seq = parts.map(function (t, j) { return (j === 0 ? 'Сначала ' : j === parts.length - 1 ? 'в конце ' : 'потом ') + t; }).join(', ');
    var back = [], cur = v;
    for (i = ops.length - 1; i >= 0; i--) {
      var p = ops[i], prev = p.op === 'add' ? cur - p.k : p.op === 'sub' ? cur + p.k : p.op === 'mul' ? cur / p.k : cur * p.k;
      back.push(fmt(cur) + ' ' + (p.op === 'add' ? '−' : p.op === 'sub' ? '+' : p.op === 'mul' ? ':' : '×') + ' ' + p.k + ' = ' + fmt(prev)); cur = prev;
    }
    if (cur !== x) throw new Error('amThink обратный ход не сошёлся');
    return {
      kind: 'num', html: 'Я задумал число. ' + seq + '. Получилось ' + fmt(v) + '. Какое число я задумал?', answer: x,
      hint: 'Иди с конца: каждое действие отмени обратным. Сложение отменяет вычитание, умножение — деление.',
      explain: steps(back, x) + '<br>Проверка: ' + [x].concat(ops.map(function (p) { return p.res; })).map(fmt).join(' → ') + '.'
    };
  });

  /* какое выражение находит среднее */
  def('amAvgExprChoice', function (o) {
    var k = rangeArg(o.k, [3, 4]), m = rand(12, 90), vals = makeVals(k, m, 10, 2), S = sum(vals);
    function build(brackets, op, cnt, list) {
      var tk = [], i;
      if (brackets) tk.push('(');
      list.forEach(function (v, i) { if (i) tk.push('+'); tk.push(v); });
      if (brackets) tk.push(')');
      tk.push(op, cnt); return R.exprText(tk);
    }
    var right = build(true, ':', k, vals), wrong = [build(false, ':', k, vals), build(true, '×', k, vals), build(true, ':', k + 1, vals), build(true, ':', k - 1, vals), build(true, ':', k, vals.slice(1))];
    var w = distinctOptions(right, wrong, 3);
    return choiceQ('Какое выражение находит среднее арифметическое чисел ' + andList(vals.map(num)) + '?', right, w,
      'Среднее — это сумма, делённая на количество чисел. Подумай, нужны ли скобки.',
      'Нужно сначала сложить все числа, а потом разделить сумму на ' + k + '. Чтобы сложение выполнилось первым, его берут в скобки: ' + right + ' = ' + fmt(S) + ' : ' + k + ' = ' + fmt(m) + '. Без скобок первым выполнилось бы деление, и получился бы другой результат.', true);
  });

  /* ==================================================================
     УМНОЖЕНИЕ БОЛЬШИХ ЧИСЕЛ (уроки 35–40)
     ================================================================== */

  /* умножение по очереди: 15 × 16 = 15 × 4 × 4 */
  var SEQ_B = [[6, 2, 3], [8, 2, 4], [9, 3, 3], [12, 2, 6], [12, 3, 4], [14, 2, 7], [15, 3, 5], [16, 4, 4], [16, 2, 8], [18, 2, 9], [18, 3, 6], [21, 3, 7], [24, 4, 6], [24, 3, 8], [27, 3, 9], [28, 4, 7], [32, 4, 8], [35, 5, 7], [36, 4, 9], [36, 6, 6], [45, 5, 9], [48, 6, 8], [54, 6, 9]];
  var SEQ_A = [12, 13, 14, 15, 16, 17, 18, 19, 21, 24, 25, 28, 32, 35, 45, 75];
  def('amSeqMul', function (o) {
    var t = pick(SEQ_B), b = t[0], b1 = t[1], b2 = t[2], a = pick(SEQ_A);
    if (o.max && b > o.max) { t = SEQ_B[0]; b = t[0]; b1 = t[1]; b2 = t[2]; }
    if (Math.random() < 0.5) { var z = b1; b1 = b2; b2 = z; }
    return {
      kind: 'num', html: expr(a + ' × ' + b + ' ='), answer: a * b,
      hint: 'Разложи второй множитель на два удобных множителя и умножай на них по очереди.',
      explain: a + ' × ' + b + ' = ' + a + ' × ' + b1 + ' × ' + b2 + ' = ' + (a * b1) + ' × ' + b2 + ' = ' + (a * b) + '.'
    };
  });

  /* --- числа для умножения --- */
  /* d-значное число; o.zero — хотя бы один нуль внутри; o.zp — вероятность нуля внутри; последняя цифра никогда не 0 */
  function mk(d, o) {
    o = o || {};
    var ds = [rand(1, 9)], i;
    for (i = 1; i < d; i++) ds.push(rand(1, 9));
    if (o.zero && d >= 3) { ds[rand(1, d - 2)] = 0; if (d >= 5 && Math.random() < 0.4) ds[rand(1, d - 2)] = 0; }
    else if (o.zp && d >= 3 && Math.random() < o.zp) ds[rand(1, d - 2)] = 0;
    return Number(ds.join(''));
  }
  function nz(n) { return String(n).replace(/0/g, '').length; }
  function trailZ(n) { var z = 0; while (n > 0 && n % 10 === 0) { n /= 10; z++; } return z; }
  function wrongProd(P) {
    var e, j, g = 0, r;
    do { j = rand(1, Math.max(1, Math.min(3, digs(P) - 1))); e = pw10(j) * pick([1, 2, -1, -2, 1]); r = P + e; g++; } while (g < 30 && (r <= 0 || r === P));
    return r <= 0 ? P + 10 : r;
  }
  /* столбик с разбором и проверкой делением */
  function colExplain(a, b) {
    var P = a * b, trail = (trailZ(a) + trailZ(b) > 0) && a >= 10 && b >= 10;
    return 'Столбиком:' + (trail ? R.amTrailHTML(a, b) : R.mulHTML(a, b)) + '<span class="colsteps">' + (trail ? R.amTrailSteps(a, b) : R.mulSteps(a, b)).join('<br>') + '</span>' +
      'Ответ: ' + num(P) + '. Проверка делением: ' + fmt(P) + ' : ' + fmt(b) + ' = ' + fmt(a) + '.';
  }
  var HINT_COL = 'Умножь первое число на каждую цифру второго, начиная с единиц. Каждую следующую строку пиши на разряд левее, в конце сложи строки.';

  /* умножение столбиком: o.a, o.b — число цифр (или [от, до]); o.za/o.zb — нуль внутри; o.tz — 'a'|'b'|'both' нули на конце;
     o.swap — записать в неудобном порядке (меньшее первым) */
  def('amMulBig', function (o) {
    var da = rangeArg(o.a, [4, 5]), db = rangeArg(o.b, [2, 2]), a, b, g = 0, zp = o.zp == null ? 0.12 : o.zp;
    do {
      a = mk(da, { zero: o.za, zp: zp }); b = mk(db, { zero: o.zb, zp: zp });
      if (o.tz === 'a' || o.tz === 'both') a *= pw10(rand(1, 2));
      if (o.tz === 'b' || o.tz === 'both') b *= pw10(rand(1, 2));
      g++;
    } while (g < 60 && (a * b > 1.5e9 || a === b));
    var shown = o.swap ? b + ' × ' + a : a + ' × ' + b;
    var s1 = o.swap ? fmt(b) + ' × ' + fmt(a) : fmt(a) + ' × ' + fmt(b);
    var hint = (trailZ(a) + trailZ(b) > 0 && a >= 10 && b >= 10) ? 'Отбрось нули на конце каждого множителя, перемножь то, что осталось, а потом припиши справа все отброшенные нули.' : String(b).length === 1 ? 'Умножай каждую цифру справа налево, а десятки, которые получились, запоминай и прибавляй к следующему произведению.'
      : (o.swap ? 'Переставь множители: сверху запиши число побольше, а снизу — поменьше. ' : '') + HINT_COL;
    var ex = colExplain(a, b);
    if (o.swap) ex = 'Переставим множители (так строк будет меньше): ' + s1 + ' = ' + fmt(a) + ' × ' + fmt(b) + '.<br>' + ex;
    return { kind: 'num', html: 'Вычисли столбиком: ' + expr(s1 + ' ='), answer: a * b, hint: hint, explain: ex };
  });

  /* определение умножения */
  def('amMulDef', function (o) {
    var type = o.type || pick(['choice', 'value']), a = pick([mk(2), mk(3), mk(3)]), k = rand(3, 6);
    var terms = []; for (var i = 0; i < k; i++) terms.push(fmt(a));
    if (type === 'choice') {
      var right = fmt(a) + ' × ' + k, wrong = distinctOptions(right, [k + ' × ' + k, fmt(a) + ' + ' + k, fmt(a) + ' × ' + fmt(a), fmt(a) + ' × ' + (k + 1), fmt(a) + ' × ' + (k - 1), fmt(a) + ' : ' + k], 3);
      return choiceQ('Сумму ' + terms.join(' + ') + ' заменили умножением. Какое умножение получилось?', right.replace(/ × /g, NB + '×' + NB), wrong.map(function (x) { return x.replace(/ ([×+:]) /g, NB + '$1' + NB); }),
        'Посмотри: какое число повторяется и сколько раз оно повторяется. Повторяющееся число — множимое, а число повторений — множитель.',
        'Число ' + fmt(a) + ' повторяется слагаемым ' + k + ' ' + R.plural(k, ['раз', 'раза', 'раз']) + ' — значит, это сумма равных слагаемых. Её можно записать так: ' + fmt(a) + ' × ' + k + '. Здесь ' + fmt(a) + ' — множимое, ' + k + ' — множитель.', false);
    }
    return {
      kind: 'num', html: 'Найди значение суммы, заменив сложение умножением: ' + expr(terms.join(' + ') + ' ='), answer: a * k,
      hint: 'Одинаковые слагаемые можно заменить умножением: число умножь на количество слагаемых.',
      explain: 'Слагаемых ' + k + ', и все они равны ' + fmt(a) + '. Значит, сумма равна ' + fmt(a) + ' × ' + k + ' = ' + fmt(a * k) + '. Ответ: ' + fmt(a * k) + '.'
    };
  });

  /* названия чисел при умножении */
  var MUL_NAMES = ['множимое', 'множитель', 'произведение'];
  def('amMulNames', function (o) {
    var a, b, P, t = rand(0, 2), vals, gg = 0;
    do { a = pick([mk(2), mk(3), mk(3)]); b = rand(3, 9) + (Math.random() < 0.4 ? rand(1, 3) * 10 : 0); gg++; } while (gg < 40 && a === b);
    P = a * b; vals = [a, b, P];
    var eq = fmt(a) + ' × ' + b + ' = ' + fmt(P), right = MUL_NAMES[t];
    var wrong = MUL_NAMES.filter(function (x) { return x !== right; }).concat(distinctOptions(right, ['слагаемое', 'сумма', 'делимое', 'частное', 'разность'], 1));
    var expl = { 0: 'Множимое — число, которое умножают, то есть берут слагаемым несколько раз.', 1: 'Множитель показывает, сколько одинаковых слагаемых взято (на сколько умножаем).', 2: 'Произведение — результат умножения, сумма равных слагаемых.' }[t];
    return choiceQ('В равенстве ' + expr(eq) + ' число <b>' + fmt(vals[t]) + '</b> называется…', right, wrong,
      'Множимое умножают, множитель показывает, сколько раз, а произведение — результат.',
      'В записи «' + eq + '» число ' + fmt(vals[t]) + ' — ' + right + '. ' + expl, false);
  });

  /* формулировки: «увеличь в … раз», «найди произведение» */
  def('amMulWords', function (o) {
    var big = !!o.big, type = o.type || pick(['names', 'times', 'factors', 'mul', 'prod']), a, b;
    if (big) { a = o.ad ? mk(rangeArg(o.ad)) : pick([mk(3), mk(4), mk(4)]); b = mk(o.bd ? rangeArg(o.bd) : rand(2, 3), { zp: 0.2 }); } else { a = rand(12, 99); b = rand(3, 12); }
    if (a * b > 2e8) a = Math.floor(a / 10);
    var P = a * b, text, wa = fmt(a), wb = fmt(b);
    if (type === 'names') text = 'Множимое — ' + wa + ', множитель — ' + wb + '. Найди произведение.';
    else if (type === 'times') text = 'Число ' + wa + ' увеличь в ' + wb + ' ' + R.plural(b, ['раз', 'раза', 'раз']) + '.';
    else if (type === 'factors') text = 'Один из сомножителей — ' + wa + ', другой — ' + wb + '. Найди произведение.';
    else if (type === 'mul') text = 'Умножь ' + wa + ' на ' + wb + '.';
    else text = 'Найди произведение чисел ' + wa + ' и ' + wb + '.';
    var ex = big ? colExplain(a, b) : wa + ' × ' + wb + ' = ' + fmt(P) + '. Ответ: ' + fmt(P) + '.';
    return {
      kind: 'num', html: text + (big ? ' <span class="soft">Запиши решение столбиком.</span>' : ''), answer: P,
      hint: type === 'times' ? 'Увеличить число в несколько раз — значит умножить его на это число.' : 'Все эти слова обозначают одно действие — умножение.',
      explain: ex
    };
  });

  /* удобный порядок: 5 × 17 × 20 */
  var HANDY = { 100: [[5, 20], [4, 25], [2, 50]], 1000: [[8, 125], [25, 40], [4, 250], [2, 500], [20, 50]] };
  def('amMulHandy', function (o) {
    var lvl = o.round || pick([100, 100, 1000]), pr = pick(HANDY[lvl]), x = lvl === 100 ? rand(12, 99) : rand(13, 199), t = 0;
    while (x % 10 === 0 && t++ < 20) x = lvl === 100 ? rand(12, 99) : rand(13, 199);
    var order = Math.random() < 0.5 ? [pr[0], x, pr[1]] : [pr[1], x, pr[0]], P = x * lvl;
    return {
      kind: 'num', html: 'Вычисли удобным способом: ' + expr(order.join(' × ') + ' ='), answer: P,
      hint: 'От перестановки множителей произведение не меняется. Найди два множителя, которые дают круглое число, и умножь их первыми.',
      explain: order.join(' × ') + ' = (' + pr[0] + ' × ' + pr[1] + ') × ' + x + ' = ' + fmt(lvl) + ' × ' + x + ' = ' + fmt(P) + '.'
    };
  });

  /* проверка умножения: перестановкой или делением */
  def('amMulCheck', function (o) {
    var way = o.way || 'swap', mode = o.mode || 'verdict', a = mk(rand(2, 3)), b = mk(2), P, t = 0;
    while (a === b && t++ < 20) b = mk(2);
    P = a * b;
    if (way === 'swap' && mode === 'verdict') {
      var good = Math.random() < 0.5, r2 = good ? P : wrongProd(P);
      return choiceQ('Ученик умножил числа и проверил результат перестановкой множителей:<br>' + expr(fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(P)) + '<br>' + expr(fmt(b) + ' × ' + fmt(a) + ' = ' + fmt(r2)) + '<br>Что показывает проверка?',
        good ? 'Умножение выполнено верно' : 'Есть ошибка: результаты разные', good ? ['Есть ошибка: результаты разные'] : ['Умножение выполнено верно'],
        'Сравни два результата. Если числа умножили в другом порядке, а получилось то же самое, вычисление, скорее всего, верно.',
        good ? 'От перестановки множителей произведение не меняется. Оба результата равны ' + fmt(P) + ' — значит, умножение выполнено верно.'
          : 'Произведение не должно меняться от перестановки множителей, а здесь результаты разные (' + fmt(P) + ' и ' + fmt(r2) + '). Значит, где-то ошибка. Верно: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(P) + '.', true);
    }
    if (way === 'swap') {
      var first = Math.random() < 0.5, w = wrongProd(P), r1 = first ? P : w, r2b = first ? w : P;
      return {
        kind: 'num', html: 'Ученик умножил ' + expr(fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(r1)) + ', а при проверке перестановкой получил ' + expr(fmt(b) + ' × ' + fmt(a) + ' = ' + fmt(r2b)) + '. Результаты разные. Найди верное произведение.',
        answer: P, hint: 'Одно из вычислений неверно. Умножь числа сам.',
        explain: 'Результаты ' + fmt(r1) + ' и ' + fmt(r2b) + ' различаются — в одном из вычислений ошибка. Пересчитаем:' + R.mulHTML(a >= b ? a : b, a >= b ? b : a) + '<span class="colsteps">' + R.mulSteps(a >= b ? a : b, a >= b ? b : a).join('<br>') + '</span>Верно: ' + fmt(P) + '.'
      };
    }
    /* проверка делением */
    var wr = wrongProd(P);
    return {
      kind: 'num', html: 'Ученик записал ' + expr(fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(wr)) + '. Проверь умножение делением и найди верное произведение.',
      answer: P, hint: 'Раздели произведение на один из множителей. Если умножение верно, получится другой множитель.',
      explain: 'Проверяем: ' + fmt(wr) + ' : ' + fmt(b) + (wr % b === 0 ? ' = ' + fmt(wr / b) + ', а должно получиться ' + fmt(a) : ' — нацело не делится, а при верном умножении делилось бы без остатка') + '. Значит, произведение найдено неверно. Считаем заново: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(P) + '. Проверка: ' + fmt(P) + ' : ' + fmt(b) + ' = ' + fmt(a) + '. Ответ: ' + fmt(P) + '.'
    };
  });

  /* сколько неполных произведений */
  def('amMulPartials', function (o) {
    var a, b, g = 0;
    do { a = mk(rand(3, 4)); b = mk(rand(3, 4), { zero: true }); g++; } while (g < 60 && (nz(a) === nz(b) || nz(b) >= nz(a)));
    var na = nz(a), nb = nz(b);
    return {
      kind: 'nums', html: 'Сколько неполных произведений (строк, кроме нулевых) надо записать при умножении столбиком, если множители записаны так: ' + expr(fmt(a) + ' × ' + fmt(b)) + ' и так: ' + expr(fmt(b) + ' × ' + fmt(a)) + '?',
      fields: [{ label: fmt(a) + ' × ' + fmt(b) }, { label: fmt(b) + ' × ' + fmt(a) }], answer: [nb, na],
      hint: 'Каждая ненулевая цифра второго множителя даёт одну строку. Нулевую цифру пропускаем.',
      explain: 'В записи ' + fmt(a) + ' × ' + fmt(b) + ' второй множитель ' + fmt(b) + ' имеет ' + nb + ' ' + R.plural(nb, ['ненулевую цифру', 'ненулевые цифры', 'ненулевых цифр']) + ' — значит, ' + nb + ' ' + R.plural(nb, ['строка', 'строки', 'строк']) + '. В записи ' + fmt(b) + ' × ' + fmt(a) + ' второй множитель ' + fmt(a) + ' даёт ' + na + ' ' + R.plural(na, ['строку', 'строки', 'строк']) + '. Ответ: ' + nb + ' и ' + na + '. Удобнее записать сверху ' + fmt(a) + ', а снизу ' + fmt(b) + '.'
    };
  });

  /* какая запись удобнее */
  def('amMulOrder', function (o) {
    var a, b, g = 0;
    do { a = mk(rand(3, 4)); b = mk(rand(2, 3), { zero: Math.random() < 0.6 }); g++; } while (g < 80 && (nz(a) === nz(b) || a === b));
    var few = nz(a) < nz(b) ? a : b, many = few === a ? b : a;
    var right = fmt(many) + ' × ' + fmt(few), wrong = fmt(few) + ' × ' + fmt(many), nm = nz(many), nf = nz(few);
    var sw = function (s) { return s.replace(/ × /, NB + '×' + NB); }, order = shuffle([right, wrong]), rightIsFirst = order[0] === right;
    return choiceQ('Как удобнее записать множители для умножения столбиком: ' + expr(sw(order[0])) + ' (первая запись) или ' + expr(sw(order[1])) + ' (вторая запись)?',
      rightIsFirst ? 'Первая запись' : 'Вторая запись', [rightIsFirst ? 'Вторая запись' : 'Первая запись', 'Всё равно, строк будет поровну'],
      'Посчитай ненулевые цифры в нижнем множителе: сколько их, столько строк придётся писать.',
      'От перестановки множителей произведение не меняется, а строк может стать меньше. В записи ' + right + ' нижний множитель ' + fmt(few) + ' даёт ' + nf + ' ' + R.plural(nf, ['строку', 'строки', 'строк']) + ', в записи ' + wrong + ' — ' + nm + '. Удобнее ' + right + ' (' + (rightIsFirst ? 'первая' : 'вторая') + ' запись).', true);
  });

  /* ---------- числа, оканчивающиеся нулями ---------- */
  /* o.mode: 'tiny' (устно: 60 × 90), 'one' (нули только у одного), 'both' (у обоих), 'mid' (ещё и нуль внутри) */
  def('amTrailMul', function (o) {
    var mode = o.mode || pick(['one', 'both', 'both', 'mid']), a, b, z1, z2, d1, d2, P, g = 0;
    if (mode === 'tiny') {
      d1 = rand(2, 9); d2 = rand(2, 9); z1 = rand(1, 3); z2 = rand(1, 2);
      if (Math.random() < 0.5) { var tz = z1; z1 = z2; z2 = tz; }
      a = d1 * pw10(z1); b = d2 * pw10(z2); P = a * b;
      var Z = z1 + z2;
      return {
        kind: 'num', html: expr(fmt(a) + ' × ' + fmt(b) + ' ='), answer: P,
        hint: 'Умножь числа без нулей, а потом припиши справа все нули.',
        explain: fmt(a) + ' × ' + fmt(b) + ': ' + d1 + ' × ' + d2 + ' = ' + (d1 * d2) + ', нулей в множителях всего ' + Z + ' (' + z1 + ' и ' + z2 + '), приписываем их: ' + fmt(P) + '.'
      };
    }
    do {
      if (mode === 'one') {
        var zz = rand(1, 3);
        if (Math.random() < 0.5) { a = mk(rand(2, 3)) * pw10(zz); b = mk(rand(1, 2)); if (b < 2) b = rand(2, 9); }
        else { b = mk(rand(2, 3)) * pw10(zz); a = mk(rand(2, 3)); }
      } else if (mode === 'mid') {
        a = mk(rand(3, 4), { zero: true }) * pw10(rand(0, 2)); b = mk(rand(1, 3), { zero: Math.random() < 0.6 }) * pw10(rand(0, 2));
        if (trailZ(a) + trailZ(b) === 0) a *= 10;
      } else {
        a = mk(rand(2, 3)) * pw10(rand(1, 2)); b = mk(rand(1, 3)) * pw10(rand(1, 2));
      }
      if (b < 2) b = rand(2, 9) * pw10(1);
      P = a * b; g++;
    } while (g < 60 && (P > 2e9 || a === b));
    return {
      kind: 'num', html: 'Вычисли: ' + expr(fmt(a) + ' × ' + fmt(b) + ' ='), answer: P,
      hint: 'Отбрось нули на конце каждого множителя, перемножь оставшиеся числа, а потом припиши справа все отброшенные нули.',
      explain: 'Нули оставляем в стороне:' + R.amTrailHTML(a, b) + '<span class="colsteps">' + R.amTrailSteps(a, b).join('<br>') + '</span>Ответ: ' + num(P) + '.'
    };
  });

  /* сколько нулей на конце произведения */
  def('amTrailCount', function (o) {
    var a1, b1, z1, z2, g = 0, wantZero = Math.random() < 0.5;
    do {
      a1 = rand(2, 99); b1 = rand(2, 99); z1 = rand(0, 3); z2 = rand(0, 3);
      g++;
    } while (g < 400 && (a1 % 10 === 0 || b1 % 10 === 0 || z1 + z2 === 0 || ((a1 * b1) % 10 === 0) !== wantZero || a1 * b1 > 9999));
    var a = a1 * pw10(z1), b = b1 * pw10(z2), P = a * b, ans = trailZ(P), t = trailZ(a1 * b1), core = a1 * b1;
    return {
      kind: 'num', html: 'Сколько нулей стоит на конце произведения ' + expr(fmt(a) + ' × ' + fmt(b)) + '?', answer: ans,
      hint: 'Считай нули на концах множителей, но посмотри и на произведение чисел без нулей: оно тоже может оканчиваться нулями.',
      explain: 'На концах множителей нулей: ' + z1 + ' и ' + z2 + ', всего ' + (z1 + z2) + '. Умножим числа без нулей: ' + a1 + ' × ' + b1 + ' = ' + fmt(core) +
        (t ? ' — на конце ' + t + ' ' + zeroWord(t) + ' (их тоже считаем)' : ' — нулей на конце нет') + '. Всего нулей: ' + ans + '. Проверка: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(P) + '.'
    };
  });

  /* 3 400 × 250 = 34 × 25 × □ */
  def('amTrailBreak', function (o) {
    var a1 = rand(2, 99), b1 = rand(2, 99), z1 = rand(0, 3), z2 = rand(0, 3), t = 0;
    while ((a1 % 10 === 0 || b1 % 10 === 0 || z1 + z2 === 0) && t++ < 50) { a1 = rand(2, 99); b1 = rand(2, 99); z1 = rand(0, 3); z2 = rand(0, 3); }
    if (z1 + z2 === 0) z1 = 2;
    var a = a1 * pw10(z1), b = b1 * pw10(z2), Z = z1 + z2, parts = [];
    if (z1) parts.push(fmt(a) + ' = ' + a1 + ' × ' + fmt(pw10(z1)));
    if (z2) parts.push(fmt(b) + ' = ' + b1 + ' × ' + fmt(pw10(z2)));
    return {
      kind: 'num', html: 'Впиши пропущенное число: ' + expr(fmt(a) + ' × ' + fmt(b) + ' = ' + a1 + ' × ' + b1 + ' × □'), answer: pw10(Z),
      hint: 'Представь каждый множитель как число без нулей, умноженное на 10, 100 или 1 000.',
      explain: parts.join('; ') + '. Значит, ' + fmt(a) + ' × ' + fmt(b) + ' = ' + a1 + ' × ' + b1 + ' × ' + (z1 ? fmt(pw10(z1)) : '') + (z1 && z2 ? ' × ' + fmt(pw10(z2)) + ' = ' + a1 + ' × ' + b1 + ' × ' + fmt(pw10(Z)) : (z2 ? fmt(pw10(z2)) : '')) + '. Ответ: ' + fmt(pw10(Z)) + '.'
    };
  });

  /* ---------- неизвестный множитель ---------- */
  def('amUnkFactor', function (o) {
    var form = o.form || pick(['eq', 'eq', 'words']), dk = rangeArg(o.d, [2, 2]), dx = rangeArg(o.x, [2, 3]), kn, x, P, g = 0;
    do {
      kn = mk(dk); if (kn < 2) kn = rand(2, 9); x = o.round ? mk(Math.max(1, dx - 1)) * 10 : mk(dx, { zp: 0.2 }); P = kn * x; g++;
    } while (g < 40 && (P > 3e6 || kn === x || x < 2));
    var text, hint, side = Math.random() < 0.5, title;
    if (form === 'eq') {
      text = 'Найди неизвестный множитель: ' + expr(side ? '□ × ' + fmt(kn) + ' = ' + fmt(P) : fmt(kn) + ' × □ = ' + fmt(P));
    } else {
      var v = rand(0, 2);
      if (v === 0) text = 'Множимое — ' + fmt(kn) + ', произведение — ' + fmt(P) + '. Найди множитель.';
      else if (v === 1) text = 'Множитель — ' + fmt(kn) + ', произведение — ' + fmt(P) + '. Найди множимое.';
      else text = 'Произведение двух чисел равно ' + fmt(P) + '. Один из множителей — ' + fmt(kn) + '. Найди другой множитель.';
    }
    return {
      kind: 'num', html: text, answer: x,
      hint: 'Чтобы найти неизвестный множитель, надо произведение разделить на известный множитель.',
      explain: 'Неизвестный множитель равен произведению, делённому на известный множитель: ' + fmt(P) + ' : ' + fmt(kn) + ' = ' + fmt(x) + '.' +
        R.divHTML(P, kn) + '<span class="colsteps">' + R.divSteps(P, kn).join('<br>') + '</span>Проверка: ' + fmt(x) + ' × ' + fmt(kn) + ' = ' + fmt(P) + '. Ответ: ' + fmt(x) + '.'
    };
  });

  /* умножение на 0 и на 1 */
  def('amMulSpecial', function (o) {
    var type = o.type || pick(['mul', 'mul', 'unk']), a = pick([rand(12, 99), rand(101, 999), rand(11, 99)]);
    if (type === 'mul') {
      var v = rand(0, 3), t, ans, why;
      if (v === 0) { t = fmt(a) + ' × 1'; ans = a; why = 'При умножении на 1 число не меняется.'; }
      else if (v === 1) { t = '1 × ' + fmt(a); ans = a; why = 'Единица, умноженная на число, даёт это число: 1 × a = a.'; }
      else if (v === 2) { t = fmt(a) + ' × 0'; ans = 0; why = 'При умножении на 0 получается 0.'; }
      else { t = '0 × ' + fmt(a); ans = 0; why = 'Нуль, умноженный на любое число, — нуль.'; }
      return { kind: 'num', html: expr(t + ' ='), answer: ans, hint: 'Вспомни, что получается, если умножить число на 1 и на 0.', explain: t + ' = ' + ans + '. ' + why };
    }
    var w = rand(0, 3), tx, ans2, why2;
    if (w === 0) { tx = '□ × 1 = ' + fmt(a); ans2 = a; why2 = 'Число, умноженное на 1, не меняется, поэтому неизвестное число равно ' + fmt(a) + '.'; }
    else if (w === 1) { tx = fmt(a) + ' × □ = ' + fmt(a); ans2 = 1; why2 = 'Чтобы произведение равнялось множимому, множитель должен быть равен 1.'; }
    else if (w === 2) { tx = fmt(a) + ' × □ = 0'; ans2 = 0; why2 = 'Произведение равно нулю, только если один из множителей нуль. Здесь ' + fmt(a) + ' не нуль, значит, неизвестный множитель равен 0.'; }
    else { tx = '□ × ' + fmt(a) + ' = ' + fmt(a); ans2 = 1; why2 = 'Множитель равен 1: тогда произведение совпадает с другим множителем.'; }
    return { kind: 'num', html: 'Найди неизвестный множитель: ' + expr(tx), answer: ans2, hint: 'Подумай, на какое число надо умножить, чтобы число не изменилось или получился нуль.', explain: why2 + ' Ответ: ' + ans2 + '.' };
  });

  /* приписать нули */
  def('amZeroEffect', function (o) {
    var type = o.type || pick(['append', 'times', 'howmany']), n = pick([rand(12, 99), rand(101, 999), rand(11, 99)]), z = rand(1, 3), zw = ['один нуль', 'два нуля', 'три нуля'][z - 1];
    if (type === 'append') {
      return { kind: 'num', html: 'Припиши справа ' + zw + ' к числу ' + num(n) + '. Какое число получилось?', answer: n * pw10(z), hint: 'Приписать справа нуль — то же, что умножить на 10.',
        explain: fmt(n) + ' и ' + zw + ' справа: ' + fmt(n * pw10(z)) + '. Число увеличилось в ' + fmt(pw10(z)) + ' раз.' };
    }
    if (type === 'times') {
      return { kind: 'num', html: 'Во сколько раз увеличится число ' + num(n) + ', если приписать справа ' + zw + '?', answer: pw10(z), hint: 'Один нуль справа — это ×10, два нуля — ×100.',
        explain: fmt(n) + ' → ' + fmt(n * pw10(z)) + ': ' + fmt(n * pw10(z)) + ' : ' + fmt(n) + ' = ' + fmt(pw10(z)) + '. Приписали ' + zw + ' — число выросло в ' + fmt(pw10(z)) + ' раз.' };
    }
    return { kind: 'num', html: 'Сколько нулей надо приписать справа к числу ' + num(n) + ', чтобы увеличить его в ' + num(pw10(z)) + ' ' + R.plural(pw10(z), ['раз', 'раза', 'раз']) + '?', answer: z, hint: 'Сколько нулей в числе 10, 100, 1 000?',
      explain: 'Увеличить в ' + fmt(pw10(z)) + ' раз — значит умножить на ' + fmt(pw10(z)) + '. В этом числе ' + z + ' ' + zeroWord(z) + ', столько же нулей и приписываем: ' + fmt(n * pw10(z)) + '.' };
  });

  /* вопросы на понимание */
  var FACTS = [
    ['def', 'Число, которое при умножении берут слагаемым несколько раз, называется…', 'множимое', ['множитель', 'произведение', 'частное'], 'Множимое — то число, которое умножают, то есть повторяют слагаемым.'],
    ['def', 'Число, которое показывает, сколько одинаковых слагаемых взято, называется…', 'множитель', ['множимое', 'произведение', 'сумма'], 'Множитель показывает, сколько раз число взято слагаемым.'],
    ['def', 'Результат умножения называется…', 'произведение', ['сумма', 'частное', 'разность'], 'Результат умножения — произведение.'],
    ['def', 'Множимое и множитель вместе называют…', 'сомножителями', ['слагаемыми', 'делителями', 'произведениями'], 'Числа, которые умножают, называют сомножителями, или просто множителями.'],
    ['def', 'Произведение — это…', 'сумма равных слагаемых', ['сумма любых слагаемых', 'разность двух чисел', 'частное двух чисел'], 'Умножение заменяет сложение одинаковых слагаемых, поэтому произведение — это сумма равных слагаемых.'],
    ['prop', 'Как изменится произведение, если множители поменять местами?', 'не изменится', ['увеличится', 'уменьшится', 'станет равно нулю'], 'Это переместительное свойство умножения: a × b = b × a.'],
    ['prop', 'Какое равенство записывает переместительное свойство умножения?', 'a × b = b × a', ['a × b = a + b', 'a × b = a : b', 'a × 1 = 1'], 'Переместительное свойство: от перестановки множителей произведение не меняется.'],
    ['prop', 'Чему равно произведение любого числа и нуля?', 'нулю', ['этому числу', 'единице', 'десяти'], 'Число, умноженное на нуль, даёт нуль.'],
    ['prop', 'Чему равно произведение любого числа и единицы?', 'этому числу', ['нулю', 'единице', 'удвоенному числу'], 'При умножении на 1 число не меняется.'],
    ['prop', 'Когда произведение равно множимому?', 'когда множитель равен 1', ['когда множитель равен 0', 'когда множитель равен 2', 'никогда'], 'Если множитель равен 1, произведение совпадает с множимым.'],
    ['prop', 'Когда произведение равно нулю?', 'когда хотя бы один множитель равен 0', ['когда оба множителя равны 1', 'когда один из множителей равен 1', 'никогда'], 'Произведение равно нулю, если хотя бы один из множителей нуль.'],
    ['check', 'Как проверить умножение перестановкой множителей?', 'перемножить те же числа в другом порядке — результаты должны совпасть', ['сложить множители', 'вычесть меньший множитель из большего', 'разделить произведение на 10'], 'От перестановки произведение не меняется, поэтому два результата должны быть равны.'],
    ['check', 'Как проверить умножение делением?', 'разделить произведение на один из множителей — получится другой множитель', ['разделить множитель на произведение', 'вычесть из произведения оба множителя', 'сложить множители и разделить на 2'], 'Деление — действие, обратное умножению.'],
    ['unk', 'Как найти неизвестный множитель?', 'разделить произведение на известный множитель', ['умножить произведение на известный множитель', 'вычесть известный множитель из произведения', 'сложить произведение и известный множитель'], 'Каждый множитель равен произведению, делённому на другой множитель.'],
    ['unk', 'Как найти неизвестное множимое, если известны множитель и произведение?', 'разделить произведение на множитель', ['умножить произведение на множитель', 'вычесть множитель из произведения', 'сложить множитель и произведение'], 'Множимое равно произведению, делённому на множитель.'],
    ['unk', 'Какое действие обратно умножению?', 'деление', ['сложение', 'вычитание', 'возведение в степень'], 'Умножение и деление — обратные действия.'],
    ['zeros', 'Как изменится число, если приписать к нему справа один нуль?', 'увеличится в 10 раз', ['увеличится на 10', 'уменьшится в 10 раз', 'не изменится'], 'Приписать один нуль справа — значит умножить на 10.'],
    ['zeros', 'Как умножить два числа, оканчивающиеся нулями?', 'перемножить числа без нулей и приписать справа все нули', ['сложить числа и приписать нули', 'приписать нули к каждому числу и перемножить', 'перемножить числа и убрать нули'], 'Нули можно отложить в сторону и приписать в конце, потому что 10, 100, 1 000 — множители, которые можно переставлять.'],
    ['zeros', 'Произведение 3 400 × 250 равно 34 × 25 × …', '1 000', ['100', '10', '10 000'], '3 400 = 34 × 100, 250 = 25 × 10; 100 × 10 = 1 000.']
  ];
  def('amMulFacts', function (o) {
    var pool = FACTS.filter(function (f) { return !o.topics || o.topics.indexOf(f[0]) >= 0; }), f = pick(pool);
    return choiceQ(f[1], f[2], f[3], 'Вспомни правило из теории урока.', 'Правильный ответ: ' + f[2] + '. ' + f[4], f[2].length > 12);
  });

  /* выражения с умножением */
  def('amExprMul', function (o) {
    var kind = o.kind || rand(1, 6), a, b, c, d, tk, g = 0, ev;
    do {
      if (kind === 1) { a = rand(101, 999); b = rand(12, 99); c = rand(200, 9999); tk = [a, '×', b, '+', c]; }
      else if (kind === 2) { a = rand(101, 999); b = rand(12, 99); c = rand(12, 99); d = rand(12, 99); tk = [a, '×', b, '−', c, '×', d]; }
      else if (kind === 3) { a = rand(101, 999); b = rand(101, 999); c = rand(12, 99); tk = ['(', a, '+', b, ')', '×', c]; }
      else if (kind === 4) { a = rand(1001, 9999); b = rand(101, 999); c = rand(12, 99); tk = ['(', a, '−', b, ')', '×', c]; }
      else if (kind === 5) { a = rand(10001, 99999); b = rand(101, 999); c = rand(12, 99); tk = [a, '−', b, '×', c]; }
      else { c = rand(12, 60); var q = rand(12, 99); a = c * q; b = rand(12, 99); tk = [a, ':', c, '×', b]; }
      ev = R.evalSteps(tk); g++;
    } while (g < 60 && (!ev.ok || ev.value <= 0 || ev.value > 1e8));
    return {
      kind: 'num', html: 'Найди значение выражения: ' + expr(et(tk) + ' ='), answer: ev.value,
      hint: 'Сначала действия в скобках, потом умножение и деление слева направо, в конце сложение и вычитание.',
      explain: steps(ev.steps.map(function (s) { return s.text; }), fmt(ev.value))
    };
  });

  /* ==================================================================
     ЗАДАЧИ НА УМНОЖЕНИЕ: сюжеты «множимое × множитель = произведение»
     ================================================================== */
  function genPl(n, f) { return (n % 10 === 1 && n % 100 !== 11) ? f[1] : f[2]; }
  function stepPick(lo, hi, st) { st = st || 1; return lo + st * rand(0, Math.floor((hi - lo) / st)); }
  function hrs(k) { return R.plural(k, ['час', 'часа', 'часов']); }
  function timesW(k) { return R.plural(k, ['раз', 'раза', 'раз']); }
  function nn(n, forms) { return fmt(n) + NB + R.plural(n, forms); }
  function round10(n) { return Math.max(10, Math.round(n / 10) * 10); }
  /* единица в строке «Ответ: N …»: слова из списка склоняем по числу, сокращения (м, кг, руб.) оставляем */
  var UNIT_FORMS = {
    'кирпичей': ['кирпич', 'кирпича', 'кирпичей'], 'деталей': ['деталь', 'детали', 'деталей'], 'книг': ['книга', 'книги', 'книг'], 'билетов': ['билет', 'билета', 'билетов'],
    'зрителей': ['зритель', 'зрителя', 'зрителей'], 'кустов': ['куст', 'куста', 'кустов'], 'велосипедов': ['велосипед', 'велосипеда', 'велосипедов']
  };
  function unitW(u, n) { return UNIT_FORMS[u] ? R.plural(n, UNIT_FORMS[u]) : u; }

  var PERSONS = [
    { n: 'Ученик', l: 'ученик', v: 'купил', pay: 'заплатил' }, { n: 'Оля', l: 'Оля', v: 'купила', pay: 'заплатила' },
    { n: 'Миша', l: 'Миша', v: 'купил', pay: 'заплатил' }, { n: 'Мама', l: 'мама', v: 'купила', pay: 'заплатила' }
  ];
  var ORGS = [
    { n: 'Школа', l: 'школа', v: 'купила', pay: 'заплатила' }, { n: 'Класс', l: 'класс', v: 'купил', pay: 'заплатил' },
    { n: 'Магазин', l: 'магазин', v: 'закупил', pay: 'заплатил' }, { n: 'Библиотека', l: 'библиотека', v: 'купила', pay: 'заплатила' }
  ];
  var ITEMS = [
    { f: ['карандаш', 'карандаша', 'карандашей'], pl: 'карандаши', o: 'один карандаш', p: [12, 48, 1] },
    { f: ['тетрадь', 'тетради', 'тетрадей'], pl: 'тетради', o: 'одна тетрадь', p: [18, 90, 1] },
    { f: ['альбом', 'альбома', 'альбомов'], pl: 'альбомы', o: 'один альбом', p: [60, 240, 5] },
    { f: ['книга', 'книги', 'книг'], pl: 'книги', o: 'одна книга', p: [120, 580, 10] },
    { f: ['мяч', 'мяча', 'мячей'], pl: 'мячи', o: 'один мяч', p: [250, 1200, 50] },
    { f: ['футболка', 'футболки', 'футболок'], pl: 'футболки', o: 'одна футболка', p: [300, 900, 50] },
    { f: ['линейка', 'линейки', 'линеек'], pl: 'линейки', o: 'одна линейка', p: [15, 60, 1] }
  ];
  var VEH = [
    { n: 'Поезд', l: 'поезд', g: 'поезда', v: 'шёл', d: 'прошёл', a: [60, 120, 5], t: [3, 16] },
    { n: 'Автобус', l: 'автобус', g: 'автобуса', v: 'ехал', d: 'проехал', a: [45, 90, 5], t: [2, 12] },
    { n: 'Автомобиль', l: 'автомобиль', g: 'автомобиля', v: 'ехал', d: 'проехал', a: [60, 110, 5], t: [2, 10] },
    { n: 'Теплоход', l: 'теплоход', g: 'теплохода', v: 'плыл', d: 'проплыл', a: [20, 40, 1], t: [4, 24] },
    { n: 'Самолёт', l: 'самолёт', g: 'самолёта', v: 'летел', d: 'пролетел', a: [600, 900, 10], t: [2, 10] },
    { n: 'Велосипедист', l: 'велосипедист', g: 'велосипедиста', v: 'ехал', d: 'проехал', a: [12, 24, 1], t: [2, 8] },
    { n: 'Пешеход', l: 'пешеход', g: 'пешехода', v: 'шёл', d: 'прошёл', a: [4, 6, 1], t: [2, 9] },
    { n: 'Грузовик', l: 'грузовик', g: 'грузовика', v: 'ехал', d: 'проехал', a: [45, 80, 5], t: [3, 12] }
  ];
  var RATES = [
    { s: 'Завод', l: 'завод', ip: 'выпускал', pf: 'выпустил', it: ['деталь', 'детали', 'деталей'], a: [40, 600, 10], k: [8, 30] },
    { s: 'Пекарня', l: 'пекарня', ip: 'выпекала', pf: 'выпекла', it: ['батон', 'батона', 'батонов'], a: [200, 900, 10], k: [6, 30] },
    { s: 'Типография', l: 'типография', ip: 'печатала', pf: 'напечатала', it: ['книга', 'книги', 'книг'], a: [300, 2000, 50], k: [6, 30] },
    { s: 'Птицеферма', l: 'птицеферма', ip: 'собирала', pf: 'собрала', it: ['яйцо', 'яйца', 'яиц'], a: [500, 3000, 50], k: [6, 30] },
    { s: 'Оля', l: 'Оля', ip: 'читала', pf: 'прочитала', it: ['страница', 'страницы', 'страниц'], a: [12, 60, 1], k: [5, 30] },
    { s: 'Кирпичный завод', l: 'завод', ip: 'выпускал', pf: 'выпустил', it: ['кирпич', 'кирпича', 'кирпичей'], a: [3000, 12000, 500], k: [6, 30] }
  ];
  var BOXES = [
    { wd: 'масса яблок', c: ['ящик', 'ящика', 'ящиков'], each: 'В каждом ящике', loc: 'ящиках', one: 'одном ящике', what: 'яблок', u: 'кг', uf: 'килограммов', a: [12, 30, 1], k: [8, 60] },
    { wd: 'масса картофеля', c: ['мешок', 'мешка', 'мешков'], each: 'В каждом мешке', loc: 'мешках', one: 'одном мешке', what: 'картофеля', u: 'кг', uf: 'килограммов', a: [30, 50, 1], k: [10, 90] },
    { wd: 'масса угля', c: ['вагон', 'вагона', 'вагонов'], each: 'В каждом вагоне', loc: 'вагонах', one: 'одном вагоне', what: 'угля', u: 'т', uf: 'тонн', a: [60, 68, 1], k: [8, 60] },
    { wd: 'длина ткани', c: ['рулон', 'рулона', 'рулонов'], each: 'В каждом рулоне', loc: 'рулонах', one: 'одном рулоне', what: 'ткани', u: 'м', uf: 'метров', a: [30, 90, 5], k: [12, 80] },
    { wd: 'объём воды', c: ['бочка', 'бочки', 'бочек'], each: 'В каждой бочке', loc: 'бочках', one: 'одной бочке', what: 'воды', u: 'л', uf: 'литров', a: [100, 200, 10], k: [6, 40] },
    { wd: 'число карандашей', c: ['коробка', 'коробки', 'коробок'], each: 'В каждой коробке', loc: 'коробках', one: 'одной коробке', cnt: ['карандаш', 'карандаша', 'карандашей'], a: [12, 60, 1], k: [8, 90] },
    { wd: 'число тетрадей', c: ['пачка', 'пачки', 'пачек'], each: 'В каждой пачке', loc: 'пачках', one: 'одной пачке', cnt: ['тетрадь', 'тетради', 'тетрадей'], a: [10, 40, 2], k: [10, 80] }
  ];

  /* сцена: {A, K, P, q:{prod, A, K}, w:{A, K, P}, ans:{A, K, P}} — A множимое, K множитель, P произведение */
  function mkScene(fam, o) {
    o = o || {};
    var size = o.size, zA = o.zeros === 'A' || o.zeros === 'both', zK = o.zeros === 'K' || o.zeros === 'both', g = 0, sc, A, K, P;
    function kIn(rng) {
      var r = size === 'small' ? [3, 9] : size === 'mid' ? [12, 48] : size === 'big' ? [24, 96] : rng, k = rand(r[0], r[1]);
      if (zK && k >= 20) k = Math.round(k / 10) * 10;
      return k;
    }
    do {
      sc = { q: {}, w: {}, ans: {} };
      if (fam === 'price') {
        var it = pick(ITEMS);
        A = stepPick(it.p[0], it.p[1], it.p[2]); if (zA) A = round10(A);
        K = kIn([3, 12]); P = A * K;
        var ag = K <= 12 ? pick(PERSONS) : pick(ORGS);
        sc.q.prod = ag.n + ' ' + ag.v + ' ' + nn(K, it.f) + ' по ' + fmt(A) + NB + 'руб. Сколько рублей ' + ag.pay + ' ' + ag.l + '?';
        sc.q.A = ag.n + ' ' + ag.v + ' ' + nn(K, it.f) + ' одной цены и ' + ag.pay + ' за них ' + fmt(P) + NB + 'руб. Сколько рублей стоит ' + it.o + '?';
        sc.q.K = ag.n + ' ' + ag.v + ' ' + it.pl + ' по ' + fmt(A) + NB + 'руб. и ' + ag.pay + ' за них ' + fmt(P) + NB + 'руб. Сколько ' + it.f[2] + ' ' + ag.v + ' ' + ag.l + '?';
        sc.w = { A: 'цена', K: 'количество', P: 'стоимость' };
        sc.ans = { A: fmt(A) + NB + 'руб.', K: nn(K, it.f), P: fmt(P) + NB + 'руб.' };
      } else if (fam === 'speed') {
        var v = pick(zA ? VEH.filter(function (x) { return x.a[0] >= 20; }) : VEH);
        A = stepPick(v.a[0], v.a[1], v.a[2]); if (zA) A = round10(A);
        K = size === 'small' ? rand(2, Math.min(9, v.t[1])) : rand(v.t[0], v.t[1]); P = A * K;
        sc.q.prod = v.n + ' ' + v.v + ' ' + K + ' ' + hrs(K) + ' со скоростью ' + fmt(A) + NB + 'км в час. Сколько километров ' + v.d + ' ' + v.l + '?';
        sc.q.A = 'За ' + K + ' ' + hrs(K) + ' ' + v.l + ' ' + v.d + ' ' + fmt(P) + NB + 'км, двигаясь с одной и той же скоростью. Найди скорость ' + v.g + ' в километрах в час.';
        sc.q.K = v.n + ' ' + v.v + ' со скоростью ' + fmt(A) + NB + 'км в час и ' + v.d + ' ' + fmt(P) + NB + 'км. Сколько часов ' + v.l + ' был в пути?';
        sc.w = { A: 'скорость', K: 'время', P: 'путь' };
        sc.ans = { A: fmt(A) + NB + 'км/ч', K: K + NB + 'ч', P: fmt(P) + NB + 'км' };
      } else if (fam === 'rate') {
        var r = pick(RATES);
        A = stepPick(r.a[0], r.a[1], r.a[2]); if (zA) A = round10(A);
        K = kIn(r.k); P = A * K;
        var dn = R.plural(K, ['день', 'дня', 'дней']);
        sc.q.prod = r.s + ' каждый день ' + r.ip + ' ' + nn(A, r.it) + '. Сколько ' + r.it[2] + ' ' + r.pf + ' ' + r.l + ' за ' + K + ' ' + dn + '?';
        sc.q.A = 'За ' + K + ' ' + dn + ' ' + r.l + ' ' + r.pf + ' ' + nn(P, r.it) + ', каждый день поровну. Сколько ' + r.it[2] + ' ' + r.ip + ' ' + r.l + ' в день?';
        sc.q.K = r.s + ' каждый день ' + r.ip + ' ' + nn(A, r.it) + '. За сколько дней ' + r.l + ' ' + r.pf + ' ' + nn(P, r.it) + '?';
        sc.w = { A: 'норма в день', K: 'число дней', P: 'всего за эти дни' };
        sc.ans = { A: nn(A, r.it), K: K + NB + dn, P: nn(P, r.it) };
      } else {
        var b = pick(BOXES), qty = function (x) { return b.cnt ? fmt(x) + NB + R.plural(x, b.cnt) : fmt(x) + NB + b.u + ' ' + b.what; };
        A = stepPick(b.a[0], b.a[1], b.a[2]); if (zA && A >= 20) A = Math.round(A / 10) * 10;
        K = kIn(b.k); P = A * K;
        var what = b.cnt ? b.cnt[2] : b.uf + ' ' + b.what;
        sc.q.prod = b.each + (b.cnt ? ' ' : ' по ') + qty(A) + '. Сколько ' + what + ' в ' + K + ' таких ' + b.loc + '?';
        sc.q.A = 'В ' + K + ' одинаковых ' + b.loc + ' ' + qty(P) + '. Сколько ' + what + ' в ' + b.one + '?';
        sc.q.K = b.each + (b.cnt ? ' ' : ' по ') + qty(A) + '. Сколько ' + b.c[2] + ' потребуется для ' + (b.cnt ? fmt(P) + NB + genPl(P, b.cnt) : fmt(P) + NB + b.u + ' ' + b.what) + '?';
        sc.w = { A: b.wd + ' в ' + b.one, K: 'число ' + b.c[2], P: b.wd + ' во всех ' + b.loc };
        sc.ans = { A: qty(A), K: nn(K, b.c), P: qty(P) };
      }
      g++;
    } while (g < (o.amax ? 400 : 30) && (P > 3e6 || (o.amax && A > o.amax)));
    sc.A = A; sc.K = K; sc.P = P; sc.fam = fam;
    return sc;
  }

  /* множимое, множитель, произведение: 18 × 5 = 90; какое из чисел неизвестно */
  def('amProdTrio', function (o) {
    var fam = o.fam || pick(['price', 'speed', 'rate', 'box']), find = o.find || pick(['prod', 'A', 'K']);
    if (Array.isArray(fam)) fam = pick(fam);
    if (Array.isArray(find)) find = pick(find);
    var sc = mkScene(fam, o), w = sc.w, A = sc.A, K = sc.K, P = sc.P, ans, formula, calc, known, hint;
    if (find === 'prod') {
      ans = P; formula = cap(w.P) + ' = ' + w.A + ' × ' + w.K; calc = fmt(A) + ' × ' + fmt(K) + ' = ' + fmt(P);
      known = 'Известны множимое (' + w.A + ') и множитель (' + w.K + '). Нужно найти произведение (' + w.P + '): множимое умножаем на множитель.';
      hint = 'Известно: ' + w.A + ' и ' + w.K + '. Неизвестно: ' + w.P + ' — это произведение. Каким действием его находят?';
    } else if (find === 'A') {
      ans = A; formula = cap(w.A) + ' = ' + w.P + ' : ' + w.K; calc = fmt(P) + ' : ' + fmt(K) + ' = ' + fmt(A);
      known = 'Известны произведение (' + w.P + ') и множитель (' + w.K + '). Нужно найти множимое (' + w.A + '): произведение делим на множитель.';
      hint = 'Известно: ' + w.P + ' и ' + w.K + '. Неизвестно: ' + w.A + ' — один из множителей. Как найти неизвестный множитель?';
    } else {
      ans = K; formula = cap(w.K) + ' = ' + w.P + ' : ' + w.A; calc = fmt(P) + ' : ' + fmt(A) + ' = ' + fmt(K);
      known = 'Известны произведение (' + w.P + ') и множимое (' + w.A + '). Нужно найти множитель (' + w.K + '): произведение делим на множимое.';
      hint = 'Известно: ' + w.P + ' и ' + w.A + '. Неизвестно: ' + w.K + ' — один из множителей. Как найти неизвестный множитель?';
    }
    return {
      kind: 'num', html: sc.q[find], answer: ans, hint: hint,
      explain: steps([known, formula + ': ' + calc], sc.ans[find === 'prod' ? 'P' : find]) + '<br>Проверка: ' + fmt(A) + ' × ' + fmt(K) + ' = ' + fmt(P) + '.'
    };
  });

  /* «в несколько раз больше» */
  var TIMES = [
    { a: [12, 24], k: [3, 4], text: function (A, k) { return 'Скорость велосипедиста — ' + fmt(A) + NB + 'км в час, а скорость мотоциклиста в ' + k + ' ' + timesW(k) + ' больше. Найди скорость мотоциклиста.'; }, w: 'больше', ans: 'км/ч' },
    { a: [80, 120], k: [6, 8], lim: 950, text: function (A, k) { return 'Скорость поезда — ' + fmt(A) + NB + 'км в час, а скорость самолёта в ' + k + ' ' + timesW(k) + ' больше. Найди скорость самолёта.'; }, w: 'больше', ans: 'км/ч' },
    { a: [20, 55], k: [4, 9], text: function (A, k) { return 'Высота жилого дома — ' + fmt(A) + NB + 'м, а высота телебашни в ' + k + ' ' + timesW(k) + ' больше. Найди высоту телебашни.'; }, w: 'больше', ans: 'м' },
    { a: [15, 60], k: [3, 9], text: function (A, k) { return 'Тетрадь стоит ' + fmt(A) + NB + 'руб., а атлас в ' + k + ' ' + timesW(k) + ' дороже. Сколько рублей стоит атлас?'; }, w: 'дороже', ans: 'руб.' },
    { a: [300, 2500], st: 50, k: [2, 9], text: function (A, k) { return 'В школьной библиотеке ' + nn(A, ['книга', 'книги', 'книг']) + ' по математике, а книг по литературе в ' + k + ' ' + timesW(k) + ' больше. Сколько книг по литературе?'; }, w: 'больше', ans: 'книг' },
    { a: [8, 16], k: [2, 3], text: function (A, k) { return 'В первый день туристы прошли ' + fmt(A) + NB + 'км, а во второй день — в ' + k + ' ' + timesW(k) + ' больше. Сколько километров они прошли во второй день?'; }, w: 'больше', ans: 'км' },
    { a: [1200, 2400], st: 100, k: [3, 7], text: function (A, k) { return 'Масса легкового автомобиля — ' + fmt(A) + NB + 'кг, а масса самосвала в ' + k + ' ' + timesW(k) + ' больше. Найди массу самосвала.'; }, w: 'больше', ans: 'кг' },
    { a: [240, 900], st: 10, k: [3, 6], text: function (A, k) { return 'Завод в январе выпустил ' + nn(A, ['велосипед', 'велосипеда', 'велосипедов']) + ', а в июне — в ' + k + ' ' + timesW(k) + ' больше. Сколько велосипедов завод выпустил в июне?'; }, w: 'больше', ans: 'велосипедов' },
    { a: [250, 900], st: 10, k: [4, 9], text: function (A, k) { return 'От дома до школы ' + fmt(A) + NB + 'м, а от дома до стадиона в ' + k + ' ' + timesW(k) + ' дальше. Сколько метров от дома до стадиона?'; }, w: 'дальше', ans: 'м' }
  ];
  function mkTimes(o) {
    o = o || {};
    var c = pick(TIMES), A, k, g = 0;
    do {
      A = stepPick(c.a[0], c.a[1], c.st || 1); k = rand(c.k[0], c.k[1]);
      if (o.zeros) { if (A >= 100) A = Math.round(A / 10) * 10; }
      g++;
    } while (g < 50 && c.lim && A * k > c.lim);
    return { c: c, A: A, k: k, P: A * k, text: c.text(A, k) };
  }

  /* задача в одно действие: число берётся слагаемым несколько раз / увеличить в несколько раз */
  def('amProdWord', function (o) {
    var type = o.type || pick(['rep', 'rep', 'times']);
    if (type === 'times') {
      var t = mkTimes(o);
      return {
        kind: 'num', html: t.text, answer: t.P,
        hint: 'Слова «в … раз больше (дороже, дальше)» значат, что число надо увеличить в столько раз. Каким действием увеличивают число в несколько раз?',
        explain: steps(['В условии сказано «в ' + t.k + ' ' + timesW(t.k) + ' ' + t.c.w + '» — число ' + fmt(t.A) + ' надо увеличить в ' + t.k + ' ' + timesW(t.k) + ', то есть умножить: ' + fmt(t.A) + ' × ' + t.k + ' = ' + fmt(t.P)], fmt(t.P) + NB + unitW(t.c.ans, t.P))
      };
    }
    var sc = mkScene(o.fam || pick(['price', 'speed', 'rate', 'box']), o);
    return {
      kind: 'num', html: sc.q.prod, answer: sc.P,
      hint: 'Одно и то же число берётся слагаемым несколько раз. Каким действием заменяют такое сложение?',
      explain: steps([cap(sc.w.P) + ' = ' + sc.w.A + ' × ' + sc.w.K + ': ' + fmt(sc.A) + ' × ' + fmt(sc.K) + ' = ' + fmt(sc.P) + '. Число ' + fmt(sc.A) + ' повторяется слагаемым ' + sc.K + ' ' + timesW(sc.K)], sc.ans.P)
    };
  });

  /* какого вида задача на умножение */
  def('amMulKind', function (o) {
    var mode = o.mode || pick(['kind', 'kind', 'which']), K1 = 'Одно и то же число берут слагаемым несколько раз', K2 = 'Число увеличивают в несколько раз', K3 = 'Число увеличивают на несколько единиц';
    function repText() { return mkScene(pick(['speed', 'price', 'rate', 'box']), { size: 'small' }).q.prod; }
    if (mode === 'kind') {
      var isTimes = Math.random() < 0.5, txt, why;
      if (isTimes) { var t = mkTimes({}); txt = t.text; why = 'В условии сказано «в ' + t.k + ' ' + timesW(t.k) + ' ' + t.c.w + '»: число ' + fmt(t.A) + ' увеличивают в ' + t.k + ' ' + timesW(t.k) + '. Это задача на увеличение числа в несколько раз.'; }
      else { txt = repText(); why = 'В задаче одно и то же значение повторяется несколько раз (за каждый час, в каждой штуке, в каждом ящике), значит, число берётся слагаемым несколько раз.'; }
      return choiceQ('К какому виду относится задача на умножение?<br>«' + txt + '»', isTimes ? K2 : K1, isTimes ? [K1, K3] : [K2, K3],
        'Найди в условии слова «в … раз больше» или значение, которое повторяется столько раз, сколько указано.',
        why + ' Обе задачи решаются умножением, но по-разному объясняются.', true);
    }
    var wantTimes = Math.random() < 0.5, texts = [], right, i;
    var mk1 = wantTimes ? repText : function () { return mkTimes({}).text; }, mk2 = wantTimes ? function () { return mkTimes({}).text; } : repText;
    right = mk2();
    var wrong = [mk1(), mk1()];
    if (wrong[0] === wrong[1] || wrong.indexOf(right) >= 0) return gens.amMulKind(o);
    return choiceQ('Какая из задач — ' + (wantTimes ? 'на увеличение числа в несколько раз' : 'на повторение числа слагаемым несколько раз') + '?', right, wrong,
      wantTimes ? 'Ищи слова «в … раз больше (дороже, дальше)».' : 'Ищи значение, которое повторяется: в час, за штуку, в каждом ящике.',
      wantTimes ? 'В этой задаче сказано «в … раз», значит, число увеличивают в несколько раз. В остальных задачах значение повторяется слагаемым: за каждый час, за каждый день, в каждом ящике.' : 'В этой задаче одно и то же значение повторяется столько раз, сколько указано. В остальных задачах число увеличивают в несколько раз («в … раз больше»).', true);
  });

  /* ==================================================================
     СОСТАВНЫЕ ЗАДАЧИ С УМНОЖЕНИЕМ (2–4 действия)
     ================================================================== */
  /* 1: два вида, часть отправили вагонами/машинами, сколько осталось */
  var SHIP = [
    { A: [100000, 900000, 10], n: [10, 60, 5], x: [10000, 60000, 500], u: 'м',
      text: function (A, k, n, x) { return 'Ткацкая фабрика за месяц выпустила ' + fmt(A) + NB + 'м сатина, а ситца — в ' + k + ' ' + timesW(k) + ' больше. ' + nn(n, ['вагон', 'вагона', 'вагонов']) + ' с тканью по ' + fmt(x) + NB + 'м в каждом отправили в магазины, а остальную ткань передали швейным фабрикам. Сколько метров ткани передали швейным фабрикам?'; },
      q: ['Сколько метров ситца выпустила фабрика?', 'Сколько метров ткани выпустила фабрика всего?', 'Сколько метров ткани отправили в магазины?', 'Сколько метров ткани передали швейным фабрикам?'] },
    { A: [800, 6000, 10], n: [10, 60, 1], x: [60, 68, 1], u: 'т',
      text: function (A, k, n, x) { return 'Элеватор принял ' + fmt(A) + NB + 'т пшеницы, а ржи — в ' + k + ' ' + timesW(k) + ' больше. ' + nn(n, ['вагон', 'вагона', 'вагонов']) + ' по ' + x + NB + 'т зерна отправили на мельницу. Сколько тонн зерна осталось на элеваторе?'; },
      q: ['Сколько тонн ржи принял элеватор?', 'Сколько тонн зерна принял элеватор всего?', 'Сколько тонн зерна отправили на мельницу?', 'Сколько тонн зерна осталось на элеваторе?'] },
    { A: [50000, 300000, 1000], n: [20, 80, 5], x: [2000, 4500, 500], u: 'кирпичей',
      text: function (A, k, n, x) { return 'Кирпичный завод за месяц выпустил ' + fmt(A) + NB + 'красных кирпичей, а белых — в ' + k + ' ' + timesW(k) + ' больше. ' + nn(n, ['грузовик', 'грузовика', 'грузовиков']) + ' по ' + fmt(x) + NB + 'кирпичей увезли на стройки. Сколько кирпичей осталось на заводе?'; },
      q: ['Сколько белых кирпичей выпустил завод?', 'Сколько кирпичей выпустил завод всего?', 'Сколько кирпичей увезли на стройки?', 'Сколько кирпичей осталось на заводе?'] },
    { A: [800, 5000, 10], n: [50, 300, 10], x: [18, 25, 1], u: 'кг',
      text: function (A, k, n, x) { return 'В саду собрали ' + fmt(A) + NB + 'кг яблок, а груш — в ' + k + ' ' + timesW(k) + ' больше. ' + nn(n, ['ящик', 'ящика', 'ящиков']) + ' по ' + x + NB + 'кг фруктов отвезли в магазины. Сколько килограммов фруктов осталось?'; },
      q: ['Сколько килограммов груш собрали?', 'Сколько килограммов фруктов собрали всего?', 'Сколько килограммов фруктов отвезли в магазины?', 'Сколько килограммов фруктов осталось?'] },
    { A: [50, 400, 5], n: [10, 40, 1], x: [5, 12, 1], u: 'т',
      text: function (A, k, n, x) { return 'Хозяйство вырастило ' + fmt(A) + NB + 'т картофеля, а капусты — в ' + k + ' ' + timesW(k) + ' больше. ' + nn(n, ['машина', 'машины', 'машин']) + ' по ' + x + NB + 'т овощей отправили в город. Сколько тонн овощей осталось в хозяйстве?'; },
      q: ['Сколько тонн капусты вырастило хозяйство?', 'Сколько тонн овощей вырастило хозяйство всего?', 'Сколько тонн овощей отправили в город?', 'Сколько тонн овощей осталось в хозяйстве?'] }
  ];
  function stepsShip(o) {
    var c = pick(SHIP), A, k, n, x, T, S, g = 0, B;
    do {
      A = stepPick(c.A[0], c.A[1], c.A[2]); k = rand(2, 3); B = A * k; T = A + B; n = stepPick(c.n[0], c.n[1], c.n[2]); x = stepPick(c.x[0], c.x[1], c.x[2]); S = n * x; g++;
    } while (g < 400 && (S < 0.15 * T || S > 0.85 * T));
    if (S >= T) throw new Error('amMulSteps: не подобрались числа');
    var Rr = T - S;
    return {
      text: c.text(A, k, n, x), ans: Rr, unit: c.u,
      list: [c.q[0] + ' ' + fmt(A) + ' × ' + k + ' = ' + fmt(B), c.q[1] + ' ' + fmt(A) + ' + ' + fmt(B) + ' = ' + fmt(T), c.q[2] + ' ' + fmt(n) + ' × ' + fmt(x) + ' = ' + fmt(S), c.q[3] + ' ' + fmt(T) + ' − ' + fmt(S) + ' = ' + fmt(Rr)],
      hint: 'Сначала найди, сколько второго вида: «в … раз больше» значит умножить. Потом узнай, сколько всего и сколько отправили.'
    };
  }
  /* 2: покупка и сдача / две покупки */
  function stepsBuy(o) {
    var i1 = pick(ITEMS), i2, n1, p1, n2, p2, c1, c2, ag = pick(ORGS), variant = o.variant || pick(['change', 'change', 'diff', 'sum']);
    n1 = rand(12, 48); p1 = stepPick(i1.p[0], i1.p[1], i1.p[2]); c1 = n1 * p1;
    if (variant === 'change') {
      var M = (Math.floor(c1 / 1000) + 1 + rand(0, 1)) * 1000, D = M - c1, fem = /а$/.test(ag.pay);
      return {
        text: ag.n + ' ' + ag.v + ' ' + nn(n1, i1.f) + ' по ' + fmt(p1) + NB + 'руб. и ' + (fem ? 'отдала' : 'отдал') + ' кассиру ' + fmt(M) + NB + 'руб. Сколько рублей сдачи ' + (fem ? 'получила' : 'получил') + ' ' + ag.l + '?', ans: D, unit: 'руб.',
        list: ['Сколько стоит вся покупка? ' + fmt(n1) + ' × ' + fmt(p1) + ' = ' + fmt(c1), 'Сколько рублей сдачи? ' + fmt(M) + ' − ' + fmt(c1) + ' = ' + fmt(D)],
        hint: 'Сначала узнай стоимость всей покупки: цену умножь на количество. Сдача — это то, что осталось от отданных денег.'
      };
    }
    do { i2 = pick(ITEMS); } while (i2 === i1);
    n2 = rand(12, 48); p2 = stepPick(i2.p[0], i2.p[1], i2.p[2]); c2 = n2 * p2;
    var t1 = ag.n + ' ' + ag.v + ' ' + nn(n1, i1.f) + ' по ' + fmt(p1) + NB + 'руб. и ' + nn(n2, i2.f) + ' по ' + fmt(p2) + NB + 'руб.';
    if (variant === 'sum' || c1 === c2) {
      return {
        text: t1 + ' Сколько рублей ' + ag.pay + ' ' + ag.l + ' за всю покупку?', ans: c1 + c2, unit: 'руб.',
        list: ['Сколько стоят ' + i1.pl + '? ' + fmt(n1) + ' × ' + fmt(p1) + ' = ' + fmt(c1), 'Сколько стоят ' + i2.pl + '? ' + fmt(n2) + ' × ' + fmt(p2) + ' = ' + fmt(c2), 'Сколько стоит вся покупка? ' + fmt(c1) + ' + ' + fmt(c2) + ' = ' + fmt(c1 + c2)],
        hint: 'Сначала узнай стоимость каждой части покупки, потом сложи.'
      };
    }
    var hiName = c1 > c2 ? i1.pl : i2.pl, loName = c1 > c2 ? i2.pl : i1.pl;
    return {
      text: t1 + ' На сколько рублей ' + hiName + ' обошлись дороже, чем ' + loName + '?', ans: Math.abs(c1 - c2), unit: 'руб.',
      list: ['Сколько стоят ' + i1.pl + '? ' + fmt(n1) + ' × ' + fmt(p1) + ' = ' + fmt(c1), 'Сколько стоят ' + i2.pl + '? ' + fmt(n2) + ' × ' + fmt(p2) + ' = ' + fmt(c2), 'На сколько ' + hiName + ' дороже? ' + fmt(Math.max(c1, c2)) + ' − ' + fmt(Math.min(c1, c2)) + ' = ' + fmt(Math.abs(c1 - c2))],
      hint: 'Узнай, сколько стоят предметы каждого вида, а потом из большей стоимости вычти меньшую.'
    };
  }
  /* 3: путь в два приёма */
  function stepsTrip(o) {
    var v = pick(VEH.filter(function (x) { return x.a[1] < 400 && x.n !== 'Пешеход'; })), v1, v2, t1, t2, g = 0, diff = o.variant ? o.variant === 'diff' : Math.random() < 0.35;
    do { v1 = stepPick(v.a[0], v.a[1], v.a[2]); v2 = stepPick(v.a[0], v.a[1], v.a[2]); t1 = rand(2, Math.min(9, v.t[1])); t2 = rand(2, Math.min(9, v.t[1])); g++; } while (g < 100 && (v1 === v2 || t1 === t2 || (diff && v1 * t1 === v2 * t2)));
    var s1 = v1 * t1, s2 = v2 * t2;
    if (diff && s1 > s2) { var tv = v1, tt = t1; v1 = v2; t1 = t2; v2 = tv; t2 = tt; s1 = v1 * t1; s2 = v2 * t2; }
    var base = v.n + ' ' + v.v + ' ' + t1 + ' ' + hrs(t1) + ' со скоростью ' + fmt(v1) + NB + 'км в час, а потом ещё ' + t2 + ' ' + hrs(t2) + ' — со скоростью ' + fmt(v2) + NB + 'км в час.';
    return {
      text: base + (diff ? ' На сколько километров второй участок пути длиннее первого?' : ' Сколько километров ' + v.d + ' ' + v.l + ' за всё время?'),
      ans: diff ? s2 - s1 : s1 + s2, unit: 'км',
      list: ['Сколько километров на первом участке? ' + fmt(v1) + ' × ' + t1 + ' = ' + fmt(s1), 'Сколько километров на втором участке? ' + fmt(v2) + ' × ' + t2 + ' = ' + fmt(s2),
        diff ? 'На сколько второй участок длиннее? ' + fmt(s2) + ' − ' + fmt(s1) + ' = ' + fmt(s2 - s1) : 'Сколько километров за всё время? ' + fmt(s1) + ' + ' + fmt(s2) + ' = ' + fmt(s1 + s2)],
      hint: 'Найди длину каждого участка пути: скорость умножь на время. Потом ' + (diff ? 'вычти меньший участок из большего.' : 'сложи.')
    };
  }
  /* 4: «в несколько раз больше», потом умножить на время */
  var KT = [
    { a: [12, 20, 1], k: [3, 4], t: [2, 6], u: 'км', s1: 'Какова скорость мотоциклиста (км/ч)?', s2: 'Сколько километров проедет мотоциклист?',
      text: function (a, k, t) { return 'Скорость велосипедиста — ' + a + NB + 'км в час, а скорость мотоциклиста в ' + k + ' ' + timesW(k) + ' больше. Сколько километров проедет мотоциклист за ' + t + ' ' + hrs(t) + '?'; } },
    { a: [80, 120, 10], k: [6, 8], lim: 950, t: [2, 6], u: 'км', s1: 'Какова скорость самолёта (км/ч)?', s2: 'Сколько километров пролетит самолёт?',
      text: function (a, k, t) { return 'Скорость поезда — ' + a + NB + 'км в час, а скорость самолёта в ' + k + ' ' + timesW(k) + ' больше. Сколько километров пролетит самолёт за ' + t + ' ' + hrs(t) + '?'; } },
    { a: [15, 40, 1], k: [3, 6], t: [8, 40], u: 'руб.', s1: 'Сколько стоит один блокнот?', s2: 'Сколько стоят все блокноты?',
      text: function (a, k, t) { return 'Ручка стоит ' + a + NB + 'руб., а блокнот в ' + k + ' ' + timesW(k) + ' дороже ручки. Сколько рублей надо заплатить за ' + nn(t, ['блокнот', 'блокнота', 'блокнотов']) + '?'; } },
    { a: [40, 200, 10], k: [2, 3], t: [10, 40, 5], u: 'л', s1: 'Сколько литров в минуту перекачивает второй насос?', s2: 'Сколько литров воды перекачает второй насос?',
      text: function (a, k, t) { return 'Один насос перекачивает ' + fmt(a) + NB + 'л воды в минуту, а второй — в ' + k + ' ' + timesW(k) + ' больше. Сколько литров воды перекачает второй насос за ' + t + ' мин?'; } },
    { a: [8, 18, 1], k: [10, 20], t: [4, 9], u: 'деталей', s1: 'Сколько деталей в час делает автомат?', s2: 'Сколько деталей сделает автомат?',
      text: function (a, k, t) { return 'Токарь делает ' + nn(a, ['деталь', 'детали', 'деталей']) + ' в час, а автомат — в ' + k + ' ' + timesW(k) + ' больше. Сколько деталей сделает автомат за ' + t + ' ' + hrs(t) + '?'; } }
  ];
  function stepsKT(o) {
    var c = pick(KT), a, k, t, g = 0;
    do { a = stepPick(c.a[0], c.a[1], c.a[2] || 1); k = rand(c.k[0], c.k[1]); t = c.t[2] ? stepPick(c.t[0], c.t[1], c.t[2]) : rand(c.t[0], c.t[1]); g++; } while (g < 50 && c.lim && a * k > c.lim);
    var b = a * k, P = b * t;
    return {
      text: c.text(a, k, t), ans: P, unit: c.u,
      list: [c.s1 + ' ' + fmt(a) + ' × ' + k + ' = ' + fmt(b), c.s2 + ' ' + fmt(b) + ' × ' + fmt(t) + ' = ' + fmt(P)],
      hint: 'Сначала узнай, чему равно то, что «в несколько раз больше» (скорость, цена, норма). Потом умножай на время или количество.'
    };
  }
  /* 5: два станка/бригады, второй — на несколько больше */
  var RT = [
    { a: [60, 300, 10], b: [10, 90, 10], d: [5, 30], text: function (a, b, d) { return 'Первая бригада собирала ' + fmt(a) + NB + 'кг ягод в день, а вторая — на ' + b + NB + 'кг больше. Сколько килограммов ягод собрали обе бригады за ' + d + ' ' + R.plural(d, ['день', 'дня', 'дней']) + '?'; }, q1: 'Сколько килограммов собирала в день вторая бригада?', q2: 'Сколько килограммов собирали в день обе бригады вместе?', q3: 'Сколько килограммов собрали за все дни?', u: 'кг' },
    { a: [20, 90, 5], b: [5, 30, 5], d: [6, 12], text: function (a, b, d) { return 'Первый станок делал ' + nn(a, ['деталь', 'детали', 'деталей']) + ' в час, а второй — на ' + b + ' деталей больше. Сколько деталей сделали оба станка за ' + d + ' ' + hrs(d) + '?'; }, q1: 'Сколько деталей делал в час второй станок?', q2: 'Сколько деталей делали в час оба станка вместе?', q3: 'Сколько деталей сделали за все часы?', u: 'деталей' },
    { a: [400, 1500, 50], b: [100, 600, 50], d: [10, 30], text: function (a, b, d) { return 'Старая типография печатала ' + nn(a, ['книга', 'книги', 'книг']) + ' в день, а новая — на ' + b + ' книг больше. Сколько книг напечатали обе типографии за ' + d + ' ' + R.plural(d, ['день', 'дня', 'дней']) + '?'; }, q1: 'Сколько книг в день печатала новая типография?', q2: 'Сколько книг в день печатали обе типографии вместе?', q3: 'Сколько книг напечатали за все дни?', u: 'книг' }
  ];
  function stepsRates(o) {
    var c = pick(RT), a = stepPick(c.a[0], c.a[1], c.a[2]), b = stepPick(c.b[0], c.b[1], c.b[2]), d = rand(c.d[0], c.d[1]), a2 = a + b, both = a + a2, P = both * d;
    return {
      text: c.text(a, b, d), ans: P, unit: c.u,
      list: [c.q1 + ' ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(a2), c.q2 + ' ' + fmt(a) + ' + ' + fmt(a2) + ' = ' + fmt(both), c.q3 + ' ' + fmt(both) + ' × ' + d + ' = ' + fmt(P)],
      hint: 'Сначала узнай, сколько делает второй, потом — сколько делают оба вместе за один день (час), и только потом умножай.'
    };
  }
  /* 6: ряды и места, два показа */
  var HALLS = [
    { r: [12, 30], s: [20, 40, 5], m: [30, 250, 10], text: function (r, s, m) { return 'В зале кинотеатра ' + nn(r, ['ряд', 'ряда', 'рядов']) + ' по ' + s + ' мест. На дневной сеанс продали билеты на все места, а на вечерний — на ' + m + ' билетов меньше. Сколько билетов продали на два сеанса?'; }, what: 'билетов', q2: 'Сколько билетов продали на вечерний сеанс?', q3: 'Сколько билетов продали на два сеанса?' },
    { r: [15, 35], s: [20, 45, 5], m: [20, 200, 10], text: function (r, s, m) { return 'В зале театра ' + nn(r, ['ряд', 'ряда', 'рядов']) + ' по ' + s + ' мест. На утреннем спектакле все места были заняты, а на вечернем пустовало ' + m + ' мест. Сколько зрителей побывало на двух спектаклях?'; }, what: 'зрителей', q2: 'Сколько зрителей было на вечернем спектакле?', q3: 'Сколько зрителей побывало на двух спектаклях?' },
    { r: [30, 90], s: [50, 150, 10], m: [100, 900, 50], text: function (r, s, m) { return 'На стадионе ' + nn(r, ['ряд', 'ряда', 'рядов']) + ' по ' + s + ' мест. Первый матч посмотрели зрители на всех местах, а на второй матч пришло на ' + fmt(m) + NB + 'человек меньше. Сколько зрителей посмотрели два матча?'; }, what: 'зрителей', q2: 'Сколько зрителей пришло на второй матч?', q3: 'Сколько зрителей посмотрели два матча?' }
  ];
  function stepsHall(o) {
    var c = pick(HALLS), r = rand(c.r[0], c.r[1]), s = stepPick(c.s[0], c.s[1], c.s[2] || 1), m = stepPick(c.m[0], c.m[1], c.m[2]), places = r * s, ev = places - m;
    return {
      text: c.text(r, s, m), ans: places + ev, unit: c.what,
      list: ['Сколько всего мест? ' + r + ' × ' + s + ' = ' + fmt(places), c.q2 + ' ' + fmt(places) + ' − ' + fmt(m) + ' = ' + fmt(ev), c.q3 + ' ' + fmt(places) + ' + ' + fmt(ev) + ' = ' + fmt(places + ev)],
      hint: 'Сначала узнай, сколько всего мест в зале: число рядов умножь на число мест в ряду.'
    };
  }
  /* 7: привезли, потом часть убрали — сколько осталось */
  var REM = [
    { n: [10, 60, 1], x: [20, 60, 2], text: function (n, x, y) { return 'Библиотека получила ' + nn(n, ['пачка', 'пачки', 'пачек']) + ' книг по ' + x + ' ' + R.plural(x, ['книгу', 'книги', 'книг']) + ' в каждой. ' + nn(y, ['книга', 'книги', 'книг']) + ' выдали читателям. Сколько книг осталось в библиотеке?'; }, q1: 'Сколько книг получила библиотека?', q2: 'Сколько книг осталось?', u: 'книг', yr: 10 },
    { n: [40, 300, 10], x: [50, 50, 1], text: function (n, x, y) { return 'На склад привезли ' + nn(n, ['мешок', 'мешка', 'мешков']) + ' цемента по ' + x + NB + 'кг. Со склада на стройку увезли ' + fmt(y) + NB + 'кг цемента. Сколько килограммов цемента осталось на складе?'; }, q1: 'Сколько килограммов цемента привезли на склад?', q2: 'Сколько килограммов цемента осталось?', u: 'кг', yr: 100 },
    { n: [20, 90, 1], x: [18, 25, 1], text: function (n, x, y) { return 'В магазин привезли ' + nn(n, ['ящик', 'ящика', 'ящиков']) + ' яблок по ' + x + NB + 'кг. За день продали ' + fmt(y) + NB + 'кг яблок. Сколько килограммов яблок осталось?'; }, q1: 'Сколько килограммов яблок привезли?', q2: 'Сколько килограммов яблок осталось?', u: 'кг', yr: 10 },
    { n: [12, 40, 1], x: [24, 60, 2], text: function (n, x, y) { return 'В оранжерее посадили ' + nn(n, ['ряд', 'ряда', 'рядов']) + ' огурцов по ' + x + ' ' + R.plural(x, ['куст', 'куста', 'кустов']) + ' в каждом. ' + nn(y, ['куст', 'куста', 'кустов']) + ' пересадили в другую оранжерею. Сколько кустов огурцов осталось?'; }, q1: 'Сколько кустов огурцов посадили?', q2: 'Сколько кустов осталось?', u: 'кустов', yr: 10 }
  ];
  function stepsRem(o) {
    var c = pick(REM), n = stepPick(c.n[0], c.n[1], c.n[2]), x = stepPick(c.x[0], c.x[1], c.x[2]), T = n * x, y = Math.round(T * (rand(15, 60) / 100) / c.yr) * c.yr;
    if (y <= 0) y = c.yr;
    if (y >= T) y = T - c.yr;
    return {
      text: c.text(n, x, y), ans: T - y, unit: c.u,
      list: [c.q1 + ' ' + fmt(n) + ' × ' + fmt(x) + ' = ' + fmt(T), c.q2 + ' ' + fmt(T) + ' − ' + fmt(y) + ' = ' + fmt(T - y)],
      hint: 'Сначала узнай, сколько было всего: количество умножь на то, что в каждом. Потом вычти то, что убрали.'
    };
  }

  var STEP_FAMS = [null, stepsShip, stepsBuy, stepsTrip, stepsKT, stepsRates, stepsHall, stepsRem];
  /* o.fam — номер семейства 1–7 или список номеров */
  def('amMulSteps', function (o) {
    var fam = o.fam || [1, 2, 3, 4, 5, 6, 7];
    if (Array.isArray(fam)) fam = pick(fam);
    var t = STEP_FAMS[fam](o), unit = t.unit ? NB + unitW(t.unit, t.ans) : '';
    return {
      kind: 'num', html: t.text, answer: t.ans, hint: t.hint,
      explain: steps(t.list, fmt(t.ans) + unit)
    };
  });

  /* ==================================================================
     ПРИКИДКА: сколько цифр в произведении, порядок ответа
     ================================================================== */
  function lead(n) { var s = String(n); return Number(s.charAt(0)) * pw10(s.length - 1); }
  function leadUp(n) { var s = String(n); return (Number(s.charAt(0)) + 1) * pw10(s.length - 1); }
  def('amMulDigits', function (o) {
    var da = rangeArg(o.a, [3, 5]), db = rangeArg(o.b, [2, 3]), a, b, g = 0, lo, up;
    do { a = mk(da); b = mk(db); lo = lead(a) * lead(b); up = leadUp(a) * leadUp(b); g++; } while (g < 300 && digs(lo) !== digs(up));
    var P = a * b, d = digs(P);
    if (digs(lo) !== d || digs(up) !== d) throw new Error('amMulDigits: оценка не сошлась');
    return {
      kind: 'num', html: 'Не вычисляя, определи, сколько цифр будет в произведении ' + expr(fmt(a) + ' × ' + fmt(b)) + '.', answer: d,
      hint: 'Округли оба множителя вниз до круглых чисел, а потом — вверх. Посмотри, сколько цифр в обоих результатах.',
      explain: steps(['Округлим множители вниз: ' + fmt(lead(a)) + ' × ' + fmt(lead(b)) + ' = ' + fmt(lo) + ' — ' + d + ' ' + R.plural(d, ['цифра', 'цифры', 'цифр']),
        'Округлим вверх: ' + fmt(leadUp(a)) + ' × ' + fmt(leadUp(b)) + ' = ' + fmt(up) + ' — тоже ' + d + ' ' + R.plural(d, ['цифра', 'цифры', 'цифр']),
        'Настоящее произведение лежит между этими числами, значит, в нём ' + d + ' ' + R.plural(d, ['цифра', 'цифры', 'цифр'])], d) + '<br>Проверка: ' + fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(P) + '.'
    };
  });
  function roundLead(n) { var s = String(n), p = pw10(s.length - 1); return Math.round(n / p) * p; }
  def('amMulEstimate', function (o) {
    var a, b, P, ra, rb, est, g = 0;
    do { a = mk(rangeArg(o.a, [3, 4])); b = mk(rangeArg(o.b, [2, 2])); P = a * b; ra = roundLead(a); rb = roundLead(b); est = ra * rb; g++; }
    while (g < 60 && digs(P) !== digs(est));
    var wrong = distinctOptions(est, [est * 10, est / 10, est * 100, est / 100, est * 1000], 3);
    return choiceQ('Не вычисляя точно, выбери, какой ответ подходит: ' + expr(fmt(a) + ' × ' + fmt(b) + ' ≈ …'), fmt(est), wrong.map(fmt),
      'Округли каждый множитель до самого старшего разряда, перемножь круглые числа и посмотри, сколько цифр получилось.',
      'Округлим: ' + fmt(a) + ' ≈ ' + fmt(ra) + ', ' + fmt(b) + ' ≈ ' + fmt(rb) + '. Перемножим круглые числа: ' + fmt(ra) + ' × ' + fmt(rb) + ' = ' + fmt(est) + '. Ответ должен быть около ' + fmt(est) + '. Точный ответ: ' + fmt(P) + '.', false);
  });

  /* ==================================================================
     ВИДЖЕТЫ УРОКОВ 35–39
     ================================================================== */
  function readNum(v, dflt) { var n = R.parseNum(v); return n > 0 ? n : dflt; }

  /* сумма равных слагаемых = произведение */
  R.widgetMounts.amRepeat = function (host) {
    var k = Number(host.getAttribute('data-k') || 6), a0 = Number(host.getAttribute('data-a') || 326);
    host.innerHTML = '<div class="conv-row"><div class="fld"><label class="wlabel">Слагаемое</label><input class="winput sm am-in" inputmode="numeric" autocomplete="off"></div>' +
      '<div class="fld"><label class="wlabel">Сколько раз взять</label><div class="am-step"><button class="btn soft" type="button" data-a="dec" aria-label="взять на раз меньше">−</button><span class="am-k winput sm"></span><button class="btn soft" type="button" data-a="inc" aria-label="взять на раз больше">+</button></div></div></div>' +
      '<div class="w-out"></div>';
    var inp = host.querySelector('input'), kk = host.querySelector('.am-k'), out = host.querySelector('.w-out');
    inp.style.width = '7ch'; inp.value = fmt(a0); R.groupInput(inp, 4);
    function draw() {
      var a = readNum(inp.value, 1), chips = [], list = [], i;
      kk.textContent = k;
      for (i = 0; i < k; i++) { chips.push('<span class="am-chip">' + fmt(a) + '</span>'); list.push(fmt(a)); }
      out.innerHTML = '<div class="am-chips">' + chips.join('<span class="am-plus">+</span>') + '</div>' +
        '<p class="facts">Сложением: ' + list.join(' + ') + ' = <b>' + fmt(a * k) + '</b></p>' +
        '<p class="facts">Умножением, короче: <b>' + fmt(a) + ' × ' + k + ' = ' + fmt(a * k) + '</b></p>';
    }
    host.querySelector('[data-a="dec"]').addEventListener('click', function () { if (k > 2) { k--; draw(); } });
    host.querySelector('[data-a="inc"]').addEventListener('click', function () { if (k < 9) { k++; draw(); } });
    inp.addEventListener('input', draw);
    draw();
  };

  /* точки: ряды и столбцы, переместительное свойство */
  R.widgetMounts.amArray = function (host) {
    var r = Number(host.getAttribute('data-r') || 4), c = Number(host.getAttribute('data-c') || 6), turned = false, r0 = r, c0 = c, moved = false;
    host.innerHTML = '<div class="am-arr-fig"></div><p class="facts am-arr-txt"></p><div class="am-lv-tools"><button class="btn primary" type="button" data-a="turn">Повернуть</button> <button class="btn soft" type="button" data-a="new">Другие числа</button></div>';
    var fig = host.querySelector('.am-arr-fig'), txt = host.querySelector('.am-arr-txt');
    function draw() {
      var rows = turned ? c : r, cols = turned ? r : c, cell = 28, w = cols * cell + 12, h = rows * cell + 12, s = '', i, j;
      s += '<svg class="fig am-arr" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + rows + ' ' + R.plural(rows, ['ряд', 'ряда', 'рядов']) + ' по ' + cols + ' ' + R.plural(cols, ['точке', 'точки', 'точек']) + '">';
      for (i = 0; i < rows; i++) for (j = 0; j < cols; j++) s += '<circle class="' + (i === 0 ? 'am-dot am-dot1' : 'am-dot') + '" cx="' + (6 + cell / 2 + j * cell) + '" cy="' + (6 + cell / 2 + i * cell) + '" r="9"/>';
      fig.innerHTML = s + '</svg>';
      var sum = []; for (i = 0; i < rows; i++) sum.push(cols);
      txt.innerHTML = '<b>' + rows + ' ' + R.plural(rows, ['ряд', 'ряда', 'рядов']) + ' по ' + cols + ' ' + R.plural(cols, ['точке', 'точки', 'точек']) + '.</b> Всего: ' + sum.join(' + ') + ' = ' + cols + ' × ' + rows + ' = ' + (rows * cols) + '.' +
        (moved ? '<br>Раньше было ' + (turned ? r + ' × ' + c : c + ' × ' + r) + ', теперь ' + cols + ' × ' + rows + '. Точек столько же: <b>' + r + ' × ' + c + ' = ' + c + ' × ' + r + '</b>.' : '');
    }
    host.querySelector('[data-a="turn"]').addEventListener('click', function () { turned = !turned; moved = true; draw(); });
    host.querySelector('[data-a="new"]').addEventListener('click', function () {
      var g = 0; do { r = rand(2, 7); c = rand(2, 8); g++; } while (r === c && g < 20);
      turned = false; moved = false; draw();
    });
    draw();
  };

  /* три задачи об одном: найти произведение / множимое / множитель */
  R.widgetMounts.amFamily = function (host) {
    var A = Number(host.getAttribute('data-a') || 18), K = Number(host.getAttribute('data-k') || 5), mode = 'P';
    host.innerHTML = '<div class="am-fam-btns"></div><div class="am-eq"></div><p class="facts am-fam-txt"></p><div class="am-lv-tools"><button class="btn soft" type="button" data-a="new">Другие числа</button></div>';
    var btns = host.querySelector('.am-fam-btns'), eq = host.querySelector('.am-eq'), txt = host.querySelector('.am-fam-txt');
    var LAB = { P: 'Найти произведение', A: 'Найти множимое', K: 'Найти множитель' };
    ['P', 'A', 'K'].forEach(function (m) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn soft'; b.setAttribute('data-m', m); b.textContent = LAB[m];
      b.addEventListener('click', function () { mode = m; draw(); }); btns.appendChild(b);
    });
    function box(v, cap, hidden) { return '<span class="am-box"><span class="am-n' + (hidden ? ' am-q' : '') + '">' + (hidden ? '□' : fmt(v)) + '</span><span class="am-cap">' + cap + '</span></span>'; }
    function draw() {
      var P = A * K;
      eq.innerHTML = box(A, 'множимое', mode === 'A') + '<span class="am-op">×</span>' + box(K, 'множитель', mode === 'K') + '<span class="am-op">=</span>' + box(P, 'произведение', mode === 'P');
      Array.prototype.forEach.call(btns.children, function (b) { b.className = 'btn ' + (b.getAttribute('data-m') === mode ? 'primary' : 'soft'); });
      txt.innerHTML = mode === 'P' ? 'Известны оба множителя — их перемножаем: <b>' + fmt(A) + ' × ' + fmt(K) + ' = ' + fmt(P) + '</b>.'
        : mode === 'A' ? 'Неизвестно множимое. Произведение делим на известный множитель: <b>' + fmt(P) + ' : ' + fmt(K) + ' = ' + fmt(A) + '</b>.'
          : 'Неизвестен множитель. Произведение делим на известный множитель: <b>' + fmt(P) + ' : ' + fmt(A) + ' = ' + fmt(K) + '</b>.';
    }
    host.querySelector('[data-a="new"]').addEventListener('click', function () { var a2 = A; while (a2 === A) a2 = rand(12, 48); A = a2; K = rand(3, 9); draw(); });
    draw();
  };

  /* какой множитель писать снизу */
  R.widgetMounts.amOrder = function (host) {
    host.innerHTML = '<div class="conv-row"><div class="fld"><label class="wlabel">Первое число</label><input class="winput sm am-in" inputmode="numeric" autocomplete="off"></div>' +
      '<span class="conv-eq">и</span><div class="fld"><label class="wlabel">Второе число</label><input class="winput sm am-in" inputmode="numeric" autocomplete="off"></div></div><div class="w-out am-ord"></div>';
    var ins = host.querySelectorAll('input'), out = host.querySelector('.w-out');
    ins[0].style.width = '8ch'; ins[1].style.width = '8ch';
    ins[0].value = fmt(host.getAttribute('data-a') || 4375); ins[1].value = fmt(host.getAttribute('data-b') || 208);
    R.groupInput(ins[0], 5); R.groupInput(ins[1], 5);
    function rows(n) { return String(n).replace(/0/g, '').length; }
    function one(top, bot, good) {
      var r = rows(bot);
      return '<div class="am-ord-col' + (good ? ' am-good' : '') + '"><div class="am-ord-cap">Сверху ' + fmt(top) + ', снизу ' + fmt(bot) + ': <b>' + r + ' ' + R.plural(r, ['строка', 'строки', 'строк']) + '</b>' + (good ? ' — удобнее' : '') + '</div>' + R.mulHTML(top, bot) + '</div>';
    }
    function calc() {
      var a = R.parseNum(ins[0].value), b = R.parseNum(ins[1].value);
      if (!(a > 1) || !(b > 1) || a * b > 2e9) { out.innerHTML = '<p class="facts">Впиши два числа больше 1 (произведение не больше двух миллиардов).</p>'; return; }
      var ra = rows(a), rb = rows(b);
      out.innerHTML = '<div class="am-ord-row">' + one(a, b, rb < ra) + one(b, a, ra < rb) + '</div>' + '<p class="facts">' + (ra === rb ? 'Строк поровну — можно писать в любом порядке.' : 'Произведение одно и то же: ' + fmt(a * b) + '. Удобнее ставить снизу число с меньшим числом ненулевых цифр.') + '</p>';
    }
    ins[0].addEventListener('input', calc); ins[1].addEventListener('input', calc);
    calc();
  };

  /* какое выражение решает задачу (только + − ×) */
  def('amMulExprChoice', function (o) {
    var t = o.t || rand(1, 5), text, right, wr = [], g = 0, a, b, c, d, e, f;
    if (t === 1) {
      a = rand(12, 48); b = rand(12, 90); c = rand(12, 48); d = rand(12, 90);
      text = 'В магазин привезли ' + nn(a, ['ящик', 'ящика', 'ящиков']) + ' яблок по ' + b + NB + 'кг и ' + nn(c, ['ящик', 'ящика', 'ящиков']) + ' груш по ' + d + NB + 'кг. Сколько килограммов фруктов привезли?';
      right = [a, '×', b, '+', c, '×', d];
      wr = [['(', a, '+', c, ')', '×', '(', b, '+', d, ')'], [a, '×', b, '−', c, '×', d], [a, '+', b, '+', c, '+', d], ['(', a, '+', b, ')', '×', '(', c, '+', d, ')'], [a, '×', '(', b, '+', c, ')', '×', d]];
    } else if (t === 2) {
      a = rand(12, 48); b = rand(18, 90); c = (Math.floor(a * b / 100) + 1 + rand(0, 1)) * 100;
      text = 'Ученик отдал в кассу ' + fmt(c) + NB + 'руб. и купил ' + nn(a, ['тетрадь', 'тетради', 'тетрадей']) + ' по ' + b + NB + 'руб. Сколько рублей сдачи он получил?';
      right = [c, '−', a, '×', b];
      wr = [['(', c, '−', a, ')', '×', b], [c, '−', a, '−', b], [c, '+', a, '×', b], [c, '×', a, '−', b], [a, '×', b, '+', c]];
    } else if (t === 3) {
      a = rand(12, 20); b = rand(3, 4); c = rand(3, 8);
      text = 'Скорость велосипедиста — ' + a + NB + 'км в час, а скорость мотоциклиста в ' + b + ' ' + timesW(b) + ' больше. Сколько километров проедет мотоциклист за ' + c + ' ' + hrs(c) + '?';
      right = [a, '×', b, '×', c];
      wr = [[a, '×', '(', b, '+', c, ')'], [a, '+', b, '×', c], [a, '×', b, '+', c], [a, '×', b, '−', c], [a, '+', b, '+', c]];
    } else if (t === 4) {
      a = rand(15, 40); b = rand(20, 45); c = stepPick(20, 200, 10);
      text = 'В зале ' + nn(a, ['ряд', 'ряда', 'рядов']) + ' по ' + b + ' мест. В зал пришло ' + nn(c, ['зритель', 'зрителя', 'зрителей']) + '. Сколько мест осталось свободными?';
      right = [a, '×', b, '−', c];
      wr = [[a, '×', '(', b, '−', c, ')'], [a, '+', b, '−', c], [a, '×', b, '+', c], ['(', a, '−', c, ')', '×', b], [a, '×', b, '×', c]];
    } else {
      a = stepPick(40, 200, 10); b = stepPick(10, 90, 10); d = rand(5, 30);
      text = 'Первая бригада собирала ' + a + NB + 'кг ягод в день, а вторая — на ' + b + NB + 'кг больше. Сколько килограммов ягод собрали обе бригады за ' + d + ' ' + R.plural(d, ['день', 'дня', 'дней']) + '?';
      right = ['(', a, '+', a, '+', b, ')', '×', d];
      wr = [[a, '+', a, '+', b, '×', d], [a, '×', d, '+', b], ['(', a, '+', b, ')', '×', d], [a, '+', '(', a, '+', b, ')', '×', d], [a, '×', d, '×', b]];
    }
    var ev = R.evalSteps(right), rt = et(right), seen = {}, wrong = [];
    seen[rt] = 1;
    shuffle(wr).forEach(function (w) {
      var x = R.evalSteps(w), s = et(w);
      if (wrong.length < 3 && x.ok && x.value > 0 && x.value !== ev.value && !seen[s]) { seen[s] = 1; wrong.push(s); }
    });
    if (!ev.ok || wrong.length < 3) return gens.amMulExprChoice(o);
    return choiceQ(text + '<br><span class="soft">Какое выражение решает задачу?</span>', rt, wrong,
      'Реши задачу по действиям, а потом запиши все действия одним выражением. Помни: умножение выполняется раньше сложения и вычитания.',
      'Верное выражение: ' + expr(rt) + '. Считаем по порядку действий:<br>' + ev.steps.map(function (s, i) { return (i + 1) + ') ' + s.text; }).join('<br>') + '<br>Ответ: ' + fmt(ev.value) + '.', true);
  });

  /* PART6 */
})(typeof window !== 'undefined' ? window : globalThis);
