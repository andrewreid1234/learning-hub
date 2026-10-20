/* Learning Hub engine.
 * A course is plain data: {id,title,blurb,modules:[{id,title,skippable,lessons:[{id,title,blocks:[...]}]}]}
 * Register with Hub.register(course); register custom widgets with Hub.widget(name, fn(el, props)).
 * Block types: h, p, list, code, callout, table, check, quiz, widget, html.
 */
(function () {
  'use strict';
  var courses = [], widgets = {}, store = {};
  var PKEY = 'jlhub.profiles.v2', OLDKEY = 'jlhub.progress.v1', OLDOS = 'jlhub.os.v1';
  var OSES = [['win', 'Windows'], ['mac', 'Mac'], ['linux', 'Linux']];
  var prof = { cur: 'Guest', names: ['Guest'], prefs: {} };
  var osName = 'linux';
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: nothing will persist */ } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } }
  function progKey(n) { return 'jlhub.progress.v2.' + encodeURIComponent(n); }
  function guessOS() {
    var ua = (navigator.userAgent + ' ' + (navigator.platform || '')).toLowerCase();
    return /win/.test(ua) ? 'win' : /mac|iphone|ipad/.test(ua) ? 'mac' : 'linux';
  }
  function myPrefs() { return prof.prefs[prof.cur] || (prof.prefs[prof.cur] = {}); }
  function saveProf() { lsSet(PKEY, JSON.stringify(prof)); }
  function setOS(v) { osName = v; myPrefs().os = v; saveProf(); }
  function applyPrefs() {
    var pr = myPrefs();
    osName = pr.os || guessOS();
    if (pr.theme) document.documentElement.setAttribute('data-theme', pr.theme); else document.documentElement.removeAttribute('data-theme');
  }
  function cleanName(n) { return String(n || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30); }
  function nameTaken(n, except) { return prof.names.some(function (x) { return x !== except && x.toLowerCase() === n.toLowerCase(); }); }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function load() {
    var raw = lsGet(PKEY), ok = false;
    if (raw) { try { var o = JSON.parse(raw); if (o && o.names && o.names.length && o.names.indexOf(o.cur) >= 0) { prof = o; prof.prefs = prof.prefs || {}; ok = true; } } catch (e) { /* corrupt: start fresh */ } }
    if (!ok) {   /* first run, or upgrading from the single-user version */
      prof = { cur: 'Guest', names: ['Guest'], prefs: {} };
      var old = lsGet(OLDKEY), oos = lsGet(OLDOS);
      if (old) lsSet(progKey('Guest'), old);
      if (oos) prof.prefs.Guest = { os: oos };
      saveProf();
    }
    loadStore(); applyPrefs();
  }
  function loadStore() { try { store = JSON.parse(lsGet(progKey(prof.cur))) || {}; } catch (e) { store = {}; } }
  function save() { lsSet(progKey(prof.cur), JSON.stringify(store)); }
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

  /* ---------- profiles and progress ---------- */
  function switchProfile(n) { prof.cur = n; saveProf(); loadStore(); applyPrefs(); route_(); }
  function newProfile(raw) {
    var n = cleanName(raw);
    if (!n) { alert('Please type a name.'); return false; }
    if (nameTaken(n)) { alert('There is already a profile called "' + n + '".'); return false; }
    prof.names.push(n); prof.prefs[n] = { os: osName, theme: myPrefs().theme }; prof.cur = n; saveProf(); store = {}; save(); applyPrefs(); route_(); return true;
  }
  function renameProfile(raw) {
    var n = cleanName(raw), old = prof.cur;
    if (!n || n === old) return false;
    if (nameTaken(n, old)) { alert('There is already a profile called "' + n + '".'); return false; }
    var data = lsGet(progKey(old));
    prof.names[prof.names.indexOf(old)] = n; prof.prefs[n] = prof.prefs[old] || {}; delete prof.prefs[old]; prof.cur = n;
    if (data != null) lsSet(progKey(n), data);
    lsDel(progKey(old)); saveProf(); route_(); return true;
  }
  function deleteProfile() {
    if (prof.names.length < 2) { alert('This is your only profile, so it cannot be deleted. Use "Reset all progress" to clear it instead.'); return; }
    if (!confirm('Delete the profile "' + prof.cur + '" and all of its saved progress? This cannot be undone.')) return;
    var gone = prof.cur; lsDel(progKey(gone));
    prof.names = prof.names.filter(function (x) { return x !== gone; }); delete prof.prefs[gone]; prof.cur = prof.names[0];
    saveProf(); loadStore(); applyPrefs(); route_();
  }
  function resetCourse(c) {
    if (!confirm('Reset your progress and checklists for "' + c.title + '"? Other courses are not affected.')) return;
    delete store[c.id];
    if (store._checks) Object.keys(store._checks).forEach(function (k) { if (k.indexOf(c.id + '/') === 0) delete store._checks[k]; });
    if (store._last && store._last.cid === c.id) delete store._last;
    save(); route_();
  }
  function resetAll() {
    if (!confirm('Reset ALL progress and checklists for "' + prof.cur + '"? Your name and preferences are kept.')) return;
    store = {}; save(); route_();
  }
  function exportProfile() {
    var data = JSON.stringify({ format: 'jlhub-profile', version: 2, name: prof.cur, prefs: myPrefs(), progress: store }, null, 2);
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = 'learning-hub-' + prof.cur.replace(/[^\w.-]+/g, '_') + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function importProfile(file) {
    var rd = new FileReader();
    rd.onload = function () {
      var o; try { o = JSON.parse(rd.result); } catch (e) { alert('That file is not a Learning Hub profile.'); return; }
      if (!o || o.format !== 'jlhub-profile' || typeof o.progress !== 'object' || o.progress === null) { alert('That file is not a Learning Hub profile.'); return; }
      var n = cleanName(o.name) || 'Imported', base = n, i = 2;
      while (nameTaken(n)) { n = base + ' (' + i++ + ')'; }
      prof.names.push(n); prof.prefs[n] = (o.prefs && typeof o.prefs === 'object') ? { os: o.prefs.os, theme: o.prefs.theme } : {}; prof.cur = n; saveProf();
      store = o.progress; save(); applyPrefs(); route_();
    };
    rd.readAsText(file);
  }

  /* ---------- views ---------- */
  var side = null, main = null;

  function renderSide(route) {
    side.innerHTML = '';
    side.appendChild(el('p', { class: 'brand' }, 'Learning Hub<small>Jamieson Group</small>'));
    var pb = el('div', { class: 'profbox' }, '<h3>Learning as</h3>');
    var sel = el('select', { 'aria-label': 'Choose profile' });
    prof.names.forEach(function (n) { var o = el('option', { value: n }, esc(n)); if (n === prof.cur) o.selected = true; sel.appendChild(o); });
    sel.onchange = function () { switchProfile(sel.value); };
    pb.appendChild(sel);
    var prow = el('div', { class: 'prow' });
    [['New', function () { var n = prompt('Name for the new profile:'); if (n !== null) newProfile(n); }],
     ['Rename', function () { var n = prompt('New name for "' + prof.cur + '":', prof.cur); if (n !== null) renameProfile(n); }],
     ['Delete', deleteProfile]].forEach(function (x) { var b = el('button', { type: 'button' }, x[0]); b.onclick = x[1]; prow.appendChild(b); });
    pb.appendChild(prow);
    side.appendChild(pb);
    var home = el('a', { class: 'nav' + (!route.cid ? ' active' : ''), href: '#/' }, '<span>All courses</span>');
    side.appendChild(home);
    if (!route.cid) {
      side.appendChild(el('h3', null, 'Courses'));
      courses.forEach(function (c) {
        var all = flatLessons(c), n = all.filter(function (x) { return isDone(c.id, x.l.id); }).length;
        side.appendChild(el('a', { class: 'nav', href: '#/' + c.id + '/' + all[0].l.id },
          '<span>' + esc(c.title) + '<small class="cnt">' + n + ' / ' + all.length + ' lessons</small></span>'));
      });
    }
    courses.forEach(function (c) {
      if (!route.cid || route.cid !== c.id) return;
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
      myPrefs().theme = dark ? 'light' : 'dark'; saveProf(); applyPrefs();
    };
    var pr = el('button', { type: 'button' }, 'Print page'); pr.onclick = function () { window.print(); };
    tools.appendChild(th); tools.appendChild(pr);
    side.appendChild(tools);
    var pg = el('details', { class: 'progbox' }, '<summary>Progress</summary>');
    var cc = route.cid && courses.find(function (x) { return x.id === route.cid; });
    var items = [];
    if (cc) items.push(['Reset this course', function () { resetCourse(cc); }, 'danger']);
    items.push(['Reset all progress', resetAll, 'danger']);
    items.push(['Export my progress', exportProfile]);
    var imp = el('input', { type: 'file', accept: '.json,application/json', style: 'display:none', 'aria-label': 'Import progress file' });
    imp.onchange = function () { if (imp.files[0]) importProfile(imp.files[0]); };
    items.push(['Import progress', function () { imp.click(); }]);
    items.forEach(function (x) { var b = el('button', { type: 'button', class: x[2] || '' }, x[0]); b.onclick = x[1]; pg.appendChild(b); });
    pg.appendChild(imp);
    pg.appendChild(el('p', { class: 'hint' }, 'Profiles and progress are stored in this browser only. Export a file to move yours to another computer.'));
    side.appendChild(pg);
  }

  function plain(html) { return String(html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\[\[|\]\]/g, ''); }
  function blockText(b) {
    var t = [b.text, b.html, b.label, b.q, b.title, b.why].concat(b.items || [], b.opts || [], b.head || []);
    (b.rows || []).forEach(function (r) { t = t.concat(r); });
    ['win', 'mac', 'linux'].forEach(function (k) { (b[k] || []).forEach(function (x) { t.push(blockText(x)); }); });
    return t.filter(function (x) { return typeof x === 'string'; }).join(' ');
  }
  var searchIdx = null;
  function buildIndex() {
    searchIdx = [];
    courses.forEach(function (c) {
      c.modules.forEach(function (m) {
        m.lessons.forEach(function (l) {
          var body = plain(l.blocks.map(blockText).join(' ')).replace(/\s+/g, ' ');
          searchIdx.push({ c: c, m: m, l: l, title: l.title.toLowerCase(), body: body, low: body.toLowerCase() });
        });
      });
    });
  }
  function search(q) {
    if (!searchIdx) buildIndex();
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    var out = [];
    searchIdx.forEach(function (e) {
      var score = 0, ok = true;
      words.forEach(function (w) {
        var inT = e.title.indexOf(w) >= 0, inB = e.low.indexOf(w) >= 0;
        if (!inT && !inB) ok = false; else score += (inT ? 5 : 0) + (inB ? 1 : 0);
      });
      if (ok) {
        var pos = e.low.indexOf(words[0]), snip = '';
        if (pos >= 0) snip = (pos > 40 ? '&hellip;' : '') + esc(e.body.substr(Math.max(0, pos - 40), 150)) + '&hellip;';
        out.push({ e: e, score: score, snip: snip });
      }
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, 12);
  }

  function renderHome() {
    main.innerHTML = '';
    var total = 0, done = 0, last = store._last;
    courses.forEach(function (c) {
      flatLessons(c).forEach(function (x) { total++; if (isDone(c.id, x.l.id)) done++; });
    });
    var lastLesson = null;
    if (last) { var lc = courses.find(function (c) { return c.id === last.cid; }); if (lc) { var lf = flatLessons(lc).find(function (x) { return x.l.id === last.lid; }); if (lf) lastLesson = { c: lc, l: lf.l }; } }
    var firstC = courses[0], firstL = firstC && flatLessons(firstC)[0].l;

    var hero = el('section', { class: 'landing' });
    var fresh = prof.names.length === 1 && prof.cur === 'Guest' && !total0();
    function total0() { return Object.keys(store).some(function (k) { return k.charAt(0) !== '_'; }); }
    hero.appendChild(el('div', { class: 'eyebrow' }, 'Jamieson Group &middot; School of Chemistry, University of Glasgow'));
    hero.appendChild(el('h1', null, 'Learn the tools.<br>Run them yourself.'));
    hero.appendChild(el('p', { class: 'lede' }, 'Step-by-step, hands-on courses for the software we use on Woody, our shared GPU server. Written for complete beginners, with shortcuts for experienced users. Everything is done by you, by hand, so nothing needs an assistant to run.'));
    var cta = el('div', { class: 'cta' });
    function browse() {
      var b = el('button', { type: 'button', class: 'btn big ghost' }, 'Browse courses');
      b.onclick = function () { document.getElementById('courses').scrollIntoView({ behavior: 'smooth' }); };
      return b;
    }
    if (lastLesson) {
      cta.appendChild(el('a', { class: 'btn big', href: '#/' + lastLesson.c.id + '/' + lastLesson.l.id }, 'Continue: ' + esc(lastLesson.l.title)));
      cta.appendChild(browse());
    } else {
      cta.appendChild(el('a', { class: 'btn big', href: '#/' + firstC.id + '/' + firstL.id }, 'Start with ' + esc(firstC.title)));
      cta.appendChild(browse());
    }
    hero.appendChild(cta);
    if (fresh) {
      var wc = el('div', { class: 'welcome' }, '<strong>What should we call you?</strong><span class="muted"> Optional. A name lets you keep your progress and settings separate from other people using this computer.</span>');
      var wi = el('input', { type: 'text', placeholder: 'Your name', maxlength: '30', 'aria-label': 'Your name' });
      var wb = el('button', { type: 'button', class: 'btn' }, 'Save name');
      wb.onclick = function () { if (renameProfile(wi.value)) { /* route_ re-renders */ } };
      wi.onkeydown = function (e) { if (e.key === 'Enter') wb.onclick(); };
      var wr = el('div', { class: 'wrow' }); wr.appendChild(wi); wr.appendChild(wb); wc.appendChild(wr);
      hero.appendChild(wc);
    } else if (prof.cur !== 'Guest') {
      hero.insertBefore(el('p', { class: 'hello' }, 'Welcome back, <strong>' + esc(prof.cur) + '</strong>.'), cta);
    }
    var stats = el('div', { class: 'stats' });
    stats.appendChild(el('div', null, '<b>' + courses.length + '</b><span>courses</span>'));
    stats.appendChild(el('div', null, '<b>' + total + '</b><span>lessons</span>'));
    stats.appendChild(el('div', null, '<b>' + done + '</b><span>completed by you</span>'));
    hero.appendChild(stats);
    main.appendChild(hero);

    var feats = el('div', { class: 'feats' });
    [['Hands-on', 'Every lesson ends in something you do on the real machine, with a checkpoint so you know it worked.'],
     ['Interactive tools', 'Build input files, explore every parameter, and practise reading real results with built-in widgets.'],
     ['Made for your computer', 'Windows, Mac or Linux: pick yours once in the sidebar and the instructions follow it.']].forEach(function (f) {
      feats.appendChild(el('div', { class: 'feat' }, '<h3>' + f[0] + '</h3><p>' + f[1] + '</p>'));
    });
    main.appendChild(feats);

    var sr = el('div', { class: 'searchbox' });
    var inp = el('input', { type: 'search', placeholder: 'Search lessons: tmux, MSA, rsync', 'aria-label': 'Search lessons' });
    var res = el('div', { class: 'results', 'aria-live': 'polite' });
    inp.oninput = function () {
      var r = search(inp.value); res.innerHTML = '';
      if (inp.value.trim() && !r.length) res.appendChild(el('p', { class: 'muted' }, 'No lessons match. Try a shorter or different word.'));
      r.forEach(function (x) {
        res.appendChild(el('a', { class: 'result', href: '#/' + x.e.c.id + '/' + x.e.l.id },
          '<strong>' + esc(x.e.l.title) + '</strong><span class="where">' + esc(x.e.c.title) + ' &rsaquo; ' + esc(x.e.m.title) + '</span><span class="snip">' + x.snip + '</span>'));
      });
    };
    sr.appendChild(inp); sr.appendChild(res); main.appendChild(sr);

    main.appendChild(el('h2', { id: 'courses', class: 'sect' }, 'Courses'));
    main.appendChild(el('p', { class: 'muted' }, 'If you are new to Woody, begin with <strong>Using Woody</strong>. Then take whichever software course you need.'));
    var grid = el('div', { class: 'grid' });
    courses.forEach(function (c, ci) {
      var all = flatLessons(c), n = all.filter(function (x) { return isDone(c.id, x.l.id); }).length;
      var next = all.find(function (x) { return !isDone(c.id, x.l.id); });
      var label = n === 0 ? 'Start course' : (n === all.length ? 'Review course' : 'Continue');
      var target = n === all.length || !next ? all[0] : next;
      var card = el('a', { class: 'coursecard', href: '#/' + c.id + '/' + target.l.id });
      card.innerHTML =
        '<div class="ctop"><span class="num">' + (ci + 1) + '</span>' + (c.tag ? '<span class="tagpill">' + esc(c.tag) + '</span>' : '') + '</div>' +
        '<strong class="ctitle">' + esc(c.title) + '</strong>' +
        '<div class="cblurb">' + c.blurb + '</div>' +
        '<div class="cmeta">' + c.modules.length + ' modules &middot; ' + all.length + ' lessons' + (c.minutes ? ' &middot; about ' + (c.minutes >= 60 ? Math.round(c.minutes / 6) / 10 + ' hours' : c.minutes + ' min') : '') + '</div>' +
        '<div class="bar"><i style="width:' + Math.round(100 * n / all.length) + '%"></i></div>' +
        '<div class="cfoot"><span>' + n + ' of ' + all.length + ' complete</span><span class="go">' + label + ' &rarr;</span></div>';
      grid.appendChild(card);
    });
    main.appendChild(grid);

    main.appendChild(el('p', { class: 'footnote' }, 'Progress is saved in this browser only. Nothing is sent anywhere. The courses are written to be followed by hand; commands were checked against the real Woody install.'));
    window.scrollTo(0, 0);
  }

  function renderLesson(c, lid, keepScroll) {
    var all = flatLessons(c), idx = all.findIndex(function (x) { return x.l.id === lid; });
    if (idx < 0) { location.hash = '#/' + c.id + '/' + all[0].l.id; return; }
    var cur = all[idx];
    store._last = { cid: c.id, lid: lid }; save();
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
