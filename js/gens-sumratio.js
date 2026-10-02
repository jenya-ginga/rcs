/* Блок «Числа по сумме и кратному отношению. Приёмы устного счёта», уроки 101–107. Префикс: sv / R.sv…
   Ответы всегда целые: числа подбираются обратным ходом от ответа. */
(function (G) {
  'use strict';
  var R = G.RKS;
  var rand = R.rand, pick = R.pick, shuffle = R.shuffle, fmt = R.fmt, NB = R.NB;
  var gens = R.gens;
  var MINE = [];
  function reg(name, fn) {
    if (gens[name]) throw new Error('дубль ' + name);
    gens[name] = function (o) {
      var q = fn(o || {});
      if (q) { q.html = R.tidy(q.html); q.hint = R.tidy(q.hint); q.explain = R.tidy(q.explain); }
      return q;
    };
    MINE.push(name);
  }

  /* ================= общие помощники ================= */
  function expr(s) { return '<span class="expr">' + s + '</span>'; }
  function num(n) { return '<span class="num">' + fmt(n) + '</span>'; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function pl(n, a, b, c) { return R.plural(n, [a, b, c]); }
  function tms(k) { return k + ' ' + pl(k, 'раз', 'раза', 'раз'); }                 /* «3 раза», «5 раз» */
  function partsW(n) { return n + ' ' + pl(n, 'часть', 'части', 'частей'); }        /* «1 часть», «5 частей» */
  function stepsL(list, ans) {
    return list.map(function (s, i) { return (i + 1) + ') ' + s; }).join('<br>') + (ans == null ? '' : '<br>Ответ: ' + ans + '.');
  }
  function sumOf(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function chooseK(lo, hi, avoid) { var k, g = 0; do { k = rand(lo, hi); g++; } while (avoid && k % 10 === 1 && g < 30); return k; }

  /* величины: строка — сокращение (кг, руб., км), массив — три формы слова (книга, книги, книг) */
  var UGEN = { 'кг': 'килограммов', 'г': 'граммов', 'т': 'тонн', 'ц': 'центнеров', 'м': 'метров', 'см': 'сантиметров', 'км': 'километров',
    'руб.': 'рублей', 'л': 'литров', 'мин': 'минут', 'кв. м': 'квадратных метров' };
  function qty(n, u) { return typeof u === 'string' ? fmt(n) + NB + u : fmt(n) + ' ' + R.plural(n, u); }
  function ugen(u) { return typeof u === 'string' ? UGEN[u] : u[2]; }
  function ulab(u) { return typeof u === 'string' ? u : u[2]; }                     /* краткая пометка для полей ввода */

  /* ================= схема из отрезков ================= */
  /* R.svRodsSVG(rows, o): равные части-«отрезки» друг под другом.
     rows: [{name, parts, seg (текст в каждой части) | segs[], end (подпись справа от отрезка; '?' — красный вопрос),
             hl (сколько первых частей закрасить), ext: {w, txt} (пунктирный «довесок» — разность)}]
     o.total — подпись фигурной скобки справа («всего»). */
  function tw(s, fs) { return String(s).length * fs * 0.57 + 2; }
  R.svRodsSVG = function (rows, o) {
    o = o || {};
    var FS = 14, RH = 30, GAP = 9, TOP = 8, maxU = 0, nameW = 0, endW = 0, desc = [];
    rows.forEach(function (r) {
      var u = r.parts + (r.ext ? r.ext.w : 0);
      if (u > maxU) maxU = u;
      nameW = Math.max(nameW, tw(r.name || '', FS - 1));
      endW = Math.max(endW, r.end ? tw(r.end, FS) + 10 : 0);
      desc.push((r.name || 'отрезок') + ': ' + r.parts + ' ' + pl(r.parts, 'часть', 'части', 'частей') + (r.end ? ' (' + r.end + ')' : ''));
    });
    nameW = nameW ? Math.ceil(Math.min(nameW + 8, 136)) : 0;
    var x0 = nameW + (nameW ? 6 : 4), totW = o.total ? tw(o.total, FS) + 4 : 0, brW = o.total ? 20 : 0;
    var uw = Math.max(22, Math.min(56, Math.floor((410 - x0 - endW - brW - totW - 8) / maxU)));
    var xb = x0 + maxU * uw + endW + 4, W = Math.ceil(xb + brW + totW + 6), n = rows.length;
    var H = TOP + n * RH + (n - 1) * GAP + 8, s = '';
    rows.forEach(function (r, i) {
      var y = TOP + i * (RH + GAP), j, x;
      if (r.name) s += '<text class="sv-nm" x="' + (nameW) + '" y="' + (y + RH / 2 + 5) + '" text-anchor="end" style="font-size:' + (FS - 1) + 'px">' + r.name + '</text>';
      for (j = 0; j < r.parts; j++) {
        x = x0 + j * uw;
        s += '<rect class="sv-r' + (j < (r.hl || 0) ? ' sv-hl' : '') + '" x="' + x + '" y="' + y + '" width="' + uw + '" height="' + RH + '" rx="3"/>';
        var t = r.segs ? r.segs[j] : r.seg;
        if (t != null && t !== '') {
          var fs = tw(t, 13) > uw - 4 ? 10.5 : 13;
          s += '<text x="' + (x + uw / 2) + '" y="' + (y + RH / 2 + 4.5) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + t + '</text>';
        }
      }
      var xe = x0 + r.parts * uw;
      if (r.ext) {
        s += '<rect class="sv-ex" x="' + xe + '" y="' + y + '" width="' + (r.ext.w * uw) + '" height="' + RH + '" rx="3"/>';
        if (r.ext.txt) s += '<text x="' + (xe + r.ext.w * uw / 2) + '" y="' + (y + RH / 2 + 4.5) + '" text-anchor="middle" style="font-size:12px">' + r.ext.txt + '</text>';
        xe += r.ext.w * uw;
      }
      if (r.end) s += '<text class="' + (r.end === '?' ? 'sv-q' : 'sv-en') + '" x="' + (xe + 8) + '" y="' + (y + RH / 2 + 5) + '" style="font-size:' + FS + 'px">' + r.end + '</text>';
    });
    if (o.total) {
      var y1 = TOP + 2, y2 = H - 10, ym = (y1 + y2) / 2;
      s += '<path class="ra" d="M' + xb + ' ' + y1 + 'q6 0 6 7V' + (ym - 6) + 'q0 6 6 6q-6 0 -6 6V' + (y2 - 7) + 'q0 7 -6 7"/>' +
        '<text x="' + (xb + 20) + '" y="' + (ym + 5) + '" style="font-size:' + FS + 'px">' + o.total + '</text>';
      desc.push('всего ' + o.total);
    }
    return '<svg class="fig sv-rods" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Схема из отрезков. ' + desc.join('; ') + '">' + s + '</svg>';
  };

  /* ================= сюжеты: две величины ================= */
  var NAMES = [['Петя', 'Пети'], ['Вася', 'Васи'], ['Костя', 'Кости'], ['Миша', 'Миши'], ['Коля', 'Коли'], ['Саша', 'Саши'], ['Юра', 'Юры'],
    ['Олег', 'Олега'], ['Егор', 'Егора'], ['Тимур', 'Тимура'], ['Аня', 'Ани'], ['Оля', 'Оли'], ['Маша', 'Маши'], ['Даша', 'Даши'],
    ['Катя', 'Кати'], ['Лена', 'Лены'], ['Ира', 'Иры'], ['Настя', 'Насти'], ['Рита', 'Риты'], ['Яна', 'Яны']];
  function twoNames() { var a = pick(NAMES), b; do { b = pick(NAMES); } while (b === a); return [a, b]; }
  var BOOKS = ['книга', 'книги', 'книг'];

  /* Сюжет — фабрика, которая создаёт экземпляр:
     {fam, u, p:[от,до,шаг] (меньшее число), k:[от,до], d:[от,до,шаг] (разность), ok(p,k), okD(p,d),
      ents:[{lab,…},{…}], intro(S), rel(si,k,more), relD(si,d,more), q1(e), qBoth(a,b), qDiff(si)}
     si — номер меньшей величины, more — сказано «большее в k раз больше» (иначе «меньшее в k раз меньше»). */
  function famG(c) {                                          /* «Картофеля привезли в 3 раза больше, чем капусты» */
    var u = c.u, uG = typeof u === 'string' ? UGEN[u] + ' ' : '', E = [c.x, c.y];
    return {
      fam: 'G', u: u, p: c.p, k: c.k, d: c.d, ok: c.ok, okD: c.okD, fix: c.fix, ents: E, intro: c.intro,
      rel: function (si, k, more) {
        var s = E[si], g = E[1 - si];
        return more ? cap(g.gen) + ' ' + c.verb + ' в ' + tms(k) + ' больше, чем ' + (s.sh || s.gen) + '.'
          : cap(s.gen) + ' ' + c.verb + ' в ' + tms(k) + ' меньше, чем ' + (g.sh || g.gen) + '.';
      },
      relD: function (si, d, more) {
        var s = E[si], g = E[1 - si], D = qty(d, u);
        return more ? cap(g.gen) + ' ' + c.verb + ' на ' + D + ' больше, чем ' + (s.sh || s.gen) + '.'
          : cap(s.gen) + ' ' + c.verb + ' на ' + D + ' меньше, чем ' + (g.sh || g.gen) + '.';
      },
      q1: function (e) { return 'Сколько ' + uG + e.gen + ' ' + c.verb + '?'; },
      qBoth: function (a, b) { return 'Сколько ' + uG + a.gen + ' и сколько ' + uG + b.gen + ' ' + c.verb + '?'; },
      qDiff: function (si) { return 'На сколько ' + uG + E[1 - si].gen + ' ' + c.verb + ' больше, чем ' + (E[si].sh || E[si].gen) + '?'; }
    };
  }
  function famO(c) {                                          /* «У Васи в 3 раза больше денег, чем у Пети» */
    var nm = twoNames(), u = c.u, uG = ugen(u), E = nm.map(function (n) { return { lab: 'у ' + n[1], gen: n[1] }; });
    return {
      fam: 'O', u: u, p: c.p, k: c.k, d: c.d, ok: c.ok, okD: c.okD, ents: E,
      intro: function (S) { return 'У ' + E[0].gen + ' и ' + E[1].gen + ' вместе ' + qty(S, u) + '.'; },
      rel: function (si, k, more) {
        var s = E[si], g = E[1 - si];
        return more ? 'У ' + g.gen + ' в ' + tms(k) + ' больше ' + c.thing + ', чем у ' + s.gen + '.'
          : 'У ' + s.gen + ' в ' + tms(k) + ' меньше ' + c.thing + ', чем у ' + g.gen + '.';
      },
      relD: function (si, d, more) {
        var s = E[si], g = E[1 - si], D = qty(d, u);
        return more ? 'У ' + g.gen + ' на ' + D + ' больше, чем у ' + s.gen + '.' : 'У ' + s.gen + ' на ' + D + ' меньше, чем у ' + g.gen + '.';
      },
      q1: function (e) { return 'Сколько ' + uG + ' у ' + e.gen + '?'; },
      qBoth: function (a, b) { return 'Сколько ' + uG + ' у ' + a.gen + ' и сколько у ' + b.gen + '?'; },
      qDiff: function (si) { return 'На сколько ' + uG + ' у ' + E[1 - si].gen + ' больше, чем у ' + E[si].gen + '?'; }
    };
  }
  function famC(c) {                                          /* «Мама в 4 раза старше дочери» */
    var u = c.u, E = c.ents, A = c.adj;
    return {
      fam: 'C', u: u, p: c.p, k: c.k, d: c.d, ok: c.ok, okD: c.okD, fix: c.fix, ents: E, intro: c.intro,
      rel: function (si, k, more) {
        var s = E[si], g = E[1 - si];
        return more ? cap(g.nom) + ' в ' + tms(k) + ' ' + A[0] + ' ' + s.gen + '.' : cap(s.nom) + ' в ' + tms(k) + ' ' + A[1] + ' ' + g.gen + '.';
      },
      relD: function (si, d, more) {
        var s = E[si], g = E[1 - si], D = qty(d, u);
        return more ? cap(g.nom) + ' на ' + D + ' ' + A[0] + ' ' + s.gen + '.' : cap(s.nom) + ' на ' + D + ' ' + A[1] + ' ' + g.gen + '.';
      },
      q1: function (e) { return e.q; },
      qBoth: function () { return c.qBoth; },
      qDiff: function (si) { return 'На сколько ' + ugen(u) + ' ' + E[1 - si].nom + ' ' + A[0] + ' ' + E[si].gen + '?'; }
    };
  }
  function famD(c) {                                          /* «Во второй день турист прошёл в 2 раза больше, чем в первый» */
    var u = c.u, E = [{ lab: 'первый день', day: 'в первый день' }, { lab: 'второй день', day: 'во второй день' }], uG = ugen(u), sv = c.subj + ' ' + c.verb;
    return {
      fam: 'D', u: u, p: c.p, k: c.k, d: c.d, ok: c.ok, okD: c.okD, ents: E,
      intro: function (S) { return c.intro ? c.intro(qty(S, u)) : 'За два дня ' + sv + ' ' + qty(S, u) + '.'; },
      rel: function (si, k, more) {
        var s = E[si], g = E[1 - si];
        return more ? cap(g.day) + ' ' + sv + ' в ' + tms(k) + ' больше, чем ' + s.day + '.' : cap(s.day) + ' ' + sv + ' в ' + tms(k) + ' меньше, чем ' + g.day + '.';
      },
      relD: function (si, d, more) {
        var s = E[si], g = E[1 - si], D = qty(d, u);
        return more ? cap(g.day) + ' ' + sv + ' на ' + D + ' больше, чем ' + s.day + '.' : cap(s.day) + ' ' + sv + ' на ' + D + ' меньше, чем ' + g.day + '.';
      },
      q1: function (e) { return 'Сколько ' + uG + ' ' + sv + ' ' + e.day + '?'; },
      qBoth: function () { return 'Сколько ' + uG + ' ' + sv + ' в каждый из этих дней?'; },
      qDiff: function (si) { return 'На сколько ' + uG + ' больше ' + sv + ' ' + E[1 - si].day + ', чем ' + E[si].day + '?'; }
    };
  }

  var STORIES = [
    /* товары и урожай */
    function () { return famG({ u: 'кг', p: [10, 90, 5], k: [2, 8], verb: 'привезли', x: { lab: 'картофель', gen: 'картофеля' }, y: { lab: 'капуста', gen: 'капусты' },
      intro: function (S) { return 'В магазин привезли ' + qty(S, 'кг') + ' овощей — картофель и капусту.'; } }); },
    function () { return famG({ u: 'ц', p: [10, 80, 5], k: [2, 6], verb: 'собрали', x: { lab: 'пшеница', gen: 'пшеницы' }, y: { lab: 'рожь', gen: 'ржи' },
      intro: function (S) { return 'С двух полей собрали ' + qty(S, 'ц') + ' зерна — пшеницу и рожь.'; } }); },
    function () { return famG({ u: 'кг', p: [8, 60, 2], k: [2, 5], verb: 'собрали', x: { lab: 'яблоки', gen: 'яблок' }, y: { lab: 'груши', gen: 'груш' },
      intro: function (S) { return 'В саду собрали ' + qty(S, 'кг') + ' фруктов — яблоки и груши.'; } }); },
    function () { return famG({ u: 'т', p: [2, 15, 1], k: [2, 6], verb: 'привезли', x: { lab: 'песок', gen: 'песка' }, y: { lab: 'щебень', gen: 'щебня' },
      intro: function (S) { return 'На стройку привезли ' + qty(S, 'т') + ' песка и щебня.'; } }); },
    function () { return famG({ u: 'кг', p: [10, 60, 5], k: [2, 5], verb: 'собрали', x: { lab: 'огурцы', gen: 'огурцов' }, y: { lab: 'помидоры', gen: 'помидоров' },
      intro: function (S) { return 'В теплице собрали ' + qty(S, 'кг') + ' овощей — огурцы и помидоры.'; } }); },
    function () { return famG({ u: 'л', p: [2, 20, 1], k: [3, 9], fix: true, verb: 'получилось', x: { lab: 'сливки', gen: 'сливок' }, y: { lab: 'снятое молоко', gen: 'снятого молока' },
      intro: function (S) { return 'Из ' + qty(S, 'л') + ' молока получили сливки и снятое молоко.'; } }); },
    function () { return famG({ u: BOOKS, p: [20, 180, 10], k: [2, 6], verb: 'было', x: { lab: 'художественные', gen: 'художественных книг', sh: 'художественных' }, y: { lab: 'учебники', gen: 'учебников' },
      intro: function (S) { return 'В школьной библиотеке всего ' + qty(S, BOOKS) + '. Это художественные книги и учебники.'; } }); },
    function () { return famG({ u: ['дерево', 'дерева', 'деревьев'], p: [5, 40, 1], k: [2, 6], verb: 'посадили', x: { lab: 'липы', gen: 'лип' }, y: { lab: 'клёны', gen: 'клёнов' },
      intro: function (S) { return 'В парке посадили ' + qty(S, ['дерево', 'дерева', 'деревьев']) + ' — липы и клёны.'; } }); },
    function () { return famG({ u: ['ручка', 'ручки', 'ручек'], p: [10, 90, 5], k: [2, 6], verb: 'продали', x: { lab: 'синие ручки', gen: 'синих ручек', sh: 'синих' }, y: { lab: 'чёрные ручки', gen: 'чёрных ручек', sh: 'чёрных' },
      intro: function (S) { return 'В киоске за неделю продали ' + qty(S, ['ручка', 'ручки', 'ручек']) + ' — синих и чёрных.'; } }); },
    function () { return famG({ u: ['птица', 'птицы', 'птиц'], p: [6, 40, 2], k: [2, 6], verb: 'было', x: { lab: 'утки', gen: 'уток' }, y: { lab: 'гуси', gen: 'гусей' },
      intro: function (S) { return 'На пруду плавают ' + qty(S, ['птица', 'птицы', 'птиц']) + ' — утки и гуси.'; } }); },
    /* у двух человек */
    function () { return famO({ u: 'руб.', thing: 'денег', p: [20, 600, 10], k: [2, 6] }); },
    function () { return famO({ u: ['марка', 'марки', 'марок'], thing: 'марок', p: [5, 60, 1], k: [2, 6] }); },
    function () { return famO({ u: ['наклейка', 'наклейки', 'наклеек'], thing: 'наклеек', p: [10, 80, 2], k: [2, 5] }); },
    function () { return famO({ u: ['открытка', 'открытки', 'открыток'], thing: 'открыток', p: [4, 40, 1], k: [2, 6] }); },
    function () { return famO({ u: ['значок', 'значка', 'значков'], thing: 'значков', p: [4, 30, 1], k: [2, 6] }); },
    /* сравнение прилагательным */
    function () { return famC({ u: 'кг', p: [2, 4, 1], k: [2, 4], fix: true, ok: function (p, k) { return p * k <= 10; }, adj: ['тяжелее', 'легче'], qBoth: 'Сколько килограммов весит каждый плод?',
      ents: [{ lab: 'дыня', nom: 'дыня', gen: 'дыни', q: 'Сколько килограммов весит дыня?' }, { lab: 'арбуз', nom: 'арбуз', gen: 'арбуза', q: 'Сколько килограммов весит арбуз?' }],
      intro: function (S) { return 'Арбуз и дыня весят вместе ' + qty(S, 'кг') + '.'; } }); },
    function () { return famC({ u: 'кг', p: [3, 9, 1], k: [2, 4], fix: true, ok: function (p, k) { return p * k <= 24; }, adj: ['тяжелее', 'легче'], qBoth: 'Сколько килограммов весит каждая вещь?',
      ents: [{ lab: 'рюкзак', nom: 'рюкзак', gen: 'рюкзака', q: 'Сколько килограммов весит рюкзак?' }, { lab: 'чемодан', nom: 'чемодан', gen: 'чемодана', q: 'Сколько килограммов весит чемодан?' }],
      intro: function (S) { return 'Чемодан и рюкзак весят вместе ' + qty(S, 'кг') + '.'; } }); },
    function () { return famC({ u: ['год', 'года', 'лет'], p: [7, 14, 1], k: [3, 5], d: [24, 36, 2], fix: true, adj: ['старше', 'младше'], qBoth: 'Сколько лет каждому из них?',
      ok: function (p, k) { return p * k >= 24 && p * k <= 55; }, okD: function (p, d) { return p + d <= 55; },
      ents: [{ lab: 'сын', nom: 'сын', gen: 'сына', q: 'Сколько лет сыну?' }, { lab: 'отец', nom: 'отец', gen: 'отца', q: 'Сколько лет отцу?' }],
      intro: function (S) { return 'Отцу и сыну вместе ' + qty(S, ['год', 'года', 'лет']) + '.'; } }); },
    function () { return famC({ u: ['год', 'года', 'лет'], p: [6, 12, 1], k: [3, 4], d: [22, 32, 2], fix: true, adj: ['старше', 'младше'], qBoth: 'Сколько лет каждой из них?',
      ok: function (p, k) { return p * k >= 24 && p * k <= 48; }, okD: function (p, d) { return p + d <= 48; },
      ents: [{ lab: 'дочь', nom: 'дочь', gen: 'дочери', q: 'Сколько лет дочери?' }, { lab: 'мама', nom: 'мама', gen: 'мамы', q: 'Сколько лет маме?' }],
      intro: function (S) { return 'Маме и дочери вместе ' + qty(S, ['год', 'года', 'лет']) + '.'; } }); },
    function () { return famC({ u: ['год', 'года', 'лет'], p: [6, 10, 1], k: [6, 9], d: [50, 62, 2], fix: true, adj: ['старше', 'младше'], qBoth: 'Сколько лет каждой из них?',
      ok: function (p, k) { return p * k >= 54 && p * k <= 80; }, okD: function (p, d) { return p + d <= 75; },
      ents: [{ lab: 'внучка', nom: 'внучка', gen: 'внучки', q: 'Сколько лет внучке?' }, { lab: 'бабушка', nom: 'бабушка', gen: 'бабушки', q: 'Сколько лет бабушке?' }],
      intro: function (S) { return 'Бабушке и внучке вместе ' + qty(S, ['год', 'года', 'лет']) + '.'; } }); },
    function () { return famC({ u: 'м', p: [2, 30, 1], k: [2, 6], adj: ['длиннее', 'короче'], qBoth: 'Найди длину каждого куска в метрах.',
      ents: [{ lab: 'первый кусок', nom: 'первый кусок', gen: 'первого куска', q: 'Найди длину первого куска в метрах.' }, { lab: 'второй кусок', nom: 'второй кусок', gen: 'второго куска', q: 'Найди длину второго куска в метрах.' }],
      intro: function (S) { return 'Верёвку длиной ' + qty(S, 'м') + ' разрезали на два куска.'; } }); },
    function () { return famC({ u: 'см', p: [10, 80, 5], k: [2, 5], adj: ['длиннее', 'короче'], qBoth: 'Найди длину каждой части в сантиметрах.',
      ents: [{ lab: 'первая часть', nom: 'первая часть', gen: 'первой части', q: 'Найди длину первой части в сантиметрах.' }, { lab: 'вторая часть', nom: 'вторая часть', gen: 'второй части', q: 'Найди длину второй части в сантиметрах.' }],
      intro: function (S) { return 'Доску длиной ' + qty(S, 'см') + ' распилили на две части.'; } }); },
    function () { return famC({ u: 'руб.', p: [10, 60, 5], k: [2, 6], fix: true, adj: ['дороже', 'дешевле'], qBoth: 'Сколько рублей стоит каждая покупка?',
      ents: [{ lab: 'открытка', nom: 'открытка', gen: 'открытки', q: 'Сколько рублей стоит открытка?' }, { lab: 'книга', nom: 'книга', gen: 'книги', q: 'Сколько рублей стоит книга?' }],
      intro: function (S) { return 'Книга и открытка стоят вместе ' + qty(S, 'руб.') + '.'; } }); },
    function () { return famC({ u: 'руб.', p: [20, 90, 10], k: [2, 5], fix: true, adj: ['дороже', 'дешевле'], qBoth: 'Сколько рублей стоит каждая вещь?',
      ents: [{ lab: 'кепка', nom: 'кепка', gen: 'кепки', q: 'Сколько рублей стоит кепка?' }, { lab: 'футболка', nom: 'футболка', gen: 'футболки', q: 'Сколько рублей стоит футболка?' }],
      intro: function (S) { return 'Футболка и кепка стоят вместе ' + qty(S, 'руб.') + '.'; } }); },
    function () { return famC({ u: 'руб.', p: [30, 120, 10], k: [2, 4], fix: true, adj: ['дороже', 'дешевле'], qBoth: 'Сколько рублей стоит каждая вещь?',
      ents: [{ lab: 'скакалка', nom: 'скакалка', gen: 'скакалки', q: 'Сколько рублей стоит скакалка?' }, { lab: 'мяч', nom: 'мяч', gen: 'мяча', q: 'Сколько рублей стоит мяч?' }],
      intro: function (S) { return 'Мяч и скакалка стоят вместе ' + qty(S, 'руб.') + '.'; } }); },
    /* по дням */
    function () { return famD({ u: 'км', p: [4, 24, 1], k: [2, 4], subj: 'турист', verb: 'прошёл' }); },
    function () { return famD({ u: ['страница', 'страницы', 'страниц'], p: [10, 60, 5], k: [2, 4], subj: 'Лена', verb: 'прочитала' }); },
    function () { return famD({ u: ['деталь', 'детали', 'деталей'], p: [30, 150, 10], k: [2, 4], subj: 'цех', verb: 'выпустил' }); },
    function () { return famD({ u: 'кг', p: [10, 60, 5], k: [2, 4], subj: 'рыбаки', verb: 'поймали',
      intro: function (Sq) { return 'За два дня рыбаки поймали ' + Sq + ' рыбы.'; } }); },
    function () { return famD({ u: ['кирпич', 'кирпича', 'кирпичей'], p: [100, 900, 50], k: [2, 3], subj: 'бригада', verb: 'уложила' }); },
    function () { return famD({ u: 'км', p: [10, 60, 5], k: [2, 4], subj: 'велосипедист', verb: 'проехал' }); }
  ];

  /* выбор чисел для двух величин.
     o: rel ('times' | 'diff'), kmin/kmax, pmin/pmax (меньшее число), S:[от,до] (сумма), fams (семейства), dir ('more' | 'less') */
  function makePair(o) {
    var rel = o.rel || 'times', tries = 0, st, p, k = 0, d = 0, S, step, pLo, pHi, kLo, kHi, dd;
    if (rel === 'mix') rel = Math.random() < 0.5 ? 'times' : 'diff';
    for (;;) {
      if (++tries > 3000) throw new Error('makePair: нет подходящих чисел ' + JSON.stringify(o));
      st = pick(STORIES)();
      if (o.fams && o.fams.indexOf(st.fam) < 0) continue;
      step = st.p[2];
      pLo = Math.max(st.p[0], Math.ceil((o.pmin || 0) / step) * step);
      pHi = Math.min(st.p[1], o.pmax || 1e9);
      if (Math.ceil(pLo / step) > Math.floor(pHi / step)) continue;
      p = rand(Math.ceil(pLo / step), Math.floor(pHi / step)) * step;
      if (rel === 'times') {
        kLo = Math.max(o.kmin || 2, st.k[0]); kHi = Math.min(o.kmax || 99, st.k[1]);
        if (kLo > kHi) continue;
        k = chooseK(kLo, kHi, true);
        if (st.ok && !st.ok(p, k)) continue;
        S = p * (k + 1);
      } else {
        dd = st.d || [step, 2 * st.p[1], step];
        d = rand(Math.ceil(dd[0] / dd[2]), Math.floor(dd[1] / dd[2])) * dd[2];
        if (d < 2 || d === p || (typeof st.u !== 'string' && d % 10 === 1)) continue;
        if (!st.d && d > 2 * p) continue;
        if (st.okD && !st.okD(p, d)) continue;
        S = 2 * p + d;
      }
      if (o.S && (S < o.S[0] || S > o.S[1])) continue;
      break;
    }
    var more = o.dir ? o.dir === 'more' : Math.random() < 0.6;
    return { st: st, si: st.fix ? 0 : rand(0, 1), p: p, k: k, d: d, S: S, more: more, rel: rel };
  }

  /* схема к решению двух величин */
  function pairRods(P, solved) {
    var st = P.st, u = st.u, s = st.ents[P.si], g = st.ents[1 - P.si], big = P.rel === 'times' ? P.p * P.k : P.p + P.d;
    var rows = [];
    if (P.rel === 'times') {
      rows.push({ name: s.lab, parts: 1, seg: solved ? fmt(P.p) : '', end: solved ? '= ' + fmt(P.p) : '?', hl: 1 });
      rows.push({ name: g.lab, parts: P.k, seg: solved ? fmt(P.p) : '', end: solved ? '= ' + fmt(big) : '?' });
    } else {
      rows.push({ name: s.lab, parts: 1, seg: solved ? fmt(P.p) : '', end: solved ? '= ' + fmt(P.p) : '?', hl: 1 });
      rows.push({ name: g.lab, parts: 1, seg: solved ? fmt(P.p) : '', ext: { w: 0.8, txt: '+' + fmt(P.d) }, end: solved ? '= ' + fmt(big) : '?' });
    }
    return R.svRodsSVG(rows, { total: qty(P.S, u) });
  }

  /* разбор двух величин: шаги как список строк */
  function pairSteps(P, ask) {
    var st = P.st, u = st.u, s = st.ents[P.si], g = st.ents[1 - P.si], p = P.p, k = P.k, d = P.d, S = P.S, big = P.rel === 'times' ? p * k : p + d, L = [];
    if (P.rel === 'times') {
      L.push('Меньшее (' + s.lab + ') примем за 1 часть. Большее (' + g.lab + ') в ' + tms(k) + ' больше — это ' + partsW(k) + '.');
      L.push('Всего частей: 1 + ' + k + ' = ' + (k + 1) + '.');
      L.push('Одна часть — это меньшее число: ' + fmt(S) + ' : ' + (k + 1) + ' = ' + fmt(p) + ' (' + s.lab + ').');
      L.push('Большее число: ' + fmt(p) + ' × ' + k + ' = ' + fmt(big) + ' (' + g.lab + ').');
      if (ask === 'diff') L.push('Разность: ' + fmt(big) + ' − ' + fmt(p) + ' = ' + fmt(big - p) + '.');
      L.push('Проверка: ' + fmt(p) + ' + ' + fmt(big) + ' = ' + fmt(S) + '; ' + fmt(big) + ' : ' + fmt(p) + ' = ' + k + '.');
    } else {
      L.push('Слова «на ' + qty(d, u) + '» говорят о разности, а не о частях. Уберём её из суммы: ' + fmt(S) + ' − ' + fmt(d) + ' = ' + fmt(S - d) + '.');
      L.push('Осталось поровну на два числа: ' + fmt(S - d) + ' : 2 = ' + fmt(p) + ' — меньшее число (' + s.lab + ').');
      L.push('Большее на ' + fmt(d) + ' больше: ' + fmt(p) + ' + ' + fmt(d) + ' = ' + fmt(big) + ' (' + g.lab + ').');
      L.push('Проверка: ' + fmt(p) + ' + ' + fmt(big) + ' = ' + fmt(S) + '; ' + fmt(big) + ' − ' + fmt(p) + ' = ' + fmt(d) + '.');
    }
    return L;
  }

  /* задача про две величины: o.ask — 'both' | 'small' | 'big' | 'diff' (можно массивом) */
  reg('svStory', function (o) {
    var P = makePair(o), st = P.st, u = st.u, ask = Array.isArray(o.ask) ? pick(o.ask) : (o.ask || 'both'), si = P.si, s = st.ents[si], g = st.ents[1 - si];
    if (P.rel === 'diff' && ask === 'diff') ask = 'both';
    var big = P.rel === 'times' ? P.p * P.k : P.p + P.d;
    var relTxt = P.rel === 'times' ? st.rel(si, P.k, P.more) : st.relD(si, P.d, P.more);
    var q, ans, kind = 'num', fields, ansTxt, suf = typeof u === 'string' ? ', ' + u : '';
    if (ask === 'both') {
      var first = Math.random() < 0.5 ? si : 1 - si, a = st.ents[first], b = st.ents[1 - first], va = first === si ? P.p : big, vb = first === si ? big : P.p;
      q = st.qBoth(a, b); kind = 'nums'; ans = [va, vb];
      fields = [{ label: a.lab + suf }, { label: b.lab + suf }];
      ansTxt = a.lab + ' — ' + qty(va, u) + ', ' + b.lab + ' — ' + qty(vb, u);
    } else if (ask === 'small') {
      q = st.q1(s); ans = P.p; ansTxt = qty(P.p, u) + ' (' + s.lab + ')';
    } else if (ask === 'big') {
      q = st.q1(g); ans = big; ansTxt = qty(big, u) + ' (' + g.lab + ')';
    } else {
      q = st.qDiff(si); ans = big - P.p; ansTxt = qty(big - P.p, u);
    }
    var hint = P.rel === 'times'
      ? 'Меньшее число возьми за 1 часть. Сколько частей у большего? Сколько частей вместе? На сколько частей делить сумму?'
      : 'Слово «на» — это разность, а не части. Убери разность из суммы: останутся два одинаковых числа.';
    var out = { kind: kind, html: st.intro(P.S) + ' ' + relTxt + ' ' + q, answer: ans, hint: hint,
      explain: pairRods(P, true) + stepsL(pairSteps(P, ask), ansTxt) };
    if (fields) out.fields = fields;
    return out;
  });

  /* ================= смеси: «части» ================= */
  var MIXES = [
    { loc: 'в компоте', A: 'чернослива', B: 'изюма', u: 'г', pr: [10, 60, 10] },
    { loc: 'в гоголь-моголе', A: 'яиц', B: 'молока', u: 'г', pr: [20, 100, 10] },
    { loc: 'в сплаве', A: 'олова', B: 'свинца', u: 'кг', pr: [2, 20, 1] },
    { loc: 'в корзине', A: 'белых грибов', B: 'остальных грибов', u: ['гриб', 'гриба', 'грибов'], pr: [2, 12, 1] },
    { loc: 'в растворе', A: 'цемента', B: 'песка', u: 'кг', pr: [5, 30, 5] },
    { loc: 'в смеси', A: 'овса', B: 'ячменя', u: 'кг', pr: [4, 40, 2] },
    { loc: 'в сиропе', A: 'сахара', B: 'воды', u: 'г', pr: [50, 200, 50] },
    { loc: 'в салате', A: 'огурцов', B: 'помидоров', u: 'г', pr: [50, 200, 50] },
    { loc: 'в букете', A: 'ромашек', B: 'васильков', u: ['цветок', 'цветка', 'цветков'], pr: [2, 10, 1] }
  ];
  function mixPair(o) {
    var m = pick(MIXES), step = m.pr[2], p = rand(Math.ceil(m.pr[0] / step), Math.floor(m.pr[1] / step)) * step;
    var k = rand(o.kmin || 2, o.kmax || 6);
    return { m: m, p: p, k: k };
  }
  function partsLine(m, k) { return cap(m.loc) + ' ' + m.A + ' — 1 часть, а ' + m.B + ' — ' + partsW(k) + '.'; }

  /* подготовительные упражнения: o.type — 'k' | 'less' | 'total' | 'one' | 'many' | 'words' | 'mix' */
  reg('svParts', function (o) {
    var types = ['k', 'less', 'total', 'one', 'many', 'words'];
    var type = o.type === 'mix' || !o.type ? pick(o.types || types) : o.type;
    var X = mixPair(o), m = X.m, p = X.p, k = X.k, u = m.u;
    var line = partsLine(m, k), T = k + 1;
    if (type === 'k') {
      return { kind: 'num', html: line + ' Во сколько раз ' + m.B + ' больше, чем ' + m.A + '?', answer: k,
        hint: 'Меньшее количество — 1 часть. Сколько таких частей у большего?',
        explain: 'Количество ' + m.A + ' — 1 часть, количество ' + m.B + ' — ' + partsW(k) + '. Значит, ' + m.B + ' в ' + tms(k) + ' больше, чем ' + m.A + '. Ответ: ' + k + '.' };
    }
    if (type === 'less') {
      return { kind: 'num', html: cap(m.loc) + ' ' + m.B + ' — ' + partsW(k) + ', а ' + m.A + ' — 1 часть. Во сколько раз ' + m.A + ' меньше, чем ' + m.B + '?', answer: k,
        hint: 'Сколько раз по одной части укладывается в большем количестве?',
        explain: 'Количество ' + m.B + ' — ' + partsW(k) + ', количество ' + m.A + ' — 1 часть. Значит, ' + m.A + ' в ' + tms(k) + ' меньше, чем ' + m.B + '. Ответ: ' + k + '.' };
    }
    if (type === 'total') {
      return { kind: 'num', html: cap(m.loc) + ' ' + m.B + ' в ' + tms(k) + ' больше, чем ' + m.A + '. Сколько всего равных частей ' + m.loc + ', если количество ' + m.A + ' принять за одну часть?', answer: T,
        hint: 'У меньшего — 1 часть. Сколько частей у большего? Сложи.',
        explain: 'Меньшее — 1 часть. Большее в ' + tms(k) + ' больше — это ' + partsW(k) + '. Всего: 1 + ' + k + ' = ' + T + '. Ответ: ' + T + '.' };
    }
    if (type === 'one') {
      var S = p * T;
      return { kind: 'num', html: cap(m.loc) + ' всего ' + partsW(T) + ', вместе они составляют ' + qty(S, u) + '. Сколько ' + ugen(u) + ' в одной части?', answer: p,
        hint: 'Одна часть — это сумма, разделённая на число всех частей.',
        explain: fmt(S) + ' : ' + T + ' = ' + fmt(p) + '. Ответ: ' + fmt(p) + '.' };
    }
    if (type === 'many') {
      return { kind: 'num', html: cap(m.loc) + ' одна часть — это ' + qty(p, u) + '. Сколько ' + ugen(u) + ' составляют ' + partsW(k) + ' ' + m.B + '?', answer: p * k,
        hint: 'Частей ' + k + ', и в каждой одно и то же количество.',
        explain: fmt(p) + ' × ' + k + ' = ' + fmt(p * k) + '. Ответ: ' + fmt(p * k) + '.' };
    }
    /* words: «часть» → «в … раз» (выбор) */
    var more = Math.random() < 0.5;
    var ok = more ? cap(m.B) + ' в ' + tms(k) + ' больше, чем ' + m.A : cap(m.A) + ' в ' + tms(k) + ' меньше, чем ' + m.B;
    var bad = more
      ? [cap(m.A) + ' в ' + tms(k) + ' больше, чем ' + m.B, cap(m.B) + ' на ' + k + ' больше, чем ' + m.A, cap(m.B) + ' в ' + tms(k + 1) + ' больше, чем ' + m.A]
      : [cap(m.B) + ' в ' + tms(k) + ' меньше, чем ' + m.A, cap(m.A) + ' на ' + k + ' меньше, чем ' + m.B, cap(m.A) + ' в ' + tms(k + 1) + ' меньше, чем ' + m.B];
    var opts = shuffle([ok].concat(bad));
    return { kind: 'choice', html: line + ' Как сказать то же самое словами «в … раз»?', options: opts, answer: opts.indexOf(ok), wide: true,
      hint: 'Сколько частей приходится на меньшее количество и сколько — на большее? Во сколько раз второе больше первого?',
      explain: 'Количество ' + m.A + ' — 1 часть, количество ' + m.B + ' — ' + partsW(k) + '. Значит, ' + m.B + ' в ' + tms(k) + ' больше, чем ' + m.A + ' (или ' + m.A + ' в ' + tms(k) + ' меньше, чем ' + m.B + '). Слова «на ' + k + ' больше» говорили бы о разности, а не о частях.' };
  });
  /* ================= числа без сюжета ================= */
  var REF3 = [[2, 3], [2, 4], [2, 5], [3, 4], [3, 5], [4, 5]];
  var REF4 = [[2, 3, 4], [2, 3, 5], [2, 4, 5], [3, 4, 5]];
  var ORD3 = ['первое', 'второе', 'третье', 'четвёртое'];
  var ORDN = ['первое число', 'второе число', 'третье число', 'четвёртое число'];

  /* шаги разбора для нескольких чисел: names — названия, parts — части, p — одна часть, how — пояснение к частям */
  function multiSteps(names, parts, p, S, how) {
    var T = sumOf(parts), L = [], i, pr = [];
    L.push(how);
    L.push('Всего частей: ' + parts.join(' + ') + ' = ' + T + '.');
    L.push('Одна часть — это ' + names[0] + ': ' + fmt(S) + ' : ' + T + ' = ' + fmt(p) + '.');
    for (i = 1; i < parts.length; i++) {
      if (parts[i] === 1) L.push(cap(names[i]) + ' тоже равно одной части: ' + fmt(p) + '.');
      else L.push(cap(names[i]) + ': ' + fmt(p) + ' × ' + parts[i] + ' = ' + fmt(p * parts[i]) + '.');
    }
    for (i = 0; i < parts.length; i++) pr.push(fmt(p * parts[i]));
    L.push('Проверка: ' + pr.join(' + ') + ' = ' + fmt(S) + '.');
    return L;
  }
  function multiRods(names, parts, p, S) {
    var rows = parts.map(function (c, i) { return { name: names[i], parts: c, seg: fmt(p), hl: i === 0 ? 1 : 0, end: '= ' + fmt(p * c) }; });
    return R.svRodsSVG(rows, { total: fmt(S) });
  }

  /* o.mode: 'two' | 'three' | 'chain' | 'four'; для 'two' o.rel: 'times' | 'quot' | 'diff' | 'mix' */
  reg('svNums', function (o) {
    var mode = o.mode || 'two', S, p, k, d, parts, text, names, how, fields, expl, rods;
    if (mode === 'two') {
      var rel = o.rel || 'times';
      if (rel === 'mix') rel = pick(['times', 'quot', 'diff']);
      p = rand(o.pmin || 2, o.pmax || 30);
      if (rel === 'diff') {
        d = rand(2, Math.max(4, p * 2));
        if (d === p) d++;
        S = 2 * p + d;
        text = pick([
          'Найди два числа, если их сумма равна ' + num(S) + ', а одно из них на ' + num(d) + ' больше другого.',
          'Сумма двух чисел равна ' + num(S) + ', а их разность равна ' + num(d) + '. Найди эти числа.',
          'Одно число на ' + num(d) + ' меньше другого, а вместе они составляют ' + num(S) + '. Найди эти числа.']);
        expl = stepsL(['Разность не относится к частям: вычтем её из суммы: ' + fmt(S) + ' − ' + fmt(d) + ' = ' + fmt(S - d) + '.',
          'Осталось два равных числа: ' + fmt(S - d) + ' : 2 = ' + fmt(p) + ' — это меньшее число.',
          'Большее число: ' + fmt(p) + ' + ' + fmt(d) + ' = ' + fmt(p + d) + '.',
          'Проверка: ' + fmt(p) + ' + ' + fmt(p + d) + ' = ' + fmt(S) + '; ' + fmt(p + d) + ' − ' + fmt(p) + ' = ' + fmt(d) + '.'], fmt(p) + ' и ' + fmt(p + d));
        return { kind: 'nums', html: text, answer: [p, p + d], fields: [{ label: 'меньшее число' }, { label: 'большее число' }],
          hint: 'Слово «на» — о разности, а не о частях. Вычти разность из суммы: останутся два одинаковых числа.', explain: expl };
      }
      k = rand(o.kmin || 2, o.kmax || 6);
      S = p * (k + 1);
      var hintT = 'Меньшее число — 1 часть. Сколько частей у большего? Сколько частей вместе?';
      if (rel === 'quot') {
        text = pick([
          'Сумма двух чисел равна ' + num(S) + ', а их частное равно ' + num(k) + '. Найди эти числа.',
          'При делении одного числа на другое в частном получилось ' + num(k) + '. Сумма этих чисел равна ' + num(S) + '. Какие это числа?',
          'Найди два числа, которые при сложении дают ' + num(S) + ', а при делении одного на другое — ' + num(k) + '.']);
        expl = multiRods(['меньшее', 'большее'], [1, k], p, S) + stepsL(['Частное ' + k + ' показывает, что большее число в ' + tms(k) + ' больше меньшего. Меньшее — 1 часть, большее — ' + partsW(k) + '.',
          'Всего частей: 1 + ' + k + ' = ' + (k + 1) + '.', 'Меньшее число: ' + fmt(S) + ' : ' + (k + 1) + ' = ' + fmt(p) + '.', 'Большее число: ' + fmt(p) + ' × ' + k + ' = ' + fmt(p * k) + '.',
          'Проверка: ' + fmt(p) + ' + ' + fmt(p * k) + ' = ' + fmt(S) + '; ' + fmt(p * k) + ' : ' + fmt(p) + ' = ' + k + '.'], fmt(p) + ' и ' + fmt(p * k));
        return { kind: 'nums', html: text, answer: [p, p * k], fields: [{ label: 'меньшее число' }, { label: 'большее число' }],
          hint: 'Частное показывает, во сколько раз одно число больше другого. ' + hintT, explain: expl };
      }
      text = pick([
        'Найди два числа, если их сумма равна ' + num(S) + ', а одно из них в ' + tms(k) + ' больше другого.',
        'Сумма двух чисел равна ' + num(S) + '. Одно из них больше другого в ' + tms(k) + '. Найди эти числа.',
        'Одно число меньше другого в ' + tms(k) + '. Найди эти числа, если их сумма равна ' + num(S) + '.',
        'Найди два числа, сумма которых равна ' + num(S) + ', если одно из них больше другого в ' + tms(k) + '.']);
      expl = multiRods(['меньшее', 'большее'], [1, k], p, S) + stepsL(['Меньшее число — 1 часть, большее в ' + tms(k) + ' больше — ' + partsW(k) + '.',
        'Всего частей: 1 + ' + k + ' = ' + (k + 1) + '.', 'Меньшее число: ' + fmt(S) + ' : ' + (k + 1) + ' = ' + fmt(p) + '.', 'Большее число: ' + fmt(p) + ' × ' + k + ' = ' + fmt(p * k) + '.',
        'Проверка: ' + fmt(p) + ' + ' + fmt(p * k) + ' = ' + fmt(S) + '; ' + fmt(p * k) + ' : ' + fmt(p) + ' = ' + k + '.'], fmt(p) + ' и ' + fmt(p * k));
      return { kind: 'nums', html: text, answer: [p, p * k], fields: [{ label: 'меньшее число' }, { label: 'большее число' }], hint: hintT, explain: expl };
    }
    /* несколько чисел */
    var sub = o.sub;
    if (mode === 'three') sub = sub || pick(['ref', 'low', 'eq']);
    var a, b, c, n;
    if (mode === 'chain') { k = pick(o.chainK || [2, 3]); parts = [1, k, k * k]; sub = 'chain'; }
    else if (mode === 'four') {
      if (Math.random() < 0.5) { var t4 = pick(REF4); parts = [1, t4[0], t4[1], t4[2]]; sub = 'ref4'; }
      else { parts = [1, 2, 4, 8]; sub = 'chain4'; }
    } else if (sub === 'eq') { k = rand(2, 5); parts = [1, 1, k]; }
    else { var pr = pick(REF3); parts = [1, pr[0], pr[1]]; }
    n = parts.length;
    var T = sumOf(parts);
    p = rand(o.pmin || 2, o.pmax || 20);
    S = p * T;
    var words = n === 3 ? 'три числа' : 'четыре числа', tw = n === 3 ? 'трёх' : 'четырёх';
    var Snum = num(S);
    if (sub === 'ref') text = 'Найди три числа, если их сумма равна ' + Snum + ', второе число в ' + tms(parts[1]) + ' больше первого, а третье — в ' + tms(parts[2]) + ' больше первого.';
    else if (sub === 'low') text = 'Сумма трёх чисел равна ' + Snum + '. Первое число в ' + tms(parts[1]) + ' меньше второго и в ' + tms(parts[2]) + ' меньше третьего. Найди эти числа.';
    else if (sub === 'eq') text = 'Найди три числа, если их сумма равна ' + Snum + ', первые два числа равны, а третье в ' + tms(parts[2]) + ' больше каждого из них.';
    else if (sub === 'chain') text = 'Найди три числа, сумма которых равна ' + Snum + ', если каждое следующее число в ' + tms(parts[1]) + ' больше предыдущего.';
    else if (sub === 'ref4') text = 'Найди четыре числа, если их сумма равна ' + Snum + ', второе число в ' + tms(parts[1]) + ' больше первого, третье — в ' + tms(parts[2]) + ' больше первого, а четвёртое — в ' + tms(parts[3]) + ' больше первого.';
    else text = 'Найди четыре числа, если их сумма равна ' + Snum + ', а каждое следующее число в 2 раза больше предыдущего.';
    names = ORDN.slice(0, n).map(function (s) { return s; });
    var nn = ORD3.slice(0, n);
    if (sub === 'eq') how = 'Первое и второе числа равны — это по 1 части. Третье в ' + tms(parts[2]) + ' больше — ' + partsW(parts[2]) + '.';
    else if (sub === 'chain' || sub === 'chain4') how = 'Первое число — 1 часть. Каждое следующее в ' + tms(parts[1]) + ' больше предыдущего: ' + parts.join(', ') + ' ' + R.plural(parts[n - 1], ['часть', 'части', 'частей']) + '.';
    else how = 'Первое число — самое маленькое, примем его за 1 часть. Остальные: ' + parts.slice(1).map(function (c, i) { return nn[i + 1] + ' — ' + partsW(c); }).join(', ') + '.';
    expl = multiRods(nn, parts, p, S) + stepsL(multiSteps(nn, parts, p, S, how), parts.map(function (c) { return fmt(p * c); }).join(', '));
    return { kind: 'nums', html: text, answer: parts.map(function (c) { return p * c; }), fields: ORDN.slice(0, n).map(function (l) { return { label: l }; }),
      hint: 'Первое число — 1 часть (оно самое маленькое). Сколько частей у каждого из остальных? Сколько частей всего?', explain: expl };
  });

  /* обратные задачи: сумма по частям; во сколько раз больше; сумма трёх */
  reg('svBack', function (o) {
    var type = o.type || pick(['sum', 'k', 'three']), p = rand(o.pmin || 3, o.pmax || 40), k = rand(o.kmin || 2, o.kmax || 7), S;
    if (type === 'sum') {
      S = p * (k + 1);
      return { kind: 'num', html: 'Меньшее из двух чисел равно ' + num(p) + ', а большее в ' + tms(k) + ' больше. Найди сумму этих чисел.', answer: S,
        hint: 'Сначала найди большее число, потом сложи оба числа.',
        explain: stepsL(['Большее число: ' + fmt(p) + ' × ' + k + ' = ' + fmt(p * k) + '.', 'Сумма: ' + fmt(p) + ' + ' + fmt(p * k) + ' = ' + fmt(S) + '.',
          'Проверка: частей 1 + ' + k + ' = ' + (k + 1) + ', и ' + fmt(p) + ' × ' + (k + 1) + ' = ' + fmt(S) + '.'], fmt(S)) };
    }
    if (type === 'k') {
      S = p * (k + 1);
      return { kind: 'num', html: 'Сумма двух чисел равна ' + num(S) + ', а меньшее из них — ' + num(p) + '. Во сколько раз большее число больше меньшего?', answer: k,
        hint: 'Найди большее число (вычти меньшее из суммы), потом узнай, во сколько раз оно больше.',
        explain: stepsL(['Большее число: ' + fmt(S) + ' − ' + fmt(p) + ' = ' + fmt(S - p) + '.', 'Во сколько раз оно больше меньшего: ' + fmt(S - p) + ' : ' + fmt(p) + ' = ' + k + '.',
          'Проверка: всего частей ' + fmt(S) + ' : ' + fmt(p) + ' = ' + (k + 1) + ', из них на большее число приходится ' + (k + 1) + ' − 1 = ' + k + '.'], k + ' ' + pl(k, 'раз', 'раза', 'раз')) };
    }
    var pr = pick(REF3);
    S = p * (1 + pr[0] + pr[1]);
    return { kind: 'num', html: 'Первое число равно ' + num(p) + ', второе в ' + tms(pr[0]) + ' больше первого, а третье — в ' + tms(pr[1]) + ' больше первого. Найди сумму трёх чисел.', answer: S,
      hint: 'Найди второе и третье числа, потом сложи все три. Можно и по частям: сколько частей всего?',
      explain: stepsL(['Второе число: ' + fmt(p) + ' × ' + pr[0] + ' = ' + fmt(p * pr[0]) + '.', 'Третье число: ' + fmt(p) + ' × ' + pr[1] + ' = ' + fmt(p * pr[1]) + '.',
        'Сумма: ' + fmt(p) + ' + ' + fmt(p * pr[0]) + ' + ' + fmt(p * pr[1]) + ' = ' + fmt(S) + '.'], fmt(S)) };
  });
  /* ================= выбор способа, проверка, ошибки ================= */
  function storyText(P) {
    var st = P.st;
    return st.intro(P.S) + ' ' + (P.rel === 'times' ? st.rel(P.si, P.k, P.more) : st.relD(P.si, P.d, P.more));
  }

  /* o.type: 'first' | 'small' | 'big' | 'plan' | 'err' (можно массивом в o.types) */
  reg('svPlan', function (o) {
    var type = o.type || pick(o.types || ['first', 'small', 'big', 'plan', 'err']);
    var P = makePair({ rel: 'times', kmin: o.kmin || 2, kmax: o.kmax || 7, S: o.S, dir: o.dir }), S = P.S, k = P.k, p = P.p, T = k + 1;
    var text = storyText(P), opts, ok, ex, hint;
    if (type === 'first') {
      ok = 'Сколько всего равных частей';
      opts = shuffle([ok, 'Сколько приходится на одну часть', 'Чему равно большее число', 'На сколько одно число больше другого']);
      return { kind: 'choice', html: text + ' Что нужно узнать в первую очередь?', options: opts, answer: opts.indexOf(ok), wide: true,
        hint: 'Чтобы узнать, сколько приходится на одну часть, надо знать, на сколько частей делить сумму.',
        explain: 'Сумму надо разделить поровну на все части, поэтому сначала считаем части: меньшее число — 1 часть, большее — ' + partsW(k) + ', вместе 1 + ' + k + ' = ' + T + '. Потом сумму делим на ' + T + ' и получаем одну часть — меньшее число.' };
    }
    if (type === 'small' || type === 'big') {
      var Sx = fmt(S), K = String(k), K1 = '(1 + ' + k + ')';
      var strs;
      if (type === 'small') {
        strs = [Sx + ' : ' + K1, Sx + ' : ' + K, Sx + ' : (' + k + ' − 1)', Sx + ' × ' + K1];
        ex = 'Меньшее число — 1 часть, а всего частей 1 + ' + k + ' = ' + T + '. Значит, меньшее число находят так: ' + Sx + ' : ' + T + ' = ' + fmt(p) + '. Делить на ' + k + ' нельзя: ' + k + ' — это части только большего числа.';
        hint = 'Меньшее число — это одна часть. Сумму делят на число всех частей.';
      } else {
        strs = [Sx + ' : ' + K1 + ' × ' + K, Sx + ' : ' + K + ' × ' + K1, Sx + ' : ' + K1 + ' + ' + K, Sx + ' : ' + K];
        ex = 'Сначала находим одну часть: ' + Sx + ' : ' + K1 + ' = ' + fmt(p) + '. Потом большее число — это ' + partsW(k) + ': ' + fmt(p) + ' × ' + k + ' = ' + fmt(p * k) + '. Одним выражением: ' + Sx + ' : ' + K1 + ' × ' + K + '.';
        hint = 'Большее число — это несколько частей. Сначала найди одну часть, потом умножь на число частей большего.';
      }
      var okS = strs[0];
      opts = shuffle(strs.map(function (s) { return expr(s); }));
      return { kind: 'choice', html: text + ' Каким выражением можно найти ' + (type === 'small' ? 'меньшее' : 'большее') + ' число?', options: opts, answer: opts.indexOf(expr(okS)), wide: false,
        hint: hint, explain: ex };
    }
    if (type === 'plan') {
      var A = ['Сколько всего равных частей?', 'Чему равно меньшее число (одна часть)?', 'Чему равно большее число?'];
      var sets = [A, [A[2], A[0], A[1]], [A[1], A[0], A[2]], [A[2], A[1], A[0]]];
      var texts = sets.map(function (s) { return s.map(function (x, i) { return (i + 1) + ') ' + x; }).join('<br>'); });
      opts = shuffle(texts);
      return { kind: 'choice', html: text + ' Какой план решения верный?', options: opts, answer: opts.indexOf(texts[0]), wide: true,
        hint: 'Что нужно знать, чтобы делить сумму? А что нужно знать, чтобы найти большее число?',
        explain: 'Сначала считаем все части (1 + ' + k + ' = ' + T + '). Потом находим одну часть — это меньшее число (' + fmt(S) + ' : ' + T + ' = ' + fmt(p) + '). И только после этого большее: ' + fmt(p) + ' × ' + k + ' = ' + fmt(p * k) + '.' };
    }
    /* err */
    var v = pick(['div', 'one', 'plus']), pS = fmt(S), pk = fmt(p * k), pp = fmt(p), msg;
    if (v === 'div') {
      msg = 'Ученик начал решение так: «' + pS + ' : ' + k + '». Что в этом неверно?';
      ok = 'Сумму надо делить на число всех частей, то есть на ' + T + ', а не на ' + k;
      opts = shuffle([ok, 'Сумму надо умножать на ' + k, 'Сумму надо делить на ' + (k + 2), 'Ошибки нет: это правильное начало']);
      ex = 'Число ' + k + ' — это части только большего числа. А у меньшего ещё 1 часть. Всего частей 1 + ' + k + ' = ' + T + ', и делить надо на ' + T + ': ' + pS + ' : ' + T + ' = ' + pp + '.';
      hint = 'Сколько частей у меньшего числа? Сколько у большего? На сколько частей поделена вся сумма?';
    } else if (v === 'one') {
      msg = 'Ученик разделил ' + pS + ' на ' + T + ', получил ' + pp + ' и записал ответ: «' + pp + '». Что он забыл?';
      ok = 'Найти и большее число: ' + pp + ' × ' + k + ' = ' + pk;
      opts = shuffle([ok, 'Умножить ' + pp + ' на ' + T, 'Сложить ' + pp + ' и ' + T, 'Ничего: одно число найдено — этого достаточно']);
      ex = 'В задаче просят найти оба числа. ' + pp + ' — одна часть, то есть меньшее число. Большее число — ' + partsW(k) + ': ' + pp + ' × ' + k + ' = ' + pk + '.';
      hint = 'Что просят найти в задаче: одно число или оба?';
    } else {
      msg = 'Ученик нашёл меньшее число ' + pp + ', а большее посчитал так: ' + pp + ' + ' + k + ' = ' + fmt(p + k) + '. Что неверно?';
      ok = 'Большее число в ' + tms(k) + ' больше, поэтому надо ' + pp + ' × ' + k;
      opts = shuffle([ok, 'Надо было вычесть: ' + pp + ' − ' + k, 'Надо было разделить: ' + pp + ' : ' + k, 'Всё верно: «больше» значит «прибавить»']);
      ex = '«В ' + tms(k) + ' больше» значит «умножить на ' + k + '», а не «прибавить ' + k + '». Большее число: ' + pp + ' × ' + k + ' = ' + pk + '.';
      hint = 'Чем отличается «в ' + k + ' раза больше» от «на ' + k + ' больше»?';
    }
    return { kind: 'choice', html: text + ' ' + msg, options: opts, answer: opts.indexOf(ok), wide: true, hint: hint, explain: ex };
  });

  /* проверка найденных чисел по условию */
  reg('svCheck', function (o) {
    var P = makePair({ rel: 'times', kmin: o.kmin || 2, kmax: o.kmax || 7, S: o.S }), st = P.st, S = P.S, k = P.k, p = P.p, big = p * k, u = st.u, si = P.si;
    var scen = pick(['ok', 'sum', 'ratio', 'swap']), vals = [0, 0], a, b;
    if (scen === 'ok') { vals[si] = p; vals[1 - si] = big; }
    else if (scen === 'swap') { vals[si] = big; vals[1 - si] = p; }
    else if (scen === 'sum') {
      var q = p, g = 0; do { q = Math.max(1, p + rand(-3, 3) * (st.p[2] || 1)); g++; } while ((q === p || q * (k + 1) === S) && g < 30);
      if (q === p) q = p + 1;
      vals[si] = q; vals[1 - si] = q * k;
    } else {
      var x = p, g2 = 0;
      do { x = p + rand(1, 4) * (Math.random() < 0.5 ? -1 : 1) * (st.p[2] || 1); g2++; } while ((x <= 0 || x >= S || x === p || x === big || (S - x) % x === 0 && (S - x) / x === k || x % (S - x) === 0 && x / (S - x) === k) && g2 < 60);
      vals[si] = x; vals[1 - si] = S - x;
    }
    var okIdx = { ok: 0, sum: 1, ratio: 2, swap: 3 }[scen];
    var base = ['Решение верное', 'Неверно: сумма найденных чисел не равна ' + fmt(S), 'Неверно: одно число не в ' + tms(k) + ' больше другого', 'Неверно: числа отнесены не к тем величинам'];
    var order = shuffle([0, 1, 2, 3]), opts = order.map(function (i) { return base[i]; });
    var E = st.ents, mine = E[0].lab + ' — ' + qty(vals[0], u) + ', ' + E[1].lab + ' — ' + qty(vals[1], u);
    var sm = vals[0] + vals[1], expl, hi = Math.max(vals[0], vals[1]), lo = Math.min(vals[0], vals[1]);
    if (scen === 'ok') expl = 'Сумма: ' + fmt(vals[0]) + ' + ' + fmt(vals[1]) + ' = ' + fmt(S) + ' — подходит. Отношение: ' + fmt(hi) + ' : ' + fmt(lo) + ' = ' + k + ' — подходит. Большее число стоит у большей величины. Решение верное.';
    else if (scen === 'sum') expl = 'Сумма: ' + fmt(vals[0]) + ' + ' + fmt(vals[1]) + ' = ' + fmt(sm) + ', а по условию должно быть ' + fmt(S) + '. Отношение у этих чисел как раз ' + k + ', но сумма не та. (Верно: ' + fmt(p) + ' и ' + fmt(big) + '.)';
    else if (scen === 'ratio') expl = 'Сумма: ' + fmt(vals[0]) + ' + ' + fmt(vals[1]) + ' = ' + fmt(S) + ' — подходит. Но числа не отличаются в ' + tms(k) + ': ' + fmt(hi) + ' : ' + fmt(lo) + ' не равно ' + k + '. (Верно: ' + fmt(p) + ' и ' + fmt(big) + '.)';
    else expl = 'Сумма и отношение у этих чисел подходят (' + fmt(p) + ' + ' + fmt(big) + ' = ' + fmt(S) + ', ' + fmt(big) + ' : ' + fmt(p) + ' = ' + k + '), но большее число записано у меньшей величины. По условию: ' + E[si].lab + ' — ' + qty(p, u) + ', ' + E[1 - si].lab + ' — ' + qty(big, u) + '.';
    return { kind: 'choice', html: storyText(P) + ' Ученик нашёл: ' + mine + '. Проверь, верно ли решение.', options: opts, answer: order.indexOf(okIdx), wide: true,
      hint: 'Проверь два условия: сумма найденных чисел и то, во сколько раз одно больше другого. Потом посмотри, у какой величины большее число.',
      explain: expl };
  });

  /* части или разность? */
  reg('svKind', function (o) {
    var rel = o.rel || pick(['times', 'diff']), P = makePair({ rel: rel, kmin: o.kmin || 2, kmax: o.kmax || 7, S: o.S });
    var opts = ['Через части: сначала узнать, сколько всего частей', 'Через разность: вычесть разность из суммы, остаток разделить на 2', 'Разделить сумму на число из условия', 'Умножить сумму на число из условия'];
    var ansI = rel === 'times' ? 0 : 1;
    var order = shuffle([0, 1, 2, 3]), os = order.map(function (i) { return opts[i]; });
    var expl = rel === 'times'
      ? 'В условии «в ' + tms(P.k) + ' больше (меньше)» — значит, числа сравнивают по частям: меньшее — 1 часть, большее — ' + partsW(P.k) + '. Делим сумму на ' + partsW(P.k + 1) + '.'
      : 'В условии «на ' + fmt(P.d) + ' больше (меньше)» — это разность, а не части. Вычитаем её из суммы: останутся два равных числа, их делим пополам.';
    return { kind: 'choice', html: storyText(P) + ' Как решать эту задачу?', options: os, answer: order.indexOf(ansI), wide: true,
      hint: 'Посмотри на слова «в … раз» и «на …»: одно из них говорит о частях, другое — о разности.', explain: expl };
  });
  /* ================= три-четыре величины ================= */
  var NUMW = { 3: 'три', 4: 'четыре' };
  function bLoc(c) {
    var o = { u: c.u, p: c.p, maxS: c.maxS || 900, maxV: c.maxV || 900, lab: c.lab, uG: c.uG, qAll: c.qAll, intro: c.intro };
    o.subjPhrase = function (i) { return cap(c.ent[i]) + ' ' + c.mid; };
    o.short = c.short;
    o.eqSent = function (j, k) { return cap(c.short[0] + ' и ' + c.short[1] + ' ' + c.locPl) + ' ' + c.mid + ' поровну, а ' + c.short[2] + ' — в ' + tms(k) + ' больше, чем ' + (c.each || 'в каждом из них') + '.'; };
    o.q1 = function (i) { return 'Сколько ' + c.uG + ' ' + c.mid + ' ' + c.ent[i] + '?'; };
    o.qDiff = function (a, b) { return 'На сколько ' + c.uG + ' больше ' + c.mid + ' ' + c.ent[a] + ', чем ' + c.short[b] + '?'; };
    return o;
  }
  function bSubj(c) {
    var o = { u: c.u, p: c.p, maxS: c.maxS || 900, maxV: c.maxV || 900, lab: c.lab, uG: c.uG, qAll: c.qAll, intro: c.intro };
    o.subjPhrase = function (i) { return cap(c.entLow[i]) + ' ' + c.verb; };
    o.short = c.short;
    o.eqSent = function (j, k) { return cap(c.pair) + ' ' + c.verbPl + ' поровну, а ' + c.short[2] + ' — в ' + tms(k) + ' больше, чем ' + c.each + ' из них.'; };
    o.q1 = function (i) { return 'Сколько ' + c.uG + ' ' + c.obj + ' ' + c.verb + ' ' + c.entLow[i] + '?'; };
    o.qDiff = function (a, b) { return 'На сколько ' + c.uG + ' больше ' + c.verb + ' ' + c.entLow[a] + ', чем ' + c.short[b] + '?'; };
    return o;
  }
  function boysNames() { var a = shuffle(['Петя', 'Вася', 'Костя', 'Миша', 'Коля', 'Саша', 'Юра', 'Олег', 'Егор', 'Тимур']); return a.slice(0, 4); }
  function girlsNames() { var a = shuffle(['Аня', 'Оля', 'Маша', 'Даша', 'Катя', 'Лена', 'Ира', 'Настя', 'Рита', 'Яна']); return a.slice(0, 4); }
  var DAYS = ['в первый день', 'во второй день', 'в третий день', 'в четвёртый день'], DAYSH = ['в первый', 'во второй', 'в третий', 'в четвёртый'];
  var THREE = [
    function () { return bLoc({ u: 'кг', uG: 'килограммов', p: [5, 25, 5], maxV: 80, mid: 'яблок', locPl: 'ящиках',
      lab: ['первый ящик', 'второй ящик', 'третий ящик', 'четвёртый ящик'], ent: ['в первом ящике', 'во втором ящике', 'в третьем ящике', 'в четвёртом ящике'], short: ['в первом', 'во втором', 'в третьем', 'в четвёртом'],
      intro: function (S, n) { return 'В ' + NUMW[n] + ' ящика разложили ' + qty(S, 'кг') + ' яблок.'; }, qAll: 'Сколько килограммов яблок в каждом ящике?' }); },
    function () { return bLoc({ u: ['гриб', 'гриба', 'грибов'], uG: 'грибов', p: [4, 30, 1], maxV: 120, mid: 'грибов', locPl: 'корзинах',
      lab: ['первая корзина', 'вторая корзина', 'третья корзина', 'четвёртая корзина'], ent: ['в первой корзине', 'во второй корзине', 'в третьей корзине', 'в четвёртой корзине'], short: ['в первой', 'во второй', 'в третьей', 'в четвёртой'],
      intro: function (S, n) { return 'В ' + NUMW[n] + ' корзины разложили ' + qty(S, ['гриб', 'гриба', 'грибов']) + '.'; }, qAll: 'Сколько грибов в каждой корзине?' }); },
    function () { return bLoc({ u: 'л', uG: 'литров', p: [10, 80, 5], maxV: 600, mid: 'молока', locPl: 'цистернах',
      lab: ['первая цистерна', 'вторая цистерна', 'третья цистерна', 'четвёртая цистерна'], ent: ['в первой цистерне', 'во второй цистерне', 'в третьей цистерне', 'в четвёртой цистерне'], short: ['в первой', 'во второй', 'в третьей', 'в четвёртой'],
      intro: function (S, n) { return 'В ' + (n === 3 ? 'трёх' : 'четырёх') + ' цистернах всего ' + qty(S, 'л') + ' молока.'; }, qAll: 'Сколько литров молока в каждой цистерне?' }); },
    function () { return bLoc({ u: 'км', uG: 'километров', p: [3, 15, 1], maxV: 32, mid: 'туристы прошли', locPl: 'дни',
      lab: ['первый день', 'второй день', 'третий день', 'четвёртый день'], ent: DAYS, short: DAYSH, each: 'в каждый из них',
      intro: function (S, n) { return 'За ' + NUMW[n] + ' дня туристы прошли ' + qty(S, 'км') + '.'; }, qAll: 'Сколько километров туристы прошли в каждый из этих дней?' }); },
    function () { return bLoc({ u: ['страница', 'страницы', 'страниц'], uG: 'страниц', p: [3, 15, 1], maxV: 100, mid: 'Лена прочитала', locPl: 'дни',
      lab: ['первый день', 'второй день', 'третий день', 'четвёртый день'], ent: DAYS, short: DAYSH, each: 'в каждый из них',
      intro: function (S, n) { return 'За ' + NUMW[n] + ' дня Лена прочитала ' + qty(S, ['страница', 'страницы', 'страниц']) + '.'; }, qAll: 'Сколько страниц Лена прочитала в каждый из этих дней?' }); },
    function () { return bSubj({ u: 'м', uG: 'метров', p: [10, 80, 5], maxV: 400, obj: 'дороги', verb: 'отремонтировала', verbPl: 'отремонтировали', each: 'каждая',
      lab: ['первая бригада', 'вторая бригада', 'третья бригада', 'четвёртая бригада'], entLow: ['первая бригада', 'вторая бригада', 'третья бригада', 'четвёртая бригада'], short: ['первая', 'вторая', 'третья', 'четвёртая'],
      pair: 'первая и вторая бригады',
      intro: function (S, n) { return (n === 3 ? 'Три' : 'Четыре') + ' бригады вместе отремонтировали ' + qty(S, 'м') + ' дороги.'; }, qAll: 'Сколько метров дороги отремонтировала каждая бригада?' }); },
    function () { return bSubj({ u: 'кг', uG: 'килограммов', p: [10, 60, 5], maxV: 400, obj: 'макулатуры', verb: 'собрал', verbPl: 'собрали', each: 'каждый',
      lab: ['первый класс', 'второй класс', 'третий класс', 'четвёртый класс'], entLow: ['первый класс', 'второй класс', 'третий класс', 'четвёртый класс'], short: ['первый', 'второй', 'третий', 'четвёртый'],
      pair: 'первый и второй классы',
      intro: function (S, n) { return (n === 3 ? 'Три' : 'Четыре') + ' класса вместе собрали ' + qty(S, 'кг') + ' макулатуры.'; }, qAll: 'Сколько килограммов макулатуры собрал каждый класс?' }); },
    function () {
      var nm = boysNames();
      return bSubj({ u: ['марка', 'марки', 'марок'], uG: 'марок', p: [4, 40, 1], maxV: 160, obj: '', verb: 'собрал', verbPl: 'собрали', each: 'каждый',
        lab: nm.slice(), entLow: nm.slice(), short: nm.slice(), pair: nm[0] + ' и ' + nm[1],
        intro: function (S, n) { return nm.slice(0, n - 1).join(', ') + ' и ' + nm[n - 1] + ' собрали вместе ' + qty(S, ['марка', 'марки', 'марок']) + '.'; }, qAll: 'Сколько марок собрал каждый из ребят?' });
    },
    function () {
      var nm = girlsNames();
      return bSubj({ u: ['пирожок', 'пирожка', 'пирожков'], uG: 'пирожков', p: [4, 40, 1], maxV: 100, obj: '', verb: 'испекла', verbPl: 'испекли', each: 'каждая',
        lab: nm.slice(), entLow: nm.slice(), short: nm.slice(), pair: nm[0] + ' и ' + nm[1],
        intro: function (S, n) { return nm.slice(0, n - 1).join(', ') + ' и ' + nm[n - 1] + ' испекли вместе ' + qty(S, ['пирожок', 'пирожка', 'пирожков']) + '.'; }, qAll: 'Сколько пирожков испекла каждая из девочек?' });
    }
  ];
  /* «Сколько марок собрал Коля?» — без лишнего пробела при пустом дополнении */
  function trimQ(s) { return s.replace(/\s{2,}/g, ' '); }

  function relThree(sc, parts, sub) {
    var n = parts.length, cl = [], j;
    if (sub === 'eq') return sc.eqSent(1, parts[2]);
    for (j = 1; j < n; j++) {
      var ref = sub === 'chain' || sub === 'chain4' ? j - 1 : 0;
      var body = 'в ' + tms(parts[j] / parts[ref]) + ' больше, чем ' + sc.short[ref];
      cl.push(j === 1 ? sc.subjPhrase(1) + ' ' + body : sc.short[j] + ' — ' + body);
    }
    if (n === 3) return cl[0] + ', а ' + cl[1] + '.';
    return cl.slice(0, n - 2).join(', ') + ', а ' + cl[n - 2] + '.';
  }

  /* o.pats: массив из 'ref3' 'chain3' 'eq3' 'ref4' 'chain4'; o.ask: 'all' | 'one' | 'diff' */
  reg('svThree', function (o) {
    var pat = pick(o.pats || ['ref3', 'chain3', 'eq3']), parts, sub, k, n, sc, t;
    if (pat === 'ref3') { t = pick(REF3); parts = [1, t[0], t[1]]; sub = 'ref'; }
    else if (pat === 'chain3') { k = pick([2, 3]); parts = [1, k, k * k]; sub = 'chain'; }
    else if (pat === 'eq3') { k = rand(2, 5); parts = [1, 1, k]; sub = 'eq'; }
    else if (pat === 'ref4') { t = pick(REF4); parts = [1, t[0], t[1], t[2]]; sub = 'ref'; }
    else { parts = [1, 2, 4, 8]; sub = 'chain4'; }
    n = parts.length;
    var T = sumOf(parts), mx = Math.max.apply(null, parts), p, S, step, hiP, loP, g = 0;
    do {
      sc = pick(THREE)(); step = sc.p[2];
      hiP = Math.min(sc.p[1], Math.floor(sc.maxS / T), Math.floor(sc.maxV / mx));
      loP = Math.max(sc.p[0], o.pmin || 0);
      if (o.pmax) hiP = Math.min(hiP, o.pmax);
      g++;
    } while (Math.ceil(loP / step) > Math.floor(hiP / step) && g < 200);
    p = rand(Math.ceil(loP / step), Math.floor(hiP / step)) * step; S = p * T;
    var ask = Array.isArray(o.ask) ? pick(o.ask) : (o.ask || 'all'), u = sc.u, labs = sc.lab.slice(0, n);
    var text = sc.intro(S, n) + ' ' + relThree(sc, parts, sub) + ' ', ans, kind = 'num', fields, ansTxt, qt;
    var vals = parts.map(function (c) { return p * c; });
    if (ask === 'all') {
      qt = sc.qAll; kind = 'nums'; ans = vals;
      fields = labs.map(function (l) { return { label: l + ', ' + ulab(u) }; });
      ansTxt = labs.map(function (l, i) { return l + ' — ' + qty(vals[i], u); }).join(', ');
    } else if (ask === 'one') {
      var i1 = o.idx != null ? o.idx : rand(1, n - 1);
      qt = sc.q1(i1); ans = vals[i1]; ansTxt = qty(ans, u) + ' (' + labs[i1] + ')';
    } else {
      qt = sc.qDiff(n - 1, 0); ans = vals[n - 1] - vals[0]; ansTxt = qty(ans, u);
    }
    var how;
    if (sub === 'eq') how = 'Первые два числа равны — по 1 части. Третье в ' + tms(parts[2]) + ' больше — ' + partsW(parts[2]) + '.';
    else if (sub === 'chain' || sub === 'chain4') how = 'За 1 часть примем самое маленькое: ' + labs[0] + '. Каждое следующее в ' + tms(parts[1]) + ' больше предыдущего, поэтому частей: ' + parts.join(', ') + '.';
    else how = 'За 1 часть примем самое маленькое: ' + labs[0] + '. Остальные: ' + parts.slice(1).map(function (c, i) { return labs[i + 1] + ' — ' + partsW(c); }).join(', ') + '.';
    var L = multiSteps(labs, parts, p, S, how);
    if (ask === 'diff') L.splice(L.length - 1, 0, 'Разность: ' + fmt(vals[n - 1]) + ' − ' + fmt(vals[0]) + ' = ' + fmt(ans) + '.');
    var out = { kind: kind, html: trimQ(text + qt), answer: ans,
      hint: 'Самое маленькое число — 1 часть. Сколько частей у каждого из остальных? Сколько частей всего?',
      explain: R.svRodsSVG(parts.map(function (c, i) { return { name: labs[i], parts: c, seg: fmt(p), hl: i === 0 ? 1 : 0, end: '= ' + fmt(vals[i]) }; }), { total: qty(S, u) }) + stepsL(L, ansTxt) };
    if (fields) out.fields = fields;
    return out;
  });

  /* ================= сначала найди сумму (остаток делят на части) ================= */
  var REMAIN = [
    { u: ['пара лыж', 'пары лыж', 'пар лыж'], a: [600, 2400, 5], b: [100, 900, 5], p: [200, 900, 5], labs: ['первая бригада', 'вторая бригада'],
      t: function (N, a, b, k) { return 'Две бригады должны изготовить вместе ' + qty(N, this.u) + '. Первая бригада уже изготовила ' + qty(a, this.u) + ', а вторая — ' + qty(b, this.u) + '. Остальные лыжи распределили между бригадами так, что вторая бригада получила из них в ' + tms(k) + ' больше, чем первая.'; },
      q: 'Сколько пар лыж изготовит каждая бригада всего?', q1: 'Сколько пар лыж изготовит всего первая бригада?', q2: 'Сколько пар лыж изготовит всего вторая бригада?', qr: 'Сколько пар лыж осталось изготовить?' },
    { u: ['куртка', 'куртки', 'курток'], a: [100, 600, 5], b: [50, 400, 5], p: [50, 400, 5], labs: ['первый цех', 'второй цех'],
      t: function (N, a, b, k) { return 'Ателье должно сшить ' + qty(N, this.u) + '. Первый цех уже сшил ' + qty(a, this.u) + ', второй — ' + qty(b, this.u) + '. Остальные куртки поделили между цехами так, что второй цех получил из них в ' + tms(k) + ' больше, чем первый.'; },
      q: 'Сколько курток сошьёт каждый цех всего?', q1: 'Сколько курток сошьёт всего первый цех?', q2: 'Сколько курток сошьёт всего второй цех?', qr: 'Сколько курток осталось сшить?' },
    { u: 'кг', a: [100, 500, 5], b: [60, 400, 5], p: [30, 300, 5], labs: ['первый класс', 'второй класс'],
      t: function (N, a, b, k) { return 'Два класса договорились собрать вместе ' + qty(N, this.u) + ' макулатуры. Первый класс уже собрал ' + qty(a, this.u) + ', второй — ' + qty(b, this.u) + '. Остальное решили собрать так, чтобы из остатка второй класс собрал в ' + tms(k) + ' больше, чем первый.'; },
      q: 'Сколько килограммов макулатуры соберёт каждый класс всего?', q1: 'Сколько килограммов макулатуры соберёт всего первый класс?', q2: 'Сколько килограммов макулатуры соберёт всего второй класс?', qr: 'Сколько килограммов макулатуры осталось собрать?' },
    { u: ['дерево', 'дерева', 'деревьев'], a: [40, 300, 5], b: [30, 250, 5], p: [20, 200, 5], labs: ['первая школа', 'вторая школа'],
      t: function (N, a, b, k) { return 'Две школы должны посадить вместе ' + qty(N, this.u) + '. Первая школа уже посадила ' + qty(a, this.u) + ', вторая — ' + qty(b, this.u) + '. Остальные деревья распределили так, что вторая школа посадит из них в ' + tms(k) + ' больше, чем первая.'; },
      q: 'Сколько деревьев посадит каждая школа всего?', q1: 'Сколько деревьев посадит всего первая школа?', q2: 'Сколько деревьев посадит всего вторая школа?', qr: 'Сколько деревьев осталось посадить?' },
    { u: ['кирпич', 'кирпича', 'кирпичей'], a: [300, 1500, 50], b: [200, 1200, 50], p: [100, 900, 50], labs: ['первый каменщик', 'второй каменщик'],
      t: function (N, a, b, k) { return 'Двум каменщикам нужно уложить ' + qty(N, this.u) + '. Первый каменщик уже уложил ' + qty(a, this.u) + ', второй — ' + qty(b, this.u) + '. Остальные кирпичи они разделили так, что второй каменщик уложит из них в ' + tms(k) + ' больше, чем первый.'; },
      q: 'Сколько кирпичей уложит каждый каменщик всего?', q1: 'Сколько кирпичей уложит всего первый каменщик?', q2: 'Сколько кирпичей уложит всего второй каменщик?', qr: 'Сколько кирпичей осталось уложить?' },
    { u: ['книга', 'книги', 'книг'], a: [200, 900, 10], b: [100, 700, 10], p: [50, 400, 10], labs: ['первый магазин', 'второй магазин'],
      t: function (N, a, b, k) { return 'В два магазина нужно развезти ' + qty(N, this.u) + '. В первый магазин уже отвезли ' + qty(a, this.u) + ', во второй — ' + qty(b, this.u) + '. Остальные книги решили развезти так, чтобы во второй магазин из них попало в ' + tms(k) + ' больше, чем в первый.'; },
      q: 'Сколько книг привезут в каждый магазин всего?', q1: 'Сколько книг привезут всего в первый магазин?', q2: 'Сколько книг привезут всего во второй магазин?', qr: 'Сколько книг осталось развезти?' }
  ];
  function rr(r) { return rand(r[0] / r[2], r[1] / r[2]) * r[2]; }

  /* o.ask: 'both' | 'first' | 'second' | 'rest'; o.kmax */
  reg('svRemain', function (o) {
    var sc = pick(REMAIN), a = rr(sc.a), b = rr(sc.b), p = rr(sc.p), k = rand(o.kmin || 2, o.kmax || 5), u = sc.u, ask = Array.isArray(o.ask) ? pick(o.ask) : (o.ask || 'both');
    while (k % 10 === 1) k = rand(2, 5);
    var Rm = p * (k + 1), N = a + b + Rm, f = a + p, s = b + p * k, done = a + b;
    var text = sc.t(N, a, b, k) + ' ', ans, kind = 'num', fields, ansTxt, L = [];
    L.push('Сколько уже сделано вместе: ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(done) + '.');
    L.push('Сколько осталось: ' + fmt(N) + ' − ' + fmt(done) + ' = ' + fmt(Rm) + '.');
    L.push('Остаток делим на части: у первого — 1 часть, у второго — ' + partsW(k) + ', всего 1 + ' + k + ' = ' + (k + 1) + '.');
    L.push('На одну часть приходится: ' + fmt(Rm) + ' : ' + (k + 1) + ' = ' + fmt(p) + ' — столько достанется первому из остатка.');
    if (ask === 'rest') {
      text += sc.qr; ans = Rm; ansTxt = qty(Rm, u); L = L.slice(0, 2);
    } else {
      L.push('Второму из остатка достанется: ' + fmt(p) + ' × ' + k + ' = ' + fmt(p * k) + '.');
      L.push('Первый всего: ' + fmt(a) + ' + ' + fmt(p) + ' = ' + fmt(f) + '.');
      L.push('Второй всего: ' + fmt(b) + ' + ' + fmt(p * k) + ' = ' + fmt(s) + '.');
      L.push('Проверка: ' + fmt(f) + ' + ' + fmt(s) + ' = ' + fmt(N) + '.');
      if (ask === 'both') { text += sc.q; kind = 'nums'; ans = [f, s]; fields = sc.labs.map(function (l) { return { label: l + ', ' + ulab(u) }; }); ansTxt = sc.labs[0] + ' — ' + qty(f, u) + ', ' + sc.labs[1] + ' — ' + qty(s, u); }
      else if (ask === 'first') { text += sc.q1; ans = f; ansTxt = qty(f, u); }
      else { text += sc.q2; ans = s; ansTxt = qty(s, u); }
    }
    var out = { kind: kind, html: text, answer: ans,
      hint: 'Сначала узнай, сколько осталось сделать. Остаток и делят на части: у первого — 1 часть, у второго — несколько частей.',
      explain: (ask === 'rest' ? '' : R.svRodsSVG([{ name: sc.labs[0] + ', осталось', parts: 1, seg: fmt(p), hl: 1, end: '= ' + fmt(p) }, { name: sc.labs[1] + ', осталось', parts: k, seg: fmt(p), end: '= ' + fmt(p * k) }], { total: qty(Rm, u) + ' осталось' })) + stepsL(L, ansTxt) };
    if (fields) out.fields = fields;
    return out;
  });

  /* ================= виджет «Делим на части» ================= */
  R.widgetMounts = R.widgetMounts || {};
  R.widgetMounts.svParts = function (host) {
    var k = Number(host.getAttribute('data-k') || 5), p = Number(host.getAttribute('data-p') || 50), step = 0;
    var A = host.getAttribute('data-a') || 'яйца', Ag = host.getAttribute('data-ag') || 'яиц', B = host.getAttribute('data-b') || 'молоко', Bg = host.getAttribute('data-bg') || 'молока', u = host.getAttribute('data-u') || 'г';
    var ps = [10, 20, 25, 30, 40, 50, 60];
    host.innerHTML = '<div class="sv-ks"><span class="sv-kl">Во сколько раз больше:</span></div><div class="sv-figwrap"></div><p class="facts sv-wnote"></p>' +
      '<div class="sv-tools"><button class="btn primary" type="button" data-a="next">Дальше</button> <button class="btn soft" type="button" data-a="again">Другие числа</button></div>';
    var ks = host.querySelector('.sv-ks'), fig = host.querySelector('.sv-figwrap'), note = host.querySelector('.sv-wnote'), nx = host.querySelector('[data-a="next"]'), ag = host.querySelector('[data-a="again"]');
    var kb = [];
    [2, 3, 4, 5, 6].forEach(function (v) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn soft sv-kb'; b.textContent = v;
      b.addEventListener('click', function () { k = v; step = 0; draw(); });
      ks.appendChild(b); kb.push(b);
    });
    function draw() {
      var S = p * (k + 1), T = k + 1, i;
      kb.forEach(function (b, j) { var on = (j + 2) === k; b.classList.toggle('sv-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      var rows = [
        { name: A, parts: 1, seg: step >= 2 ? fmt(p) : '', end: step >= 2 ? '= ' + fmt(p) + NB + u : '?', hl: 1 },
        { name: B, parts: k, seg: step >= 2 ? fmt(p) : '', end: step >= 3 ? '= ' + fmt(p * k) + NB + u : '?' }];
      fig.innerHTML = R.svRodsSVG(rows, { total: fmt(S) + NB + u });
      var t = [
        'Вместе ' + fmt(S) + ' ' + u + '. ' + cap(Bg) + ' в ' + tms(k) + ' больше, чем ' + Ag + '. Меньшее количество — 1 часть, большее — ' + partsW(k) + '. Нажми «Дальше».',
        'Всего частей: 1 + ' + k + ' = <b>' + T + '</b>. Вся сумма разделена на ' + T + ' равных частей.',
        'Одна часть: ' + fmt(S) + ' : ' + T + ' = <b>' + fmt(p) + ' ' + u + '</b>. Это и есть меньшее количество — столько ' + Ag + '.',
        cap(Bg) + ' — ' + partsW(k) + ': ' + fmt(p) + ' × ' + k + ' = <b>' + fmt(p * k) + ' ' + u + '</b>.',
        'Проверка: ' + fmt(p) + ' + ' + fmt(p * k) + ' = ' + fmt(S) + ' и ' + fmt(p * k) + ' : ' + fmt(p) + ' = ' + k + '. Всё сходится.'][step];
      note.innerHTML = t;
      nx.textContent = step >= 4 ? 'Сначала' : 'Дальше';
    }
    nx.addEventListener('click', function () { step = step >= 4 ? 0 : step + 1; draw(); });
    ag.addEventListener('click', function () { var q; do { q = pick(ps); } while (q === p); p = q; step = 0; draw(); });
    draw();
  };

  /* ================= составные задачи: площадь, сад (урок 104) ================= */
  var AREAS = [
    { t: function (L, w, k) { return 'Участок прямоугольной формы имеет длину ' + qty(L, 'м') + ', а ширина в ' + tms(w) + ' меньше. Весь участок занят огородом и садом, причём под огород отведена площадь в ' + tms(k) + ' больше, чем под сад.'; },
      big: 'огород', small: 'сад', bg: 'огорода', sg: 'сада' },
    { t: function (L, w, k) { return 'Школьный двор имеет форму прямоугольника: длина ' + qty(L, 'м') + ', ширина в ' + tms(w) + ' меньше. Двор поделён на спортивную площадку и газоны, и площадка занимает в ' + tms(k) + ' больше места, чем газоны.'; },
      big: 'площадка', small: 'газоны', bg: 'площадки', sg: 'газонов' },
    { t: function (L, w, k) { return 'Поле прямоугольной формы имеет длину ' + qty(L, 'м') + ', а ширина в ' + tms(w) + ' меньше. Всё поле засеяли пшеницей и рожью, причём пшеница заняла площадь в ' + tms(k) + ' больше, чем рожь.'; },
      big: 'пшеница', small: 'рожь', bg: 'пшеницы', sg: 'ржи', Lr: [100, 300, 50] },
    { t: function (L, w, k) { return 'Прямоугольная часть парка имеет длину ' + qty(L, 'м') + ', а ширина в ' + tms(w) + ' меньше. Парк занят газонами и дорожками, причём газоны занимают площадь в ' + tms(k) + ' больше, чем дорожки.'; },
      big: 'газоны', small: 'дорожки', bg: 'газонов', sg: 'дорожек' },
    { t: function (L, w, k) { return 'Дачный участок прямоугольной формы имеет длину ' + qty(L, 'м') + ', а ширина в ' + tms(w) + ' меньше. Весь участок занят грядками и яблоневым садом, причём под сад отведена площадь в ' + tms(k) + ' больше, чем под грядки.'; },
      big: 'сад', small: 'грядки', bg: 'сада', sg: 'грядок', Lr: [20, 60, 10] }
  ];
  /* o.ask: 'both' | 'big' | 'small' | 'diff' (можно массивом) */
  reg('svArea', function (o) {
    var sc = pick(AREAS), Lr = sc.Lr || [40, 200, 10], L, w, k, W, A, tries = 0, T;
    do {
      L = rand(Lr[0] / Lr[2], Lr[1] / Lr[2]) * Lr[2]; w = pick([2, 3, 4, 5]); k = rand(o.kmin || 2, o.kmax || 8);
      W = L / w; A = L * W; T = k + 1; tries++;
    } while ((L % w || A % T || W % 5) && tries < 4000);
    var p = A / T, ask = Array.isArray(o.ask) ? pick(o.ask) : (o.ask || 'both'), ans, kind = 'num', fields, q, ansTxt;
    if (ask === 'both') { q = 'Найди площадь ' + sc.sg + ' и площадь ' + sc.bg + ' (в квадратных метрах).'; kind = 'nums'; ans = [p, p * k]; fields = [{ label: sc.small + ', кв. м' }, { label: sc.big + ', кв. м' }]; ansTxt = sc.small + ' — ' + qty(p, 'кв. м') + ', ' + sc.big + ' — ' + qty(p * k, 'кв. м'); }
    else if (ask === 'big') { q = 'Найди площадь ' + sc.bg + ' (в квадратных метрах).'; ans = p * k; ansTxt = qty(ans, 'кв. м'); }
    else if (ask === 'small') { q = 'Найди площадь ' + sc.sg + ' (в квадратных метрах).'; ans = p; ansTxt = qty(ans, 'кв. м'); }
    else { q = 'На сколько квадратных метров площадь ' + sc.bg + ' больше площади ' + sc.sg + '?'; ans = p * (k - 1); ansTxt = qty(ans, 'кв. м'); }
    var steps = ['Ширина: ' + fmt(L) + ' : ' + w + ' = ' + fmt(W) + ' (м).', 'Площадь всего участка: ' + fmt(L) + ' × ' + fmt(W) + ' = ' + fmt(A) + ' (кв. м).',
      'Всего частей: 1 + ' + k + ' = ' + T + '.', 'Одна часть — площадь ' + sc.sg + ': ' + fmt(A) + ' : ' + T + ' = ' + fmt(p) + ' (кв. м).'];
    if (ask !== 'small') steps.push('Площадь ' + sc.bg + ': ' + fmt(p) + ' × ' + k + ' = ' + fmt(p * k) + ' (кв. м).');
    if (ask === 'diff') steps.push('Разность: ' + fmt(p * k) + ' − ' + fmt(p) + ' = ' + fmt(p * (k - 1)) + ' (кв. м).');
    if (ask === 'both' || ask === 'big') steps.push('Проверка: ' + fmt(p) + ' + ' + fmt(p * k) + ' = ' + fmt(A) + '.');
    var out = { kind: kind, html: sc.t(L, w, k) + ' ' + q, answer: ans,
      hint: 'Сначала найди ширину и площадь всего участка. Потом сравни площади частей: меньшая — 1 часть.',
      explain: R.svRodsSVG([{ name: sc.small, parts: 1, seg: fmt(p), hl: 1, end: '= ' + fmt(p) }, { name: sc.big, parts: k, seg: fmt(p), end: '= ' + fmt(p * k) }], { total: fmt(A) + NB + 'кв. м' }) + stepsL(steps, ansTxt) };
    if (fields) out.fields = fields;
    return out;
  });

  var ORCH = [
    { A: 'яблонь', B: 'груш', both: 'яблонь и груш', fr: 'плодов', ea: 'С каждой яблони собрали в среднем по {m} кг яблок', eb: 'а со всех груш — {G} кг', m: [40, 90, 10], q: [30, 60, 5], asks: ['t', 'c', 'kg'] },
    { A: 'слив', B: 'вишен', both: 'слив и вишен', fr: 'плодов', ea: 'С каждой сливы собрали в среднем по {m} кг слив', eb: 'а со всех вишен — {G} кг', m: [30, 70, 10], q: [20, 40, 5], asks: ['t', 'c', 'kg'] },
    { A: 'яблонь', B: 'вишен', both: 'яблонь и вишен', fr: 'плодов', ea: 'С каждой яблони собрали в среднем по {m} кг яблок', eb: 'а со всех вишен — {G} кг', m: [40, 80, 10], q: [15, 35, 5], asks: ['t', 'c', 'kg'] },
    { A: 'кустов смородины', B: 'кустов малины', both: 'кустов смородины и малины', fr: 'ягод', ea: 'С каждого куста смородины собрали в среднем по {m} кг ягод', eb: 'а со всех кустов малины — {G} кг', m: [2, 6, 1], q: [2, 5, 1], asks: ['kg'], pr: [10, 40, 5] }
  ];
    /* o.ask: 't' | 'c' | 'kg' | 'any' */
  reg('svOrchard', function (o) {
    var sc = pick(ORCH), ask = o.ask && o.ask !== 'any' ? o.ask : pick(sc.asks), tries = 0, p, k, m, q, tot, pr = sc.pr || [10, 40, 2];
    if (sc.asks.indexOf(ask) < 0) ask = 'kg';
    do {
      p = rand(pr[0] / pr[2], pr[1] / pr[2]) * pr[2]; k = rand(2, 5); m = rand(sc.m[0] / sc.m[2], sc.m[1] / sc.m[2]) * sc.m[2]; q = rand(sc.q[0] / sc.q[2], sc.q[1] / sc.q[2]) * sc.q[2];
      tot = p * (k * m + q); tries++;
    } while (ask !== 'kg' && (tot % (ask === 't' ? 1000 : 100) || tot < (ask === 't' ? 1000 : 100)) && tries < 20000);
    if (tries >= 20000) ask = 'kg';
    var N = p * (k + 1), G = p * q, na = p * k, apple = na * m, divisor = ask === 't' ? 1000 : ask === 'c' ? 100 : 1;
    var unitW = ask === 't' ? 'тонн' : ask === 'c' ? 'центнеров' : 'килограммов', abbr = ask === 't' ? 'т' : ask === 'c' ? 'ц' : 'кг';
    var text = 'В саду росло ' + fmt(N) + ' ' + sc.both + ', причём ' + sc.B + ' было в ' + tms(k) + ' меньше, чем ' + sc.A + '. ' +
      sc.ea.replace('{m}', m) + ', ' + sc.eb.replace('{G}', fmt(G)) + '. Сколько ' + unitW + ' ' + sc.fr + ' собрали всего?';
    if (sc.A.indexOf('кустов') === 0) text = 'На участке росло ' + fmt(N) + ' ' + sc.both + ', причём кустов малины было в ' + tms(k) + ' меньше, чем кустов смородины. ' + sc.ea.replace('{m}', m) + ', ' + sc.eb.replace('{G}', fmt(G)) + '. Сколько килограммов ягод собрали всего?';
    var L = ['Всего частей: 1 + ' + k + ' = ' + (k + 1) + '.', cap(sc.B) + ' (одна часть): ' + fmt(N) + ' : ' + (k + 1) + ' = ' + fmt(p) + '.', cap(sc.A) + ': ' + fmt(p) + ' × ' + k + ' = ' + fmt(na) + '.',
      'Собрали с ' + sc.A + ': ' + fmt(m) + ' × ' + fmt(na) + ' = ' + fmt(apple) + ' (кг).', 'Всего собрали: ' + fmt(apple) + ' + ' + fmt(G) + ' = ' + fmt(tot) + ' (кг).'];
    if (divisor > 1) L.push('Переведём: ' + fmt(tot) + ' кг = ' + fmt(tot / divisor) + ' ' + abbr + '.');
    return { kind: 'num', html: text, answer: tot / divisor,
      hint: 'Сначала найди, сколько деревьев (кустов) каждого вида: меньшего вида — 1 часть. Потом считай урожай. В конце проверь единицы.',
      explain: stepsL(L, fmt(tot / divisor) + ' ' + abbr) };
  });

  /* ================= пропорциональное деление (урок 105) ================= */
  var PROP = [
    { kind: 'rates', u: 'т', ab: [2, 9], x: [5, 30, 1], cnt: ['рейс', 'рейса', 'рейсов'], who: ['первый грузовик', 'второй грузовик'],
      t: function (S, a, b, c) { return 'Два грузовика перевезли ' + qty(S, 'т') + ' груза, сделав одинаковое число рейсов. Первый грузовик перевозил за рейс ' + qty(a, 'т') + ', а второй — ' + qty(b, 'т') + '.'; },
      qb: 'Сколько тонн груза перевёз каждый грузовик?', qx: 'Сколько рейсов сделал каждый грузовик?', qs: ['Сколько тонн груза перевёз первый грузовик?', 'Сколько тонн груза перевёз второй грузовик?'], per: 'за один рейс' },
    { kind: 'rates', u: ['деталь', 'детали', 'деталей'], ab: [4, 15], x: [3, 12, 1], cnt: ['час', 'часа', 'часов'], who: ['первый станок', 'второй станок'],
      t: function (S, a, b, c) { return 'Два станка работали одинаковое время и выпустили вместе ' + qty(S, ['деталь', 'детали', 'деталей']) + '. Первый станок выпускает ' + qty(a, ['деталь', 'детали', 'деталей']) + ' в час, а второй — ' + qty(b, ['деталь', 'детали', 'деталей']) + ' в час.'; },
      qb: 'Сколько деталей выпустил каждый станок?', qx: 'Сколько часов работали станки?', qs: ['Сколько деталей выпустил первый станок?', 'Сколько деталей выпустил второй станок?'], per: 'за один час' },
    { kind: 'rates', u: 'т', ab: [3, 9], x: [4, 20, 1], cnt: ['час', 'часа', 'часов'], who: ['первый комбайн', 'второй комбайн'],
      t: function (S, a, b, c) { return 'Два комбайна работали одинаковое время и убрали вместе ' + qty(S, 'т') + ' пшеницы. Первый комбайн убирает ' + qty(a, 'т') + ' в час, а второй — ' + qty(b, 'т') + ' в час.'; },
      qb: 'Сколько тонн пшеницы убрал каждый комбайн?', qx: 'Сколько часов работали комбайны?', qs: ['Сколько тонн пшеницы убрал первый комбайн?', 'Сколько тонн пшеницы убрал второй комбайн?'], per: 'за один час' },
    { kind: 'rates', u: ['страница', 'страницы', 'страниц'], ab: [10, 25], x: [4, 20, 1], cnt: ['день', 'дня', 'дней'], who: ['первая девочка', 'вторая девочка'],
      t: function (S, a, b, c) { return 'Две девочки читали книги одинаковое число дней и прочитали вместе ' + qty(S, ['страница', 'страницы', 'страниц']) + '. В день первая читала по ' + a + ' ' + R.plural(a, ['странице', 'страницы', 'страниц']) + ', а вторая — по ' + b + ' ' + R.plural(b, ['странице', 'страницы', 'страниц']) + '.'; },
      qb: 'Сколько страниц прочитала каждая девочка?', qx: 'Сколько дней читали девочки?', qs: ['Сколько страниц прочитала первая девочка?', 'Сколько страниц прочитала вторая девочка?'], per: 'за один день' },
    { kind: 'boxes', u: 'кг', ab: [3, 24], x: [5, 50, 5], cnt: ['ящик', 'ящика', 'ящиков'], who: ['I сорт', 'II сорт'],
      t: function (S, a, b) { return 'Яблоки разложили в ящики одинакового веса: ' + qty(a, ['ящик', 'ящика', 'ящиков']) + ' I сорта и ' + qty(b, ['ящик', 'ящика', 'ящиков']) + ' II сорта. Всего яблок ' + qty(S, 'кг') + '.'; },
      qb: 'Сколько килограммов яблок каждого сорта?', qx: 'Сколько килограммов яблок в одном ящике?', qs: ['Сколько килограммов яблок I сорта?', 'Сколько килограммов яблок II сорта?'] },
    { kind: 'boxes', u: 'л', ab: [3, 20], x: [10, 40, 5], cnt: ['бидон', 'бидона', 'бидонов'], who: ['цельное молоко', 'обезжиренное молоко'],
      t: function (S, a, b) { return 'Молоко разлили в одинаковые бидоны: ' + qty(a, ['бидон', 'бидона', 'бидонов']) + ' цельного и ' + qty(b, ['бидон', 'бидона', 'бидонов']) + ' обезжиренного. Всего молока ' + qty(S, 'л') + '.'; },
      qb: 'Сколько литров молока каждого вида?', qx: 'Сколько литров молока в одном бидоне?', qs: ['Сколько литров цельного молока?', 'Сколько литров обезжиренного молока?'] },
    { kind: 'boxes', u: 'кг', ab: [3, 20], x: [2, 8, 1], cnt: ['коробка', 'коробки', 'коробок'], who: ['карамель', 'шоколадные конфеты'],
      t: function (S, a, b) { return 'Конфеты разложили в одинаковые коробки: ' + qty(a, ['коробка', 'коробки', 'коробок']) + ' с карамелью и ' + qty(b, ['коробка', 'коробки', 'коробок']) + ' с шоколадными. Всего конфет ' + qty(S, 'кг') + '.'; },
      qb: 'Сколько килограммов конфет каждого вида?', qx: 'Сколько килограммов конфет в одной коробке?', qs: ['Сколько килограммов карамели?', 'Сколько килограммов шоколадных конфет?'] }
  ];
  /* o.kind: 'rates' | 'boxes'; o.ask: 'both' | 'first' | 'second' | 'x' (можно массивом) */
  reg('svPropDiv', function (o) {
    var pool = PROP.filter(function (s) { return !o.kind || s.kind === o.kind; }), sc = pick(pool), a, b, x, T, S, g = 0;
    do {
      a = rand(sc.ab[0], sc.ab[1]); b = rand(sc.ab[0], sc.ab[1]); g++;
    } while ((a === b || (sc.kind === 'boxes' && a + b > 40) || (o.maxpart && Math.max(a, b) > o.maxpart)) && g < 500);
    T = a + b; x = rand(sc.x[0] / sc.x[2], sc.x[1] / sc.x[2]) * sc.x[2]; S = T * x;
    var ask = Array.isArray(o.ask) ? pick(o.ask) : (o.ask || 'both'), ansv, kind = 'num', fields, q, ansTxt, u = sc.u, L = [];
    if (sc.kind === 'rates') {
      L.push('Сколько получается вместе ' + sc.per + ': ' + a + ' + ' + b + ' = ' + T + '.');
      L.push('Сколько было ' + sc.cnt[2] + ': ' + fmt(S) + ' : ' + T + ' = ' + x + '.');
      L.push(cap(sc.who[0]) + ': ' + a + ' × ' + x + ' = ' + fmt(a * x) + '. ' + cap(sc.who[1]) + ': ' + b + ' × ' + x + ' = ' + fmt(b * x) + '.');
    } else {
      L.push('Всего одинаковых (' + sc.cnt[2] + '): ' + a + ' + ' + b + ' = ' + T + '.');
      L.push('В одном: ' + fmt(S) + ' : ' + T + ' = ' + x + '.');
      L.push(cap(sc.who[0]) + ': ' + x + ' × ' + a + ' = ' + fmt(x * a) + '. ' + cap(sc.who[1]) + ': ' + x + ' × ' + b + ' = ' + fmt(x * b) + '.');
    }
    L.push('Проверка: ' + fmt(a * x) + ' + ' + fmt(b * x) + ' = ' + fmt(S) + '.');
    if (ask === 'both') { q = sc.qb; kind = 'nums'; ansv = [a * x, b * x]; fields = sc.who.map(function (l) { return { label: l + ', ' + ulab(u) }; }); ansTxt = sc.who[0] + ' — ' + qty(a * x, u) + ', ' + sc.who[1] + ' — ' + qty(b * x, u); }
    else if (ask === 'first' || ask === 'second') { var which = ask === 'first' ? 0 : 1; q = sc.qs[which]; ansv = (which ? b : a) * x; ansTxt = qty(ansv, u); }
    else { q = sc.qx; ansv = x; ansTxt = fmt(x); if (sc.kind === 'boxes') ansTxt = qty(x, u); else ansTxt = x + ' ' + R.plural(x, sc.cnt); }
    var out = { kind: kind, html: sc.t(S, a, b) + ' ' + q, answer: ansv,
      hint: sc.kind === 'rates' ? 'Сколько получается вместе за один раз (рейс, час, день)? Сколько раз это было?' : 'Сколько всего одинаковых предметов? Сколько весит (вмещает) один?',
      explain: stepsL(L, ansTxt) };
    if (fields) out.fields = fields;
    return out;
  });

  /* ================= площади: единицы, изменение, стоимость ================= */
  /* o.type: 'road' | 'cut' | 'tiles' | 'paint' | 'calc' (можно o.types) */
  reg('svArea2', function (o) {
    var type = o.type || pick(o.types || ['road', 'cut', 'tiles', 'paint']), q, ans, expl, hint;
    if (type === 'road') {
      var S0 = pick([['Ширина дороги', 'Какую площадь занимает дорога', [6, 30, 1], [1, 9]], ['Ширина аллеи в парке', 'Какую площадь занимает аллея', [3, 10, 1], [1, 4]], ['Ширина взлётной полосы', 'Какую площадь занимает взлётная полоса', [40, 60, 5], [2, 4]]]);
      var w = S0[2][2] === 5 ? rand(8, 12) * 5 : rand(S0[2][0], S0[2][1]), km = rand(S0[3][0], S0[3][1]), mm = Math.random() < 0.3 ? pick([200, 250, 500, 800]) : 0, Lm = km * 1000 + mm;
      var lenTxt = mm ? km + ' км ' + mm + ' м' : km + ' км';
      q = S0[0] + ' ' + w + ' м, а длина ' + lenTxt + '. ' + S0[1] + '? Ответ дай в квадратных метрах.'; ans = w * Lm;
      expl = stepsL(['Переведём длину в метры: ' + lenTxt + ' = ' + fmt(Lm) + ' м.', 'Площадь: ' + w + ' × ' + fmt(Lm) + ' = ' + fmt(ans) + ' (кв. м).'], qty(ans, 'кв. м'));
      hint = 'Длину и ширину нужно выразить в одних единицах — в метрах.';
    } else if (type === 'cut') {
      var sc = pick([['Коридор', 'коридора', 'перестройке здания'], ['Спортивный зал', 'зала', 'ремонте школы'], ['Огород', 'огорода', 'перепланировке участка'], ['Детская площадка', 'площадки', 'благоустройстве двора']]);
      var A = rand(12, 40), B = rand(3, 9), da = rand(2, Math.min(8, A - 4)), db = rand(1, Math.min(3, B - 2)), a1 = A - da, b1 = B - db;
      q = sc[0] + ' длиной ' + A + ' м и шириной ' + B + ' м при ' + sc[2] + ' уменьшили по длине на ' + da + ' м и по ширине на ' + db + ' м. На сколько квадратных метров уменьшилась площадь ' + sc[1] + '?';
      ans = A * B - a1 * b1;
      expl = stepsL(['Была площадь: ' + A + ' × ' + B + ' = ' + A * B + ' (кв. м).', 'Новая длина: ' + A + ' − ' + da + ' = ' + a1 + ' (м), новая ширина: ' + B + ' − ' + db + ' = ' + b1 + ' (м).', 'Стала площадь: ' + a1 + ' × ' + b1 + ' = ' + a1 * b1 + ' (кв. м).', 'Уменьшилась на: ' + A * B + ' − ' + a1 * b1 + ' = ' + ans + ' (кв. м).'], qty(ans, 'кв. м'));
      hint = 'Найди площадь до и после перестройки, потом вычти.';
    } else if (type === 'tiles') {
      var s = pick([2, 5]), Lm2 = rand(3, 9), Wm = rand(3, 7), Wd = s === 5 ? pick([0, 5]) : pick([0, 2, 4, 6, 8]), Ld = Lm2 * 10, Wdm = Wm * 10 + Wd;
      var cnt = (Ld * Wdm) / (s * s);
      q = 'Сколько квадратных плиток со стороной ' + s + ' дм нужно для пола комнаты длиной ' + Lm2 + ' м и шириной ' + Wm + ' м' + (Wd ? ' ' + Wd + ' дм' : '') + '?';
      ans = cnt;
      expl = stepsL(['Переведём в дециметры: длина ' + Lm2 + ' м = ' + Ld + ' дм, ширина ' + Wm + ' м' + (Wd ? ' ' + Wd + ' дм' : '') + ' = ' + Wdm + ' дм.', 'Площадь пола: ' + Ld + ' × ' + Wdm + ' = ' + fmt(Ld * Wdm) + ' (кв. дм).', 'Площадь одной плитки: ' + s + ' × ' + s + ' = ' + s * s + ' (кв. дм).', 'Число плиток: ' + fmt(Ld * Wdm) + ' : ' + s * s + ' = ' + fmt(cnt) + '.'], fmt(cnt));
      hint = 'Раздели площадь пола на площадь одной плитки, но сначала переведи метры в дециметры.';
    } else if (type === 'paint') {
      var ps = pick([['фасада здания'], ['стены спортзала'], ['забора'], ['стены ангара']]);
      var Lp = rand(2, 12) * 5, H = rand(2, 12), c = pick([20, 40, 50, 60, 80, 100]);
      ans = Lp * H * c;
      q = 'Сколько нужно заплатить за покраску ' + ps[0] + ' длиной ' + Lp + ' м и высотой ' + H + ' м, если покраска стоит ' + c + ' руб. за 1 кв. м?';
      expl = stepsL(['Площадь: ' + Lp + ' × ' + H + ' = ' + fmt(Lp * H) + ' (кв. м).', 'Стоимость: ' + fmt(Lp * H) + ' × ' + c + ' = ' + fmt(ans) + ' (руб.).'], fmt(ans) + ' руб.');
      hint = 'Найди площадь, потом умножь на цену за 1 кв. м.';
    } else {
      var v = pick([1, 2, 3]);
      if (v === 1) { var a1v = rand(6, 40), k1 = rand(1, 6); q = 'Найди площадь прямоугольника со сторонами ' + a1v + ' м и ' + k1 + ' км. Ответ дай в квадратных метрах.'; ans = a1v * k1 * 1000;
        expl = stepsL([k1 + ' км = ' + fmt(k1 * 1000) + ' м.', 'Площадь: ' + a1v + ' × ' + fmt(k1 * 1000) + ' = ' + fmt(ans) + ' (кв. м).'], qty(ans, 'кв. м')); hint = 'Переведи километры в метры.'; }
      else if (v === 2) { var m2 = rand(3, 9), d2 = rand(1, 9), c2 = rand(3, 8); q = 'Найди площадь прямоугольника со сторонами ' + m2 + ' м ' + d2 + ' дм и ' + c2 + ' м. Ответ дай в квадратных дециметрах.'; ans = (m2 * 10 + d2) * c2 * 10;
        expl = stepsL([m2 + ' м ' + d2 + ' дм = ' + (m2 * 10 + d2) + ' дм, ' + c2 + ' м = ' + c2 * 10 + ' дм.', 'Площадь: ' + (m2 * 10 + d2) + ' × ' + c2 * 10 + ' = ' + fmt(ans) + ' (кв. дм).'], fmt(ans) + ' кв. дм'); hint = 'Переведи метры в дециметры: 1 м = 10 дм.'; }
      else { var k3 = rand(1, 5), m3 = rand(2, 9) * 50; q = 'Найди площадь прямоугольника со сторонами ' + k3 + ' км и ' + m3 + ' м. Ответ дай в квадратных метрах.'; ans = k3 * 1000 * m3;
        expl = stepsL([k3 + ' км = ' + fmt(k3 * 1000) + ' м.', 'Площадь: ' + fmt(k3 * 1000) + ' × ' + m3 + ' = ' + fmt(ans) + ' (кв. м).'], qty(ans, 'кв. м')); hint = 'Переведи километры в метры.'; }
    }
    return { kind: 'num', html: q, answer: ans, hint: hint, explain: expl };
  });

  /* ================= последовательное умножение и деление (уроки 106–107) ================= */
  /* разложения числа на два множителя (сначала «любимые») */
  var FACT = { 4: [[2, 2]], 6: [[2, 3], [3, 2]], 8: [[2, 4], [4, 2]], 9: [[3, 3]], 12: [[3, 4], [2, 6], [4, 3], [6, 2]], 14: [[2, 7], [7, 2]],
    15: [[3, 5], [5, 3]], 16: [[2, 8], [4, 4], [8, 2]], 18: [[2, 9], [3, 6], [6, 3], [9, 2]], 20: [[4, 5], [5, 4], [2, 10]],
    21: [[3, 7], [7, 3]], 24: [[3, 8], [4, 6], [6, 4], [8, 3]] };
  var FACT3 = { 8: [2, 2, 2], 12: [2, 2, 3], 18: [2, 3, 3], 24: [2, 3, 4] };
  var KDEF = [4, 6, 8, 9, 12, 15];
  /* a × k = a × f1 × f2 = x1 × f2 = ответ  (или a : k = a : f1 : f2 = …) */
  function seqChain(a, k, fs, op) {
    var cur = a, out = [fmt(a) + ' ' + op + ' ' + k, fmt(a) + ' ' + op + ' ' + fs.join(' ' + op + ' ')], i;
    for (i = 0; i < fs.length; i++) {
      cur = op === '×' ? cur * fs[i] : cur / fs[i];
      out.push([fmt(cur)].concat(fs.slice(i + 1)).join(' ' + op + ' '));
    }
    return out.join(' = ') + '.';
  }
  function kAsProd(k, fs) { return k + ' = ' + fs.join(' × '); }
  function numA(k, lo, hi) { var a, g = 0; do { a = rand(lo, hi); g++; } while (a % 10 === 0 && g < 40); return a; }

  /* o.k — допустимые множители; o.three — «множитель из трёх» (8 = 2 × 2 × 2); o.amin/o.amax */
  reg('svSeqMul', function (o) {
    var k = pick(o.k || KDEF), fs = o.three && FACT3[k] ? FACT3[k] : pick(FACT[k]);
    var a = numA(k, o.amin || 12, o.amax || (k <= 9 ? 99 : 60));
    var say = pick(['Вычисли, умножая по очереди: ', 'Умножь последовательно: ', 'Разложи второй множитель на множители и вычисли: ']);
    return { kind: 'num', html: say + expr(fmt(a) + ' × ' + k + ' ='), answer: a * k,
      hint: 'Разложи ' + k + ' на множители: ' + kAsProd(k, fs) + '. Умножь ' + a + ' на первый множитель, а результат — на второй' + (fs.length > 2 ? ' и на третий' : '') + '.',
      explain: seqChain(a, k, fs, '×') };
  });
  reg('svSeqDiv', function (o) {
    var k = pick(o.k || KDEF), fs = o.three && FACT3[k] ? FACT3[k] : pick(FACT[k]);
    var q = rand(o.qmin || (k <= 9 ? 12 : 6), o.qmax || (k <= 9 ? 99 : 50)), a = q * k;
    var say = pick(['Вычисли, деля по очереди: ', 'Раздели последовательно: ', 'Разложи делитель на множители и вычисли: ']);
    return { kind: 'num', html: say + expr(fmt(a) + ' : ' + k + ' ='), answer: q,
      hint: 'Разложи ' + k + ' на множители: ' + kAsProd(k, fs) + '. Раздели ' + fmt(a) + ' на первый множитель, а результат — на второй' + (fs.length > 2 ? ' и на третий' : '') + '.',
      explain: seqChain(a, k, fs, ':') };
  });

  /* вставь пропущенное число; o.op 'mul' | 'div' | 'mix'; o.types из 'k' 'f' 'mid' */
  reg('svSeqFill', function (o) {
    var op = o.op === 'mix' ? pick(['mul', 'div']) : (o.op || 'mul'), sg = op === 'mul' ? '×' : ':', k = pick(o.k || KDEF), fs = pick(FACT[k]), f1 = fs[0], f2 = fs[1];
    var type = pick(o.types || ['k', 'f', 'mid']), a, q, A, x1, ans, line, hint, why;
    if (op === 'mul') { A = numA(k, 12, k <= 9 ? 60 : 40); x1 = A * f1; }
    else { q = rand(k <= 9 ? 8 : 5, k <= 9 ? 60 : 30); A = q * k; x1 = A / f1; }
    var AF = fmt(A);
    if (type === 'k') { line = AF + ' ' + sg + ' □ = ' + AF + ' ' + sg + ' ' + f1 + ' ' + sg + ' ' + f2; ans = k;
      hint = 'Справа число умножают (делят) по очереди на ' + f1 + ' и на ' + f2 + '. Какому одному числу это равносильно? Перемножь ' + f1 + ' и ' + f2 + '.';
      why = f1 + ' × ' + f2 + ' = ' + k + ', значит ' + AF + ' ' + sg + ' ' + k + ' = ' + AF + ' ' + sg + ' ' + f1 + ' ' + sg + ' ' + f2 + '.'; }
    else if (type === 'f') { line = AF + ' ' + sg + ' ' + k + ' = ' + AF + ' ' + sg + ' ' + f1 + ' ' + sg + ' □'; ans = f2;
      hint = 'Число ' + k + ' разложено на множители. Один из них ' + f1 + '. Каким числом нужно умножить ' + f1 + ', чтобы получилось ' + k + '?';
      why = k + ' = ' + f1 + ' × ' + f2 + ', значит пропущен второй множитель ' + f2 + '.'; }
    else { line = AF + ' ' + sg + ' ' + k + ' = ' + AF + ' ' + sg + ' ' + f1 + ' ' + sg + ' ' + f2 + ' = □ ' + sg + ' ' + f2; ans = x1;
      hint = 'Выполни первое действие: ' + AF + ' ' + sg + ' ' + f1 + '.';
      why = AF + ' ' + sg + ' ' + f1 + ' = ' + fmt(x1) + '. Дальше: ' + fmt(x1) + ' ' + sg + ' ' + f2 + ' = ' + fmt(op === 'mul' ? x1 * f2 : x1 / f2) + '.'; }
    return { kind: 'num', html: 'Вставь пропущенное число: ' + expr(line), answer: ans, hint: hint, explain: why };
  });

  /* какое выражение равно …; o.op 'mul' | 'div' | 'mix' */
  reg('svEqual', function (o) {
    var op = o.op === 'mix' ? pick(['mul', 'div']) : (o.op || 'mul'), k = pick(o.k || KDEF), fs = pick(FACT[k]), f1 = fs[0], f2 = fs[1], a, target, good, bad, why;
    if (op === 'mul') {
      a = rand(12, 60); target = a * k;
      good = { t: a + ' × ' + f1 + ' × ' + f2, v: a * f1 * f2 };
      bad = [{ t: a + ' × ' + f1 + ' + ' + f2, v: a * f1 + f2 }, { t: a + ' × (' + f1 + ' + ' + f2 + ')', v: a * (f1 + f2) }, { t: a + ' + ' + f1 + ' × ' + f2, v: a + f1 * f2 },
        { t: a + ' : ' + f1 + ' × ' + f2, v: a / f1 * f2 }, { t: '(' + a + ' + ' + f1 + ') × ' + f2, v: (a + f1) * f2 }];
      why = 'Число ' + k + ' равно ' + f1 + ' × ' + f2 + ', поэтому умножить на ' + k + ' — то же, что умножить по очереди на ' + f1 + ' и на ' + f2 + '. Проверка: ' + a + ' × ' + k + ' = ' + fmt(target) + ' и ' + a + ' × ' + f1 + ' × ' + f2 + ' = ' + fmt(a * f1) + ' × ' + f2 + ' = ' + fmt(target) + '.';
    } else {
      var q = rand(6, 40); a = q * k; target = q;
      good = { t: a + ' : ' + f1 + ' : ' + f2, v: q };
      bad = [{ t: a + ' : ' + f1 + ' × ' + f2, v: a / f1 * f2 }, { t: a + ' : (' + f1 + ' + ' + f2 + ')', v: a / (f1 + f2) }, { t: a + ' : ' + f1 + ' + ' + f2, v: a / f1 + f2 },
        { t: a + ' × ' + f1 + ' : ' + f2, v: a * f1 / f2 }, { t: a + ' : ' + f2 + ' × ' + f1, v: a / f2 * f1 }];
      why = 'Число ' + k + ' равно ' + f1 + ' × ' + f2 + ', поэтому разделить на ' + k + ' — то же, что разделить по очереди на ' + f1 + ' и на ' + f2 + '. Проверка: ' + a + ' : ' + k + ' = ' + q + ' и ' + a + ' : ' + f1 + ' : ' + f2 + ' = ' + fmt(a / f1) + ' : ' + f2 + ' = ' + q + '. Выражение «' + a + ' : ' + f1 + ' × ' + f2 + '» считают слева направо — это ' + fmt(a / f1) + ' × ' + f2 + ' = ' + fmt(a / f1 * f2) + ', то есть умножение, а не деление на ' + k + '.';
    }
    var seen = {}, pool = bad.filter(function (b) { if (Math.abs(b.v - target) < 1e-9 || seen[b.t] || b.t === good.t) return false; seen[b.t] = 1; return true; });
    var opts = shuffle(pool).slice(0, 3); opts.push(good); opts = shuffle(opts);
    return { kind: 'choice', html: 'Какое выражение равно ' + expr(a + ' ' + (op === 'mul' ? '×' : ':') + ' ' + k) + '?', options: opts.map(function (x) { return x.t; }), answer: opts.indexOf(good),
      hint: 'Разложи ' + k + ' на множители: ' + kAsProd(k, fs) + '. Умножать (делить) надо по очереди на каждый множитель.', explain: why };
  });

  /* умножение и деление на 5, 25, 50, 125 через круглые числа; o.op 'mul' | 'div' | 'mix', o.m — список из 5 25 50 125 */
  var TRICK = { 5: { big: 10, d: 2, w: 'пятёрка — половина десятка' }, 50: { big: 100, d: 2, w: '50 — половина сотни' },
    25: { big: 100, d: 4, w: '25 — четверть сотни' }, 125: { big: 1000, d: 8, w: '125 — восьмая часть тысячи' } };
  var TRICK_A = { 5: [12, 99, 12, 99], 50: [12, 99, 4, 40], 25: [12, 48, 4, 40], 125: [8, 48, 3, 24] };      /* a для ×; q для : */
  R.svTrick = TRICK; R.svTrickA = TRICK_A;
  reg('svSeqRound', function (o) {
    var op = o.op === 'mix' ? pick(['mul', 'div']) : (o.op || 'mul'), m = pick(o.m || [5, 50, 25, 125]), T = TRICK[m], r = TRICK_A[m], a, q, x, ans, html, why, hint;
    if (op === 'mul') {
      a = rand(r[0], r[1]); if (a % 10 === 0) a++; x = a * T.big; ans = a * m;
      html = expr(fmt(a) + ' × ' + m + ' ='); hint = 'Умножить на ' + m + ' — то же, что умножить на ' + fmt(T.big) + ' и разделить на ' + T.d + ' (' + T.w + ').';
      why = fmt(a) + ' × ' + m + ' = ' + fmt(a) + ' × ' + fmt(T.big) + ' : ' + T.d + ' = ' + fmt(x) + ' : ' + T.d + ' = ' + fmt(ans) + '.';
    } else {
      q = rand(r[2], r[3]); a = q * m; x = a * T.d; ans = q;
      html = expr(fmt(a) + ' : ' + m + ' ='); hint = 'Раздели на ' + m + ' так: умножь на ' + T.d + ' и раздели на ' + fmt(T.big) + ', ведь ' + m + ' × ' + T.d + ' = ' + fmt(T.big) + '.';
      why = fmt(a) + ' : ' + m + ' = ' + fmt(a) + ' × ' + T.d + ' : ' + fmt(T.big) + ' = ' + fmt(x) + ' : ' + fmt(T.big) + ' = ' + fmt(q) + '.';
    }
    return { kind: 'num', html: 'Вычисли удобным способом: ' + html, answer: ans, hint: hint, explain: why };
  });

  /* удобный порядок: 25 × 17 × 4 */
  var PAIRS = [[25, 4], [5, 2], [125, 8], [50, 2], [250, 4], [20, 5]];
  reg('svSeqOrder', function (o) {
    var pr = pick(o.pairs || PAIRS), P = pr[0] * pr[1], lo = P >= 100 ? 3 : 13, hi = P >= 1000 ? 12 : (P >= 100 ? 19 : 97), c = rand(lo, hi), sw = Math.random() < 0.5;
    var p1 = sw ? pr[1] : pr[0], p2 = sw ? pr[0] : pr[1], r = Math.random(), arr = r < 0.75 ? [p1, c, p2] : (r < 0.88 ? [c, p1, p2] : [p1, p2, c]);
    return { kind: 'num', html: 'Вычисли удобным способом: ' + expr(arr.join(' × ') + ' ='), answer: P * c,
      hint: 'Найди два числа, произведение которых круглое: ' + p1 + ' × ' + p2 + ' = ' + fmt(P) + '. Перемножь их первыми.',
      explain: arr.join(' × ') + ' = (' + p1 + ' × ' + p2 + ') × ' + c + ' = ' + fmt(P) + ' × ' + c + ' = ' + fmt(P * c) + '.' };
  });

  /* задачи на умножение: o.form 'comp' (множитель составной) | 'three' (три множителя) | 'any' */
  var HOUR = ['час', 'часа', 'часов'], DAYF = ['день', 'дня', 'дней'], PACK = ['пачка', 'пачки', 'пачек'];
  function uw(n, u) { return typeof u === 'string' ? u : R.plural(n, u); }
  var COMP = [
    { a: [12, 90], k: [6, 8, 9, 12, 15], u: ['деталь', 'детали', 'деталей'],
      t: function (a, k) { return 'Мастер изготавливает ' + qty(a, ['деталь', 'детали', 'деталей']) + ' в час. Сколько деталей он изготовит за ' + qty(k, HOUR) + '?'; } },
    { a: [30, 95], k: [4, 6, 8, 9, 12], u: 'км',
      t: function (a, k) { return 'Автобус проезжает ' + qty(a, 'км') + ' за час. Какое расстояние он проедет за ' + qty(k, HOUR) + '?'; } },
    { a: [15, 90], k: [6, 8, 9, 12, 15], u: 'руб.',
      t: function (a, k) { return 'Один билет в музей стоит ' + qty(a, 'руб.') + '. Сколько нужно заплатить за ' + qty(k, ['билет', 'билета', 'билетов']) + '?'; } },
    { a: [12, 48], k: [6, 8, 9, 12, 15], u: 'кг',
      t: function (a, k) { return 'Масса одного ящика яблок ' + qty(a, 'кг') + '. Какова масса ' + k + ' таких ящиков?'; } },
    { a: [16, 40], k: [6, 8, 9, 12, 15], u: ['место', 'места', 'мест'],
      t: function (a, k) { return 'В каждом ряду зрительного зала ' + qty(a, ['место', 'места', 'мест']) + '. Сколько мест в ' + k + ' таких рядах?'; } },
    { a: [24, 96], k: [4, 6, 8, 9, 12], u: ['страница', 'страницы', 'страниц'],
      t: function (a, k) { return 'В одной книге ' + qty(a, ['страница', 'страницы', 'страниц']) + '. Сколько страниц в ' + k + ' таких книгах?'; } }
  ];
  /* три множителя: r — диапазоны чисел (a, b, c), t — текст, x — результат первого действия, s — строки решения, u — единица ответа */
  var THREEP = [
    { r: [[10, 50], [3, 20], [3, 20]], u: ['тетрадь', 'тетради', 'тетрадей'], x: function (a, b) { return a * b; },
      t: function (a, b, c) { return 'В каждой пачке ' + qty(a, ['тетрадь', 'тетради', 'тетрадей']) + ', а в каждой коробке ' + qty(b, PACK) + '. Сколько тетрадей в ' + c + ' таких коробках?'; },
      s: function (a, b, c, x, y) { return ['В одной коробке: ' + a + ' × ' + b + ' = ' + fmt(x) + ' (тетр.).', 'Во всех коробках: ' + fmt(x) + ' × ' + c + ' = ' + fmt(y) + ' (тетр.).']; } },
    { r: [[15, 130], [4, 10], [3, 20]], u: ['деталь', 'детали', 'деталей'], x: function (a, b) { return a * b; },
      t: function (a, b, c) { return 'Станок делает ' + qty(a, ['деталь', 'детали', 'деталей']) + ' в час и работает ' + qty(b, HOUR) + ' в день. Сколько деталей он сделает за ' + qty(c, DAYF) + '?'; },
      s: function (a, b, c, x, y) { return ['За один день: ' + a + ' × ' + b + ' = ' + fmt(x) + ' (дет.).', 'За ' + qty(c, DAYF) + ': ' + fmt(x) + ' × ' + c + ' = ' + fmt(y) + ' (дет.).']; } },
    { r: [[5, 50], [2, 20], [5, 25]], u: 'руб.', x: function (a, b, c) { return b * c; },
      t: function (a, b, c) { return 'Одна тетрадь стоит ' + qty(a, 'руб.') + '. Сколько рублей стоят ' + qty(b, PACK) + ' по ' + c + ' ' + R.plural(c, ['тетрадь', 'тетради', 'тетрадей']) + '?'; },
      s: function (a, b, c, x, y) { return ['Тетрадей всего: ' + b + ' × ' + c + ' = ' + fmt(x) + ' (шт.).', 'Стоимость: ' + a + ' × ' + fmt(x) + ' = ' + fmt(y) + ' (руб.).']; } },
    { r: [[15, 100], [4, 25], [3, 20]], u: 'руб.', x: function (a, b, c) { return b * c; },
      t: function (a, b, c) { return 'В магазин привезли ' + qty(c, ['ящик', 'ящика', 'ящиков']) + ' яблок, по ' + qty(b, 'кг') + ' в каждом. Яблоки продали по ' + qty(a, 'руб.') + ' за килограмм. Сколько рублей получили за все яблоки?'; },
      s: function (a, b, c, x, y) { return ['Яблок всего: ' + c + ' × ' + b + ' = ' + fmt(x) + ' (кг).', 'Выручка: ' + a + ' × ' + fmt(x) + ' = ' + fmt(y) + ' (руб.).']; } }
  ];
  function threeNums(sc) {
    var g = 0, F, pr, ij, t, ok;
    for (;;) {
      if (++g > 800) throw new Error('svSeqProb: нет чисел');
      F = sc.r.map(function (r) { return rand(r[0], r[1]); });
      if (Math.random() < 0.65) {
        pr = pick(PAIRS); if (Math.random() < 0.5) pr = [pr[1], pr[0]];
        ij = pick([[0, 1], [0, 2], [1, 2]]); F[ij[0]] = pr[0]; F[ij[1]] = pr[1];
      }
      ok = F[2] % 10 !== 1;
      for (t = 0; t < 3; t++) if (F[t] < sc.r[t][0] || F[t] > sc.r[t][1]) ok = false;
      if (ok) return F;
    }
  }
  reg('svSeqProb', function (o) {
    var form = o.form === 'comp' || o.form === 'three' ? o.form : pick(['comp', 'three']);
    if (form === 'comp') {
      var sc = pick(COMP), k = pick(sc.k), fs = pick(FACT[k]), a = numA(k, sc.a[0], sc.a[1]), ans = a * k;
      return { kind: 'num', html: sc.t(a, k), answer: ans,
        hint: 'Число ' + k + ' можно разложить на множители: ' + kAsProd(k, fs) + '. Умножай по очереди.',
        explain: stepsL(['Всего: ' + seqChain(a, k, fs, '×').replace(/\.$/, '') + ' (' + uw(ans, sc.u) + ').'], qty(ans, sc.u)) };
    }
    var s3 = pick(THREEP), F = threeNums(s3), y = F[0] * F[1] * F[2], x = s3.x(F[0], F[1], F[2]), L = s3.s(F[0], F[1], F[2], x, y), i, j, t, P;
    for (i = 0; i < 3; i++) for (j = i + 1; j < 3; j++) {
      P = F[i] * F[j];
      if (P === 10 || P === 100 || P === 1000) { t = 3 - i - j; L.push('Удобно перемножать так: ' + F[i] + ' × ' + F[j] + ' × ' + F[t] + ' = ' + fmt(P) + ' × ' + F[t] + ' = ' + fmt(y) + '.'); i = 9; break; }
    }
    return { kind: 'num', html: s3.t(F[0], F[1], F[2]), answer: y,
      hint: 'Задача решается в два действия, множителей три. Если среди них есть пара вроде 25 и 4 (дающая круглое число), перемножь её первой.',
      explain: stepsL(L, qty(y, s3.u)) };
  });

  /* задачи на деление: o.form 'comp' (делитель составной) | 'chain' (a : b : c) | 'any' */
  var COMPD = [
    { q: [12, 90], k: [6, 8, 9, 12, 15], u: ['деталь', 'детали', 'деталей'],
      t: function (S, k) { return 'За ' + qty(k, HOUR) + ' мастер изготовил ' + qty(S, ['деталь', 'детали', 'деталей']) + '. Сколько деталей он изготавливал за час?'; } },
    { q: [30, 95], k: [4, 6, 8, 9, 12], u: 'км',
      t: function (S, k) { return 'Автобус проехал ' + qty(S, 'км') + ' за ' + qty(k, HOUR) + '. Сколько километров он проезжал за каждый час?'; } },
    { q: [15, 90], k: [6, 8, 9, 12, 15], u: 'руб.',
      t: function (S, k) { return 'За ' + qty(k, ['билет', 'билета', 'билетов']) + ' одинаковой цены заплатили ' + qty(S, 'руб.') + '. Сколько стоит один билет?'; } },
    { q: [12, 48], k: [6, 8, 9, 12, 15], u: 'кг',
      t: function (S, k) { return qty(k, ['ящик', 'ящика', 'ящиков']) + ' яблок одинаковой массы весят ' + qty(S, 'кг') + '. Сколько весит один ящик?'; } },
    { q: [16, 60], k: [6, 8, 9, 12, 15], u: ['страница', 'страницы', 'страниц'],
      t: function (S, k) { return 'В ' + k + ' одинаковых книгах ' + qty(S, ['страница', 'страницы', 'страниц']) + '. Сколько страниц в одной книге?'; } }
  ];
  var CHAIN = [
    { b: [5, 6, 8, 10, 12, 15, 20, 25], c: [4, 5, 6, 8, 10], q: [2, 20], l1: 'пачек', l2: 'коробок', ans: ['коробка', 'коробки', 'коробок'],
      t: function (S, b, c) { return qty(S, ['книга', 'книги', 'книг']) + ' связали в пачки по ' + b + ' ' + R.plural(b, ['книга', 'книги', 'книг']) + ', а пачки уложили в коробки по ' + c + ' ' + R.plural(c, PACK) + '. Сколько получилось коробок?'; } },
    { b: [2, 3, 4, 5, 6, 8], c: [5, 6, 8, 10, 12], q: [2, 25], l1: 'пакетов', l2: 'ящиков', ans: ['ящик', 'ящика', 'ящиков'],
      t: function (S, b, c) { return 'На склад привезли ' + qty(S, 'кг') + ' яблок. Их расфасовали в пакеты по ' + qty(b, 'кг') + ', а пакеты уложили в ящики по ' + c + ' ' + R.plural(c, ['пакет', 'пакета', 'пакетов']) + '. Сколько потребовалось ящиков?'; } },
    { b: [8, 10, 12, 15, 20], c: [3, 4, 5, 6], q: [2, 12], l1: 'рядов', l2: 'секций', ans: ['секция', 'секции', 'секций'],
      t: function (S, b, c) { return 'В зале ' + qty(S, ['стул', 'стула', 'стульев']) + '. Их расставили в ряды по ' + b + ' ' + R.plural(b, ['стул', 'стула', 'стульев']) + ', а ряды объединили в секции по ' + c + ' ' + R.plural(c, ['ряд', 'ряда', 'рядов']) + '. Сколько получилось секций?'; } },
    { b: [12, 15, 18, 20, 25, 30, 40], c: [4, 5, 6, 8], q: [2, 15], l1: 'часов', l2: 'дней', ans: DAYF,
      t: function (S, b, c) { return 'Мастер должен сделать ' + qty(S, ['деталь', 'детали', 'деталей']) + '. За час он делает ' + qty(b, ['деталь', 'детали', 'деталей']) + ', а работает по ' + c + ' ' + R.plural(c, HOUR) + ' в день. За сколько дней он выполнит заказ?'; } },
    { b: [3, 4, 5, 6], c: [5, 6, 8], q: [2, 9], l1: 'часов', l2: 'дней', ans: DAYF,
      t: function (S, b, c) { return 'Турист должен пройти ' + qty(S, 'км') + '. За час он проходит ' + qty(b, 'км') + ', а в день идёт по ' + c + ' ' + R.plural(c, HOUR) + '. За сколько дней он пройдёт весь путь?'; } }
  ];
  reg('svSeqProbD', function (o) {
    var form = o.form === 'comp' || o.form === 'chain' ? o.form : pick(['comp', 'chain']);
    if (form === 'comp') {
      var sc = pick(COMPD), k = pick(sc.k), fs = pick(FACT[k]), q = rand(sc.q[0], sc.q[1]), S = q * k;
      return { kind: 'num', html: sc.t(S, k), answer: q,
        hint: 'Число ' + k + ' можно разложить на множители: ' + kAsProd(k, fs) + '. Дели по очереди.',
        explain: stepsL([seqChain(S, k, fs, ':').replace(/\.$/, '') + ' (' + uw(q, sc.u) + ').'], qty(q, sc.u)) };
    }
    var ch = pick(CHAIN), b, c, qq, T, g = 0;
    do { b = pick(ch.b); c = pick(ch.c); qq = rand(ch.q[0], ch.q[1]); T = qq * b * c; g++; } while (T > 3000 && g < 80);
    return { kind: 'num', html: ch.t(T, b, c), answer: qq,
      hint: 'Задача в два действия: сначала раздели всё на ' + b + ', потом полученное число раздели на ' + c + '.',
      explain: stepsL([fmt(T) + ' : ' + b + ' = ' + fmt(T / b) + ' (' + ch.l1 + ').', fmt(T / b) + ' : ' + c + ' = ' + fmt(qq) + ' (' + ch.l2 + ').',
        'Проверка: ' + b + ' × ' + c + ' = ' + b * c + '; ' + fmt(T) + ' : ' + b * c + ' = ' + fmt(qq) + '.'], qty(qq, ch.ans)) };
  });

  /* ================= цепочка вычислений и виджет «По частям» ================= */
  /* R.svChainSVG(nodes, ops): числа в рамках, между ними стрелки с действиями; '?' — пока неизвестно */
  R.svChainSVG = function (nodes, ops) {
    var FS = 16, OF = 14, BH = 38, TOP = 8, n = nodes.length, i, s = '', x = 4, xs = [], ws = [], gaps = [], cy = TOP + BH / 2;
    for (i = 0; i < n; i++) {
      ws.push(Math.max(48, Math.ceil(tw(nodes[i], FS) + 22)));
      if (i < n - 1) gaps.push(Math.max(n > 3 ? 54 : 62, Math.ceil(tw(ops[i], OF) + 26)));
    }
    for (i = 0; i < n; i++) { xs.push(x); x += ws[i] + (i < n - 1 ? gaps[i] : 0); }
    var W = x + 4, H = TOP + BH + 8, desc = [];
    for (i = 0; i < n; i++) {
      var q = nodes[i] === '?', last = i === n - 1 && !q && n > 1;
      s += '<rect class="sv-cn' + (q ? ' sv-cq' : '') + (last ? ' sv-hl' : '') + '" x="' + xs[i] + '" y="' + TOP + '" width="' + ws[i] + '" height="' + BH + '" rx="7"/>' +
        '<text class="' + (q ? 'sv-cnq' : 'sv-cnt') + '" x="' + (xs[i] + ws[i] / 2) + '" y="' + (cy + 5.5) + '" text-anchor="middle" style="font-size:' + FS + 'px">' + nodes[i] + '</text>';
      desc.push(q ? 'пока неизвестно' : nodes[i]);
      if (i < n - 1) {
        var x1 = xs[i] + ws[i] + 4, x2 = xs[i + 1] - 4;
        s += '<line class="sv-ca" x1="' + x1 + '" y1="' + cy + '" x2="' + (x2 - 5) + '" y2="' + cy + '"/>' +
          '<path class="sv-ch" d="M' + x2 + ' ' + cy + 'l-9 -5.5v11z"/>' +
          '<text class="sv-cop" x="' + ((x1 + x2) / 2) + '" y="' + (cy - 8) + '" text-anchor="middle" style="font-size:' + OF + 'px">' + ops[i] + '</text>';
        desc.push('действие ' + ops[i]);
      }
    }
    return '<svg class="fig sv-rods sv-chain" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Цепочка вычислений: ' + desc.join(', ') + '">' + s + '</svg>';
  };

  R.widgetMounts.svSeq = function (host) {
    var op = host.getAttribute('data-op') === 'div' ? 'div' : 'mul', mode = host.getAttribute('data-mode') === 'trick' ? 'trick' : 'split';
    var ks = mode === 'trick' ? [5, 25, 50, 125] : [4, 6, 8, 9, 12, 15];
    var k = Number(host.getAttribute('data-k') || ks[0]), a = Number(host.getAttribute('data-a') || 0), vi = 0, step = 0;
    var lab = { 'split-mul': 'Умножить на:', 'split-div': 'Разделить на:', 'trick-mul': 'Умножить на:', 'trick-div': 'Разделить на:' }[mode + '-' + op];
    function newA() {
      if (mode === 'trick') {
        var r = TRICK_A[k];
        if (op === 'mul') { do { a = rand(r[0], r[1]); } while (a % 10 === 0); } else a = rand(r[2], r[3]) * k;
      } else if (op === 'mul') a = numA(k, 12, k <= 9 ? 99 : 60);
      else a = rand(k <= 9 ? 12 : 6, k <= 9 ? 99 : 50) * k;
    }
    function fits() {
      if (!a) return false;
      if (op === 'div') return a % k === 0;
      return mode === 'trick' ? (a >= TRICK_A[k][0] && a <= TRICK_A[k][1] && a % 10 !== 0) : (a < (k <= 9 ? 100 : 61) && a % 10 !== 0);
    }
    if (!fits()) newA();
    host.innerHTML = '<div class="sv-ks"><span class="sv-kl">' + lab + '</span></div><div class="sv-figwrap"></div><p class="facts sv-wnote"></p>' +
      '<div class="sv-tools"><button class="btn primary" type="button" data-a="next">Дальше</button> ' +
      (mode === 'split' ? '<button class="btn soft" type="button" data-a="alt">Другое разложение</button> ' : '') +
      '<button class="btn soft" type="button" data-a="again">Другое число</button></div>';
    var kEl = host.querySelector('.sv-ks'), fig = host.querySelector('.sv-figwrap'), note = host.querySelector('.sv-wnote'), nx = host.querySelector('[data-a="next"]'),
      alt = host.querySelector('[data-a="alt"]'), ag = host.querySelector('[data-a="again"]'), kb = [];
    ks.forEach(function (v) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn soft sv-kb'; b.textContent = v;
      b.addEventListener('click', function () { k = v; vi = 0; step = 0; if (!fits()) newA(); draw(); });
      kEl.appendChild(b); kb.push(b);
    });
    function draw() {
      var nodes, ops, t, i, sg = op === 'mul' ? '×' : ':', A = fmt(a);
      kb.forEach(function (b, j) { var on = ks[j] === k; b.classList.toggle('sv-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      if (mode === 'split') {
        var list = FACT[k], fs = list[vi % list.length], f1 = fs[0], f2 = fs[1], x1 = op === 'mul' ? a * f1 : a / f1, res = op === 'mul' ? x1 * f2 : x1 / f2;
        nodes = [A, step >= 1 ? fmt(x1) : '?', step >= 2 ? fmt(res) : '?'];
        ops = [sg + ' ' + f1, sg + ' ' + f2];
        if (alt) { alt.disabled = list.length < 2; }
        var tn = Math.floor(a / 10) * 10, un = a % 10;
        t = op === 'mul' ? [
          'Хотим вычислить ' + A + ' × ' + k + '. Разложим ' + k + ' на множители: <b class="sv-f">' + k + ' = ' + f1 + ' × ' + f2 + '</b>. Умножать будем по очереди — сначала на ' + f1 + ', потом на ' + f2 + '. Нажми «Дальше».',
          'Первый шаг: ' + A + ' × ' + f1 + ' = <b>' + fmt(x1) + '</b>.',
          'Второй шаг: ' + fmt(x1) + ' × ' + f2 + ' = <b>' + fmt(res) + '</b>. Значит, ' + A + ' × ' + k + ' = ' + fmt(res) + '.',
          'Проверим другим способом: ' + A + ' × ' + k + ' = ' + tn + ' × ' + k + ' + ' + un + ' × ' + k + ' = ' + fmt(tn * k) + ' + ' + fmt(un * k) + ' = ' + fmt(a * k) + '. Ответ тот же.'
        ] : [
          'Хотим вычислить ' + A + ' : ' + k + '. Разложим ' + k + ' на множители: <b class="sv-f">' + k + ' = ' + f1 + ' × ' + f2 + '</b>. Делить будем по очереди — сначала на ' + f1 + ', потом на ' + f2 + '. Нажми «Дальше».',
          'Первый шаг: ' + A + ' : ' + f1 + ' = <b>' + fmt(x1) + '</b>.',
          'Второй шаг: ' + fmt(x1) + ' : ' + f2 + ' = <b>' + fmt(res) + '</b>. Значит, ' + A + ' : ' + k + ' = ' + fmt(res) + '.',
          'Проверка умножением: ' + fmt(res) + ' × ' + k + ' = ' + A + '. Всё сходится.'
        ];
      } else {
        var T = TRICK[k], X = op === 'mul' ? a * T.big : a * T.d, res2 = op === 'mul' ? a * k : a / k;
        nodes = [A, step >= 1 ? fmt(X) : '?', step >= 2 ? fmt(res2) : '?'];
        ops = op === 'mul' ? ['× ' + fmt(T.big), ': ' + T.d] : ['× ' + T.d, ': ' + fmt(T.big)];
        var tn2 = Math.floor(a / 10) * 10, un2 = a % 10;
        t = op === 'mul' ? [
          'Хотим вычислить ' + A + ' × ' + k + '. Заметим: ' + T.w + ', то есть <span class="sv-f">' + k + ' = ' + fmt(T.big) + ' : ' + T.d + '</span>. Поэтому умножим на ' + fmt(T.big) + ', а потом разделим на ' + T.d + '. Нажми «Дальше».',
          'Умножаем на ' + fmt(T.big) + ': просто приписываем нули. ' + A + ' × ' + fmt(T.big) + ' = <b>' + fmt(X) + '</b>.',
          'Делим на ' + T.d + ': ' + fmt(X) + ' : ' + T.d + ' = <b>' + fmt(res2) + '</b>. Значит, ' + A + ' × ' + k + ' = ' + fmt(res2) + '.',
          'Проверим другим способом: ' + A + ' × ' + k + ' = ' + tn2 + ' × ' + k + ' + ' + un2 + ' × ' + k + ' = ' + fmt(tn2 * k) + ' + ' + fmt(un2 * k) + ' = ' + fmt(a * k) + '. Ответ тот же.'
        ] : [
          'Хотим вычислить ' + A + ' : ' + k + '. Заметим: ' + k + ' × ' + T.d + ' = ' + fmt(T.big) + '. Поэтому умножим на ' + T.d + ', а потом разделим на ' + fmt(T.big) + '. Нажми «Дальше».',
          'Умножаем на ' + T.d + ': ' + A + ' × ' + T.d + ' = <b>' + fmt(X) + '</b>.',
          'Делим на ' + fmt(T.big) + ' (убираем нули): ' + fmt(X) + ' : ' + fmt(T.big) + ' = <b>' + fmt(res2) + '</b>. Значит, ' + A + ' : ' + k + ' = ' + fmt(res2) + '.',
          'Проверка умножением: ' + fmt(res2) + ' × ' + k + ' = ' + A + '. Всё сходится.'
        ];
      }
      fig.innerHTML = R.svChainSVG(nodes, ops);
      note.innerHTML = t[step];
      nx.textContent = step >= 3 ? 'Сначала' : 'Дальше';
    }
    nx.addEventListener('click', function () { step = step >= 3 ? 0 : step + 1; draw(); });
    if (alt) alt.addEventListener('click', function () { vi++; step = 0; draw(); });
    ag.addEventListener('click', function () { var old = a, g = 0; do { newA(); g++; } while (a === old && g < 20); step = 0; draw(); });
    draw();
  };

  /* @@INSERT */
})(typeof window !== 'undefined' ? window : globalThis);
