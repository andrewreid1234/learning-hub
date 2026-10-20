/* AlphaFold3 course widgets: jsonbuilder, cmdbuilder, paramref, resulttrainer, scorecalc, triage */
(function () {
  'use strict';
  var U = Hub.util, esc = U.esc, el = U.el;

  var FFA4 = 'RTRFPFFSDVKGDHRLVLAAVETTVLVLIFAVSLLGNVCALVLVARRRRRGATACLVLNLFCADLLFISAIPLVLAVRWTEAWLLGPVACHLLFYVMTLSGSVTILTLAAVSLERMVCIVHLQRGPGRRARAVLLALIWGYSAVAALPLCVFFRVVPQRISICTLIWPTIPGEISWDVSFVTLNFLVPGLVIVISYSKILQITKASRKRLTVSLAYSESHQIRVSQQDFRLFRTLFLLMVSFFIMWSPIIITILLILIQNFKQDLVIWPSLFFWVVAFTFANSALNPILYNMTLCRN';
  var UBQ = 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG';
  var TUG = 'Cc1ccc(cc1)c2ccc(cc2COc3ccc(cc3)CCC(=O)O)F';

  function seg(options, value, onchange) {
    var s = el('div', { class: 'seg' });
    options.forEach(function (o) {
      var b = el('button', { type: 'button', class: o[0] === value ? 'on' : '' }, esc(o[1]));
      b.onclick = function () { Array.prototype.forEach.call(s.children, function (x) { x.classList.remove('on'); }); b.classList.add('on'); onchange(o[0]); };
      s.appendChild(b);
    });
    return s;
  }
  function field(label, node) { var w = el('div'); w.appendChild(el('label', { class: 'f' }, esc(label))); w.appendChild(node); return w; }
  function input(type, value, on) { var i = el('input', { type: type }); i.value = value; i.oninput = function () { on(i.value); }; return i; }
  function select(opts, value, on) {
    var s = el('select'); opts.forEach(function (o) { var op = el('option', { value: o[0] }, esc(o[1])); if (o[0] === value) op.selected = true; s.appendChild(op); });
    s.onchange = function () { on(s.value); }; return s;
  }
  function ids(n) { var out = [], a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; for (var i = 0; i < n; i++) out.push(a[i % 26] + (i >= 26 ? Math.floor(i / 26) : '')); return out; }

  /* ================= JSON BUILDER ================= */
  Hub.widget('jsonbuilder', function (host) {
    var st = { name: 'my_first_job', seeds: '1', ents: [] };
    function ent(type) { return { type: type, copies: 1, seq: '', mode: 'smiles', val: '', desc: '', msa: 'auto', tmpl: 'auto' }; }
    st.ents.push(ent('protein'));

    host.appendChild(el('h4', null, 'Input JSON builder'));
    host.appendChild(el('p', { style: 'color:var(--muted);margin-top:0;font-size:.9rem' }, 'Build your input file with forms. Chain IDs are assigned for you (A, B, C&hellip;). Nothing leaves your browser.'));
    var chips = el('div', { class: 'chips' });
    [['Blank protein', function () { st.name = 'my_first_job'; st.seeds = '1'; st.ents = [ent('protein')]; }],
     ['Example: ubiquitin', function () { st.name = 'ubiquitin_monomer'; st.seeds = '42'; var e = ent('protein'); e.seq = UBQ; e.desc = 'Human ubiquitin, 76 residues (UniProt P0CG48)'; st.ents = [e]; }],
     ['Example: FFA4 + TUG-891', function () { st.name = 'ffa4_tug891'; st.seeds = '1'; var p = ent('protein'); p.seq = FFA4; p.desc = 'FFA4 / GPR120 receptor construct (297 aa)'; var l = ent('ligand'); l.val = TUG; l.desc = 'TUG-891, FFA4 agonist'; st.ents = [p, l]; }],
     ['Template: protein + macrocycle', function () { st.name = 'target_plus_macrocycle'; st.seeds = '1'; var p = ent('protein'); p.desc = 'my target'; var l = ent('ligand'); l.desc = 'my macrocycle'; st.ents = [p, l]; }],
     ['Example: homodimer (2 copies)', function () { st.name = 'homodimer_test'; st.seeds = '1'; var p = ent('protein'); p.copies = 2; p.seq = UBQ; p.desc = 'two copies of the same chain'; st.ents = [p]; }]
    ].forEach(function (c) { var b = el('button', { type: 'button' }, esc(c[0])); b.onclick = function () { c[1](); renderEnts(); update(); syncTop(); }; chips.appendChild(b); });
    host.appendChild(chips);

    var top = el('div', { class: 'row' });
    var nameIn = input('text', st.name, function (v) { st.name = v; update(); });
    var seedIn = input('text', st.seeds, function (v) { st.seeds = v; update(); });
    top.appendChild(field('Job name (becomes the output folder name)', nameIn));
    top.appendChild(field('Model seeds (comma separated whole numbers)', seedIn));
    host.appendChild(top);
    function syncTop() { nameIn.value = st.name; seedIn.value = st.seeds; }

    var entBox = el('div'); host.appendChild(entBox);
    var addRow = el('div', { class: 'chips' });
    [['protein', 'Add protein'], ['rna', 'Add RNA'], ['dna', 'Add DNA'], ['ligand', 'Add ligand / macrocycle / ion']].forEach(function (t) {
      var b = el('button', { type: 'button' }, '+ ' + esc(t[1])); b.onclick = function () { st.ents.push(ent(t[0])); renderEnts(); update(); }; addRow.appendChild(b);
    });
    host.appendChild(addRow);

    var msgs = el('ul', { class: 'msgs' }); host.appendChild(msgs);
    var outLabel = el('div'); host.appendChild(outLabel);
    var outBox = el('div'); host.appendChild(outBox);
    var actions = el('div', { class: 'chips noprint' }); host.appendChild(actions);

    function renderEnts() {
      entBox.innerHTML = '';
      var idMap = assignIds();
      st.ents.forEach(function (e, i) {
        var box = el('div', { class: 'ent' });
        var head = el('header');
        head.appendChild(el('strong', null, esc(e.type.toUpperCase()) + ' &nbsp;<span class="pill">chain ' + esc(idMap[i].join(', ')) + '</span>'));
        var rm = el('button', { type: 'button', class: 'btn danger small' }, 'Remove');
        rm.onclick = function () { st.ents.splice(i, 1); renderEnts(); update(); };
        head.appendChild(rm); box.appendChild(head);
        if (e.type === 'ligand') {
          box.appendChild(seg([['smiles', 'SMILES'], ['ccd', 'CCD code(s)']], e.mode, function (v) { e.mode = v; renderEnts(); update(); }));
          var ta = el('textarea', { placeholder: e.mode === 'smiles' ? 'Paste SMILES, e.g. ' + TUG : 'e.g. ATP   (or MG for a magnesium ion; separate several with commas)' });
          ta.value = e.val; ta.oninput = function () { e.val = ta.value; update(); };
          box.appendChild(field(e.mode === 'smiles' ? 'SMILES (macrocycles and peptidomimetics go here, not in a protein entity)' : 'Chemical Component Dictionary code(s)', ta));
        } else {
          var ta2 = el('textarea', { placeholder: 'Paste the sequence (FASTA header lines and spaces/numbers are stripped for you)' });
          ta2.value = e.seq; ta2.oninput = function () { e.seq = ta2.value; update(); };
          box.appendChild(field(e.type + ' sequence', ta2));
        }
        var r = el('div', { class: 'row' });
        r.appendChild(field('Copies of this chain', input('number', e.copies, function (v) { e.copies = Math.max(1, Math.min(26, parseInt(v, 10) || 1)); update(); renderIdsOnly(); })));
        r.appendChild(field('Description (optional, for your records)', input('text', e.desc, function (v) { e.desc = v; update(); })));
        box.appendChild(r);
        if (e.type === 'protein' || e.type === 'rna') {
          var r2 = el('div', { class: 'row' });
          r2.appendChild(field('Evolutionary search (MSA)', select([['auto', 'Automatic (default, recommended)'], ['skip', 'Skip: MSA-free']], e.msa, function (v) { e.msa = v; update(); })));
          if (e.type === 'protein') r2.appendChild(field('Structural templates', select([['auto', 'Automatic search (default)'], ['none', 'None: template-free']], e.tmpl, function (v) { e.tmpl = v; update(); })));
          box.appendChild(r2);
        }
        entBox.appendChild(box);
      });
    }
    function renderIdsOnly() { var m = assignIds(); var pills = entBox.querySelectorAll('header .pill'); st.ents.forEach(function (e, i) { if (pills[i]) pills[i].textContent = 'chain ' + m[i].join(', '); }); }
    function assignIds() { var pool = ids(60), k = 0; return st.ents.map(function (e) { var out = pool.slice(k, k + e.copies); k += e.copies; return out; }); }

    function clean(seq) { return seq.split('\n').filter(function (l) { return l.trim()[0] !== '>'; }).join('').replace(/[\s\d*\-]/g, '').toUpperCase(); }
    function heavyAtoms(s) { var m = s.replace(/\[[^\]]*\]/g, 'X').match(/Br|Cl|[BCNOPSFIX]|[bcnops]/g); return m ? m.length : 0; }

    function build() {
      var errs = [], warns = [], tokens = 0, idMap = assignIds();
      if (!/^[A-Za-z0-9_.\-]+$/.test(st.name)) errs.push('Job name: use only letters, numbers, underscore, dot or hyphen (no spaces).');
      var seeds = st.seeds.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      if (!seeds.length || seeds.some(function (x) { return !/^\d+$/.test(x); })) errs.push('Seeds must be whole numbers, e.g. 1 or 1,2,3.');
      if (!st.ents.length) errs.push('Add at least one entity.');
      var seqs = [];
      st.ents.forEach(function (e, i) {
        var tag = e.type + ' #' + (i + 1) + ': ', idv = idMap[i].length === 1 ? idMap[i][0] : idMap[i], o = {}, body = { id: idv };
        if (e.type === 'ligand') {
          var v = e.val.trim();
          if (!v) { errs.push(tag + 'empty.'); }
          else if (e.mode === 'ccd') {
            var codes = v.split(/[\s,]+/).filter(Boolean).map(function (x) { return x.toUpperCase(); });
            if (codes.some(function (c) { return !/^[A-Z0-9]{1,5}$/.test(c); })) errs.push(tag + 'CCD codes are 1-5 letters/digits, e.g. ATP, MG, HEM.');
            body.ccdCodes = codes; tokens += codes.length * e.copies;
          } else {
            v = v.replace(/\s+/g, '');
            var bal = function (a, b) { return (v.split(a).length - 1) === (v.split(b).length - 1); };
            if (!bal('(', ')') || !bal('[', ']')) errs.push(tag + 'unbalanced brackets in SMILES.');
            if (!/^[A-Za-z0-9@+\-\[\]\(\)\\\/=#$:.%*]+$/.test(v)) errs.push(tag + 'SMILES contains characters that are not valid SMILES.');
            var rings = (v.replace(/\[[^\]]*\]/g, '').match(/[0-9]/g) || []).length; if (rings % 2) warns.push(tag + 'ring-closure digits do not pair up. Check that every ring is opened and closed.');
            if (v.indexOf('\\') >= 0) warns.push(tag + 'contains a backslash. That is fine: this builder escapes it for JSON automatically. If you type JSON by hand you must double it.');
            body.smiles = v; tokens += heavyAtoms(v) * e.copies;
          }
        } else {
          var s = clean(e.seq), valid = { protein: /^[ACDEFGHIKLMNPQRSTVWY]+$/, rna: /^[ACGU]+$/, dna: /^[ACGT]+$/ }[e.type];
          if (!s) errs.push(tag + 'empty sequence.');
          else if (!valid.test(s)) {
            var bad = s.split('').filter(function (c, j, a) { return !valid.test(c) && a.indexOf(c) === j; }).join(' ');
            (e.type === 'protein' && /^[A-Z]+$/.test(s) ? warns : errs).push(tag + 'unexpected letters: ' + bad + (e.type === 'protein' ? ' (not one of the 20 standard amino acids; X, U, B, Z are not standard, check your source)' : ' (' + e.type.toUpperCase() + ' accepts only ' + (e.type === 'rna' ? 'A C G U' : 'A C G T') + ')'));
          }
          body.sequence = s; tokens += s.length * e.copies;
          if (e.type === 'protein' && s.length > 0 && s.length < 3) warns.push(tag + 'very short protein chain. Short or cyclic peptides usually belong in a ligand entity (SMILES).');
          if (e.msa === 'skip') body.unpairedMsa = '';
          if (e.msa === 'skip' && e.type === 'protein') body.pairedMsa = '';
          if (e.type === 'protein' && e.tmpl === 'none') body.templates = [];
        }
        if (e.desc.trim()) body.description = e.desc.trim();
        var orderd = { id: body.id }; Object.keys(body).forEach(function (k) { if (k !== 'id') orderd[k] = body[k]; });
        o[e.type] = orderd; seqs.push(o);
      });
      var json = { name: st.name, sequences: seqs, modelSeeds: seeds.map(Number), dialect: 'alphafold3', version: 4 };
      if (tokens > 1500) warns.push('Approx. size ' + tokens + ' tokens: large for a 24 GB card. If it runs out of memory see the unified-memory switch in the Command builder.');
      return { json: json, errs: errs, warns: warns, tokens: tokens };
    }

    function update() {
      var r = build();
      msgs.innerHTML = '';
      r.errs.forEach(function (m) { msgs.appendChild(el('li', { class: 'err' }, 'Fix: ' + esc(m))); });
      r.warns.forEach(function (m) { msgs.appendChild(el('li', { class: 'wrn' }, 'Check: ' + esc(m))); });
      if (!r.errs.length) msgs.appendChild(el('li', { class: 'okk' }, 'Looks valid. Approx. size ' + r.tokens + ' tokens (residues + ligand heavy atoms).'));
      var text = JSON.stringify(r.json, null, 2);
      outLabel.innerHTML = ''; outBox.innerHTML = ''; actions.innerHTML = '';
      outLabel.appendChild(el('label', { class: 'f' }, 'Your input file'));
      outBox.appendChild(U.codeBlock(text, (st.name || 'job') + '.json'));
      var fn = (st.name || 'job') + '.json';
      var cmd = 'cat > ~/af3/input/' + fn + " <<'EOF'\n" + text + '\nEOF';
      var b1 = el('button', { type: 'button', class: 'btn ghost small' }, 'Copy "save on Woody" command');
      b1.onclick = function () { U.copyText(cmd, b1); };
      var b2 = el('button', { type: 'button', class: 'btn ghost small' }, 'Download .json');
      b2.onclick = function () {
        var a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: fn }); document.body.appendChild(a); a.click(); document.body.removeChild(a);
      };
      actions.appendChild(b1); actions.appendChild(b2);
      actions.appendChild(el('span', { style: 'font-size:.82rem;color:var(--muted);align-self:center' }, 'Paste the command into your Woody terminal to create the file, or download it and upload with WinSCP.'));
      host._last = { r: r, text: text };
    }
    host._build = build;
    renderEnts(); update();
  });

  /* ================= PARAMETER DATA ================= */
  var PARAMS = [
    { cat: 'Input JSON', name: 'modelSeeds', where: 'JSON', def: '[1]', ours: '1 to explore; 3-5 for anything you will report',
      what: 'Random seeds for the structure-sampling (diffusion) step. Every seed gives its own set of predictions.',
      why: 'AF3 is stochastic. For a confident prediction every seed agrees; for an uncertain one the seeds scatter, and that scatter is information.',
      change: 'Add seeds (e.g. [1,2,3,4,5]) when scores sit in the grey zone, when you want to know whether a binding pose is reproducible, or before putting a number in a talk. <code>--num_seeds=N</code> is a shortcut: give one seed in the JSON and AF3 generates the rest.',
      cost: 'Inference time grows roughly in proportion to seeds x samples. The slow CPU search is done once, not per seed.' },
    { cat: 'Input JSON', name: 'unpairedMsa / pairedMsa', where: 'JSON (per protein/RNA)', def: 'unset = search automatically', ours: 'leave unset',
      what: 'The multiple sequence alignment: evolutionary relatives of your sequence, which AF3 mines for structural clues. Unset = AF3 builds it. <code>""</code> = skip it. A string = supply your own A3M.',
      why: 'The MSA is the biggest source of accuracy for natural proteins, so we keep it on by default.',
      change: 'Skip (<code>""</code>) for designed sequences with no natural relatives (de novo binders), or as a control to ask "does this prediction depend on evolution or just on the model?". Supply your own only if you know why. If you hand-craft a <em>paired</em> MSA also pass <code>--resolve_msa_overlaps=false</code>.',
      cost: 'Skipping the MSA removes most of the slow CPU stage. Accuracy on natural proteins usually drops.' },
    { cat: 'Input JSON', name: 'templates', where: 'JSON (per protein)', def: 'unset = search automatically', ours: 'leave unset',
      what: 'Known PDB structures used as extra hints. <code>[]</code> = template-free (the MSA is still used).',
      why: 'Templates help when a close structure exists. But they can also anchor the model to a conformation you did not intend.',
      change: 'Use <code>[]</code> when you want to test whether AF3 reaches a fold on its own, or you suspect a template is biasing the state (e.g. active vs inactive GPCR). See also <code>--max_template_date</code>.',
      cost: 'None significant.' },
    { cat: 'Input JSON', name: 'ligand: smiles vs ccdCodes', where: 'JSON (ligand)', def: 'no default: pick one per ligand', ours: 'CCD for standard cofactors/ions; SMILES for anything custom',
      what: '<code>ccdCodes</code> names a standard PDB component (<code>["ATP"]</code>, <code>["MG"]</code>). <code>smiles</code> describes any molecule by its structure.',
      why: 'Macrocycles, stapled peptides, D-amino acids and N-methylation cannot be expressed in a <code>protein</code> entity, so they go in as SMILES ligands.',
      change: 'Use CCD when the molecule exists in the PDB dictionary (cleaner, ideal coordinates). Use SMILES for everything else. If RDKit cannot build a 3D starting conformer, see <code>--conformer_max_iterations</code>.',
      cost: 'Large ligands add tokens (heavy atoms), so a big macrocycle costs more memory than an ion.' },
    { cat: 'Input JSON', name: 'id (a list) / copies', where: 'JSON', def: 'one letter per chain', ours: 'one chain per entity unless you want copies',
      what: 'A list such as <code>["A","B"]</code> declares identical copies of one entity (homodimer, trimer&hellip;).',
      why: 'Saves retyping the sequence, and tells AF3 the copies are identical.',
      change: 'Use whenever the real assembly has identical subunits (many GPCR signalling complexes, oligomeric targets).',
      cost: 'Tokens add up with every copy.' },
    { cat: 'Input JSON', name: 'bondedAtomPairs', where: 'JSON', def: 'none', ours: 'only for genuine covalent ligands',
      what: 'Declares explicit covalent bonds, e.g. a cysteine sulfur to a warhead carbon. Each atom is <code>[chainId, residueNumber, atomName]</code>.',
      why: 'Without it every ligand is non-covalent.', change: 'Covalent inhibitors and glycans. See the reference section of the HOWTO for the format.', cost: 'None.' },

    { cat: 'Sampling', name: '--num_diffusion_samples', where: 'flag', def: '5', ours: '5 (default)',
      what: 'How many structures are sampled per seed.',
      why: 'Five gives you a spread to rank by <code>ranking_score</code> without wasting GPU time.',
      change: 'Raise (10-20) with a few seeds when you want a fuller picture of alternative binding poses for a flexible ligand or macrocycle. Lower for a fast sanity check.',
      cost: 'Inference time grows roughly in proportion to the number of samples.' },
    { cat: 'Sampling', name: '--num_recycles', where: 'flag', def: '10', ours: '10 (default)',
      what: 'How many times the network feeds its own output back in to refine itself.',
      why: 'The default is what AF3 was developed and validated with.',
      change: 'We do not change it. Lowering it is an unvalidated shortcut: if you try it for speed, check that your scores do not degrade versus a default run.',
      cost: 'Fewer recycles are faster but may lose accuracy.' },
    { cat: 'Sampling', name: '--max_template_date', where: 'flag', def: '2021-09-30', ours: 'default',
      what: 'Ignore templates released after this date.',
      why: 'Matches the date cut-off used in the AF3 paper, so results are comparable.',
      change: 'Important: structures released after this date are <em>not</em> used as templates. If your target has a recent PDB entry and you <em>want</em> AF3 to see it, raise the date (e.g. <code>--max_template_date=2030-01-01</code>). If you are benchmarking and do not want it to see a structure, leave it. This also affects the fallback for ligand coordinates.',
      cost: 'None.' },
    { cat: 'Sampling', name: '--conformer_max_iterations', where: 'flag', def: 'RDKit default', ours: 'unset',
      what: 'How hard RDKit tries to generate a starting 3D shape for your ligand/macrocycle.',
      why: 'Macrocycles are hard to embed, and this is where "Failed to construct RDKit reference structure" comes from.',
      change: 'Raise it (try 1000, then 10000) if that error appears and you have checked the SMILES is valid.',
      cost: 'Longer start-up for that ligand only.' },
    { cat: 'Sampling', name: '--resolve_msa_overlaps', where: 'flag', def: 'true', ours: 'default',
      what: 'De-duplicates the unpaired MSA against the paired MSA.', why: 'Matches the AF3 paper.',
      change: 'Set false only if you supply a hand-crafted paired MSA.', cost: 'None.' },

    { cat: 'Running it', name: '--run_data_pipeline / --run_inference', where: 'flag', def: 'both true', ours: 'both on for a first run; split for big or repeated jobs',
      what: 'Switches for the two stages: CPU search (data pipeline) and GPU prediction (inference).',
      why: 'The CPU stage needs no GPU, and for FFA4 took ~440 s versus ~53 s for inference. Splitting avoids holding a GPU idle, and lets you re-run inference many times from one search.',
      change: 'Stage 1: <code>--run_inference=false</code>. Stage 2: <code>--run_data_pipeline=false</code> with the <strong><code>&lt;name&gt;_data.json</code> from stage 1</strong> as the input (the original JSON has no MSA in it). Add <code>--force_output_dir=true</code> if you want stage 2 to write into the same folder.',
      cost: 'Saves GPU time. Also enables screening many ligands against one target for the price of one search.' },
    { cat: 'Running it', name: '--force_output_dir', where: 'flag', def: 'false', ours: 'false',
      what: 'Reuse an existing, non-empty output folder.', why: 'By default AF3 will not overwrite: it makes a new time-stamped folder.',
      change: 'Turn on only for two-stage runs into one folder.', cost: 'Can mix old and new files if you re-use a folder carelessly.' },
    { cat: 'Running it', name: '--input_dir', where: 'flag', def: 'unset', ours: 'use for batches',
      what: 'Run every JSON in a folder, one after another, instead of a single <code>--json_path</code>.',
      why: 'The model is loaded once, not per job.', change: 'Batches of candidate ligands.', cost: 'A long job holds the GPU for its full duration; be considerate.' },
    { cat: 'Running it', name: '--jax_compilation_cache_dir', where: 'flag + volume', def: 'unset', ours: 'optional',
      what: 'Saves the compiled model between runs.', why: 'Each new input size bucket has to be compiled. A cache avoids repeating that.',
      change: 'Mount a folder (e.g. <code>--volume $HOME/af3/jax_cache:/root/jax_cache</code>) and add <code>--jax_compilation_cache_dir=/root/jax_cache</code>.', cost: 'Disk space only.' },

    { cat: 'GPU & memory', name: '--gpus device=N  (Docker)', where: 'docker', def: 'all', ours: 'one idle GPU: device=N',
      what: 'Which GPU(s) the container can see.', why: 'Woody has four shared RTX A5500s. <code>--gpus all</code> makes your job visible to all of them, and AF3 uses just one anyway.',
      change: 'Check <code>nvidia-smi</code>, pick an idle one, and use <code>--gpus device=N</code>. Use this <em>or</em> <code>--gpu_device</code>, not both.', cost: 'None, and it keeps others happy.' },
    { cat: 'GPU & memory', name: 'Unified memory (3 env vars)', where: 'docker -e', def: 'off', ours: 'on when a job runs out of GPU memory',
      what: '<code>XLA_PYTHON_CLIENT_PREALLOCATE=false</code>, <code>TF_FORCE_UNIFIED_MEMORY=true</code>, <code>XLA_CLIENT_MEM_FRACTION=3.2</code> let the GPU spill into system RAM.',
      why: 'Our 24 GB cards are below the 80 GB AF3 was verified on. Unified memory trades speed for not crashing.',
      change: 'Start without it. If a big complex fails with out-of-memory, add it. If it still fails the target is too big for one card.', cost: 'Slower when it actually spills.' },
    { cat: 'GPU & memory', name: '--flash_attention_implementation', where: 'flag', def: 'triton', ours: 'triton',
      what: 'Which attention kernel is used.', why: 'Triton is the fastest and best tested, and our Ampere GPUs support it.',
      change: 'Only switch to <code>xla</code> if you hit a kernel error.', cost: '<code>xla</code> is slower and uses more memory.' },
    { cat: 'GPU & memory', name: '--jackhmmer_n_cpu', where: 'flag', def: 'min(cpus, 8)', ours: 'default',
      what: 'CPU threads for the protein search.', why: 'Woody is shared; the default keeps the machine responsive.',
      change: 'Check load with <code>htop</code> first; raising it speeds the search only if CPUs are idle.', cost: 'Slows other people down if the machine is busy.' },

    { cat: 'Outputs', name: '--save_embeddings / --save_distogram', where: 'flag', def: 'false', ours: 'false',
      what: 'Also write the network\'s internal representations.', why: 'These files are large and rarely needed.', change: 'Only for downstream machine-learning analysis.', cost: 'Large files.' },
    { cat: 'Outputs', name: '--compress_large_output_files', where: 'flag', def: 'false', ours: 'false',
      what: 'zstd-compress the big output files.', why: 'Keeps scripts that read <code>.cif</code> and <code>.json</code> working.', change: 'Turn on for big batch runs where disk space matters.', cost: 'You must decompress before opening in a viewer.' }
  ];
  var CATS = ['Input JSON', 'Sampling', 'Running it', 'GPU & memory', 'Outputs'];
  Hub.paramSets = Hub.paramSets || {}; Hub.paramSets.af3 = PARAMS;

  /* ================= PARAM REFERENCE ================= */
  Hub.widget('paramref', function (host, props) {
    var data = props.set ? Hub.paramSets[props.set] : PARAMS, only = props.cats || CATS, cur = only[0];
    host.appendChild(el('h4', null, props.title || 'Parameter explorer'));
    host.appendChild(el('p', { style: 'color:var(--muted);margin-top:0;font-size:.9rem' }, 'Open any card for what it does, our default and why, and when to change it.'));
    var chips = el('div', { class: 'chips' }), list = el('div');
    only.forEach(function (c) { var b = el('button', { type: 'button', class: c === cur ? 'on' : '' }, esc(c)); b.onclick = function () { cur = c; draw(); Array.prototype.forEach.call(chips.children, function (x) { x.classList.toggle('on', x === b); }); }; chips.appendChild(b); });
    host.appendChild(chips); host.appendChild(list);
    function draw() {
      list.innerHTML = '';
      data.filter(function (p) { return p.cat === cur; }).forEach(function (p) {
        var d = el('details', { class: 'param' });
        d.appendChild(el('summary', null, '<code>' + p.name + '</code> <span class="pill">' + esc(p.where) + '</span> <span class="pill">default: ' + esc(p.def) + '</span>'));
        d.appendChild(el('div', { class: 'pbody' }, '<dl class="kv"><dt>What it does</dt><dd>' + p.what + '</dd><dt>Our setting</dt><dd><strong>' + p.ours + '</strong></dd><dt>Why</dt><dd>' + p.why + '</dd><dt>When to change</dt><dd>' + p.change + '</dd><dt>Cost</dt><dd>' + p.cost + '</dd></dl>'));
        list.appendChild(d);
      });
    }
    draw();
  });

  /* ================= COMMAND BUILDER ================= */
  Hub.widget('cmdbuilder', function (host) {
    var RECIPES = {
      mono: { label: 'Single protein (first run)', s: { seeds: 1, samples: 5, recycles: 10, unified: false, split: false, tmplDate: '' }, note: 'The defaults. Start here.' },
      complex: { label: 'Protein-protein complex', s: { seeds: 3, samples: 5, unified: false, split: false }, note: 'Three seeds: interface confidence (ipTM) is the number to check, and seed agreement tells you if it is reproducible.' },
      lig: { label: 'Protein + small molecule', s: { seeds: 3, samples: 5, unified: false, split: false }, note: 'Same recipe, ligand given as SMILES or CCD in the JSON.' },
      macro: { label: 'Protein + macrocycle', s: { seeds: 5, samples: 10, unified: false, split: true, conf: 1000 }, note: 'Macrocycles are floppy: more seeds and samples show how stable the pose is. Split the stages so you can re-run inference cheaply. If RDKit fails to build the ring, <code>--conformer_max_iterations</code> is set for you.' },
      big: { label: 'Large target (out-of-memory)', s: { seeds: 1, samples: 5, unified: true, split: true }, note: 'Unified memory on, stages split. If it still fails the target is too big for one 24 GB card.' },
      screen: { label: 'Screen many ligands, one target', s: { seeds: 1, samples: 5, unified: false, split: true }, note: 'Run the search once on target + one ligand, then edit only the ligand in the <code>_data.json</code> and run inference many times. See the screening lesson.' }
    };
    var s = { job: 'ffa4_tug891', gpu: '2', gpuMode: 'one', seeds: 1, samples: 5, recycles: 10, unified: false, split: false, conf: 0, tmplDate: '', rm: true, cache: false, force: false };
    host.appendChild(el('h4', null, 'Command builder'));
    host.appendChild(el('p', { style: 'color:var(--muted);margin-top:0;font-size:.9rem' }, 'Pick a recipe, then tweak. Every flag in the output is one explained in the parameter explorer.'));
    var chips = el('div', { class: 'chips' }); host.appendChild(chips);
    var note = el('div', { class: 'callout callout-note', style: 'display:none' }); host.appendChild(note);
    Object.keys(RECIPES).forEach(function (k) {
      var b = el('button', { type: 'button' }, esc(RECIPES[k].label));
      b.onclick = function () {
        Array.prototype.forEach.call(chips.children, function (x) { x.classList.toggle('on', x === b); });
        var r = RECIPES[k]; s.conf = 0; s.recycles = 10; for (var p in r.s) s[p] = r.s[p];
        note.style.display = ''; note.innerHTML = '<span class="label">Why this recipe</span><div>' + r.note + '</div>'; sync(); update();
      };
      chips.appendChild(b);
    });
    var grid = el('div', { class: 'row' }); host.appendChild(grid);
    var ctrls = {};
    function addCtl(key, label, node) { ctrls[key] = node; grid.appendChild(field(label, node)); }
    addCtl('job', 'Your JSON file name (without .json)', input('text', s.job, function (v) { s.job = v.trim(); update(); }));
    addCtl('gpuMode', 'GPU', select([['one', 'One specific GPU (recommended)'], ['all', 'All GPUs']], s.gpuMode, function (v) { s.gpuMode = v; update(); }));
    addCtl('gpu', 'GPU number (from nvidia-smi; 0-3)', input('number', s.gpu, function (v) { s.gpu = v; update(); }));
    addCtl('seeds', 'Seeds (--num_seeds; 1 = just the JSON seed)', input('number', s.seeds, function (v) { s.seeds = Math.max(1, parseInt(v, 10) || 1); update(); }));
    addCtl('samples', 'Diffusion samples per seed', input('number', s.samples, function (v) { s.samples = Math.max(1, parseInt(v, 10) || 1); update(); }));
    addCtl('recycles', 'Recycles', input('number', s.recycles, function (v) { s.recycles = Math.max(1, parseInt(v, 10) || 10); update(); }));
    addCtl('conf', 'RDKit conformer iterations (0 = default)', input('number', s.conf, function (v) { s.conf = Math.max(0, parseInt(v, 10) || 0); update(); }));
    addCtl('tmplDate', 'Max template date (blank = default 2021-09-30)', input('text', s.tmplDate, function (v) { s.tmplDate = v.trim(); update(); }));
    var tg = el('div', { class: 'chips' });
    [['unified', 'Unified memory (spill to RAM)'], ['split', 'Split CPU / GPU stages'], ['cache', 'JAX compile cache'], ['rm', 'Auto-remove container (--rm)']].forEach(function (t) {
      var b = el('button', { type: 'button', class: s[t[0]] ? 'on' : '' }, esc(t[1]));
      b.onclick = function () { s[t[0]] = !s[t[0]]; b.classList.toggle('on', s[t[0]]); update(); }; ctrls[t[0]] = b; tg.appendChild(b);
    });
    host.appendChild(tg);
    var out = el('div'); host.appendChild(out);
    function sync() {
      ctrls.seeds.value = s.seeds; ctrls.samples.value = s.samples; ctrls.recycles.value = s.recycles; ctrls.conf.value = s.conf; ctrls.tmplDate.value = s.tmplDate;
      ['unified', 'split', 'cache', 'rm'].forEach(function (k) { ctrls[k].classList.toggle('on', !!s[k]); });
    }
    function update() {
      var job = s.job || 'my_job';
      var vols = ['    --volume $HOME/af3/input:/root/af_input', '    --volume $HOME/af3/output:/root/af_output', '    --volume /data/20260825_AndrewR_af3/models:/root/models', '    --volume /data/20260825_AndrewR_af3/databases:/root/public_databases'];
      if (s.cache) vols.push('    --volume $HOME/af3/jax_cache:/root/jax_cache');
      var env = s.unified ? ['    -e XLA_PYTHON_CLIENT_PREALLOCATE=false', '    -e TF_FORCE_UNIFIED_MEMORY=true', '    -e XLA_CLIENT_MEM_FRACTION=3.2'] : [];
      var gpu = '    --gpus ' + (s.gpuMode === 'all' ? 'all' : 'device=' + (parseInt(s.gpu, 10) || 0));
      var extra = [];
      if (s.seeds > 1) extra.push('--num_seeds=' + s.seeds);
      if (s.samples !== 5) extra.push('--num_diffusion_samples=' + s.samples);
      if (s.recycles !== 10) extra.push('--num_recycles=' + s.recycles);
      if (s.conf > 0) extra.push('--conformer_max_iterations=' + s.conf);
      if (s.tmplDate) extra.push('--max_template_date=' + s.tmplDate);
      if (s.cache) extra.push('--jax_compilation_cache_dir=/root/jax_cache');
      function cmd(inputPath, flags, useGpu) {
        var lines = ['docker run -it' + (s.rm ? ' --rm' : '')].concat(env, vols);
        if (useGpu) lines.push(gpu);
        lines.push('    alphafold3', '    python run_alphafold.py', '    --json_path=' + inputPath, '    --model_dir=/root/models', '    --output_dir=/root/af_output');
        flags.forEach(function (f) { lines.push('    ' + f); });
        return lines.join(' \\\n');
      }
      out.innerHTML = '';
      if (s.seeds > 1) out.appendChild(el('p', { style: 'font-size:.85rem;color:var(--muted)' }, '<code>--num_seeds</code> needs exactly <strong>one</strong> seed in your JSON; AF3 generates the rest starting from it.'));
      if (!s.split) {
        out.appendChild(U.codeBlock(cmd('/root/af_input/' + job + '.json', extra, true), 'one-shot run'));
      } else {
        out.appendChild(el('p', { style: 'margin-bottom:0' }, '<strong>Stage 1: CPU only.</strong> No GPU is requested, so nobody\'s card is tied up while the genetic search runs.'));
        out.appendChild(U.codeBlock(cmd('/root/af_input/' + job + '.json', ['--run_inference=false'], false), 'stage 1: data pipeline'));
        out.appendChild(el('p', { style: 'margin-bottom:0' }, '<strong>Stage 2: GPU.</strong> Uses the <code>' + esc(job) + '_data.json</code> that stage 1 wrote, because that file now contains the MSA. Copy it into your input folder first:'));
        out.appendChild(U.codeBlock('cp ~/af3/output/' + job + '/' + job + '_data.json ~/af3/input/' + job + '_data.json', 'copy the augmented input'));
        out.appendChild(U.codeBlock(cmd('/root/af_input/' + job + '_data.json', ['--run_data_pipeline=false', '--force_output_dir=true'].concat(extra), true), 'stage 2: inference'));
        out.appendChild(el('p', { style: 'font-size:.85rem;color:var(--muted)' }, 'The seed/sample/recycle flags belong to stage 2 (inference). If the stage-1 folder name differs because AF3 time-stamped it, adjust the path.'));
      }
      out.appendChild(el('p', { style: 'font-size:.85rem;color:var(--muted)' }, 'Run it inside <code>tmux</code> so it survives a dropped SSH connection (see the Foundations module).'));
    }
    update();
  });

  /* ================= SCORE CALCULATOR ================= */
  Hub.widget('scorecalc', function (host) {
    host.appendChild(el('h4', null, 'How ranking_score is made'));
    host.appendChild(el('p', { style: 'margin-top:0;color:var(--muted);font-size:.9rem' }, 'AF3 ranks its samples by <code>0.8 &times; ipTM + 0.2 &times; pTM + 0.5 &times; fraction_disordered &minus; 100 &times; has_clash</code>. Drag the sliders to see what moves it.'));
    var s = { i: 0.94, p: 0.87, d: 0.05, c: 0 };
    var out = el('div', { class: 'mono', style: 'font-size:1.1rem;margin:10px 0' }), rows = el('div');
    function sl(key, label, min, max, step) {
      var w = el('div'), lab = el('label', { class: 'f' }), r = el('input', { type: 'range', min: min, max: max, step: step, value: s[key], 'aria-label': label });
      lab.innerHTML = esc(label) + ': <strong></strong>';
      function show() { lab.querySelector('strong').textContent = s[key]; }
      r.oninput = function () { s[key] = parseFloat(r.value); show(); calc(); };
      show(); w.appendChild(lab); w.appendChild(r); rows.appendChild(w); r.style.width = '100%';
    }
    sl('i', 'ipTM', 0, 1, 0.01); sl('p', 'pTM', 0, 1, 0.01); sl('d', 'fraction_disordered', 0, 1, 0.01); sl('c', 'has_clash (0 or 1)', 0, 1, 1);
    host.appendChild(rows); host.appendChild(out);
    var foot = el('p', { style: 'font-size:.85rem;color:var(--muted)' }, 'Starting values are the real FFA4 + TUG-891 run: 0.8&times;0.94 + 0.2&times;0.87 + 0.5&times;0.05 = 0.95. For a single chain there is no ipTM, and AF3 uses pTM in its place (FFA4 alone: 0.8&times;0.88 + 0.2&times;0.88 + 0.5&times;0.06 = 0.91).');
    function calc() { var v = 0.8 * s.i + 0.2 * s.p + 0.5 * s.d - 100 * s.c; out.innerHTML = 'ranking_score = <strong style="color:' + (v > 0.8 ? 'var(--good)' : v > 0.6 ? 'var(--amber)' : 'var(--danger)') + '">' + v.toFixed(2) + '</strong>' + (s.c ? ' &nbsp;<span class="pill bad">a clash dominates everything</span>' : ''); }
    host.appendChild(foot); calc();
  });

  /* ================= RESULTS TRAINER (real data) ================= */
  Hub.widget('resulttrainer', function (host) {
    var D = window.AF3_REAL;
    host.appendChild(el('h4', null, 'Read a real result'));
    if (!D) { host.appendChild(el('p', null, 'Real example data is missing.')); return; }
    host.appendChild(el('p', { style: 'margin-top:0;color:var(--muted);font-size:.9rem' }, 'These are the actual outputs of the two FFA4 runs on Woody. Hover over the PAE plot to read values.'));
    var chips = el('div', { class: 'chips' }), body = el('div');
    var names = [['ffa4_monomer', 'FFA4 alone (monomer)'], ['ffa4_tug891', 'FFA4 + TUG-891 (complex)']];
    names.forEach(function (n, i) {
      var b = el('button', { type: 'button', class: i === 0 ? 'on' : '' }, esc(n[1])); b.onclick = function () { Array.prototype.forEach.call(chips.children, function (x) { x.classList.toggle('on', x === b); }); draw(n[0]); }; chips.appendChild(b);
    });
    host.appendChild(chips); host.appendChild(body);

    function pill(txt, cls) { return '<span class="pill ' + cls + '">' + txt + '</span>'; }
    function band(v) { return v >= 90 ? '#2a6fdb' : v >= 70 ? '#5bc0de' : v >= 50 ? '#f2c14e' : '#e8833a'; }
    function draw(key) {
      var d = D[key], s = d.summary, n = d.n;
      body.innerHTML = '';
      var rows = [
        ['ranking_score', s.ranking_score, s.ranking_score > 0.8 ? pill('strong', 'good') : s.ranking_score > 0.6 ? pill('grey zone', 'warn') : pill('weak', 'bad'), 'Overall score used to choose the best sample.'],
        ['ptm', s.ptm, s.ptm > 0.8 ? pill('confident', 'good') : s.ptm > 0.6 ? pill('grey zone', 'warn') : pill('low', 'bad'), 'Is the overall fold right?'],
        ['iptm', s.iptm == null ? 'null' : s.iptm, s.iptm == null ? pill('n/a: one chain', '') : s.iptm > 0.8 ? pill('confident', 'good') : s.iptm > 0.6 ? pill('grey zone', 'warn') : pill('low', 'bad'), s.iptm == null ? 'Nothing to dock with only one chain. Expected, not an error.' : 'Is the interface between chains right? The key number for binding.'],
        ['fraction_disordered', s.fraction_disordered, '', 'Share of the structure predicted to be unstructured.'],
        ['has_clash', s.has_clash, s.has_clash ? pill('clash', 'bad') : pill('none', 'good'), 'Any serious atomic overlaps?']
      ];
      body.appendChild(el('div', null, '<table><thead><tr><th>Metric</th><th>Value</th><th>Read as</th><th>Meaning</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td><code>' + r[0] + '</code></td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>'; }).join('') + '</tbody></table>'));
      if (s.chain_pair_iptm && s.chain_pair_iptm.length > 1) {
        body.appendChild(el('div', { class: 'callout callout-note' }, '<span class="label">Do not be misled by chain_ptm of a small ligand</span><div>The ligand\'s own <code>chain_ptm</code> here is ' + s.chain_ptm[1] + '. A tiny molecule has no &ldquo;fold&rdquo; to score, so that value is not informative. Judge the pose with <code>chain_pair_iptm</code> for receptor&harr;ligand (' + s.chain_pair_iptm[0][1] + ') and with the PAE block below.</div>'));
      }
      // PAE
      var bin = atob(d.paeB64), pae = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) pae[i] = bin.charCodeAt(i);
      var wrap = el('div', { class: 'row', style: 'align-items:start;margin-top:14px' });
      var c1 = el('div'); c1.appendChild(el('label', { class: 'f' }, 'PAE: predicted aligned error (dark = confident about relative position)'));
      var cv = el('canvas', { width: n, height: n, style: 'width:100%;max-width:380px;image-rendering:pixelated' });
      var ctx = cv.getContext('2d'), im = ctx.createImageData(n, n);
      for (var k = 0; k < n * n; k++) { var v = Math.min(1, pae[k] / 8 / 30), r = 31 + (242 - 31) * v, g = 95 + (244 - 95) * v, b2 = 91 + (238 - 91) * v; im.data[k * 4] = r; im.data[k * 4 + 1] = g; im.data[k * 4 + 2] = b2; im.data[k * 4 + 3] = 255; }
      ctx.putImageData(im, 0, 0);
      var tip = el('div', { class: 'mono', style: 'font-size:.8rem;min-height:2.6em;color:var(--muted)' }, 'Hover the plot.');
      cv.onmousemove = function (ev) {
        var rc = cv.getBoundingClientRect(), x = Math.floor((ev.clientX - rc.left) / rc.width * n), y = Math.floor((ev.clientY - rc.top) / rc.height * n);
        if (x < 0 || y < 0 || x >= n || y >= n) return;
        tip.textContent = 'aligned on ' + d.tokenChains[y] + d.tokenResIds[y] + ', error at ' + d.tokenChains[x] + d.tokenResIds[x] + ': ' + (pae[y * n + x] / 8).toFixed(1) + ' Å';
      };
      c1.appendChild(cv); c1.appendChild(tip); wrap.appendChild(c1);
      var c2 = el('div');
      var nA = d.tokenChains.filter(function (c) { return c === 'A'; }).length, nB = n - nA;
      var txt = '<label class="f">What to look for</label><ul style="font-size:.9rem"><li><strong>The big dark square</strong> (top-left): the protein is internally well-defined.</li>';
      if (nB) {
        var tot = 0, cnt = 0; for (var yy = 0; yy < nA; yy++) for (var xx = nA; xx < n; xx++) { tot += pae[yy * n + xx] / 8; cnt++; }
        for (var y2 = nA; y2 < n; y2++) for (var x2 = 0; x2 < nA; x2++) { tot += pae[y2 * n + x2] / 8; cnt++; }
        txt += '<li><strong>The off-diagonal strips</strong> (right edge and bottom): receptor vs ligand. Their mean here is <strong>' + (tot / cnt).toFixed(1) + ' &Aring;</strong>. Low means AF3 is confident where the ligand sits relative to the receptor. This is the plot to check for a docking question.</li>';
      } else txt += '<li>One chain, so no interface block. Pale patches would be domains whose relative position is uncertain.</li>';
      txt += '</ul>';
      c2.innerHTML = txt; wrap.appendChild(c2); body.appendChild(wrap);
      // pLDDT
      var pl = d.residuePlddtA, cw = pl.length * 2;
      body.appendChild(el('label', { class: 'f', style: 'margin-top:14px' }, 'pLDDT per residue (blue &ge; 90 very high, cyan 70-90 confident, yellow 50-70 low, orange &lt; 50 very low)'));
      var pc = el('canvas', { width: cw, height: 80, style: 'width:100%' }), px = pc.getContext('2d');
      pl.forEach(function (v, i) { px.fillStyle = band(v); var h = v / 100 * 78; px.fillRect(i * 2, 80 - h, 2, h); });
      body.appendChild(pc);
      var mean = pl.reduce(function (a, b) { return a + b; }, 0) / pl.length, low = pl.filter(function (v) { return v < 70; }).length;
      var lp = '';
      if (d.ligandPlddt && d.ligandPlddt.length) lp = ' Ligand atoms average pLDDT <strong>' + (d.ligandPlddt.reduce(function (a, b) { return a + b; }, 0) / d.ligandPlddt.length).toFixed(0) + '</strong>.';
      body.appendChild(el('p', { style: 'font-size:.9rem' }, 'Mean protein pLDDT <strong>' + mean.toFixed(0) + '</strong>; <strong>' + low + '</strong> of ' + pl.length + ' residues are below 70 (typically loops and termini).' + lp));
    }
    draw('ffa4_monomer');
  });

  /* ================= TRIAGE GAME ================= */
  Hub.widget('triage', function (host, props) {
    var CASES = props.cases || [
      { src: 'real', t: 'FFA4 + TUG-891, a known agonist', m: 'ranking 0.95, ptm 0.87, iptm 0.94, chain_pair_iptm (A-B) 0.94, no clash', a: 0,
        why: 'Strong on every axis, and the compound is a real agonist, so this is the benchmark. Even so it is a prediction: a hypothesis about the pose, not a measurement.' },
      { src: 'illustrative', t: 'New candidate complex', m: 'ranking 0.64, ptm 0.82, iptm 0.58, no clash', a: 1,
        why: 'The receptor folds well (ptm 0.82) but the interface is below 0.6, so the binding mode is not reliable. Check PAE across the interface and run more seeds before believing anything. (ipTM near 0.6 in a result like this is also a reminder that AF3 may not be able to tell binders from non-binders.)' },
      { src: 'illustrative', t: 'Single protein', m: 'ranking 0.89, ptm 0.86, iptm null, 6% disordered', a: 0,
        why: 'iptm is null because there is only one chain: expected, not an error. The fold score is high.' },
      { src: 'illustrative', t: 'Peptide docked to a target', m: 'ranking -99.2, ptm 0.80, iptm 0.75, has_clash 1', a: 2,
        why: 'The clash penalty is 100, so the sample is dominated by overlapping atoms and the pose is physically unreasonable. Look at other samples/seeds; if all clash, the pose is not reliable.' },
      { src: 'illustrative', t: 'Five seeds of one macrocycle complex', m: 'ranking scores: 0.84, 0.83, 0.41, 0.84, 0.39; iptm 0.82 in the best', a: 1,
        why: 'The seeds disagree: two give a poor interface. Load the top-ranked structures from each seed in a viewer and compare the ligand position. Agreement between independent seeds is what builds trust.' },
      { src: 'illustrative', t: 'Designed binder', m: 'ranking 0.85, ptm 0.84, iptm 0.83, but interface PAE is 18 Å on one side', a: 1,
        why: 'The headline scores look good but the PAE says AF3 is unsure of the relative position. Headline numbers are averages: always look at the PAE plot for the interface you care about.' }
    ];
    var score = 0, answered = 0, i = 0;
    host.appendChild(el('h4', null, 'Triage practice'));
    host.appendChild(el('p', { style: 'margin-top:0;color:var(--muted);font-size:.9rem' }, 'Decide for each result: trust it, check it further, or do not trust it. Only the first case is a real run; the others are constructed to teach one point each.'));
    var card = el('div'); host.appendChild(card);
    var sc = el('div', { class: 'mono', style: 'margin-top:10px;font-size:.85rem;color:var(--muted)' }); host.appendChild(sc);
    function show() {
      card.innerHTML = '';
      if (i >= CASES.length) { card.appendChild(el('p', null, '<strong>Finished: ' + score + ' / ' + CASES.length + ' correct.</strong>')); var r = el('button', { class: 'btn small', type: 'button' }, 'Try again'); r.onclick = function () { i = 0; score = 0; answered = 0; show(); }; card.appendChild(r); sc.textContent = ''; return; }
      var c = CASES[i];
      card.appendChild(el('p', null, '<strong>Case ' + (i + 1) + ': ' + esc(c.t) + '</strong> <span class="pill">' + (c.src === 'real' ? 'real run' : 'illustrative numbers') + '</span><br><span class="mono">' + esc(c.m) + '</span>'));
      var fb = el('div', { class: 'callout', style: 'display:none' });
      var btns = ['Trust it', 'Check further', 'Do not trust'].map(function (lab, j) {
        var b = el('button', { type: 'button', class: 'btn ghost small', style: 'margin-right:8px' }, lab);
        b.onclick = function () {
          btns.forEach(function (x) { x.disabled = true; });
          if (j === c.a) score++;
          fb.style.display = ''; fb.className = 'callout ' + (j === c.a ? '' : 'callout-mistake');
          fb.innerHTML = '<span class="label">' + (j === c.a ? 'Correct' : 'Better answer: ' + ['Trust it', 'Check further', 'Do not trust'][c.a]) + '</span><div>' + c.why + '</div>';
          var nx = el('button', { type: 'button', class: 'btn small', style: 'margin-top:8px' }, i + 1 < CASES.length ? 'Next case' : 'Finish'); nx.onclick = function () { i++; show(); }; fb.appendChild(nx);
          sc.textContent = 'Score: ' + score + ' / ' + (i + 1);
        };
        return b;
      });
      var row = el('div'); btns.forEach(function (b) { row.appendChild(b); });
      card.appendChild(row); card.appendChild(fb);
    }
    show();
  });
})();
