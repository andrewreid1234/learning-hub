/* Learning Hub engine.
 * A course is plain data: {id,title,blurb,modules:[{id,title,skippable,lessons:[{id,title,blocks:[...]}]}]}
 * Register with Hub.register(course); register custom widgets with Hub.widget(name, fn(el, props)).
 * Block types: h, p, list, code, callout, table, check, quiz, widget, html.
 */
(function () {
  'use strict';
  var courses = [], widgets = {}, store = {};
  var KEY = 'jlhub.progress.v1', OSKEY = 'jlhub.os.v1';
  var OSES = [['win', 'Windows'], ['mac', 'Mac'], ['linux', 'Linux']];
  var osName = detectOS();
  function detectOS() {
    try { var v = localStorage.getItem(OSKEY); if (v) return v; } catch (e) { /* storage blocked */ }
    var ua = (navigator.userAgent + ' ' + (navigator.platform || '')).toLowerCase();
    return /win/.test(ua) ? 'win' : /mac|iphone|ipad/.test(ua) ? 'mac' : 'linux';
  }
  function setOS(v) { osName = v; try { localStorage.setItem(OSKEY, v); } catch (e) { /* storage blocked */ } }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function load() { try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage blocked: progress just won't persist */ } }
  function isDone(cid, lid) { return !!(store[cid] && store[cid][lid]); }
  function setDone(cid, lid, v) { store[cid] = store[cid] || {}; if (v) store[cid][lid] = 1; else delete store[cid][lid]; save(); }
  function flatLessons(c) {
    var out = [];
    c.modules.forEach(function (m) { m.lessons.forEach(function (l) { out.push({ m: m, l: l }); }); });
    return out;
  }
  function copyText(text, btn) {
    function ok() { if (!btn) return; var t = btn.textContent; btn.textContent = 'Copied'; btn.classList.add('ok'); setTimeout(function () { btn.textContent = t; btn.classList.remove('ok'); }, 1400); }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(ok, fallback); } else fallback();
    function fallback() {
      var ta = el('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { if (btn) btn.textContent = 'Select + Ctrl-C'; }
      document.body.removeChild(ta);
    }
  }

  /* code block: text may mark swap-in parts as [[like this]] (highlighted, brackets stripped when copied) */
  function codeBlock(text, label) {
    var raw = text.replace(/\[\[(.*?)\]\]/g, '$1');
    var shown = esc(text).replace(/\[\[(.*?)\]\]/g, '<span class="swap">$1</span>');
    var wrap = el('div', { class: 'codewrap' });
    var bar = el('div', { class: 'codelabel' }, '<span>' + esc(label || '') + '</span>');
    var btn = el('button', { class: 'copy', type: 'button' }, 'Copy');
    btn.onclick = function () { copyText(raw, btn); };
    bar.appendChild(btn);
    wrap.appendChild(bar);
    wrap.appendChild(el('pre', null, '<code>' + shown + '</code>'));
    return wrap;
  }

  /* ---------- block renderers ---------- */
  var R = {
    h: function (b) { return el('h2', { id: b.id || '' }, esc(b.text)); },
    sub: function (b) { return el('h3', { class: 'sub' }, esc(b.text)); },
    p: function (b) { return el('p', null, b.html); },
    html: function (b) { var d = el('div', null, b.html); return d; },
    list: function (b) { var l = el(b.ordered ? 'ol' : 'ul'); b.items.forEach(function (i) { l.appendChild(el('li', null, i)); }); return l; },
    code: function (b) { return codeBlock(b.text, b.label); },
    callout: function (b) {
      var k = b.kind || 'summary';
      return el('div', { class: 'callout callout-' + k }, '<span class="label">' + esc(b.label || k) + '</span><div>' + b.html + '</div>');
    },
    table: function (b) {
      var h = '<table><thead><tr>' + b.head.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
        b.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      var d = el('div', null, h); return d;
    },
    check: function (b, ctx) {
      var card = el('div', { class: 'card checklist' }, '<h4>' + esc(b.title || 'Checkpoint') + '</h4>');
      var k = ctx.cid + '/' + ctx.lid + '/' + (b.id || b.title);
      var saved = (store._checks && store._checks[k]) || {};
      b.items.forEach(function (it, i) {
        var lab = el('label'), cb = el('input', { type: 'checkbox' });
        cb.checked = !!saved[i];
        cb.onchange = function () { store._checks = store._checks || {}; store._checks[k] = store._checks[k] || {}; store._checks[k][i] = cb.checked ? 1 : 0; save(); };
        lab.appendChild(cb); lab.appendChild(el('span', null, it)); card.appendChild(lab);
      });
      return card;
    },
    quiz: function (b, ctx) {
      var card = el('div', { class: 'card quiz' }, '<h4>Check yourself</h4><div>' + b.q + '</div>');
      var why = el('div', { class: 'why' }); why.hidden = true;
      var btns = [];
      b.opts.forEach(function (o, i) {
        var bt = el('button', { class: 'opt', type: 'button' }, o);
        bt.onclick = function () {
          btns.forEach(function (x, j) { x.disabled = true; if (j === b.answer) x.classList.add('right'); });
          if (i !== b.answer) bt.classList.add('wrong');
          why.hidden = false; why.innerHTML = (i === b.answer ? '<strong>Correct.</strong> ' : '<strong>Not quite.</strong> ') + b.why;
        };
        btns.push(bt); card.appendChild(bt);
      });
      card.appendChild(why);
      return card;
    },
    /* os: {t:'os', win:[blocks], mac:[blocks], linux:[blocks], other:[blocks]} shows the set for the reader's chosen OS */
    os: function (b, ctx) {
      var wrap = el('div', { class: 'osblock' });
      wrap.appendChild(el('div', { class: 'oslabel' }, 'Showing instructions for <strong>' + esc(OSES.filter(function (o) { return o[0] === osName; })[0][1]) + '</strong>. Change this under &ldquo;Your computer&rdquo; in the sidebar (or the Menu on a phone).'));
      (b[osName] || b.other || []).forEach(function (x) { var r = R[x.t]; if (r) wrap.appendChild(r(x, ctx)); });
      return wrap;
    },
    widget: function (b, ctx) {
      var host = el('div', { class: 'card' });
      var fn = widgets[b.name];
      if (!fn) { host.textContent = 'Missing widget: ' + b.name; return host; }
      try { fn(host, b.props || {}, ctx); } catch (e) { host.textContent = 'Widget error: ' + e.message; }
      return host;
    }
  };

  /* ---------- views ---------- */
  var side = null, main = null;

  function renderSide(route) {
    side.innerHTML = '';
    side.appendChild(el('p', { class: 'brand' }, 'Learning Hub<small>Jamieson Group</small>'));
    var home = el('a', { class: 'nav' + (!route.cid ? ' active' : ''), href: '#/' }, '<span>All courses</span>');
    side.appendChild(home);
    courses.forEach(function (c) {
      if (route.cid && route.cid !== c.id) return;
      side.appendChild(el('h3', null, esc(c.title)));
      c.modules.forEach(function (m) {
        side.appendChild(el('div', { style: 'font-size:.8rem;color:var(--muted);margin:10px 8px 2px' }, esc(m.title) + (m.skippable ? '<span class="modtag">skippable</span>' : '')));
        m.lessons.forEach(function (l) {
          var a = el('a', { class: 'nav' + (isDone(c.id, l.id) ? ' done' : '') + (route.lid === l.id ? ' active' : ''), href: '#/' + c.id + '/' + l.id },
            '<span class="tick">&#10003;</span><span>' + esc(l.title) + '</span>');
          side.appendChild(a);
        });
      });
    });
    var osBox = el('div', { class: 'osbox' }, '<h3>Your computer</h3>');
    var osSeg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Your operating system' });
    OSES.forEach(function (o) {
      var b = el('button', { type: 'button', class: o[0] === osName ? 'on' : '' }, o[1]);
      b.onclick = function () { var y = window.scrollY; setOS(o[0]); route_(true); window.scrollTo(0, y); };
      osSeg.appendChild(b);
    });
    osBox.appendChild(osSeg); side.appendChild(osBox);
    var tools = el('div', { class: 'tools' });
    var th = el('button', { type: 'button' }, 'Theme');
    th.onclick = function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var dark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
    };
    var pr = el('button', { type: 'button' }, 'Print page'); pr.onclick = function () { window.print(); };
    var rs = el('button', { type: 'button' }, 'Reset'); rs.title = 'Clear saved progress';
    rs.onclick = function () { if (confirm('Clear all saved progress and checklists?')) { store = {}; save(); route_(); } };
    tools.appendChild(th); tools.appendChild(pr); tools.appendChild(rs);
    side.appendChild(tools);
  }

  function renderHome() {
    main.innerHTML = '';
    main.appendChild(el('div', { class: 'hero' }, '<h1>Learning Hub</h1><p>Interactive, hands-on guides for the software we use in the group. Everything here is done by you, by hand, on your own terminal: nothing needs an AI assistant to run.</p>'));
    courses.forEach(function (c) {
      var all = flatLessons(c), n = all.filter(function (x) { return isDone(c.id, x.l.id); }).length;
      var first = all[0];
      main.appendChild(el('a', { class: 'coursecard', href: '#/' + c.id + '/' + first.l.id },
        '<strong style="font-size:1.15rem">' + esc(c.title) + '</strong><div style="color:var(--muted)">' + c.blurb + '</div>' +
        '<div style="font-size:.8rem;color:var(--muted);margin-top:8px">' + all.length + ' lessons &middot; ' + n + ' complete</div>' +
        '<div class="bar"><i style="width:' + Math.round(100 * n / all.length) + '%"></i></div>'));
    });
  }

  function renderLesson(c, lid, keepScroll) {
    var all = flatLessons(c), idx = all.findIndex(function (x) { return x.l.id === lid; });
    if (idx < 0) { location.hash = '#/' + c.id + '/' + all[0].l.id; return; }
    var cur = all[idx];
    main.innerHTML = '';
    main.appendChild(el('div', { class: 'crumb' }, esc(c.title) + ' &rsaquo; ' + esc(cur.m.title)));
    main.appendChild(el('h1', null, esc(cur.l.title)));
    if (cur.m.skippable && cur.m.lessons[0] === cur.l) {
      var nextMod = all.find(function (x) { return x.m !== cur.m; });
      if (nextMod) main.appendChild(el('div', { class: 'callout callout-note' },
        '<span class="label">Already comfortable?</span><div>This module is optional background. If you already SSH into Woody and use a terminal, <a href="#/' + c.id + '/' + nextMod.l.id + '">skip to ' + esc(nextMod.l.title) + '</a>.</div>'));
    }
    var ctx = { cid: c.id, lid: lid };
    cur.l.blocks.forEach(function (b) {
      var r = R[b.t]; if (!r) return;
      main.appendChild(r(b, ctx));
    });
    var done = isDone(c.id, lid);
    var nav = el('div', { class: 'nav2' });
    var prev = all[idx - 1], next = all[idx + 1];
    nav.appendChild(prev ? el('a', { href: '#/' + c.id + '/' + prev.l.id }, '&larr; ' + esc(prev.l.title)) : el('span'));
    var mk = el('button', { type: 'button', class: done ? '' : 'primary' }, done ? 'Completed (undo)' : (next ? 'Mark complete' : 'Mark course complete'));
    mk.onclick = function () {
      setDone(c.id, lid, !done);
      if (!done && next) location.hash = '#/' + c.id + '/' + next.l.id; else route_();
    };
    nav.appendChild(mk);
    nav.appendChild(next ? el('a', { href: '#/' + c.id + '/' + next.l.id }, esc(next.l.title) + ' &rarr;') : el('span'));
    main.appendChild(nav);
    if (!keepScroll) window.scrollTo(0, 0);
  }

  function route_(keep) {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var c = courses.find(function (x) { return x.id === parts[0]; });
    var route = { cid: c && c.id, lid: parts[1] };
    renderSide(route);
    if (!c) renderHome(); else renderLesson(c, parts[1], keep === true);
    if (keep !== true) document.body.classList.remove('menu');
  }

  window.Hub = {
    register: function (c) { courses.push(c); },
    widget: function (name, fn) { widgets[name] = fn; },
    util: { esc: esc, el: el, copyText: copyText, codeBlock: codeBlock },
    start: function () {
      load();
      side = document.getElementById('side'); main = document.getElementById('main');
      document.getElementById('menuBtn').onclick = function () { document.body.classList.toggle('menu'); };
      window.addEventListener('hashchange', route_);
      route_();
    }
  };
})();
