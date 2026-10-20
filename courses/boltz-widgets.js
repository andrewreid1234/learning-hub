/* Boltz course widgets: boltzyaml (input builder), boltzcmd (command builder), boltzscore (confidence_score calculator).
 * Facts checked against the installed Boltz 2.2.1 (schema.py docstring, `boltz predict --help`, writer.py). */
(function () {
  'use strict';
  var U = Hub.util, esc = U.esc, el = U.el;
  var FFA4 = 'RTRFPFFSDVKGDHRLVLAAVETTVLVLIFAVSLLGNVCALVLVARRRRRGATACLVLNLFCADLLFISAIPLVLAVRWTEAWLLGPVACHLLFYVMTLSGSVTILTLAAVSLERMVCIVHLQRGPGRRARAVLLALIWGYSAVAALPLCVFFRVVPQRISICTLIWPTIPGEISWDVSFVTLNFLVPGLVIVISYSKILQITKASRKRLTVSLAYSESHQIRVSQQDFRLFRTLFLLMVSFFIMWSPIIITILLILIQNFKQDLVIWPSLFFWVVAFTFANSALNPILYNMTLCRN';
  var UBQ = 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG';
  var TUG = 'Cc1ccc(cc1)c2ccc(cc2COc3ccc(cc3)CCC(=O)O)F';

  function field(label, node) { var w = el('div'); w.appendChild(el('label', { class: 'f' }, esc(label))); w.appendChild(node); return w; }
  function input(type, value, on, ph) { var i = el('input', { type: type }); i.value = value; if (ph) i.placeholder = ph; i.oninput = function () { on(i.value); }; return i; }
  function select(opts, value, on) {
    var s = el('select'); opts.forEach(function (o) { var op = el('option', { value: o[0] }, esc(o[1])); if (o[0] === value) op.selected = true; s.appendChild(op); });
    s.onchange = function () { on(s.value); }; return s;
  }
  function seg(options, value, onchange) {
    var s = el('div', { class: 'seg' });
    options.forEach(function (o) {
      var b = el('button', { type: 'button', class: o[0] === value ? 'on' : '' }, esc(o[1]));
      b.onclick = function () { Array.prototype.forEach.call(s.children, function (x) { x.classList.remove('on'); }); b.classList.add('on'); onchange(o[0]); };
      s.appendChild(b);
    });
    return s;
  }
  function ids(n) { var out = [], a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; for (var i = 0; i < n; i++) out.push(a[i % 26] + (i >= 26 ? Math.floor(i / 26) : '')); return out; }
  function yq(v) { return "'" + String(v).replace(/'/g, "''") + "'"; }

  /* ================= YAML BUILDER ================= */
  Hub.widget('boltzyaml', function (host) {
    var st = { name: 'my_first_boltz', ents: [], affinity: -1, pocket: false, pocketBinder: -1, pocketRes: '', pocketDist: 6 };
    function ent(type) { return { type: type, copies: 1, seq: '', mode: 'smiles', val: '', msa: 'empty', msaPath: '', cyclic: false }; }
    st.ents.push(ent('protein'));

    host.appendChild(el('h4', null, 'Boltz input (YAML) builder'));
    host.appendChild(el('p', { style: 'color:var(--muted);margin-top:0;font-size:.9rem' }, 'Chain IDs are assigned for you. Nothing leaves your browser.'));
    var chips = el('div', { class: 'chips' });
    [['Blank protein', function () { st.name = 'my_first_boltz'; st.ents = [ent('protein')]; st.affinity = -1; st.pocket = false; }],
     ['Example: ubiquitin (no MSA)', function () { st.name = 'ubiquitin_test'; var e = ent('protein'); e.seq = UBQ; st.ents = [e]; st.affinity = -1; st.pocket = false; }],
     ['Example: FFA4 + TUG-891 + affinity', function () { st.name = 'ffa4_tug891'; var p = ent('protein'); p.seq = FFA4; p.msa = 'path'; p.msaPath = '/home/YOU/boltz/msa/ffa4.a3m'; var l = ent('ligand'); l.val = TUG; st.ents = [p, l]; st.affinity = 1; st.pocket = false; }],
     ['Example: cyclic peptide', function () { st.name = 'cyclic_peptide_demo'; var e = ent('protein'); e.seq = 'LFTRRSLDSPAAR'; e.cyclic = true; st.ents = [e]; st.affinity = -1; st.pocket = false; }]
    ].forEach(function (c) { var b = el('button', { type: 'button' }, esc(c[0])); b.onclick = function () { c[1](); renderEnts(); update(); nameIn.value = st.name; renderProps(); }; chips.appendChild(b); });
    host.appendChild(chips);
    var nameIn = input('text', st.name, function (v) { st.name = v; update(); });
    host.appendChild(field('Job name (becomes the file and output name)', nameIn));
    var entBox = el('div'); host.appendChild(entBox);
    var addRow = el('div', { class: 'chips' });
    [['protein', 'Add protein / peptide'], ['rna', 'Add RNA'], ['dna', 'Add DNA'], ['ligand', 'Add ligand']].forEach(function (t) {
      var b = el('button', { type: 'button' }, '+ ' + esc(t[1])); b.onclick = function () { st.ents.push(ent(t[0])); renderEnts(); update(); renderProps(); }; addRow.appendChild(b);
    });
    host.appendChild(addRow);
    var propsBox = el('div'); host.appendChild(propsBox);
    var msgs = el('ul', { class: 'msgs' }); host.appendChild(msgs);
    var outLabel = el('div'), outBox = el('div'), actions = el('div', { class: 'chips noprint' });
    host.appendChild(outLabel); host.appendChild(outBox); host.appendChild(actions);

    function assignIds() { var pool = ids(60), k = 0; return st.ents.map(function (e) { var o = pool.slice(k, k + e.copies); k += e.copies; return o; }); }
    function renderEnts() {
      entBox.innerHTML = ''; var idMap = assignIds();
      st.ents.forEach(function (e, i) {
        var box = el('div', { class: 'ent' }), head = el('header');
        head.appendChild(el('strong', null, esc(e.type.toUpperCase()) + ' &nbsp;<span class="pill">chain ' + esc(idMap[i].join(', ')) + '</span>'));
        var rm = el('button', { type: 'button', class: 'btn danger small' }, 'Remove');
        rm.onclick = function () { st.ents.splice(i, 1); if (st.affinity === i) st.affinity = -1; else if (st.affinity > i) st.affinity--; renderEnts(); update(); renderProps(); };
        head.appendChild(rm); box.appendChild(head);
        if (e.type === 'ligand') {
          box.appendChild(seg([['smiles', 'SMILES'], ['ccd', 'CCD code']], e.mode, function (v) { e.mode = v; renderEnts(); update(); }));
          var ta = el('textarea', { placeholder: e.mode === 'smiles' ? 'Paste SMILES, e.g. ' + TUG : 'One CCD code, e.g. ATP (ions: MG)' });
          ta.value = e.val; ta.oninput = function () { e.val = ta.value; update(); };
          box.appendChild(field(e.mode === 'smiles' ? 'SMILES' : 'CCD code', ta));
        } else {
          var ta2 = el('textarea', { placeholder: 'Paste the sequence (FASTA headers, spaces and numbers are stripped)' });
          ta2.value = e.seq; ta2.oninput = function () { e.seq = ta2.value; update(); };
          box.appendChild(field(e.type + ' sequence', ta2));
        }
        var r = el('div', { class: 'row' });
        r.appendChild(field('Copies', input('number', e.copies, function (v) { e.copies = Math.max(1, Math.min(26, parseInt(v, 10) || 1)); update(); renderIdsOnly(); })));
        if (e.type === 'protein') {
          r.appendChild(field('Evolutionary info (MSA)', select([['empty', 'None: single sequence (msa: empty)'], ['path', 'My own .a3m file'], ['server', 'Remote MSA server (sends sequence off-site)']], e.msa, function (v) { e.msa = v; renderEnts(); update(); })));
          if (e.msa === 'path') r.appendChild(field('Path to .a3m on Woody (absolute)', input('text', e.msaPath, function (v) { e.msaPath = v.trim(); update(); }, '/home/you/boltz/msa/target.a3m')));
        }
        box.appendChild(r);
        if (e.type === 'protein') {
          var cy = el('label', { class: 'f', style: 'display:flex;gap:8px;align-items:center;cursor:pointer' }), cb = el('input', { type: 'checkbox' });
          cb.checked = e.cyclic; cb.onchange = function () { e.cyclic = cb.checked; update(); };
          cy.appendChild(cb); cy.appendChild(document.createTextNode('Cyclic (head-to-tail ring), for short peptides')); box.appendChild(cy);
        }
        entBox.appendChild(box);
      });
    }
    function renderIdsOnly() { var m = assignIds(), pills = entBox.querySelectorAll('header .pill'); st.ents.forEach(function (e, i) { if (pills[i]) pills[i].textContent = 'chain ' + m[i].join(', '); }); }
    function renderProps() {
      propsBox.innerHTML = '';
      var idMap = assignIds(), ligs = [], all = [];
      st.ents.forEach(function (e, i) { all.push([i, e.type.toUpperCase() + ' ' + idMap[i].join(',')]); if (e.type === 'ligand') ligs.push([i, 'Ligand ' + idMap[i].join(',')]); });
      var card = el('div', { class: 'ent' }); card.appendChild(el('strong', null, 'Optional extras'));
      var r = el('div', { class: 'row' });
      r.appendChild(field('Predict binding affinity for', select([['-1', 'None']].concat(ligs.map(function (l) { return [String(l[0]), l[1]]; })), String(st.affinity), function (v) { st.affinity = parseInt(v, 10); update(); })));
      r.appendChild(field('Pocket constraint', select([['no', 'None'], ['yes', 'Tell Boltz which residues the ligand should touch']], st.pocket ? 'yes' : 'no', function (v) { st.pocket = v === 'yes'; renderProps(); update(); })));
      card.appendChild(r);
      if (st.pocket) {
        var r2 = el('div', { class: 'row' });
        r2.appendChild(field('Ligand/binder', select(ligs.map(function (l) { return [String(l[0]), l[1]]; }), String(st.pocketBinder), function (v) { st.pocketBinder = parseInt(v, 10); update(); })));
        if (st.pocketBinder < 0 && ligs.length) st.pocketBinder = ligs[0][0];
        r2.appendChild(field('Contact residues, chain:number (e.g. A:45, A:47)', input('text', st.pocketRes, function (v) { st.pocketRes = v; update(); })));
        r2.appendChild(field('Max distance (Å)', input('number', st.pocketDist, function (v) { st.pocketDist = Math.max(1, parseFloat(v) || 6); update(); })));
        card.appendChild(r2);
      }
      propsBox.appendChild(card);
    }
    function clean(seq) { return seq.split('\n').filter(function (l) { return l.trim()[0] !== '>'; }).join('').replace(/[\s\d*\-]/g, '').toUpperCase(); }
    function heavyAtoms(s) { var m = s.replace(/\[[^\]]*\]/g, 'X').match(/Br|Cl|[BCNOPSFIX]|[bcnops]/g); return m ? m.length : 0; }

    function build() {
      var errs = [], warns = [], lines = ['version: 1', 'sequences:'], idMap = assignIds(), server = false;
      if (!/^[A-Za-z0-9_.\-]+$/.test(st.name)) errs.push('Job name: letters, numbers, underscore, dot or hyphen only.');
      if (!st.ents.length) errs.push('Add at least one entity.');
      st.ents.forEach(function (e, i) {
        var tag = e.type + ' #' + (i + 1) + ': ', idv = idMap[i].length === 1 ? idMap[i][0] : '[' + idMap[i].join(', ') + ']';
        lines.push('  - ' + e.type + ':', '      id: ' + idv);
        if (e.type === 'ligand') {
          var v = e.val.trim().replace(/\s+/g, '');
          if (!v) errs.push(tag + 'empty.');
          else if (e.mode === 'ccd') { if (!/^[A-Za-z0-9]{1,5}$/.test(v)) errs.push(tag + 'give one CCD code, e.g. ATP.'); lines.push('      ccd: ' + v.toUpperCase()); }
          else {
            if ((v.split('(').length !== v.split(')').length) || (v.split('[').length !== v.split(']').length)) errs.push(tag + 'unbalanced brackets in SMILES.');
            var rings = (v.replace(/\[[^\]]*\]/g, '').match(/[0-9]/g) || []).length; if (rings % 2) warns.push(tag + 'ring-closure digits do not pair up.');
            lines.push('      smiles: ' + yq(v));
          }
        } else {
          var s = clean(e.seq), valid = { protein: /^[ACDEFGHIKLMNPQRSTVWY]+$/, rna: /^[ACGU]+$/, dna: /^[ACGT]+$/ }[e.type];
          if (!s) errs.push(tag + 'empty sequence.'); else if (!valid.test(s)) errs.push(tag + 'unexpected letters for ' + e.type + '.');
          lines.push('      sequence: ' + s);
          if (e.type === 'protein') {
            if (e.cyclic) lines.push('      cyclic: true');
            if (e.msa === 'empty') lines.push('      msa: empty');
            else if (e.msa === 'path') { if (!/^\//.test(e.msaPath)) errs.push(tag + 'give the full path to the .a3m, starting with /.'); lines.push('      msa: ' + (e.msaPath || '/path/to/file.a3m')); }
            else { server = true; }
          }
        }
      });
      if (st.affinity >= 0 && st.ents[st.affinity]) {
        var a = st.ents[st.affinity];
        if (a.copies > 1) errs.push('Affinity: the ligand must be a single copy.');
        if (a.mode === 'smiles' && heavyAtoms(a.val) > 128) errs.push('Affinity: ligands above 128 atoms are not supported by the affinity module.');
        if (!st.ents.some(function (x) { return x.type === 'protein'; })) warns.push('Affinity is meant for a ligand bound to a protein.');
      }
      if (st.pocket && st.pocketBinder >= 0) {
        var contacts = st.pocketRes.split(/[,\s]+/).filter(Boolean).map(function (x) { var m = /^([A-Za-z]\d*):?(\d+)$/.exec(x); return m ? '[' + m[1].toUpperCase() + ', ' + m[2] + ']' : null; });
        if (!contacts.length || contacts.some(function (c) { return !c; })) errs.push('Pocket: list residues like A:45, A:47.');
        else {
          lines.push('constraints:', '  - pocket:', '      binder: ' + idMap[st.pocketBinder][0], '      contacts: [' + contacts.join(', ') + ']', '      max_distance: ' + st.pocketDist);
        }
      }
      if (st.affinity >= 0 && st.ents[st.affinity]) lines.push('properties:', '  - affinity:', '      binder: ' + idMap[st.affinity][0]);
      if (server) warns.push('A protein is set to use the remote MSA server: you must add --use_msa_server to the command, and that sends the sequence to an outside service (api.colabfold.com by default). Do not use this for unpublished sequences.');
      if (st.ents.some(function (e) { return e.type === 'protein' && e.msa === 'empty'; })) warns.push('Single-sequence mode (msa: empty) is fine for designed or cyclic peptides, but predictions for natural proteins will usually be less reliable without an MSA.');
      return { text: lines.join('\n') + '\n', errs: errs, warns: warns, server: server };
    }
    function update() {
      var r = build();
      msgs.innerHTML = '';
      r.errs.forEach(function (m) { msgs.appendChild(el('li', { class: 'err' }, 'Fix: ' + esc(m))); });
      r.warns.forEach(function (m) { msgs.appendChild(el('li', { class: 'wrn' }, 'Check: ' + esc(m))); });
      if (!r.errs.length) msgs.appendChild(el('li', { class: 'okk' }, 'Looks valid.'));
      outLabel.innerHTML = ''; outBox.innerHTML = ''; actions.innerHTML = '';
      outLabel.appendChild(el('label', { class: 'f' }, 'Your input file'));
      outBox.appendChild(U.codeBlock(r.text, (st.name || 'job') + '.yaml'));
      var fn = (st.name || 'job') + '.yaml', cmd = 'mkdir -p ~/boltz/input\ncat > ~/boltz/input/' + fn + " <<'EOF'\n" + r.text + 'EOF';
      var b1 = el('button', { type: 'button', class: 'btn ghost small' }, 'Copy "save on Woody" command'); b1.onclick = function () { U.copyText(cmd, b1); };
      var b2 = el('button', { type: 'button', class: 'btn ghost small' }, 'Download .yaml');
      b2.onclick = function () { var a = el('a', { href: URL.createObjectURL(new Blob([r.text], { type: 'text/yaml' })), download: fn }); document.body.appendChild(a); a.click(); document.body.removeChild(a); };
      actions.appendChild(b1); actions.appendChild(b2);
    }
    renderEnts(); renderProps(); update();
  });

  /* ================= COMMAND BUILDER ================= */
  Hub.widget('boltzcmd', function (host) {
    var RECIPES = {
      first: { label: 'First run (defaults)', s: { samples: 1, recycles: 3, steps: 200, seed: '', affSamples: 5, server: false }, note: 'Boltz defaults: 3 recycles, 200 sampling steps, 1 sample.' },
      rank: { label: 'Several samples, pick the best', s: { samples: 5, recycles: 3, steps: 200, seed: '', affSamples: 5, server: false }, note: 'Boltz ranks samples by <code>confidence_score</code> and writes the best as <code>model_0</code>. More samples show how stable the pose is.' },
      cyc: { label: 'Cyclic or designed peptide', s: { samples: 5, recycles: 3, steps: 200, seed: '42', affSamples: 5, server: false }, note: 'Set <code>cyclic: true</code> in the YAML and <code>msa: empty</code>, since designed sequences have no natural relatives. A fixed seed makes the run repeatable.' },
      aff: { label: 'Complex + affinity', s: { samples: 3, recycles: 3, steps: 200, seed: '', affSamples: 5, server: false }, note: 'Needs a <code>properties: affinity:</code> block in the YAML. The affinity head runs after the structure, with its own sampling settings.' },
      server: { label: 'Use remote MSA server', s: { samples: 1, recycles: 3, steps: 200, seed: '', affSamples: 5, server: true }, note: '<strong>Sends your sequences to an outside server.</strong> Only for sequences you are happy to share.' }
    };
    var s = { path: '~/boltz/input/ffa4_tug891.yaml', out: '~/boltz/output', gpu: '2', samples: 1, recycles: 3, steps: 200, seed: '', affSamples: 5, server: false, potentials: false, pdb: false, override: false, noKernels: false };
    host.appendChild(el('h4', null, 'Boltz command builder'));
    var chips = el('div', { class: 'chips' }); host.appendChild(chips);
    var note = el('div', { class: 'callout callout-note', style: 'display:none' }); host.appendChild(note);
    var ctrls = {};
    Object.keys(RECIPES).forEach(function (k) {
      var b = el('button', { type: 'button' }, esc(RECIPES[k].label));
      b.onclick = function () { Array.prototype.forEach.call(chips.children, function (x) { x.classList.toggle('on', x === b); }); for (var p in RECIPES[k].s) s[p] = RECIPES[k].s[p]; note.style.display = ''; note.innerHTML = '<span class="label">Why this recipe</span><div>' + RECIPES[k].note + '</div>'; sync(); update(); };
      chips.appendChild(b);
    });
    var grid = el('div', { class: 'row' }); host.appendChild(grid);
    function addCtl(key, label, node) { ctrls[key] = node; grid.appendChild(field(label, node)); }
    addCtl('path', 'Input: one .yaml file, or a folder of them', input('text', s.path, function (v) { s.path = v.trim(); update(); }));
    addCtl('out', 'Output folder', input('text', s.out, function (v) { s.out = v.trim(); update(); }));
    addCtl('gpu', 'GPU number (from nvidia-smi; 0-3)', input('number', s.gpu, function (v) { s.gpu = v; update(); }));
    addCtl('samples', 'Diffusion samples (--diffusion_samples)', input('number', s.samples, function (v) { s.samples = Math.max(1, parseInt(v, 10) || 1); update(); }));
    addCtl('recycles', 'Recycling steps', input('number', s.recycles, function (v) { s.recycles = Math.max(1, parseInt(v, 10) || 3); update(); }));
    addCtl('steps', 'Sampling steps', input('number', s.steps, function (v) { s.steps = Math.max(1, parseInt(v, 10) || 200); update(); }));
    addCtl('seed', 'Seed (blank = random each run)', input('text', s.seed, function (v) { s.seed = v.trim(); update(); }));
    addCtl('affSamples', 'Affinity diffusion samples', input('number', s.affSamples, function (v) { s.affSamples = Math.max(1, parseInt(v, 10) || 5); update(); }));
    var tg = el('div', { class: 'chips' });
    [['server', 'Remote MSA server'], ['potentials', 'Steering potentials'], ['pdb', 'Write .pdb instead of .cif'], ['override', 'Overwrite existing results'], ['noKernels', 'Disable custom kernels']].forEach(function (t) {
      var b = el('button', { type: 'button', class: s[t[0]] ? 'on' : '' }, esc(t[1])); b.onclick = function () { s[t[0]] = !s[t[0]]; b.classList.toggle('on', s[t[0]]); update(); }; ctrls[t[0]] = b; tg.appendChild(b);
    });
    host.appendChild(tg);
    var out = el('div'); host.appendChild(out);
    function sync() { ['samples', 'recycles', 'steps', 'seed', 'affSamples'].forEach(function (k) { ctrls[k].value = s[k]; }); ['server'].forEach(function (k) { ctrls[k].classList.toggle('on', !!s[k]); }); }
    function update() {
      var f = [];
      if (s.samples !== 1) f.push('--diffusion_samples ' + s.samples);
      if (s.recycles !== 3) f.push('--recycling_steps ' + s.recycles);
      if (s.steps !== 200) f.push('--sampling_steps ' + s.steps);
      if (s.seed) f.push('--seed ' + s.seed);
      if (s.affSamples !== 5) f.push('--diffusion_samples_affinity ' + s.affSamples);
      if (s.server) f.push('--use_msa_server');
      if (s.potentials) f.push('--use_potentials');
      if (s.pdb) f.push('--output_format pdb');
      if (s.override) f.push('--override');
      if (s.noKernels) f.push('--no_kernels');
      var cmd = 'export BOLTZ_CACHE=/scratch/drewdog/boltz/cache\nCUDA_VISIBLE_DEVICES=' + (parseInt(s.gpu, 10) || 0) + ' \\\n    /scratch/drewdog/boltz/env/bin/boltz predict ' + (s.path || 'input.yaml') + ' \\\n    --out_dir ' + (s.out || '~/boltz/output');
      f.forEach(function (x) { cmd += ' \\\n    ' + x; });
      out.innerHTML = '';
      if (s.server) out.appendChild(el('div', { class: 'callout callout-safety' }, '<span class="label">Data leaves Woody</span><div>With <code>--use_msa_server</code> your protein sequences are sent to a remote server (default <code>https://api.colabfold.com</code>). Do not use it for unpublished targets or designed binders.</div>'));
      out.appendChild(U.codeBlock(cmd, 'on Woody, inside tmux'));
      out.appendChild(el('p', { style: 'font-size:.85rem;color:var(--muted)' }, 'The checkpoints (<code>boltz2_conf.ckpt</code>, <code>boltz2_aff.ckpt</code>) are found through <code>BOLTZ_CACHE</code>. Boltz-2 is the default model.'));
    }
    update();
  });

  /* ================= SCORE CALC ================= */
  Hub.widget('boltzscore', function (host) {
    host.appendChild(el('h4', null, 'How confidence_score is made'));
    host.appendChild(el('p', { style: 'margin-top:0;color:var(--muted);font-size:.9rem' }, 'Boltz ranks its samples by <code>0.8 &times; complex_pLDDT + 0.2 &times; ipTM</code> (for a single chain, pTM replaces ipTM). Everything is on a 0-1 scale, including pLDDT, unlike AlphaFold3\'s 0-100.'));
    var s = { p: 0.92, i: 0.93 }, out = el('div', { class: 'mono', style: 'font-size:1.1rem;margin:10px 0' });
    ['p', 'i'].forEach(function (k) {
      var w = el('div'), lab = el('label', { class: 'f' }), r = el('input', { type: 'range', min: 0, max: 1, step: 0.01, value: s[k], 'aria-label': k === 'p' ? 'complex_plddt' : 'iptm' });
      lab.innerHTML = (k === 'p' ? 'complex_plddt' : 'iptm') + ': <strong></strong>'; var show = function () { lab.querySelector('strong').textContent = s[k]; };
      r.oninput = function () { s[k] = parseFloat(r.value); show(); calc(); }; r.style.width = '100%'; show(); w.appendChild(lab); w.appendChild(r); host.appendChild(w);
    });
    host.appendChild(out);
    host.appendChild(el('p', { style: 'font-size:.85rem;color:var(--muted)' }, 'Check: a real Boltz-2 result with complex_plddt 0.9245 and iptm 0.9256 has confidence_score 0.9247.'));
    function calc() { var v = 0.8 * s.p + 0.2 * s.i; out.innerHTML = 'confidence_score = <strong style="color:' + (v > 0.8 ? 'var(--good)' : v > 0.6 ? 'var(--amber)' : 'var(--danger)') + '">' + v.toFixed(3) + '</strong>'; }
    calc();
  });
})();
