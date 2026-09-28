/* Общие «движки» для курса: запись умножения и деления столбиком (уголком),
   пошаговые разборы и вычислитель выражений с порядком действий.
   Подключается после gens-addsub.js, перед gens-…/lessons-…. */
(function (G) {
  'use strict';
  var R = G.RKS, fmt = R.fmt;

  /* названия разрядов по номеру (1 = единицы) */
  R.RANK_FORMS = [null,
    ['единица', 'единицы', 'единиц'], ['десяток', 'десятка', 'десятков'], ['сотня', 'сотни', 'сотен'],
    ['тысяча', 'тысячи', 'тысяч'], ['десяток тысяч', 'десятка тысяч', 'десятков тысяч'], ['сотня тысяч', 'сотни тысяч', 'сотен тысяч'],
    ['миллион', 'миллиона', 'миллионов'], ['десяток миллионов', 'десятка миллионов', 'десятков миллионов'], ['сотня миллионов', 'сотни миллионов', 'сотен миллионов'],
    ['миллиард', 'миллиарда', 'миллиардов'], ['десяток миллиардов', 'десятка миллиардов', 'десятков миллиардов'], ['сотня миллиардов', 'сотни миллиардов', 'сотен миллиардов']];
  R.RANK_NOM = ['', 'единицы', 'десятки', 'сотни', 'тысячи', 'десятки тысяч', 'сотни тысяч', 'миллионы', 'десятки миллионов', 'сотни миллионов', 'миллиарды', 'десятки миллиардов', 'сотни миллиардов'];
  /* «57 десятков», «1 сотня» */
  R.rankCount = function (n, rank) { return fmt(n) + ' ' + R.plural(n, R.RANK_FORMS[rank]); };

  function rev(n) { return String(n).split('').reverse().map(Number); }
  function digs(n) { return String(n).length; }

  /* ---------- строка из клеток ---------- */
  function cellsEnd(str, endCol, w) {
    var arr = [], start = endCol - str.length + 1;
    for (var c = 0; c < w; c++) { var k = c - start; arr.push(k >= 0 && k < str.length ? str.charAt(k) : ''); }
    return arr;
  }
  function rowHTML(cls, sign, arr, ul) {
    var w = arr.length, h = '<span class="cc-row ' + cls + '"><span class="cc-op">' + (sign || '') + '</span>';
    for (var j = 0; j < w; j++) {
      var p = w - 1 - j, gap = (p % 3 === 2 && j > 0) ? ' gap' : '', u = (ul && ul[j]) ? ' ul' : '';
      h += '<span class="cc-d' + gap + u + '">' + (arr[j] === '' ? '&nbsp;' : arr[j]) + '</span>';
    }
    return h + '</span>';
  }
  function blankArr(w) { var a = []; for (var i = 0; i < w; i++) a.push(''); return a; }

  /* ================= умножение ================= */
  /* R.mulHTML(a, b, {bare:true}) — bare: только множители, без решения */
  R.mulHTML = function (a, b, o) {
    o = o || {};
    var r = a * b, sa = String(a), sb = String(b), parts = [], j;
    for (j = 0; j < sb.length; j++) {
      var dj = Number(sb.charAt(sb.length - 1 - j));
      if (dj) parts.push({ val: a * dj, shift: j });
    }
    var w = Math.max(digs(r), sa.length, sb.length);
    var html = '<span class="colcalc" role="img" aria-label="' + fmt(a) + ' умножить на ' + fmt(b) + (o.bare ? '' : ' равно ' + fmt(r)) + '">';
    /* запомненные при умножении на однозначное */
    if (!o.bare && sb.length === 1) {
      var top = blankArr(w), A = rev(a), c = 0, d = Number(sb);
      for (var i = 0; i < A.length; i++) {
        var t = A[i] * d + c; c = Math.floor(t / 10);
        if (c && i + 1 < A.length) top[w - 1 - (i + 1)] = String(c);
      }
      html += rowHTML('cc-mark', '', top);
    }
    html += rowHTML('cc-a', '', cellsEnd(sa, w - 1, w));
    html += rowHTML('cc-b', '×', cellsEnd(sb, w - 1, w));
    if (o.bare) {
      html += rowHTML('cc-line', '', blankArr(w));
    } else if (parts.length <= 1) {
      html += rowHTML('cc-line', '', cellsEnd(String(r), w - 1, w));
    } else {
      parts.forEach(function (p, k) {
        html += rowHTML(k === 0 ? 'cc-line' : '', k === parts.length - 1 ? '+' : '', cellsEnd(String(p.val), w - 1 - p.shift, w));
      });
      html += rowHTML('cc-line', '', cellsEnd(String(r), w - 1, w));
    }
    return html + '</span>';
  };

  R.mulSteps = function (a, b) {
    var out = [], sb = String(b), A = rev(a), i;
    function single(x, dd, label) {
      var c = 0, lines = [];
      for (i = 0; i < A.length; i++) {
        var p = A[i] * dd, t = p + c, tx = R.RANK_NOM[i + 1] + ': ' + A[i] + ' × ' + dd + ' = ' + p;
        if (c) tx += ', и ещё ' + c + ' = ' + t;
        if (i < A.length - 1) tx += t >= 10 ? ' → пишем ' + (t % 10) + ', запоминаем ' + Math.floor(t / 10) : ' → пишем ' + t;
        else tx += ' → пишем ' + t;
        c = Math.floor(t / 10); lines.push(tx);
      }
      return lines;
    }
    if (sb.length === 1) return single(a, b);
    var nz = [], j;
    for (j = 0; j < sb.length; j++) { var dj = Number(sb.charAt(sb.length - 1 - j)); nz.push({ d: dj, j: j }); }
    var real = nz.filter(function (x) { return x.d; });
    var ord = ['первое', 'второе', 'третье', 'четвёртое'], k = 0;
    if (real.length === 1) {
      var only = real[0];
      out.push('Умножаем на ' + only.d + ' (' + R.rankCount(only.d, only.j + 1) + '): ' + fmt(a) + ' × ' + only.d + ' = ' + fmt(a * only.d));
      if (only.j) out.push('Множитель оканчивается на ' + only.j + ' ' + R.plural(only.j, ['ноль', 'нуля', 'нулей']) + ' — приписываем ' + (only.j === 1 ? 'его' : 'их') + ' справа: ' + fmt(a * only.d * Math.pow(10, only.j)));
      return out;
    }
    nz.forEach(function (x) {
      var lab = R.RANK_NOM[x.j + 1];
      if (!x.d) { out.push('В разряде ' + R.RANK_FORMS[x.j + 1][2] + ' множителя стоит 0. Неполное произведение равно 0, эту строку не пишем, но сдвиг сохраняем.'); return; }
      var pv = a * x.d;
      out.push('Умножаем на ' + x.d + ' (' + R.rankCount(x.d, x.j + 1) + ')' + (x.j ? ', пишем со сдвигом на ' + x.j + ' ' + R.plural(x.j, ['разряд', 'разряда', 'разрядов']) + ' влево' : '') +
        ': ' + fmt(a) + ' × ' + x.d + ' = ' + fmt(pv) + ' — ' + ord[k++] + ' неполное произведение');
    });
    out.push('Складываем неполные произведения: ' + real.map(function (x) { return fmt(a * x.d * Math.pow(10, x.j)); }).join(' + ') + ' = ' + fmt(a * b));
    return out;
  };

  /* ================= деление уголком ================= */
  R.divCalc = function (a, d) {
    var s = String(a), n = s.length, m = 1, cur = Number(s.charAt(0)), st = [], q = '', rem, i;
    while (cur < d && m < n) { cur = cur * 10 + Number(s.charAt(m)); m++; }
    rem = 0;
    for (i = m - 1; i < n; i++) {
      if (i === m - 1) cur = Number(s.slice(0, m)); else cur = rem * 10 + Number(s.charAt(i));
      var qd = Math.floor(cur / d), prod = qd * d;
      rem = cur - prod; q += qd;
      st.push({ i: i, cur: cur, q: qd, prod: prod, rem: rem });
    }
    return { m: m, q: Number(q), qs: q, rem: rem, steps: st, n: n, s: s };
  };

  /* R.divHTML(a, d, {bare:true}) */
  R.divHTML = function (a, d, o) {
    o = o || {};
    var c = R.divCalc(a, d), n = c.n, s = c.s, rows = '';
    rows += rowHTML('cc-a', '', cellsEnd(s, n - 1, n));
    if (!o.bare) {
      c.steps.forEach(function (t, k) {
        var i = t.i;
        if (t.q > 0) {
          var ps = String(t.prod), start = i - ps.length + 1, arr = cellsEnd(ps, i, n), ul = blankArr(n), sign = '';
          for (var x = start; x <= i; x++) ul[x] = true;
          if (start - 1 >= 0) { arr[start - 1] = '−'; } else sign = '−';
          rows += rowHTML('cc-pr', sign, arr, ul);
        }
        if (i < n - 1) rows += rowHTML('cc-rem', '', cellsEnd(String(t.rem * 10 + Number(s.charAt(i + 1))), i + 1, n));
        else if (t.q > 0) rows += rowHTML('cc-rem', '', cellsEnd(String(t.rem), i, n));
      });
    }
    var right = '<span class="dv-r"><span class="dv-div">' + fmt(d) + '</span><span class="dv-q">' + (o.bare ? '&nbsp;' : fmt(c.q)) + '</span></span>';
    return '<span class="colcalc divcalc" role="img" aria-label="' + fmt(a) + ' разделить на ' + fmt(d) + (o.bare ? '' : ' равно ' + fmt(c.q) + (c.rem ? ', остаток ' + c.rem : '')) + '">' +
      '<span class="dv-l">' + rows + '</span>' + right + '</span>';
  };

  R.divSteps = function (a, d) {
    var c = R.divCalc(a, d), n = c.n, out = [];
    c.steps.forEach(function (t, k) {
      var r = n - t.i, rc = R.rankCount(t.cur, r), tx;
      if (k === 0) {
        tx = c.m === 1 ? 'Берём первую цифру: ' + rc + '.' : 'Первая цифра ' + c.s.charAt(0) + ' меньше ' + fmt(d) + ', берём первые ' + c.m + ' ' + R.plural(c.m, ['цифру', 'цифры', 'цифр']) + ': ' + rc + '.';
      } else {
        tx = 'Сносим ' + c.s.charAt(t.i) + ' — получилось ' + rc + '.';
      }
      if (t.q === 0) tx += t.cur === 0 ? ' Ноль делится на любое число: в частном пишем 0.' : ' ' + fmt(t.cur) + ' меньше ' + fmt(d) + ', поэтому в частном пишем 0 и сносим следующую цифру.';
      else {
        tx += ' Сколько раз по ' + fmt(d) + ' в ' + fmt(t.cur) + '? ' + t.q + ' раз' + (t.q >= 2 && t.q <= 4 ? 'а' : '') + ': ' + t.q + ' × ' + fmt(d) + ' = ' + fmt(t.prod) + '; ' + fmt(t.cur) + ' − ' + fmt(t.prod) + ' = ' + fmt(t.rem) + '.';
      }
      out.push(tx);
    });
    out.push(c.rem ? 'Остаток ' + fmt(c.rem) + ', он меньше делителя ' + fmt(d) + '.' : 'Остатка нет — деление выполнено.');
    return out;
  };

  /* ================= сложение нескольких чисел столбиком ================= */
  R.sumColHTML = function (nums, o) {
    o = o || {};
    var r = nums.reduce(function (x, y) { return x + y; }, 0), w = Math.max(digs(r), Math.max.apply(null, nums.map(digs)));
    var html = '<span class="colcalc" role="img" aria-label="' + nums.map(fmt).join(' плюс ') + (o.bare ? '' : ' равно ' + fmt(r)) + '">';
    nums.forEach(function (x, k) { html += rowHTML(k === 0 ? 'cc-a' : 'cc-b', k === nums.length - 1 ? '+' : '', cellsEnd(String(x), w - 1, w)); });
    html += rowHTML('cc-line', '', o.bare ? blankArr(w) : cellsEnd(String(r), w - 1, w));
    return html + '</span>';
  };
  R.sumSteps = function (nums) {
    var w = Math.max.apply(null, nums.map(digs)), rows = nums.map(rev), c = 0, out = [];
    for (var i = 0; i < w + 2; i++) {
      var terms = [], sum = c;
      rows.forEach(function (rw) { if (i < rw.length) { terms.push(rw[i]); sum += rw[i]; } });
      if (!terms.length && !c) break;
      var last = !rows.some(function (rw) { return i + 1 < rw.length; }), tx;
      if (terms.length === 1 && !c) tx = R.RANK_NOM[i + 1] + ': сносим ' + terms[0];
      else if (!terms.length) tx = 'в конце остался запомненный ' + c + ' — записываем его слева';
      else {
        tx = R.RANK_NOM[i + 1] + ': ' + terms.join(' + ') + (c ? ' + ' + c + ' (запомнили)' : '') + ' = ' + sum;
        if (last) tx += ' → пишем ' + sum;
        else tx += sum >= 10 ? ' → пишем ' + (sum % 10) + ', запоминаем ' + Math.floor(sum / 10) : ' → пишем ' + sum;
      }
      out.push(tx);
      c = last ? 0 : Math.floor(sum / 10);
      if (last) break;
    }
    return out;
  };

  /* ================= выражения и порядок действий ================= */
  /* токены: числа и строки '+', '−', '×', ':', '(', ')' */
  R.exprText = function (tokens) {
    var NB = R.NB, out = '';
    tokens.forEach(function (t, i) {
      if (typeof t === 'number') out += fmt(t);
      else if (t === '(') out += (i > 0 && tokens[i - 1] !== '(' ? NB : '') + '(';
      else if (t === ')') out += ')';
      else out += NB + t + NB;
    });
    return out.replace(/\( /g, '(');
  };
  function applyOp(x, op, y) {
    if (op === '+') return x + y;
    if (op === '−') return x - y;
    if (op === '×') return x * y;
    if (y === 0 || x % y !== 0) return NaN;
    return x / y;
  }
  /* решает по правилам; steps — список {a, op, b, r, text}; ok=false, если где-то не целое или отрицательное */
  R.evalSteps = function (tokens) {
    var steps = [], ok = true;
    function solve(t) {
      t = t.slice();
      var i, j;
      for (;;) {
        var close = t.indexOf(')');
        if (close < 0) break;
        var open = close; while (t[open] !== '(') open--;
        var inner = solve(t.slice(open + 1, close));
        t.splice(open, close - open + 1, inner);
      }
      function pass(ops) {
        for (i = 1; i < t.length; i += 2) {
          if (ops.indexOf(t[i]) >= 0) {
            var x = t[i - 1], y = t[i + 1], r = applyOp(x, t[i], y);
            if (!isFinite(r) || r < 0 || r > 1e12) { ok = false; r = 0; }
            steps.push({ a: x, op: t[i], b: y, r: r, text: fmt(x) + ' ' + t[i] + ' ' + fmt(y) + ' = ' + fmt(r) });
            t.splice(i - 1, 3, r); i -= 2;
          }
        }
      }
      pass(['×', ':']); pass(['+', '−']);
      return t[0];
    }
    var value = solve(tokens);
    return { value: value, steps: steps, ok: ok };
  };
})(typeof window !== 'undefined' ? window : globalThis);
