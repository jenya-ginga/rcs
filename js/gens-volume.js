/* Блок «Объём» (уроки 108–121): куб и прямоугольный параллелепипед, объём и кубические меры.
   Рисунки — косоугольная проекция «как в школьной тетради» (передняя грань — прямоугольник, глубина под углом).
   Префикс имён — vo / pvo / R.vo…  Все числа генерируются от ответа так, чтобы деление шло нацело. */
(function (G) {
  'use strict';
  var R = G.RKS;
  var rand = R.rand, pick = R.pick, shuffle = R.shuffle, fmt = R.fmt, NB = R.NB;
  var gens = R.gens;
  function reg(name, fn) {
    if (gens[name]) throw new Error('дубль ' + name);
    gens[name] = fn;
  }

  /* ================= мелкие помощники ================= */
  function expr(s) { return '<span class="expr">' + s + '</span>'; }
  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function nu(n, u) { return fmt(n) + NB + u; }                       /* «250 дм» */
  function vu(n, u) { return fmt(n) + NB + u + '³'; }                 /* «250 дм³» */
  function su(n, u) { return fmt(n) + NB + u + '²'; }                 /* «250 дм²» */
  function plur(n, a, b, c) { return R.plural(n, [a, b, c]); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function stepsL(list, ans) {
    return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>') + (ans ? '<br>Ответ: ' + ans + '.' : '');
  }
  function idc(s) { var h = 0, t = String(s); for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 1000003; return '<!--' + h + '-->'; }
  function ints(lo, hi) { var out = []; for (var i = lo; i <= hi; i++) out.push(i); return out; }
  function mulSign(list) { return list.map(fmt).join(' × '); }
  function pickDiff(arr, avoid) {
    var pool = arr.filter(function (x) { return avoid.indexOf(x) < 0; });
    return pick(pool.length ? pool : arr);
  }
  /* перемешать варианты; вернуть {options, answer} — индекс верного */
  function mixOptions(right, wrongs) {
    var all = [right].concat(wrongs), seen = {}, uniq = [];
    all.forEach(function (o) { if (!seen[o]) { seen[o] = 1; uniq.push(o); } });
    var sh = shuffle(uniq);
    return { options: sh, answer: sh.indexOf(right) };
  }
  var UNIT_GEN = { 'мм': 'миллиметров', 'см': 'сантиметров', 'дм': 'дециметров', 'м': 'метров' };
  var UNIT_CUBIC = { 'мм': 'кубический миллиметр', 'см': 'кубический сантиметр', 'дм': 'кубический дециметр', 'м': 'кубический метр' };

  /* ================= рисунки: параллелепипед и куб ================= */
  var FX = 0.42, FY = 0.26;              /* сдвиг вглубь на единицу глубины (в долях размера клетки) */
  function textW(t) { return String(t).length * 8.4 + 8; }
  function geom(a, b, c, o) {
    o = o || {};
    var lab = o.lab || {};
    var padL = o.padL != null ? o.padL : Math.max(14, lab.c ? textW(lab.c) + 8 : 14);
    var padR = o.padR != null ? o.padR : Math.max(14, lab.b ? textW(lab.b) + 10 : 14);
    var padT = o.padT != null ? o.padT : 12;
    var padB = o.padB != null ? o.padB : (lab.a ? 30 : 12);
    var maxW = (o.maxW || 300) - padL - padR, maxH = (o.maxH || 210) - padT - padB;
    var s = o.s || Math.min(maxW / (a + FX * b), maxH / (c + FY * b), o.maxS || 46);
    s = Math.round(s * 10) / 10;
    var W = Math.round(padL + s * (a + FX * b) + padR), H = Math.round(padT + s * (c + FY * b) + padB);
    function P(x, y, z) {
      return [Math.round((padL + s * (x + FX * y)) * 10) / 10, Math.round((padT + s * (c + FY * b) - s * (z + FY * y)) * 10) / 10];
    }
    var V = { F0: P(0, 0, 0), F1: P(a, 0, 0), F2: P(a, 0, c), F3: P(0, 0, c), B0: P(0, b, 0), B1: P(a, b, 0), B2: P(a, b, c), B3: P(0, b, c) };
    return { s: s, W: W, H: H, P: P, V: V, a: a, b: b, c: c };
  }
  function pt(p) { return p[0] + ' ' + p[1]; }
  function poly(pts, cls) { return '<path class="' + cls + '" d="M' + pts.map(pt).join('L') + 'Z"/>'; }
  function seg(p, q, cls) { return '<path class="' + cls + '" d="M' + pt(p) + 'L' + pt(q) + '"/>'; }
  var FACES = {
    front: ['F0', 'F1', 'F2', 'F3'], back: ['B0', 'B1', 'B2', 'B3'], left: ['F0', 'F3', 'B3', 'B0'],
    right: ['F1', 'B1', 'B2', 'F2'], top: ['F3', 'F2', 'B2', 'B3'], bottom: ['F0', 'F1', 'B1', 'B0']
  };
  var HIDDEN_EDGES = [['F0', 'B0'], ['B0', 'B1'], ['B0', 'B3']];
  var ALL_EDGES = [['F0', 'F1'], ['F1', 'F2'], ['F2', 'F3'], ['F3', 'F0'], ['B0', 'B1'], ['B1', 'B2'], ['B2', 'B3'], ['B3', 'B0'],
    ['F0', 'B0'], ['F1', 'B1'], ['F2', 'B2'], ['F3', 'B3']];
  R.voEdgeNames = { len: 'F0-F1', wid: 'F1-B1', hei: 'F0-F3' };

  function gridFaces(g, a, b, c, cls) {
    var P = g.P, i, out = '';
    for (i = 1; i < a; i++) out += seg(P(i, 0, 0), P(i, 0, c), cls) + seg(P(i, 0, c), P(i, b, c), cls);
    for (i = 1; i < c; i++) out += seg(P(0, 0, i), P(a, 0, i), cls) + seg(P(a, 0, i), P(a, b, i), cls);
    for (i = 1; i < b; i++) out += seg(P(0, i, c), P(a, i, c), cls) + seg(P(a, i, 0), P(a, i, c), cls);
    return out;
  }

  /* R.voBoxSVG(a, b, c, o): o.grid, o.hidden, o.lab {a,b,c}, o.hlF [грани], o.hlE ['F0-F1',…], o.hlV ['F1',…],
     o.k (слоёв уложено, «стеклянная коробка»), o.rowHL (выделить ряд), o.vnum (номера вершин), o.q (на какой размер поставить «?») */
  R.voBoxSVG = function (a, b, c, o) {
    o = o || {};
    var g = geom(a, b, c, o), V = g.V, P = g.P, s = '';
    var grid = o.grid != null ? o.grid : (a <= 12 && b <= 12 && c <= 12);
    var hidden = o.hidden != null ? o.hidden : !grid;
    var k = o.k != null ? o.k : null;
    if (k == null) {
      s += poly([V.F0, V.F1, V.F2, V.F3], 'vo-ft') + poly([V.F1, V.B1, V.B2, V.F2], 'vo-rt') + poly([V.F3, V.F2, V.B2, V.B3], 'vo-tp');
      if (grid) s += gridFaces(g, a, b, c, 'vo-g');
    }
    if (hidden || k != null) HIDDEN_EDGES.forEach(function (e) { s += seg(V[e[0]], V[e[1]], 'vo-hid'); });
    if (k != null && k > 0) {
      s += poly([V.F0, V.F1, P(a, 0, k), P(0, 0, k)], 'vo-lf') + poly([V.F1, V.B1, P(a, b, k), P(a, 0, k)], 'vo-lr') +
        poly([P(0, 0, k), P(a, 0, k), P(a, b, k), P(0, b, k)], 'vo-lt');
      var i;
      for (i = 1; i < a; i++) s += seg(P(i, 0, 0), P(i, 0, k), 'vo-g') + seg(P(i, 0, k), P(i, b, k), 'vo-g');
      for (i = 1; i < k; i++) s += seg(P(0, 0, i), P(a, 0, i), 'vo-g') + seg(P(a, 0, i), P(a, b, i), 'vo-g');
      for (i = 1; i < b; i++) s += seg(P(0, i, k), P(a, i, k), 'vo-g') + seg(P(a, i, 0), P(a, i, k), 'vo-g');
      s += seg(P(0, 0, k), P(a, 0, k), 'vo-e2') + seg(P(a, 0, k), P(a, b, k), 'vo-e2') + seg(P(0, 0, k), P(0, b, k), 'vo-e2') + seg(P(0, b, k), P(a, b, k), 'vo-e2');
    }
    (o.hlF || []).forEach(function (f) { s += poly(FACES[f].map(function (n) { return V[n]; }), 'vo-hlf'); });
    if (o.rowHL) {                                 /* ряд кубиков вдоль длины у переднего нижнего ребра */
      s += poly([V.F0, V.F1, P(a, 0, 1), P(0, 0, 1)], 'vo-row') + poly([V.F1, P(a, 1, 0), P(a, 1, 1), P(a, 0, 1)], 'vo-row') +
        poly([P(0, 0, 1), P(a, 0, 1), P(a, 1, 1), P(0, 1, 1)], 'vo-row');
    }
    /* контур */
    [['F0', 'F1'], ['F1', 'F2'], ['F2', 'F3'], ['F3', 'F0'], ['F1', 'B1'], ['B1', 'B2'], ['B2', 'F2'], ['F3', 'B3'], ['B3', 'B2']].forEach(function (e) {
      s += seg(V[e[0]], V[e[1]], 'vo-e');
    });
    (o.hlE || []).forEach(function (e) { var p = e.split('-'); s += seg(V[p[0]], V[p[1]], 'vo-he'); });
    (o.hlV || []).forEach(function (n) { s += '<circle class="vo-hv" cx="' + V[n][0] + '" cy="' + V[n][1] + '" r="6"/>'; });
    if (o.extra) s += o.extra(g);
    var lab = o.lab || {};
    if (lab.a != null) {
      var mx = (V.F0[0] + V.F1[0]) / 2;
      s += '<text x="' + mx + '" y="' + (V.F0[1] + 21) + '" text-anchor="middle"' + (lab.a === '?' ? ' class="vo-q"' : '') + '>' + lab.a + '</text>';
    }
    if (lab.b != null) {
      var mb = [(V.F1[0] + V.B1[0]) / 2, (V.F1[1] + V.B1[1]) / 2];
      s += '<text x="' + (mb[0] + 8) + '" y="' + (mb[1] + 17) + '" text-anchor="start"' + (lab.b === '?' ? ' class="vo-q"' : '') + '>' + lab.b + '</text>';
    }
    if (lab.c != null) {
      var mc = [(V.F0[0] + V.F3[0]) / 2, (V.F0[1] + V.F3[1]) / 2];
      s += '<text x="' + (mc[0] - 8) + '" y="' + (mc[1] + 5) + '" text-anchor="end"' + (lab.c === '?' ? ' class="vo-q"' : '') + '>' + lab.c + '</text>';
    }
    return '<svg class="fig vo-fig" viewBox="0 0 ' + g.W + ' ' + g.H + '" width="' + g.W + '" role="img" aria-label="' +
      (o.label || 'Прямоугольный параллелепипед') + '">' + s + '</svg>';
  };
  R.voBoxGeom = geom;

  /* ================= рисунки: развёртки ================= */
  var NETS = {
    cross:  [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]],
    crossB: [[3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2]],
    crossC: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]],
    crossD: [[2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]],
    stair:  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]],
    twoThree: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [1, 2]],
    twoThreeB: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [2, 2]],
    threeThree: [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]]
  };
  R.voNets = NETS;
  /* какие грани куба стоят на клетках развёртки: массив номеров 0..5 (противоположные: 0-1, 2-3, 4-5) или null, если это не развёртка */
  function foldFaces(cells) {
    var idx = {}, face = cells.map(function () { return -1; }), i;
    cells.forEach(function (c, k) { idx[c[0] + ',' + c[1]] = k; });
    function roll(st, d) {
      var n = { b: st.b, t: st.t, n: st.n, s: st.s, e: st.e, w: st.w };
      if (d === 'e') { n.b = st.e; n.e = st.t; n.t = st.w; n.w = st.b; }
      else if (d === 'w') { n.b = st.w; n.w = st.t; n.t = st.e; n.e = st.b; }
      else if (d === 'n') { n.b = st.n; n.n = st.t; n.t = st.s; n.s = st.b; }
      else { n.b = st.s; n.s = st.t; n.t = st.n; n.n = st.b; }
      return n;
    }
    var DIRS = [['e', 1, 0], ['w', -1, 0], ['n', 0, -1], ['s', 0, 1]];
    function dfs(k, st) {
      face[k] = st.b;
      DIRS.forEach(function (d) {
        var j = idx[(cells[k][0] + d[1]) + ',' + (cells[k][1] + d[2])];
        if (j != null && face[j] === -1) dfs(j, roll(st, d[0]));
      });
    }
    dfs(0, { b: 0, t: 1, n: 2, s: 3, e: 4, w: 5 });
    for (i = 0; i < face.length; i++) if (face[i] === -1) return null;
    var seen = {};
    for (i = 0; i < face.length; i++) { if (seen[face[i]]) return null; seen[face[i]] = 1; }
    return face;
  }
  R.voFoldFaces = foldFaces;

  /* развёртка из клеток; o.lab — подписи по клеткам, o.cls — классы клеток ('vo-nh' и т. п.) */
  R.voNetSVG = function (cells, o) {
    o = o || {};
    var s = o.s || 34, pad = 6, minC = 99, minR = 99, maxC = -1, maxR = -1;
    cells.forEach(function (c) { minC = Math.min(minC, c[0]); maxC = Math.max(maxC, c[0]); minR = Math.min(minR, c[1]); maxR = Math.max(maxR, c[1]); });
    var W = (maxC - minC + 1) * s + 2 * pad, H = (maxR - minR + 1) * s + 2 * pad, out = '';
    cells.forEach(function (c, i) {
      var x = pad + (c[0] - minC) * s, y = pad + (c[1] - minR) * s;
      out += '<rect class="vo-nc ' + ((o.cls && o.cls[i]) || '') + '" x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '"/>';
      if (o.lab && o.lab[i] != null) out += '<text x="' + (x + s / 2) + '" y="' + (y + s / 2 + 5) + '" text-anchor="middle"' + (o.small ? ' style="font-size:12px"' : '') + '>' + o.lab[i] + '</text>';
    });
    return '<svg class="fig vo-fig' + (o.cl ? ' ' + o.cl : '') + '" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="' + (o.label || 'Развёртка') + '">' + out + '</svg>';
  };

  /* развёртка прямоугольного параллелепипеда: o.nums {a,b,c} — числа на рёбрах, подписи граней */
  R.voBoxNetSVG = function (a, b, c, o) {
    o = o || {};
    var lw = 2 * (a + b), lh = 2 * b + c, W0 = o.maxW || 320, H0 = o.maxH || 200;
    var s = Math.min((W0 - 16) / lw, (H0 - 16) / lh, 30);
    s = Math.round(s * 10) / 10;
    var pad = 8, W = Math.round(lw * s + 2 * pad), H = Math.round(lh * s + 2 * pad), out = '';
    var x0 = pad + b * s;                       /* левый край передней грани */
    var y1 = pad + b * s;                       /* верх средней полосы */
    function rectF(x, y, w, h, txt, cls) {
      var r = '<rect class="vo-nc ' + (cls || '') + '" x="' + x + '" y="' + y + '" width="' + w * s + '" height="' + h * s + '"/>';
      if (txt) r += '<text x="' + (x + w * s / 2) + '" y="' + (y + h * s / 2 + 5) + '" text-anchor="middle" style="font-size:' + (s < 16 ? 11 : s < 20 ? 12 : 13) + 'px">' + txt + '</text>';
      return r;
    }
    var names = o.names || {};
    out += rectF(pad, y1, b, c, names.left, '');                                   /* левая */
    out += rectF(x0, y1, a, c, names.front, '');                                   /* передняя */
    out += rectF(x0 + a * s, y1, b, c, names.right, '');                           /* правая */
    out += rectF(x0 + (a + b) * s, y1, a, c, names.back, '');                      /* задняя */
    out += rectF(x0, pad, a, b, names.top, o.hlTop ? 'vo-nh' : '');                 /* верх */
    out += rectF(x0, y1 + c * s, a, b, names.bottom, o.hlTop ? 'vo-nh' : '');       /* низ */
    var t = '';
    if (o.nums) {
      t += '<text x="' + (x0 + a * s / 2) + '" y="' + (H - 1) + '" text-anchor="middle" style="font-size:13px">' + o.nums.a + '</text>';
    }
    return '<svg class="fig vo-fig" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="' + (o.label || 'Развёртка параллелепипеда') + '">' + out + t + '</svg>';
  };


  /* ================= геометрия: элементы куба и параллелепипеда (уроки 108–109) ================= */
  var VIS_EDGES = ALL_EDGES.filter(function (e) {
    return !HIDDEN_EDGES.some(function (h) { return h[0] === e[0] && h[1] === e[1]; });
  }).map(function (e) { return e[0] + '-' + e[1]; });
  var VIS_VERTS = ['F0', 'F1', 'F2', 'F3', 'B1', 'B2', 'B3'];
  var VIS_FACES = ['front', 'top', 'right'];
  function cubeFig(o) { o = o || {}; o.maxS = o.maxS || 70; o.grid = false; return R.voBoxSVG(1, 1, 1, o); }
  function randBoxDims() {                                  /* три разных измерения, чтобы рисунок был «читаемым» */
    var a = rand(5, 7), b = rand(2, 3), c = rand(3, 4);
    if (a === c) c = 2 + (c === 3 ? 2 : 0);
    return [a, b, c];
  }

  reg('voElems', function (o) {
    o = o || {};
    var isCube = (o.body || pick(['cube', 'box'])) === 'cube';
    var nm = isCube ? 'куба' : 'прямоугольного параллелепипеда';
    var pool = o.pool || ['faces', 'edges', 'verts', 'atV', 'faceEdges', 'hidden', 'sum'];
    var t = pick(pool), q;
    if (t === 'faces') q = { h: 'Сколько граней у ' + nm + '?', a: 6, hint: 'Посчитай: верхняя, нижняя и боковые грани.', e: 'Верхняя и нижняя — это 2 грани, ещё 4 боковые: 2 + 4 = 6.' };
    else if (t === 'edges') q = { h: 'Сколько рёбер у ' + nm + '?', a: 12, hint: 'Считай по группам: рёбра снизу, рёбра сверху и рёбра, которые идут вверх.', e: '4 ребра у нижней грани, 4 у верхней и ещё 4 вертикальных: 4 + 4 + 4 = 12.' };
    else if (t === 'verts') q = { h: 'Сколько вершин у ' + nm + '?', a: 8, hint: 'Вершины бывают внизу и вверху. Сколько вершин у одной грани?', e: '4 вершины внизу и 4 вверху: 4 + 4 = 8.' };
    else if (t === 'atV') {
      var w = pick([0, 1]);
      q = w ? { h: 'Сколько рёбер сходится в каждой вершине ' + nm + '?', a: 3, hint: 'В вершине встречаются длина, ширина и высота.', e: 'В каждой вершине сходятся ребро длины, ребро ширины и ребро высоты: 3 ребра.' }
        : { h: 'Сколько граней сходится в каждой вершине ' + nm + '?', a: 3, hint: 'Возьми кубик и коснись пальцем одной вершины: сколько граней ты трогаешь?', e: 'В вершине встречаются три грани: две боковые и одна верхняя или нижняя. Всего 3.' };
    } else if (t === 'faceEdges') {
      var w2 = pick([0, 1, 2]);
      q = w2 === 0 ? { h: 'Сколько рёбер у одной грани ' + nm + '?', a: 4, hint: 'Грань — ' + (isCube ? 'квадрат' : 'прямоугольник') + '. Сколько у него сторон?', e: 'Грань ограничена четырьмя рёбрами — это её стороны.' }
        : w2 === 1 ? { h: 'Сколько граней имеет общее ребро ' + nm + '?', a: 2, hint: 'Ребро — линия, где грани встречаются.', e: 'Каждое ребро получается на стыке двух граней.' }
        : { h: 'Сколько боковых граней у ' + nm + '? Верхнюю и нижнюю грани не считай.', a: 4, hint: 'Всего граней 6. Вычти верхнюю и нижнюю.', e: '6 − 2 = 4 боковые грани.' };
    } else if (t === 'hidden') {
      var w3 = pick([0, 1, 2]), fig = isCube ? cubeFig({ hidden: true, label: 'Куб, невидимые рёбра нарисованы штрихом' }) : R.voBoxSVG(6, 3, 4, { grid: false, hidden: true });
      var lead = 'Невидимые рёбра нарисованы штрихом.<br>' + fig + '<br>';
      q = w3 === 0 ? { h: lead + 'Сколько граней ' + nm + ' не видно на рисунке?', a: 3, hint: 'Видно верхнюю, переднюю и правую грани. Остальные — с обратной стороны.', e: 'Всего граней 6, видно 3 (передняя, верхняя, правая). Не видно 6 − 3 = 3 грани.' }
        : w3 === 1 ? { h: lead + 'Сколько рёбер нарисовано штрихом?', a: 3, hint: 'Штрихом нарисованы рёбра, которые сходятся в невидимой вершине.', e: 'Невидимая вершина одна, в ней сходятся 3 ребра. Они и нарисованы штрихом.' }
        : { h: lead + 'Сколько вершин не видно на рисунке?', a: 1, hint: 'Все вершины, кроме одной, видны.', e: 'Всего вершин 8, видно 7. Не видно 8 − 7 = 1 вершину.' };
    } else {
      var w4 = pick([0, 1, 2, 3]);
      var k = rand(2, 4);
      if (w4 === 0) q = { h: 'Сколько всего граней и вершин у ' + nm + ' вместе?', a: 14, hint: 'Граней 6, вершин 8.', e: '6 + 8 = 14.' };
      else if (w4 === 1) q = { h: 'На сколько рёбер у ' + nm + ' больше, чем граней?', a: 6, hint: 'Рёбер 12, граней 6.', e: '12 − 6 = 6.' };
      else if (w4 === 2) q = { h: 'На сколько вершин у ' + nm + ' больше, чем граней?', a: 2, hint: 'Вершин 8, граней 6.', e: '8 − 6 = 2.' };
      else q = { h: 'Сколько всего граней у ' + k + ' одинаковых ' + (isCube ? 'кубиков' : 'кирпичей') + '?', a: 6 * k, hint: 'У одного тела 6 граней.', e: '6 × ' + k + ' = ' + (6 * k) + '.' };
    }
    return { kind: 'num', html: q.h, answer: q.a, hint: q.hint, explain: q.e };
  });

  var POOL_CUBE_T = [
    'У куба 6 граней, и все они — равные квадраты.', 'У куба 12 рёбер, и все они равны между собой.', 'У куба 8 вершин.',
    'В каждой вершине куба сходятся три ребра.', 'Длина, ширина и высота куба равны между собой.',
    'Развёртка куба состоит из шести равных квадратов.', 'Противоположные грани куба равны.',
    'Каждое ребро куба — это линия, по которой встречаются две грани.', 'Зная длину одного ребра куба, можно узнать длины всех его рёбер.'
  ];
  var POOL_CUBE_F = [
    'У куба 8 граней.', 'У куба 6 рёбер.', 'У куба 12 вершин.', 'Грани куба — прямоугольники, которые не бывают квадратами.',
    'Рёбра куба бывают разной длины.', 'В каждой вершине куба сходятся четыре ребра.', 'У куба только два измерения: длина и высота.',
    'Развёртка куба состоит из четырёх квадратов.', 'У куба 4 грани.', 'Одна грань куба — квадрат, а остальные — прямоугольники.'
  ];
  var POOL_BOX_T = [
    'У прямоугольного параллелепипеда 6 граней, и все они — прямоугольники.', 'Противоположные грани прямоугольного параллелепипеда равны.',
    'У прямоугольного параллелепипеда 12 рёбер и 8 вершин.',
    'Рёбра прямоугольного параллелепипеда делятся на три группы по 4 равных ребра: длины, ширины и высоты.',
    'Длина, ширина и высота прямоугольного параллелепипеда могут быть разными числами.',
    'Нижняя и верхняя грани прямоугольного параллелепипеда — одинаковые прямоугольники.',
    'У прямоугольного параллелепипеда три измерения: длина, ширина и высота.', 'Развёртка прямоугольного параллелепипеда состоит из шести прямоугольников.'
  ];
  var POOL_BOX_F = [
    'Все грани прямоугольного параллелепипеда — квадраты.', 'Все рёбра прямоугольного параллелепипеда всегда равны.',
    'У прямоугольного параллелепипеда 10 рёбер.', 'У прямоугольного параллелепипеда 6 вершин.',
    'Противоположные грани прямоугольного параллелепипеда никогда не бывают равны.',
    'У прямоугольного параллелепипеда всегда все три измерения одинаковы.', 'У прямоугольного параллелепипеда 4 грани.',
    'Верхняя и нижняя грани прямоугольного параллелепипеда — прямоугольники разных размеров.'
  ];
  var POOL_BOTH_T = [
    'У куба и у прямоугольного параллелепипеда по 6 граней, по 12 рёбер и по 8 вершин.',
    'Куб — это прямоугольный параллелепипед, у которого длина, ширина и высота равны.',
    'У куба все грани — квадраты, а у прямоугольного параллелепипеда квадратными могут быть не все грани.',
    'У обоих тел по три измерения: длина, ширина и высота.', 'У обоих тел противоположные грани равны.'
  ];
  var POOL_BOTH_F = [
    'У куба больше граней, чем у прямоугольного параллелепипеда.', 'У прямоугольного параллелепипеда 8 граней, а у куба 6.',
    'Любой прямоугольный параллелепипед — куб.', 'У куба 12 рёбер, а у прямоугольного параллелепипеда 8.',
    'У куба три измерения, а у прямоугольного параллелепипеда только два.'
  ];
  reg('voTrue', function (o) {
    o = o || {};
    var topic = o.topic || pick(['cube', 'box', 'both']);
    var T = topic === 'cube' ? POOL_CUBE_T : topic === 'box' ? POOL_BOX_T : POOL_BOTH_T;
    var F = topic === 'cube' ? POOL_CUBE_F : topic === 'box' ? POOL_BOX_F : POOL_BOTH_F;
    var what = topic === 'cube' ? 'о кубе' : topic === 'box' ? 'о прямоугольном параллелепипеде' : 'о кубе и прямоугольном параллелепипеде';
    var askFalse = o.ask === 'false' ? true : o.ask === 'true' ? false : Math.random() < 0.35;
    var mix;
    if (!askFalse) {
      mix = mixOptions(pick(T), shuffle(F).slice(0, 3));
      return { kind: 'choice', html: 'Выбери верное утверждение ' + what + '.' + idc(mix.options.join('|')), options: mix.options, answer: mix.answer,
        hint: 'Проверь каждое утверждение: посчитай грани, рёбра, вершины и вспомни свойства.',
        explain: 'Верно: «' + mix.options[mix.answer] + '» Остальные утверждения противоречат свойствам: у обоих тел по 6 граней, 12 рёбер и 8 вершин; у куба все грани — равные квадраты, а у прямоугольного параллелепипеда грани — прямоугольники.' };
    }
    mix = mixOptions(pick(F), shuffle(T).slice(0, 3));
    return { kind: 'choice', html: 'Какое утверждение ' + what + ' <b>неверно</b>?' + idc(mix.options.join('|')), options: mix.options, answer: mix.answer,
      hint: 'Три утверждения верны, одно ошибочное. Проверь каждое.',
      explain: 'Неверно: «' + mix.options[mix.answer] + '» Остальные три утверждения верны.' };
  });

  reg('voPicElem', function (o) {
    o = o || {};
    var isCube = (o.body || pick(['cube', 'box'])) === 'cube', elem = o.elem || pick(['face', 'edge', 'vertex']), mode = o.mode || 'name';
    var hl = {}, d = randBoxDims();
    if (elem === 'face') hl.hlF = [pick(VIS_FACES)];
    else if (elem === 'edge') hl.hlE = [pick(VIS_EDGES)];
    else hl.hlV = [pick(VIS_VERTS)];
    hl.label = 'Выделен один элемент';
    var fig = isCube ? cubeFig(hl) : R.voBoxSVG(d[0], d[1], d[2], (function () { hl.grid = false; return hl; })());
    var nm = isCube ? 'куба' : 'прямоугольного параллелепипеда';
    var words = { face: 'грань', edge: 'ребро', vertex: 'вершина' }, cnt = { face: 6, edge: 12, vertex: 8 };
    if (mode === 'count') {
      return { kind: 'num', html: 'Красным выделен один из элементов ' + nm + '. Сколько всего таких элементов у ' + (isCube ? 'куба' : 'этого тела') + '?<br>' + fig,
        answer: cnt[elem], hint: 'Сначала скажи, что выделено: грань, ребро или вершина. Потом вспомни, сколько их у тела.',
        explain: 'Выделена ' + (elem === 'edge' ? 'линия — это ребро' : elem === 'face' ? 'часть поверхности — это грань' : 'точка — это вершина') + '. У ' + nm + ' их ' + cnt[elem] + '.' };
    }
    var mix = mixOptions(words[elem], ['вершина', 'ребро', 'грань'].filter(function (x) { return x !== words[elem]; }));
    return { kind: 'choice', html: 'Как называется выделенный красным элемент ' + nm + '?<br>' + fig, options: mix.options, answer: mix.answer, wide: false,
      hint: 'Точка — вершина, линия — ребро, плоская часть поверхности — грань.',
      explain: 'Выделена ' + (elem === 'edge' ? 'линия, по которой встречаются две грани' : elem === 'face' ? 'плоская часть поверхности' : 'точка, в которой сходятся три ребра') + ': это ' + words[elem] + '.' };
  });

  var DIMW = { len: 'длина', wid: 'ширина', hei: 'высота' };
  reg('voPicDim', function (o) {
    o = o || {};
    var d = randBoxDims(), which = o.which || pick(['len', 'wid', 'hei']), hl = R.voEdgeNames[which];
    var fig = R.voBoxSVG(d[0], d[1], d[2], { grid: false, hlE: [hl], label: 'Параллелепипед, выделено одно ребро' });
    var mix = mixOptions(DIMW[which], ['длина', 'ширина', 'высота'].filter(function (x) { return x !== DIMW[which]; }));
    return { kind: 'choice', html: 'Что показывает красное ребро прямоугольного параллелепипеда: длину, ширину или высоту?<br>' + fig, options: mix.options, answer: mix.answer,
      hint: 'Длина — ребро спереди слева направо, ширина — ребро, уходящее вглубь, высота — ребро вверх.',
      explain: which === 'len' ? 'Ребро идёт слева направо вдоль передней грани — это длина.' : which === 'wid' ? 'Ребро уходит от нас вглубь — это ширина.' : 'Ребро идёт снизу вверх — это высота.' };
  });

  reg('voPicRead', function (o) {
    o = o || {};
    var lo = o.lo || 2, hi = o.hi || 12, unit = o.unit || pick(['см', 'дм', 'м']);
    var a = rand(lo + 2, hi), b = rand(lo, Math.max(lo, hi - 4)), c = rand(lo, hi);
    while (a === b || b === c || a === c) { a = rand(lo + 2, hi); b = rand(lo, Math.max(lo, hi - 4)); c = rand(lo, hi); }
    var kk = 5 / Math.max(a, b, c, 5);
    var fig = R.voBoxSVG(a * kk, b * kk, c * kk, { grid: false, lab: { a: String(a), b: String(b), c: String(c) }, label: 'Параллелепипед с числами на рёбрах' });
    var which = o.which || pick(['len', 'wid', 'hei', 'sum']);
    var text, ans, why;
    if (which === 'sum') {
      ans = a + b + c; text = 'На рисунке даны длины трёх рёбер прямоугольного параллелепипеда (в ' + unit + '). Чему равна сумма его длины, ширины и высоты?';
      why = 'Длина ' + a + ', ширина ' + b + ', высота ' + c + '. ' + a + ' + ' + b + ' + ' + c + ' = ' + ans + ' (' + unit + ').';
    } else {
      ans = which === 'len' ? a : which === 'wid' ? b : c;
      text = 'На рисунке даны длины рёбер прямоугольного параллелепипеда (в ' + unit + '). Чему равна ' + DIMW[which] + '?';
      why = which === 'len' ? 'Длина — переднее нижнее ребро, оно подписано числом ' + a + '.' : which === 'wid' ? 'Ширина — ребро, уходящее вглубь, оно подписано числом ' + b + '.' : 'Высота — вертикальное ребро, оно подписано числом ' + c + '.';
    }
    return { kind: 'num', html: text + '<br>' + fig, answer: ans, hint: 'Длина — ребро слева направо перед тобой, ширина — ребро вглубь, высота — ребро вверх.', explain: why };
  });

  reg('voBoxCount', function (o) {
    o = o || {};
    var t = o.type || pick(['edgeLen', 'squares', 'faceArea']), u = pick(['см', 'дм', 'м']), text, ans, why, hint;
    if (t === 'edgeLen') {
      var kind = pick(['sq', 'sq', 'three']), a, b, c;
      if (kind === 'sq') { a = rand(2, 9); c = rand(2, 12); while (c === a) c = rand(2, 12); b = a; }
      else { a = rand(2, 12); b = rand(2, 12); c = rand(2, 12); while (b === a) b = rand(2, 12); while (c === a || c === b) c = rand(2, 12); }
      var dims = shuffle([a, b, c]), w = pick(dims), cntW = dims.filter(function (x) { return x === w; }).length;
      ans = 4 * cntW;
      text = 'Длина, ширина и высота прямоугольного параллелепипеда равны ' + dims[0] + ' ' + u + ', ' + dims[1] + ' ' + u + ' и ' + dims[2] + ' ' + u + '. Сколько у него рёбер длиной ' + w + ' ' + u + '?';
      hint = 'Рёбра делятся на три группы по 4 ребра: длины, ширины и высоты. Сколько измерений равны ' + w + '?';
      why = cntW === 1 ? 'Только одно измерение равно ' + w + ' ' + u + ', а каждому измерению соответствуют 4 ребра: 1 × 4 = 4.'
        : 'Два измерения равны ' + w + ' ' + u + ', а каждому измерению соответствуют 4 ребра: 2 × 4 = 8.';
    } else if (t === 'squares') {
      var A = rand(2, 9), C = rand(2, 14); while (C === A) C = rand(2, 14);
      var sqf = pick([true, false]);
      text = 'Основание прямоугольного параллелепипеда — квадрат со стороной ' + A + ' ' + u + ', а высота — ' + C + ' ' + u + '. Сколько его граней ' + (sqf ? '— квадраты' : '— прямоугольники, не являющиеся квадратами') + '?';
      ans = sqf ? 2 : 4;
      hint = 'Квадратные грани — нижняя и верхняя. Что можно сказать о боковых, если высота не равна стороне основания?';
      why = 'Нижняя и верхняя грани — квадраты со стороной ' + A + ' ' + u + '. Боковых граней 4, их размеры ' + A + ' × ' + C + ' ' + u + ' — это прямоугольники, не квадраты. ' + (sqf ? 'Квадратов 2.' : 'Прямоугольников, не квадратов, 4.');
    } else {
      var p = rand(2, 9), q = rand(2, 9), r = rand(2, 9);
      var shape = pick(['sq', 'sq', 'three']);
      if (shape === 'sq') { q = p; while (r === p) r = rand(2, 9); } else { while (q === p) q = rand(2, 9); while (r === p || r === q) r = rand(2, 9); }
      var faces = [p * q, p * q, p * r, p * r, q * r, q * r], target = pick(faces), n = faces.filter(function (x) { return x === target; }).length;
      var who = shuffle([p, q, r]);
      text = 'У прямоугольного параллелепипеда длина ' + who[0] + ' ' + u + ', ширина ' + who[1] + ' ' + u + ', высота ' + who[2] + ' ' + u + '. Сколько его граней имеют площадь ' + target + ' ' + u + '²?';
      var f01 = who[0] * who[1], f02 = who[0] * who[2], f12 = who[1] * who[2];
      ans = [f01, f01, f02, f02, f12, f12].filter(function (x) { return x === target; }).length;
      hint = 'Найди площади трёх разных граней: длина × ширина, длина × высота, ширина × высота. Каждая площадь встречается на двух гранях.';
      why = 'Площади граней: ' + who[0] + ' × ' + who[1] + ' = ' + f01 + '; ' + who[0] + ' × ' + who[2] + ' = ' + f02 + '; ' + who[1] + ' × ' + who[2] + ' = ' + f12 + ' (' + u + '²). Каждая площадь бывает у двух противоположных граней. Граней с площадью ' + target + ' ' + u + '²: ' + ans + '.';
    }
    return { kind: 'num', html: text, answer: ans, hint: hint, explain: why };
  });

  /* @@GENS1 */

  /* параллелепипед с подписями на рёбрах, размеры на рисунке пропорциональны числам (глубина сжата) */
  function boxNum(a, b, c, unit, o) {
    o = o || {};
    var kk = 5 / Math.max(a, b, c, 5), lab = o.lab || { a: nu(a, unit), b: nu(b, unit), c: nu(c, unit) };
    if (o.unknown) lab[o.unknown] = '?';
    var oo = { grid: false, lab: lab, label: o.label || 'Параллелепипед с размерами' };
    ['hlF', 'hlE', 'hlV'].forEach(function (k) { if (o[k]) oo[k] = o[k]; });
    if (o.maxS) oo.maxS = o.maxS;
    return R.voBoxSVG(Math.max(a * kk, 0.8), Math.max(b * kk, 0.8), Math.max(c * kk, 0.8), oo);
  }
  R.voBoxNum = boxNum;

  reg('voFrame', function (o) {
    o = o || {};
    var isCube = (o.body || pick(['cube', 'box'])) === 'cube', mode = o.mode || pick(['sum', 'sum', 'edge', 'left']);
    var u = pick(['см', 'дм', 'м']), obj = pick(['проволоки', 'палочек', 'реек']);
    var text, ans, why, hint;
    if (isCube) {
      var a = rand(2, 15), T = 12 * a;
      if (mode === 'edge') {
        text = 'На каркас куба ушло ' + nu(T, u) + ' ' + obj + '. Какова длина ребра куба?';
        ans = a; hint = 'У куба 12 равных рёбер. Раздели всю длину на 12.';
        why = 'У куба 12 рёбер, все равны. ' + fmt(T) + ' : 12 = ' + a + ' (' + u + '). Проверка: ' + a + ' × 12 = ' + fmt(T) + '.';
      } else if (mode === 'left') {
        var L = T + rand(1, 9) * pick([1, 5, 10]);
        text = 'Имеется ' + nu(L, u) + ' ' + obj + '. Из них сделали каркас куба с ребром ' + nu(a, u) + '. Сколько ' + obj + ' осталось?';
        ans = L - T; hint = 'Сначала найди, сколько ушло на каркас: у куба 12 рёбер.';
        why = stepsL([a + ' × 12 = ' + fmt(T) + ' (' + u + ') — ушло на каркас', fmt(L) + ' − ' + fmt(T) + ' = ' + fmt(L - T) + ' (' + u + ') — осталось'], fmt(L - T) + ' ' + u);
      } else {
        text = 'Ребро куба равно ' + nu(a, u) + '. Сколько ' + obj + ' нужно, чтобы сделать каркас этого куба (все 12 рёбер)?';
        ans = T; hint = 'Все рёбра куба равны, а их 12.';
        why = 'Рёбер 12, каждое ' + a + ' ' + u + ': ' + a + ' × 12 = ' + fmt(T) + ' (' + u + ').';
      }
    } else {
      var p = rand(3, 20), q = rand(2, 15), r = rand(2, 15), S = p + q + r, T2 = 4 * S;
      if (mode === 'edge') {
        text = 'На каркас прямоугольного параллелепипеда ушло ' + nu(T2, u) + ' ' + obj + '. Длина параллелепипеда ' + nu(p, u) + ', ширина ' + nu(q, u) + '. Найди высоту.';
        ans = r; hint = 'В каркасе по 4 ребра длины, ширины и высоты. Раздели всю длину на 4 — получишь сумму трёх измерений.';
        why = stepsL([fmt(T2) + ' : 4 = ' + S + ' (' + u + ') — длина + ширина + высота', S + ' − ' + p + ' − ' + q + ' = ' + r + ' (' + u + ')'], r + ' ' + u);
      } else if (mode === 'left') {
        var L2 = T2 + rand(1, 9) * pick([1, 5, 10]);
        text = 'Из куска ' + obj + ' длиной ' + nu(L2, u) + ' сделали каркас прямоугольного параллелепипеда: длина ' + nu(p, u) + ', ширина ' + nu(q, u) + ', высота ' + nu(r, u) + '. Сколько осталось?';
        ans = L2 - T2; hint = 'В каркасе по 4 ребра каждого из трёх измерений.';
        why = stepsL(['(' + p + ' + ' + q + ' + ' + r + ') × 4 = ' + S + ' × 4 = ' + fmt(T2) + ' (' + u + ') — ушло на каркас', fmt(L2) + ' − ' + fmt(T2) + ' = ' + fmt(L2 - T2) + ' (' + u + ') — осталось'], fmt(L2 - T2) + ' ' + u);
      } else {
        text = 'У прямоугольного параллелепипеда длина ' + nu(p, u) + ', ширина ' + nu(q, u) + ', высота ' + nu(r, u) + '. Сколько ' + obj + ' нужно на каркас (сумма длин всех 12 рёбер)?';
        ans = T2; hint = 'Рёбер каждого вида по 4: 4 длины, 4 ширины, 4 высоты.';
        why = '(' + p + ' + ' + q + ' + ' + r + ') × 4 = ' + S + ' × 4 = ' + fmt(T2) + ' (' + u + ').';
      }
    }
    return { kind: 'num', html: text, answer: ans, hint: hint, explain: why };
  });

  reg('voFace', function (o) {
    o = o || {};
    var mode = o.mode || pick(['cube', 'cube', 'cubeBack', 'box', 'box']), u = pick(['см', 'дм', 'м']);
    if (mode === 'cube') {
      var a = rand(2, 15);
      return { kind: 'num', html: 'Ребро куба равно ' + nu(a, u) + '. Найди площадь одной его грани (в ' + u + '²).<br>' + cubeFig({ lab: { a: nu(a, u) }, hlF: ['front'] }),
        answer: a * a, hint: 'Каждая грань куба — квадрат со стороной, равной ребру.',
        explain: 'Грань — квадрат со стороной ' + a + ' ' + u + '. Его площадь ' + a + ' × ' + a + ' = ' + a * a + ' (' + u + '²).' };
    }
    if (mode === 'cubeBack') {
      var b = rand(2, 12);
      return { kind: 'num', html: 'Площадь одной грани куба равна ' + su(b * b, u) + '. Найди длину ребра куба (в ' + u + ').',
        answer: b, hint: 'Грань — квадрат. Какое число, умноженное само на себя, даёт ' + b * b + '?',
        explain: 'Площадь квадрата равна ребро × ребро. Подходит ' + b + ', потому что ' + b + ' × ' + b + ' = ' + b * b + '. Ребро куба ' + b + ' ' + u + '.' };
    }
    var p = rand(3, 14), q = rand(2, 9), r = rand(2, 12);
    while (q === p) q = rand(2, 9); while (r === p || r === q) r = rand(2, 12);
    var f = pick(['front', 'top', 'right']), ans, w1, w2, nm;
    if (f === 'front') { ans = p * r; w1 = p; w2 = r; nm = 'передней'; } else if (f === 'top') { ans = p * q; w1 = p; w2 = q; nm = 'верхней'; } else { ans = q * r; w1 = q; w2 = r; nm = 'правой боковой'; }
    return { kind: 'num', html: 'Найди площадь закрашенной грани прямоугольного параллелепипеда (в ' + u + '²).<br>' + boxNum(p, q, r, u, { hlF: [f] }),
      answer: ans, hint: 'Грань — прямоугольник. Найди его две стороны по рисунку.',
      explain: 'Закрашенная грань — ' + nm + ', её стороны ' + w1 + ' ' + u + ' и ' + w2 + ' ' + u + '. Площадь: ' + w1 + ' × ' + w2 + ' = ' + ans + ' (' + u + '²).' };
  });

  /* ---------- развёртки ---------- */
  function transformCells(cells) {
    var rot = rand(0, 3), fl = Math.random() < 0.5, out = cells.map(function (c) { return [c[0], c[1]]; }), i;
    for (i = 0; i < rot; i++) out = out.map(function (c) { return [-c[1], c[0]]; });
    if (fl) out = out.map(function (c) { return [-c[0], c[1]]; });
    var mc = Math.min.apply(null, out.map(function (c) { return c[0]; })), mr = Math.min.apply(null, out.map(function (c) { return c[1]; }));
    return out.map(function (c) { return [c[0] - mc, c[1] - mr]; });
  }
  var LETTERS = ['А', 'Б', 'В', 'Г'];
  /* случайный набор из 6 клеток, соединённых сторонами */
  function randHexomino() {
    var cells = [[0, 0]], guard = 0;
    while (cells.length < 6 && guard++ < 200) {
      var base = pick(cells), d = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), c = [base[0] + d[0], base[1] + d[1]];
      if (!cells.some(function (x) { return x[0] === c[0] && x[1] === c[1]; })) cells.push(c);
    }
    var mc = Math.min.apply(null, cells.map(function (c) { return c[0]; })), mr = Math.min.apply(null, cells.map(function (c) { return c[1]; }));
    return cells.map(function (c) { return [c[0] - mc, c[1] - mr]; });
  }
  function cellKey(cells) { return cells.map(function (c) { return c[0] + ',' + c[1]; }).sort().join(';'); }

  /* пары противоположных клеток и понятное объяснение */
  function netOppExplain(cells, i, j, lab) {
    var ci = cells[i], cj = cells[j];
    var inRow = ci[1] === cj[1] && Math.abs(ci[0] - cj[0]) === 2, inCol = ci[0] === cj[0] && Math.abs(ci[1] - cj[1]) === 2;
    var mid = inRow ? [(ci[0] + cj[0]) / 2, ci[1]] : inCol ? [ci[0], (ci[1] + cj[1]) / 2] : null;
    var hasMid = mid && cells.some(function (x) { return x[0] === mid[0] && x[1] === mid[1]; });
    if (hasMid) return 'Квадраты ' + lab[i] + ' и ' + lab[j] + ' стоят в одном ряду через один квадрат. Когда ряд сворачивают в «пояс» куба, такие квадраты оказываются напротив друг друга.';
    return 'Квадраты ' + lab[i] + ' и ' + lab[j] + ' — это «крышка» и «дно» пояса из четырёх квадратов в ряду, они стоят по разные стороны от него и оказываются напротив друг друга.';
  }
  function netCandidates(cells) {           /* [i, j] — пары, для которых есть простое объяснение */
    var face = foldFaces(cells), out = [];
    if (!face) return out;
    var rowLen = 0;
    cells.forEach(function (c) {
      var n = cells.filter(function (x) { return x[1] === c[1]; }).length; rowLen = Math.max(rowLen, n);
      n = cells.filter(function (x) { return x[0] === c[0]; }).length; rowLen = Math.max(rowLen, n);
    });
    cells.forEach(function (ci, i) {
      var j = face.indexOf(face[i] ^ 1), cj = cells[j];
      var inRow = ci[1] === cj[1] && Math.abs(ci[0] - cj[0]) === 2, inCol = ci[0] === cj[0] && Math.abs(ci[1] - cj[1]) === 2;
      var mid = inRow ? [(ci[0] + cj[0]) / 2, ci[1]] : inCol ? [ci[0], (ci[1] + cj[1]) / 2] : null;
      var ok = mid && cells.some(function (x) { return x[0] === mid[0] && x[1] === mid[1]; });
      if (ok || (rowLen === 4 && !inRow && !inCol && !(ci[0] === cj[0] || ci[1] === cj[1]) === false)) out.push([i, j]);
      else if (rowLen === 4 && (ci[0] === cj[0] || ci[1] === cj[1]) && !ok) out.push([i, j]);
    });
    return out;
  }
  reg('voNetOpp', function (o) {
    o = o || {};
    var names = o.nets || ['cross', 'crossB', 'crossC', 'crossD', 'twoThree', 'twoThreeB', 'threeThree'];
    var cells, cand, guard = 0;
    do { cells = transformCells(NETS[pick(names)]); cand = netCandidates(cells); } while (!cand.length && guard++ < 30);
    var pr = pick(cand), i = pr[0], j = pr[1];
    var perm = shuffle([1, 2, 3, 4, 5, 6]);
    var cls = cells.map(function (c, k) { return k === i ? 'vo-nh' : ''; });
    var fig = R.voNetSVG(cells, { lab: perm, cls: cls, label: 'Развёртка куба, грани пронумерованы' });
    return { kind: 'num', html: 'На развёртке куба грани пронумерованы числами от 1 до 6. Развёртку сложили в куб. Какое число окажется на грани, противоположной закрашенной грани с числом ' + perm[i] + '?<br>' + fig,
      answer: perm[j], hint: 'Представь, что квадраты сгибаются в коробку. Какие квадраты окажутся друг напротив друга?',
      explain: netOppExplain(cells, i, j, perm) + ' Ответ: ' + perm[j] + '.' };
  });

  reg('voNetPick', function (o) {
    o = o || {};
    var good = transformCells(NETS[pick(Object.keys(NETS))]), opts = [{ cells: good, ok: true }], seen = {}, guard = 0;
    seen[cellKey(good)] = 1;
    while (opts.length < 4 && guard++ < 400) {
      var c = randHexomino();
      if (foldFaces(c)) continue;
      var k = cellKey(c);
      if (seen[k]) continue;
      seen[k] = 1; opts.push({ cells: c, ok: false });
    }
    opts = shuffle(opts);
    var options = opts.map(function (x, k) {
      return '<span class="vo-optl">' + LETTERS[k] + '</span>' + R.voNetSVG(x.cells, { s: 24, label: 'Фигура ' + LETTERS[k] });
    });
    var ans = opts.findIndex(function (x) { return x.ok; });
    return { kind: 'choice', html: 'Какая из фигур — развёртка куба? Каждая фигура составлена из шести равных квадратов.' + idc(opts.map(function (x) { return cellKey(x.cells); }).join('|')), options: options, answer: ans, wide: false,
      hint: 'Представь, что квадраты сгибают вдоль общих сторон. Не должно быть так, чтобы два квадрата легли друг на друга.',
      explain: 'Развёртка — фигура ' + LETTERS[ans] + ': её квадраты сложатся в куб, и каждая грань займёт своё место. У остальных фигур при складывании какие-то два квадрата лягут друг на друга, а одной грани не хватит.' };
  });

  reg('voNetBox', function (o) {
    o = o || {};
    var p = rand(3, 9), q = rand(2, 6), r = rand(2, 8), u = pick(['см', 'дм', 'м']);
    while (q === p) q = rand(2, 6); while (r === p || r === q) r = rand(2, 8);
    var t = pick(['count', 'pairs']), pr = shuffle([[p, q], [p, r], [q, r]]), tg = pr[0];
    var fig = R.voBoxNetSVG(p, q, r, { names: { left: q + '×' + r, front: p + '×' + r, right: q + '×' + r, back: p + '×' + r, top: p + '×' + q, bottom: p + '×' + q }, label: 'Развёртка параллелепипеда' });
    if (t === 'count') {
      return { kind: 'num', html: 'Прямоугольный параллелепипед имеет длину ' + nu(p, u) + ', ширину ' + nu(q, u) + ' и высоту ' + nu(r, u) + '. Развёртка составлена из шести прямоугольников (на рисунке — их размеры). Сколько среди них прямоугольников ' + tg[0] + ' × ' + tg[1] + ' ' + u + '?<br>' + fig,
        answer: 2, hint: 'Противоположные грани равны, поэтому одинаковых прямоугольников по два.',
        explain: 'Граней 6, они разбиваются на три пары равных: ' + p + ' × ' + q + ', ' + p + ' × ' + r + ' и ' + q + ' × ' + r + '. Прямоугольников ' + tg[0] + ' × ' + tg[1] + ' ровно 2.' };
    }
    return { kind: 'num', html: 'Развёртка прямоугольного параллелепипеда (размеры граней подписаны в ' + u + '). Сколько на ней <b>разных</b> по размеру прямоугольников?<br>' + fig,
      answer: 3, hint: 'Противоположные грани равны. Сколько получается пар?',
      explain: 'Шесть граней составляют три пары одинаковых: ' + p + ' × ' + q + ', ' + p + ' × ' + r + ' и ' + q + ' × ' + r + '. Разных прямоугольников 3.' };
  });

  /* ================= общие помощники объёма ================= */
  function volExplain(p, q, r, u) {
    var S = p * q, V = S * r;
    return stepsL([fmt(p) + ' × ' + fmt(q) + ' = ' + fmt(S) + ' — столько кубиков в одном слое',
      fmt(S) + ' × ' + fmt(r) + ' = ' + fmt(V) + ' — столько кубиков во всех слоях'], vu(V, u));
  }
  var STORIES = [
    { w: 'Коробка', u: 'см', r: [[6, 24], [4, 15], [3, 12]] },
    { w: 'Брусок', u: 'см', r: [[8, 30], [3, 10], [2, 8]] },
    { w: 'Пенал', u: 'см', r: [[15, 24], [4, 8], [3, 5]] },
    { w: 'Ящик', u: 'дм', r: [[4, 12], [3, 8], [2, 6]] },
    { w: 'Аквариум', u: 'дм', r: [[4, 10], [2, 5], [3, 6]] },
    { w: 'Шкаф', u: 'дм', r: [[8, 20], [4, 6], [18, 22]] },
    { w: 'Комната', u: 'м', r: [[4, 9], [3, 6], [2, 4]] },
    { w: 'Склад', u: 'м', r: [[8, 30], [5, 15], [3, 6]] },
    { w: 'Бассейн', u: 'м', r: [[10, 25], [5, 10], [1, 3]], nm: ['длина', 'ширина', 'глубина'] },
    { w: 'Сарай', u: 'м', r: [[3, 8], [2, 5], [2, 4]] }
  ];
  function storyDims(S, lvl) {
    var d = S.r.map(function (x) { return rand(x[0], x[1]); });
    if (lvl === 'easy') d = S.r.map(function (x) { return rand(x[0], Math.min(x[1], x[0] + 5)); });
    while (d[0] === d[1] || d[1] === d[2] || d[0] === d[2]) { d[rand(0, 2)] += pick([-1, 1, 2]); d = d.map(function (x) { return Math.max(2, x); }); }
    return d;
  }
  function dimPhrase(S, d) {
    var nm = S.nm || ['длина', 'ширина', 'высота'];
    return nm[0] + ' ' + nu(d[0], S.u) + ', ' + nm[1] + ' ' + nu(d[1], S.u) + ', ' + nm[2] + ' ' + nu(d[2], S.u);
  }

  /* ================= уроки 110–111: кубики, слои, объём ================= */
  reg('voCount', function (o) {
    o = o || {};
    var ask = o.ask || pick(['total', 'total', 'layer', 'row']);
    var a = rand(3, 6), b = rand(2, 4), c = rand(2, 4), ans, text, hint, why, fig;
    while (a === b) b = rand(2, 4);
    if (ask === 'row') {
      fig = R.voBoxSVG(a, b, c, { grid: true, rowHL: true, label: 'Параллелепипед из кубиков, красным выделен ряд' });
      text = 'Параллелепипед сложен из одинаковых кубиков. Красным закрашен ряд кубиков вдоль длины. Сколько кубиков в этом ряду?';
      ans = a; hint = 'Посчитай кубики в закрашенном ряду по рисунку: он идёт вдоль нижнего переднего ребра.';
      why = 'В ряду ' + a + ' ' + plur(a, 'кубик', 'кубика', 'кубиков') + ': столько же, сколько клеток вдоль длины.';
    } else if (ask === 'layer') {
      fig = R.voBoxSVG(a, b, c, { k: 1, label: 'Коробка, на дно которой уложен первый слой кубиков' });
      text = 'Коробка рассчитана на ' + c + ' ' + plur(c, 'слой', 'слоя', 'слоёв') + ' одинаковых кубиков. На дно уложили первый слой (зелёный на рисунке). Сколько кубиков в этом слое?';
      ans = a * b; hint = 'Сколько кубиков в одном ряду вдоль длины? Сколько таких рядов в слое?';
      why = 'В одном ряду ' + a + ' ' + plur(a, 'кубик', 'кубика', 'кубиков') + ', рядов ' + b + '. В слое ' + a + ' × ' + b + ' = ' + ans + ' ' + plur(ans, 'кубик', 'кубика', 'кубиков') + '.';
    } else {
      fig = R.voBoxSVG(a, b, c, { grid: true, label: 'Параллелепипед, сложенный из кубиков' });
      text = 'Параллелепипед сложен из одинаковых кубиков. На рисунке видны три его грани, на них нанесена сетка. Сколько всего кубиков в параллелепипеде?';
      ans = a * b * c; hint = 'Найди число кубиков в ряду, потом в слое, потом во всех слоях.';
      why = stepsL(['В ряду ' + a + ' ' + plur(a, 'кубик', 'кубика', 'кубиков'), 'В слое ' + a + ' × ' + b + ' = ' + (a * b), 'Слоёв ' + c + ': ' + (a * b) + ' × ' + c + ' = ' + ans], ans + ' ' + plur(ans, 'кубик', 'кубика', 'кубиков'));
    }
    return { kind: 'num', html: text + '<br>' + fig, answer: ans, hint: hint, explain: why };
  });

  reg('voLayers', function (o) {
    o = o || {};
    var u = pick(['см', 'дм']), a = rand(3, 6), b = rand(2, 4), c = rand(3, 5), k = rand(1, c - 1), ask = o.ask || pick(['placed', 'rest']);
    while (a === b) b = rand(2, 4);
    var fig = R.voBoxSVG(a, b, c, { k: k, lab: { a: nu(a, u), b: nu(b, u), c: nu(c, u) }, label: 'Коробка, наполовину заполненная слоями кубиков' });
    var S = a * b, cube = 'кубиками с ребром 1 ' + u;
    var text = 'Коробку длиной ' + nu(a, u) + ', шириной ' + nu(b, u) + ' и высотой ' + nu(c, u) + ' заполняют ' + cube + ', укладывая их слоями. Уже уложено ' + k + ' ' + plur(k, 'слой', 'слоя', 'слоёв') + ' (зелёные на рисунке). ';
    if (ask === 'placed') {
      return { kind: 'num', html: text + 'Сколько кубиков уложено?<br>' + fig, answer: S * k, hint: 'Сначала найди, сколько кубиков в одном слое.',
        explain: stepsL(['В слое ' + a + ' × ' + b + ' = ' + S + ' кубиков', 'Слоёв ' + k + ': ' + S + ' × ' + k + ' = ' + (S * k)], (S * k) + ' ' + plur(S * k, 'кубик', 'кубика', 'кубиков')) };
    }
    return { kind: 'num', html: text + 'Сколько ещё кубиков нужно, чтобы заполнить коробку доверху?<br>' + fig, answer: S * (c - k), hint: 'Сколько слоёв осталось уложить? Сколько кубиков в одном слое?',
      explain: stepsL(['Осталось слоёв: ' + c + ' − ' + k + ' = ' + (c - k), 'В слое ' + a + ' × ' + b + ' = ' + S + ' кубиков', 'Нужно ещё ' + S + ' × ' + (c - k) + ' = ' + (S * (c - k))], (S * (c - k)) + ' ' + plur(S * (c - k), 'кубик', 'кубика', 'кубиков')) };
  });

  reg('voNums', function (o) {
    o = o || {};
    var u = pick(['см', 'дм']), a = rand(3, 6), b = rand(2, 4), c = rand(2, 4);
    while (a === b) b = rand(2, 4);
    var fig = R.voBoxSVG(a, b, c, { grid: true, lab: { a: nu(a, u), b: nu(b, u), c: nu(c, u) }, label: 'Параллелепипед, размеры в ' + u });
    return { kind: 'nums', html: 'В ящик с такими размерами укладывают кубики с ребром 1 ' + u + '. Сколько кубиков поместится: в одном ряду вдоль длины, в одном слое и во всём ящике?<br>' + fig,
      fields: [{ label: 'в ряду' }, { label: 'в слое' }, { label: 'во всём ящике' }], answer: [a, a * b, a * b * c],
      hint: 'Ряд — по длине. Слой — несколько рядов по ширине. Весь ящик — несколько слоёв по высоте.',
      explain: stepsL(['В ряду ' + a + ' ' + plur(a, 'кубик', 'кубика', 'кубиков') + ' (столько, сколько сантиметров или дециметров в длине)', 'В слое ' + a + ' × ' + b + ' = ' + (a * b), 'Слоёв ' + c + ', во всём ящике ' + (a * b) + ' × ' + c + ' = ' + (a * b * c)]) };
  });

  var UP = {
    'мм³': ['зёрнышка мака', 'песчинки', 'крупинки соли'],
    'см³': ['ластика', 'спичечного коробка', 'игральной кости', 'ключа от квартиры'],
    'дм³': ['ведра', 'аквариума', 'чемодана', 'ящика с яблоками', 'школьного рюкзака'],
    'м³': ['классной комнаты', 'гаража', 'бассейна', 'товарного вагона', 'спортивного зала']
  };
  var UP_WHY = {
    'мм³': 'Предмет совсем крошечный: его удобно измерять кубиками с ребром 1 мм.',
    'см³': 'Предмет небольшой, умещается в руке: удобно измерять кубиками с ребром 1 см. Кубики в 1 мм слишком мелкие, а в 1 дм слишком крупные.',
    'дм³': 'Предмет средних размеров, как ящик или ведро: удобно измерять кубиками с ребром 1 дм. Кубиков в 1 см потребовалось бы слишком много, а кубик в 1 м велик.',
    'м³': 'Предмет большой, в него можно войти или въехать: удобно измерять кубами с ребром 1 м.'
  };
  reg('voUnitPick', function (o) {
    o = o || {};
    var units = ['мм³', 'см³', 'дм³', 'м³'], un = o.unit || pick(['см³', 'дм³', 'м³', 'см³', 'дм³', 'м³', 'мм³']), what = pick(UP[un]);
    return { kind: 'choice', html: 'Какой единицей удобнее всего измерять объём ' + what + '?', options: units, answer: units.indexOf(un), wide: false,
      hint: 'Представь себе, сколько кубиков с ребром 1 мм, 1 см, 1 дм или 1 м понадобится, чтобы заполнить предмет.',
      explain: 'Правильно: ' + un + '. ' + UP_WHY[un] };
  });

  reg('voSame', function (o) {
    o = o || {};
    var mode = o.mode || pick(['reshape', 'reshape', 'glue', 'cut']), u = pick(['см³', 'дм³']);
    if (mode === 'reshape') {
      var st = pick([
        function () { var V = rand(12, 99); return ['Из куска пластилина объёмом ' + vu(V, 'см') + ' сначала слепили кубик, потом шарик, а потом брусок. Каков объём пластилина в бруске (в см³)?', V, 'Пластилина не прибавили и не убавили, меняется только форма.', 'см³']; },
        function () { var V = pick([150, 200, 250, 300]); return ['Воду объёмом ' + vu(V, 'см') + ' из стакана перелили в узкую банку, а потом в широкую миску. Каков объём воды в миске (в см³)?', V, 'Воды не добавляли и не отливали, меняется только форма сосуда.', 'см³']; },
        function () { var V = rand(6, 14); return ['Воду объёмом ' + vu(V, 'дм') + ' из ведра перелили в таз, а потом в бак. Каков объём воды в баке (в дм³)?', V, 'Воды не добавляли и не отливали, меняется только форма сосуда.', 'дм³']; },
        function () { var V = rand(20, 90); return ['Кусок глины объёмом ' + vu(V, 'см') + ' раскатали в колбаску, а потом свернули в бублик. Каков объём бублика (в см³)?', V, 'Глины не прибавилось и не убавилось, поменялась только форма.', 'см³']; }
      ])();
      return { kind: 'num', html: st[0], answer: st[1], hint: 'Изменилась форма, а количество вещества — нет.', explain: st[2] + ' Объём остался прежним: ' + fmt(st[1]) + ' ' + st[3] + '.' };
    }
    if (mode === 'glue') {
      var A = rand(12, 90), B = rand(12, 90), un = 'см', u = 'см³', k = rand(3, 6), v = rand(6, 30);
      if (Math.random() < 0.5) return { kind: 'num', html: 'Два деревянных бруска объёмом ' + vu(A, un) + ' и ' + vu(B, un) + ' склеили в один. Каков объём получившегося бруска (в ' + u + ')?',
        answer: A + B, hint: 'Объём целого тела равен сумме объёмов его частей.', explain: fmt(A) + ' + ' + fmt(B) + ' = ' + fmt(A + B) + ' (' + u + ').' };
      return { kind: 'num', html: 'Из ' + k + ' одинаковых брусков объёмом ' + vu(v, un) + ' каждый сложили один большой брусок. Каков объём большого бруска (в ' + u + ')?',
        answer: k * v, hint: 'Объём большого бруска равен сумме объёмов всех маленьких.', explain: v + ' × ' + k + ' = ' + (k * v) + ' (' + u + ').' };
    }
    var kk = rand(2, 6), part = rand(6, 40), un2 = 'см'; u = 'см³';
    return { kind: 'num', html: 'Брусок объёмом ' + vu(kk * part, un2) + ' распилили на ' + kk + (kk < 5 ? ' равные части' : ' равных частей') + '. Каков объём каждой части (в ' + u + ')?',
      answer: part, hint: 'Объём всего бруска равен сумме объёмов частей. Части равны.', explain: fmt(kk * part) + ' : ' + kk + ' = ' + part + ' (' + u + '). Проверка: ' + part + ' × ' + kk + ' = ' + fmt(kk * part) + '.' };
  });

  reg('voCmp', function (o) {
    o = o || {};
    var u = pick(['см', 'дм']), x = rand(2, 5), y = rand(2, 5), z = rand(2, 5), A, B, type = pick(['eq', 'less', 'more', 'more', 'less']);
    A = [2 * x, y, z];
    if (type === 'eq') B = [x, 2 * y, z];
    else { B = A.slice(); var j = rand(0, 2); B[j] += (type === 'more' ? 1 : -1); }
    A = shuffle(A); B = shuffle(B);
    var VA = A[0] * A[1] * A[2], VB = B[0] * B[1] * B[2], mix = mixOptions(VA > VB ? 'в коробке А' : VA < VB ? 'в коробке Б' : 'поровну', ['в коробке А', 'в коробке Б', 'поровну']);
    return { kind: 'choice', html: 'Коробка А: длина ' + nu(A[0], u) + ', ширина ' + nu(A[1], u) + ', высота ' + nu(A[2], u) + '. Коробка Б: длина ' + nu(B[0], u) + ', ширина ' + nu(B[1], u) + ', высота ' + nu(B[2], u) + '. В какой коробке поместится больше кубиков с ребром 1 ' + u + '?',
      options: mix.options, answer: mix.answer, wide: false, hint: 'Найди объём каждой коробки и сравни числа.',
      explain: 'Коробка А: ' + A.join(' × ') + ' = ' + VA + ' (' + u + '³). Коробка Б: ' + B.join(' × ') + ' = ' + VB + ' (' + u + '³). ' + (VA === VB ? 'Объёмы равны, поэтому кубиков поровну.' : 'Больше кубиков ' + (VA > VB ? 'в коробке А' : 'в коробке Б') + ': ' + Math.max(VA, VB) + ' > ' + Math.min(VA, VB) + '.') };
  });

  var BASES = [
    { w: 'коробки', b: 'дна', u: 'см' }, { w: 'ящика', b: 'дна', u: 'дм' }, { w: 'аквариума', b: 'дна', u: 'дм' },
    { w: 'бассейна', b: 'дна', u: 'м' }, { w: 'комнаты', b: 'пола', u: 'м' }, { w: 'склада', b: 'пола', u: 'м' }
  ];
  var MIXU = [['м', 'дм', 10], ['дм', 'см', 10]];
  var DIM3 = [['длину', 'длина'], ['ширину', 'ширина'], ['высоту', 'высота']];
  var UNIT_WORD = { 'см': 'сантиметрах', 'дм': 'дециметрах', 'м': 'метрах' };
  reg('voVol', function (o) {
    o = o || {};
    var mode = o.mode || pick(['text', 'pic', 'missing', 'base']);
    var S, d, u, V, p, q, r;
    if (mode === 'text') {
      S = pick(STORIES); d = storyDims(S, o.lvl); u = S.u; V = d[0] * d[1] * d[2];
      return { kind: 'num', html: S.w + ' имеет форму прямоугольного параллелепипеда: ' + dimPhrase(S, d) + '. Найди объём (в ' + u + '³).', answer: V,
        hint: 'Объём равен длина × ширина × высота. Сначала удобно найти, сколько кубиков в одном слое.', explain: volExplain(d[0], d[1], d[2], u) };
    }
    if (mode === 'pic') {
      u = pick(['см', 'дм', 'м']); p = rand(4, o.hi || 15); q = rand(2, 9); r = rand(2, 9);
      while (q === p || r === p || q === r) { q = rand(2, 9); r = rand(2, 9); }
      return { kind: 'num', html: 'Найди объём прямоугольного параллелепипеда (в ' + u + '³).<br>' + boxNum(p, q, r, u), answer: p * q * r,
        hint: 'Длина — ребро спереди слева направо, ширина — ребро вглубь, высота — ребро вверх. Перемножь три числа.', explain: volExplain(p, q, r, u) };
    }
    if (mode === 'missing') {
      u = pick(['см', 'дм', 'м']); p = rand(3, 12); q = rand(2, 9); r = rand(2, 9);
      while (q === p || r === p || q === r) { q = rand(2, 9); r = rand(2, 9); }
      var dd = [p, q, r], k = rand(0, 2), known = [0, 1, 2].filter(function (x) { return x !== k; }), V2 = p * q * r, S2 = dd[known[0]] * dd[known[1]];
      var withPic = o.pic != null ? o.pic : Math.random() < 0.5;
      var why = stepsL([fmt(dd[known[0]]) + ' × ' + fmt(dd[known[1]]) + ' = ' + fmt(S2) + ' — произведение двух известных измерений', fmt(V2) + ' : ' + fmt(S2) + ' = ' + dd[k]], dd[k] + ' ' + u) + ' Проверка: ' + fmt(S2) + ' × ' + dd[k] + ' = ' + fmt(V2) + '.';
      var hnt = 'Объём — это произведение трёх измерений. Если известно произведение и два множителя, как найти третий?';
      if (withPic) {
        var kk = 5 / Math.max(p, q, r, 5), lb = { a: nu(p, u), b: nu(q, u), c: nu(r, u) };
        lb[['a', 'b', 'c'][k]] = '?';
        return { kind: 'num', html: 'Объём прямоугольного параллелепипеда равен ' + vu(V2, u) + '. Найди неизвестное измерение (в ' + u + ').<br>' + R.voBoxSVG(Math.max(p * kk, 0.8), Math.max(q * kk, 0.8), Math.max(r * kk, 0.8), { grid: false, lab: lb, label: 'Параллелепипед с неизвестным ребром' }),
          answer: dd[k], hint: hnt, explain: why };
      }
      var parts = known.map(function (x) { return DIM3[x][1] + ' ' + nu(dd[x], u); });
      return { kind: 'num', html: 'Объём прямоугольного параллелепипеда равен ' + vu(V2, u) + ', ' + parts[0] + ', ' + parts[1] + '. Найди ' + DIM3[k][0] + ' (в ' + u + ').', answer: dd[k], hint: hnt, explain: why };
    }
    if (mode === 'base') {
      var B = pick(BASES), h = rand(2, B.u === 'м' ? 4 : 9), s = rand(4, B.u === 'м' ? 40 : 60), sub = o.sub || pick(['vol', 'vol', 'height']);
      u = B.u;
      if (sub === 'vol') {
        return { kind: 'num', html: 'Площадь ' + B.b + ' ' + B.w + ' равна ' + su(s, u) + ', высота — ' + nu(h, u) + '. Найди объём (в ' + u + '³).', answer: s * h,
          hint: 'Площадь основания показывает, сколько кубиков лежит в одном слое. Сколько таких слоёв?',
          explain: stepsL(['В одном слое ' + s + ' кубиков (по числу единиц площади)', 'Слоёв ' + h + ': ' + s + ' × ' + h + ' = ' + (s * h)], vu(s * h, u)) };
      }
      return { kind: 'num', html: 'Объём ' + B.w + ' равен ' + vu(s * h, u) + ', площадь ' + B.b + ' — ' + su(s, u) + '. Найди высоту (в ' + u + ').', answer: h,
        hint: 'Объём — это число кубиков в слое, умноженное на число слоёв. Раздели объём на площадь основания.',
        explain: fmt(s * h) + ' : ' + s + ' = ' + h + ' (' + u + '). Проверка: ' + s + ' × ' + h + ' = ' + fmt(s * h) + '.' };
    }
    /* mixed: размеры в двух мерах */
    var M = pick(MIXU), big = rand(2, 6), q1 = rand(3, 9), r1 = rand(3, 9);
    while (q1 === r1) r1 = rand(3, 9);
    var bigS = big * M[2], Vm = bigS * q1 * r1;
    return { kind: 'num', html: 'Длина ящика ' + nu(big, M[0]) + ', ширина ' + nu(q1, M[1]) + ', высота ' + nu(r1, M[1]) + '. Найди объём ящика (в ' + M[1] + '³).', answer: Vm,
      hint: 'Сначала выразите все размеры в одной мере — в более мелкой: ' + M[0] + ' в ' + M[1] + '.',
      explain: stepsL([big + ' ' + M[0] + ' = ' + bigS + ' ' + M[1], bigS + ' × ' + q1 + ' = ' + fmt(bigS * q1), fmt(bigS * q1) + ' × ' + r1 + ' = ' + fmt(Vm)], vu(Vm, M[1])) };
  });

  reg('voForm', function (o) {
    o = o || {};
    var mode = o.mode || pick(['expr', 'unit', 'which', 'cube']), u = pick(['см', 'дм', 'м']), p = rand(3, 9), q = rand(2, 7), r = rand(2, 6), mix;
    while (q === p) q = rand(2, 7);
    while (r === p || r === q) r = rand(2, 6);
    if (mode === 'expr') {
      var right = p + ' × ' + q + ' × ' + r;
      mix = mixOptions(right, [p + ' + ' + q + ' + ' + r, '(' + p + ' + ' + q + ') × ' + r, p + ' × ' + q + ' + ' + r]);
      return { kind: 'choice', html: 'У коробки длина ' + nu(p, u) + ', ширина ' + nu(q, u) + ', высота ' + nu(r, u) + '. Какое выражение даёт её объём?', options: mix.options, answer: mix.answer, wide: false,
        hint: 'Объём прямоугольного параллелепипеда — произведение трёх измерений.', explain: 'Объём равен длина × ширина × высота: ' + right + ' = ' + (p * q * r) + ' (' + u + '³).' };
    }
    if (mode === 'unit') {
      mix = mixOptions(u + '³', [u, u + '²', 'кг']);
      return { kind: 'choice', html: 'Длина, ширина и высота ящика измерены в ' + UNIT_WORD[u] + '. В каких единицах получится его объём?', options: mix.options, answer: mix.answer, wide: false,
        hint: 'Объём измеряют кубиками. Какой кубик подходит к размерам в ' + UNIT_WORD[u] + '?', explain: 'Объём — это число кубиков с ребром 1 ' + u + ', то есть число кубических единиц: ' + u + '³.' };
    }
    if (mode === 'which') {
      mix = mixOptions('объём коробки', ['площадь дна коробки', 'периметр дна коробки', 'сумму длин всех рёбер']);
      return { kind: 'choice', html: 'Длину, ширину и высоту коробки перемножили. Что нашли?', options: mix.options, answer: mix.answer, wide: false,
        hint: 'Вспомни, как считают кубики в слое и слои в коробке.', explain: 'Длина × ширина — число кубиков в слое (площадь дна). Умножив ещё на высоту, получаем число кубиков во всей коробке — объём.' };
    }
    var a = rand(2, 9);
    mix = mixOptions(a + ' × ' + a + ' × ' + a, [a + ' × 3', a + ' × ' + a, a + ' + ' + a + ' + ' + a]);
    return { kind: 'choice', html: 'Ребро куба равно ' + nu(a, u) + '. Какое выражение даёт объём этого куба?', options: mix.options, answer: mix.answer, wide: false,
      hint: 'У куба три одинаковых измерения: длина, ширина и высота равны ребру.', explain: 'Длина, ширина и высота куба равны ' + a + ' ' + u + ', поэтому объём ' + a + ' × ' + a + ' × ' + a + ' = ' + (a * a * a) + ' (' + u + '³).' };
  });

  /* ---------- куб (урок 113) ---------- */
  reg('voCube', function (o) {
    o = o || {};
    var mode = o.mode || pick(['vol', 'vol', 'edge', 'cubes', 'face', 'pic']), u = pick(['см', 'дм', 'м']), a = rand(2, o.max || 9);
    if (mode === 'vol') {
      return { kind: 'num', html: 'Ребро куба равно ' + nu(a, u) + '. Найди объём куба (в ' + u + '³).', answer: a * a * a,
        hint: 'У куба длина, ширина и высота равны ребру: ребро надо взять сомножителем три раза.',
        explain: a + ' × ' + a + ' × ' + a + ' = ' + (a * a) + ' × ' + a + ' = ' + fmt(a * a * a) + ' (' + u + '³).' };
    }
    if (mode === 'edge') {
      var lst = [], i;
      for (i = 2; i <= a; i++) lst.push(i + ' × ' + i + ' × ' + i + ' = ' + (i * i * i));
      return { kind: 'num', html: 'Объём куба равен ' + vu(a * a * a, u) + '. Найди ребро куба (в ' + u + ').', answer: a,
        hint: 'Подбери число, которое при умножении три раза само на себя даёт этот объём. Пробуй 2, 3, 4…',
        explain: 'Подбираем: ' + lst.join('; ') + '. Подходит ' + a + '. Ребро куба ' + a + ' ' + u + '.' };
    }
    if (mode === 'cubes') {
      var k = rand(2, 5);
      return { kind: 'num', html: 'Из маленьких кубиков с ребром 1 ' + u + ' сложили большой куб с ребром ' + nu(k, u) + ' (на рисунке видны три его грани). Сколько маленьких кубиков понадобилось?<br>' + R.voBoxSVG(k, k, k, { grid: true, maxS: 46, label: 'Куб, сложенный из кубиков' }), answer: k * k * k,
        hint: 'Посчитай кубики в ряду, потом в слое, потом во всех слоях. Слоёв столько же, сколько кубиков в ряду.',
        explain: stepsL(['В ряду ' + k + ', в слое ' + k + ' × ' + k + ' = ' + (k * k), 'Слоёв ' + k + ': ' + (k * k) + ' × ' + k + ' = ' + (k * k * k)], (k * k * k) + ' ' + plur(k * k * k, 'кубик', 'кубика', 'кубиков')) };
    }
    if (mode === 'face') {
      return { kind: 'nums', html: 'Ребро куба равно ' + nu(a, u) + '. Найди площадь одной грани куба и объём куба.',
        fields: [{ label: 'площадь грани, ' + u + '²' }, { label: 'объём, ' + u + '³' }], answer: [a * a, a * a * a],
        hint: 'Грань куба — квадрат со стороной, равной ребру. Объём — ребро, взятое три раза сомножителем.',
        explain: stepsL(['Площадь грани: ' + a + ' × ' + a + ' = ' + (a * a) + ' (' + u + '²)', 'Объём: ' + (a * a) + ' × ' + a + ' = ' + fmt(a * a * a) + ' (' + u + '³)']) };
    }
    return { kind: 'num', html: 'Найди объём куба (в ' + u + '³).<br>' + cubeFig({ lab: { a: nu(a, u) }, label: 'Куб с подписанным ребром' }), answer: a * a * a,
      hint: 'Все рёбра куба равны. Умножь ребро само на себя три раза.', explain: a + ' × ' + a + ' × ' + a + ' = ' + (a * a) + ' × ' + a + ' = ' + fmt(a * a * a) + ' (' + u + '³).' };
  });

  reg('voCmpV', function (o) {
    o = o || {};
    var u = pick(['см', 'дм']), a = rand(2, 6), V = a * a * a, B, type = pick(['eq', 'less', 'more', 'more', 'less']);
    var combos = [];
    for (var x = 2; x <= 20; x++) for (var y = x; y <= 20; y++) if (V % (x * y) === 0) { var z = V / (x * y); if (z >= y && z <= 20 && !(x === y && y === z)) combos.push([x, y, z]); }
    if (type === 'eq' && combos.length) B = shuffle(pick(combos));
    else { B = [rand(2, 6), rand(2, 6), rand(2, 6)]; if (B[0] * B[1] * B[2] === V) B[0] += 1; }
    var VB = B[0] * B[1] * B[2], idx = V < VB ? 0 : V === VB ? 1 : 2, ops = ['<', '=', '>'];
    return { kind: 'choice', html: 'Объём куба с ребром ' + nu(a, u) + ' сравнивают с объёмом прямоугольного параллелепипеда: длина ' + nu(B[0], u) + ', ширина ' + nu(B[1], u) + ', высота ' + nu(B[2], u) + '. Какой знак надо поставить: объём куба … объём параллелепипеда?',
      options: ops, answer: idx, wide: false, hint: 'Найди оба объёма и сравни числа.',
      explain: 'Куб: ' + a + ' × ' + a + ' × ' + a + ' = ' + V + ' (' + u + '³). Параллелепипед: ' + B.join(' × ') + ' = ' + VB + ' (' + u + '³). Сравниваем: ' + V + ' ' + ops[idx] + ' ' + VB + '.' };
  });

  reg('voScale', function (o) {
    o = o || {};
    var mode = o.mode || pick(['cubeUp', 'cubeDown', 'boxAll', 'boxOne', 'boxTwo']), k = rand(2, o.kmax || 4), kw = plur(k, 'раз', 'раза', 'раз'), p = rand(2, 4), q = rand(2, 4), r = rand(2, 4);
    var ans, text, hint, why;
    if (mode === 'cubeUp') {
      var e = rand(1, 3);
      ans = k * k * k; text = 'Ребро куба увеличили в ' + k + ' ' + kw + '. Во сколько раз увеличился его объём?';
      hint = 'Возьми для примера куб с небольшим ребром и посчитай объём до и после.';
      why = 'Пример: ребро ' + e + ' см, объём ' + e + ' × ' + e + ' × ' + e + ' = ' + (e * e * e) + ' см³. После увеличения ребро ' + (e * k) + ' см, объём ' + (e * k) + ' × ' + (e * k) + ' × ' + (e * k) + ' = ' + fmt(e * e * e * ans) + ' см³. ' + fmt(e * e * e * ans) + ' : ' + (e * e * e) + ' = ' + ans + '. Каждое из трёх измерений выросло в ' + k + ' ' + kw + ', поэтому ' + k + ' × ' + k + ' × ' + k + ' = ' + ans + '.';
    } else if (mode === 'cubeDown') {
      var e2 = rand(1, 3);
      ans = k * k * k; text = 'Ребро куба уменьшили в ' + k + ' ' + kw + '. Во сколько раз уменьшился его объём?';
      hint = 'Возьми для примера куб, ребро которого делится на ' + k + ', и сравни объёмы.';
      why = 'Пример: было ребро ' + (e2 * k) + ' см, объём ' + fmt(Math.pow(e2 * k, 3)) + ' см³. Стало ребро ' + e2 + ' см, объём ' + (e2 * e2 * e2) + ' см³. ' + fmt(Math.pow(e2 * k, 3)) + ' : ' + (e2 * e2 * e2) + ' = ' + ans + '. Все три измерения уменьшились в ' + k + ' ' + kw + ', объём уменьшился в ' + k + ' × ' + k + ' × ' + k + ' = ' + ans + ' ' + plur(ans, 'раз', 'раза', 'раз') + '.';
    } else {
      var cnt = mode === 'boxAll' ? 3 : mode === 'boxTwo' ? 2 : 1;
      ans = Math.pow(k, cnt);
      text = (cnt === 3 ? 'Длину, ширину и высоту бруска увеличили каждую в ' + k + ' ' + kw + '.' : cnt === 2 ? 'Длину и ширину бруска увеличили каждую в ' + k + ' ' + kw + ', высоту не меняли.' : 'Длину бруска увеличили в ' + k + ' ' + kw + ', ширину и высоту не меняли.') + ' Во сколько раз увеличился его объём?';
      var np = p * k, nq = q * (cnt >= 2 ? k : 1), nr = r * (cnt >= 3 ? k : 1), V1 = p * q * r, V2 = np * nq * nr;
      hint = 'Возьми для примера брусок с небольшими размерами и посчитай объём до и после.';
      why = 'Пример: брусок ' + p + ' × ' + q + ' × ' + r + ' см, объём ' + V1 + ' см³. После увеличения: ' + np + ' × ' + nq + ' × ' + nr + ' см, объём ' + fmt(V2) + ' см³. ' + fmt(V2) + ' : ' + V1 + ' = ' + ans + '. ' +
        (cnt === 3 ? 'Каждое из трёх измерений выросло в ' + k + ' ' + kw + ': ' + k + ' × ' + k + ' × ' + k + ' = ' + ans + '.' : cnt === 2 ? 'Два измерения выросли в ' + k + ' ' + kw + ': ' + k + ' × ' + k + ' = ' + ans + '.' : 'Объём вырос во столько же раз, во сколько выросло одно измерение.');
    }
    return { kind: 'num', html: text, answer: ans, hint: hint, explain: why };
  });


  /* ================= кубические меры (уроки 115–116) ================= */
  var CU = [['м³', 'дм³', 1000], ['дм³', 'см³', 1000], ['см³', 'мм³', 1000], ['м³', 'см³', 1000000]];
  var CU_NAME = { 'м³': 'кубических метрах', 'дм³': 'кубических дециметрах', 'см³': 'кубических сантиметрах', 'мм³': 'кубических миллиметрах' };
  function cuFact(pr) {
    if (pr[0] === 'м³' && pr[1] === 'см³') return '1 м³ = 1 000 дм³, а 1 дм³ = 1 000 см³, поэтому 1 м³ = 1 000 × 1 000 = 1 000 000 см³';
    return '1 ' + pr[0] + ' = ' + fmt(pr[2]) + ' ' + pr[1];
  }
  var CU_R = [5, 8, 12, 40, 60, 85, 120, 250, 307, 400, 505, 600, 750, 800, 999];
  reg('voConv', function (o) {
    o = o || {};
    var pi = o.pairs ? pick(o.pairs) : pick([0, 1, 2, 0, 1, 2, 3]), pr = CU[pi], f = pr[2], mode = o.mode || pick(['down', 'up', 'down', 'up', 'comp', 'compUp']);
    if (pi === 3 && (mode === 'comp' || mode === 'compUp')) mode = pick(['down', 'up']);
    var k = pi === 3 ? rand(2, 9) : pick([2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 25, 40, 60]);
    if (mode === 'down') {
      return { kind: 'num', html: 'Выразите в ' + CU_NAME[pr[1]] + ': ' + expr(k + ' ' + pr[0] + ' = □ ' + pr[1]), answer: k * f,
        hint: cuFact(pr) + '. Крупную меру заменяем мелкой — умножаем.',
        explain: cuFact(pr) + '. Значит, ' + k + ' ' + pr[0] + ' = ' + k + ' × ' + fmt(f) + ' ' + pr[1] + ' = ' + fmt(k * f) + ' ' + pr[1] + '.' };
    }
    if (mode === 'up') {
      return { kind: 'num', html: 'Выразите в ' + CU_NAME[pr[0]] + ': ' + expr(fmt(k * f) + ' ' + pr[1] + ' = □ ' + pr[0]), answer: k,
        hint: cuFact(pr) + '. Мелкую меру заменяем крупной — делим.',
        explain: cuFact(pr) + '. Значит, ' + fmt(k * f) + ' ' + pr[1] + ' = ' + fmt(k * f) + ' : ' + fmt(f) + ' ' + pr[0] + ' = ' + k + ' ' + pr[0] + '.' };
    }
    var big = rand(2, 9), r = pick(CU_R), tot = big * f + r;
    if (mode === 'comp') {
      var zer = r < 100 ? ' В тысячах не хватает сотен и десятков: ' + (r < 10 ? 'ставим два нуля' : 'ставим нуль') + ' — ' + fmt(tot) + ', а не ' + big + String(r) + '.' : '';
      return { kind: 'num', html: 'Выразите в ' + CU_NAME[pr[1]] + ': ' + expr(big + ' ' + pr[0] + ' ' + r + ' ' + pr[1] + ' = □ ' + pr[1]), answer: tot,
        hint: cuFact(pr) + '. Сначала переведи крупные меры в мелкие, потом прибавь остаток.',
        explain: cuFact(pr) + '. ' + big + ' ' + pr[0] + ' = ' + fmt(big * f) + ' ' + pr[1] + ', и ещё ' + r + ' ' + pr[1] + ': ' + fmt(big * f) + ' + ' + r + ' = ' + fmt(tot) + ' ' + pr[1] + '.' + zer };
    }
    return { kind: 'nums', html: 'Выразите в двух мерах: ' + expr(fmt(tot) + ' ' + pr[1] + ' = □ ' + pr[0] + ' □ ' + pr[1]), fields: [{ label: pr[0] }, { label: pr[1] }], answer: [big, r],
      hint: cuFact(pr) + '. Раздели число на ' + fmt(f) + ': частное — крупные меры, остаток — мелкие.',
      explain: cuFact(pr) + '. ' + fmt(tot) + ' : ' + fmt(f) + ' = ' + big + ' (ост. ' + r + '). Значит, ' + fmt(tot) + ' ' + pr[1] + ' = ' + big + ' ' + pr[0] + ' ' + r + ' ' + pr[1] + '.' };
  });

  var LIN = [['м', 'дм', 10], ['дм', 'см', 10], ['см', 'мм', 10], ['м', 'см', 100]];
  reg('voWhy', function (o) {
    o = o || {};
    var L2 = o.pair != null ? LIN[o.pair] : pick([LIN[0], LIN[0], LIN[1], LIN[1], LIN[2], LIN[3]]), f = L2[2], b = L2[0], s = L2[1];
    return { kind: 'nums', html: 'Куб с ребром 1 ' + b + ' разрезали на кубики с ребром 1 ' + s + '. Сколько таких кубиков помещается вдоль ребра (в одном ряду), в одном слое и во всём большом кубе?',
      fields: [{ label: 'в ряду' }, { label: 'в слое' }, { label: 'во всём кубе' }], answer: [f, f * f, f * f * f],
      hint: '1 ' + b + ' = ' + f + ' ' + s + '. Столько кубиков в ряду. Слой состоит из нескольких таких рядов, а куб — из нескольких слоёв.',
      explain: stepsL(['1 ' + b + ' = ' + f + ' ' + s + ', поэтому в ряду ' + f + ' кубиков', 'В слое ' + f + ' × ' + f + ' = ' + fmt(f * f), 'Слоёв ' + f + ': ' + fmt(f * f) + ' × ' + f + ' = ' + fmt(f * f * f)]) + ' Значит, 1 ' + b + '³ = ' + fmt(f * f * f) + ' ' + s + '³.' };
  });

  var MEAS = [
    ['длину', ['мм', 'см', 'дм', 'м', 'км']], ['площадь', ['мм²', 'см²', 'дм²', 'м²', 'км²', 'а', 'га']],
    ['объём', ['мм³', 'см³', 'дм³', 'м³']], ['массу', ['г', 'кг', 'ц', 'т']]
  ];
  var MEAS_WHY = { 'длину': 'линейная мера: ею измеряют длину', 'площадь': 'квадратная мера: ею измеряют площадь', 'объём': 'кубическая мера: ею измеряют объём', 'массу': 'мера массы' };
  reg('voMeas', function (o) {
    o = o || {};
    var kinds = o.kinds || ['длину', 'площадь', 'объём', 'массу'], kd = pick(MEAS.filter(function (m) { return kinds.indexOf(m[0]) >= 0; })), un = pick(kd[1]);
    var all = ['длину', 'площадь', 'объём', 'массу'];
    return { kind: 'choice', html: 'Какую величину измеряют единицей «' + un + '»?', options: all, answer: all.indexOf(kd[0]), wide: false,
      hint: 'Вспомни: у линейных мер нет степени, у квадратных мер «²», у кубических — «³».',
      explain: 'Единица «' + un + '» — ' + MEAS_WHY[kd[0]] + '.' };
  });

  var LAD_T = ['1 м³ = 1 000 дм³', '1 дм³ = 1 000 см³', '1 см³ = 1 000 мм³', '1 м³ = 1 000 000 см³'];
  var LAD_F = ['1 м³ = 100 дм³', '1 дм³ = 100 см³', '1 см³ = 100 мм³', '1 м³ = 10 дм³', '1 м³ = 1 000 см³', '1 дм³ = 10 см³', '1 м³ = 100 000 см³', '1 м³ = 1 000 дм²', '1 дм³ = 1 000 см²'];
  reg('voLadder', function (o) {
    o = o || {};
    var right = pick(LAD_T), mix = mixOptions(right, shuffle(LAD_F).slice(0, 3));
    return { kind: 'choice', html: 'Какое равенство верно?' + idc(mix.options.join('|')), options: mix.options, answer: mix.answer, wide: false,
      hint: 'Каждая следующая кубическая мера мельче предыдущей в 1 000 раз.',
      explain: 'Верно: ' + right + '. Кубическая мера мельче соседней в 1 000 раз (10 × 10 × 10), а не в 10 и не в 100 раз.' };
  });

  /* ---------- меры площади (повторение для уроков 114 и 119) ---------- */
  var AU2 = [['м²', 'дм²', 100], ['дм²', 'см²', 100], ['см²', 'мм²', 100], ['м²', 'см²', 10000], ['а', 'м²', 100], ['га', 'а', 100], ['га', 'м²', 10000]];
  var AU_NAME = { 'м²': 'квадратных метрах', 'дм²': 'квадратных дециметрах', 'см²': 'квадратных сантиметрах', 'мм²': 'квадратных миллиметрах', 'а': 'арах', 'га': 'гектарах' };
  var AU_R = [5, 8, 12, 20, 40, 50, 60, 75, 80, 90];
  function auFact(pr) {
    if (pr[0] === 'м²' && pr[1] === 'см²') return '1 м² = 100 дм², а 1 дм² = 100 см², поэтому 1 м² = 100 × 100 = 10 000 см²';
    return '1 ' + pr[0] + ' = ' + fmt(pr[2]) + ' ' + pr[1];
  }
  reg('voAreaConv', function (o) {
    o = o || {};
    var pr = o.pairs ? AU2[pick(o.pairs)] : pick(AU2), f = pr[2], mode = o.mode || pick(['down', 'up', 'comp']);
    var k = pr[2] >= 10000 ? rand(2, 9) : pick([2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 25, 40]);
    if (mode === 'down') {
      return { kind: 'num', html: 'Выразите в ' + AU_NAME[pr[1]] + ': ' + expr(k + ' ' + pr[0] + ' = □ ' + pr[1]), answer: k * f,
        hint: auFact(pr) + '. Крупную меру заменяем мелкой — умножаем.', explain: auFact(pr) + '. Значит, ' + k + ' ' + pr[0] + ' = ' + k + ' × ' + fmt(f) + ' ' + pr[1] + ' = ' + fmt(k * f) + ' ' + pr[1] + '.' };
    }
    if (mode === 'up') {
      return { kind: 'num', html: 'Выразите в ' + AU_NAME[pr[0]] + ': ' + expr(fmt(k * f) + ' ' + pr[1] + ' = □ ' + pr[0]), answer: k,
        hint: auFact(pr) + '. Мелкую меру заменяем крупной — делим.', explain: auFact(pr) + '. Значит, ' + fmt(k * f) + ' ' + pr[1] + ' = ' + fmt(k * f) + ' : ' + fmt(f) + ' ' + pr[0] + ' = ' + k + ' ' + pr[0] + '.' };
    }
    var big = rand(2, 9), r = f >= 10000 ? pick([500, 1200, 2500, 3000, 4000, 5500, 7500]) : pick(AU_R.filter(function (x) { return x < f; })), tot = big * f + r;
    return { kind: 'num', html: 'Выразите в ' + AU_NAME[pr[1]] + ': ' + expr(big + ' ' + pr[0] + ' ' + fmt(r) + ' ' + pr[1] + ' = □ ' + pr[1]), answer: tot,
      hint: auFact(pr) + '. Сначала переведи крупные меры в мелкие, потом прибавь остаток.',
      explain: auFact(pr) + '. ' + big + ' ' + pr[0] + ' = ' + fmt(big * f) + ' ' + pr[1] + ', и ещё ' + fmt(r) + ' ' + pr[1] + ': ' + fmt(big * f) + ' + ' + fmt(r) + ' = ' + fmt(tot) + ' ' + pr[1] + '.' };
  });

  /* ---------- вода: литры, килограммы, тонны ---------- */
  var VESS = [['Аквариум', 'этот аквариум'], ['Бак', 'этот бак'], ['Ёмкость для воды', 'эту ёмкость']];
  reg('voWater', function (o) {
    o = o || {};
    var mode = o.mode || pick(['lit', 'kg', 'm3t', 'm3l', 'revm', 'cm3g']), p, q, r, V, ves = pick(VESS), w = ves[0];
    if (mode === 'lit' || mode === 'kg') {
      p = rand(3, 10); q = rand(2, 8); r = rand(2, 6); V = p * q * r;
      var dimTxt = w + ' имеет форму прямоугольного параллелепипеда: длина ' + nu(p, 'дм') + ', ширина ' + nu(q, 'дм') + ', высота ' + nu(r, 'дм') + '. ';
      if (mode === 'lit') return { kind: 'num', html: dimTxt + 'Сколько литров воды вмещает ' + ves[1] + ', если налить воду до краёв? (1 л — это объём в 1 дм³.)', answer: V,
        hint: 'Найди объём в кубических дециметрах: столько же будет литров.', explain: stepsL([p + ' × ' + q + ' × ' + r + ' = ' + V + ' (дм³)', '1 л = 1 дм³, поэтому в ёмкости ' + V + ' л'], V + ' л') };
      return { kind: 'num', html: dimTxt + 'Сколько килограммов воды вмещает ' + ves[1] + ', если налить воду до краёв? (1 дм³ воды весит 1 кг.)', answer: V,
        hint: 'Найди объём в кубических дециметрах: столько же будет килограммов.', explain: stepsL([p + ' × ' + q + ' × ' + r + ' = ' + V + ' (дм³)', '1 дм³ воды весит 1 кг, поэтому масса воды ' + V + ' кг'], V + ' кг') };
    }
    if (mode === 'm3t') {
      p = rand(8, 30); q = rand(4, 12); r = rand(1, 3); V = p * q * r;
      return { kind: 'num', html: 'Бассейн имеет форму прямоугольного параллелепипеда: длина ' + nu(p, 'м') + ', ширина ' + nu(q, 'м') + ', глубина ' + nu(r, 'м') + '. Сколько тонн воды нужно, чтобы наполнить его доверху? (1 м³ воды весит 1 т.)', answer: V,
        hint: 'Найди объём бассейна в кубических метрах: столько же будет тонн.', explain: stepsL([p + ' × ' + q + ' × ' + r + ' = ' + fmt(V) + ' (м³)', '1 м³ воды весит 1 т, поэтому воды нужно ' + fmt(V) + ' т'], fmt(V) + ' т') };
    }
    if (mode === 'm3l') {
      p = rand(3, 12); q = rand(2, 8); r = rand(1, 3); V = p * q * r;
      var contP = pick([['Резервуар', 'этот резервуар'], ['Бассейн', 'этот бассейн'], ['Цистерна', 'эту цистерну']]), cont = contP[0];
      return { kind: 'num', html: cont + ' имеет форму прямоугольного параллелепипеда: длина ' + nu(p, 'м') + ', ширина ' + nu(q, 'м') + ', высота ' + nu(r, 'м') + '. Сколько литров воды вмещает ' + contP[1] + '? (В 1 м³ помещается 1 000 л.)', answer: V * 1000,
        hint: 'Найди объём в кубических метрах и переведи в литры: 1 м³ = 1 000 л.', explain: stepsL([p + ' × ' + q + ' × ' + r + ' = ' + V + ' (м³)', V + ' × 1 000 = ' + fmt(V * 1000) + ' (л)'], fmt(V * 1000) + ' л') };
    }
    if (mode === 'revm') {
      V = rand(2, 60);
      return { kind: 'num', html: 'В цистерну налили ' + fmt(V * 1000) + ' л воды. Сколько кубических метров воды в цистерне? (1 м³ = 1 000 л.)', answer: V,
        hint: 'Литров в 1 000 раз больше, чем кубических метров. Значит, число литров нужно разделить на 1 000.', explain: fmt(V * 1000) + ' : 1 000 = ' + V + ' (м³). Проверка: ' + V + ' × 1 000 = ' + fmt(V * 1000) + '.' };
    }
    p = rand(3, 9); q = rand(2, 6); r = rand(2, 5); V = p * q * r;
    return { kind: 'num', html: 'Стеклянный кубик-ёмкость имеет форму прямоугольного параллелепипеда: длина ' + nu(p, 'см') + ', ширина ' + nu(q, 'см') + ', высота ' + nu(r, 'см') + '. Сколько граммов воды в нём поместится, если налить воду до краёв? (1 см³ воды весит 1 г.)', answer: V,
      hint: 'Найди объём в кубических сантиметрах: столько же будет граммов.', explain: stepsL([p + ' × ' + q + ' × ' + r + ' = ' + V + ' (см³)', '1 см³ воды весит 1 г, поэтому воды ' + V + ' г'], V + ' г') };
  });

  /* ---------- колодец (урок 116) ---------- */
  function mcm(cm) {
    var m = Math.floor(cm / 100), c = cm % 100, parts = [];
    if (m) parts.push(nu(m, 'м'));
    if (c || !m) parts.push(nu(c, 'см'));
    return parts.join(' ');
  }
  reg('pVoWell', function (o) {
    o = o || {};
    var a, b, h3, g = 0, ok = false;
    while (!ok && g++ < 400) {
      h3 = pick([60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 180, 200]);
      a = pick([100, 110, 120, 125, 130, 140, 150, 160, 180, 200]); b = pick([80, 90, 100, 110, 120, 130, 150]);
      if (a === b) continue;
      ok = (a * b * 2 * h3) % 10000 === 0;
    }
    var H = 3 * h3, wd = 2 * h3, V = a * b * wd, L = V / 1000, N = L / 10;
    var cond = 'Глубина колодца ' + mcm(H) + '. Дно колодца — прямоугольник со сторонами ' + mcm(a) + ' и ' + mcm(b) + '. Расстояние от поверхности земли до уровня воды составляет третью часть глубины колодца. ';
    return { kind: 'num', html: cond + 'Сколько вёдер воды в колодце, если в ведро входит 10 л? (1 л воды занимает 1 000 см³.)', answer: N,
      hint: 'Сначала узнай, на какой глубине вода и сколько её слой по высоте. Все размеры переведи в сантиметры.',
      explain: stepsL([fmt(H) + ' : 3 = ' + h3 + ' (см) — от земли до воды', fmt(H) + ' − ' + h3 + ' = ' + wd + ' (см) — глубина воды', fmt(a) + ' × ' + fmt(b) + ' × ' + wd + ' = ' + fmt(V) + ' (см³), это ' + fmt(V) + ' : 1 000 = ' + fmt(L) + ' л воды', fmt(L) + ' : 10 = ' + fmt(N) + ' (вёдер)'], fmt(N) + ' ' + plur(N, 'ведро', 'ведра', 'вёдер')) };
  });


  /* ================= текстовые задачи на объём (уроки 110–121) ================= */
  function cmp2(total, bu, sU, f) {
    var b = Math.floor(total / f), s = total % f, parts = [];
    if (b) parts.push(nu(b, bu));
    if (s || !b) parts.push(nu(s, sU));
    return parts.join(NB);
  }
  var UW = { 'кг': 'килограммов', 'ц': 'центнеров', 'т': 'тонн' }, UDIV = { 'кг': 1, 'ц': 100, 'т': 1000 };

  /* ---------- масса вещества, заполняющего помещение ---------- */
  var MATS = [
    { m: 'картофеля', d: 680, pl: [['Подвал', 'в подвал', [4, 10], [3, 6], [2, 3]], ['Овощехранилище', 'в овощехранилище', [10, 24], [6, 12], [3, 4]]] },
    { m: 'пшеницы', d: 750, pl: [['Закром', 'в закром', [3, 8], [2, 5], [2, 3]], ['Амбар', 'в амбар', [6, 15], [4, 8], [3, 4]]] },
    { m: 'берёзовых дров', d: 800, pl: [['Сарай', 'в сарай', [3, 8], [2, 5], [2, 3]], ['Дровяной склад', 'на дровяной склад', [8, 20], [4, 8], [2, 4]]] },
    { m: 'сосновых дров', d: 600, pl: [['Сарай', 'в сарай', [3, 8], [2, 5], [2, 3]], ['Дровяной склад', 'на дровяной склад', [8, 20], [4, 8], [2, 4]]] },
    { m: 'каменного угля', d: 800, pl: [['Угольный склад', 'на угольный склад', [6, 15], [4, 8], [2, 4]], ['Сарай', 'в сарай', [3, 8], [2, 5], [2, 3]]] },
    { m: 'песка', d: 1500, pl: [['Кузов самосвала', 'в кузов самосвала', [3, 6], [2, 3], [1, 2]], ['Бункер', 'в бункер', [2, 6], [2, 4], [2, 3]]] },
    { m: 'щебня', d: 1400, pl: [['Кузов самосвала', 'в кузов самосвала', [3, 6], [2, 3], [1, 2]], ['Бункер', 'в бункер', [2, 6], [2, 4], [2, 3]]] },
    { m: 'льда', d: 900, pl: [['Ледник', 'в ледник', [6, 14], [4, 8], [2, 4]]] }
  ];
  function massOk(mass, u) { return mass % UDIV[u] === 0; }
  reg('pVoMass', function (o) {
    o = o || {};
    var M = pick(MATS), P = pick(M.pl), d = M.d, askPool = o.ask || ['кг', 'ц', 'т', 'т', 'кг'], p, q, r, V, u, g = 0, ok = false;
    do {
      p = rand(P[2][0], P[2][1]); q = rand(P[3][0], P[3][1]); r = rand(P[4][0], P[4][1]);
      V = p * q * r; u = pick(askPool); ok = massOk(V * d, u);
    } while (!ok && g++ < 300);
    if (!ok) u = 'кг';
    var dispU = (d % 100 === 0 && Math.random() < 0.5) ? 'ц' : 'кг', dd = dispU === 'ц' ? d / 100 : d, mass = V * d, ans = mass / UDIV[u];
    var steps = [p + ' × ' + q + ' × ' + r + ' = ' + fmt(V) + ' (м³) — объём', fmt(V) + ' × ' + fmt(dd) + ' = ' + fmt(V * dd) + ' (' + dispU + ') — масса'];
    if (dispU !== u) {
      if (dispU === 'кг') steps.push(fmt(V * dd) + ' кг = ' + fmt(V * dd) + ' : ' + fmt(UDIV[u]) + ' ' + u + ' = ' + fmt(ans) + ' ' + u);
      else if (u === 'т') steps.push(fmt(V * dd) + ' ц = ' + fmt(V * dd) + ' : 10 т = ' + fmt(ans) + ' т');
      else steps.push(fmt(V * dd) + ' ц = ' + fmt(V * dd) + ' × 100 кг = ' + fmt(ans) + ' кг');
    }
    return { kind: 'num', html: P[0] + ' имеет форму прямоугольного параллелепипеда: длина ' + nu(p, 'м') + ', ширина ' + nu(q, 'м') + ', высота ' + nu(r, 'м') + '. Сколько ' + UW[u] + ' ' + M.m + ' войдёт ' + P[1] + ', если заполнить его доверху? Известно, что 1 м³ ' + M.m + ' весит ' + nu(dd, dispU) + '.',
      answer: ans, hint: 'Сначала найди объём. Потом узнай массу всего количества: объём умножь на массу 1 м³.', explain: stepsL(steps, fmt(ans) + ' ' + u) };
  });

  /* ---------- размеры связаны отношениями ---------- */
  var RELOBJ = [['коробки', 'см'], ['бруска', 'см'], ['ящика', 'дм'], ['аквариума', 'дм']];
  reg('pVoRel', function (o) {
    o = o || {};
    var T = o.type || pick(['A', 'B', 'C']), ob = pick(RELOBJ), u = ob[1], w, k, L, h, n, m, steps, text, V;
    var raz = function (x) { return plur(x, 'раз', 'раза', 'раз'); };
    if (T === 'A') {
      w = rand(2, 6); k = rand(2, 5); L = k * w; m = rand(2, 5); h = m * w; V = L * w * h;
      text = 'Длина ' + ob[0] + ' ' + nu(L, u) + ', ширина в ' + k + ' ' + raz(k) + ' меньше длины, а высота в ' + m + ' ' + raz(m) + ' больше ширины. Найди объём ' + ob[0] + '.';
      steps = [L + ' : ' + k + ' = ' + w + ' (' + u + ') — ширина', w + ' × ' + m + ' = ' + h + ' (' + u + ') — высота', L + ' × ' + w + ' = ' + (L * w) + ' (' + u + '²) — площадь дна', (L * w) + ' × ' + h + ' = ' + fmt(V) + ' (' + u + '³) — объём'];
    } else if (T === 'B') {
      w = rand(2, 6); k = rand(2, 4); L = k * w; h = rand(2, L - 1); n = L - h; V = L * w * h;
      text = 'Высота ' + ob[0] + ' ' + nu(h, u) + '. Длина на ' + nu(n, u) + ' больше высоты, а ширина в ' + k + ' ' + raz(k) + ' меньше длины. Найди объём ' + ob[0] + '.';
      steps = [h + ' + ' + n + ' = ' + L + ' (' + u + ') — длина', L + ' : ' + k + ' = ' + w + ' (' + u + ') — ширина', L + ' × ' + w + ' = ' + (L * w) + ' (' + u + '²) — площадь дна', (L * w) + ' × ' + h + ' = ' + fmt(V) + ' (' + u + '³) — объём'];
    } else {
      w = rand(2, 6); k = rand(2, 4); L = k * w; n = rand(1, L - 2); h = L - n; V = L * w * h;
      text = 'Ширина ' + ob[0] + ' ' + nu(w, u) + ', длина в ' + k + ' ' + raz(k) + ' больше ширины, а высота на ' + nu(n, u) + ' меньше длины. Найди объём ' + ob[0] + '.';
      steps = [w + ' × ' + k + ' = ' + L + ' (' + u + ') — длина', L + ' − ' + n + ' = ' + h + ' (' + u + ') — высота', L + ' × ' + w + ' = ' + (L * w) + ' (' + u + '²) — площадь дна', (L * w) + ' × ' + h + ' = ' + fmt(V) + ' (' + u + '³) — объём'];
    }
    return { kind: 'num', html: text, answer: V, hint: 'Сначала найди все три измерения, потом перемножь их.', explain: stepsL(steps, vu(V, u)) };
  });

  /* ---------- стена из кирпичей ---------- */
  var PIECES = [
    { w: 'кирпичную стену', n: 'кирпича', pl: 'кирпичей', one: 'кирпич', d: [25, 12, 6], m: [3, 4, 5], kx: [20, 80], ky: [2, 5], kz: [30, 70] },
    { w: 'стену из строительных блоков', n: 'блока', pl: 'блоков', one: 'блок', d: [40, 20, 20], m: [15, 20, 25], kx: [15, 50], ky: [1, 2], kz: [10, 20] }
  ];
  reg('pVoWall', function (o) {
    o = o || {};
    var P = pick(PIECES), ask = o.ask || pick(['count', 'mass']), g = 0, ok = false, kx, ky, kz, N, mm, L, W, H;
    do {
      kx = rand(P.kx[0], P.kx[1]); ky = rand(P.ky[0], P.ky[1]); kz = rand(P.kz[0], P.kz[1]); N = kx * ky * kz; mm = pick(P.m);
      ok = ask === 'count' || (N * mm) % 1000 === 0;
    } while (!ok && g++ < 400);
    if (!ok) ask = 'count';
    L = kx * P.d[0]; W = ky * P.d[1]; H = kz * P.d[2];
    var Vw = L * W * H, Vb = P.d[0] * P.d[1] * P.d[2], conv = [];
    if (L >= 100 || H >= 100) conv.push('Длина стены ' + cmp2(L, 'м', 'см', 100) + ' = ' + fmt(L) + ' см', 'высота ' + cmp2(H, 'м', 'см', 100) + ' = ' + fmt(H) + ' см');
    var steps = [conv.length ? conv.join('; ') + '; толщина ' + W + ' см' : 'Размеры стены: ' + L + ' см, ' + W + ' см, ' + H + ' см',
      'Объём стены: ' + fmt(L) + ' × ' + W + ' × ' + fmt(H) + ' = ' + fmt(Vw) + ' (см³)', 'Объём одного ' + P.n + ': ' + P.d.join(' × ') + ' = ' + fmt(Vb) + ' (см³)', 'Число ' + P.pl + ': ' + fmt(Vw) + ' : ' + fmt(Vb) + ' = ' + fmt(N)];
    var tail = 'Размеры одного ' + P.n + ': длина ' + P.d[0] + ' см, ширина ' + P.d[1] + ' см, толщина ' + P.d[2] + ' см. ';
    var text = 'Нужно сложить ' + P.w + ' длиной ' + cmp2(L, 'м', 'см', 100) + ', толщиной ' + nu(W, 'см') + ' и высотой ' + cmp2(H, 'м', 'см', 100) + '. ' + tail;
    if (ask === 'count') return { kind: 'num', html: text + 'Сколько ' + P.pl + ' потребуется? (Раствор между ними не учитывай.)', answer: N,
      hint: 'Переведи размеры в сантиметры, найди объём стены и объём одного ' + P.n + ', потом раздели.', explain: stepsL(steps, fmt(N) + ' ' + P.pl) };
    steps.push('Масса: ' + fmt(N) + ' × ' + mm + ' = ' + fmt(N * mm) + ' (кг) = ' + fmt(N * mm / 1000) + ' т');
    return { kind: 'num', html: text + 'Сколько тонн весит весь доставленный материал, если один ' + P.one + ' весит ' + nu(mm, 'кг') + '? (Раствор не учитывай.)', answer: N * mm / 1000,
      hint: 'Найди, сколько ' + P.pl + ' нужно, по объёму. Потом умножь на массу одного и переведи килограммы в тонны.', explain: stepsL(steps, fmt(N * mm / 1000) + ' т') };
  });

  /* ---------- коробки в ящике ---------- */
  var PACKS = [
    { cont: 'ящик', what: 'коробки с сушёными ягодами', one: 'коробка', g: 100, d: [6, 4, 9], lead: 'уложены коробки с сушёными ягодами по 100 г в каждой', ask: 'ягоды' },
    { cont: 'ящик', what: 'коробки с печеньем', one: 'коробка', g: 250, d: [20, 10, 5], lead: 'уложены коробки с печеньем по 250 г в каждой', ask: 'печенье' },
    { cont: 'короб', what: 'пачки чая', one: 'пачка', g: 100, d: [10, 6, 4], lead: 'уложены пачки чая по 100 г в каждой', ask: 'чай' },
    { cont: 'ящик', what: 'пачки сахара', one: 'пачка', g: 500, d: [12, 8, 6], lead: 'уложены пачки сахара по 500 г в каждой', ask: 'сахар' }
  ];
  reg('pVoPack', function (o) {
    o = o || {};
    var P = pick(PACKS), mode = o.mode || pick(['count', 'mass']), g = 0, ok = false, kx, ky, kz, N;
    do {
      kx = rand(3, 12); ky = rand(3, 12); kz = rand(2, 8); N = kx * ky * kz;
      ok = N <= 1500 && (mode === 'count' || (N * P.g) % 1000 === 0);
    } while (!ok && g++ < 500);
    if (!ok) mode = 'count';
    var L = kx * P.d[0], W = ky * P.d[1], H = kz * P.d[2], Vc = L * W * H, Vb = P.d[0] * P.d[1] * P.d[2], big = Math.max(L, W, H) >= 100;
    var fm = function (x) { return big ? cmp2(x, 'м', 'см', 100) : cmp2(x, 'дм', 'см', 10); };
    var text = 'В ' + P.cont + ' длиной ' + fm(L) + ', шириной ' + fm(W) + ' и высотой ' + fm(H) + ' ' + P.lead + '. Размеры одной ' + (P.one === 'пачка' ? 'пачки' : 'коробки') + ': длина ' + nu(P.d[0], 'см') + ', ширина ' + nu(P.d[1], 'см') + ', высота ' + nu(P.d[2], 'см') + '. ';
    var steps = ['Размеры ' + (P.cont === 'ящик' ? 'ящика' : 'короба') + ' в сантиметрах: ' + fmt(L) + ' см, ' + fmt(W) + ' см, ' + fmt(H) + ' см', 'Объём ' + (P.cont === 'ящик' ? 'ящика' : 'короба') + ': ' + fmt(L) + ' × ' + fmt(W) + ' × ' + fmt(H) + ' = ' + fmt(Vc) + ' (см³)',
      'Объём одной ' + (P.one === 'пачка' ? 'пачки' : 'коробки') + ': ' + P.d.join(' × ') + ' = ' + fmt(Vb) + ' (см³)', 'Число ' + (P.one === 'пачка' ? 'пачек' : 'коробок') + ': ' + fmt(Vc) + ' : ' + fmt(Vb) + ' = ' + fmt(N)];
    var cnt = P.one === 'пачка' ? 'пачек' : 'коробок';
    if (mode === 'count') return { kind: 'num', html: text + 'Сколько ' + cnt + ' поместилось в ' + (P.cont === 'ящик' ? 'ящик' : 'короб') + '? (Считай, что они заполнили его без пустот.)', answer: N,
      hint: 'Переведи размеры в сантиметры, найди объём ' + (P.cont === 'ящик' ? 'ящика' : 'короба') + ' и объём одной ' + (P.one === 'пачка' ? 'пачки' : 'коробки') + ', раздели.', explain: stepsL(steps, fmt(N) + ' ' + cnt) };
    steps.push('Масса: ' + fmt(N) + ' × ' + P.g + ' = ' + fmt(N * P.g) + ' (г) = ' + fmt(N * P.g / 1000) + ' кг');
    return { kind: 'num', html: text + 'Сколько килограммов весит всё, что уложено в ' + (P.cont === 'ящик' ? 'ящик' : 'короб') + ' (' + P.ask + ' без упаковки)?', answer: N * P.g / 1000,
      hint: 'Сначала найди, сколько ' + cnt + ' в ' + (P.cont === 'ящик' ? 'ящике' : 'коробе') + '. Потом умножь на массу одной и переведи граммы в килограммы.', explain: stepsL(steps, fmt(N * P.g / 1000) + ' кг') };
  });

  /* ---------- перевозка (поездки) ---------- */
  var TRIPS_T = [];
  (function () {
    for (var L = 30; L <= 130; L++) for (var W = 20; W <= 90; W++) {
      if (L % 10 === 0 && W % 10 === 0) continue;
      for (var H = 20; H <= 40; H += 5) if ((L * W * H) % 1000 === 0 && L * W * H / 1000 <= 220 && L > W) TRIPS_T.push([L, W, H]);
    }
  })();
  var CARGO = [
    { d: 900, lead: 'Для ледового городка нужен ледяной параллелепипед (его составят из кусков льда) длиной {L}, шириной {W} и высотой {H}.', mat: 'льда', unit: 'м³ льда', end: 'привезти весь лёд' },
    { d: 800, lead: 'Сарай длиной {L}, шириной {W} и высотой {H} доверху заполнен берёзовыми дровами.', mat: 'дров', unit: 'м³ берёзовых дров', end: 'вывезти все дрова' },
    { d: 600, lead: 'Дровяной склад длиной {L}, шириной {W} и высотой {H} доверху заполнен сосновыми дровами.', mat: 'дров', unit: 'м³ сосновых дров', end: 'вывезти все дрова' },
    { d: 1500, lead: 'Куча песка имеет форму прямоугольного параллелепипеда: длина {L}, ширина {W}, высота {H}.', mat: 'песка', unit: 'м³ песка', end: 'вывезти весь песок' },
    { d: 1400, lead: 'Склад щебня длиной {L}, шириной {W} и высотой {H} заполнен доверху.', mat: 'щебня', unit: 'м³ щебня', end: 'вывезти весь щебень' }
  ];
  reg('pVoTrips', function (o) {
    o = o || {};
    var C0 = pick(CARGO), g = 0, T, Vm, Mc, cap = 0, caps;
    while (!cap && g++ < 200) {
      T = pick(TRIPS_T); Vm = T[0] * T[1] * T[2] / 1000; var mass = Vm * C0.d;
      if (mass % 100) continue;
      Mc = mass / 100; caps = [];
      for (var c = 18; c <= 60; c++) if (Mc % c === 0 && Mc / c >= 4 && Mc / c <= 200) caps.push(c);
      if (caps.length) cap = pick(caps);
    }
    if (!cap) { T = [75, 48, 30]; Vm = 108; C0 = CARGO[0]; Mc = 972; cap = 27; }
    var dispU = (C0.d % 100 === 0 && Math.random() < 0.5) ? 'ц' : 'кг', dd = dispU === 'ц' ? C0.d / 100 : C0.d, trips = Mc / cap;
    var lead = C0.lead.replace('{L}', cmp2(T[0], 'м', 'дм', 10)).replace('{W}', cmp2(T[1], 'м', 'дм', 10)).replace('{H}', cmp2(T[2], 'м', 'дм', 10));
    var steps = ['Размеры в дециметрах: ' + T[0] + ' дм, ' + T[1] + ' дм, ' + T[2] + ' дм', fmt(T[0]) + ' × ' + T[1] + ' × ' + T[2] + ' = ' + fmt(T[0] * T[1] * T[2]) + ' (дм³) = ' + fmt(Vm) + ' (м³) — объём',
      fmt(Vm) + ' × ' + fmt(dd) + ' = ' + fmt(Vm * dd) + ' (' + dispU + ') — масса ' + C0.mat];
    if (dispU === 'кг') steps.push(fmt(Vm * dd) + ' кг = ' + fmt(Mc) + ' ц');
    steps.push(fmt(Mc) + ' : ' + cap + ' = ' + fmt(trips) + ' (поездок)');
    return { kind: 'num', html: lead + ' 1 ' + C0.unit + ' весит ' + nu(dd, dispU) + '. На машину можно погрузить ' + nu(cap, 'ц') + ' ' + C0.mat + '. Сколько поездок надо сделать, чтобы ' + C0.end + '?',
      answer: trips, hint: 'Найди объём, потом массу всего груза, переведи её в центнеры и раздели на то, что увозит одна машина.', explain: stepsL(steps, fmt(trips)) };
  });

  /* ---------- земляные работы ---------- */
  var DIGS = [
    { w: 'котлован', n: 'котлована', r: [[10, 30], [6, 15], [2, 4]], nm: ['длина', 'ширина', 'глубина'] },
    { w: 'пруд', n: 'пруда', r: [[20, 50], [10, 30], [2, 3]], nm: ['длина', 'ширина', 'глубина'] },
    { w: 'канава', n: 'канавы', r: [[20, 60], [1, 3], [1, 2]], nm: ['длина', 'ширина', 'глубина'] }
  ];
  reg('pVoDig', function (o) {
    o = o || {};
    var D = pick(DIGS), mode = o.mode || pick(['earth', 'trips', 'volume']), g = 0, ok = false, p, q, r, V, cap = 0, dc = 0;
    while (!ok && g++ < 600) {
      p = rand(D.r[0][0], D.r[0][1]); q = rand(D.r[1][0], D.r[1][1]); r = rand(D.r[2][0], D.r[2][1]); V = p * q * r;
      if (mode === 'trips') { var cs = [4, 5, 6, 8, 10, 12].filter(function (c) { return V % c === 0 && V / c <= 400; }); if (cs.length) { cap = pick(cs); ok = true; } }
      else if (mode === 'earth') { dc = pick([14, 15, 16]); ok = (V * dc) % 10 === 0; }
      else ok = true;
    }
    if (!ok) mode = 'volume';
    var lead = 'Для ' + (D.w === 'канава' ? 'прокладки труб вырыли канаву' : D.w === 'пруд' ? 'разведения карпов вырыли пруд' : 'фундамента дома вырыли котлован') + ': длина ' + nu(p, 'м') + ', ширина ' + nu(q, 'м') + ', глубина ' + nu(r, 'м') + '. ';
    var s1 = p + ' × ' + q + ' × ' + r + ' = ' + fmt(V) + ' (м³)';
    if (mode === 'volume') return { kind: 'num', html: lead + 'Сколько кубических метров земли вынули?', answer: V, hint: 'Выкопанная яма имеет форму прямоугольного параллелепипеда. Найди её объём.', explain: stepsL([s1], fmt(V) + ' м³') };
    if (mode === 'trips') {
      return { kind: 'num', html: lead + 'Землю вывозят самосвалами, каждый берёт ' + nu(cap, 'м³') + ' за рейс. Сколько рейсов надо сделать, чтобы вывезти всю землю?', answer: V / cap,
        hint: 'Найди объём вынутой земли, потом раздели на то, что увозит один самосвал.', explain: stepsL([s1, fmt(V) + ' : ' + cap + ' = ' + fmt(V / cap) + ' (рейсов)'], fmt(V / cap)) };
    }
    var mass = V * dc, ans = mass / 10;
    return { kind: 'num', html: lead + 'Сколько тонн весит вынутая земля, если 1 м³ земли весит ' + nu(dc, 'ц') + '?', answer: ans,
      hint: 'Найди объём земли, потом её массу в центнерах и переведи центнеры в тонны (1 т = 10 ц).', explain: stepsL([s1, fmt(V) + ' × ' + dc + ' = ' + fmt(mass) + ' (ц)', fmt(mass) + ' : 10 = ' + fmt(ans) + ' (т)'], fmt(ans) + ' т') };
  });

  /* ---------- экскаватор ---------- */
  reg('pVoExc', function (o) {
    o = o || {};
    var mode = o.mode || pick(['over', 'total', 'rest']), v = pick([2, 3, 4]), n1 = rand(5, 9) * 100 / pick([1, 1, 2]), n2 = n1 - rand(1, 4) * 50, V;
    if (n2 < 50) n2 = 100;
    n1 = Math.round(n1 / 50) * 50;
    if (mode === 'over') {
      return { kind: 'num', html: 'Экскаватор вынул за смену ' + fmt(n1) + ' ' + plur(n1, 'ковш', 'ковша', 'ковшей') + ' грунта по ' + nu(v, 'м³') + ' в каждом вместо ' + fmt(n2) + ' ' + plur(n2, 'ковша', 'ковшей', 'ковшей') + ' по плану. На сколько кубических метров перевыполнено задание?', answer: (n1 - n2) * v,
        hint: 'Можно найти объём грунта по плану и объём вынутого, а потом вычесть. Или сначала узнать, на сколько ковшей больше.',
        explain: stepsL([fmt(n1) + ' × ' + v + ' = ' + fmt(n1 * v) + ' (м³) — вынуто', fmt(n2) + ' × ' + v + ' = ' + fmt(n2 * v) + ' (м³) — по плану', fmt(n1 * v) + ' − ' + fmt(n2 * v) + ' = ' + fmt((n1 - n2) * v) + ' (м³)'], fmt((n1 - n2) * v) + ' м³') };
    }
    if (mode === 'total') {
      return { kind: 'num', html: 'В первую смену экскаватор вынул ' + fmt(n1) + ' ' + plur(n1, 'ковш', 'ковша', 'ковшей') + ' грунта, а во вторую — ' + fmt(n2) + ' ' + plur(n2, 'ковш', 'ковша', 'ковшей') + '. В каждом ковше ' + nu(v, 'м³') + ' грунта. Сколько кубических метров грунта вынули за две смены?', answer: (n1 + n2) * v,
        hint: 'Можно сначала найти, сколько ковшей вынули за две смены, а потом умножить на объём ковша.',
        explain: stepsL([fmt(n1) + ' + ' + fmt(n2) + ' = ' + fmt(n1 + n2) + ' (ковшей)', fmt(n1 + n2) + ' × ' + v + ' = ' + fmt((n1 + n2) * v) + ' (м³)'], fmt((n1 + n2) * v) + ' м³') };
    }
    V = (n1 + rand(1, 4) * 50) * v;
    return { kind: 'num', html: 'Надо вынуть ' + fmt(V) + ' м³ грунта. Экскаватор уже вынул ' + fmt(n1) + ' ' + plur(n1, 'ковш', 'ковша', 'ковшей') + ' по ' + nu(v, 'м³') + '. Сколько кубических метров грунта осталось вынуть?', answer: V - n1 * v,
      hint: 'Сначала узнай, сколько кубических метров уже вынуто.', explain: stepsL([fmt(n1) + ' × ' + v + ' = ' + fmt(n1 * v) + ' (м³) — уже вынуто', fmt(V) + ' − ' + fmt(n1 * v) + ' = ' + fmt(V - n1 * v) + ' (м³)'], fmt(V - n1 * v) + ' м³') };
  });

  /* ---------- куб в задачах (урок 113) ---------- */
  var CMAT = [
    { w: 'Ледяная глыба кубической формы', m: 'льда', d: 900 }, { w: 'Гранитный блок кубической формы', m: 'гранита', d: 2700 },
    { w: 'Бетонный блок кубической формы', m: 'бетона', d: 2400 }, { w: 'Куча песка кубической формы', m: 'песка', d: 1500 }
  ];
  reg('pVoCube', function (o) {
    o = o || {};
    var mode = o.mode || pick(['diff', 'fit', 'mass', 'sum']);
    if (mode === 'diff') {
      var a = rand(2, 6), b = rand(2, 6), u = pick(['см', 'дм']);
      while (a === b) b = rand(2, 6);
      var big = Math.max(a, b), small = Math.min(a, b);
      return { kind: 'num', html: 'Ребро одного куба ' + nu(a, u) + ', ребро другого ' + nu(b, u) + '. На сколько кубических ' + (u === 'см' ? 'сантиметров' : 'дециметров') + ' объём большего куба больше объёма меньшего?', answer: big * big * big - small * small * small,
        hint: 'Найди объём каждого куба, потом вычти.', explain: stepsL([big + ' × ' + big + ' × ' + big + ' = ' + (big * big * big) + ' (' + u + '³) — большой куб', small + ' × ' + small + ' × ' + small + ' = ' + (small * small * small) + ' (' + u + '³) — малый куб', (big * big * big) + ' − ' + (small * small * small) + ' = ' + (big * big * big - small * small * small)], (big * big * big - small * small * small) + ' ' + u + '³') };
    }
    if (mode === 'fit') {
      var e = rand(1, 3), k = rand(2, 5), u2 = pick(['см', 'дм']);
      var Ee = e * k;
      return { kind: 'num', html: 'Куб с ребром ' + nu(Ee, u2) + ' нужно заполнить маленькими кубиками с ребром ' + nu(e, u2) + '. Сколько таких кубиков потребуется?', answer: k * k * k,
        hint: 'Найди объём большого куба и объём маленького, потом раздели. Или посчитай, сколько маленьких кубиков уложится вдоль ребра.',
        explain: e === 1 ? stepsL([Ee + ' × ' + Ee + ' × ' + Ee + ' = ' + fmt(Ee * Ee * Ee) + ' (' + u2 + '³) — объём большого куба', 'Объём маленького куба 1 ' + u2 + '³', fmt(Ee * Ee * Ee) + ' : 1 = ' + fmt(Ee * Ee * Ee)], fmt(Ee * Ee * Ee)) :
          stepsL([Ee + ' × ' + Ee + ' × ' + Ee + ' = ' + fmt(Ee * Ee * Ee) + ' (' + u2 + '³) — объём большого куба', e + ' × ' + e + ' × ' + e + ' = ' + (e * e * e) + ' (' + u2 + '³) — объём маленького куба', fmt(Ee * Ee * Ee) + ' : ' + (e * e * e) + ' = ' + (k * k * k)], k * k * k) };
    }
    if (mode === 'mass') {
      var M = pick(CMAT), ed = rand(2, 4), V = ed * ed * ed, mass = V * M.d, ask = (mass % 1000 === 0 && Math.random() < 0.7) ? 'т' : 'кг', ans = ask === 'т' ? mass / 1000 : mass;
      return { kind: 'num', html: M.w + ' имеет ребро ' + nu(ed, 'м') + '. Сколько ' + UW[ask] + ' весит ' + (M.m === 'льда' ? 'эта глыба' : M.m === 'песка' ? 'эта куча' : 'этот блок') + ', если 1 м³ ' + M.m + ' весит ' + nu(M.d, 'кг') + '?', answer: ans,
        hint: 'Сначала найди объём куба, потом умножь на массу 1 м³.', explain: stepsL([ed + ' × ' + ed + ' × ' + ed + ' = ' + V + ' (м³)', V + ' × ' + fmt(M.d) + ' = ' + fmt(mass) + ' (кг)'].concat(ask === 'т' ? [fmt(mass) + ' кг = ' + fmt(ans) + ' т'] : []), fmt(ans) + ' ' + ask) };
    }
    var n = rand(2, 5), e3 = rand(2, 6), u3 = pick(['см', 'дм']);
    return { kind: 'num', html: 'Из ' + n + ' одинаковых кубов с ребром ' + nu(e3, u3) + ' сложили один большой брусок. Каков объём бруска (в ' + u3 + '³)?', answer: n * e3 * e3 * e3,
      hint: 'Объём бруска равен сумме объёмов всех кубов. Найди объём одного куба и умножь на их число.', explain: stepsL([e3 + ' × ' + e3 + ' × ' + e3 + ' = ' + (e3 * e3 * e3) + ' (' + u3 + '³) — один куб', (e3 * e3 * e3) + ' × ' + n + ' = ' + (n * e3 * e3 * e3) + ' (' + u3 + '³)'], (n * e3 * e3 * e3) + ' ' + u3 + '³') };
  });

  /* ---------- кубики в коробке (урок 110) ---------- */
  var FITOBJ = [['коробку', 'коробки', 'см'], ['ящик', 'ящика', 'дм'], ['пенал', 'пенала', 'см'], ['короб', 'короба', 'дм']];
  reg('pVoFit', function (o) {
    o = o || {};
    var mode = o.mode || pick(['all', 'rest', 'both', 'layersNum']), F = pick(FITOBJ), u = F[2], p = rand(3, 9), q = rand(2, 6), r = rand(2, 5);
    while (q === p) q = rand(2, 6);
    var V = p * q * r, cube = 'кубики с ребром 1 ' + u, base = 'Прямоугольный параллелепипед-' + F[0];
    if (mode === 'all') return { kind: 'num', html: 'В ' + F[0] + ' длиной ' + nu(p, u) + ', шириной ' + nu(q, u) + ' и высотой ' + nu(r, u) + ' складывают ' + cube + '. Сколько кубиков поместится в ' + F[0] + '?', answer: V,
      hint: 'Узнай, сколько кубиков в одном ряду, потом в слое, потом во всех слоях.', explain: stepsL([p + ' × ' + q + ' = ' + (p * q) + ' — столько кубиков в одном слое', (p * q) + ' × ' + r + ' = ' + V + ' — столько кубиков во всех слоях'], V + ' ' + plur(V, 'кубик', 'кубика', 'кубиков')) };
    if (mode === 'rest') {
      var m = rand(2, V - 1);
      return { kind: 'num', html: 'В ' + F[0] + ' длиной ' + nu(p, u) + ', шириной ' + nu(q, u) + ' и высотой ' + nu(r, u) + ' складывают ' + cube + '. Уже положили ' + m + ' ' + plur(m, 'кубик', 'кубика', 'кубиков') + '. Сколько ещё кубиков поместится в ' + F[0] + '?', answer: V - m,
        hint: 'Сначала узнай, сколько кубиков поместилось бы во всю ёмкость, потом вычти те, что уже лежат.',
        explain: stepsL([p + ' × ' + q + ' = ' + (p * q) + ' — в одном слое', (p * q) + ' × ' + r + ' = ' + V + ' — всего', V + ' − ' + m + ' = ' + (V - m)], (V - m) + ' ' + plur(V - m, 'кубик', 'кубика', 'кубиков')) };
    }
    if (mode === 'both') {
      var p2 = rand(3, 9), q2 = rand(2, 6), r2 = rand(2, 5), V2 = p2 * q2 * r2;
      return { kind: 'num', html: 'Две коробки имеют форму прямоугольного параллелепипеда. Размеры первой: длина ' + nu(p, u) + ', ширина ' + nu(q, u) + ', высота ' + nu(r, u) + '. Размеры второй: длина ' + nu(p2, u) + ', ширина ' + nu(q2, u) + ', высота ' + nu(r2, u) + '. В коробки складывают кубики с ребром 1 ' + u + '. Сколько кубиков поместится в обе коробки вместе?', answer: V + V2,
        hint: 'Найди число кубиков в каждой коробке отдельно, потом сложи.', explain: stepsL([p + ' × ' + q + ' × ' + r + ' = ' + V + ' — в первой', p2 + ' × ' + q2 + ' × ' + r2 + ' = ' + V2 + ' — во второй', V + ' + ' + V2 + ' = ' + (V + V2)], (V + V2) + ' ' + plur(V + V2, 'кубик', 'кубика', 'кубиков')) };
    }
    var lay = p * q;
    return { kind: 'num', html: 'В ящик помещается ' + V + ' кубиков с ребром 1 ' + u + ', и в каждом слое их ' + lay + '. Какова высота ящика (в ' + u + ')?', answer: r,
      hint: 'Сколько слоёв получится, если ' + V + ' кубиков разложить по ' + lay + ' в слое? Каждый слой имеет высоту 1 ' + u + '.', explain: V + ' : ' + lay + ' = ' + r + ' — столько слоёв. Высота каждого слоя 1 ' + u + ', поэтому высота ящика ' + r + ' ' + u + '. Проверка: ' + lay + ' × ' + r + ' = ' + V + '.' };
  });

  /* ---------- вместимость: вёдра, насос, уровень воды ---------- */
  reg('pVoTank', function (o) {
    o = o || {};
    var mode = o.mode || pick(['buckets', 'pump', 'level']), p, q, r, V, g = 0;
    if (mode === 'buckets') {
      do { p = rand(4, 12); q = rand(3, 8); r = rand(3, 7); V = p * q * r; g++; } while ((V % 10 !== 0 || q === p) && g < 300);
      return { kind: 'num', html: 'Бак имеет форму прямоугольного параллелепипеда: длина ' + nu(p, 'дм') + ', ширина ' + nu(q, 'дм') + ', высота ' + nu(r, 'дм') + '. Сколько вёдер воды по 10 л нужно, чтобы налить его доверху? (1 л = 1 дм³.)', answer: V / 10,
        hint: 'Найди объём бака в кубических дециметрах — столько литров воды в нём поместится. Потом раздели на объём ведра.',
        explain: stepsL([p + ' × ' + q + ' × ' + r + ' = ' + V + ' (дм³) = ' + V + ' л', V + ' : 10 = ' + (V / 10) + ' (вёдер)'], (V / 10) + ' ' + plur(V / 10, 'ведро', 'ведра', 'вёдер')) };
    }
    if (mode === 'pump') {
      var rate;
      do { p = rand(10, 40); q = rand(5, 15); r = rand(1, 3); V = p * q * r; rate = pick([10, 15, 20, 25, 30, 40, 50, 60, 75]); g++; } while ((V % rate !== 0 || V / rate > 40 || V / rate < 2) && g < 800);
      return { kind: 'num', html: 'Бассейн имеет форму прямоугольного параллелепипеда: длина ' + nu(p, 'м') + ', ширина ' + nu(q, 'м') + ', глубина ' + nu(r, 'м') + '. Насос подаёт ' + nu(rate, 'м³') + ' воды в час. За сколько часов насос наполнит пустой бассейн доверху?', answer: V / rate,
        hint: 'Найди, сколько кубических метров воды нужно, и раздели на подачу насоса за час.', explain: stepsL([p + ' × ' + q + ' × ' + r + ' = ' + fmt(V) + ' (м³)', fmt(V) + ' : ' + rate + ' = ' + (V / rate) + ' (ч)'], (V / rate) + ' ' + plur(V / rate, 'час', 'часа', 'часов')) };
    }
    var h;
    p = rand(4, 10); q = rand(3, 6); r = rand(4, 8); h = rand(2, r - 1);
    while (q === p) q = rand(3, 6);
    return { kind: 'num', html: 'Аквариум имеет длину ' + nu(p, 'дм') + ', ширину ' + nu(q, 'дм') + ' и высоту ' + nu(r, 'дм') + '. В него налили воду до высоты ' + nu(h, 'дм') + '. Сколько литров воды в аквариуме? (1 л = 1 дм³.)', answer: p * q * h,
      hint: 'Вода заполняет только часть аквариума. Подумай: какой высоты слой воды? Именно эту высоту и надо взять в расчёт.', explain: stepsL(['Слой воды: длина ' + p + ' дм, ширина ' + q + ' дм, высота ' + h + ' дм', p + ' × ' + q + ' × ' + h + ' = ' + (p * q * h) + ' (дм³)', '1 дм³ = 1 л, значит, воды ' + (p * q * h) + ' л'], (p * q * h) + ' л') };
  });


  /* ================= поверхность и объём (уроки 120–121) ================= */
  reg('voSurf', function (o) {
    o = o || {};
    var mode = o.mode || pick(['cubeSide', 'cubeTotal', 'boxSide', 'boxTotal', 'three']), u = pick(['см', 'дм', 'м']), a, p, q, r;
    if (mode === 'cubeSide' || mode === 'cubeTotal') {
      a = rand(2, 12);
      var F = a * a, k = mode === 'cubeSide' ? 4 : 6;
      return { kind: 'num', html: 'Ребро куба равно ' + nu(a, u) + '. Найди площадь ' + (mode === 'cubeSide' ? 'боковой поверхности куба (четыре боковые грани)' : 'полной поверхности куба (всех шести граней)') + ' в ' + u + '².<br>' + cubeFig({ lab: { a: nu(a, u) }, label: 'Куб' }), answer: F * k,
        hint: 'Все грани куба — равные квадраты. Найди площадь одной грани и умножь на число граней.',
        explain: stepsL(['Площадь одной грани: ' + a + ' × ' + a + ' = ' + F + ' (' + u + '²)', 'Граней ' + k + ': ' + F + ' × ' + k + ' = ' + (F * k) + ' (' + u + '²)'], (F * k) + ' ' + u + '²') };
    }
    p = rand(4, 12); q = rand(2, 9); r = rand(2, 9);
    while (q === p) q = rand(2, 9);
    while (r === p || r === q) r = rand(2, 9);
    var A = p * r, B = q * r, C = p * q, side = 2 * (A + B), total = side + 2 * C, V = p * q * r;
    var fig = boxNum(p, q, r, u);
    var sideSteps = ['Передняя и задняя грани: ' + p + ' × ' + r + ' = ' + A + ' (' + u + '²) каждая', 'Две боковые грани: ' + q + ' × ' + r + ' = ' + B + ' (' + u + '²) каждая', 'Боковая поверхность: (' + A + ' + ' + B + ') × 2 = ' + (A + B) + ' × 2 = ' + side + ' (' + u + '²)'];
    if (mode === 'boxSide') {
      return { kind: 'num', html: 'Длина прямоугольного параллелепипеда ' + nu(p, u) + ', ширина ' + nu(q, u) + ', высота ' + nu(r, u) + '. Найди площадь его боковой поверхности (четырёх боковых граней) в ' + u + '².<br>' + fig, answer: side,
        hint: 'Боковых граней четыре: две одного размера и две другого. Найди площадь каждой разной грани.', explain: stepsL(sideSteps, side + ' ' + u + '²') };
    }
    if (mode === 'boxTotal') {
      return { kind: 'num', html: 'Длина прямоугольного параллелепипеда ' + nu(p, u) + ', ширина ' + nu(q, u) + ', высота ' + nu(r, u) + '. Найди площадь его полной поверхности (всех шести граней) в ' + u + '².<br>' + fig, answer: total,
        hint: 'Разных граней три пары: передняя и задняя, две боковые, верхняя и нижняя. Найди площадь каждой пары.',
        explain: stepsL(['Передняя и задняя: ' + p + ' × ' + r + ' = ' + A, 'Боковые: ' + q + ' × ' + r + ' = ' + B, 'Верхняя и нижняя: ' + p + ' × ' + q + ' = ' + C, 'Площадь полной поверхности: (' + A + ' + ' + B + ' + ' + C + ') × 2 = ' + (A + B + C) + ' × 2 = ' + total], total + ' ' + u + '²') };
    }
    return { kind: 'nums', html: 'Длина прямоугольного параллелепипеда ' + nu(p, u) + ', ширина ' + nu(q, u) + ', высота ' + nu(r, u) + '. Найди площадь боковой поверхности, площадь полной поверхности и объём.<br>' + fig,
      fields: [{ label: 'боковая, ' + u + '²' }, { label: 'полная, ' + u + '²' }, { label: 'объём, ' + u + '³' }], answer: [side, total, V],
      hint: 'Боковая поверхность — четыре боковые грани. Полная — все шесть граней. Объём — длина × ширина × высота.',
      explain: stepsL(sideSteps.concat(['Основания: ' + p + ' × ' + q + ' = ' + C + ' (' + u + '²) каждое, полная поверхность: ' + side + ' + ' + C + ' × 2 = ' + side + ' + ' + (2 * C) + ' = ' + total + ' (' + u + '²)', 'Объём: ' + C + ' × ' + r + ' = ' + V + ' (' + u + '³)'])) };
  });

  reg('pVoRoom', function (o) {
    o = o || {};
    var mode = o.mode || pick(['walls', 'paint', 'air']), ob = pick(['Классная комната', 'Спортивный зал', 'Мастерская', 'Библиотека']), p, q, r, W, V;
    var g = 0;
    if (mode === 'air') {
      var per;
      do { p = rand(6, 12); q = rand(5, 9); r = rand(3, 4); V = p * q * r; per = pick([4, 5, 6]); g++; } while ((V % per !== 0 || p === q) && g < 500);
      return { kind: 'num', html: ob + ' имеет форму прямоугольного параллелепипеда: длина ' + nu(p, 'м') + ', ширина ' + nu(q, 'м') + ', высота ' + nu(r, 'м') + '. Сколько человек можно разместить в этом помещении, если на каждого отводится ' + nu(per, 'м³') + ' объёма?', answer: V / per,
        hint: 'Найди объём помещения и узнай, сколько раз по ' + per + ' м³ в нём помещается.', explain: stepsL([p + ' × ' + q + ' × ' + r + ' = ' + V + ' (м³)', V + ' : ' + per + ' = ' + (V / per) + ' (человек)'], (V / per) + ' ' + plur(V / per, 'человек', 'человека', 'человек')) };
    }
    do { p = rand(6, 12); q = rand(4, 9); r = rand(3, 4); g++; } while (p === q && g < 100);
    W = 2 * (p + q) * r;
    var text = ob + ' имеет длину ' + nu(p, 'м') + ', ширину ' + nu(q, 'м') + ' и высоту ' + nu(r, 'м') + '. ';
    var wsteps = [p + ' × ' + r + ' × 2 = ' + (p * r * 2) + ' (м²) — две стены длиной ' + p + ' м', q + ' × ' + r + ' × 2 = ' + (q * r * 2) + ' (м²) — две стены шириной ' + q + ' м', (p * r * 2) + ' + ' + (q * r * 2) + ' = ' + W + ' (м²) — все стены'];
    if (mode === 'walls') return { kind: 'num', html: text + 'Найди площадь всех стен (без учёта окон и дверей).', answer: W,
      hint: 'Стен четыре: две одинаковые по длине и две одинаковые по ширине. Найди площадь каждой пары.', explain: stepsL(wsteps, W + ' м²') };
    var c = pick([5, 6, 8, 9, 10]), t = Math.floor(W * 0.85 / c) - rand(0, 2), S0 = W - c * t;
    while (S0 < 4 || S0 > W * 0.3) { t -= 1; S0 = W - c * t; if (t < 2) break; }
    return { kind: 'num', html: text + 'Стены нужно покрасить. Окна и дверь занимают ' + nu(S0, 'м²') + '. Одной банки краски хватает на ' + nu(c, 'м²') + ' стены. Сколько банок краски потребуется?', answer: t,
      hint: 'Сначала найди площадь всех стен, затем вычти окна и двери. Потом узнай, сколько раз по ' + c + ' м² в оставшейся площади.',
      explain: stepsL(wsteps.concat([W + ' − ' + S0 + ' = ' + (W - S0) + ' (м²) — надо покрасить', (W - S0) + ' : ' + c + ' = ' + t + ' (банок)']), t + ' ' + plur(t, 'банка', 'банки', 'банок')) };
  });

  reg('pVoBoxMat', function (o) {
    o = o || {};
    var mode = o.mode || pick(['open', 'closed', 'cubeOpen']), u, p, q, r, a;
    if (mode === 'cubeOpen') {
      a = rand(2, 9); u = pick(['см', 'дм']);
      return { kind: 'num', html: 'Из пластика сделали открытую сверху коробку кубической формы с ребром ' + nu(a, u) + '. Сколько квадратных ' + (u === 'см' ? 'сантиметров' : 'дециметров') + ' пластика ушло на коробку? (Швы не учитывай.)', answer: 5 * a * a,
        hint: 'У куба шесть граней, но верхней грани у такой коробки нет.', explain: stepsL([a + ' × ' + a + ' = ' + (a * a) + ' (' + u + '²) — одна грань', 'Граней 6 − 1 = 5', (a * a) + ' × 5 = ' + (5 * a * a) + ' (' + u + '²)'], (5 * a * a) + ' ' + u + '²') };
    }
    p = rand(4, 12); q = rand(2, 8); r = rand(2, 8);
    while (q === p) q = rand(2, 8);
    while (r === p || r === q) r = rand(2, 8);
    u = pick(['дм', 'см']);
    var A = p * r, B = q * r, C = p * q;
    if (mode === 'open') {
      return { kind: 'num', html: 'Аквариум имеет форму прямоугольного параллелепипеда без верхней грани (открытый): длина ' + nu(p, u) + ', ширина ' + nu(q, u) + ', высота ' + nu(r, u) + '. Сколько квадратных ' + (u === 'см' ? 'сантиметров' : 'дециметров') + ' стекла нужно на аквариум?', answer: C + 2 * A + 2 * B,
        hint: 'Верхней грани нет. Найди площадь дна и площади четырёх боковых стенок.', explain: stepsL(['Дно: ' + p + ' × ' + q + ' = ' + C + ' (' + u + '²)', 'Две длинные стенки: ' + p + ' × ' + r + ' × 2 = ' + (2 * A) + ' (' + u + '²)', 'Две короткие стенки: ' + q + ' × ' + r + ' × 2 = ' + (2 * B) + ' (' + u + '²)', C + ' + ' + (2 * A) + ' + ' + (2 * B) + ' = ' + (C + 2 * A + 2 * B) + ' (' + u + '²)'], (C + 2 * A + 2 * B) + ' ' + u + '²') };
    }
    return { kind: 'num', html: 'Коробку в форме прямоугольного параллелепипеда с крышкой склеили из картона: длина ' + nu(p, u) + ', ширина ' + nu(q, u) + ', высота ' + nu(r, u) + '. Сколько квадратных ' + (u === 'см' ? 'сантиметров' : 'дециметров') + ' картона ушло на коробку? (Швы не учитывай.)', answer: 2 * (A + B + C),
      hint: 'Нужны все шесть граней: три пары одинаковых.', explain: stepsL(['Дно и крышка: ' + p + ' × ' + q + ' = ' + C + ' (' + u + '²) каждая', 'Передняя и задняя стенки: ' + p + ' × ' + r + ' = ' + A + ' (' + u + '²) каждая', 'Боковые стенки: ' + q + ' × ' + r + ' = ' + B + ' (' + u + '²) каждая', '(' + C + ' + ' + A + ' + ' + B + ') × 2 = ' + (A + B + C) + ' × 2 = ' + (2 * (A + B + C))], (2 * (A + B + C)) + ' ' + u + '²') };
  });

  /* ---------- типичные ошибки (урок 120) ---------- */
  var VERR = {
    sum: 'Измерения сложили, а не перемножили',
    unit: 'Объём назван в квадратных единицах, а должен быть в кубических',
    cube3: 'Ребро куба умножили на 3, а надо взять ребро сомножителем три раза',
    mix: 'Размеры перемножили, не выразив их в одной мере',
    conv: 'Неверно переведены кубические меры (в 1 м³ не 100 дм³)',
    two: 'Перемножили только два измерения, а третье забыли',
    edge: 'Ребро нашли делением объёма на 3, а не подбором',
    none: 'Ошибок нет'
  };
  reg('voErr', function (o) {
    o = o || {};
    var ty = o.type || pick(['sum', 'unit', 'cube3', 'mix', 'conv', 'two', 'edge', 'none']), rec, why, p, q, r, a, sub = ty;
    if (ty === 'none') sub = pick(['plain', 'cube', 'mixok']);
    if (ty === 'sum') {
      p = rand(4, 9); q = rand(2, 6); r = rand(2, 6); rec = 'Брусок: длина ' + p + ' см, ширина ' + q + ' см, высота ' + r + ' см.<br>' + expr(p + ' + ' + q + ' + ' + r + ' = ' + (p + q + r) + ' (см³)');
      why = 'Объём равен произведению, а не сумме. Правильно: ' + p + ' × ' + q + ' × ' + r + ' = ' + (p * q * r) + ' (см³).';
    } else if (ty === 'unit') {
      p = rand(4, 9); q = rand(2, 6); r = rand(2, 6); rec = 'Коробка: длина ' + p + ' дм, ширина ' + q + ' дм, высота ' + r + ' дм.<br>' + expr(p + ' × ' + q + ' × ' + r + ' = ' + (p * q * r) + ' (дм²)');
      why = 'Число верное, но объём измеряют кубическими единицами. Правильно: ' + (p * q * r) + ' дм³ (а дм² — единица площади).';
    } else if (ty === 'cube3') {
      a = rand(3, 9); rec = 'Куб с ребром ' + a + ' см.<br>' + expr(a + ' × 3 = ' + (3 * a) + ' (см³)');
      why = 'У куба три одинаковых измерения, их надо перемножить: ' + a + ' × ' + a + ' × ' + a + ' = ' + (a * a * a) + ' (см³). Умножение на 3 — это не объём.';
    } else if (ty === 'mix') {
      var m = rand(2, 4), c1 = pick([20, 30, 40, 50]), d1 = rand(2, 6); rec = 'Длина ' + m + ' м, ширина ' + c1 + ' см, высота ' + d1 + ' дм.<br>' + expr(m + ' × ' + c1 + ' × ' + d1 + ' = ' + (m * c1 * d1));
      why = 'Меры разные — метры, сантиметры, дециметры. Сначала всё выражают в одной мере, например в дециметрах: ' + m + ' м = ' + (m * 10) + ' дм, ' + c1 + ' см = ' + (c1 / 10) + ' дм, высота ' + d1 + ' дм. Тогда ' + (m * 10) + ' × ' + (c1 / 10) + ' × ' + d1 + ' = ' + (m * c1 * d1) + ' (дм³). Ученик же перемножил числа, как будто меры одинаковые, и получил ' + (m * c1 * d1) + ' без единицы.';
    } else if (ty === 'conv') {
      a = rand(2, 9); rec = expr(a + ' м³ = ' + (a * 100) + ' дм³');
      why = 'В 1 м³ помещается 10 × 10 × 10 = 1 000 дм³, а не 100. Правильно: ' + a + ' м³ = ' + fmt(a * 1000) + ' дм³.';
    } else if (ty === 'two') {
      p = rand(4, 9); q = rand(2, 6); r = rand(2, 6); rec = 'Параллелепипед: ' + p + ' см, ' + q + ' см, ' + r + ' см.<br>' + expr(p + ' × ' + q + ' = ' + (p * q) + ' (см³)');
      why = p + ' × ' + q + ' — это площадь основания, число кубиков в одном слое. Нужно ещё умножить на высоту: ' + (p * q) + ' × ' + r + ' = ' + (p * q * r) + ' (см³).';
    } else if (ty === 'edge') {
      a = rand(2, 6); rec = 'Объём куба ' + (a * a * a) + ' см³. Найти ребро.<br>' + expr((a * a * a) + ' : 3 = ' + (a * a * a / 3) + ' (см)');
      why = 'Ребро — такое число, которое при умножении три раза само на себя даёт объём. Подбор: ' + a + ' × ' + a + ' × ' + a + ' = ' + (a * a * a) + ', поэтому ребро ' + a + ' см. Деление объёма на 3 не даёт ребро.';
    } else if (sub === 'plain') {
      p = rand(4, 9); q = rand(2, 6); r = rand(2, 6); rec = 'Брусок: длина ' + p + ' см, ширина ' + q + ' см, высота ' + r + ' см.<br>' + expr(p + ' × ' + q + ' × ' + r + ' = ' + (p * q * r) + ' (см³)');
      why = 'Проверим: ' + p + ' × ' + q + ' = ' + (p * q) + ', ' + (p * q) + ' × ' + r + ' = ' + (p * q * r) + '. Единица — кубическая. Ошибок нет.';
    } else if (sub === 'cube') {
      a = rand(3, 9); rec = 'Куб с ребром ' + a + ' дм.<br>' + expr(a + ' × ' + a + ' × ' + a + ' = ' + (a * a * a) + ' (дм³)');
      why = 'Проверим: ' + a + ' × ' + a + ' = ' + (a * a) + ', ' + (a * a) + ' × ' + a + ' = ' + (a * a * a) + '. Единица — кубическая. Ошибок нет.';
    } else {
      a = rand(2, 9); rec = expr(a + ' м³ = ' + fmt(a * 1000) + ' дм³');
      why = 'В 1 м³ помещается 1 000 дм³, значит, ' + a + ' м³ = ' + a + ' × 1 000 = ' + fmt(a * 1000) + ' дм³. Ошибок нет.';
    }
    var keys = Object.keys(VERR), others = shuffle(keys.filter(function (x) { return x !== ty; })).slice(0, 3), opt = shuffle([ty].concat(others));
    return { kind: 'choice', html: 'Ученик записал решение.<br>' + rec + '<br>Какая ошибка допущена?', options: opt.map(function (x) { return VERR[x]; }), answer: opt.indexOf(ty),
      hint: 'Проверь: перемножены ли все три измерения, в одной ли мере они выражены, правильно ли названа единица и переведены меры.', explain: why };
  });


  /* ---------- кубические меры в задачах (уроки 115–117) ---------- */
  reg('pVoUnits', function (o) {
    o = o || {};
    var mode = o.mode || pick(['barrow', 'boxes', 'row', 'diff']);
    if (mode === 'barrow') {
      var V = rand(2, 12), c = pick([20, 25, 40, 50, 100]), what = pick([['песка', 'тачка'], ['земли', 'тачка'], ['гравия', 'тачка']]);
      return { kind: 'num', html: 'Во двор привезли ' + nu(V, 'м³') + ' ' + what[0] + '. За один раз ' + what[1] + ' увозит ' + nu(c, 'дм³') + '. Сколько раз придётся сходить с тачкой, чтобы перевезти всё?', answer: V * 1000 / c,
        hint: 'Меры разные. Выразите объём в кубических дециметрах (1 м³ = 1 000 дм³) и потом делите.', explain: stepsL([V + ' м³ = ' + V + ' × 1 000 = ' + fmt(V * 1000) + ' дм³', fmt(V * 1000) + ' : ' + c + ' = ' + fmt(V * 1000 / c) + ' (раз)'], fmt(V * 1000 / c) + ' ' + plur(V * 1000 / c, 'раз', 'раза', 'раз')) };
    }
    if (mode === 'boxes') {
      var V2 = rand(1, 3), c2 = pick([2, 4, 5, 8, 10, 20, 25]);
      return { kind: 'num', html: 'В контейнер объёмом ' + nu(V2, 'м³') + ' плотно укладывают коробки. Объём одной коробки — ' + nu(c2, 'дм³') + '. Сколько коробок поместится в контейнер?', answer: V2 * 1000 / c2,
        hint: 'Выразите объём контейнера в кубических дециметрах и узнай, сколько раз в нём помещается объём коробки.', explain: stepsL([V2 + ' м³ = ' + fmt(V2 * 1000) + ' дм³', fmt(V2 * 1000) + ' : ' + c2 + ' = ' + fmt(V2 * 1000 / c2) + ' (коробок)'], fmt(V2 * 1000 / c2) + ' ' + plur(V2 * 1000 / c2, 'коробка', 'коробки', 'коробок')) };
    }
    if (mode === 'row') {
      var pr = pick([['м', 'дм', 100], ['дм', 'см', 10]]), e = pick([1, 1, 2]), cnt = 1000 * e * e * e, len = cnt * 1 / (pr[0] === 'м' ? 10 : 100);
      return { kind: 'num', html: 'Куб с ребром ' + nu(e, pr[0]) + ' распилили на кубики с ребром 1 ' + pr[1] + ' и выложили их в один ряд вплотную друг к другу. Какой длины (в метрах) получился ряд?', answer: len,
        hint: 'Сначала узнай, сколько получилось кубиков: сколько кубиков с ребром 1 ' + pr[1] + ' помещается в кубе. Длина ряда в ' + pr[1] + ' равна числу кубиков.',
        explain: stepsL(['В кубе с ребром 1 ' + pr[0] + ' помещается 1 000 кубиков с ребром 1 ' + pr[1] + (e > 1 ? ', а в кубе с ребром ' + e + ' ' + pr[0] + ' их ' + e + ' × ' + e + ' × ' + e + ' = ' + (e * e * e) + ' раз(а) больше: ' + fmt(cnt) : ''), 'Длина ряда: ' + fmt(cnt) + ' ' + pr[1], fmt(cnt) + ' ' + pr[1] + ' = ' + fmt(len) + ' м (1 м = ' + (pr[0] === 'м' ? '10 дм' : '100 см') + ')'], fmt(len) + ' м') };
    }
    var a = rand(2, 9), r = rand(1, 9) * 100, b = a * 1000 - r;
    return { kind: 'num', html: 'Объём одного бака ' + nu(a, 'м³') + ', а другого — ' + nu(b, 'дм³') + '. На сколько кубических дециметров объём первого бака больше?', answer: r,
      hint: 'Выразите объёмы в одинаковых мерах — в кубических дециметрах — и вычти.', explain: stepsL([a + ' м³ = ' + fmt(a * 1000) + ' дм³', fmt(a * 1000) + ' − ' + fmt(b) + ' = ' + fmt(r) + ' (дм³)'], fmt(r) + ' дм³') };
  });

  /* ================= виджеты теории ================= */
  R.widgetMounts = R.widgetMounts || {};
  function wEl(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function wNum(inp, lo, hi) { var v = Number(String(inp.value).replace(/\D/g, '')); if (!v) return null; return Math.max(lo, Math.min(hi, v)); }

  /* «Считаем кубики»: длина, ширина, высота → ряд, слой, всё */
  R.widgetMounts.voBoxCalc = function (host) {
    host.classList.add('vow');
    var d = host.dataset || {}, vals = [Number(d.a) || 4, Number(d.b) || 3, Number(d.c) || 2];
    host.innerHTML = '<div class="conv-row"><label class="vo-f"><span class="wlabel">Длина</span><input class="winput sm" inputmode="numeric" autocomplete="off" maxlength="2" aria-label="Длина"></label>' +
      '<span class="conv-eq">×</span><label class="vo-f"><span class="wlabel">Ширина</span><input class="winput sm" inputmode="numeric" autocomplete="off" maxlength="2" aria-label="Ширина"></label>' +
      '<span class="conv-eq">×</span><label class="vo-f"><span class="wlabel">Высота</span><input class="winput sm" inputmode="numeric" autocomplete="off" maxlength="2" aria-label="Высота"></label></div><div class="w-out" aria-live="polite"></div>';
    var ins = host.querySelectorAll('input'), out = host.querySelector('.w-out');
    var lim = [10, 8, 8];
    for (var i = 0; i < 3; i++) ins[i].value = vals[i];
    function draw() {
      var v = [0, 1, 2].map(function (k) { return wNum(ins[k], 1, lim[k]); });
      if (v.some(function (x) { return x === null; })) { out.innerHTML = '<p class="facts">Впиши три числа от 1 до ' + lim[0] + '.</p>'; return; }
      var a = v[0], b = v[1], c = v[2], S = a * b, V = S * c;
      out.innerHTML = '<div class="vo-wfig">' + R.voBoxSVG(a, b, c, { grid: true, lab: { a: String(a), b: String(b), c: String(c) }, label: 'Параллелепипед ' + a + ' на ' + b + ' на ' + c, maxW: 320, maxH: 230 }) + '</div>' +
        '<p class="facts">В одном ряду вдоль длины: <b>' + a + '</b> ' + plur(a, 'кубик', 'кубика', 'кубиков') + '.<br>В одном слое: ' + a + ' × ' + b + ' = <b>' + S + '</b>.<br>Слоёв ' + c + ', всего: ' + S + ' × ' + c + ' = <b>' + V + '</b> ' + plur(V, 'кубик', 'кубика', 'кубиков') + '.</p>' +
        '<p class="facts">Коротко: ' + a + ' × ' + b + ' × ' + c + ' = <b>' + V + '</b>.</p>';
    }
    ins.forEach(function (x) { x.addEventListener('input', function () { var t = x.value.replace(/\D/g, ''); if (t !== x.value) x.value = t; draw(); }); });
    draw();
  };

  /* «Из чего сложен кубический метр»: слои по 100 кубических дециметров */
  R.widgetMounts.voCubeBuild = function (host) {
    host.classList.add('vow');
    var PRS = [['м', 'дм'], ['дм', 'см'], ['см', 'мм']], d = host.dataset || {}, pi = Number(d.p) || 0, k = 0;
    host.innerHTML = '<div class="conv-row"><label class="vo-f"><span class="wlabel">Единицы</span><select class="wsel" aria-label="Какие кубические меры"></select></label>' +
      '<button type="button" class="btn soft vo-b" data-a="m">− слой</button><button type="button" class="btn soft vo-b" data-a="p">+ слой</button><button type="button" class="btn ghost vo-b" data-a="all">Весь куб</button><button type="button" class="btn ghost vo-b" data-a="clr">Сначала</button></div><div class="w-out" aria-live="polite"></div>';
    var sel = host.querySelector('select'), out = host.querySelector('.w-out');
    PRS.forEach(function (p, i) { sel.appendChild(wEl('option', null, '1 ' + p[0] + '³ и 1 ' + p[1] + '³')).value = i; });
    sel.value = pi;
    function draw() {
      var P = PRS[Number(sel.value)], big = P[0], small = P[1], lab = { a: '1 ' + big, b: '1 ' + big, c: '1 ' + big };
      var svg = k >= 10 ? R.voBoxSVG(10, 10, 10, { grid: true, lab: lab, label: 'Куб, составленный из 1 000 маленьких кубов', maxW: 300, maxH: 230 }) :
        R.voBoxSVG(10, 10, 10, { k: k, lab: lab, label: 'Куб, заполненный слоями на ' + k + ' из 10', maxW: 300, maxH: 230 });
      var t = '<p class="facts">Ребро большого куба — 1 ' + big + ' = 10 ' + small + '. Вдоль ребра ложатся <b>10</b> маленьких кубов с ребром 1 ' + small + '; один слой — 10 × 10 = <b>100</b> кубов.</p>';
      t += k === 0 ? '<p class="facts">Нажимай «+ слой»: куб заполняется слоями по 100 ' + small + '³.</p>' :
        '<p class="facts">Слоёв: ' + k + '. Маленьких кубов: 100 × ' + k + ' = <b>' + fmt(100 * k) + '</b> ' + small + '³' + (k === 10 ? '.<br>Значит, <b>1 ' + big + '³ = 1 000 ' + small + '³</b>.' : '.') + '</p>';
      out.innerHTML = '<div class="vo-wfig">' + svg + '</div>' + t;
    }
    host.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.vo-b') : null; if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'p') k = Math.min(10, k + 1); else if (a === 'm') k = Math.max(0, k - 1); else if (a === 'all') k = 10; else k = 0;
      draw();
    });
    sel.addEventListener('change', draw);
    draw();
  };

  /* «Рассмотри тело»: грани, рёбра, вершины, измерения */
  R.widgetMounts.voElemsW = function (host) {
    host.classList.add('vow');
    var d = host.dataset || {}, body = d.body === 'cube' ? 'cube' : 'box', what = 'faces';
    var BT = [['faces', 'Грани'], ['edges', 'Рёбра'], ['verts', 'Вершины']];
    if (body === 'box') BT.push(['dims', 'Измерения']);
    host.innerHTML = '<div class="conv-row">' + BT.map(function (b) { return '<button type="button" class="btn soft vo-b" data-w="' + b[0] + '">' + b[1] + '</button>'; }).join('') + '</div><div class="w-out" aria-live="polite"></div>';
    var out = host.querySelector('.w-out'), btns = host.querySelectorAll('.vo-b');
    function fig(o) { o = o || {}; o.grid = false; if (body === 'cube') { o.maxS = 80; return R.voBoxSVG(1, 1, 1, o); } return R.voBoxSVG(6, 3, 4, o); }
    var nm = body === 'cube' ? 'куба' : 'параллелепипеда';
    function draw() {
      var s, t;
      if (what === 'faces') {
        s = fig({ hlF: ['front', 'top', 'right'], hidden: true, label: 'Видимые грани закрашены' });
        t = 'У ' + nm + ' <b>6 граней</b>. Закрашены три видимые: передняя, верхняя и правая. Ещё три — задняя, нижняя и левая — с обратной стороны. ' + (body === 'cube' ? 'Все грани куба — равные квадраты.' : 'Все грани — прямоугольники, противоположные грани равны.');
      } else if (what === 'edges') {
        s = fig({ hlE: VIS_EDGES, hidden: true, label: 'Видимые рёбра выделены' });
        t = 'У ' + nm + ' <b>12 рёбер</b>. Красным выделены 9 видимых, штрихом нарисованы 3 невидимых. ' + (body === 'cube' ? 'Все рёбра куба равны.' : 'Рёбра делятся на три группы по 4 равных ребра.');
      } else if (what === 'verts') {
        s = fig({ hlV: VIS_VERTS, hidden: true, label: 'Видимые вершины отмечены' });
        t = 'У ' + nm + ' <b>8 вершин</b>. Отмечены 7 видимых, ещё одна спрятана сзади. В каждой вершине сходятся три ребра.';
      } else {
        s = R.voBoxSVG(6, 3, 4, { grid: false, hlE: ['F0-F1', 'F1-B1', 'F0-F3'], hidden: true, lab: { a: 'длина', b: 'ширина', c: 'высота' }, label: 'Длина, ширина и высота' });
        t = 'Три измерения: <b>длина</b> — ребро вдоль передней грани, <b>ширина</b> — ребро, уходящее вглубь, <b>высота</b> — ребро вверх. Каждое измерение показывают 4 равных ребра.';
      }
      out.innerHTML = '<div class="vo-wfig">' + s + '</div><p class="facts">' + t + '</p>';
      Array.prototype.forEach.call(btns, function (b) { var on = b.getAttribute('data-w') === what; b.classList.toggle('primary', on); b.classList.toggle('soft', !on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    }
    host.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.vo-b') : null; if (!b) return;
      what = b.getAttribute('data-w'); draw();
    });
    draw();
  };

  /* ================= общая чистка текста ================= */
  (function () {
    var names = Object.keys(gens).filter(function (n) { return /^p?vo[A-Z]/.test(n); });
    names.forEach(function (name) {
      var raw = gens[name];
      gens[name] = function (o) {
        var q = raw(o);
        q.html = R.tidy(q.html); q.explain = R.tidy(q.explain); q.hint = R.tidy(q.hint);
        return q;
      };
    });
  })();

  /* @@GENS2 */

  /* @@GENS */
})(typeof window !== 'undefined' ? window : globalThis);
