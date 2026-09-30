/* Генераторы блока «Порядок действий, скобки, задачи способом отношений» (уроки 52–59).
   Префикс имён: or. Числа каждый раз новые; ответы — целые неотрицательные. */
(function (G) {
  'use strict';
  var R = G.RKS;
  var rand = R.rand, pick = R.pick, shuffle = R.shuffle, fmt = R.fmt, NB = R.NB;
  var gens = R.gens;


  /* ================= общие мелочи ================= */
  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function expr(s) { return '<span class="expr or-expr">' + s + '</span>'; }
  function unit(n, forms) { return fmt(n) + NB + R.plural(n, forms); }
  function stepsHTML(list, ans) {
    return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>') + '<br>Ответ: ' + ans + '.';
  }
  function isNum(x) { return typeof x === 'number'; }
  function prec(op) { return (op === '+' || op === '−') ? 1 : 2; }
  function rnDig(d) { return rand(Math.pow(10, d - 1), Math.pow(10, d) - 1); }
  function pickW(list) { /* list: [[значение, вес], …] */
    var s = 0, i; for (i = 0; i < list.length; i++) s += list[i][1];
    var x = Math.random() * s;
    for (i = 0; i < list.length; i++) { x -= list[i][1]; if (x < 0) return list[i][0]; }
    return list[list.length - 1][0];
  }
  function distinctPick(right, cands, k) {
    var seen = {}, out = []; seen[right] = 1;
    shuffle(cands).forEach(function (c) { if (out.length < k && !seen[c]) { seen[c] = 1; out.push(c); } });
    return out;
  }
  /* регистрация генератора: имя свободно, тексты чистятся R.tidy */
  function reg(name, fn) {
    if (gens[name]) throw new Error('дубль ' + name);
    gens[name] = function (o) {
      var q = fn(o || {});
      q.html = R.tidy(q.html); q.explain = R.tidy(q.explain); q.hint = R.tidy(q.hint);
      return q;
    };
  }

  /* ================= выражения: текст, вычисление, порядок действий ================= */
  /* запись выражения: пробел неразрывный перед знаком, обычный после него (перенос строки — после знака) */
  function orText(tokens) {
    var out = '';
    tokens.forEach(function (t) {
      if (isNum(t)) out += fmt(t);
      else if (t === '(' || t === ')') out += t;
      else out += NB + t + ' ';
    });
    return out.replace(/\s+$/, '');
  }
  R.orText = orText;

  function applyOp(x, op, y) {
    if (op === '+') return x + y;
    if (op === '−') return x - y;
    if (op === '×') return x * y;
    if (y === 0 || x % y !== 0) return NaN;
    return x / y;
  }
  /* вычисление по правилам; steps содержат pos — номер знака в массиве tokens */
  function orEval(tokens) {
    var steps = [], ok = true;
    var items = tokens.map(function (t, i) {
      return isNum(t) ? { n: t } : (t === '(' || t === ')') ? { p: t } : { o: t, i: i };
    });
    function solve(arr) {
      arr = arr.slice();
      for (;;) {
        var close = -1, k;
        for (k = 0; k < arr.length; k++) if (arr[k].p === ')') { close = k; break; }
        if (close < 0) break;
        var open = close; while (arr[open].p !== '(') open--;
        var inner = solve(arr.slice(open + 1, close));
        arr.splice(open, close - open + 1, inner);
      }
      function pass(set) {
        for (var i = 1; i < arr.length; i += 2) {
          if (arr[i].o && set.indexOf(arr[i].o) >= 0) {
            var x = arr[i - 1].n, y = arr[i + 1].n, r = applyOp(x, arr[i].o, y);
            if (!isFinite(r) || r < 0 || r > 1e12) { ok = false; r = 0; }
            steps.push({ a: x, op: arr[i].o, b: y, r: r, pos: arr[i].i });
            arr.splice(i - 1, 3, { n: r }); i -= 2;
          }
        }
      }
      pass(['×', ':']); pass(['+', '−']);
      return arr[0];
    }
    var res = solve(items);
    return { value: res.n, steps: steps, ok: ok };
  }
  R.orEval = orEval;
  function stepText(s) { return fmt(s.a) + ' ' + s.op + ' ' + fmt(s.b) + ' = ' + fmt(s.r); }

  /* неправильные способы вычисления (для «ловушек»): ltr — подряд слева направо, rev — сначала +/−, nobr — без скобок */
  function evalMode(tokens, mode) {
    var t = mode === 'nobr' ? tokens.filter(function (x) { return x !== '(' && x !== ')'; }) : tokens.slice();
    var pr = function (op) { return mode === 'ltr' ? 1 : mode === 'rev' ? (op === '+' || op === '−' ? 2 : 1) : prec(op); };
    var bad = false;
    function solve(a) {
      a = a.slice();
      for (;;) {
        var close = a.indexOf(')');
        if (close < 0) break;
        var open = close; while (a[open] !== '(') open--;
        a.splice(open, close - open + 1, solve(a.slice(open + 1, close)));
      }
      [2, 1].forEach(function (lv) {
        for (var i = 1; i < a.length; i += 2) {
          if (pr(a[i]) === lv) {
            var r = applyOp(a[i - 1], a[i], a[i + 1]);
            if (!isFinite(r) || r < 0) { bad = true; r = 0; }
            a.splice(i - 1, 3, r); i -= 2;
          }
        }
      });
      return a[0];
    }
    var v = solve(t);
    return bad ? NaN : v;
  }

  /* выражение с номерами действий над знаками */
  function orNumbered(tokens, ev) {
    var no = {};
    ev.steps.forEach(function (s, k) { no[s.pos] = k + 1; });
    var chunks = [], cur = '';
    tokens.forEach(function (t, i) {
      if (isNum(t)) cur += '<span class="or-t">' + fmt(t) + '</span>';
      else if (t === '(' || t === ')') cur += '<span class="or-t">' + t + '</span>';
      else { cur += '<span class="or-op"><i class="or-n">' + no[i] + '</i>' + t + '</span>'; chunks.push(cur); cur = ''; }
    });
    if (cur) chunks.push(cur);
    return '<span class="or-seq">' + chunks.map(function (c) { return '<span class="or-g">' + c + '</span>'; }).join(' ') + '</span>';
  }
  R.orNumbered = function (tokens) { return orNumbered(tokens, orEval(tokens)); };

  /* цепочка равенств: по одному действию в строке */
  function reduceOnce(tk) {
    tk = tk.slice();
    var close = tk.indexOf(')'), lo = 0, hi = tk.length - 1, open = -1, i, idx = -1;
    if (close >= 0) { open = close; while (tk[open] !== '(') open--; lo = open + 1; hi = close - 1; }
    for (i = lo + 1; i <= hi; i += 2) if (tk[i] === '×' || tk[i] === ':') { idx = i; break; }
    if (idx < 0) for (i = lo + 1; i <= hi; i += 2) if (tk[i] === '+' || tk[i] === '−') { idx = i; break; }
    if (idx < 0) { tk.splice(open, 3, tk[open + 1]); return tk; }
    var r = applyOp(tk[idx - 1], tk[idx], tk[idx + 1]);
    tk.splice(idx - 1, 3, r);
    if (open >= 0 && tk[open + 2] === ')' && !isNum(tk[open]) && tk[open] === '(') tk.splice(open, 3, tk[open + 1]);
    return tk;
  }
  function chainList(tokens) {
    var list = [tokens], cur = tokens, g = 0;
    while (cur.length > 1 && g++ < 30) { cur = reduceOnce(cur); list.push(cur); }
    return list;
  }
  function chainHTML(tokens) {
    var list = chainList(tokens);
    return '<span class="or-chain">' + list.map(function (tk, i) {
      return '<span class="or-cl">' + (i ? '= ' : '') + orText(tk) + '</span>';
    }).join('') + '</span>';
  }
  R.orChain = chainHTML;
  R.orChainInline = function (tokens) { return chainList(tokens).map(orText).join(' = '); };

  /* ================= деревья выражений (для задач и генерации примеров) ================= */
  function TN(op, l, r, q, u, keep) { return { op: op, l: l, r: r, q: q || '', u: u || '', keep: !!keep }; }
  function tv(n) {
    if (isNum(n)) return n;
    if (n.v != null) return n.v;
    var a = tv(n.l), b = tv(n.r), v;
    if (isNaN(a) || isNaN(b)) v = NaN;
    else v = applyOp(a, n.op, b);
    if (!(v >= 0) || v !== Math.floor(v) || v > 1e12) v = NaN;
    n.v = v; return v;
  }
  function ttoks(n, out) {
    if (isNum(n)) { out.push(n); return; }
    var wl = !isNum(n.l) && (prec(n.l.op) < prec(n.op) || n.l.keep);
    var wr = !isNum(n.r) && (prec(n.r.op) < prec(n.op) || n.r.keep ||
      (prec(n.r.op) === prec(n.op) && !(n.r.op === n.op && (n.op === '+' || n.op === '×'))));
    if (wl) out.push('('); ttoks(n.l, out); if (wl) out.push(')');
    out.push(n.op);
    if (wr) out.push('('); ttoks(n.r, out); if (wr) out.push(')');
  }
  function treeTokens(n) { var o = []; ttoks(n, o); return o; }
  function postOrder(n, out, seen) {
    out = out || []; seen = seen || [];
    if (isNum(n) || seen.indexOf(n) >= 0) return out;
    postOrder(n.l, out, seen); postOrder(n.r, out, seen);
    seen.push(n); out.push(n);
    return out;
  }
  function treeLeaves(n, out) {
    out = out || [];
    if (isNum(n)) out.push(n); else { treeLeaves(n.l, out); treeLeaves(n.r, out); }
    return out;
  }
  function countParens(tokens) { return tokens.filter(function (t) { return t === '('; }).length; }
  function nestDepth(tokens) {
    var d = 0, m = 0;
    tokens.forEach(function (t) { if (t === '(') { d++; if (d > m) m = d; } else if (t === ')') d--; });
    return m;
  }

  /* строка действий задачи: «Вопрос? a ∘ b = c (ед.)» */
  /* единицы-слова в скобках и в ответе согласуются с числом (вёдер → ведро / ведра / вёдер) */
  var UF = { 'вёдер': ['ведро', 'ведра', 'вёдер'], 'яиц': ['яйцо', 'яйца', 'яиц'], 'шаров': ['шар', 'шара', 'шаров'], 'плиток': ['плитка', 'плитки', 'плиток'], 'мест': ['место', 'места', 'мест'], 'книг': ['книга', 'книги', 'книг'] };
  function uw(v, u) { return UF[u] ? R.plural(v, UF[u]) : u; }
  function actionLine(n) {
    var t = fmt(tv(n.l)) + ' ' + n.op + ' ' + fmt(tv(n.r)) + ' = ' + fmt(tv(n)) + (n.u ? ' (' + uw(tv(n), n.u) + ')' : '');
    return (n.q ? n.q + ' ' : '') + t;
  }
  function planList(root) { return postOrder(root).map(actionLine); }

  /* ================= генерация числовых выражений ================= */
  var MAG = {
    ment:  { dig: [1, 2], mdig: [1, 1], ddig: [1, 1], qmax: 20,   maxV: 900,     leafMax: 999,    rnd: 0.85 },
    small: { dig: [2, 3], mdig: [1, 2], ddig: [1, 2], qmax: 60,   maxV: 30000,   leafMax: 9999,   rnd: 0.6 },
    mid:   { dig: [3, 4], mdig: [1, 2], ddig: [1, 2], qmax: 300,  maxV: 400000,  leafMax: 99999,  rnd: 0.5 },
    big:   { dig: [3, 5], mdig: [2, 3], ddig: [2, 3], qmax: 2000, maxV: 6000000, leafMax: 999999, rnd: 0.3 }
  };
  function freeLeaf(cx, role) {
    var rg = role === 'm' ? cx.mdig : role === 'd' ? cx.ddig : cx.dig;
    var d = rand(rg[0], rg[1]), v = rnDig(d);
    if (d >= 2 && Math.random() < cx.rnd) {
      var z = rand(1, d - 1), p = Math.pow(10, z);
      v = Math.round(v / p) * p;
      if (v < Math.pow(10, d - 1)) v = Math.pow(10, d - 1);
      if (v >= Math.pow(10, d)) v = Math.pow(10, d) - p;
    }
    return Math.max(2, v);
  }
  /* разбиение числа t на две части (для сложения / вычитаемого) */
  function splitVal(t, cx, lo, hi) {
    var p = Math.pow(10, Math.max(0, String(t).length - 2)), a = Math.round(t * (lo + Math.random() * (hi - lo)));
    if (Math.random() < cx.rnd && p > 1) a = Math.round(a / p) * p;
    if (a < 1) a = 1;
    if (a > t - 1) a = t - 1;
    return a;
  }
  function factorPairs(t, cx) {
    var out = [], lim = Math.floor(Math.sqrt(t)), i, maxSmall = Math.pow(10, cx.mdig[1]) - 1;
    for (i = 2; i <= lim; i++) if (t % i === 0 && (i <= maxSmall)) out.push([i, t / i]);
    return out;
  }
  function build(sh, tg, cx, role) {
    var l, r, d, q, a, b, prs;
    if (!sh) {
      var v = tg != null ? tg : freeLeaf(cx, role);
      if (v < 1 || v > cx.leafMax) return null;
      if ((role === 'm' || role === 'd') && v < 2) return null;
      return v;
    }
    if (sh.op === '+') {
      if (tg == null) {
        l = build(sh.l, null, cx, 'p'); r = build(sh.r, null, cx, 'p');
      } else {
        if (tg < 2) return null;
        a = splitVal(tg, cx, 0.15, 0.85);
        l = build(sh.l, a, cx, 'p'); r = build(sh.r, tg - a, cx, 'p');
      }
    } else if (sh.op === '−') {
      if (tg == null) {
        l = build(sh.l, null, cx, 'p'); if (l == null) return null;
        var vl = tv(l); if (!(vl >= 2)) return null;
        r = build(sh.r, splitVal(vl, cx, 0.1, 0.9), cx, 'p');
      } else {
        b = splitVal(tg + 2, cx, 0.1, 1.0);
        l = build(sh.l, tg + b, cx, 'p'); r = build(sh.r, b, cx, 'p');
      }
    } else if (sh.op === '×') {
      if (tg == null) {
        l = build(sh.l, null, cx, 'p'); r = build(sh.r, null, cx, 'm');
      } else {
        prs = factorPairs(tg, cx); if (!prs.length) return null;
        var pr = pick(prs), sm = pr[0], bg = pr[1];
        if (Math.random() < 0.5) { l = build(sh.l, bg, cx, 'p'); r = build(sh.r, sm, cx, 'm'); }
        else { l = build(sh.l, sm, cx, 'm'); r = build(sh.r, bg, cx, 'p'); }
      }
    } else {
      r = build(sh.r, null, cx, 'd'); if (r == null) return null;
      d = tv(r); if (!(d >= 2)) return null;
      if (tg == null) {
        q = rand(2, cx.qmax);
        if (q > 20 && Math.random() < cx.rnd) q = Math.round(q / 10) * 10;
        tg = q;
      }
      if (tg * d > cx.maxV) return null;
      l = build(sh.l, tg * d, cx, 'p');
    }
    if (l == null || r == null) return null;
    var node = TN(sh.op, l, r);
    var val = tv(node);
    if (!(val >= 0) || val > cx.maxV) return null;
    return node;
  }
  function randShape(k, ws) {
    if (k === 0) return null;
    var op = pickW(ws), i = rand(0, k - 1);
    return { op: op, l: randShape(i, ws), r: randShape(k - 1 - i, ws) };
  }
  function shapeFromOps(ops) {
    var terms = [], lows = [], t = null;
    ops.forEach(function (op) {
      if (prec(op) === 2) t = { op: op, l: t, r: null };
      else { terms.push(t); lows.push(op); t = null; }
    });
    terms.push(t);
    var s = terms[0];
    lows.forEach(function (op, i) { s = { op: op, l: s, r: terms[i + 1] }; });
    return s;
  }
  function opWeights(allowed) {
    var w = { '+': 3, '−': 3, '×': 3, ':': 2.4 };
    return allowed.map(function (op) { return [op, w[op]]; });
  }
  /* o: k (число действий или [min,max]), mag, br: none | some | two | nest | any, stages: 2 — обе ступени, ops */
  function genExprTree(o) {
    var cx = MAG[o.mag || 'mid'], g, k, allowed = o.ops || ['+', '−', '×', ':'], ws = opWeights(allowed);
    for (g = 0; g < 500; g++) {
      k = Array.isArray(o.k) ? rand(o.k[0], o.k[1]) : (o.k || 3);
      var br = o.br || 'any', sh, opsList = [], i;
      if (br === 'none') {
        for (i = 0; i < k; i++) opsList.push(pickW(ws));
        sh = shapeFromOps(opsList);
      } else sh = randShape(k, ws);
      var root = build(sh, null, cx, 'p');
      if (root == null) continue;
      var tk = treeTokens(root), nb = countParens(tk), ev = orEval(tk);
      if (!ev.ok || !(ev.value >= 1) || ev.steps.length !== k) continue;
      if (br === 'none' && nb) continue;
      if (br === 'some' && nb < 1) continue;
      if (br === 'two' && nb < 2) continue;
      if (br === 'nest' && nestDepth(tk) < 2) continue;
      if (br !== 'nest' && nestDepth(tk) > 1) continue;
      if (nb > 2) continue;
      if ((o.mag || 'mid') === 'ment') {
        var lv = treeLeaves(root), ugly = 0;
        lv.forEach(function (x) { if (x > 12 && x % 5 !== 0) ugly++; if (x > 100 && x % 10 !== 0) ugly += 2; });
        if (ugly > 1) continue;
      }
      if (!ev.steps.every(function (s) { return s.a >= 2 && s.b >= 2 && s.r >= 2; })) continue;
      var lvs = treeLeaves(root).filter(function (x) { return x > 9; });
      if (lvs.some(function (x, ix) { return lvs.indexOf(x) !== ix; })) continue;
      if ((o.mag || 'mid') === 'ment' && ev.value < 8) continue;
      var cnt = {}; ev.steps.forEach(function (s) { cnt[s.op] = (cnt[s.op] || 0) + 1; });
      var hi = (cnt['×'] || 0) + (cnt[':'] || 0), lo = (cnt['+'] || 0) + (cnt['−'] || 0);
      if (o.stages === 2 && (!hi || !lo)) continue;
      if (Object.keys(cnt).length < Math.min(3, k) && k >= 3) continue;
      if (Math.max.apply(null, Object.keys(cnt).map(function (x) { return cnt[x]; })) > 2 && k >= 4) continue;
      return { root: root, tokens: tk, ev: ev };
    }
    /* запасной вариант — простое выражение */
    var tk2 = [120, '+', 30, '×', 4, '−', 50];
    return { root: null, tokens: tk2, ev: orEval(tk2) };
  }
  R.orExprGen = genExprTree;

  function stageHint(tk) {
    var hasBr = tk.indexOf('(') >= 0;
    var hi = tk.some(function (t) { return t === '×' || t === ':'; }), lo = tk.some(function (t) { return t === '+' || t === '−'; });
    if (hasBr) return 'Сначала выполни действия в скобках. Потом — умножение и деление, затем сложение и вычитание (слева направо).';
    return hi && lo ? 'Сначала умножение и деление (слева направо), потом сложение и вычитание.' : 'Действия одной ступени выполняй по порядку, слева направо.';
  }
  var OPNAMES = ['Сложение', 'Вычитание', 'Умножение', 'Деление'], OPSIGN = ['+', '−', '×', ':'];
  function ordinalRu(k) { return ['', 'первое', 'второе', 'третье', 'четвёртое', 'пятое'][k]; }

  /* вычисление с записью столбиком для больших чисел */
  function noTrailZero(x) { return x % 10 !== 0; }
  function bigStepHTML(s, k) {
    var head = (k + 1) + ') ' + stepText(s), col = '';
    if (s.op === '×' && noTrailZero(s.a) && noTrailZero(s.b) && (s.a >= 100 && s.b >= 10 || s.a >= 10 && s.b >= 100) && s.r < 1e9) {
      var a = Math.max(s.a, s.b), b = Math.min(s.a, s.b);
      col = R.mulHTML(a, b);
    } else if (s.op === ':' && s.a >= 1000 && noTrailZero(s.b) && s.b >= 2) col = R.divHTML(s.a, s.b);
    else if ((s.op === '+' || s.op === '−') && s.a >= 1000 && s.b >= 100 && noTrailZero(s.a) && noTrailZero(s.b)) col = R.colHTML(s.a, s.b, s.op === '+' ? '+' : '-');
    if (!col) return '<span class="or-line">' + head + '</span>';
    return '<div class="colrow">' + col + '<span class="colsteps">' + head + '</span></div>';
  }


  /* выражение с подписями под знаками (номера по порядку слева направо) */
  function orPositions(tokens) {
    var chunks = [], cur = '', k = 0;
    tokens.forEach(function (t) {
      if (isNum(t)) cur += '<span class="or-t">' + fmt(t) + '</span>';
      else if (t === '(' || t === ')') cur += '<span class="or-t">' + t + '</span>';
      else { k++; cur += '<span class="or-op"><i class="or-p">' + k + '</i>' + t + '</span>'; chunks.push(cur); cur = ''; }
    });
    if (cur) chunks.push(cur);
    return '<span class="or-seq">' + chunks.map(function (c) { return '<span class="or-g">' + c + '</span>'; }).join(' ') + '</span>';
  }

  /* ================= числовые выражения: задания ================= */
  reg('orExpr', function (o) {
    var g = genExprTree(o), tk = g.tokens, ev = g.ev, why;
    if (o.cols) {
      why = 'Порядок действий: ' + orNumbered(tk, ev) + '<br>' + ev.steps.map(bigStepHTML).join('') + 'Ответ: ' + num(ev.value) + '.';
    } else {
      why = 'Порядок действий: ' + orNumbered(tk, ev) + '<br>' + stepsHTML(ev.steps.map(stepText), num(ev.value));
    }
    return { kind: 'num', html: 'Найди значение выражения: ' + expr(orText(tk)), answer: ev.value, hint: stageHint(tk), explain: why, dbg: { tokens: tk } };
  });

  /* устный счёт: короткие выражения */
  reg('orMent', function (o) {
    var g = genExprTree({ mag: 'ment', k: o.k || [2, 3], br: o.br || 'any', stages: o.stages === false ? 0 : 2, ops: o.ops }), tk = g.tokens, ev = g.ev;
    return {
      kind: 'num', html: expr(orText(tk) + ' ='), answer: ev.value, hint: stageHint(tk),
      explain: R.orChainInline(tk) + '.', dbg: { tokens: tk }
    };
  });

  /* номера действий над знаками */
  reg('orNumbers', function (o) {
    var g = genExprTree({ mag: o.mag || 'small', k: o.k || [3, 4], br: o.br || 'any', stages: 2 }), tk = g.tokens, ev = g.ev, signs = [], ans = [], no = {};
    ev.steps.forEach(function (s, i) { no[s.pos] = i + 1; });
    tk.forEach(function (t, i) { if (!isNum(t) && t !== '(' && t !== ')') { signs.push({ label: (signs.length + 1) + '-й знак «' + t + '»' }); ans.push(no[i]); } });
    return {
      kind: 'nums', html: 'В каком порядке выполняются действия? Под каждым знаком стоит его номер слева направо. Впиши, каким по счёту выполняется действие с этим знаком.<br>' + orPositions(tk),
      fields: signs, answer: ans, hint: stageHint(tk),
      explain: 'Порядок действий: ' + orNumbered(tk, ev) + '<br>' + stepsHTML(ev.steps.map(stepText), num(ev.value)).replace(/<br>Ответ:.*$/, ''),
      dbg: { tokens: tk }
    };
  });

  /* какое действие выполняется первым / вторым / последним */
  reg('orFirst', function (o) {
    var g = genExprTree({ mag: o.mag || 'small', k: o.k || [3, 4], br: o.br || 'any', stages: 2 }), tk = g.tokens, ev = g.ev, st = ev.steps;
    var ask = pick(o.ask || ['first', 'second', 'last']), idx = ask === 'first' ? 0 : ask === 'second' ? 1 : st.length - 1;
    var t = st[idx], oi = OPSIGN.indexOf(t.op), word = ask === 'first' ? 'первым' : ask === 'second' ? 'вторым' : 'последним';
    return {
      kind: 'choice', html: 'Какое действие в выражении ' + expr(orText(tk)) + ' выполняется <b>' + word + '</b>?',
      options: OPNAMES, answer: oi, wide: false, hint: stageHint(tk),
      explain: 'Порядок действий: ' + orNumbered(tk, ev) + '<br>' + st.map(function (s, i) { return (i + 1) + ') ' + stepText(s); }).join('; ') + '. ' +
        'Действие, которое выполняется ' + word + ', — ' + OPNAMES[oi].toLowerCase().replace('ение', 'ение') + ' (' + stepText(t) + ').',
      dbg: { tokens: tk }
    };
  });

  /* результат N-го действия */
  reg('orStep', function (o) {
    var g = genExprTree({ mag: o.mag || 'small', k: o.k || [3, 4], br: o.br || 'any', stages: 2 }), tk = g.tokens, ev = g.ev, st = ev.steps;
    var idx = rand(0, Math.min(st.length - 2, 2)), ordw = ['первого', 'второго', 'третьего'][idx];
    return {
      kind: 'num', html: 'Найди результат <b>' + ordw + '</b> действия в выражении ' + expr(orText(tk)) + '.', answer: st[idx].r,
      hint: stageHint(tk) + ' Определи, какое действие ' + ['первое', 'второе', 'третье'][idx] + ', и выполни его' + (idx ? ' (и предыдущие)' : '') + '.',
      explain: 'Порядок действий: ' + orNumbered(tk, ev) + '<br>' + stepsHTML(st.map(stepText), num(ev.value)).replace(/<br>Ответ:.*$/, '') + '<br>Результат ' + ordw + ' действия: ' + num(st[idx].r) + '.',
      dbg: { tokens: tk }
    };
  });

  /* сколько всего действий и сколько из них второй ступени */
  reg('orCount', function (o) {
    var g = genExprTree({ mag: o.mag || 'small', k: o.k || [3, 5], br: o.br || 'any', stages: 2 }), tk = g.tokens, ev = g.ev;
    var all = ev.steps.length, hi = ev.steps.filter(function (s) { return s.op === '×' || s.op === ':'; }).length;
    return {
      kind: 'nums', html: 'Сколько действий надо выполнить в выражении ' + expr(orText(tk)) + '? Сколько из них — действия второй ступени (умножение и деление)?',
      fields: [{ label: 'всего действий' }, { label: 'из них второй ступени' }], answer: [all, hi],
      hint: 'Сколько в выражении знаков действий? Скобки — не действия.',
      explain: 'Знаки действий: ' + tk.filter(function (t) { return !isNum(t) && t !== '(' && t !== ')'; }).join(' ') + '. Всего действий: ' + all + '. Из них умножение и деление: ' + hi + '.<br>Порядок: ' + orNumbered(tk, ev),
      dbg: { tokens: tk }
    };
  });

  /* «ловушки»: выбери верный ответ среди типичных ошибок */
  reg('orTrap', function (o) {
    var g = genExprTree({ mag: o.mag || 'small', k: o.k || [3, 4], br: o.br || 'some', stages: 2 }), tk = g.tokens, ev = g.ev, right = ev.value, cands = [], seen = {}, used = {};
    seen[right] = 1;
    [['ltr', 'если выполнять действия подряд слева направо, не учитывая ступени'],
     ['nobr', 'если не обратить внимание на скобки'],
     ['rev', 'если сложение и вычитание выполнить раньше умножения и деления']].forEach(function (m) {
      var v = evalMode(tk, m[0]);
      if (!isNaN(v) && !seen[v] && v <= 99999999) { seen[v] = 1; cands.push({ v: v, why: m[1] }); }
    });
    var d = Math.pow(10, Math.max(1, String(right).length - 2)), slips = [right + d, right - d, right + 10, right - 10, right * 10];
    shuffle(slips).forEach(function (v) {
      if (cands.length < 3 && v > 0 && !seen[v]) { seen[v] = 1; cands.push({ v: v, why: 'при ошибке в вычислении одного из действий' }); }
    });
    if (cands.length < 3) return gens.orTrap(o);
    var wrong = cands.slice(0, 3), opts = shuffle([{ v: right, why: '' }].concat(wrong)), texts = opts.map(function (x) { return fmt(x.v); });
    return {
      kind: 'choice', html: 'Найди значение выражения и выбери верный ответ: ' + expr(orText(tk)), options: texts, answer: opts.findIndex(function (x) { return x.v === right; }), wide: false,
      hint: stageHint(tk),
      explain: 'Порядок действий: ' + orNumbered(tk, ev) + '<br>' + stepsHTML(ev.steps.map(stepText), num(right)).replace(/Ответ:/, 'Верный ответ:') +
        '<br><span class="soft">Другие числа получаются так: ' + wrong.map(function (x) { return fmt(x.v) + ' — ' + x.why; }).join('; ') + '.</span>',
      dbg: { tokens: tk }
    };
  });

  /* где поставить скобки (4 числа) */
  var BRPLACE = [[0, 1], [1, 2], [2, 3], [0, 2], [1, 3]];
  function withBrackets(nums, ops, pl) {
    var tk = [], i;
    for (i = 0; i < nums.length; i++) {
      if (pl && pl[0] === i) tk.push('(');
      tk.push(nums[i]);
      if (pl && pl[1] === i) tk.push(')');
      if (i < ops.length) tk.push(ops[i]);
    }
    return tk;
  }
  reg('orBrackets', function (o) {
    var n = o.n || 4, g, nums, ops, opts, plain, vals;
    for (g = 0; g < 600; g++) {
      nums = []; ops = [];
      var i;
      for (i = 0; i < n; i++) nums.push(pick([2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 200, 300]));
      if (nums.some(function (x, ix) { return nums.indexOf(x) !== ix; })) continue;
      for (i = 0; i < n - 1; i++) ops.push(pickW([['+', 3], ['−', 3], ['×', 3], [':', 2]]));
      if (ops.filter(function (x) { return prec(x) === 1; }).length === 0 || ops.filter(function (x) { return prec(x) === 2; }).length === 0) continue;
      var pls = BRPLACE.filter(function (p) { return n === 4 || p[1] - p[0] === 1 && p[1] <= n - 1; });
      if (n === 3) pls = [[0, 1], [1, 2]];
      var cand = pls.map(function (p) {
        var tk = withBrackets(nums, ops, p), ev = orEval(tk);
        return { p: p, tk: tk, ev: ev, text: orText(tk) };
      }).filter(function (c) { return c.ev.ok && c.ev.value >= 1 && c.ev.value <= 100000; });
      plain = orEval(withBrackets(nums, ops, null));
      var byVal = {};
      cand.forEach(function (c) { byVal[c.ev.value] = (byVal[c.ev.value] || 0) + 1; });
      var uniq = cand.filter(function (c) { return byVal[c.ev.value] === 1 && c.ev.value !== plain.value; });
      var needTotal = n === 3 ? 2 : 3;
      if (!uniq.length) continue;
      var right = pick(uniq), others = [], seenV = {};
      seenV[right.ev.value] = 1;
      shuffle(cand).forEach(function (c) { if (c !== right && !seenV[c.ev.value] && others.length < (n === 3 ? 1 : 3)) { seenV[c.ev.value] = 1; others.push(c); } });
      if (others.length + 1 < needTotal) continue;
      opts = shuffle([right].concat(others));
      var eq = orText(withBrackets(nums, ops, null)) + ' = ' + fmt(right.ev.value);
      return {
        kind: 'choice', html: 'Как надо поставить скобки, чтобы равенство было верным?<br>' + expr(eq),
        options: opts.map(function (c) { return c.text; }), answer: opts.indexOf(right), wide: true,
        hint: 'Сосчитай значение выражения при каждой расстановке скобок и сравни с числом справа от знака «=».',
        explain: opts.map(function (c) { return c.text + ' = ' + fmt(c.ev.value); }).join('; ') + '. Нужный результат ' + fmt(right.ev.value) + ' даёт ' + right.text + '.',
        dbg: { tokens: right.tk, target: right.ev.value }
      };
    }
    return gens.orBrackets({ n: 3 });
  });

  /* ================= выражения по словесному описанию ================= */
  function capFirst(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function wordPhrase(n, kase) {
    if (isNum(n)) return ({ acc: 'число ', gen: 'числа ', dat: 'числу ' })[kase] + fmt(n);
    var a = fmt(tv(n.l)), b = fmt(tv(n.r));
    var T = {
      '+': { acc: 'сумму чисел ', gen: 'суммы чисел ', dat: 'сумме чисел ' },
      '−': { acc: 'разность чисел ', gen: 'разности чисел ', dat: 'разности чисел ' },
      '×': { acc: 'произведение чисел ', gen: 'произведения чисел ', dat: 'произведению чисел ' }
    };
    if (n.op === ':') return ({ acc: 'частное от деления ', gen: 'частного от деления ', dat: 'частному от деления ' })[kase] + a + ' на ' + b;
    return T[n.op][kase] + a + ' и ' + b;
  }
  function wordRight(n) { return isNum(n) ? fmt(n) : wordPhrase(n, 'acc'); }
  function wordSentence(root) {
    var L = root.l, Rr = root.r, op = root.op, pats = [];
    if (op === '×') {
      pats.push(capFirst(wordPhrase(L, 'acc')) + ' умножить на ' + wordRight(Rr));
      if (isNum(Rr)) pats.push(capFirst(wordPhrase(L, 'acc')) + ' увеличить в ' + fmt(Rr) + ' ' + R.plural(Rr, ['раз', 'раза', 'раз']));
    } else if (op === ':') {
      pats.push(capFirst(wordPhrase(L, 'acc')) + ' разделить на ' + wordRight(Rr));
      if (isNum(Rr)) pats.push(capFirst(wordPhrase(L, 'acc')) + ' уменьшить в ' + fmt(Rr) + ' ' + R.plural(Rr, ['раз', 'раза', 'раз']));
    } else if (op === '+') {
      pats.push(capFirst(wordPhrase(L, 'acc')) + ' увеличить на ' + wordRight(Rr));
      pats.push('К ' + wordPhrase(L, 'dat') + ' прибавить ' + wordRight(Rr));
    } else {
      pats.push(capFirst(wordPhrase(L, 'acc')) + ' уменьшить на ' + wordRight(Rr));
      pats.push('Из ' + wordPhrase(L, 'gen') + ' вычесть ' + wordRight(Rr));
    }
    return pick(pats);
  }
  function wordShape() {
    var ops = ['+', '−', '×', ':'], rootOp = pick(ops), kind = pick(['L', 'R', 'LR', 'LR']), mk = function () { return { op: pick(ops), l: null, r: null }; };
    var sh = { op: rootOp, l: null, r: null };
    if (kind === 'L' || kind === 'LR') sh.l = mk();
    if (kind === 'R' || kind === 'LR') sh.r = mk();
    return sh;
  }
  function wordsTree(o) {
    var cx = MAG[o.mag || 'small'], g;
    for (g = 0; g < 300; g++) {
      var sh = wordShape(), root = build(sh, null, cx, 'p');
      if (root == null) continue;
      var tk = treeTokens(root), ev = orEval(tk);
      if (!ev.ok || !(ev.value >= 2) || !ev.steps.every(function (s) { return s.a >= 2 && s.b >= 2 && s.r >= 2; })) continue;
      var lv = treeLeaves(root); if (lv.some(function (x, ix) { return lv.indexOf(x) !== ix; })) continue;
      if (lv.filter(function (x) { return x < 10; }).length > 1) continue;
      if (o.needBr && countParens(tk) === 0) continue;
      if (o.needBr === false && countParens(tk) > 0) continue;
      return { root: root, tk: tk, ev: ev };
    }
    return wordsTree({ mag: 'small' });
  }
  function exprDistractors(tk, rightVal, want) {
    var out = [], base = orText(tk), seen = {}, cands = [], numIdx = [], i, j, opIdx = [];
    seen[base] = 1;
    tk.forEach(function (t, ix) { if (isNum(t)) numIdx.push(ix); else if (t !== '(' && t !== ')') opIdx.push(ix); });
    function add(t2, why) {
      var ev = orEval(t2), txt = orText(t2);
      if (!ev.ok || ev.value === rightVal || seen[txt] || !(ev.value >= 1)) return;
      seen[txt] = 1; cands.push({ tk: t2, text: txt, why: why, v: ev.value });
    }
    var flat = tk.filter(function (t) { return t !== '(' && t !== ')'; });
    if (flat.length !== tk.length) add(flat, 'nb');
    /* другая расстановка скобок */
    var fn = flat.map(function (t, ix) { return isNum(t) ? ix : -1; }).filter(function (x) { return x >= 0; });
    for (i = 0; i + 1 < fn.length; i++) for (j = i + 1; j <= i + 1; j++) {
      if (fn.length === 2) continue;
      var t3 = flat.slice(); t3.splice(fn[j] + 1, 0, ')'); t3.splice(fn[i], 0, '(');
      add(t3, 'br');
    }
    /* замена знака */
    opIdx.forEach(function (ix) {
      OPSIGN.forEach(function (nw) { if (nw !== tk[ix]) { var t4 = tk.slice(); t4[ix] = nw; add(t4, 'op'); } });
    });
    /* перестановка соседних чисел */
    for (i = 0; i + 1 < numIdx.length; i++) {
      var t5 = tk.slice(), a = numIdx[i], b = numIdx[i + 1], tmp = t5[a]; t5[a] = t5[b]; t5[b] = tmp;
      add(t5, 'sw');
    }
    var br = shuffle(cands.filter(function (c) { return c.why === 'br'; })), op = shuffle(cands.filter(function (c) { return c.why === 'op'; })), sw = shuffle(cands.filter(function (c) { return c.why === 'sw'; }));
    var nb0 = cands.filter(function (c) { return c.why === 'nb'; });
    var order = [].concat(nb0, br.slice(0, 2), op.slice(0, 1), sw.slice(0, 1), br.slice(2), op.slice(1), sw.slice(1));
    order.forEach(function (c) { if (out.length < want) out.push(c); });
    return out;
  }
  R.orExprDistractors = exprDistractors;

  reg('orWords', function (o) {
    var w = wordsTree({ mag: o.mag || 'small', needBr: o.needBr }), root = w.root, tk = w.tk, ev = w.ev, sentence = wordSentence(root);
    var mode = o.mode || 'expr';
    var comp = [], parts = [];
    [root.l, root.r].forEach(function (x) {
      if (!isNum(x)) parts.push('«' + wordPhrase(x, 'acc') + '» записываем так: ' + orText(treeTokens(x)));
    });
    if (mode === 'value') {
      return {
        kind: 'num', html: 'Запиши действия и выполни их: <b>' + sentence + '.</b> Чему равен результат?', answer: ev.value,
        hint: 'Сначала запиши выражение. Если сумму или разность надо взять целиком, поставь её в скобки.',
        explain: parts.join('; ') + '. Выражение: <span class="ex">' + orText(tk) + '</span>.<br>' + stepsHTML(ev.steps.map(stepText), num(ev.value)),
        dbg: { tokens: tk }
      };
    }
    var right = orText(tk), ds = exprDistractors(tk, ev.value, 3);
    if (ds.length < 3) return gens.orWords(o);
    var opts = shuffle([right].concat(ds.map(function (d) { return d.text; })));
    return {
      kind: 'choice', html: 'Какое выражение соответствует записи: <b>' + sentence + '</b>?', options: opts, answer: opts.indexOf(right), wide: true,
      hint: 'Разбери запись по частям: что надо сделать сначала? Что нужно взять целиком — в скобки?',
      explain: parts.join('; ') + (parts.length ? '. ' : '') + 'Получаем выражение <span class="ex">' + right + '</span>; его значение — ' + fmt(ev.value) + '.',
      dbg: { tokens: tk }
    };
  });

  /* ================= неизвестное число ================= */
  reg('orUnk', function (o) {
    var sz = o.size || 'mid', t = o.type || pick(['add', 'sub1', 'sub2', 'mul', 'div1', 'div2']), x, a, b, q, hint, why, ans;
    var S = { small: [10, 99, 2, 9], mid: [100, 999, 3, 12], big: [1000, 99999, 6, 60] }[sz];
    function big() { return rand(S[0], S[1]); }
    function rnd10(v) { return sz === 'small' ? v : Math.round(v / 10) * 10 || 10; }
    if (t === 'add') {
      a = rnd10(big()); x = rnd10(big()); b = a + x;
      q = Math.random() < 0.5 ? 'x + ' + fmt(a) + ' = ' + fmt(b) : fmt(a) + ' + x = ' + fmt(b);
      ans = x; hint = 'Неизвестное слагаемое = сумма − известное слагаемое.';
      why = 'x = ' + fmt(b) + ' − ' + fmt(a) + ' = ' + fmt(x);
    } else if (t === 'sub1') {
      b = rnd10(big()); a = rnd10(big()); x = a + b;
      q = 'x − ' + fmt(a) + ' = ' + fmt(b); ans = x; hint = 'Неизвестное уменьшаемое = разность + вычитаемое.';
      why = 'x = ' + fmt(b) + ' + ' + fmt(a) + ' = ' + fmt(x);
    } else if (t === 'sub2') {
      b = rnd10(big()); x = rnd10(big()); a = x + b;
      q = fmt(a) + ' − x = ' + fmt(b); ans = x; hint = 'Неизвестное вычитаемое = уменьшаемое − разность.';
      why = 'x = ' + fmt(a) + ' − ' + fmt(b) + ' = ' + fmt(x);
    } else if (t === 'mul') {
      a = rand(S[2], S[3]); x = rand(S[2], Math.max(S[3], 12)) * (sz === 'big' ? 10 : 1); b = a * x;
      q = Math.random() < 0.5 ? 'x × ' + a + ' = ' + fmt(b) : a + ' × x = ' + fmt(b);
      ans = x; hint = 'Неизвестный множитель = произведение : известный множитель.';
      why = 'x = ' + fmt(b) + ' : ' + a + ' = ' + fmt(x);
    } else if (t === 'div1') {
      a = rand(S[2], S[3]); b = rand(S[2], Math.max(S[3], 12)) * (sz === 'big' ? 10 : 1); x = a * b;
      q = 'x : ' + a + ' = ' + fmt(b); ans = x; hint = 'Неизвестное делимое = частное × делитель.';
      why = 'x = ' + fmt(b) + ' × ' + a + ' = ' + fmt(x);
    } else {
      b = rand(S[2], S[3]); x = rand(S[2], S[3]); a = b * x;
      q = fmt(a) + ' : x = ' + b; ans = x; hint = 'Неизвестный делитель = делимое : частное.';
      why = 'x = ' + fmt(a) + ' : ' + b + ' = ' + fmt(x);
    }
    return { kind: 'num', html: 'Найди неизвестное число: ' + expr(q), answer: ans, hint: hint, explain: why + '. Проверка: подставь x в равенство.', dbg: { eq: q } };
  });

  /* цепочка с круглыми числами */
  reg('orChainR', function (o) {
    var g, v, start, items, log, n = o.steps || rand(3, 4), first;
    for (g = 0; g < 200; g++) {
      var d = pick([20, 30, 40, 50, 60, 70, 80, 90]), qq = rand(2, 12);
      var a0 = d * qq, kind = pick(['div', 'mul']);
      if (kind === 'div') { first = fmt(a0) + ' : ' + d; v = qq; }
      else { var m0 = rand(2, 9) * 10, m1 = rand(2, 12) * 10; first = m0 + ' × ' + m1; v = m0 * m1; }
      items = []; log = [first + ' = ' + fmt(v)];
      var ok = true, i;
      for (i = 0; i < n && ok; i++) {
        var op = pick(['×', '×', ':', '+', '−']), k, nv;
        if (op === '×') { k = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60]); nv = v * k; }
        else if (op === ':') {
          var ds = []; for (var z = 2; z <= 90; z++) if (v % z === 0 && (z <= 12 || z % 10 === 0)) ds.push(z);
          if (!ds.length) { ok = false; break; }
          k = pick(ds); nv = v / k;
        } else if (op === '+') { k = pick([1, 2, 3, 4, 5, 6, 7, 8, 9]) * pick([10, 10, 50, 100]) + (Math.random() < 0.4 ? pick([5, 15, 25, 35]) : 0); nv = v + k; }
        else { if (v < 30) { ok = false; break; } k = Math.min(v - 1, rand(2, 9) * 10 + (Math.random() < 0.5 ? 5 : 0)); nv = v - k; }
        if (nv > 20000 || nv < 1) { ok = false; break; }
        items.push(op + NB + fmt(k)); log.push(fmt(v) + ' ' + op + ' ' + fmt(k) + ' = ' + fmt(nv)); v = nv;
      }
      if (ok && items.length === n) break;
    }
    var html = '<div class="chain"><span class="chain-start">' + first + '</span>' + items.map(function (t) { return '<span class="chain-op">' + t + '</span>'; }).join('') + '</div>';
    return { kind: 'num', html: 'Выполни цепочку по порядку:' + html, answer: v, hint: 'Первое число получи из первого действия, дальше выполняй действия одно за другим.', explain: log.join('; ') + '. Ответ: ' + fmt(v) + '.' };
  });

  /* деление с остатком */
  reg('orRem', function (o) {
    var d = rand(o.dmin || 3, o.dmax || 39), q = rand(o.qmin || 3, o.qmax || 25), r = rand(1, d - 1), a = d * q + r, t = o.type || pick(['rem', 'q']);
    var head = fmt(a) + ' : ' + fmt(d);
    return {
      kind: 'num', html: t === 'rem' ? 'Найди остаток при делении: ' + expr(head) : 'Найди неполное частное при делении: ' + expr(head), answer: t === 'rem' ? r : q,
      hint: 'Подбери наибольшее число, при умножении на которое делителя получится не больше делимого; остаток — разность.',
      explain: fmt(d) + ' × ' + q + ' = ' + fmt(d * q) + ', это не больше ' + fmt(a) + ', а ' + fmt(d) + ' × ' + (q + 1) + ' = ' + fmt(d * (q + 1)) + ' уже больше. Неполное частное ' + q + ', остаток ' + fmt(a) + ' − ' + fmt(d * q) + ' = ' + r + '. Остаток меньше делителя.'
    };
  });


  /* ================= составные задачи (деревья действий) ================= */
  var PT = [];
  function addT(id, acts, br, hint, fn) { PT.push({ id: id, acts: acts, br: br, hint: hint, fn: fn }); }
  function mult(sc, ok) { return (sc > 1 && ok) ? rand(4, 9) : 1; }
  var F_DAY = ['день', 'дня', 'дней'], F_HOUR = ['час', 'часа', 'часов'], F_MIN = ['минуту', 'минуты', 'минут'];
  var F_MIN_NOM = ['минуту', 'минуты', 'минут'], F_BOX = ['ящик', 'ящика', 'ящиков'], F_BAG = ['мешок', 'мешка', 'мешков'], F_ROW = ['ряд', 'ряда', 'рядов'];
  function nn(n, forms) { return fmt(n) + NB + R.plural(n, forms); }
  var FP_NOM = ['страница', 'страницы', 'страниц'], FP_ACC = ['страницу', 'страницы', 'страниц'], FD = ['деталь', 'детали', 'деталей'], FT = ['тетрадь', 'тетради', 'тетрадей'];
  var FM = ['место', 'места', 'мест'], FSH = ['штуку', 'штуки', 'штук'], FE = ['яйцо', 'яйца', 'яиц'], FH = ['человек', 'человека', 'человек'];

  /* 1. две группы: a×b + c×d */
  addT('two', [3, 3], false, 'Сначала найди каждую из двух частей отдельно (сколько стоят, сколько привезли), потом сложи.', function (sc) {
    var k = rand(0, 5), a, b, c, d, txt, q1, q2, q3, u, m;
    if (k === 0) {
      m = mult(sc, 1); a = rand(20, 60) * m; b = rand(15, 45) * 10; c = rand(30, 90) * m; d = rand(4, 12) * 5;
      txt = 'Школа купила ' + nn(a, ['учебник', 'учебника', 'учебников']) + ' по ' + fmt(b) + ' руб. и ' + nn(c, ['тетрадь', 'тетради', 'тетрадей']) + ' по ' + d + ' руб. Сколько рублей заплатила школа за покупку?';
      q1 = 'Сколько рублей стоят учебники?'; q2 = 'Сколько рублей стоят тетради?'; q3 = 'Сколько рублей заплатила школа?'; u = 'руб.';
    } else if (k === 1) {
      m = mult(sc, 1); a = rand(20, 80) * m; b = rand(12, 30); c = rand(20, 80) * m; d = rand(12, 30);
      txt = 'На склад привезли ' + nn(a, F_BOX) + ' яблок по ' + b + ' кг и ' + nn(c, F_BOX) + ' груш по ' + d + ' кг. Сколько килограммов фруктов привезли на склад?';
      q1 = 'Сколько килограммов яблок привезли?'; q2 = 'Сколько килограммов груш привезли?'; q3 = 'Сколько килограммов фруктов привезли всего?'; u = 'кг';
    } else if (k === 2) {
      if (sc > 1) return null;
      a = rand(12, 25); b = rand(18, 32); c = rand(6, 14); d = rand(20, 40);
      txt = 'В театре ' + nn(a, F_ROW) + ' по ' + nn(b, FM) + ' в партере и ' + nn(c, F_ROW) + ' по ' + nn(d, FM) + ' на балконе. Сколько всего мест в зале?';
      q1 = 'Сколько мест в партере?'; q2 = 'Сколько мест на балконе?'; q3 = 'Сколько всего мест в зале?'; u = 'мест';
    } else if (k === 3) {
      m = mult(sc, 1); a = rand(12, 40) * m; b = rand(24, 48); c = rand(8, 30) * m; d = rand(20, 45);
      txt = 'Пекарня за смену выпекла ' + nn(a, ['противень', 'противня', 'противней']) + ' булочек по ' + nn(b, FSH) + ' и ' + nn(c, ['противень', 'противня', 'противней']) + ' пирожков по ' + nn(d, FSH) + '. Сколько всего изделий выпекла пекарня за смену?';
      q1 = 'Сколько булочек выпекли?'; q2 = 'Сколько пирожков выпекли?'; q3 = 'Сколько всего изделий выпекли?'; u = 'шт.';
    } else if (k === 4) {
      if (sc > 1) return null;
      a = rand(3, 9); b = rand(15, 30); c = rand(2, 6); d = rand(25, 60);
      txt = 'Турист ' + nn(a, F_DAY) + ' шёл пешком по ' + b + ' км в день, а потом ' + nn(c, F_DAY) + ' плыл на лодке по ' + d + ' км в день. Сколько километров преодолел турист?';
      q1 = 'Сколько километров турист прошёл пешком?'; q2 = 'Сколько километров он проплыл на лодке?'; q3 = 'Сколько километров он преодолел всего?'; u = 'км';
    } else {
      m = mult(sc, 1); a = rand(20, 60) * m; b = rand(6, 16); c = rand(15, 45) * m; d = rand(8, 20);
      txt = 'В цехе ' + nn(a, ['рабочий', 'рабочих', 'рабочих']) + ' делают за смену по ' + nn(b, FD) + ', а ещё ' + nn(c, ['рабочий', 'рабочих', 'рабочих']) + ' — по ' + nn(d, FD) + '. Сколько деталей делают за смену все рабочие цеха?';
      q1 = 'Сколько деталей делают рабочие первой группы?'; q2 = 'Сколько деталей делают рабочие второй группы?'; q3 = 'Сколько деталей делают все рабочие?'; u = 'дет.';
    }
    var root = TN('+', TN('×', a, b, q1, u), TN('×', c, d, q2, u), q3, u);
    return { text: txt, root: root, unit: u, ansU: u };
  });

  /* 2. остаток после двух порций: T − a×b − c×d  или  T − (a×b + c×d) */
  addT('restTwo', [4, 4], null, 'Узнай, сколько взяли (продали, потратили) в первый раз и во второй, а потом посмотри, сколько осталось от всего.', function (sc) {
    var k = rand(0, 3), a, b, c, d, T, txt, q1, q2, u, qr, m, extra, qt, q0;
    if (k === 0) {
      m = mult(sc, 1); a = rand(6, 20) * m; b = rand(25, 50); c = rand(6, 20) * m; d = rand(25, 50); extra = rand(20, 120) * 10 * m;
      T = a * b + c * d + extra;
      txt = 'В магазине было ' + fmt(T) + ' кг картофеля. Утром продали ' + nn(a, F_BAG) + ' по ' + b + ' кг, а днём — ' + nn(c, F_BAG) + ' по ' + d + ' кг. Сколько килограммов картофеля осталось?';
      q1 = 'Сколько килограммов продали утром?'; q2 = 'Сколько килограммов продали днём?'; qr = 'Сколько килограммов картофеля осталось?'; u = 'кг'; qt = 'Сколько килограммов картофеля продали за день?'; q0 = 'Сколько килограммов картофеля осталось после утренней продажи?';
    } else if (k === 1) {
      m = mult(sc, 1); a = rand(3, 12) * m; b = rand(5, 15) * 100; c = rand(3, 12) * m; d = rand(5, 15) * 100; extra = rand(2, 30) * 100 * m;
      T = a * b + c * d + extra;
      txt = 'Для стройки нужно ' + fmt(T) + ' кирпичей. Уже привезли ' + nn(a, ['машину', 'машины', 'машин']) + ' по ' + fmt(b) + ' кирпичей и ' + nn(c, ['машину', 'машины', 'машин']) + ' по ' + fmt(d) + ' кирпичей. Сколько кирпичей осталось привезти?';
      q1 = 'Сколько кирпичей привезли в первый раз?'; q2 = 'Сколько кирпичей привезли во второй раз?'; qr = 'Сколько кирпичей осталось привезти?'; u = 'кирп.'; qt = 'Сколько кирпичей привезли всего?'; q0 = 'Сколько кирпичей осталось привезти после первого раза?';
    } else if (k === 2) {
      m = mult(sc, 1); a = rand(8, 30) * m; b = rand(20, 40); c = rand(8, 30) * m; d = rand(20, 40); extra = rand(10, 90) * 10 * m;
      T = a * b + c * d + extra;
      txt = 'В цистерне было ' + fmt(T) + ' л молока. В первый день в магазины отправили ' + nn(a, ['бидон', 'бидона', 'бидонов']) + ' по ' + b + ' л, во второй — ' + nn(c, ['бидон', 'бидона', 'бидонов']) + ' по ' + d + ' л. Сколько литров молока осталось в цистерне?';
      q1 = 'Сколько литров отправили в первый день?'; q2 = 'Сколько литров отправили во второй день?'; qr = 'Сколько литров молока осталось?'; u = 'л'; qt = 'Сколько литров молока отправили за два дня?'; q0 = 'Сколько литров молока осталось после первого дня?';
    } else {
      if (sc > 1) return null;
      a = rand(3, 6); b = rand(12, 30); c = rand(3, 6); d = rand(12, 30); extra = rand(20, 150);
      T = a * b + c * d + extra;
      txt = 'В книге ' + nn(T, FP_NOM) + '. Оля читала ' + nn(a, F_DAY) + ' по ' + nn(b, FP_ACC) + ', потом ' + nn(c, F_DAY) + ' по ' + nn(d, FP_ACC) + '. Сколько страниц ей осталось прочитать?';
      q1 = 'Сколько страниц Оля прочитала сначала?'; q2 = 'Сколько страниц она прочитала потом?'; qr = 'Сколько страниц осталось прочитать?'; u = 'стр.'; qt = 'Сколько страниц Оля прочитала всего?'; q0 = 'Сколько страниц осталось после первых дней?';
    }
    var root;
    if (Math.random() < 0.5) root = TN('−', TN('−', T, TN('×', a, b, q1, u), q0, u), TN('×', c, d, q2, u), qr, u);
    else root = TN('−', T, TN('+', TN('×', a, b, q1, u), TN('×', c, d, q2, u), qt, u), qr, u);
    return { text: txt, root: root, unit: u, ansU: u };
  });

  /* 3. сдача: (T − s) : n [× k] */
  addT('change', [2, 3], null, 'Сколько денег (килограммов…) ушло на все вещи вместе? Разделив это на число вещей, узнаешь цену одной.', function (sc) {
    var k = rand(0, 3), n = rand(3, 9), p = k === 3 ? rand(6, 60) * (sc > 1 ? 100 : 10) : rand(6, 60), s = k === 3 ? rand(1, 9) * (sc > 1 ? 500 : 50) : rand(1, 9) * 5, T = n * p + s, kk = rand(2, 12), txt, u, q1, q2, q3, ext = Math.random() < 0.5;
    if (kk === n) kk += 2;
    if (k === 0) {
      txt = 'Ученик отдал кассиру ' + fmt(T) + ' руб. за ' + nn(n, ['одинаковую тетрадь', 'одинаковые тетради', 'одинаковых тетрадей']) + ' и получил сдачу ' + fmt(s) + ' руб. Сколько стоит одна тетрадь?';
      u = 'руб.'; q1 = 'Сколько рублей стоят все тетради?'; q2 = 'Сколько рублей стоит одна тетрадь?';
      if (ext) { txt = txt.replace('Сколько стоит одна тетрадь?', 'Сколько рублей стоят ' + nn(kk, ['такая тетрадь', 'такие тетради', 'таких тетрадей']) + '?'); q3 = 'Сколько рублей стоят ' + nn(kk, ['такая тетрадь', 'такие тетради', 'таких тетрадей']) + '?'; }
    } else if (k === 1) {
      txt = 'У Юли было ' + fmt(T) + ' руб. Она купила ' + nn(n, ['одинаковую ручку', 'одинаковые ручки', 'одинаковых ручек']) + ', и у неё осталось ' + fmt(s) + ' руб. Сколько стоит одна ручка?';
      u = 'руб.'; q1 = 'Сколько рублей заплатила Юля за все ручки?'; q2 = 'Сколько рублей стоит одна ручка?';
      if (ext) { txt = txt.replace('Сколько стоит одна ручка?', 'Сколько рублей стоят ' + nn(kk, ['такая ручка', 'такие ручки', 'таких ручек']) + '?'); q3 = 'Сколько рублей стоят ' + nn(kk, ['такая ручка', 'такие ручки', 'таких ручек']) + '?'; }
    } else if (k === 2) {
      txt = 'Ребята собрали для приюта ' + fmt(T) + ' кг корма. Сразу увезли ' + fmt(s) + ' кг, а остальной корм расфасовали поровну в ' + nn(n, F_BAG) + '. Сколько килограммов корма в одном мешке?';
      u = 'кг'; q1 = 'Сколько килограммов корма расфасовали?'; q2 = 'Сколько килограммов корма в одном мешке?'; ext = false;
    } else {
      txt = 'Бригада заработала ' + fmt(T) + ' руб. На материалы потратили ' + fmt(s) + ' руб., а остальные деньги разделили поровну между ' + nn(n, ['рабочим', 'рабочими', 'рабочими']) + '. Сколько рублей получил каждый рабочий?';
      u = 'руб.'; q1 = 'Сколько рублей осталось после расходов на материалы?'; q2 = 'Сколько рублей получил каждый рабочий?'; ext = false;
    }
    var one = TN(':', TN('−', T, s, q1, u), n, q2, u), root = ext ? TN('×', one, kk, q3, u) : one;
    return { text: txt, root: root, unit: u, ansU: u };
  });

  /* 4. (a + b) × c + d */
  addT('sumMul', [3, 3], true, 'Сначала узнай, сколько всего людей (групп), потом умножь на то, что приходится на каждого, и не забудь прибавить лишнее.', function (sc) {
    var k = rand(0, 3), a = rand(12, 40) * (sc > 1 ? rand(3, 8) : 1), b = rand(12, 40) * (sc > 1 ? rand(3, 8) : 1), c = rand(3, 9) * (sc > 1 ? 2 : 1), d = rand(10, 90) * (sc > 1 ? 5 : 1), txt, u, q1, q2, q3;
    if (k === 0) {
      txt = (sc > 1 ? 'В начальной школе учатся ' : 'В первом классе ') + nn(a, ['ученик', 'ученика', 'учеников']) + (sc > 1 ? ', в средней — ' : ', во втором — ') + nn(b, ['ученик', 'ученика', 'учеников']) + '. Каждому ученику выдали по ' + nn(c, ['тетрадь', 'тетради', 'тетрадей'])+ ' и ещё ' + nn(d, ['тетрадь', 'тетради', 'тетрадей']) + ' отдали учителям. Сколько всего тетрадей выдали?';
      u = 'тетр.'; q1 = 'Сколько всего учеников?'; q2 = 'Сколько тетрадей выдали ученикам?'; q3 = 'Сколько всего тетрадей выдали?';
    } else if (k === 1) {
      txt = 'В сборе макулатуры участвовали ' + nn(a, ['ученик', 'ученика', 'учеников']) + (sc > 1 ? ' начальной школы и ' : ' 4-го «А» и ') + nn(b, ['ученик', 'ученика', 'учеников']) + (sc > 1 ? ' средней школы' : ' 4-го «Б»') + '. Каждый принёс по ' + c + ' кг, а учителя принесли ещё ' + d + ' кг. Сколько килограммов макулатуры собрали?';
      u = 'кг'; q1 = 'Сколько учеников участвовало в сборе?'; q2 = 'Сколько килограммов принесли ученики?'; q3 = 'Сколько килограммов собрали всего?';
    } else if (k === 2) {
      txt = (sc > 1 ? 'В первом цехе завода работают ' : 'В первой бригаде работают ') + nn(a, FH) + (sc > 1 ? ', во втором — ' : ', во второй — ') + nn(b, FH) + '. Каждый рабочий сделал за смену по ' + nn(c, FD) + ', а мастер сделал ещё ' + nn(d, FD) + '. Сколько деталей сделали за смену?';
      u = 'дет.'; q1 = 'Сколько всего рабочих?'; q2 = 'Сколько деталей сделали рабочие?'; q3 = 'Сколько деталей сделали за смену всего?';
    } else {
      txt = 'На городской праздник пришли ' + nn(a, ['ребёнок', 'ребёнка', 'детей']) + ' и ' + nn(b, ['взрослый', 'взрослых', 'взрослых']) + '. Каждому гостю дали по ' + nn(c, ['воздушному шару', 'воздушных шара', 'воздушных шаров']) + ', а ещё ' + nn(d, ['шар', 'шара', 'шаров']) + ' повесили на стены. Сколько всего шаров понадобилось?';
      u = 'шаров'; q1 = 'Сколько всего гостей?'; q2 = 'Сколько шаров раздали гостям?'; q3 = 'Сколько всего шаров понадобилось?';
    }
    var root = TN('+', TN('×', TN('+', a, b, q1, 'чел.'), c, q2, u), d, q3, u);
    return { text: txt, root: root, unit: u, ansU: u };
  });

  /* 5. средняя скорость: (v1×t1 + v2×t2) : (t1 + t2) */
  addT('avg', [5, 5], true, 'Средняя скорость = весь путь : всё время. Найди путь на каждом участке и время в пути.', function (sc) {
    var K = [['Поезд', 'поезда', 60, 120, 10], ['Автомобиль', 'автомобиля', 50, 100, 5], ['Велосипедист', 'велосипедиста', 10, 24, 2], ['Теплоход', 'теплохода', 20, 44, 4], ['Самолёт', 'самолёта', 400, 900, 50]], kd = pick(K), g, t1, t2, v1, v2, v, tt, ok = false;
    for (g = 0; g < 200 && !ok; g++) {
      t1 = rand(2, 5); t2 = rand(2, 5); if (t1 === t2) continue; tt = t1 + t2;
      v1 = rand(kd[2] / kd[4], kd[3] / kd[4]) * kd[4]; v2 = rand(kd[2] / kd[4], kd[3] / kd[4]) * kd[4];
      if (v1 === v2 || (v1 * t1 + v2 * t2) % tt !== 0) continue; ok = true;
    }
    if (!ok) return null;
    var who = kd[0], whoG = kd[1], first = who + ' ' + (who === 'Велосипедист' ? 'ехал' : who === 'Автомобиль' ? 'ехал' : who === 'Теплоход' ? 'плыл' : who === 'Самолёт' ? 'летел' : 'шёл');
    var verb = first.split(' ')[1];
    var txt = first + ' ' + nn(t1, F_HOUR) + ' со скоростью ' + fmt(v1) + ' км/ч, а потом ещё ' + nn(t2, F_HOUR) + ' со скоростью ' + fmt(v2) + ' км/ч. Какова средняя скорость ' + whoG + ' на всём пути?';
    var root = TN(':', TN('+', TN('×', v1, t1, 'Сколько километров на первом участке?', 'км'), TN('×', v2, t2, 'Сколько километров на втором участке?', 'км'), 'Сколько километров весь путь?', 'км'),
      TN('+', t1, t2, 'Сколько часов в пути всего?', 'ч'), 'Какова средняя скорость?', 'км/ч');
    return { text: txt, root: root, unit: 'км/ч', ansU: 'км/ч' };
  });

  /* 6. три дня: A + (A ± x) + A × k */
  addT('threeDays', [4, 4], true, 'Найди, сколько было во второй раз и в третий: оба раза сравнивают с первым. Потом сложи всё.', function (sc) {
    var k = rand(0, 3), A = rand(4, 20) * (sc > 1 ? 50 : 10), x = rand(2, 9) * (sc > 1 ? 20 : 5), kk = rand(2, 4), more = Math.random() < 0.65, txt, u, q2, q3, q4, second, third;
    var w = more ? 'больше' : 'меньше';
    if (k === 0) { txt = 'В первый день магазин продал ' + fmt(A) + ' кг сахара, во второй — на ' + x + ' кг ' + w + ', чем в первый, а в третий — в ' + kk + ' ' + R.plural(kk, ['раз', 'раза', 'раз']) + ' больше, чем в первый. Сколько килограммов сахара продал магазин за три дня?'; u = 'кг'; second = 'Сколько килограммов продали во второй день?'; q2 = 'Сколько килограммов продали за два дня?'; q3 = 'Сколько килограммов продали в третий день?'; q4 = 'Сколько килограммов продали за три дня?'; }
    else if (k === 1) { txt = 'В понедельник в музей пришли ' + fmt(A) + ' человек, во вторник — на ' + x + ' человек ' + w + ', чем в понедельник, а в субботу — в ' + kk + ' ' + R.plural(kk, ['раз', 'раза', 'раз']) + ' больше, чем в понедельник. Сколько всего человек пришло в музей в эти три дня?'; u = 'чел.'; second = 'Сколько человек пришло во вторник?'; q2 = 'Сколько человек пришло в понедельник и вторник?'; q3 = 'Сколько человек пришло в субботу?'; q4 = 'Сколько человек пришло за три дня?'; }
    else if (k === 2) { txt = 'Рыболовецкая артель в первый день поймала ' + fmt(A) + ' кг рыбы, во второй — на ' + x + ' кг ' + w + ', чем в первый, а в третий — в ' + kk + ' ' + R.plural(kk, ['раз', 'раза', 'раз']) + ' больше, чем в первый. Сколько килограммов рыбы поймала артель за три дня?'; u = 'кг'; second = 'Сколько килограммов рыбы поймали во второй день?'; q2 = 'Сколько килограммов рыбы поймали за два дня?'; q3 = 'Сколько килограммов рыбы поймали в третий день?'; q4 = 'Сколько килограммов рыбы поймали за три дня?'; }
    else { txt = 'В первую неделю библиотека выдала ' + fmt(A) + ' книг, во вторую — на ' + x + ' книг ' + w + ', чем в первую, а в третью — в ' + kk + ' ' + R.plural(kk, ['раз', 'раза', 'раз']) + ' больше, чем в первую. Сколько книг выдала библиотека за три недели?'; u = 'книг'; second = 'Сколько книг выдали во вторую неделю?'; q2 = 'Сколько книг выдали за две недели?'; q3 = 'Сколько книг выдали в третью неделю?'; q4 = 'Сколько книг выдали за три недели?'; }
    var sec = TN(more ? '+' : '−', A, x, second, u, true);
    var root = TN('+', TN('+', A, sec, q2, u), TN('×', A, kk, q3, u), q4, u);
    return { text: txt, root: root, unit: u, ansU: u };
  });

  /* 7. сравнение двух произведений: a×b − c×d */
  addT('cmp', [3, 3], false, 'Найди отдельно результат первого и второго, потом вычти меньшее из большего.', function (sc) {
    var k = rand(0, 4), a = rand(3, 9) * (sc > 1 ? 4 : 1), b = rand(12, 60), c = rand(3, 9) * (sc > 1 ? 4 : 1), d = rand(12, 60), txt, u, q1, q2, q3;
    if (k === 0) { txt = 'Первая бригада за ' + nn(a, F_DAY) + ' делала по ' + nn(b, FD) + ' в день, а вторая за ' + nn(c, F_DAY) + ' — по ' + nn(d, FD) + ' в день. На сколько деталей больше сделала первая бригада?'; u = 'дет.'; q1 = 'Сколько деталей сделала первая бригада?'; q2 = 'Сколько деталей сделала вторая бригада?'; q3 = 'На сколько деталей больше сделала первая бригада?'; }
    else if (k === 1) { txt = 'Автомобиль был в пути ' + nn(a, F_HOUR) + ' со скоростью ' + (b + 30) + ' км/ч, а автобус — ' + nn(c, F_HOUR) + ' со скоростью ' + (d + 20) + ' км/ч. На сколько километров больше проехал автомобиль?'; u = 'км'; b += 30; d += 20; q1 = 'Сколько километров проехал автомобиль?'; q2 = 'Сколько километров проехал автобус?'; q3 = 'На сколько километров больше проехал автомобиль?'; }
    else if (k === 2) { txt = 'С первого поля собрали ' + nn(a * 10, F_BAG) + ' картофеля по ' + b + ' кг, а со второго — ' + nn(c * 10, F_BAG) + ' по ' + d + ' кг. На сколько килограммов больше собрали с первого поля?'; u = 'кг'; a *= 10; c *= 10; q1 = 'Сколько килограммов собрали с первого поля?'; q2 = 'Сколько килограммов собрали со второго поля?'; q3 = 'На сколько килограммов больше собрали с первого поля?'; }
    else if (k === 3) { txt = 'Первый насос работал ' + nn(a, F_HOUR) + ' и качал по ' + (b * 10) + ' вёдер воды в час, второй — ' + nn(c, F_HOUR) + ' по ' + (d * 10) + ' вёдер в час. На сколько вёдер больше выкачал первый насос?'; u = 'вёдер'; b *= 10; d *= 10; q1 = 'Сколько вёдер выкачал первый насос?'; q2 = 'Сколько вёдер выкачал второй насос?'; q3 = 'На сколько вёдер больше выкачал первый насос?'; }
    else { txt = 'Лена читала ' + nn(a, F_DAY) + ' по ' + nn(b, FP_ACC) + ', а Катя — ' + nn(c, F_DAY) + ' по ' + nn(d, FP_ACC) + '. На сколько страниц больше прочитала Лена?'; u = 'стр.'; q1 = 'Сколько страниц прочитала Лена?'; q2 = 'Сколько страниц прочитала Катя?'; q3 = 'На сколько страниц больше прочитала Лена?'; }
    if (sc > 1 && (k === 1 || k === 3)) return null;
    if (a * b <= c * d) return null;
    var root = TN('−', TN('×', a, b, q1, u), TN('×', c, d, q2, u), q3, u);
    return { text: txt, root: root, unit: u, ansU: u };
  });

  /* 8. разность скоростей работы: A : h1 − B : h2 */
  addT('rates', [3, 3], false, 'Сначала узнай, сколько делает каждый за один час (минуту), потом сравни.', function (sc) {
    var k = rand(0, 3), h1 = rand(3, 9), h2 = rand(3, 9), r1 = rand(12, 60), r2 = rand(8, r1 - 2), A = h1 * r1, B = h2 * r2, txt, u, q1, q2, q3;
    if (h1 === h2) return null;
    if (sc > 1) return null;
    if (k === 1) { r1 = rand(14, 30); r2 = rand(8, r1 - 2); A = h1 * r1; B = h2 * r2; }
    if (k === 0) { txt = 'Первый рабочий сделал за ' + nn(h1, F_HOUR) + ' ' + nn(A, ['деталь', 'детали', 'деталей']) + ', а второй за ' + nn(h2, F_HOUR) + ' — ' + nn(B, ['деталь', 'детали', 'деталей']) + '. На сколько деталей в час больше делает первый рабочий?'; u = 'дет.'; q1 = 'Сколько деталей в час делает первый рабочий?'; q2 = 'Сколько деталей в час делает второй рабочий?'; q3 = 'На сколько деталей в час больше делает первый?'; }
    else if (k === 1) { txt = 'Первый велосипедист проехал за ' + nn(h1, F_HOUR) + ' ' + fmt(A) + ' км, а второй за ' + nn(h2, F_HOUR) + ' — ' + fmt(B) + ' км. На сколько километров в час скорость первого велосипедиста больше?'; u = 'км/ч'; q1 = 'Какова скорость первого велосипедиста?'; q2 = 'Какова скорость второго велосипедиста?'; q3 = 'На сколько километров в час скорость первого больше?'; }
    else if (k === 2) { txt = 'Первый принтер напечатал за ' + nn(h1, F_MIN) + ' ' + nn(A, ['страницу', 'страницы', 'страниц']) + ', второй за ' + nn(h2, F_MIN) + ' — ' + nn(B, ['страницу', 'страницы', 'страниц']) + '. На сколько страниц в минуту больше печатает первый принтер?'; u = 'стр.'; q1 = 'Сколько страниц в минуту печатает первый принтер?'; q2 = 'Сколько страниц в минуту печатает второй принтер?'; q3 = 'На сколько страниц в минуту больше печатает первый?'; }
    else { txt = 'Первый насос за ' + nn(h1, F_MIN) + ' выкачал ' + nn(A, ['ведро', 'ведра', 'вёдер']) + ' воды, второй за ' + nn(h2, F_MIN) + ' — ' + nn(B, ['ведро', 'ведра', 'вёдер']) + '. На сколько вёдер в минуту первый насос качает больше?'; u = 'вёдер'; q1 = 'Сколько вёдер в минуту качает первый насос?'; q2 = 'Сколько вёдер в минуту качает второй насос?'; q3 = 'На сколько вёдер в минуту первый качает больше?'; }
    var root = TN('−', TN(':', A, h1, q1, u), TN(':', B, h2, q2, u), q3, u);
    return { text: txt, root: root, unit: u, ansU: u };
  });

  /* 9. приведение к единице: T : n × m [+ c] */
  addT('scale', [2, 3], null, 'Сначала узнай, сколько приходится на один (одну), потом умножь на нужное число.', function (sc) {
    var k = rand(0, 4), n = rand(3, 9), m = rand(n + 2, 15), per = k === 2 ? rand(8, 18) * 5 : rand(6, 60) * (sc > 1 && (k === 0 || k === 3) ? (k === 3 ? 20 : 5) : 1), T = n * per, c = rand(2, 9) * 10, txt, u, q1, q2, q3, ext = false;
    if (n === m) return null;
    if (k === 0) { txt = 'За ' + nn(n, ['альбом', 'альбома', 'альбомов']) + ' заплатили ' + fmt(T) + ' руб. Сколько стоят ' + nn(m, ['такой альбом', 'таких альбома', 'таких альбомов']) + '?'; u = 'руб.'; q1 = 'Сколько рублей стоит один альбом?'; q2 = 'Сколько рублей стоят ' + nn(m, ['такой альбом', 'таких альбома', 'таких альбомов']) + '?'; }
    else if (k === 1) { txt = 'На ' + nn(n, ['одинаковый замес', 'одинаковых замеса', 'одинаковых замесов']) + ' теста в пекарне ушло ' + fmt(T) + ' кг муки. Сколько килограммов муки нужно на ' + nn(m, ['такой замес', 'таких замеса', 'таких замесов']) + '?'; u = 'кг'; q1 = 'Сколько килограммов муки уходит на один замес?'; q2 = 'Сколько килограммов муки нужно на ' + nn(m, ['замес', 'замеса', 'замесов']) + '?'; }
    else if (k === 2) { txt = 'Автобус за ' + nn(n, F_HOUR) + ' проехал ' + fmt(T) + ' км. Сколько километров он проедет за ' + nn(m, F_HOUR) + ', если будет ехать с той же скоростью?'; u = 'км'; q1 = 'Сколько километров автобус проезжает за один час?'; q2 = 'Сколько километров он проедет за ' + nn(m, F_HOUR) + '?'; }
    else if (k === 3) { txt = 'За ' + nn(n, ['смену', 'смены', 'смен']) + ' цех выпустил ' + nn(T, FD) + '. Сколько деталей выпустит цех за ' + nn(m, ['смену', 'смены', 'смен']) + ', если будет работать так же?'; u = 'дет.'; q1 = 'Сколько деталей выпускает цех за одну смену?'; q2 = 'Сколько деталей выпустит цех за ' + nn(m, ['смену', 'смены', 'смен']) + '?'; }
    else { txt = 'В ' + nn(n, ['одинаковой коробке', 'одинаковых коробках', 'одинаковых коробках']) + ' всего ' + nn(T, ['карандаш', 'карандаша', 'карандашей']) + '. Сколько карандашей в ' + nn(m, ['такой коробке', 'таких коробках', 'таких коробках']) + '?'; u = 'шт.'; q1 = 'Сколько карандашей в одной коробке?'; q2 = 'Сколько карандашей в ' + nn(m, ['коробке', 'коробках', 'коробках']) + '?'; }
    var root = TN('×', TN(':', T, n, q1, u), m, q2, u);
    if (k === 0 && Math.random() < 0.5) {
      txt = txt.replace(/Сколько стоят .*\?$/, 'Сколько рублей надо заплатить за ' + nn(m, ['такой альбом', 'таких альбома', 'таких альбомов']) + ' и ещё за ручку, которая стоит ' + c + ' руб.?');
      root = TN('+', root, c, 'Сколько рублей надо заплатить всего?', u);
    }
    return { text: txt, root: root, unit: u, ansU: u };
  });

  /* 10. поделили остаток: (T − n×p) : k */
  addT('share', [3, 3], true, 'Сначала узнай, сколько израсходовали, потом — сколько осталось, и только после этого дели остаток на равные части.', function (sc) {
    var k = rand(0, 3), n = rand(3, 9), kk = rand(2, 9), big = sc > 1, p, per, T, txt, u, q1, q2, q3;
    if (k === 0) { kk = n; p = rand(10, 90) * 10; per = rand(2, 9) * 10 * (big ? 3 : 1); }
    else if (k === 1) { p = rand(10, 90); per = rand(12, 90) * (big ? 5 : 1); }
    else if (k === 2) { p = rand(10, 90); per = rand(12, 90) * (big ? 5 : 1); }
    else { p = rand(10, 90) * 10; per = rand(12, 90) * (big ? 500 : 100); }
    T = n * p + kk * per;
    if (k === 0) { txt = 'Мама дала ' + n + ' детям ' + fmt(T) + ' руб. на поход в цирк. Дети купили ' + nn(n, ['билет', 'билета', 'билетов']) + ' по ' + fmt(p) + ' руб., а остальные деньги поделили поровну между собой. Сколько рублей досталось каждому?'; u = 'руб.'; q1 = 'Сколько рублей стоят все билеты?'; q2 = 'Сколько рублей осталось?'; q3 = 'Сколько рублей досталось каждому?'; }
    else if (k === 1) { txt = 'В бочке было ' + fmt(T) + ' л воды. На полив ' + nn(n, ['грядки', 'грядок', 'грядок']) + ' ушло по ' + fmt(p) + ' л на каждую, а остаток воды разлили поровну в ' + nn(kk, ['бочонок', 'бочонка', 'бочонков']) + '. Сколько литров воды в каждом бочонке?'; u = 'л'; q1 = 'Сколько литров воды ушло на полив?'; q2 = 'Сколько литров воды осталось?'; q3 = 'Сколько литров воды в каждом бочонке?'; }
    else if (k === 2) { txt = 'В школьном магазине было ' + nn(T, FT) + '. ' + nn(n, ['класс', 'класса', 'классов']) + ' взяли по ' + nn(p, FT) + ', а остальные тетради разложили поровну в ' + nn(kk, ['коробку', 'коробки', 'коробок']) + '. Сколько тетрадей в каждой коробке?'; u = 'тетр.'; q1 = 'Сколько тетрадей взяли классы?'; q2 = 'Сколько тетрадей осталось?'; q3 = 'Сколько тетрадей в каждой коробке?'; }
    else { txt = 'Бригада заработала ' + fmt(T) + ' руб. На материалы потратили ' + nn(n, F_BAG) + ' цемента по ' + fmt(p) + ' руб., а остальные деньги разделили поровну между ' + nn(kk, ['рабочим', 'рабочими', 'рабочими']) + '. Сколько рублей получил каждый рабочий?'; u = 'руб.'; q1 = 'Сколько рублей стоил цемент?'; q2 = 'Сколько рублей осталось?'; q3 = 'Сколько рублей получил каждый рабочий?'; }
    var root = TN(':', TN('−', T, TN('×', n, p, q1, u), q2, u), kk, q3, u);
    return { text: txt, root: root, unit: u, ansU: u };
  });

  /* 11. остаток пути / работы: (N − a×d) : b */
  addT('rest', [3, 3], true, 'Сколько уже сделано за первые дни (часы, минуты)? Сколько осталось? Сколько дней (часов, минут) потребуется на остаток?', function (sc) {
    var k = rand(0, 3), d = rand(2, 6), a, b, days = rand(2, 9), N, txt, u, q1, q2, q3, ku;
    if (sc > 1 && k < 2) return null;
    if (k === 0) { a = rand(12, 45); b = rand(12, 60); }
    else if (k === 1) { a = rand(8, 16) * 5; b = rand(8, 18) * 5; }
    else if (k === 2) { a = rand(12, 45) * (sc > 1 ? 10 : 1); b = rand(12, 60) * (sc > 1 ? 10 : 1); }
    else { a = rand(12, 45) * (sc > 1 ? 10 : 1); b = rand(12, 60) * (sc > 1 ? 5 : 1); }
    if (a === b) return null;
    N = a * d + b * days;
    if (k === 0) { txt = 'В книге ' + nn(N, FP_NOM) + '. Первые ' + nn(d, F_DAY) + ' Оля читала по ' + nn(a, FP_ACC) + '. За сколько ещё дней она дочитает книгу, если будет читать по ' + nn(b, FP_ACC) + ' в день?'; q1 = 'Сколько страниц Оля прочитала за первые дни?'; q2 = 'Сколько страниц осталось прочитать?'; q3 = 'За сколько дней она дочитает книгу?'; u = 'дн.'; ku = 'стр.'; }
    else if (k === 1) { txt = 'До города ' + fmt(N) + ' км. ' + nn(d, F_HOUR) + ' автобус ехал со скоростью ' + fmt(a) + ' км/ч. За сколько ещё часов он доедет до города, если скорость станет ' + fmt(b) + ' км/ч?'; q1 = 'Сколько километров автобус проехал?'; q2 = 'Сколько километров осталось проехать?'; q3 = 'За сколько часов автобус проедет остаток?'; u = 'ч'; ku = 'км'; }
    else if (k === 2) { txt = 'В резервуар надо налить ' + fmt(N) + ' л воды. Первый насос ' + nn(d, F_MIN_NOM) + ' качал по ' + fmt(a) + ' л в минуту. Сколько минут должен работать второй насос, который качает по ' + fmt(b) + ' л в минуту, чтобы резервуар наполнился?'; q1 = 'Сколько литров воды налил первый насос?'; q2 = 'Сколько литров воды осталось налить?'; q3 = 'Сколько минут должен работать второй насос?'; u = 'мин'; ku = 'л'; }
    else { txt = 'Строителям надо уложить ' + nn(N, ['плитку', 'плитки', 'плиток']) + '. За ' + nn(d, F_DAY) + ' они укладывали по ' + nn(a, ['плитку', 'плитки', 'плиток']) + ' в день. Сколько ещё дней им работать, если они будут укладывать по ' + nn(b, ['плитку', 'плитки', 'плиток']) + ' в день?'; q1 = 'Сколько плиток уже уложили?'; q2 = 'Сколько плиток осталось уложить?'; q3 = 'Сколько ещё дней им работать?'; u = 'дн.'; ku = 'плиток'; }
    var root = TN(':', TN('−', N, TN('×', a, d, q1, ku), q2, ku), b, q3, u);
    return { text: txt, root: root, unit: u, ansU: u };
  });

  /* 12. три вида: a×x + b×y + c×z */
  addT('three', [5, 5], false, 'Найди стоимость (количество) каждого из трёх видов, потом сложи три результата.', function (sc) {
    var k = rand(0, 2), m = sc > 1 ? rand(3, 6) : 1, a = rand(10, 50) * m, b = rand(10, 50) * m, c = rand(10, 50) * m, x, y, z, txt, u, q1, q2, q3, q4;
    if (k === 0) {
      x = rand(2, 9) * 10; y = rand(2, 9) * 10 + 5; z = rand(3, 8) * 10;
      txt = 'В столовую купили ' + a + ' кг картофеля по ' + x + ' руб., ' + b + ' кг моркови по ' + y + ' руб. и ' + c + ' кг лука по ' + z + ' руб. Сколько рублей заплатили за овощи?';
      u = 'руб.'; q1 = 'Сколько рублей стоит картофель?'; q2 = 'Сколько рублей стоит морковь?'; q3 = 'Сколько рублей стоит лук?'; q4 = 'Сколько рублей заплатили за все овощи?';
    } else if (k === 1) {
      x = rand(6, 12) * 10; y = rand(5, 10) * 10; z = rand(9, 16) * 10;
      txt = 'За день магазин продал ' + nn(a, ['пакет', 'пакета', 'пакетов']) + ' молока по ' + x + ' руб., ' + nn(b, ['пакет', 'пакета', 'пакетов']) + ' кефира по ' + y + ' руб. и ' + nn(c, ['пакет', 'пакета', 'пакетов']) + ' сметаны по ' + z + ' руб. Сколько рублей выручил магазин?';
      u = 'руб.'; q1 = 'Сколько рублей выручили за молоко?'; q2 = 'Сколько рублей выручили за кефир?'; q3 = 'Сколько рублей выручили за сметану?'; q4 = 'Сколько рублей выручил магазин?';
    } else {
      x = rand(30, 60) * 10; y = rand(12, 30) * 10; z = rand(4, 9) * 100;
      txt = 'Бригада купила ' + nn(a, F_BAG) + ' цемента по ' + fmt(x) + ' руб., ' + nn(b, F_BAG) + ' песка по ' + fmt(y) + ' руб. и ' + nn(c, ['ведро', 'ведра', 'вёдер']) + ' краски по ' + fmt(z) + ' руб. Сколько рублей заплатила бригада?';
      u = 'руб.'; q1 = 'Сколько рублей стоит цемент?'; q2 = 'Сколько рублей стоит песок?'; q3 = 'Сколько рублей стоит краска?'; q4 = 'Сколько рублей заплатила бригада?';
    }
    var root = TN('+', TN('+', TN('×', a, x, q1, u), TN('×', b, y, q2, u), 'Сколько рублей стоят первые два вида?', u), TN('×', c, z, q3, u), q4, u);
    return { text: txt, root: root, unit: u, ansU: u };
  });

  /* 13. изменил скорость: v×t1 + (v ± d)×t2 */
  addT('trip', [4, 4], true, 'Найди путь на первом участке, потом новую скорость и путь на втором, и сложи пути.', function (sc) {
    var K = [['Поезд', 'шёл', 60, 100, 10], ['Автомобиль', 'ехал', 50, 90, 5], ['Теплоход', 'плыл', 20, 40, 4], ['Велосипедист', 'ехал', 10, 20, 2]], kd = pick(K), v = rand(kd[2] / kd[4], kd[3] / kd[4]) * kd[4], d = rand(1, 4) * kd[4] / (kd[4] > 4 ? 2 : 1), t1 = rand(2, 6), t2 = rand(2, 6), more = Math.random() < 0.6;
    if (!more && v - d < 8) more = true;
    var v2 = more ? v + d : v - d, w = more ? 'больше' : 'меньше';
    var txt = kd[0] + ' ' + kd[1] + ' ' + nn(t1, F_HOUR) + ' со скоростью ' + v + ' км/ч, а потом ещё ' + nn(t2, F_HOUR) + ' со скоростью на ' + d + ' км/ч ' + w + '. Сколько километров ' + (kd[0] === 'Велосипедист' ? 'проехал велосипедист' : kd[0] === 'Автомобиль' ? 'проехал автомобиль' : kd[0] === 'Теплоход' ? 'проплыл теплоход' : 'прошёл поезд') + ' за всё это время?';
    var sp = TN(more ? '+' : '−', v, d, 'Какой была скорость на втором участке?', 'км/ч');
    var root = TN('+', TN('×', v, t1, 'Сколько километров на первом участке?', 'км'), TN('×', sp, t2, 'Сколько километров на втором участке?', 'км'), 'Сколько километров за всё время?', 'км');
    return { text: txt, root: root, unit: 'км', ansU: 'км' };
  });

  /* 14. остаток после двух порций, вторая — на x больше: T − a − (a + x) */
  addT('restParts', [3, 3], true, 'Узнай, сколько взяли во второй раз (это на несколько больше, чем в первый), потом вычти обе порции из всего.', function (sc) {
    var k = rand(0, 3), a = rand(20, 90) * (sc > 1 ? 10 : 1), x = rand(2, 9) * (sc > 1 ? 10 : 5), T = a + a + x + rand(12, 90) * (sc > 1 ? 10 : 1), txt, u, q1, q2, q3;
    if (sc > 1 && (k === 0 || k === 2)) return null;
    if (k === 0) { txt = 'В бочке было ' + fmt(T) + ' л воды. В первое ведро налили ' + fmt(a) + ' л, а во второе — на ' + x + ' л больше. Сколько литров воды осталось в бочке?'; u = 'л'; q2 = 'Сколько литров воды налили во второе ведро?'; q3 = 'Сколько литров воды осталось?'; }
    else if (k === 1) { txt = 'В магазин привезли ' + fmt(T) + ' кг конфет. В первый день продали ' + fmt(a) + ' кг, а во второй — на ' + x + ' кг больше. Сколько килограммов конфет осталось?'; u = 'кг'; q3 = 'Сколько килограммов конфет осталось?'; q2 = 'Сколько килограммов конфет продали во второй день?'; }
    else if (k === 2) { txt = 'В книге ' + nn(T, FP_NOM) + '. В понедельник Оля прочитала ' + nn(a, FP_ACC) + ', а во вторник — на ' + x + ' страниц больше. Сколько страниц ей осталось прочитать?'; u = 'стр.'; q3 = 'Сколько страниц осталось прочитать?'; q2 = 'Сколько страниц Оля прочитала во вторник?'; }
    else { txt = 'У фермера было ' + nn(T, FE) + '. Утром он отвёз на рынок ' + nn(a, FE) + ', а вечером — на ' + x + ' яиц больше. Сколько яиц у фермера осталось?'; u = 'яиц'; q3 = 'Сколько яиц осталось?'; q2 = 'Сколько яиц фермер отвёз вечером?'; }
    q1 = 'Сколько осталось после первой поездки?';
    if (k === 0) q1 = 'Сколько литров воды осталось после первого ведра?';
    else if (k === 1) q1 = 'Сколько килограммов конфет осталось после первого дня?';
    else if (k === 2) q1 = 'Сколько страниц осталось после понедельника?';
    else q1 = 'Сколько яиц осталось после утра?';
    var root = TN('−', TN('−', T, a, q1, u), TN('+', a, x, q2, u, true), q3, u);
    return { text: txt, root: root, unit: u, ansU: u };
  });

  /* 15. на сколько дней хватит: (T − x) : (a + b) */
  addT('feed', [2, 3], true, 'Сколько расходуют за один день (утром и вечером вместе)? Сколько запаса остаётся? На сколько дней хватит?', function (sc) {
    var k = rand(0, 2), a = rand(6, 30) * (sc > 1 ? 5 : 1), b = rand(6, 30) * (sc > 1 ? 5 : 1), days = rand(4, 20), used = rand(2, 9) * (sc > 1 ? 50 : 10), T = (a + b) * days + used, txt, u, q0, q1, q2, ext = Math.random() < 0.6;
    if (!ext) T = (a + b) * days;
    if (k === 0) { txt = 'На ферме запас корма ' + fmt(T) + ' кг' + (ext ? ', но ' + used + ' кг сразу отдали на другую ферму' : '') + '. Каждый день утром дают ' + a + ' кг, а вечером — ' + b + ' кг. На сколько дней хватит корма?'; u = 'кг'; q0 = 'Сколько килограммов корма осталось на ферме?'; q1 = 'Сколько килограммов корма расходуют за день?'; q2 = 'На сколько дней хватит корма?'; }
    else if (k === 1) { txt = 'В лагере было ' + fmt(T) + ' кг крупы' + (ext ? ', но ' + used + ' кг крупы пришлось отдать соседнему лагерю' : '') + '. На завтрак расходуют ' + a + ' кг, а на ужин — ' + b + ' кг. На сколько дней хватит крупы?'; u = 'кг'; q0 = 'Сколько килограммов крупы осталось?'; q1 = 'Сколько килограммов крупы расходуют за день?'; q2 = 'На сколько дней хватит крупы?'; }
    else { txt = 'В баке было ' + fmt(T) + ' л воды' + (ext ? ', но ' + used + ' л воды слили' : '') + '. Утром из бака берут ' + a + ' л, а вечером — ' + b + ' л. На сколько дней хватит воды?'; u = 'л'; q0 = 'Сколько литров воды осталось в баке?'; q1 = 'Сколько литров воды берут за день?'; q2 = 'На сколько дней хватит воды?'; }
    var use = TN('+', a, b, q1, u), root = ext ? TN(':', TN('−', T, used, q0, u), use, q2, 'дн.') : TN(':', T, use, q2, 'дн.');
    return { text: txt, root: root, unit: 'дн.', ansU: 'дн.' };
  });

  /* «по 21 странице» — падеж после «по» сложный: такие числа отбрасываем (кроме сокращений единиц) */
  var ABBR = ['руб.', 'кг', 'км', 'км/ч', 'л', 'м', 'г', 'т', 'ц', 'мин', 'ч', 'шт.', 'с', 'см'];
  function badPo(text) {
    var re = /(?:^|\s)по\s((?:\d+\u00a0)*\d+)\u00a0([А-Яа-яЁё.\/]+)/g, m;
    while ((m = re.exec(text))) {
      var d = m[1].replace(/\u00a0/g, '');
      if (d.slice(-1) === '1' && d.slice(-2) !== '11' && ABBR.indexOf(m[2]) < 0) return true;
    }
    return false;
  }
  R.orBadPo = badPo;

  /* выбор шаблона и проверка дерева */
  function makeProb(o) {
    var acts = o.acts || [2, 5], sc = o.sc || 1, g, list;
    list = PT.filter(function (t) {
      if (o.only && o.only.indexOf(t.id) < 0) return false;
      if (o.br === true && t.br === false) return false;
      if (o.br === false && t.br === true) return false;
      return t.acts[1] >= acts[0] && t.acts[0] <= acts[1];
    });
    for (g = 0; g < 400; g++) {
      var t = pick(list), r = t.fn(sc);
      if (!r || badPo(r.text)) continue;
      var v = tv(r.root);
      if (!(v >= 2)) continue;
      var po = postOrder(r.root), n = po.length;
      if (n < acts[0] || n > acts[1]) continue;
      if (!po.every(function (nd) { return tv(nd) >= 1 && tv(nd.l) >= 1 && tv(nd.r) >= 1; })) continue;
      if (o.br === true && !countParens(treeTokens(r.root))) continue;
      if (o.br === false && countParens(treeTokens(r.root))) continue;
      if (po.some(function (nd) { return tv(nd) > (sc > 1 ? 5e6 : 3e5); })) continue;
      r.tpl = t; r.n = n; r.tokens = treeTokens(r.root); r.value = v;
      return r;
    }
    return makeProb({ acts: [3, 3], sc: 1 });
  }
  R.orProbMake = makeProb;

  function probExplain(p) {
    return stepsHTML(planList(p.root), num(p.value) + (p.ansU ? ' ' + uw(p.value, p.ansU) : '')) +
      '<br>Одним выражением: <span class="ex">' + orText(p.tokens) + ' = ' + fmt(p.value) + '</span>';
  }

  /* задача → число */
  reg('orProb', function (o) {
    var p = makeProb(o);
    var tail = o.expr ? '<br><span class="soft">Запиши решение выражением и найди ответ.</span>' : '';
    return {
      kind: 'num', html: p.text + tail, answer: p.value,
      hint: p.tpl.hint, explain: probExplain(p),
      dbg: { tokens: p.tokens, leaves: treeLeaves(p.root), acts: p.n }
    };
  });

  /* задача → какое выражение */
  reg('orProbExpr', function (o) {
    var p = makeProb(o), right = orText(p.tokens), ds = exprDistractors(p.tokens, p.value, 3);
    if (ds.length < 3) return gens.orProbExpr(o);
    var opts = shuffle([right].concat(ds.map(function (d) { return d.text; })));
    return {
      kind: 'choice', html: p.text + '<br><span class="soft">Какое выражение решает задачу?</span>', options: opts, answer: opts.indexOf(right), wide: true,
      hint: 'Реши задачу по действиям, а потом запиши все действия одним выражением. Что нужно сделать раньше других — возьми в скобки, если это сложение или вычитание перед умножением или делением.',
      explain: probExplain(p),
      dbg: { tokens: p.tokens, leaves: treeLeaves(p.root), acts: p.n }
    };
  });

  /* сколько действий в решении */
  reg('orProbCount', function (o) {
    var p = makeProb(o);
    return {
      kind: 'num', html: p.text + '<br><span class="soft">Не решая задачу до конца, скажи: сколько действий в её решении?</span>', answer: p.n,
      hint: 'Представь себе план решения: сколько вопросов надо задать по пути, включая главный вопрос задачи?',
      explain: probExplain(p) + '<br>Всего действий: ' + p.n + '.',
      dbg: { tokens: p.tokens, leaves: treeLeaves(p.root), acts: p.n }
    };
  });


  /* ================= способ отношений ================= */
  function joinList(arr, f) {
    var t = arr.map(f);
    return t.length === 1 ? t[0] : t.slice(0, -1).join(', ') + ' и ' + t[t.length - 1];
  }
  function mu(u) { return function (n) { return fmt(n) + NB + u; }; }
  function cnt(forms) { return function (n) { return nn(n, forms); }; }
  function times(k) { return R.plural(k, ['раз', 'раза', 'раз']); }
  var lcm2 = function (a, b) { var x = a, y = b; while (y) { var t = y; y = x % y; x = t; } return a / x * b; };
  var fives = function (lo, hi) { return function () { return rand(lo, hi) * 5; }; };

  /* Скины: пары величин A и B (B пропорционально A). x,y — «малая» пара, k — коэффициент. */
  var RS = [
    { id: 'milk', x: [5, 9], y: [2, 7], k: [2, 12], pair: function () { var x = rand(5, 9); return [x, rand(2, x - 2)]; }, A: mu('л'), B: cnt(['стакан сливок', 'стакана сливок', 'стаканов сливок']),
      given: function (a, b) { return 'Из ' + this.A(a) + ' молока получается ' + this.B(b) + '.'; },
      askB: function (l) { return 'Сколько стаканов сливок получится из ' + joinList(l, this.A) + ' молока?'; },
      askA: function (l) { return 'Сколько литров молока потребуется, чтобы получить ' + joinList(l, this.B) + '?'; },
      qB: 'Сколько стаканов сливок получится?', qA: 'Сколько литров молока потребуется?' },
    { id: 'lemon', x: [3, 9], y: [3, 18], ys: 5, ok: function (x, y) { var q = y / x; return q >= 8 / 5 && q <= 6; }, k: [2, 12], A: cnt(['лимон', 'лимона', 'лимонов']), B: mu('руб.'),
      given: function (a, b) { return this.A(a) + ' стоят ' + this.B(b) + '.'; },
      askB: function (l) { return 'Сколько рублей стоят ' + joinList(l, this.A) + '?'; },
      askA: function (l) { return 'Сколько лимонов можно купить на ' + joinList(l, this.B) + '?'; },
      qB: 'Сколько рублей они стоят?', qA: 'Сколько лимонов можно купить?' },
    { id: 'pencil', x: [3, 9], y: [4, 15], ys: 3, ok: function (x, y) { var q = y * 3 / x; return q >= 6 && q <= 20; }, k: [2, 12], A: cnt(['карандаш', 'карандаша', 'карандашей']), B: mu('руб.'),
      given: function (a, b) { return this.A(a) + ' стоят ' + this.B(b) + '.'; },
      askB: function (l) { return 'Сколько рублей стоят ' + joinList(l, this.A) + '?'; },
      askA: function (l) { return 'Сколько таких карандашей можно купить на ' + joinList(l, this.B) + '?'; },
      qB: 'Сколько рублей они стоят?', qA: 'Сколько карандашей можно купить?' },
    { id: 'apple', x: [2, 9], y: [12, 40], ys: 10, ok: function (x, y) { var q = y * 10 / x; return q >= 40 && q <= 150; }, k: [2, 10], A: mu('кг'), B: mu('руб.'),
      given: function (a, b) { return this.A(a) + ' яблок стоят ' + this.B(b) + '.'; },
      askB: function (l) { return 'Сколько рублей стоят ' + joinList(l, this.A) + ' таких яблок?'; },
      askA: function (l) { return 'Сколько килограммов таких яблок можно купить на ' + joinList(l, this.B) + '?'; },
      qB: 'Сколько рублей они стоят?', qA: 'Сколько килограммов яблок можно купить?' },
    { id: 'cloth', x: [5, 9], y: [2, 4], k: [2, 10], A: mu('м'), B: cnt(['костюм', 'костюма', 'костюмов']),
      given: function (a, b) { return 'На ' + this.B(b) + ' идёт ' + this.A(a) + ' ткани.'; },
      askB: function (l) { return 'Сколько костюмов получится из ' + joinList(l, this.A) + ' такой ткани?'; },
      askA: function (l) { return 'Сколько метров такой ткани нужно на ' + joinList(l, this.B) + '?'; },
      qB: 'Сколько костюмов получится?', qA: 'Сколько метров ткани нужно?' },
    { id: 'cotton', x: [5, 9], y: [2, 4], pair: function () { return pick([[7, 2], [8, 3], [9, 2], [9, 4], [5, 2], [7, 3], [8, 3]]); }, k: [2, 15], A: mu('кг'), B: mu('кг'),
      given: function (a, b) { return 'Из ' + this.A(a) + ' хлопка получается ' + this.B(b) + ' ваты.'; },
      askB: function (l) { return 'Сколько килограммов ваты получится из ' + joinList(l, this.A) + ' хлопка?'; },
      askA: function (l) { return 'Сколько хлопка нужно, чтобы получить ' + joinList(l, this.B) + ' ваты?'; },
      qB: 'Сколько килограммов ваты получится?', qA: 'Сколько килограммов хлопка нужно?' },
    { id: 'potato', x: [10, 25], y: [2, 5], pair: function () { return pick([[11, 2], [13, 2], [14, 3], [16, 3], [17, 3], [19, 4], [21, 4], [22, 5], [23, 5], [24, 5], [18, 4]]); }, k: [2, 10], A: mu('кг'), B: mu('кг'),
      given: function (a, b) { return 'Из ' + this.A(a) + ' картофеля получается ' + this.B(b) + ' крахмала.'; },
      askB: function (l) { return 'Сколько крахмала получится из ' + joinList(l, this.A) + ' картофеля?'; },
      askA: function (l) { return 'Сколько картофеля нужно, чтобы получить ' + joinList(l, this.B) + ' крахмала?'; },
      qB: 'Сколько килограммов крахмала получится?', qA: 'Сколько килограммов картофеля нужно?' },
    { id: 'pump', x: [3, 9], y: [2, 9], ys: 10, ok: function (x, y) { var q = y * 10 / x; return q >= 6 && q <= 20; }, k: [2, 10], A: cnt(['минуту', 'минуты', 'минут']), B: cnt(['ведро', 'ведра', 'вёдер']),
      given: function (a, b) { return 'Насос за ' + this.A(a) + ' выкачивает ' + this.B(b) + ' воды.'; },
      askB: function (l) { return 'Сколько вёдер воды он выкачает за ' + joinList(l, this.A) + '?'; },
      askA: function (l) { return 'За сколько минут он выкачает ' + joinList(l, this.B) + ' воды?'; },
      qB: 'Сколько вёдер воды он выкачает?', qA: 'За сколько минут он выкачает воду?' },
    { id: 'bike', x: [4, 20], y: [6, 18], ys: 5, ok: function (x, y) { var q = x * 60 / (y * 5); return q >= 9 && q <= 22; }, k: [2, 12], A: mu('км'), B: mu('мин'),
      given: function (a, b) { return 'Велосипедист проезжает ' + this.A(a) + ' за ' + this.B(b) + '.'; },
      askB: function (l) { return 'За сколько минут он проедет ' + joinList(l, this.A) + '?'; },
      askA: function (l) { return 'Сколько километров он проедет за ' + joinList(l, this.B) + '?'; },
      qB: 'За сколько минут он проедет это расстояние?', qA: 'Сколько километров он проедет?' },
    { id: 'print', x: [2, 9], y: [8, 30], ok: function (x, y) { var q = y / x; return q >= 4 && q <= 15; }, k: [2, 12], A: cnt(['минуту', 'минуты', 'минут']), B: cnt(['страницу', 'страницы', 'страниц']),
      given: function (a, b) { return 'Принтер за ' + this.A(a) + ' печатает ' + this.B(b) + '.'; },
      askB: function (l) { return 'Сколько страниц он напечатает за ' + joinList(l, this.A) + '?'; },
      askA: function (l) { return 'За сколько минут он напечатает ' + joinList(l, this.B) + '?'; },
      qB: 'Сколько страниц он напечатает?', qA: 'За сколько минут он напечатает страницы?' },
    { id: 'car', x: [5, 9], y: [8, 22], ys: 5, ok: function (x, y) { var q = y * 5 / x; return q >= 7 && q <= 12; }, k: [2, 10], A: mu('л'), B: mu('км'),
      given: function (a, b) { return 'Автомобиль на ' + this.A(a) + ' бензина проезжает ' + this.B(b) + '.'; },
      askB: function (l) { return 'Сколько километров он проедет на ' + joinList(l, this.A) + ' бензина?'; },
      askA: function (l) { return 'Сколько литров бензина потребуется, чтобы проехать ' + joinList(l, this.B) + '?'; },
      qB: 'Сколько километров он проедет?', qA: 'Сколько литров бензина потребуется?' },
    { id: 'paper', x: [2, 5], y: [5, 19], ok: function (x, y) { var q = y / x; return q >= 2.5 && q <= 7; }, k: [2, 8], A: cnt(['комнату', 'комнаты', 'комнат']), B: cnt(['рулон', 'рулона', 'рулонов']),
      given: function (a, b) { return 'На ' + this.A(a) + ' идёт ' + this.B(b) + ' обоев.'; },
      askB: function (l) { return 'Сколько рулонов обоев потребуется на ' + joinList(l, this.A) + ' такой же величины?'; },
      askA: function (l) { return 'Сколько таких комнат можно оклеить, если купить ' + joinList(l, this.B) + ' обоев?'; },
      qB: 'Сколько рулонов обоев потребуется?', qA: 'Сколько комнат можно оклеить?' },
    { id: 'melon', x: [2, 5], y: [7, 30], pair: function () { return pick([[2, 9], [3, 14], [4, 15], [5, 19], [3, 10], [2, 7], [4, 23]]); }, k: [2, 10], A: cnt(['арбуз', 'арбуза', 'арбузов']), B: mu('кг'),
      given: function (a, b) { return this.A(a) + ' весят ' + this.B(b) + '.'; },
      askB: function (l) { return 'Сколько килограммов весят ' + joinList(l, function (n) { return fmt(n) + NB + R.plural(n, ['такой арбуз', 'таких арбуза', 'таких арбузов']); }) + '?'; },
      askA: function (l) { return 'Сколько таких арбузов весят ' + joinList(l, this.B) + '?'; },
      qB: 'Сколько килограммов они весят?', qA: 'Сколько арбузов?' },
    { id: 'flour', x: [5, 10], y: null, k: [2, 15], A: mu('кг'), B: mu('кг'),
      pair: function () { return pick([[5, 7], [6, 8], [7, 9], [8, 11], [9, 12], [10, 13], [7, 10]]); },
      given: function (a, b) { return 'Из ' + this.A(a) + ' муки выпекают ' + this.B(b) + ' хлеба.'; },
      askB: function (l) { return 'Сколько хлеба выпекут из ' + joinList(l, this.A) + ' такой муки?'; },
      askA: function (l) { return 'Сколько муки нужно, чтобы выпечь ' + joinList(l, this.B) + ' хлеба?'; },
      qB: 'Сколько килограммов хлеба выпекут?', qA: 'Сколько килограммов муки нужно?' }
  ];
  function skinPair(sk) {
    var g, pr;
    for (g = 0; g < 300; g++) {
      pr = sk.pair ? sk.pair() : [rand(sk.x[0], sk.x[1]), rand(sk.y[0], sk.y[1]) * (sk.ys || 1)];
      if (!sk.ok || sk.ok(pr[0], pr[1] / (sk.pair ? 1 : (sk.ys || 1)))) return pr;
    }
    return pr;
  }
  function skinByIds(ids) { return ids && ids.length ? RS.filter(function (s) { return ids.indexOf(s.id) >= 0; }) : RS; }

  /* одна пропорциональная задача; возвращает {text, root, sk, case} */
  function ratioCase(o) {
    var g, sk, dirs;
    for (g = 0; g < 400; g++) {
      sk = pick(skinByIds(o.skins));
      var pr = skinPair(sk), x = pr[0], y = pr[1], k = rand(sk.k[0], Math.min(sk.k[1], o.kmax || 99));
      var dir = o.dir && o.dir !== 'any' ? o.dir : pick(['up', 'up', 'down']), ask = o.ask && o.ask !== 'any' ? o.ask : pick(['A', 'B']);
      if (x === y) continue;
      var X = x * k, Y = y * k, a1, b1, a2, b2;
      if (dir === 'up') { a1 = x; b1 = y; a2 = X; b2 = Y; } else { a1 = X; b1 = Y; a2 = x; b2 = y; }
      var unitImp = (b1 % a1 !== 0) && (a1 % b1 !== 0);
      var wantUnit = o.unit || 'no';
      if (wantUnit === 'no' && !unitImp) continue;
      if (wantUnit === 'yes' && unitImp) continue;
      var F = ask === 'B' ? sk.A : sk.B, u1 = ask === 'B' ? a1 : b1, u2 = ask === 'B' ? a2 : b2;
      var big = Math.max(u1, u2), small = Math.min(u1, u2);
      var qk = 'Во сколько раз ' + F.call(sk, big) + ' больше, чем ' + F.call(sk, small) + '?';
      var ratio = TN(':', big, small, qk, times(k));
      var root;
      if (ask === 'B') root = TN(dir === 'up' ? '×' : ':', b1, ratio, sk.qB, '');
      else root = TN(dir === 'up' ? '×' : ':', a1, ratio, sk.qA, '');
      var text = sk.given(a1, b1) + ' ' + (ask === 'B' ? sk.askB([a2]) : sk.askA([b2]));
      var ansS = ask === 'B' ? sk.B(b2) : sk.A(a2);
      return { text: text, root: root, sk: sk, dir: dir, ask: ask, k: k, a1: a1, b1: b1, a2: a2, b2: b2, unitImp: unitImp, ansS: ansS, value: ask === 'B' ? b2 : a2 };
    }
    return ratioCase({});
  }
  function ratioExplain(c, o) {
    var lines = planList(c.root);
    var note = '';
    if (c.unitImp) note = '<br><span class="soft">Способом приведения к единице здесь не решить: ' + fmt(Math.max(c.a1, c.b1)) + ' не делится на ' + fmt(Math.min(c.a1, c.b1)) + ' нацело. Поэтому применяем способ отношений.</span>';
    return stepsHTML(lines, c.ansS).replace(/Ответ: /, 'Ответ: ') + '<br>Одним выражением: <span class="ex">' + orText(treeTokens(c.root)) + ' = ' + fmt(c.value) + '</span>' + note;
  }
  var RHINT = 'Сравни две одинаковые величины из условия: во сколько раз одна больше (меньше) другой? Во столько же раз изменится и вторая величина.';

  reg('orRatio', function (o) {
    var c = ratioCase(o);
    return {
      kind: 'num', html: c.text + (o.expr ? '<br><span class="soft">Запиши решение выражением.</span>' : ''), answer: c.value, hint: RHINT, explain: ratioExplain(c, o),
      dbg: { tokens: treeTokens(c.root), leaves: treeLeaves(c.root), ratio: true }
    };
  });

  /* несколько вопросов к одному условию */
  reg('orRatioMulti', function (o) {
    var g, sk, x, y, list, dir = o.dir || pick(['up', 'up', 'down']), a1, b1, a2s, b2s;
    for (g = 0; g < 300; g++) {
      sk = pick(skinByIds(o.skins));
      var pr = skinPair(sk); x = pr[0]; y = pr[1]; if (x === y) continue;
      if (dir === 'up') {
        var ks = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]).slice(0, o.n || 3).sort(function (p, q) { return p - q; });
        a1 = x; b1 = y; a2s = ks.map(function (k) { return x * k; }); b2s = ks.map(function (k) { return y * k; });
      } else {
        var Lc = pick([12, 24, 36, 60]), ds = [];
        for (var d = 2; d <= Lc; d++) if (Lc % d === 0 && d <= 30) ds.push(d);
        ds = shuffle(ds).slice(0, o.n || 3).sort(function (p, q) { return q - p; });
        a1 = x * Lc; b1 = y * Lc; a2s = ds.map(function (d) { return a1 / d; }); b2s = ds.map(function (d) { return b1 / d; });
      }
      if (a1 % 1 || (o.unit !== 'any' && (b1 % a1 === 0 || a1 % b1 === 0))) continue;
      break;
    }
    var ask = 'B';
    var text = sk.given(a1, b1) + ' ' + sk.askB(a2s);
    var fields = a2s.map(function (a) { return { label: sk.A(a) }; });
    var lines = a2s.map(function (a, i) {
      return (dir === 'up' ? 'Для ' + sk.A(a) + ': ' + fmt(a) + ' : ' + fmt(a1) + ' = ' + (a / a1) + ' (' + times(a / a1) + ' больше), ' + fmt(b1) + ' × ' + (a / a1) + ' = ' + fmt(b2s[i])
        : 'Для ' + sk.A(a) + ': ' + fmt(a1) + ' : ' + fmt(a) + ' = ' + (a1 / a) + ' (' + times(a1 / a) + ' меньше), ' + fmt(b1) + ' : ' + (a1 / a) + ' = ' + fmt(b2s[i]));
    });
    return {
      kind: 'nums', html: text, fields: fields, answer: b2s, hint: RHINT + ' Для каждого количества считай отдельно.',
      explain: lines.join('<br>') + '<br>Ответ: ' + b2s.map(fmt).join(', ') + '.', dbg: { multi: true, a1: a1, b1: b1, a2s: a2s, b2s: b2s }
    };
  });

  /* выбор: что узнать в первую очередь / какое выражение */
  reg('orRatioPick', function (o) {
    var c = ratioCase({ skins: o.skins, dir: o.dir, ask: o.ask, unit: 'no' }), sk = c.sk, type = o.type || 'first';
    var tk = treeTokens(c.root);
    if (type === 'expr') {
      var right = orText(tk), ds = exprDistractors(tk, c.value, 3);
      if (ds.length < 3) return gens.orRatioPick(o);
      var opts = shuffle([right].concat(ds.map(function (d) { return d.text; })));
      return {
        kind: 'choice', html: c.text + '<br><span class="soft">Какое выражение решает задачу?</span>', options: opts, answer: opts.indexOf(right), wide: true,
        hint: RHINT, explain: ratioExplain(c, o), dbg: { tokens: tk, leaves: treeLeaves(c.root), ratio: true }
      };
    }
    var ratioNode = c.root.r, F = c.ask === 'B' ? sk.A : sk.B, big = ratioNode.l, small = ratioNode.r;
    var right1 = ratioNode.q, name = c.ask === 'B' ? 'одной единицы' : 'одной единицы';
    var one = c.ask === 'B' ? 'Сколько ' + (sk.qB.replace(/^Сколько /, '').replace(/\?$/, '')) + ' приходится на 1 ' : '';
    var wrong = [];
    wrong.push('На сколько ' + F.call(sk, big) + ' больше, чем ' + F.call(sk, small) + '?');
    wrong.push('Чему равна сумма ' + F.call(sk, big) + ' и ' + F.call(sk, small) + '?');
    wrong.push('Сколько приходится на одну единицу? Разделим ' + fmt(c.b1) + ' на ' + fmt(c.a1) + '.');
    var opts2 = shuffle([right1].concat(wrong));
    return {
      kind: 'choice', html: c.text + '<br><span class="soft">Какой вопрос надо задать первым, если решать способом отношений?</span>', options: opts2, answer: opts2.indexOf(right1), wide: true,
      hint: 'Способ отношений начинается со сравнения двух одинаковых величин: во сколько раз одна больше другой?',
      explain: 'Способ отношений начинается со сравнения двух величин одного вида: ' + F.call(sk, big) + ' и ' + F.call(sk, small) + '. Надо узнать, во сколько раз первая величина больше второй. Разделить ' + fmt(Math.max(c.a1, c.b1)) + ' на ' + fmt(Math.min(c.a1, c.b1)) + ' нацело нельзя, поэтому вопрос «сколько приходится на одну единицу» здесь не подходит.<br>' + ratioExplain(c, o),
      dbg: { ratio: true }
    };
  });

  /* «во сколько раз», «увеличь / уменьши в … раз» (устно) */
  reg('orRatioKnow', function (o) {
    var t = o.type || pick(['more', 'less', 'inc', 'dec', 'cont']), mag = o.mag || 1, base, k, a, b;
    var bases = mag === 2 ? [16, 40, 72, 120, 160, 250, 720, 900] : [4, 6, 7, 8, 9, 12, 15, 20, 30, 40, 50];
    base = pick(bases);
    if (t === 'inc' || t === 'dec') k = pick(mag === 2 ? [10, 100, 20, 30, 50, 70] : [2, 3, 4, 5, 6, 8, 10]);
    else k = pick(mag === 2 ? [5, 6, 7, 8, 9, 10, 12, 15, 20, 30, 50, 100] : [2, 3, 4, 5, 6, 7, 8, 9, 10]);
    if (t === 'more') { a = base * k; b = base; return { kind: 'num', html: 'Во сколько раз число ' + num(a) + ' больше числа ' + num(b) + '?', answer: k, hint: 'Чтобы узнать, во сколько раз одно число больше другого, разделим большее на меньшее.', explain: fmt(a) + ' : ' + fmt(b) + ' = ' + k + '. Проверка: ' + fmt(b) + ' × ' + k + ' = ' + fmt(a) + '.' }; }
    if (t === 'less') { a = base * k; b = base; return { kind: 'num', html: 'Во сколько раз число ' + num(b) + ' меньше числа ' + num(a) + '?', answer: k, hint: 'Чтобы узнать, во сколько раз одно число меньше другого, разделим большее на меньшее.', explain: fmt(a) + ' : ' + fmt(b) + ' = ' + k + '. Проверка: ' + fmt(b) + ' × ' + k + ' = ' + fmt(a) + '.' }; }
    if (t === 'inc') { a = base; return { kind: 'num', html: 'Увеличь число ' + num(a) + ' в ' + k + ' ' + times(k) + '.', answer: a * k, hint: 'Увеличить в несколько раз — значит умножить.', explain: fmt(a) + ' × ' + k + ' = ' + fmt(a * k) + '.' }; }
    if (t === 'dec') { a = base * k; return { kind: 'num', html: 'Уменьши число ' + num(a) + ' в ' + k + ' ' + times(k) + '.', answer: base, hint: 'Уменьшить в несколько раз — значит разделить.', explain: fmt(a) + ' : ' + k + ' = ' + fmt(base) + '.' }; }
    a = base * k; b = base;
    return { kind: 'num', html: 'Сколько раз в числе ' + num(a) + ' содержится по ' + fmt(b) + '?', answer: k, hint: 'Сколько раз одно число содержится в другом — это частное.', explain: fmt(a) + ' : ' + fmt(b) + ' = ' + k + '.' };
  });

  /* число, которое больше (меньше) в столько раз, во сколько … */
  reg('orRatioNum', function (o) {
    var dir = o.dir || pick(['up', 'down']), r = rand(2, 12), q = rand(3, 40), p = q * r, c, ans, txt, why;
    if (dir === 'up') {
      c = rand(12, 90); if (c === q) c += 1;
      ans = c * r;
      txt = 'Найди число, которое больше ' + fmt(c) + ' во столько раз, во сколько ' + fmt(p) + ' больше ' + fmt(q) + '.';
      why = '1) Во сколько раз ' + fmt(p) + ' больше ' + fmt(q) + '? ' + fmt(p) + ' : ' + fmt(q) + ' = ' + r + '. 2) Искомое число больше ' + fmt(c) + ' в ' + r + ' ' + times(r) + ': ' + fmt(c) + ' × ' + r + ' = ' + fmt(ans) + '.';
    } else {
      var t = rand(3, 40); c = t * r; ans = t;
      txt = 'Найди число, которое меньше ' + fmt(c) + ' во столько раз, во сколько ' + fmt(q) + ' меньше ' + fmt(p) + '.';
      why = '1) Во сколько раз ' + fmt(q) + ' меньше ' + fmt(p) + '? ' + fmt(p) + ' : ' + fmt(q) + ' = ' + r + '. 2) Искомое число меньше ' + fmt(c) + ' в ' + r + ' ' + times(r) + ': ' + fmt(c) + ' : ' + r + ' = ' + fmt(ans) + '.';
    }
    return { kind: 'num', html: txt, answer: ans, hint: 'Сначала узнай, во сколько раз одно число больше (меньше) другого, а потом измени данное число во столько же раз.', explain: why };
  });


  /* ---------- с переводом единиц ---------- */
  reg('orRatioUnits', function (o) {
    var t = o.type || pick(['ton', 'hour', 'km', 'bike']), text, root, ansS, hint, note;
    if (t === 'ton') {
      var pr = pick([[4, 3], [8, 6], [10, 7], [20, 15], [40, 31], [50, 37], [25, 19], [5, 4]]), n = rand(1, 5), x = pr[0], y = pr[1], A2 = n * 1000;
      text = 'Из ' + x + ' кг зерна получают ' + y + ' кг муки. Сколько килограммов муки получится из ' + n + ' т такого зерна?';
      var cv = TN('×', n, 1000, '1 т = 1 000 кг. Сколько килограммов зерна в ' + n + ' т?', 'кг');
      root = TN('×', y, TN(':', cv, x, 'Во сколько раз ' + fmt(A2) + ' кг больше, чем ' + x + ' кг?', 'раз'), 'Сколько килограммов муки получится?', 'кг');
      ansS = fmt(tv(root)) + ' кг'; hint = 'Прежде чем сравнивать, вырази обе массы зерна в одних единицах: 1 т = 1 000 кг.';
    } else if (t === 'hour') {
      var xs = pick([4, 5, 6, 10, 12, 15, 20, 30]), ys = rand(3, 9) * 10, nh = rand(2, 4);
      text = 'Насос за ' + xs + ' мин выкачивает ' + nn(ys, ['ведро', 'ведра', 'вёдер']) + ' воды. Сколько вёдер воды он выкачает за ' + nh + ' ч?';
      var cv2 = TN('×', nh, 60, '1 ч = 60 мин. Сколько минут в ' + nh + ' ч?', 'мин');
      root = TN('×', ys, TN(':', cv2, xs, 'Во сколько раз ' + fmt(nh * 60) + ' мин больше, чем ' + xs + ' мин?', 'раз'), 'Сколько вёдер воды он выкачает?', 'вёдер');
      ansS = nn(tv(root), ['ведро', 'ведра', 'вёдер']); hint = 'Переведи часы в минуты: 1 ч = 60 мин. Потом сравни время.';
    } else if (t === 'km') {
      var xm = pick([4, 5, 8, 10, 20, 25, 40, 50]), ym = rand(3, 20), nk = rand(1, 3);
      text = 'На ' + xm + ' м забора нужно ' + nn(ym, ['доску', 'доски', 'досок']) + '. Сколько досок нужно на ' + nk + ' км такого забора?';
      var cv3 = TN('×', nk, 1000, '1 км = 1 000 м. Сколько метров в ' + nk + ' км?', 'м');
      root = TN('×', ym, TN(':', cv3, xm, 'Во сколько раз ' + fmt(nk * 1000) + ' м больше, чем ' + xm + ' м?', 'раз'), 'Сколько досок нужно?', 'досок');
      ansS = nn(tv(root), ['доску', 'доски', 'досок']); hint = 'Переведи километры в метры: 1 км = 1 000 м. Потом сравни длины.';
    } else {
      var hh = rand(2, 5), tot = hh * 60, kd = [], z;
      for (z = 2; z <= 15; z++) if (tot % z === 0) kd.push(z);
      var kk, ee, dd, gb;
      for (gb = 0; gb < 200; gb++) { kk = pick(kd); ee = rand(2, 9); dd = ee * kk; if (dd >= 8 * hh && dd <= 25 * hh) break; }
      if (gb >= 200) { hh = 3; tot = 180; kk = 6; ee = 3; dd = 18; }
      text = 'Велосипедист проезжает ' + dd + ' км за ' + hh + ' ч. За сколько минут он проедет ' + ee + ' км?';
      var cv4 = TN('×', hh, 60, 'Сколько минут в ' + hh + ' ч?', 'мин');
      root = TN(':', cv4, TN(':', dd, ee, 'Во сколько раз ' + dd + ' км больше, чем ' + ee + ' км?', 'раз'), 'За сколько минут он проедет ' + ee + ' км?', 'мин');
      ansS = fmt(tv(root)) + ' мин'; hint = 'Вырази время в минутах: 1 ч = 60 мин. Потом сравни расстояния.';
    }
    var v = tv(root), tk = treeTokens(root);
    if (!(v >= 1)) return gens.orRatioUnits(o);
    return {
      kind: 'num', html: text, answer: v, hint: hint, explain: stepsHTML(planList(root), ansS) + '<br>Одним выражением: <span class="ex">' + orText(tk) + ' = ' + fmt(v) + '</span>',
      dbg: { tokens: tk, leaves: treeLeaves(root), ratio: true }
    };
  });

  /* ---------- сначала найти общее, потом отношение ---------- */
  reg('orRatioTwo', function (o) {
    var t = o.type || pick(['cheese', 'coat', 'print']), text, root, ansS, hint, g;
    for (g = 0; g < 200; g++) {
      if (t === 'cheese') {
        var N = rand(4, 16) * 10, m = rand(12, 24), d = pick([1, 1, 2, 3]), p = pick([20, 25, 40, 50]), q = Math.round(p / 10) + pick([0, 0, 1]), tot = N * m * d;
        if (tot % p || N === p) continue;
        text = 'На ферме ' + nn(N, ['корова', 'коровы', 'коров']) + ', и каждая даёт в среднем ' + m + ' л молока в сутки. Из ' + p + ' л молока получается ' + q + ' кг сыра. Сколько килограммов сыра получится из молока всех коров за ' + (d === 1 ? 'сутки' : nn(d, ['сутки', 'суток', 'суток'])) + '?';
        var s1 = d === 1 ? TN('×', N, m, 'Сколько литров молока дают все коровы за сутки?', 'л') : TN('×', TN('×', N, m, 'Сколько литров молока дают все коровы за сутки?', 'л'), d, 'Сколько литров молока получат за ' + nn(d, ['сутки', 'суток', 'суток']) + '?', 'л');
        root = TN('×', q, TN(':', s1, p, 'Во сколько раз ' + fmt(tot) + ' л больше, чем ' + p + ' л?', 'раз'), 'Сколько килограммов сыра получится?', 'кг');
        ansS = fmt(tv(root)) + ' кг'; hint = 'Сначала узнай, сколько всего молока получат. Потом сравни это количество с тем, из которого получают ' + q + ' кг сыра.';
      } else if (t === 'coat') {
        var Ns = rand(10, 60) * 10, w = rand(3, 5), pw = pick([2, 3, 4, 5]), c = pick([3, 4, 5, 6]), mc = pick([2, 3]), tw = Ns * w;
        if (tw % pw) continue;
        var cloth = c * (tw / pw);
        if (cloth % mc) continue;
        text = 'В хозяйстве ' + nn(Ns, ['овца', 'овцы', 'овец']) + ', каждая даёт в год по ' + w + ' кг шерсти. Из ' + pw + ' кг шерсти получается ' + c + ' м сукна, а на одно пальто идёт ' + mc + ' м сукна. Сколько пальто можно сшить из сукна, изготовленного из всей шерсти?';
        var s2 = TN('×', Ns, w, 'Сколько килограммов шерсти дают все овцы?', 'кг');
        var cl = TN('×', c, TN(':', s2, pw, 'Во сколько раз ' + fmt(tw) + ' кг больше, чем ' + pw + ' кг?', 'раз'), 'Сколько метров сукна получится?', 'м');
        root = TN(':', cl, mc, 'Сколько пальто можно сшить?', 'пальто');
        ansS = nn(tv(root), ['пальто', 'пальто', 'пальто']); hint = 'Сначала найди всю шерсть, потом — сколько получится сукна, и только после этого — сколько пальто.';
      } else {
        var tt = pick([4, 5, 6, 8, 10]), hh = pick([6, 8]), dd2 = rand(2, 9), pb = rand(5, 30) * 100;
        if ((dd2 * hh) % tt) continue;
        text = 'Типография за ' + nn(tt, F_HOUR) + ' печатает ' + nn(pb, ['книгу', 'книги', 'книг']) + '. Сколько книг она напечатает за ' + nn(dd2, ['смену', 'смены', 'смен']) + ' по ' + nn(hh, F_HOUR) + ', если будет работать так же?';
        var hs = TN('×', dd2, hh, 'Сколько часов длятся ' + nn(dd2, ['смена', 'смены', 'смен']) + '?', 'ч');
        root = TN('×', pb, TN(':', hs, tt, 'Во сколько раз ' + dd2 * hh + ' ч больше, чем ' + tt + ' ч?', 'раз'), 'Сколько книг напечатают?', 'книг');
        ansS = nn(tv(root), ['книгу', 'книги', 'книг']); hint = 'Сначала найди, сколько всего часов работала типография, потом сравни с ' + tt + ' ч.';
      }
      break;
    }
    var v = tv(root), tk = treeTokens(root);
    if (g >= 200 || !(v >= 1)) return gens.orRatioTwo(o);
    return {
      kind: 'num', html: text, answer: v, hint: hint, explain: stepsHTML(planList(root), ansS) + '<br>Одним выражением: <span class="ex">' + orText(tk) + ' = ' + fmt(v) + '</span>',
      dbg: { tokens: tk, leaves: treeLeaves(root), ratio: true }
    };
  });

  /* ---------- цепочка двух отношений ---------- */
  var CH = [
    { raw: 'хлопка', p1: 'семян', p2: 'масла', pairs: [[40, 24], [50, 30], [20, 12], [25, 15], [10, 6]], z: function (y2) { return y2 % 4 === 0 ? y2 / 4 : 0; }, k: [2, 10], u1: 'кг', u2: 'кг', v1: 'получить', p2gen: 'хлопкового масла' },
    { raw: 'пшеницы', p1: 'муки', p2: 'хлеба', pairs: [[4, 3], [8, 6], [20, 15], [40, 30]], z: function (y2) { return y2 % 3 === 0 ? y2 / 3 * 4 : 0; }, k: [2, 12], u1: 'т', u2: 'т', v1: 'получить', p2gen: 'хлеба' },
    { raw: 'молока', p1: 'сливок', p2: 'масла', pairs: [[50, 5], [100, 10]], z: function (y2) { return y2 % 5 === 0 ? y2 / 5 * 2 : 0; }, k: [2, 8], u1: 'л', u2: 'кг', v1: 'получить', p2gen: 'сливочного масла', u1raw: 'л' }
  ];
  reg('orRatioChain', function (o) {
    var c = pick(CH), g, x, y, y2, z, k, X, P1, P2;
    for (g = 0; g < 200; g++) {
      var pr = pick(c.pairs); x = pr[0]; y = pr[1];
      y2 = pick([y, y, y / 2, y * 2]); if (y2 !== Math.floor(y2)) continue;
      z = c.z(y2); if (!z) continue;
      k = rand(c.k[0], c.k[1]); X = x * k; P1 = y * k;
      if (P1 % y2) continue;
      P2 = z * (P1 / y2);
      break;
    }
    var rawU = c.u1raw || c.u1;
    var text = 'Из ' + x + ' ' + rawU + ' ' + c.raw + ' получается ' + y + ' ' + c.u1 + ' ' + c.p1 + ', а из ' + y2 + ' ' + c.u1 + ' ' + c.p1 + ' — ' + z + ' ' + c.u2 + ' ' + c.p2gen + '. Сколько ' + c.p1 + ' и сколько ' + c.p2gen + ' получится из ' + X + ' ' + rawU + ' ' + c.raw + '?';
    var lines = [
      'Во сколько раз ' + X + ' ' + rawU + ' больше, чем ' + x + ' ' + rawU + '? ' + X + ' : ' + x + ' = ' + k,
      'Сколько ' + c.p1 + ' получится? ' + y + ' × ' + k + ' = ' + P1 + ' (' + c.u1 + ')',
      'Во сколько раз ' + P1 + ' ' + c.u1 + ' больше, чем ' + y2 + ' ' + c.u1 + '? ' + P1 + ' : ' + y2 + ' = ' + (P1 / y2),
      'Сколько ' + c.p2gen + ' получится? ' + z + ' × ' + (P1 / y2) + ' = ' + P2 + ' (' + c.u2 + ')'
    ];
    return {
      kind: 'nums', html: text, fields: [{ label: c.p1 + ', ' + c.u1 }, { label: c.p2gen + ', ' + c.u2 }], answer: [P1, P2],
      hint: 'Задача решается в два приёма способом отношений: сначала найди, сколько получится ' + c.p1 + ', а потом с помощью второго условия — сколько ' + c.p2gen + '.',
      explain: stepsHTML(lines, P1 + ' ' + c.u1 + ' ' + c.p1 + ' и ' + P2 + ' ' + c.u2 + ' ' + c.p2gen), dbg: { chain: [x, y, y2, z, X, P1, P2] }
    };
  });

  /* ---------- набор из нескольких предметов на группу ---------- */
  var SETS = [
    { pre: 'На уроке труда', verb: 'приготовили набор', who: 'учеников', items: [['циркуль', 'циркуля', 'циркулей'], ['угольник', 'угольника', 'угольников'], ['транспортир', 'транспортира', 'транспортиров'], ['линейка', 'линейки', 'линеек']] },
    { pre: 'На празднике', verb: 'приготовили угощение', who: 'ребят', items: [['булочка', 'булочки', 'булочек'], ['яблоко', 'яблока', 'яблок'], ['конфета', 'конфеты', 'конфет'], ['печенье', 'печенья', 'печений']] },
    { pre: 'В походе', verb: 'берут снаряжение', who: 'туристов', items: [['палатка', 'палатки', 'палаток'], ['котелок', 'котелка', 'котелков'], ['фонарик', 'фонарика', 'фонариков'], ['спальник', 'спальника', 'спальников']] }
  ];
  reg('orRatioSet', function (o) {
    var st = pick(SETS), cntv, gsz, k, n, idx, g;
    for (g = 0; g < 100; g++) {
      cntv = shuffle([1, 2, 3, 4, 5]).slice(0, o.items || 3).sort(function (a, b) { return a - b; });
      gsz = pick([3, 4, 5, 6, 8]); k = rand(3, 9); n = gsz * k;
      if (n % 10 !== 1) break;
    }
    idx = shuffle([0, 1, 2, 3]).slice(0, cntv.length);
    var parts = cntv.map(function (c, i) { var it = st.items[idx[i]]; return c + ' ' + R.plural(c, it); });
    var text = st.pre + ' для каждых ' + gsz + ' ' + st.who + ' ' + st.verb + ': ' + (parts.length > 1 ? parts.slice(0, -1).join(', ') + ' и ' + parts[parts.length - 1] : parts[0]) + '. Сколько предметов каждого вида нужно для ' + n + ' ' + st.who + '?';
    var fields = cntv.map(function (c, i) { return { label: st.items[idx[i]][2] }; });
    var ans = cntv.map(function (c) { return c * k; });
    return {
      kind: 'nums', html: text, fields: fields, answer: ans, hint: 'Узнай, во сколько раз ' + n + ' больше, чем ' + gsz + '. Во столько же раз больше понадобится и каждого предмета.',
      explain: '1) Во сколько раз ' + n + ' больше, чем ' + gsz + '? ' + n + ' : ' + gsz + ' = ' + k + '.<br>2) ' + cntv.map(function (c, i) { return fields[i].label + ': ' + c + ' × ' + k + ' = ' + (c * k); }).join('; ') + '.<br>Ответ: ' + ans.join(', ') + '.',
      dbg: { set: [gsz, n, k, cntv, ans] }
    };
  });

  /* ---------- сравнение расходов двух машин ---------- */
  reg('orRatioCmp', function (o) {
    var g, u1, u2, c1, c2, d1, d2, k1, k2, t1, t2;
    for (g = 0; g < 400; g++) {
      u1 = pick([4, 6, 7, 8, 9]); u2 = pick([4, 6, 7, 8, 9]); if (u1 === u2) continue;
      c1 = rand(u1 * 5, u1 * 9) * 10; c2 = rand(u2 * 5, u2 * 9) * 10; if (c1 % u1 === 0 || c2 % u2 === 0) continue;
      k1 = rand(30, 130); k2 = rand(30, 130); d1 = u1 * k1; d2 = u2 * k2;
      t1 = c1 * k1; t2 = c2 * k2; if (t1 === t2) continue;
      break;
    }
    var first = t1 > t2 ? 1 : 2, diff = Math.abs(t1 - t2);
    var text = 'Первый автомобиль проехал ' + fmt(d1) + ' км, второй — ' + fmt(d2) + ' км. Первый на каждые ' + u1 + ' км пути расходует ' + c1 + ' г горючего, а второй — на каждые ' + u2 + ' км расходует ' + c2 + ' г. Какой автомобиль израсходовал горючего больше и на сколько граммов больше?';
    var lines = [
      'Во сколько раз ' + fmt(d1) + ' км больше, чем ' + u1 + ' км? ' + fmt(d1) + ' : ' + u1 + ' = ' + k1,
      'Сколько граммов израсходовал первый автомобиль? ' + c1 + ' × ' + k1 + ' = ' + fmt(t1) + ' (г)',
      'Во сколько раз ' + fmt(d2) + ' км больше, чем ' + u2 + ' км? ' + fmt(d2) + ' : ' + u2 + ' = ' + k2,
      'Сколько граммов израсходовал второй автомобиль? ' + c2 + ' × ' + k2 + ' = ' + fmt(t2) + ' (г)',
      'На сколько граммов больше израсходовал ' + (first === 1 ? 'первый' : 'второй') + '? ' + fmt(Math.max(t1, t2)) + ' − ' + fmt(Math.min(t1, t2)) + ' = ' + fmt(diff) + ' (г)'
    ];
    return {
      kind: 'nums', html: text, fields: [{ label: 'номер автомобиля (1 или 2)' }, { label: 'на сколько граммов больше' }], answer: [first, diff],
      hint: 'Для каждой машины сравни путь с ' + u1 + ' км (и ' + u2 + ' км): во сколько раз путь больше. Во столько же раз больше расход. Потом сравни два расхода.',
      explain: stepsHTML(lines, 'больше израсходовал ' + (first === 1 ? 'первый' : 'второй') + ' автомобиль, на ' + fmt(diff) + ' г'), dbg: { cmp: [d1, u1, c1, d2, u2, c2, first, diff] }
    };
  });

  /* пошаговое вычисление со столбиками (для теории) */
  R.orBigSteps = function (tokens) { return orEval(tokens).steps.map(bigStepHTML).join(''); };

  /* ================= рисунки и виджеты ================= */
  /* группы «было → получилось»: x предметов слева, y справа, rows строк */
  R.orGroupsSVG = function (x, y, rows, ua, ub) {
    var cell = 24, rowH = 40, left = 6, i, j, out = '';
    var arrowX = left + x * cell + 8, bX = arrowX + 40, txtX = bX + y * cell + 12, W = txtX + 190, H = rows * rowH + 8;
    out += '<svg class="fig or-groups" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="Рисунок: ' + rows + ' одинаковых групп">';
    for (i = 0; i < rows; i++) {
      var yy = 6 + i * rowH, tot = y * (i + 1), word = Array.isArray(ub) ? R.plural(tot, ub) : ub;
      for (j = 0; j < x; j++) out += '<rect class="or-a" x="' + (left + j * cell) + '" y="' + yy + '" width="' + (cell - 4) + '" height="30" rx="5"/>';
      out += '<path class="or-br" d="M' + arrowX + ' ' + (yy + 15) + ' H' + (arrowX + 28) + ' M' + (arrowX + 21) + ' ' + (yy + 8) + ' L' + (arrowX + 29) + ' ' + (yy + 15) + ' L' + (arrowX + 21) + ' ' + (yy + 22) + '"/>';
      for (j = 0; j < y; j++) out += '<circle class="or-b" cx="' + (bX + j * cell + 10) + '" cy="' + (yy + 15) + '" r="11"/>';
      out += '<text class="or-lb" x="' + txtX + '" y="' + (yy + 20) + '">' + fmt(x * (i + 1)) + ' ' + ua + ' — ' + fmt(tot) + ' ' + word + '</text>';
    }
    return out + '</svg>';
  };

  R.widgetMounts = R.widgetMounts || {};

  /* виджет «Порядок действий по шагам» */
  function nextAction(tk) {
    var close = tk.indexOf(')'), lo = 0, hi = tk.length - 1, open = -1, i, idx = -1;
    if (close >= 0) { open = close; while (tk[open] !== '(') open--; lo = open + 1; hi = close - 1; }
    for (i = lo + 1; i <= hi; i += 2) if (tk[i] === '×' || tk[i] === ':') { idx = i; break; }
    if (idx < 0) for (i = lo + 1; i <= hi; i += 2) if (tk[i] === '+' || tk[i] === '−') { idx = i; break; }
    return { idx: idx, lo: lo, hi: hi, open: open, close: close };
  }
  function tokensHTML(tk, hl) {
    return tk.map(function (t, i) {
      var h = isNum(t) ? fmt(t) : (t === '(' || t === ')') ? t : NB + t + ' ';
      if (hl && i === hl.idx - 1) h = '<span class="or-hl">' + h;
      if (hl && i === hl.idx + 1) h = h + '</span>';
      return h;
    }).join('').replace(/\s+$/, '');
  }
  function nextWhy(tk, na) {
    var seg = tk.slice(na.lo, na.hi + 1), op = tk[na.idx], out = na.open >= 0 ? 'Сначала действия в скобках. ' : '';
    var nHigh = seg.filter(function (t) { return t === '×' || t === ':'; }).length, nLow = seg.filter(function (t) { return t === '+' || t === '−'; }).length;
    if (op === '×' || op === ':') {
      if (nLow) out += 'Умножение и деление выполняем раньше сложения и вычитания.';
      else out += nHigh > 1 ? 'Остались умножение и деление — выполняем по порядку, слева направо.' : 'Остаётся одно действие.';
    } else {
      out += nLow > 1 ? 'Остались сложение и вычитание — выполняем по порядку, слева направо.' : 'Остаётся одно действие.';
    }
    return out;
  }
  R.widgetMounts.orStep = function (host) {
    var src = host.getAttribute('data-expr'), tk, lines, finished;
    function parse(str) {
      return str.split(/\s+/).map(function (t) { return /^\d+$/.test(t) ? Number(t) : t === '-' ? '−' : t === '*' ? '×' : t === '/' ? ':' : t; });
    }
    function fresh(useSrc) {
      if (useSrc && src) tk = parse(src);
      else tk = genExprTree({ mag: 'small', k: [3, 4], br: 'some', stages: 2 }).tokens;
      lines = [tk]; finished = false;
    }
    host.innerHTML = '<div class="or-wrow"></div><div class="or-wnote facts"></div><div class="or-wchain"></div><div class="or-tools"><button class="btn primary" type="button" data-a="step">Выполнить действие</button> <button class="btn soft" type="button" data-a="new">Другой пример</button></div>';
    var row = host.querySelector('.or-wrow'), note = host.querySelector('.or-wnote'), chain = host.querySelector('.or-wchain'), bs = host.querySelector('[data-a="step"]'), bn = host.querySelector('[data-a="new"]');
    function draw() {
      var na = nextAction(tk);
      if (tk.length === 1) {
        row.innerHTML = '<span class="or-done">' + fmt(tk[0]) + '</span>';
        note.innerHTML = 'Все действия выполнены. Значение выражения: <b>' + fmt(tk[0]) + '</b>.';
        bs.textContent = 'Начать сначала';
      } else {
        row.innerHTML = tokensHTML(tk, na);
        var a = tk[na.idx - 1], b = tk[na.idx + 1], op = tk[na.idx];
        note.innerHTML = 'Следующее действие подсвечено: <b>' + fmt(a) + ' ' + op + ' ' + fmt(b) + '</b>. ' + nextWhy(tk, na);
        bs.textContent = 'Выполнить действие';
      }
      chain.innerHTML = lines.length > 1 ? '<span class="or-chain">' + lines.map(function (t, i) { return '<span class="or-cl">' + (i ? '= ' : '') + orText(t) + '</span>'; }).join('') + '</span>' : '';
    }
    bs.addEventListener('click', function () {
      if (tk.length === 1) { fresh(true); } else { tk = reduceOnce(tk); lines.push(tk); }
      draw();
    });
    bn.addEventListener('click', function () { fresh(false); draw(); });
    fresh(true); draw();
  };

  /* виджет «Способ отношений»: добавляем одинаковые группы */
  R.widgetMounts.orRatio = function (host) {
    var x = Number(host.getAttribute('data-x') || 5), y = Number(host.getAttribute('data-y') || 3), kmax = Number(host.getAttribute('data-k') || 4);
    var ua = host.getAttribute('data-ua') || 'л', ubf = (host.getAttribute('data-ub') || 'стакан|стакана|стаканов').split('|'), wa = host.getAttribute('data-wa') || 'молока', wb = host.getAttribute('data-wb') || 'сливок';
    var n = 1;
    host.innerHTML = '<div class="or-fig-wrap"></div><p class="facts or-wnote"></p><div class="or-tools"><button class="btn primary" type="button" data-a="add"></button> <button class="btn soft" type="button" data-a="reset">Сначала</button></div>';
    var fig = host.querySelector('.or-fig-wrap'), note = host.querySelector('.or-wnote'), add = host.querySelector('[data-a="add"]'), rs = host.querySelector('[data-a="reset"]');
    function draw() {
      fig.innerHTML = R.orGroupsSVG(x, y, n, ua, ubf);
      var A = x * n, B = y * n;
      if (n === 1) note.innerHTML = 'Из ' + fmt(x) + ' ' + ua + ' ' + wa + ' получается ' + fmt(y) + ' ' + R.plural(y, ubf) + ' ' + wb + '. Добавим ещё одну такую же группу.';
      else note.innerHTML = 'Групп: ' + n + '. Значит, ' + wa + ' стало <b>' + fmt(A) + ' ' + ua + '</b> (в ' + n + ' ' + times(n) + ' больше, чем ' + fmt(x) + ' ' + ua + '), и ' + wb + ' получается тоже в ' + n + ' ' + times(n) + ' больше: ' + fmt(y) + ' × ' + n + ' = <b>' + fmt(B) + ' ' + R.plural(B, ubf) + '</b>.';
      add.textContent = n >= kmax ? 'Больше добавить нельзя' : 'Добавить ещё ' + fmt(x) + ' ' + ua;
      add.disabled = n >= kmax;
    }
    add.addEventListener('click', function () { if (n < kmax) { n++; draw(); } });
    rs.addEventListener('click', function () { n = 1; draw(); });
    draw();
  };

  /* @@END */
})(typeof window !== 'undefined' ? window : globalThis);
