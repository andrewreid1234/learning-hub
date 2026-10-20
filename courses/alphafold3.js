/* AlphaFold3 on Woody: complete beginner course.
 * Content is data. Facts here were checked against ~/af3/HOWTO.md, ~/alphafold3/run_alphafold.py and docs/.
 * Items marked TODO need a lab-specific value filled in by whoever maintains the course. */
(function () {
  'use strict';
  var p = function (html) { return { t: 'p', html: html }; };
  var h = function (text, id) { return { t: 'h', text: text, id: id }; };
  var sub = function (text) { return { t: 'sub', text: text }; };
  var ul = function (items, ordered) { return { t: 'list', items: items, ordered: !!ordered }; };
  var code = function (text, label) { return { t: 'code', text: text, label: label }; };
  var co = function (kind, label, html) { return { t: 'callout', kind: kind, label: label, html: html }; };
  var table = function (head, rows) { return { t: 'table', head: head, rows: rows }; };
  var check = function (title, items) { return { t: 'check', title: title, items: items }; };
  var quiz = function (q, opts, answer, why) { return { t: 'quiz', q: q, opts: opts, answer: answer, why: why }; };
  var widget = function (name, props) { return { t: 'widget', name: name, props: props }; };
  var os = function (o) { o.t = 'os'; return o; };

  var DOCKER_BASE =
    'docker run -it --rm \\\n' +
    '    --volume $HOME/af3/input:/root/af_input \\\n' +
    '    --volume $HOME/af3/output:/root/af_output \\\n' +
    '    --volume /data/20260825_AndrewR_af3/models:/root/models \\\n' +
    '    --volume /data/20260825_AndrewR_af3/databases:/root/public_databases \\\n' +
    '    --gpus device=[[2]] \\\n' +
    '    alphafold3 \\\n' +
    '    python run_alphafold.py \\\n' +
    '    --json_path=/root/af_input/[[ubiquitin_monomer.json]] \\\n' +
    '    --model_dir=/root/models \\\n' +
    '    --output_dir=/root/af_output';

  Hub.register({
    id: 'alphafold3',
    title: 'AlphaFold3 on Woody',
    blurb: 'From zero to a finished, correctly interpreted prediction: set up a run by hand, understand every parameter, tune it per experiment, and read the results.',
    modules: [

      /* ============ 0. FOUNDATIONS ============ */
      {
        id: 'foundations', title: 'Module 0: Foundations', skippable: true, lessons: [
          {
            id: 'get-on-woody', title: 'Getting onto Woody', blocks: [
              p('<strong>Woody</strong> is the group\'s shared Linux server. It has the GPUs, the AlphaFold3 install and all the genetic databases (~630 GB), so you never install anything yourself. You work on it remotely from your own laptop or desktop.'),
              co('summary', 'Before you start', '<p>You need three things from Andrew (or whoever administers Woody): an account (username + password or key), Woody\'s network address, and membership of the <code>docker</code> group. Without the last one, AlphaFold3 will refuse to start.</p>'),
              h('Two tools, two jobs'),
              p('You need a <strong>terminal</strong> for typing commands (create files, start runs, check the GPUs) and a <strong>file-transfer tool</strong> for moving files between your computer and Woody (uploading input JSONs, downloading results). Pick your operating system in the sidebar: the instructions below follow it.'),
              os({
                win: [
                  table(['Job', 'Tool'], [['Terminal', '<strong>PowerShell</strong> or <strong>Windows Terminal</strong>. Windows 10/11 already include <code>ssh</code>. Open the Start menu, type <code>powershell</code>, press Enter.'], ['File transfer', '<strong>WinSCP</strong> (free download), a drag-and-drop window.']]),
                  code('ssh [[your-username]]@[[woody-address]]', 'in PowerShell, on your own computer'),
                  ol_steps(['In WinSCP choose <strong>New Session</strong>. File protocol: SFTP. Host name: Woody\'s address. Port 22. Your username.', 'Click <strong>Save</strong> and give the session a name (e.g. <code>woody</code>).', 'Log in. The left pane is your PC, the right is Woody. Drag files between them.'])
                ],
                mac: [
                  table(['Job', 'Tool'], [['Terminal', '<strong>Terminal</strong> (press Cmd+Space, type <code>Terminal</code>, Enter). <code>ssh</code>, <code>scp</code> and <code>rsync</code> are built in.'], ['File transfer', '<strong>Cyberduck</strong> (free, drag and drop; choose the SFTP protocol), or <code>scp</code> / <code>rsync</code> in Terminal.']]),
                  code('ssh [[your-username]]@[[woody-address]]', 'in Terminal, on your own computer'),
                  ol_steps(['In Cyberduck choose <strong>Open Connection</strong>. Protocol: SFTP. Server: Woody\'s address. Port 22. Your username.', 'Bookmark it so you can reconnect in one click.', 'Drag files between the Cyberduck window and Finder.'])
                ],
                linux: [
                  table(['Job', 'Tool'], [['Terminal', 'Any terminal (often Ctrl+Alt+T). <code>ssh</code>, <code>scp</code> and <code>rsync</code> are normally installed.'], ['File transfer', 'Your file manager: choose <em>Connect to Server</em> and enter <code>sftp://your-username@woody-address</code>. Or use <code>scp</code> / <code>rsync</code> in the terminal.']]),
                  code('ssh [[your-username]]@[[woody-address]]', 'in a terminal, on your own computer')
                ]
              }),
              p('Replace the two highlighted parts. The first time you connect, it asks you to trust the server: type <code>yes</code>. When it works you will see a prompt such as <code>[you@woody ~]$</code>. That <code>$</code> means Woody is waiting for a command. Every command block in this course is typed on Woody unless its label says <em>on your own computer</em>.'),
              co('todo', 'TODO for the lab', '<p>Fill in Woody\'s real address/hostname here, and whether off-campus access needs the university VPN. The course deliberately does not guess these.</p>'),
              check('Checkpoint', ['I can log in with SSH and see a prompt ending in $', 'I can see my Woody home folder in my file-transfer tool', 'I know my username and who to ask about the docker group']),
              quiz('You see the prompt <code>[you@woody ~]$</code>. Where are you?', ['On my own laptop', 'On Woody, in my home folder', 'Inside the AlphaFold3 container'], 1, 'The <code>~</code> means your home folder, and <code>woody</code> is the machine you are logged in to.')
            ]
          },
          {
            id: 'terminal-basics', title: 'Terminal survival kit', blocks: [
              p('You only need about a dozen commands. Type each one in the Woody terminal and press Enter. Nothing here can break AlphaFold3 itself, but <code>rm</code> deletes permanently, so read before you press Enter.'),
              table(['Command', 'What it does'], [
                ['<code>pwd</code>', 'Print where you are'],
                ['<code>ls</code> / <code>ls -l</code>', 'List files here (<code>-l</code> shows sizes and owners)'],
                ['<code>cd folder</code>', 'Go into a folder. <code>cd ..</code> goes up. <code>cd</code> alone goes home'],
                ['<code>mkdir -p a/b</code>', 'Make a folder (and parents)'],
                ['<code>nano file.json</code>', 'Edit a file in the terminal. Save: Ctrl+O then Enter. Exit: Ctrl+X'],
                ['<code>cat file</code> / <code>less file</code>', 'Show a file. In <code>less</code>, press <code>q</code> to quit'],
                ['<code>cp a b</code> / <code>mv a b</code>', 'Copy / move or rename'],
                ['<code>rm file</code>', 'Delete (no recycle bin)'],
                ['<code>Tab</code> key', 'Auto-completes names. Use it constantly'],
                ['&uarr; arrow', 'Recall previous commands'],
                ['<code>Ctrl+C</code>', 'Stop the thing that is running']
              ]),
              h('Try it'),
              code('pwd\nmkdir -p ~/af3/input ~/af3/output ~/af3/logs\nls ~/af3', 'on Woody'),
              p('That creates the three folders AlphaFold3 uses: <code>input</code> (your JSON files), <code>output</code> (results) and <code>logs</code>. If they already exist nothing happens, which is fine.'),
              h('tmux: keep a job alive when you disconnect'),
              co('mistake', 'Common mistake', '<p>If you start a long run in a plain SSH window and your Wi-Fi blinks or your laptop sleeps, the run dies. Run long jobs inside <code>tmux</code>.</p>'),
              code('tmux new -s af3        # start a named session; run your job inside it\n# detach (job keeps running): press Ctrl+B, release, then press D\ntmux ls                # list sessions\ntmux attach -t af3     # come back to it later', 'on Woody'),
              check('Checkpoint', ['I created ~/af3/input and ~/af3/output', 'I can open a file with nano and save it', 'I started and detached from a tmux session, then re-attached'])
            ]
          },
          {
            id: 'woody-layout', title: 'Docker, GPUs and where things live', blocks: [
              h('The map'),
              table(['Path', 'What it is', 'Yours to change?'], [
                ['<code>~/af3/input/</code>', 'Your input JSON files', 'Yes'],
                ['<code>~/af3/output/</code>', 'Results, one folder per job', 'Yes'],
                ['<code>~/af3/logs/</code>', 'Optional: logs of runs', 'Yes'],
                ['<code>/data/20260825_AndrewR_af3/models/</code>', 'AlphaFold3 model weights, shared', '<strong>No</strong>'],
                ['<code>/data/20260825_AndrewR_af3/databases/</code>', 'Genetic databases (~630 GB), shared', '<strong>No</strong>'],
                ['<code>~/alphafold3/</code>', 'The AlphaFold3 code (examples are in <code>examples/</code>)', 'Read only for you']
              ]),
              p('Everyone points at the same weights and databases, so there is nothing to download or set up per person.'),
              h('What Docker is, in one paragraph'),
              p('AlphaFold3 and everything it depends on is packaged into a self-contained <strong>image</strong> called <code>alphafold3</code>. <code>docker run</code> starts a <strong>container</strong> from that image, a temporary sealed box in which the program runs. The box cannot see Woody\'s folders unless you <strong>mount</strong> them with <code>--volume woody-folder:path-inside-box</code>. That is why the run command has four <code>--volume</code> lines: they connect your input, your output, the weights and the databases to the box.'),
              h('Check you have access'),
              code('groups                 # the list should include: docker\ndocker images          # should list an image called alphafold3', 'on Woody'),
              co('mistake', 'permission denied on the Docker socket', '<p>You are not in the <code>docker</code> group yet, or you have not logged out and back in since being added. Ask the administrator, then log out and in again.</p>'),
              h('The GPUs are shared'),
              p('Woody has <strong>four RTX A5500 cards, 24 GB each</strong>, numbered 0 to 3, used by the whole group. Always look before you launch:'),
              code('nvidia-smi', 'on Woody'),
              p('Find a card whose <em>Memory-Usage</em> is near zero and note its number. You will use it as <code>--gpus device=N</code>. AlphaFold3 only uses one GPU per job, so grabbing all four (<code>--gpus all</code>) blocks nobody but looks greedy.'),
              check('Checkpoint', ['groups lists docker', 'docker images shows alphafold3', 'I ran nvidia-smi and can name an idle GPU'])
            ]
          }
        ]
      },

      /* ============ 1. CONCEPTS ============ */
      {
        id: 'concepts', title: 'Module 1: The ideas', lessons: [
          {
            id: 'what-is-af3', title: 'What AlphaFold3 does (and does not)', blocks: [
              p('AlphaFold3 (AF3) predicts the 3D structure of biological molecules and, importantly for this group, of molecules <strong>bound to each other</strong>: a protein with another protein, a peptide, a macrocycle, a small molecule, DNA, RNA or ions.'),
              h('Co-folding, not docking'),
              p('Classic docking (AutoDock, Glide) takes a fixed receptor and scores many candidate poses of a ligand. AF3 does something different: you give it the sequences and the ligand\'s chemical structure, and it <strong>builds the whole bound complex from scratch</strong> in one go. You do not get a ranked list of poses. You get a handful of predicted structures and some confidence scores that tell you how far to trust them.'),
              h('What happens in a run'),
              ol_steps(['<strong>Data pipeline (CPU).</strong> AF3 searches big sequence databases for evolutionary relatives of your protein, building a <em>multiple sequence alignment (MSA)</em>, and looks for similar known structures (<em>templates</em>). This is the slow part. For FFA4 (297 residues) it took about 440 seconds.', '<strong>Inference (GPU).</strong> The neural network turns that information into 3D coordinates, using a <em>diffusion</em> process that starts from noise and refines it. For FFA4 this took about 53 seconds for 5 structures.', '<strong>Ranking.</strong> Each structure gets confidence scores; the best is saved as the main answer.']),
              co('note', 'Why this matters for planning', '<p>The slow stage needs no GPU and depends only on the <em>protein</em>. That is why you can split the run into two stages and, when screening many ligands against one target, pay for the search only once. The tuning module returns to this.</p>'),
              h('Limits you should keep in mind'),
              ul(['A prediction is a <strong>hypothesis</strong>, not a measurement. High confidence is not proof.', 'AF3 can look confident and still be wrong, especially for interactions it has never seen anything like.', 'It does not predict binding <em>affinity</em>. A high interface score does not mean a potent compound.', 'The training data contains few macrocycles and peptidomimetics, so treat those poses with extra scepticism and always compare to a known control (we use TUG-891 for FFA4).']),
              quiz('AF3 returns a single structure with a high interface confidence for your new compound. What does that tell you?', ['The compound is a potent binder', 'AF3 is confident about the predicted binding mode, which you should now treat as a hypothesis to test', 'The compound will be active in a cell assay'], 1, 'Confidence is about the structure, not affinity or biological activity. It tells you how much to trust the predicted pose.')
            ]
          },
          {
            id: 'vocab', title: 'Vocabulary you will meet', blocks: [
              table(['Term', 'Plain meaning'], [
                ['<strong>Entity / chain</strong>', 'One molecule in your input (a protein, a ligand, a strand of DNA). Each gets a chain ID: A, B, C&hellip;'],
                ['<strong>Sequence</strong>', 'Letters for a protein (<code>MKV&hellip;</code>), RNA (ACGU) or DNA (ACGT). From UniProt for proteins.'],
                ['<strong>SMILES</strong>', 'A line of text that describes a small molecule or macrocycle\'s structure. How non-protein things enter AF3. PubChem lists them.'],
                ['<strong>CCD code</strong>', 'A short PDB code for a standard chemical, e.g. ATP, MG (magnesium ion), HEM.'],
                ['<strong>MSA</strong>', 'A pile of related sequences lined up against yours. Co-varying positions hint at 3D contacts.'],
                ['<strong>Template</strong>', 'A known PDB structure used as a hint.'],
                ['<strong>Seed</strong>', 'A number controlling the random sampling. Different seeds can give different structures.'],
                ['<strong>Sample</strong>', 'One predicted structure. Default is 5 per seed.'],
                ['<strong>Token</strong>', 'AF3\'s size unit: one per amino acid or nucleotide, and one per heavy atom of a ligand. Size drives memory.'],
                ['<strong>pLDDT</strong>', 'Per-atom local confidence, 0-100.'],
                ['<strong>PAE</strong>', 'Predicted error (&Aring;) in the position of one part, judged from another. Great for interfaces.'],
                ['<strong>pTM / ipTM</strong>', 'Whole-fold confidence / interface confidence, 0-1.'],
                ['<strong>Macrocycle</strong>', 'A large ring molecule, often a cyclised peptide. Goes in as a SMILES ligand.']
              ]),
              quiz('A cyclic peptide with a D-amino acid should be entered as&hellip;', ['A protein entity with the sequence', 'A ligand entity with a SMILES string', 'Two protein entities'], 1, 'The protein entity only understands linear chains of the 20 natural amino acids. Rings and non-natural chemistry need SMILES.')
            ]
          }
        ]
      },

      /* ============ 2. FIRST RUN ============ */
      {
        id: 'first-run', title: 'Module 2: Your first run', lessons: [
          {
            id: 'ubiquitin', title: 'Fold a protein, start to finish', blocks: [
              p('We will fold human <strong>ubiquitin</strong> (76 residues): small, famous, and quick, so mistakes are cheap. You will do each step by hand.'),
              h('Step 1: make the input file'),
              p('Everything AF3 needs to know goes in one <strong>JSON</strong> file. Use the builder: click <strong>Example: ubiquitin</strong>, look at the output, then use <strong>Copy &ldquo;save on Woody&rdquo; command</strong> and paste it into your Woody terminal.'),
              widget('jsonbuilder'),
              p('Check that it worked:'),
              code('ls ~/af3/input\ncat ~/af3/input/ubiquitin_monomer.json', 'on Woody'),
              co('note', 'Prefer a file-transfer tool?', '<p>Use <strong>Download .json</strong>, then drag the file into <code>~/af3/input</code> in WinSCP / Cyberduck / your file manager. Same result.</p>'),
              h('Step 2: pick a GPU and start tmux'),
              code('nvidia-smi          # note an idle GPU number\ntmux new -s af3', 'on Woody'),
              h('Step 3: launch'),
              p('Change the two highlighted parts (the GPU number and your file name) and paste. The <strong>Copy</strong> button strips the highlighting.'),
              code(DOCKER_BASE, 'on Woody, inside tmux'),
              p('You will see a stream of log lines. There is no progress bar. A small protein may take only a few minutes; <strong>FFA4 at 297 residues took ~7 minutes just for the search</strong>. Long silence without GPU activity is normal during the search.'),
              co('mistake', 'Do not', '<ul><li>Close the terminal without tmux.</li><li>Start a second job on the same GPU without checking it is free.</li><li>Re-run with the same <code>name</code> expecting an overwrite: AF3 makes a new time-stamped folder instead.</li></ul>'),
              h('Step 4: look at the result'),
              code('ls ~/af3/output/ubiquitin_monomer', 'on Woody'),
              code('ubiquitin_monomer_model.cif                 <- the best predicted structure\nubiquitin_monomer_summary_confidences.json  <- the headline scores\nubiquitin_monomer_confidences.json          <- per-atom pLDDT and the PAE matrix\nubiquitin_monomer_ranking_scores.csv        <- score of every sample\nubiquitin_monomer_data.json                 <- your input plus the MSA/templates AF3 used\nseed-42_sample-0/ ... sample-4/             <- all individual predictions', 'what you should see'),
              p('Print the headline scores:'),
              code('cat ~/af3/output/ubiquitin_monomer/ubiquitin_monomer_summary_confidences.json', 'on Woody'),
              check('Checkpoint: did it work?', ['The run finished without a Python traceback', 'A folder named after my job appeared in ~/af3/output', 'It contains a _model.cif file', 'ptm in the summary file is above 0.8 (ubiquitin is easy)', 'iptm is null and I know why (one chain)']),
              co('practice', 'Next', '<p>Open Module 2, lesson 2 to learn exactly what each line of that command does, so you can change it with confidence.</p>')
            ]
          },
          {
            id: 'anatomy-command', title: 'Anatomy of the run command', blocks: [
              p('Read the command line by line. Nothing in it is magic.'),
              table(['Part', 'Meaning', 'Change it?'], [
                ['<code>docker run -it</code>', 'Start a container; <code>-it</code> keeps it interactive so you see the log', 'No'],
                ['<code>--rm</code>', 'Delete the stopped container afterwards so they do not pile up. Results are safe in your mounted output folder.', 'Optional'],
                ['<code>--volume $HOME/af3/input:/root/af_input</code>', 'Make Woody\'s <code>~/af3/input</code> appear inside the container as <code>/root/af_input</code>', 'No'],
                ['<code>--volume $HOME/af3/output:/root/af_output</code>', 'Same for output. Results are written here', 'No'],
                ['<code>--volume &hellip;/models:/root/models</code>', 'The shared model weights', 'No'],
                ['<code>--volume &hellip;/databases:/root/public_databases</code>', 'The shared genetic databases', 'No'],
                ['<code>--gpus device=2</code>', 'Which GPU the container may use', '<strong>Yes: every run</strong>'],
                ['<code>alphafold3</code>', 'The image to run', 'No'],
                ['<code>python run_alphafold.py</code>', 'The program inside the container', 'No'],
                ['<code>--json_path=/root/af_input/X.json</code>', 'Your input, <em>as seen from inside the container</em>', '<strong>Yes: every run</strong>'],
                ['<code>--model_dir=/root/models</code>', 'Where the weights are, inside the container', 'No'],
                ['<code>--output_dir=/root/af_output</code>', 'Where to write results, inside the container', 'No']
              ]),
              co('note', 'Two sets of paths', '<p>Paths starting <code>/root/&hellip;</code> exist only <em>inside</em> the container. The left side of each <code>--volume</code> is the real Woody path; the right side is what the program sees. You will mostly only edit the file name and the GPU number.</p>'),
              p('Everything beyond this baseline (extra flags, environment variables, splitting stages) is added by the <strong>Command builder</strong> in the next module.'),
              quiz('You get &ldquo;No such file or directory: /root/af_input/my_job.json&rdquo;. What is the most likely cause?', ['The weights are missing', 'The file is not in ~/af3/input, or the name is spelled differently', 'The GPU is busy'], 1, 'The container sees your ~/af3/input folder as /root/af_input. If the file is not in that folder (or the name differs), it cannot be found.')
            ]
          },
          {
            id: 'anatomy-json', title: 'Anatomy of the input JSON', blocks: [
              p('Take the FFA4 + TUG-891 file apart. Load it in the builder below and compare with the explanation.'),
              widget('jsonbuilder'),
              table(['Field', 'Meaning', 'Notes'], [
                ['<code>name</code>', 'Job name; the output folder is named after it', 'Letters, numbers, <code>_ - .</code>'],
                ['<code>sequences</code>', 'The list of molecules', 'Each is a <code>protein</code>, <code>rna</code>, <code>dna</code> or <code>ligand</code> object'],
                ['<code>id</code>', 'The chain label (A, B&hellip;). A list means identical copies', 'The builder assigns these'],
                ['<code>sequence</code>', 'The residues', 'Standard letters only'],
                ['<code>smiles</code> / <code>ccdCodes</code>', 'How a ligand is defined', 'One or the other'],
                ['<code>description</code>', 'Free text for your records', 'Optional but strongly recommended'],
                ['<code>modelSeeds</code>', 'Random seeds, one set of structures each', 'See the parameter explorer'],
                ['<code>dialect</code>, <code>version</code>', 'Format markers', 'Always <code>"alphafold3"</code> and <code>4</code>']
              ]),
              co('mistake', 'The most common JSON errors', '<ul><li>A missing comma or bracket. The builder cannot make this mistake; hand editing can.</li><li>A backslash in a SMILES string typed by hand. JSON needs it doubled (<code>\\\\</code>). The builder does this for you.</li><li>Sequence copied with spaces, numbers or a FASTA header line. The builder strips them.</li></ul>'),
              p('To check a hand-edited file for syntax errors on Woody:'),
              code('python3 -m json.tool ~/af3/input/[[my_job.json]] > /dev/null && echo OK', 'on Woody'),
              p('It prints <code>OK</code> if the file is valid JSON, or the line of the first error.'),
              h('Where to get inputs'),
              ul(['Protein sequences: <a href="https://www.uniprot.org/" target="_blank" rel="noopener">UniProt</a> (open the entry, copy the sequence). Decide deliberately which <em>construct</em> you want: full length, or the part that is actually in your assay or structure.', 'Small-molecule SMILES: <a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noopener">PubChem</a>, or export from ChemDraw / RDKit / your own tools.', 'Worked examples for DNA, RNA, glycans and modifications: <code>~/alphafold3/examples/</code> on Woody.'])
            ]
          }
        ]
      },

      /* ============ 3. TUNING ============ */
      {
        id: 'tuning', title: 'Module 3: Parameters and tuning', lessons: [
          {
            id: 'parameter-explorer', title: 'The parameter explorer', blocks: [
              p('AF3 has few settings that matter. This is every one the group is likely to touch, with <strong>our default, why we use it, and when to change it for an experiment</strong>. Open a card to read it.'),
              widget('paramref', { cats: ['Input JSON', 'Sampling', 'Running it', 'GPU & memory', 'Outputs'], title: 'Parameter explorer' }),
              co('summary', 'The short version', '<p>For a first look: defaults, one seed, one idle GPU. For a result you will report: three to five seeds. For floppy ligands or macrocycles: more samples. Only touch memory settings if a job runs out of memory.</p>'),
              quiz('A designed peptide has no natural relatives. A good experiment to ask whether AF3 is just reproducing evolutionary signal is&hellip;', ['Raise num_recycles to 50', 'Set unpairedMsa and pairedMsa to empty strings (MSA-free run)', 'Use --gpus all'], 1, 'An empty string tells AF3 not to search. Comparing MSA and MSA-free runs shows how much of the prediction depends on evolutionary information.')
            ]
          },
          {
            id: 'command-builder', title: 'The command builder', blocks: [
              p('Choose the recipe closest to your experiment and the builder produces the exact command. You can still tweak every field. Read the <em>Why this recipe</em> note each time: the point is to understand the choice, not just copy the output.'),
              widget('cmdbuilder'),
              co('note', 'JSON still matters', '<p>Some choices live in the input file, not the command (seeds list, MSA on/off, templates, copies). Use the JSON builder for those. Seeds can be given either way; <code>--num_seeds=N</code> requires exactly one seed in the JSON.</p>'),
              check('Before pressing Enter', ['The GPU number is one I checked is idle', 'The JSON file is in ~/af3/input and the name matches', 'I am inside tmux', 'I know where the output will appear'])
            ]
          },
          {
            id: 'stages-screening', title: 'Splitting stages and screening many ligands', blocks: [
              p('The CPU search depends only on the <strong>protein</strong>, and for FFA4 it took ~440 s of a ~500 s run. If you want to test twenty macrocycles against the same receptor, searching twenty times is wasted effort. AF3 lets you do the search once.'),
              h('Stage 1: search only'),
              p('Run once on your receptor plus any one ligand, with <code>--run_inference=false</code> and no GPU. The output folder gets a <code>&lt;name&gt;_data.json</code>: your input with the MSA and templates filled in.'),
              h('Stage 2: predict only'),
              p('Run inference with <code>--run_data_pipeline=false</code>, giving the <strong><code>_data.json</code></strong> as input. Using your original JSON here does not work, because it has no MSA in it.'),
              co('mistake', 'Check this against the older HOWTO', '<p>The Woody HOWTO\'s staging example reuses the original JSON for stage 2. According to the AF3 docs (<code>docs/performance.md</code>) inference-only runs need the pre-computed MSAs in the input, i.e. the <code>_data.json</code>. Use the version in this course until the HOWTO is confirmed or corrected.</p>'),
              h('Swapping ligands without re-searching'),
              ol_steps(['Copy the stage-1 result: <code>cp ~/af3/output/NAME/NAME_data.json ~/af3/input/candidate_01.json</code>', 'Open it with <code>nano</code>. Change <code>"name"</code> to a new unique job name and replace the ligand\'s <code>smiles</code> only. Leave the protein\'s MSA and template fields untouched.', 'Run stage 2 on that file. Repeat for each candidate.']),
              co('practice', 'Rules of thumb', '<ul><li>Only the ligand changes: its entry has no MSA, so nothing needs re-searching.</li><li>If you change the <em>protein</em> sequence, you must redo the search.</li><li>Give every candidate a unique <code>name</code>, or the outputs will collide.</li></ul>'),
              p('Use the Command builder\'s <strong>Screen many ligands</strong> recipe to generate the two commands. For a whole folder of candidate files, <code>--input_dir</code> runs them one after another and loads the model once.'),
              quiz('You changed the receptor construct (removed a loop). Can you reuse the old _data.json?', ['Yes, the ligand is the same', 'No, the protein sequence changed so the search must be redone', 'Yes if I lower num_recycles'], 1, 'The MSA is specific to the protein sequence. Only ligand changes can reuse a previous search.')
            ]
          }
        ]
      },

      /* ============ 4. DOCKING-STYLE ============ */
      {
        id: 'docking', title: 'Module 4: Docking-style experiments', lessons: [
          {
            id: 'ppi', title: 'Protein + protein', blocks: [
              p('Add a second <code>protein</code> entity with another chain ID. No extra flags. A linear peptide binder is also just a short protein entity. In the builder: <strong>Add protein</strong> twice, or click a preset and extend it.'),
              widget('jsonbuilder'),
              p('For these jobs the key number is <code>iptm</code> or, if you know which two chains interact, <code>chain_pair_iptm</code>. Run three or more seeds.'),
              co('practice', 'Homo-oligomers', '<p>For identical subunits set <em>Copies</em> above 1 rather than pasting the sequence repeatedly. Tokens (and memory) add up with every copy.</p>')
            ]
          },
          {
            id: 'ligand-ffa4', title: 'Protein + small molecule (FFA4 + TUG-891)', blocks: [
              p('This is the benchmark run. <strong>TUG-891</strong> is a real FFA4 agonist (experimental EC<sub>50</sub> roughly 0.2-0.4 &micro;M). AF3 gave <code>iptm</code> 0.94 and <code>ranking_score</code> 0.95. Any new compound should be judged against this.'),
              widget('jsonbuilder'),
              p('Click <strong>Example: FFA4 + TUG-891</strong> and read the JSON. The ligand is a <code>ligand</code> entity with a <code>smiles</code>. The 297-residue receptor is a <code>protein</code> entity.'),
              widget('cmdbuilder'),
              co('practice', 'Always run a control', '<p>Pair every unknown compound with a known binder (TUG-891 for FFA4) <em>and</em> ideally a known non-binder, under identical settings. Without a control, a score has nothing to be compared to.</p>'),
              check('Checkpoint', ['I built the FFA4 + TUG-891 JSON', 'I generated a command for it', 'I know which score I would look at first (iptm / chain_pair_iptm)'])
            ]
          },
          {
            id: 'macrocycles', title: 'Macrocycles and peptidomimetics', blocks: [
              p('A <code>protein</code> entity cannot represent a head-to-tail ring, a staple, D-amino acids or N-methylation. <strong>Put the whole molecule in as a <code>ligand</code> with a SMILES string.</strong> This is the approach recommended by AF3\'s maintainers for peptide-like molecules (see <a href="https://github.com/google-deepmind/alphafold3/issues/242" target="_blank" rel="noopener">GitHub issue #242</a>).'),
              h('Get a SMILES'),
              ul(['From the structure editor you already use (ChemDraw: Copy As &rarr; SMILES), RDKit or PepWiz.', 'Check it parses: paste it in a SMILES viewer, or in the builder, which flags unbalanced brackets and unpaired ring digits.']),
              p('Ring-closure syntax, as a toy example (cyclic tri-glycine, not a drug): a digit marks the two atoms that are joined.'),
              code('C1C(=O)NCC(=O)NCC(=O)N1', 'SMILES syntax demo only'),
              widget('jsonbuilder'),
              h('Macrocycle-specific settings'),
              ul(['<strong>More seeds and samples.</strong> Macrocycles are flexible. Five seeds x ten samples shows whether the pose is stable. The Command builder has a recipe.', '<strong>RDKit failures.</strong> If you see <code>Failed to construct RDKit reference structure</code>, first check the SMILES, then raise <code>--conformer_max_iterations</code>.', '<strong>Size.</strong> Each heavy atom is a token; large macrocycles are expensive.', '<strong>Compare to a control</strong> and be cautious: there is little macrocycle data in AF3\'s training set.']),
              co('mistake', 'Backslashes', '<p>SMILES often contain <code>\\</code> for double-bond geometry. In JSON each must be doubled. The builder does this. If you hand edit, run <code>python3 -m json.tool</code> afterwards.</p>'),
              quiz('Which is the right place for a stapled, D-amino-acid-containing peptide?', ['protein entity, with X for the unusual residues', 'ligand entity with a SMILES string', 'Skip it: AF3 cannot handle it at all'], 1, 'The SMILES ligand route can express arbitrary chemistry. Interpret the result carefully though.')
            ]
          }
        ]
      },

      /* ============ 5. RESULTS ============ */
      {
        id: 'results', title: 'Module 5: Reading results', lessons: [
          {
            id: 'get-files', title: 'Getting results onto your PC', blocks: [
              p('The structure you want is <code>&lt;job&gt;_model.cif</code> in <code>~/af3/output/&lt;job&gt;/</code>. Copy the whole job folder to your computer. Pick your OS in the sidebar:'),
              os({
                win: [
                  p('<strong>WinSCP:</strong> drag the folder across, or use <strong>Synchronize</strong> to mirror <code>~/af3/output</code> to a folder on your PC.')
                ],
                mac: [
                  p('<strong>Cyberduck:</strong> drag the folder to Finder. Or in Terminal (<code>rsync</code> only copies what is new, so it is quick to repeat):'),
                  code('rsync -av [[your-username]]@[[woody-address]]:~/af3/output/[[job_name]] ~/Downloads/', 'in Terminal, on your own computer')
                ],
                linux: [
                  p('From your file manager (the <code>sftp://</code> connection), or in a terminal (<code>rsync</code> only copies what is new, so it is quick to repeat):'),
                  code('rsync -av [[your-username]]@[[woody-address]]:~/af3/output/[[job_name]] ~/Downloads/', 'in a terminal, on your own computer')
                ]
              }),
              p('Then open the <code>.cif</code> in a molecular viewer:'),
              ul(['<a href="https://www.cgl.ucsf.edu/chimerax/" target="_blank" rel="noopener">UCSF ChimeraX</a> or PyMOL, installed on your computer (both run on Windows, Mac and Linux)', 'Mol* (<a href="https://molstar.org/viewer/" target="_blank" rel="noopener">molstar.org/viewer</a>), in a browser with nothing to install']),
              co('practice', 'Colour by confidence', '<p>AF3 writes pLDDT into the B-factor column of the <code>.cif</code>. In ChimeraX: <code>color bfactor palette alphafold</code>. Blue regions are well predicted; orange regions are guesses.</p>'),
              co('note', 'Files owned by root', '<p>Runs started through Docker typically write files owned by <code>root</code>, so you may be unable to delete old output folders yourself. Ask the administrator, and do not fight it with permissions. (Whether adding <code>--user</code> to the command avoids this has not been tested on Woody.)</p>'),
              check('Checkpoint', ['I copied a result folder to my PC', 'I opened the .cif in a viewer', 'I coloured it by confidence'])
            ]
          },
          {
            id: 'confidence', title: 'Reading the confidence scores', blocks: [
              p('First the headline numbers, then the two plots that tell you <em>where</em> to trust the structure. The examples below are the <strong>real outputs</strong> of the two FFA4 runs.'),
              table(['Score', 'Range', 'Rule of thumb'], [
                ['<code>ranking_score</code>', 'up to ~1.5', '&gt; 0.8 strong. Used to pick the best sample.'],
                ['<code>ptm</code>', '0-1', '&gt; 0.8 confident fold; 0.6-0.8 grey zone; &lt; 0.6 probably wrong'],
                ['<code>iptm</code>', '0-1 or null', 'Same bands, but about the interface between chains. null for a single chain'],
                ['<code>chain_pair_iptm</code>', '0-1', 'Confidence for one specific pair of chains, e.g. receptor vs ligand'],
                ['<code>fraction_disordered</code>', '0-1', 'Share predicted unstructured'],
                ['<code>has_clash</code>', '0 / 1', '1 means physical overlaps. Treat the sample with suspicion']
              ]),
              widget('resulttrainer'),
              h('How the ranking score is built'),
              widget('scorecalc'),
              co('mistake', 'Common misreadings', '<ul><li>iptm <em>null</em> on a single chain is normal.</li><li>A tiny ligand\'s own <code>chain_ptm</code> is meaningless.</li><li>A high average can hide a bad interface: check the PAE block.</li><li>A good score on one seed is not reproducibility. Run more.</li><li>Confidence is not affinity.</li></ul>'),
              quiz('A complex has ptm 0.85, iptm 0.55. What is the most sensible reading?', ['Both chains are individually well folded, but the interface is not trustworthy', 'The complex is perfect', 'The run failed'], 0, 'ptm describes the overall fold; iptm describes the interface. The interface falls below the 0.6 line, so the binding mode should not be trusted without further evidence.')
            ]
          },
          {
            id: 'triage', title: 'Triage practice', blocks: [
              p('Decide quickly and defend it. One real result, five constructed ones.'),
              widget('triage'),
              h('A simple decision flow'),
              ol_steps(['<strong>has_clash = 1?</strong> Do not trust that sample. Look at others.', '<strong>ptm &lt; 0.6?</strong> The fold itself is doubtful. Stop and rethink the construct.', '<strong>Is it a complex? Check iptm / chain_pair_iptm.</strong> &gt; 0.8 good, 0.6-0.8 check detail, &lt; 0.6 do not trust the interface.', '<strong>Look at the PAE block</strong> between the two parts. Low is good.', '<strong>Do the seeds agree?</strong> Compare top structures across seeds in a viewer.', '<strong>Compare to your control</strong> (e.g. TUG-891 with FFA4).'])
            ]
          }
        ]
      },

      /* ============ 6. GOOD PRACTICE ============ */
      {
        id: 'practice', title: 'Module 6: Good practice', lessons: [
          {
            id: 'etiquette-trouble', title: 'Shared GPUs and troubleshooting', blocks: [
              h('Be a good neighbour'),
              ul(['Run <code>nvidia-smi</code> first. Choose an idle card with <code>--gpus device=N</code>.', 'Use the CPU-only stage 1 for long searches: it holds no GPU.', 'Run inside <code>tmux</code>, and check on the job rather than leaving it forgotten.', 'Do not queue dozens of jobs without telling the group.', 'Name jobs sensibly (<code>target_ligand_date</code>) so folders can be found and cleaned up later.']),
              h('When something goes wrong'),
              table(['Symptom', 'Likely cause', 'What to do'], [
                ['<code>permission denied</code> on Docker', 'Not in docker group, or not re-logged-in', 'Ask the administrator; log out and in'],
                ['No such file /root/af_input/&hellip;', 'File not in ~/af3/input or name mismatch', '<code>ls ~/af3/input</code>; fix the name'],
                ['Silence for 10+ minutes, GPU idle', 'Normal: CPU search', 'Wait. Check CPU with <code>htop</code>'],
                ['Out of memory during inference', '24 GB card too small for this size', 'Add the unified-memory variables (Command builder). If still failing, the target is too big'],
                ['<code>Failed to construct RDKit reference structure</code>', 'Bad SMILES or hard macrocycle', 'Check SMILES; raise <code>--conformer_max_iterations</code>'],
                ['JSON error', 'Syntax, backslashes, bad characters', '<code>python3 -m json.tool file.json</code>; use the builder'],
                ['Output folder has a date suffix', 'Same job name as an earlier run', 'Expected. Rename jobs or use <code>--force_output_dir=true</code> deliberately'],
                ['Run vanished when I closed my laptop', 'Not in tmux', 'Always use tmux'],
                ['Cannot delete old output', 'Files owned by root', 'Ask the administrator']
              ]),
              p('The full flag list is always available from the program itself:'),
              code('docker run --rm alphafold3 python run_alphafold.py --help | less', 'on Woody (q to quit)'),
              h('Terms of use'),
              p('Every output folder contains <code>TERMS_OF_USE.md</code>. AF3\'s model parameters have their own terms; read it before publishing anything. Check with the group before sharing outputs externally.')
            ]
          },
          {
            id: 'cheatsheet', title: 'Cheat sheet and final quiz', blocks: [
              p('Use the <strong>Print page</strong> button in the sidebar to print or save this page as a PDF.'),
              h('One-page recipe'),
              ol_steps(['Log in, <code>tmux new -s af3</code>, <code>nvidia-smi</code> to find an idle GPU.', 'Build the JSON, save in <code>~/af3/input</code>, validate with <code>python3 -m json.tool</code>.', 'Generate the command; set <code>device=N</code> and the file name; run.', 'Wait. Results appear in <code>~/af3/output/&lt;name&gt;/</code>.', 'Read <code>summary_confidences.json</code>: clash, ptm, iptm, ranking_score.', 'Open <code>_model.cif</code> in a viewer coloured by confidence; look at PAE.', 'Compare to a control; add seeds before believing it.']),
              code(DOCKER_BASE, 'the baseline command'),
              h('Final quiz'),
              quiz('Which file do you pass as input for an inference-only (stage 2) run?', ['The original JSON', 'The _data.json written by stage 1', 'The .cif model'], 1, 'Only _data.json contains the MSA and templates stage 2 needs.'),
              quiz('You want a stable estimate of a macrocycle\'s binding pose. Which is the best plan?', ['One seed, one sample, as fast as possible', 'Several seeds and more samples, compared against a control compound', 'Skip the MSA'], 1, 'Flexible ligands need sampling breadth, and a control puts the numbers in context.'),
              quiz('A job fails with out-of-memory on a large complex. First thing to try?', ['--gpus all', 'Enable the unified-memory environment variables', 'Raise num_recycles'], 1, 'Unified memory lets the GPU spill into system RAM, at some cost in speed.'),
              quiz('What does iptm = null mean?', ['The run crashed', 'There is only one chain, so there is no interface to score', 'The ligand was ignored'], 1, 'No interface exists to be scored, so AF3 reports null.'),
              check('You are ready when', ['I can log in and find an idle GPU', 'I can build, validate and save an input JSON', 'I can launch a run inside tmux', 'I can explain what each command line does', 'I can pick the settings for a specific experiment', 'I can judge a result using scores and PAE and know what it cannot tell me'])
            ]
          }
        ]
      }
    ]
  });

  function ol_steps(items) { return { t: 'list', ordered: true, items: items }; }
})();
