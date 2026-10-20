/* Boltz-2 on Woody: beginner course.
 * Checked against the installed Boltz 2.2.1 (CLI --help, schema.py, writer.py) and the group's own runs.
 * TODO items need a lab-specific decision. */
(function () {
  'use strict';
  var p = function (html) { return { t: 'p', html: html }; };
  var h = function (text, id) { return { t: 'h', text: text, id: id }; };
  var ul = function (items) { return { t: 'list', items: items }; };
  var ol = function (items) { return { t: 'list', ordered: true, items: items }; };
  var code = function (text, label) { return { t: 'code', text: text, label: label }; };
  var co = function (kind, label, html) { return { t: 'callout', kind: kind, label: label, html: html }; };
  var table = function (head, rows) { return { t: 'table', head: head, rows: rows }; };
  var check = function (title, items) { return { t: 'check', title: title, items: items }; };
  var quiz = function (q, opts, answer, why) { return { t: 'quiz', q: q, opts: opts, answer: answer, why: why }; };
  var widget = function (name, props) { return { t: 'widget', name: name, props: props }; };

  Hub.paramSets = Hub.paramSets || {};
  Hub.paramSets.boltz = [
    { cat: 'Input YAML', name: 'msa', where: 'YAML (per protein)', def: 'unset = needs --use_msa_server', ours: 'msa: empty for designed peptides; own .a3m for natural proteins',
      what: 'Where the evolutionary information comes from: <code>empty</code> (single sequence), a path to an <code>.a3m</code> file, or unset (Boltz asks a remote server).',
      why: 'If it is unset and you did not pass <code>--use_msa_server</code>, Boltz stops with &ldquo;Missing MSA&rsquo;s in input&rdquo;. Remote servers see your sequence, so we prefer local files.',
      change: 'Natural protein: supply an A3M, e.g. the MSA AlphaFold3 already built (see the MSA lesson). Designed or cyclic peptide: <code>empty</code>. All copies of the same sequence must share one MSA setting.',
      cost: 'None locally. Remote server: your sequence leaves Woody.' },
    { cat: 'Input YAML', name: 'cyclic', where: 'YAML (protein)', def: 'false', ours: 'true for head-to-tail cyclic peptides',
      what: 'Closes the chain into a ring.', why: 'Unlike AlphaFold3\'s protein entity, Boltz can model a head-to-tail cyclic peptide directly. Staples, D-amino acids and N-methylation still need a SMILES ligand.',
      change: 'Short cyclic peptides made of natural amino acids. Compare with the SMILES route if your chemistry is non-natural.', cost: 'None.' },
    { cat: 'Input YAML', name: 'constraints: pocket / contact / bond', where: 'YAML', def: 'none', ours: 'only when you have independent evidence',
      what: '<code>pocket</code> asks the ligand to sit near listed residues. <code>contact</code> asks two residues to be close. <code>bond</code> declares a covalent bond. Each takes a <code>max_distance</code> in &Aring;.',
      why: 'Steering a prediction with prior knowledge (e.g. a mutagenesis-defined pocket).',
      change: 'Use sparingly: a constrained result partly reflects what you told it. Always also run without the constraint and compare.', cost: 'None.' },
    { cat: 'Input YAML', name: 'templates', where: 'YAML', def: 'none', ours: 'none',
      what: 'List of <code>cif:</code> files used as structural hints.', why: 'Off by default; the group has not relied on it.', change: 'When you deliberately want a known conformation (e.g. an active-state receptor).', cost: 'Can bias the model towards the template.' },

    { cat: 'Sampling', name: '--diffusion_samples', where: 'flag', def: '1', ours: '1 to explore; 5 or more for a result you will report',
      what: 'How many structures are sampled.', why: 'One is fast. Boltz ranks samples by <code>confidence_score</code> and writes the best as <code>model_0</code>, so more samples give it something to choose from.',
      change: 'Raise for flexible ligands and peptides, or to see how stable the pose is.', cost: 'Time grows with the number of samples (<code>--max_parallel_samples</code> controls memory).' },
    { cat: 'Sampling', name: '--recycling_steps', where: 'flag', def: '3', ours: '3',
      what: 'Refinement passes through the network.', why: 'The default.', change: 'Leave it. If you change it, compare scores to a default run.', cost: 'Slower with more steps.' },
    { cat: 'Sampling', name: '--sampling_steps', where: 'flag', def: '200', ours: '200',
      what: 'Denoising steps in the diffusion sampler.', why: 'The default.', change: 'Leave it unless you are deliberately testing speed against quality.', cost: 'Time grows with steps.' },
    { cat: 'Sampling', name: '--step_scale', where: 'flag', def: '1.5 (Boltz-2)', ours: 'default',
      what: 'Sampling temperature. Lower values give <em>more</em> diversity between samples; the suggested range is 1 to 2.', why: 'Controls how varied the samples are.',
      change: 'Lower it (towards 1) with several samples if you want to explore alternative poses.', cost: 'None.' },
    { cat: 'Sampling', name: '--seed', where: 'flag', def: 'none (not seeded)', ours: 'set a seed for anything you want to repeat',
      what: 'Random seed.', why: 'Without it, two identical commands can give different structures.', change: 'Always set one when comparing runs; vary it to check reproducibility.', cost: 'None.' },
    { cat: 'Sampling', name: '--use_potentials', where: 'flag', def: 'false', ours: 'false',
      what: 'Adds physics-style steering terms during sampling.', why: 'Off by default.', change: 'Try it if poses show physical problems; compare with and without.', cost: 'Slower.' },

    { cat: 'MSA', name: '--use_msa_server', where: 'flag', def: 'false', ours: 'avoid for unpublished sequences',
      what: 'Builds the MSA by sending your sequence to a remote MMseqs2 server (<code>--msa_server_url</code>, default <code>https://api.colabfold.com</code>).',
      why: 'Convenient: no local databases needed.', change: 'Only for public sequences. For lab targets reuse an AF3 MSA instead.', cost: 'Sequences leave Woody.' },
    { cat: 'MSA', name: '--max_msa_seqs / --num_subsampled_msa', where: 'flag', def: '8192 / 1024', ours: 'default',
      what: 'How many MSA sequences are read, and how many are randomly sub-sampled per prediction (<code>--subsample_msa</code>, on by default).', why: 'Keeps memory and time reasonable.', change: 'Leave unless you hit memory problems or are studying MSA depth.', cost: 'Larger = slower.' },

    { cat: 'Affinity', name: 'properties: affinity', where: 'YAML', def: 'off', ours: 'on for one small-molecule ligand per job',
      what: 'Asks Boltz-2 to predict how strongly a ligand binds. Name the ligand chain as <code>binder</code>.',
      why: 'AlphaFold3 gives no affinity at all; this is Boltz\'s distinguishing feature.',
      change: 'Constraints enforced by the parser: <strong>one</strong> affinity ligand, a <strong>single copy</strong>, a single residue, and at most <strong>128 atoms</strong>.', cost: 'Adds an extra stage after structure prediction.' },
    { cat: 'Affinity', name: '--diffusion_samples_affinity / --sampling_steps_affinity', where: 'flag', def: '5 / 200', ours: 'default',
      what: 'Sampling used by the affinity stage.', why: 'Defaults.', change: 'Leave.', cost: 'Time.' },
    { cat: 'Affinity', name: '--affinity_mw_correction', where: 'flag', def: 'false', ours: 'false',
      what: 'Adds a molecular-weight correction to the affinity value.', why: 'Optional. We do not use it unless a comparison requires it.', change: 'Only if you have a reason and a control set to check it against.', cost: 'None.' },

    { cat: 'Running', name: 'CUDA_VISIBLE_DEVICES', where: 'environment', def: 'all GPUs visible', ours: 'one idle GPU',
      what: 'Chooses the GPU for this command.', why: 'Boltz runs on one GPU per process by default (<code>--devices 1</code>). Pinning a card keeps the shared server tidy.', change: 'Check <code>nvidia-smi</code>, then set <code>CUDA_VISIBLE_DEVICES=N</code> in front of the command.', cost: 'None.' },
    { cat: 'Running', name: '--out_dir', where: 'flag', def: 'current folder', ours: 'a folder under your home or scratch',
      what: 'Where results go. Boltz creates <code>boltz_results_&lt;input name&gt;/</code> inside it.', why: 'Keeps jobs separate.', change: 'Always set it.', cost: 'None.' },
    { cat: 'Running', name: '--override', where: 'flag', def: 'false', ours: 'false',
      what: 'Re-run and overwrite predictions that already exist.', why: 'By default Boltz skips inputs that already have results, which is what lets you restart a big batch.', change: 'Only when you really want to redo a result.', cost: 'Overwrites.' },
    { cat: 'Running', name: '--output_format', where: 'flag', def: 'mmcif', ours: 'mmcif',
      what: '<code>mmcif</code> (.cif) or <code>pdb</code>.', why: 'mmCIF is the standard. Use pdb only if a tool needs it.', change: 'PDB for older software.', cost: 'None.' },
    { cat: 'Running', name: '--no_kernels', where: 'flag', def: 'false', ours: 'false',
      what: 'Disables the custom GPU kernels.', why: 'Fallback if a kernel error appears.', change: 'Only after a kernel-related crash.', cost: 'Slower, more memory.' }
  ];

  Hub.register({
    id: 'boltz',
    title: 'Boltz-2 on Woody',
    blurb: 'Predict complexes and, uniquely, ligand binding affinity with Boltz-2: set a run up by hand, choose parameters per experiment, and read the results.',
    modules: [

      {
        id: 'setup', title: 'Module 0: Getting set up', skippable: true, lessons: [
          {
            id: 'before', title: 'Before you start', blocks: [
              p('Boltz runs on Woody, so you need exactly the same basics as for AlphaFold3: an SSH login, a file-transfer tool, a terminal, <code>tmux</code>, and a habit of checking <code>nvidia-smi</code> before you start. If you have done the AlphaFold3 course, skip this module.'),
              p('If not, do <a href="#/alphafold3/get-on-woody">Getting onto Woody</a> and <a href="#/alphafold3/terminal-basics">Terminal survival kit</a> from the AlphaFold3 course first. They are the same for every tool and show the instructions for your operating system.'),
              check('You are ready when', ['I can log in to Woody', 'I can create files and folders in my home folder', 'I can start tmux and re-attach', 'I can read nvidia-smi and name an idle GPU'])
            ]
          },
          {
            id: 'install', title: 'Where Boltz lives', blocks: [
              p('Boltz-2 (version 2.2.1) is installed in its own Python environment on Woody, with the model weights already downloaded. You do not install or download anything.'),
              table(['What', 'Where'], [
                ['The <code>boltz</code> program', '<code>/scratch/drewdog/boltz/env/bin/boltz</code>'],
                ['Model weights and molecule data (cache)', '<code>/scratch/drewdog/boltz/cache</code> (tell Boltz with <code>BOLTZ_CACHE</code>)'],
                ['Your inputs / results', 'Your choice. This course uses <code>~/boltz/input</code> and <code>~/boltz/output</code>']
              ]),
              p('Check it responds (this loads the program but does not use a GPU):'),
              code('/scratch/drewdog/boltz/env/bin/boltz predict --help | head -20\nmkdir -p ~/boltz/input ~/boltz/output ~/boltz/msa', 'on Woody'),
              co('note', 'Why the full path?', '<p>Calling the program by its full path means you do not have to activate a conda environment first. That is the simplest way to run it, and it is what every command in this course does.</p>'),
              co('todo', 'TODO for the lab', '<p>The install lives in one person\'s scratch folder. The files are readable by other users, but this course has not been tested from a second account. Before you hand this to the group, have someone else run the <code>--help</code> command above, and decide whether the install should move to a shared location such as <code>/data</code>. Also note that <code>/scratch</code> is a scratch disk: check whether it is backed up.</p>'),
              check('Checkpoint', ['The --help command printed the option list', 'I created ~/boltz/input, output and msa'])
            ]
          }
        ]
      },

      {
        id: 'ideas', title: 'Module 1: The ideas', lessons: [
          {
            id: 'vs-af3', title: 'Boltz vs AlphaFold3: which, when', blocks: [
              p('Both tools <strong>co-fold</strong>: you give sequences and a ligand and they build the bound complex from scratch, with confidence scores. They differ in the details that matter for day-to-day use.'),
              table(['', 'AlphaFold3', 'Boltz-2'], [
                ['Input file', 'JSON', 'YAML'],
                ['Evolutionary info (MSA)', 'Built automatically on Woody from local databases (slow, ~7 min for FFA4)', 'You must choose: <code>msa: empty</code>, your own <code>.a3m</code>, or a remote server. No local databases are set up'],
                ['Binding affinity', 'Not predicted', '<strong>Predicted</strong> for one small-molecule ligand (&le; 128 atoms)'],
                ['Cyclic peptides', 'Only via a SMILES ligand', '<code>cyclic: true</code> on a protein entity, or SMILES'],
                ['Steering', 'None', 'Optional <code>pocket</code> / <code>contact</code> / <code>bond</code> constraints'],
                ['Scores', 'ipTM, pTM, ranking_score; pLDDT 0-100', 'ipTM, pTM, confidence_score; pLDDT <strong>0-1</strong>'],
                ['Samples per run', '5 per seed by default', '1 by default']
              ]),
              co('practice', 'Use them together', '<p>The tools make different mistakes. When both agree on a pose, trust it more. When they disagree, that is a flag to look harder. A natural workflow: AF3 for the structure, Boltz for a second opinion and an affinity estimate, always with a known control (TUG-891 for FFA4).</p>'),
              co('mistake', 'Do not compare scores across tools', '<p>An AF3 ipTM of 0.8 and a Boltz ipTM of 0.8 are not the same statement, and pLDDT is on a different scale. Compare within a tool, against that tool\'s control.</p>'),
              quiz('You want to rank 20 candidate ligands by predicted binding strength. Which tool gives you a number for that?', ['AlphaFold3', 'Boltz-2, through its affinity module', 'Either, using ipTM'], 1, 'Only Boltz-2 has an affinity head. ipTM is confidence in the pose, not binding strength.')
            ]
          },
          {
            id: 'msa-ideas', title: 'Evolutionary information (MSA)', blocks: [
              p('A multiple sequence alignment (MSA) is a stack of related sequences that tells the model which positions co-vary. For natural proteins it is a big help. Boltz makes you decide where it comes from, for every protein:'),
              table(['Choice', 'YAML', 'When'], [
                ['<strong>None</strong> (single sequence)', '<code>msa: empty</code>', 'Designed or cyclic peptides with no natural relatives, or a quick test. Boltz prints a warning that predictions will be suboptimal without an MSA'],
                ['<strong>Your own file</strong>', '<code>msa: /path/to/file.a3m</code>', 'Natural proteins. Recommended. Sequences stay on Woody'],
                ['<strong>Remote server</strong>', 'leave out <code>msa</code> and add <code>--use_msa_server</code>', 'Public sequences only. Your sequence is sent to <code>api.colabfold.com</code>']
              ]),
              co('safety', 'Privacy', '<p>If you leave <code>msa</code> out and do not pass <code>--use_msa_server</code>, Boltz stops with <em>Missing MSA&rsquo;s in input</em>. That is a safety net. Turning the flag on sends your sequence to an outside service, so keep it for sequences you would be happy to publish.</p>'),
              quiz('Boltz stops with &ldquo;Missing MSA&rsquo;s in input and --use_msa_server flag not set&rdquo;. What happened?', ['The GPU is busy', 'A protein has no msa: line and you did not allow the remote server', 'The YAML has a syntax error'], 1, 'Each protein needs an msa decision: empty, a file path, or the remote server.')
            ]
          }
        ]
      },

      {
        id: 'first', title: 'Module 2: Your first run', lessons: [
          {
            id: 'first-run', title: 'Predict a structure, start to finish', blocks: [
              p('We start with the smallest possible job: <strong>ubiquitin</strong>, 76 residues, in single-sequence mode. It is quick and mistakes are cheap. Expect it to be less reliable than a run with an MSA; the next lessons add one.'),
              h('Step 1: the input file'),
              p('Click <strong>Example: ubiquitin (no MSA)</strong>, then copy the &ldquo;save on Woody&rdquo; command into your Woody terminal.'),
              widget('boltzyaml'),
              code('ls ~/boltz/input\ncat ~/boltz/input/ubiquitin_test.yaml', 'on Woody'),
              h('Step 2: start tmux and pick a GPU'),
              code('nvidia-smi\ntmux new -s boltz', 'on Woody'),
              h('Step 3: run'),
              p('Change the GPU number and file name, then paste:'),
              code('export BOLTZ_CACHE=/scratch/drewdog/boltz/cache\nCUDA_VISIBLE_DEVICES=[[2]] \\\n    /scratch/drewdog/boltz/env/bin/boltz predict ~/boltz/input/[[ubiquitin_test.yaml]] \\\n    --out_dir ~/boltz/output', 'on Woody, inside tmux'),
              p('Boltz prints a short log: it processes the input, runs the model, and writes results. There is no progress bar for small jobs.'),
              co('mistake', 'Common first-run mistakes', '<ul><li><strong>Missing MSA</strong>: every protein needs <code>msa:</code> (see the previous lesson).</li><li><strong>Old results are kept</strong>: Boltz skips an input that already has results. Add <code>--override</code> to redo it.</li><li>Running outside <code>tmux</code>.</li></ul>'),
              h('Step 4: find the results'),
              code('ls ~/boltz/output/boltz_results_ubiquitin_test/predictions/ubiquitin_test', 'on Woody'),
              code('ubiquitin_test_model_0.cif                 <- best sample (ranked by confidence_score)\nconfidence_ubiquitin_test_model_0.json     <- the scores\nplddt_ubiquitin_test_model_0.npz           <- per-residue pLDDT\npae_ubiquitin_test_model_0.npz             <- PAE matrix\n(affinity_ubiquitin_test.json              <- only if you asked for affinity)', 'what you should see'),
              p('The layout is <code>&lt;out_dir&gt;/boltz_results_&lt;input name&gt;/predictions/&lt;job&gt;/</code>. With more than one sample you also get <code>_model_1</code>, <code>_model_2</code>&hellip;, ranked best first.'),
              check('Checkpoint: did it work?', ['The run finished without a traceback', 'A boltz_results_ folder appeared in ~/boltz/output', 'It contains a _model_0.cif', 'I can print the confidence json with cat']),
              quiz('You re-run the same command and it finishes instantly with no new results. Why?', ['Boltz found existing results and skipped the input', 'The GPU is faster the second time', 'The file was deleted'], 0, 'Boltz skips inputs that already have predictions. Use --override to force a re-run.')
            ]
          },
          {
            id: 'anatomy-yaml', title: 'Anatomy of the input YAML', blocks: [
              p('YAML is plain text where <strong>indentation is the structure</strong>. Use spaces, never tabs. The builder writes it correctly; this is how to read and edit it by hand.'),
              widget('boltzyaml'),
              table(['Field', 'Meaning', 'Notes'], [
                ['<code>version: 1</code>', 'Format version', 'Always 1'],
                ['<code>sequences:</code>', 'List of molecules, each starting with <code>-</code>', 'Entity types: protein, rna, dna, ligand'],
                ['<code>id</code>', 'Chain label. A list <code>[A, B]</code> means identical copies', 'Assigned by the builder'],
                ['<code>sequence</code>', 'Residues', 'Standard letters only'],
                ['<code>smiles</code> or <code>ccd</code>', 'How a ligand is defined', 'One or the other. SMILES is quoted in the builder so special characters are safe'],
                ['<code>msa</code>', 'empty, a file path, or unset', 'See the MSA lessons'],
                ['<code>cyclic: true</code>', 'Head-to-tail ring', 'Proteins/peptides only'],
                ['<code>constraints:</code>', 'Optional steering', 'pocket, contact, bond'],
                ['<code>properties:</code>', 'Optional extras', '<code>affinity</code> with a <code>binder</code> ligand']
              ]),
              co('mistake', 'The most common YAML errors', '<ul><li>Tabs instead of spaces, or misaligned indentation.</li><li>A SMILES that starts with <code>[</code> or contains characters special to YAML, which can be misread as a list or something else. Put it in single quotes (the builder does).</li><li>Different <code>msa</code> settings for two copies of the same sequence.</li></ul>'),
              code('/scratch/drewdog/boltz/env/bin/python -c "import yaml,sys; yaml.safe_load(open(sys.argv[1])); print(\'YAML OK\')" ~/boltz/input/[[my_job.yaml]]', 'on Woody: check a hand-edited file parses')
            ]
          },
          {
            id: 'anatomy-cmd', title: 'Anatomy of the run command', blocks: [
              table(['Part', 'Meaning', 'Change it?'], [
                ['<code>export BOLTZ_CACHE=&hellip;/cache</code>', 'Where the model weights are', 'No'],
                ['<code>CUDA_VISIBLE_DEVICES=2</code>', 'Which GPU this command may use', '<strong>Yes, every run</strong>'],
                ['<code>/scratch/drewdog/boltz/env/bin/boltz predict</code>', 'The program and its <code>predict</code> command', 'No'],
                ['<code>~/boltz/input/NAME.yaml</code>', 'Your input: a file, <em>or a folder of files</em>', '<strong>Yes, every run</strong>'],
                ['<code>--out_dir ~/boltz/output</code>', 'Where results go', 'Yes'],
                ['other <code>--flags</code>', 'Samples, seed, MSA server&hellip;', 'Per experiment (next module)']
              ]),
              co('note', 'No containers this time', '<p>Unlike AlphaFold3, Boltz is not run through Docker, so there are no <code>--volume</code> paths to worry about: the paths you give are the real Woody paths.</p>'),
              quiz('What does passing a folder instead of a single YAML do?', ['Nothing, it is an error', 'Runs every YAML in the folder', 'Merges them into one complex'], 1, 'Boltz accepts a directory and predicts each input in it. That is how you screen many ligands.')
            ]
          },
          {
            id: 'msa-practice', title: 'Giving Boltz an MSA (reuse AlphaFold3\'s)', blocks: [
              p('If you have already run a protein through AlphaFold3 on Woody, its MSA is saved inside the output, and Boltz can use it. That keeps your sequence on Woody, saves time, and means both tools see the same evolutionary information.'),
              ol(['Find AF3\'s <code>&lt;name&gt;_data.json</code>: <code>~/af3/output/&lt;name&gt;/&lt;name&gt;_data.json</code>.', 'Pull the protein\'s <code>unpairedMsa</code> out into an <code>.a3m</code> file (below).', 'Point the YAML at it with <code>msa: /full/path/to/file.a3m</code>.']),
              code('python3 -c "import json,sys; d=json.load(open(sys.argv[1])); open(sys.argv[2],\'w\').write(d[\'sequences\'][0][\'protein\'][\'unpairedMsa\'])" \\\n    ~/af3/output/[[ffa4_monomer]]/[[ffa4_monomer]]_data.json ~/boltz/msa/[[ffa4]].a3m\nls -l ~/boltz/msa', 'on Woody'),
              p('The <code>[\'sequences\'][0]</code> means the first entity in that AF3 job; change the number if your protein is not first. Check the file starts with <code>&gt;query</code> and your sequence:'),
              code('head -c 300 ~/boltz/msa/ffa4.a3m', 'on Woody'),
              co('note', 'Tested', '<p>This conversion was tested on the FFA4 run: Boltz\'s own A3M parser read the file (11,328 sequences, of which Boltz uses up to 8,192 by default).</p>'),
              co('mistake', 'Use the full path', '<p>Write the MSA path out in full (<code>/home/you/&hellip;</code>), not with <code>~</code>. The builder checks this. The paths in the examples are placeholders: use your own username.</p>'),
              widget('boltzyaml'),
              p('Click <strong>Example: FFA4 + TUG-891 + affinity</strong> to see a YAML that points at an MSA file and asks for affinity. Change <code>YOU</code> in the path to your username.')
            ]
          }
        ]
      },

      {
        id: 'tuning', title: 'Module 3: Parameters', lessons: [
          {
            id: 'param-explorer', title: 'The parameter explorer', blocks: [
              p('Every setting the group is likely to touch: what it does, our default, why, and when to change it.'),
              widget('paramref', { set: 'boltz', cats: ['Input YAML', 'Sampling', 'MSA', 'Affinity', 'Running'], title: 'Boltz parameter explorer' }),
              co('summary', 'The short version', '<p>First look: defaults, one idle GPU, a fixed seed. For anything you will report: several samples and a control. The settings that most change the answer are <em>your input choices</em>: the MSA, constraints and cyclic, not the sampling knobs.</p>'),
              quiz('Two identical Boltz commands give slightly different structures. The simplest fix for repeatability is&hellip;', ['Raise --recycling_steps', 'Set --seed', 'Use --override'], 1, 'Without a seed Boltz is not seeded, so each run samples differently. Set one to repeat a run.')
            ]
          },
          {
            id: 'cmd-builder', title: 'The command builder', blocks: [
              p('Pick a recipe, then adjust. Read the note under each recipe for the reason behind it.'),
              widget('boltzcmd'),
              check('Before pressing Enter', ['The GPU number is one I checked is idle', 'The YAML path is correct and the file exists', 'Every protein has an msa decision', 'I am inside tmux', 'I did not turn on the remote MSA server for a sequence I want to keep private'])
            ]
          }
        ]
      },

      {
        id: 'affinity', title: 'Module 4: Affinity, constraints and peptides', lessons: [
          {
            id: 'affinity', title: 'Predicting binding affinity', blocks: [
              p('Boltz-2 has a second network, the affinity head, that estimates how strongly a small molecule binds. You ask for it in the YAML by naming the ligand:'),
              code('properties:\n  - affinity:\n      binder: B', 'in the YAML'),
              h('Rules the parser enforces'),
              ul(['<strong>One</strong> ligand per job gets an affinity.', 'It must be a <strong>single copy</strong> (no multiple copies of that ligand).', 'It must be a single-residue ligand, and at most <strong>128 atoms</strong>. Larger molecules, including many macrocycles and peptides, are rejected.']),
              p('The result is written to <code>affinity_&lt;job&gt;.json</code> beside the structure:'),
              table(['Field', 'Meaning'], [
                ['<code>affinity_pred_value</code>', 'Predicted <strong>log<sub>10</sub>(IC<sub>50</sub>)</strong> with IC<sub>50</sub> in &micro;M. <strong>Lower means stronger binding.</strong> 0 is 1 &micro;M, &minus;1 is 0.1 &micro;M, 1 is 10 &micro;M'],
                ['<code>affinity_probability_binary</code>', 'Probability (0-1) that the molecule is a binder rather than a decoy. Use it to separate binders from non-binders'],
                ['<code>affinity_pred_value1/2</code>, <code>affinity_probability_binary1/2</code>', 'The same two quantities from the two individual affinity predictions behind the headline numbers (Boltz averages them when its affinity ensemble is on)']
              ]),
              co('practice', 'How to use it honestly', '<ul><li>Use <code>affinity_probability_binary</code> to ask <em>is it likely a binder</em>, and <code>affinity_pred_value</code> to <em>rank</em> binders against each other.</li><li>Always run a known strong binder and a known weak or non-binder (TUG-891 for FFA4) under identical settings. Judge a candidate against those, not in absolute terms.</li><li>Treat small differences as noise. A prediction is a hypothesis to test, not an IC<sub>50</sub>.</li><li>A good affinity with a poor structure confidence is not reassuring: check the pose first.</li></ul>'),
              widget('boltzyaml'),
              quiz('A candidate has affinity_pred_value = &minus;1.2 and the known agonist has &minus;0.4. Which is predicted to bind more strongly?', ['The agonist', 'The candidate, because lower log IC50 is stronger', 'They are equal'], 1, 'The value is log10 of IC50 in micromolar, so lower means a smaller IC50, i.e. stronger binding. Still, judge by the control and expect noise.')
            ]
          },
          {
            id: 'peptides', title: 'Cyclic peptides, constraints and templates', blocks: [
              h('Cyclic peptides'),
              p('Add <code>cyclic: true</code> to a protein entity to close the chain head-to-tail. Designed peptides have no natural relatives, so also use <code>msa: empty</code>:'),
              code('version: 1\nsequences:\n  - protein:\n      id: A\n      sequence: LFTRRSLDSPAAR\n      cyclic: true\n      msa: empty', 'a cyclic peptide in single-sequence mode'),
              p('Non-natural chemistry (D-amino acids, N-methylation, staples) cannot be written as a protein sequence. Enter those as a SMILES <code>ligand</code>, as in the AlphaFold3 macrocycle lesson, and remember that affinity is limited to 128 atoms.'),
              h('Constraints'),
              p('If you have outside evidence (mutagenesis, a crystal structure of a relative), you can steer the prediction:'),
              code('constraints:\n  - pocket:\n      binder: B\n      contacts: [[A, 45], [A, 47]]\n      max_distance: 6', 'ligand B should be within 6 Å of residues 45 and 47 of chain A'),
              co('mistake', 'A constrained result is partly your assumption', '<p>If you tell the model where the ligand goes and it goes there, that is not independent confirmation. Always run the same job <em>without</em> the constraint and compare.</p>'),
              widget('boltzyaml')
            ]
          }
        ]
      },

      {
        id: 'results', title: 'Module 5: Results and screening', lessons: [
          {
            id: 'read', title: 'Reading Boltz results', blocks: [
              p('Open <code>confidence_&lt;job&gt;_model_0.json</code> for the best sample. All values are 0 to 1.'),
              table(['Field', 'Meaning', 'Rule of thumb'], [
                ['<code>confidence_score</code>', 'Overall quality used to rank samples', 'Higher is better. Compare within Boltz only'],
                ['<code>ptm</code>', 'Whole-complex fold confidence', '&gt; 0.8 confident'],
                ['<code>iptm</code>', 'Interface confidence between chains', '&gt; 0.8 confident; &lt; 0.6 do not trust the interface'],
                ['<code>ligand_iptm</code> / <code>protein_iptm</code>', 'Interface confidence for ligand-protein / protein-protein pairs', 'Use ligand_iptm for a small-molecule pose'],
                ['<code>complex_plddt</code>, <code>complex_iplddt</code>', 'Local confidence for the whole complex and for interface residues', '0-1 here (AF3 uses 0-100)'],
                ['<code>complex_pde</code>, <code>complex_ipde</code>', 'Predicted distance error (lower is better)', 'The interface version is the one to check'],
                ['<code>chains_ptm</code>, <code>pair_chains_iptm</code>', 'Per-chain and per-pair scores', 'Chains are numbered 0, 1, 2&hellip; in input order']
              ]),
              widget('boltzscore'),
              co('mistake', 'Common misreadings', '<ul><li>A small ligand\'s own <code>chains_ptm</code> is not informative: judge the pose with <code>ligand_iptm</code> and the PAE.</li><li>A single sample is one draw. Several samples and seeds tell you how stable the pose is.</li><li>High structure confidence is not affinity, and a predicted affinity is not a measurement.</li></ul>'),
              widget('triage', { cases: [
                { src: 'illustrative', t: 'Known agonist plus complex', m: 'confidence_score 0.92, iptm 0.93, ligand_iptm 0.93, probability_binary 0.8', a: 0, why: 'Strong on every axis, and consistent with it being a known binder. Still a hypothesis.' },
                { src: 'illustrative', t: 'New ligand', m: 'confidence_score 0.71, iptm 0.55, ligand_iptm 0.55, affinity probability_binary 0.7', a: 1, why: 'The interface is below 0.6, so the pose is unreliable, whatever the affinity head says. Run more samples and seeds, compare with a control, and look at the interface PAE.' },
                { src: 'illustrative', t: 'Cyclic peptide, single sequence', m: 'confidence_score 0.55, ptm 0.30, iptm 0.0 (one chain)', a: 1, why: 'A single chain has no interface (iptm 0). A low ptm for a short peptide is common and less meaningful than for a protein. Check pLDDT per residue and whether several samples agree before drawing a conclusion.' },
                { src: 'illustrative', t: 'Five samples of one ligand', m: 'confidence_scores: 0.90, 0.89, 0.52, 0.88, 0.50', a: 1, why: 'The samples disagree. Overlay the top models in a viewer; agreement across samples is what builds trust.' },
                { src: 'illustrative', t: 'Constrained run', m: 'confidence_score 0.93 with a pocket constraint; 0.58 without it', a: 2, why: 'The good score depends on the constraint you imposed. Unconstrained, the model does not support that pose, so this is not independent evidence.' }
              ] })
            ]
          },
          {
            id: 'screening', title: 'Screening many ligands', blocks: [
              p('For a set of candidates against one target, write one YAML per ligand (same protein, same <code>msa</code> file, different ligand) into one folder, then point Boltz at the folder:'),
              code('export BOLTZ_CACHE=/scratch/drewdog/boltz/cache\nCUDA_VISIBLE_DEVICES=[[2]] \\\n    /scratch/drewdog/boltz/env/bin/boltz predict ~/boltz/input/[[candidates/]] \\\n    --out_dir ~/boltz/output/[[screen_01]]', 'on Woody, inside tmux'),
              ul(['Each protein uses the same <code>.a3m</code>, so no remote server is needed and the evolutionary information is identical for every candidate.', 'Include your <strong>positive and negative controls</strong> in the same folder, so they run under identical conditions.', 'Boltz skips inputs that already have results, so if the job is interrupted you can re-run the same command and it carries on.', 'For large screens you can split the folder into parts and run one part per GPU, each with its own <code>CUDA_VISIBLE_DEVICES</code>. Check <code>nvidia-smi</code> first, tell the group, and keep to the GPUs that are free.', 'Collect the numbers afterwards with a short script that reads each <code>affinity_*.json</code> and <code>confidence_*_model_0.json</code>. Check you read <em>every</em> folder: count the results against the number of inputs.']),
              co('practice', 'Rank, then verify', '<p>Use predicted affinity to shortlist, not to decide. Re-run the shortlist with more samples and seeds, look at the poses, and compare with AlphaFold3 before spending lab time on anything.</p>')
            ]
          }
        ]
      },

      {
        id: 'practice', title: 'Module 6: Good practice', lessons: [
          {
            id: 'trouble', title: 'Troubleshooting and etiquette', blocks: [
              ul(['Check <code>nvidia-smi</code> and choose an idle card with <code>CUDA_VISIBLE_DEVICES</code>.', 'Run inside <code>tmux</code> and name jobs sensibly.', 'Tell the group before queuing a large batch.']),
              table(['Symptom', 'Likely cause', 'What to do'], [
                ['Missing MSA\'s in input and --use_msa_server flag not set', 'A protein has no <code>msa:</code> line', 'Add <code>msa: empty</code> or an <code>.a3m</code> path (or deliberately allow the server)'],
                ['Finishes instantly, nothing new written', 'Results already exist, so the input was skipped', 'Use a new output folder or <code>--override</code>'],
                ['Affinity error mentioning 128 atoms, copies or multi-residue', 'The ligand breaks the affinity rules', 'Use a smaller single-copy ligand, or drop the affinity property'],
                ['Out of memory', 'Complex too big for the card, or too many samples at once', 'Lower <code>--diffusion_samples</code> or set <code>--max_parallel_samples 1</code>; use a free GPU'],
                ['Kernel-related crash', 'Custom GPU kernel problem', 'Retry with <code>--no_kernels</code>'],
                ['YAML parse error', 'Tabs, indentation, unquoted special characters', 'Use the builder; check with the Python one-liner'],
                ['Different result every run', 'No seed set', 'Add <code>--seed N</code>'],
                ['Run vanished when I closed my laptop', 'Not in tmux', 'Always use tmux']
              ]),
              p('All options are always available from the program itself:'),
              code('/scratch/drewdog/boltz/env/bin/boltz predict --help | less', 'on Woody (q to quit)')
            ]
          },
          {
            id: 'cheat', title: 'Cheat sheet and final quiz', blocks: [
              p('Use <strong>Print page</strong> in the sidebar to print or save as PDF.'),
              ol(['Log in, <code>tmux new -s boltz</code>, <code>nvidia-smi</code>.', 'Build the YAML (every protein needs an <code>msa</code> decision), save in <code>~/boltz/input</code>.', 'Generate the command, set the GPU and file, run.', 'Results: <code>~/boltz/output/boltz_results_&lt;name&gt;/predictions/&lt;job&gt;/</code>.', 'Read <code>confidence_*_model_0.json</code> and, if requested, <code>affinity_*.json</code>.', 'Open <code>_model_0.cif</code> in a viewer; compare with a control and with AlphaFold3.']),
              code('export BOLTZ_CACHE=/scratch/drewdog/boltz/cache\nCUDA_VISIBLE_DEVICES=[[2]] \\\n    /scratch/drewdog/boltz/env/bin/boltz predict ~/boltz/input/[[job.yaml]] \\\n    --out_dir ~/boltz/output', 'the baseline command'),
              quiz('Which Boltz feature has no equivalent in AlphaFold3?', ['Co-folding a protein and ligand', 'A predicted binding affinity for a small-molecule ligand', 'Using an MSA'], 1, 'The affinity head is Boltz-2\'s distinguishing feature.'),
              quiz('You set pocket constraints and get a confident pose. What should you do next?', ['Report it as confirmed', 'Run again without the constraint and compare', 'Increase --recycling_steps'], 1, 'A constraint imposes your assumption, so the result needs an unconstrained comparison.'),
              quiz('What does affinity_pred_value = 1 mean?', ['A predicted IC50 of about 10 µM (weak)', 'A predicted IC50 of about 1 nM', 'A 100% chance of binding'], 0, 'It is log10(IC50) in micromolar: 1 means 10 µM, and lower values mean stronger binding.'),
              check('You are ready when', ['I can build a YAML and choose an MSA option deliberately', 'I can launch a run in tmux on an idle GPU', 'I can say when to use Boltz rather than AlphaFold3', 'I can read the confidence and affinity files', 'I always run a control and treat predictions as hypotheses'])
            ]
          }
        ]
      }
    ]
  });
})();
