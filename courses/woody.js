/* Using Woody: the shared-server basics course.
 * Ported from the handbook's Woody Guide Vol. 1 (documentation/woody-guide-vol1.html), minus the AlphaFold3
 * and docking sections (covered by their own courses) and the administrator appendix (not for a public course).
 * Machine facts (64 threads, 503 GiB, 632 G / 3.7 T / 73 T volumes, Python 3.6.8, Lmod modules, tmux/screen,
 * Rocky Linux 8) were re-checked on Woody on 2026-10-20. */
(function () {
  'use strict';
  var p = function (html) { return { t: 'p', html: html }; };
  var h = function (text, id) { return { t: 'h', text: text, id: id }; };
  var ul = function (items, ordered) { return { t: 'list', items: items, ordered: !!ordered }; };
  var code = function (text, label) { return { t: 'code', text: text, label: label }; };
  var co = function (kind, label, html) { return { t: 'callout', kind: kind, label: label, html: html }; };
  var table = function (head, rows) { return { t: 'table', head: head, rows: rows }; };
  var check = function (title, items) { return { t: 'check', title: title, items: items }; };
  var quiz = function (q, opts, answer, why) { return { t: 'quiz', q: q, opts: opts, answer: answer, why: why }; };
  var os = function (o) { o.t = 'os'; return o; };
  var ol = function (items) { return { t: 'list', items: items, ordered: true }; };

  var HOST = 'woody.chem.gla.ac.uk';

  Hub.register({
    id: 'woody',
    title: 'Using Woody',
    tag: 'Start here',
    minutes: 90,
    blurb: 'Connect to the group server, find your way around the Linux terminal, put files in the right place, move them to and from your own computer, and run long jobs without upsetting anyone. Start here before any software course.',
    modules: [

      /* ============ 1. START HERE ============ */
      {
        id: 'intro', title: 'Module 1: What Woody is', lessons: [
          {
            id: 'what-is-woody', title: 'What Woody is (and is not)', blocks: [
              p('Woody is the group\'s dedicated Linux workstation for computational chemistry: docking, co-folding and virtual screening at real scale. This course takes you from "I have never used a terminal" to "I can run my own work responsibly".'),
              table(['', 'Woody'], [
                ['Operating system', 'Rocky Linux 8'],
                ['Processor', '64 threads (32 cores)'],
                ['Memory', '503 GiB RAM'],
                ['Graphics cards', '4 &times; NVIDIA RTX A5500, 24 GB each'],
                ['Access', 'Over SSH only. There is no monitor, mouse or desktop attached']
              ]),
              h('What it is'),
              ul(['A shared machine the whole group depends on. Your session uses the same 64 threads, 503 GiB and 4 GPUs as everyone else\'s.', 'Where your files, environments and running programs live. Your laptop is only a window onto it.']),
              h('What it is not'),
              ul(['<strong>Not your laptop.</strong> Files you see on Woody are not on your computer, and the reverse.', '<strong>Not a cluster with a queue.</strong> There is no job scheduler (no SLURM, no PBS). Nothing stops two people grabbing the same GPU except courtesy.', '<strong>Not unlimited, and not backed up automatically.</strong> Treat <code>/scratch</code> as working space, not an archive.', '<strong>Not a sandbox.</strong> There is no undo for a mistyped <code>rm -rf</code>, and the system Python is shared infrastructure that other people\'s software depends on.']),
              co('summary', 'The one idea to keep', '<p>Woody is a shared scientific instrument, not a personal computer. Everything you do (the space you use, the jobs you run, the mess you leave) affects the next person who logs in.</p>'),
              h('Four habits of a good Woody citizen'),
              ol(['<strong>Use resources responsibly.</strong> Check what is free before you claim it, especially GPUs.', '<strong>Keep things organised.</strong> A predictable project layout means you and your successors can find things in six months.', '<strong>Make work reproducible.</strong> An environment and a README beat a folder of scripts only you understand.', '<strong>Leave it in a good state.</strong> Clean up scratch, do not touch other people\'s files, and do not hold four GPUs overnight for a job that needed one.']),
              check('Checkpoint', ['I can explain why Woody is not my laptop', 'I know there is no job queue, so courtesy matters', 'I can name the four habits']),
              quiz('Your colleague has a job on every GPU. There is no scheduler. What do you do?', ['Start yours anyway: the machine will sort it out', 'Check what is free, and ask in the group chat before launching', 'Kill their job'], 1, 'With no scheduler enforcing fairness, checking and asking is the whole system. Never stop a job you do not own.')
            ]
          }
        ]
      },

      /* ============ 2. GETTING CONNECTED ============ */
      {
        id: 'connect', title: 'Module 2: Getting connected', lessons: [
          {
            id: 'access', title: 'What you need before you start', blocks: [
              p('Ask your supervisor or the person who administers Woody for:'),
              ul(['<strong>An account:</strong> a username and an initial password (or key).', '<strong>The address:</strong> <code>' + HOST + '</code>.', '<strong>Membership of the <code>docker</code> group</strong>, if you will run AlphaFold3 or other containerised software. Without it Docker refuses to start.']),
              co('note', 'Off campus', '<p>Woody can only be reached from the <strong>University wifi</strong> or through the <strong>Cisco VPN</strong>. At home or on a mobile network, connect to the VPN first, then follow the steps in this course. If a connection simply times out, this is almost always the reason.</p>'),
              h('Two tools, two jobs'),
              ul(['A <strong>terminal</strong> for typing commands on Woody.', 'A <strong>file-transfer tool</strong> for moving files between your computer and Woody.']),
              p('Which ones you use depends on your computer. Choose your operating system in Settings (the cog at the bottom of the sidebar), or with the switch above any OS-specific steps. The rest of this course follows it.'),
              check('Checkpoint', ['I have a username and password', 'I know the address, ' + HOST, 'I am on University wifi, or I have the Cisco VPN connected'])
            ]
          },
          {
            id: 'connecting', title: 'Connecting for the first time', blocks: [
              p('Your laptop is only a window onto Woody. Nothing you run through the connection uses your laptop\'s processor, memory or graphics card: it all happens on Woody.'),
              os({
                win: [
                  table(['Job', 'Tool'], [['Terminal', '<strong>Windows Terminal</strong> or <strong>PowerShell</strong>. Windows 10 and 11 already include <code>ssh</code>. Press the Start key, type <code>powershell</code>, press Enter.'], ['File transfer', '<strong>WinSCP</strong> (free).'], ['Optional', 'Git Bash or Ubuntu (WSL) also work if you already use them.']]),
                  code('ssh [[your-username]]@' + HOST, 'in PowerShell, on your own computer')
                ],
                mac: [
                  table(['Job', 'Tool'], [['Terminal', '<strong>Terminal</strong>. Press Cmd+Space, type <code>Terminal</code>, press Enter. <code>ssh</code> is built in.'], ['File transfer', '<strong>Cyberduck</strong> (free), or <code>rsync</code> in Terminal.']]),
                  code('ssh [[your-username]]@' + HOST, 'in Terminal, on your own computer')
                ],
                linux: [
                  table(['Job', 'Tool'], [['Terminal', 'Any terminal (often Ctrl+Alt+T). <code>ssh</code> and <code>rsync</code> are normally installed.'], ['File transfer', 'Your file manager (<em>Connect to Server</em>, <code>sftp://</code>), or <code>rsync</code>.']]),
                  code('ssh [[your-username]]@' + HOST, 'in a terminal, on your own computer')
                ]
              }),
              p('Replace the highlighted part with your username. The first time you connect, you will be asked about the server\'s <strong>fingerprint</strong>. This is normal: type <code>yes</code> and press Enter. You will only see it once per computer. Then type your password. Nothing appears while you type it; that is normal too.'),
              p('When it works you will see a prompt like this:'),
              code('[you@woody ~]$', 'what success looks like'),
              p('The <code>$</code> means Woody is waiting for a command. <code>~</code> means you are in your home folder.'),
              h('Graphical programs (optional)'),
              p('If you want a graphical program running on Woody, for example a molecular viewer, to show its window on your screen, add <code>-X -Y</code> to the command. You do not need this for anything in the software courses, where you copy results to your own computer and view them there.'),
              code('ssh -X -Y [[your-username]]@' + HOST, 'on your own computer'),
              os({
                win: [p('On Windows you also need an X server running on your computer (for example VcXsrv or MobaXterm) before graphical windows can appear. Skip this unless you really need it.')],
                mac: [p('On a Mac you need XQuartz installed before graphical windows can appear. Skip this unless you really need it.')],
                linux: [p('On Linux this normally works as soon as you add the flags, if you are running a desktop session.')]
              }),
              co('mistake', 'Common mistakes', '<ul><li>Forgetting <code>-X -Y</code> and then wondering why a graphical viewer will not open (only matters if you want one).</li><li>Retyping the full command every time instead of setting up a shortcut (next lesson).</li><li>Assuming files you see on Woody are also on your laptop. They are not (see Module 4).</li></ul>'),
              check('Checkpoint', ['I logged in and saw a prompt ending in $', 'I know how to leave: type exit', 'I can connect again without looking anything up']),
              quiz('You see <code>[you@woody ~]$</code>. Where are you?', ['On my own laptop', 'On Woody, in my home folder', 'Inside a container'], 1, 'The word after @ is the machine. The ~ is your home folder.')
            ]
          },
          {
            id: 'shortcut', title: 'Make a shortcut: just type "woody"', blocks: [
              p('Typing the whole command every session gets old. Set up a shortcut once and just type <code>ssh woody</code>.'),
              h('Option A: an SSH config file (recommended)'),
              os({
                win: [
                  p('In PowerShell, create the folder and open the file in Notepad:'),
                  code('mkdir $HOME\\.ssh -Force\nnotepad $HOME\\.ssh\\config', 'in PowerShell, on your own computer'),
                  p('If Notepad offers to create the file, say yes. Paste the block below, save, and close. Make sure Notepad did not add <code>.txt</code> to the end of the name; if it did, rename the file to plain <code>config</code>.')
                ],
                mac: [
                  code('mkdir -p ~/.ssh\nnano ~/.ssh/config', 'in Terminal, on your own computer'),
                  p('Paste the block below, then save with Ctrl+O, Enter, and exit with Ctrl+X.')
                ],
                linux: [
                  code('mkdir -p ~/.ssh\nnano ~/.ssh/config', 'in a terminal, on your own computer'),
                  p('Paste the block below, then save with Ctrl+O, Enter, and exit with Ctrl+X.')
                ]
              }),
              code('Host woody\n    HostName ' + HOST + '\n    User [[your_username]]', 'the contents of the config file'),
              p('Now <code>ssh woody</code> works from any terminal on that computer. If you want graphical windows every time, add two more lines inside the block:'),
              code('    ForwardX11 yes\n    ForwardX11Trusted yes', 'optional, same file'),
              os({
                mac: [
                  h('Option B: a shell alias'),
                  p('If you prefer an alias, add this line to <code>~/.zshrc</code> (a Mac\'s default shell is zsh), then open a new Terminal window:'),
                  code('alias woody="ssh [[your_username]]@' + HOST + '"', 'in ~/.zshrc')
                ],
                linux: [
                  h('Option B: a shell alias'),
                  p('If you prefer an alias, add this line to <code>~/.bashrc</code>, then run <code>source ~/.bashrc</code> or open a new terminal:'),
                  code('alias woody="ssh [[your_username]]@' + HOST + '"', 'in ~/.bashrc')
                ],
                win: [p('On Windows the config file above is the simplest route, so use that.')]
              }),
              check('Checkpoint', ['I created the config file', 'ssh woody connects me', 'I did not paste my password anywhere'])
            ]
          },
          {
            id: 'first-ten', title: 'Your first ten minutes', blocks: [
              p('If you only do one thing after logging in, do this. Seven commands: look around, check what is free, make a folder.'),
              code('pwd                          # where am I?\nls                           # what is here?\nnvidia-smi                   # are the GPUs free?\ndf -h                        # how full is the storage?\nmkdir my_first_project       # make a folder that is yours\ncd my_first_project          # step into it\npwd                          # confirm you are in the right place', 'on Woody'),
              p('Everything else in this course is detail on top of these lines. Here is what you should see:'),
              ul(['<code>pwd</code> prints something like <code>/home/yourname</code>.', '<code>nvidia-smi</code> prints a table with four GPUs. Each row shows memory used out of 24 GB.', '<code>df -h</code> lists the disks. You will meet them properly in Module 4.', 'After <code>cd</code>, <code>pwd</code> ends in <code>my_first_project</code>.']),
              check('Checkpoint', ['I ran all seven commands', 'I can see four GPUs in the nvidia-smi table', 'I made and entered a folder']),
              quiz('You ran <code>cd my_first_project</code> then <code>pwd</code>. What does it print?', ['/home/yourname/my_first_project', '/scratch', 'Nothing'], 0, 'pwd prints your current location. The folder was made inside your home, so that is where you are now.')
            ]
          }
        ]
      },

      /* ============ 3. LINUX SURVIVAL ============ */
      {
        id: 'linux', title: 'Module 3: Linux survival', lessons: [
          {
            id: 'navigate', title: 'Moving around and handling files', blocks: [
              p('This is not a Linux course. It is the twenty or so commands that cover nearly everything you will do day to day. Try each one as you read.'),
              h('Navigation'),
              table(['Command', 'What it does'], [
                ['<code>pwd</code>', 'Print the working directory: where am I right now?'],
                ['<code>ls</code>', 'List files here. <code>ls -la</code> shows hidden files and details.'],
                ['<code>cd folder</code>', 'Move into <code>folder</code>.'],
                ['<code>cd ..</code>', 'Move up one level.'],
                ['<code>cd ~</code> or just <code>cd</code>', 'Jump home, from anywhere.'],
                ['<code>cd -</code>', 'Jump back to where you just were.']
              ]),
              h('Files and folders'),
              table(['Command', 'What it does'], [
                ['<code>mkdir name</code>', 'Create a folder. <code>mkdir -p a/b/c</code> makes the whole path.'],
                ['<code>cp a b</code>', 'Copy file <code>a</code> to <code>b</code>. Add <code>-r</code> for a whole folder.'],
                ['<code>mv a b</code>', 'Move or rename <code>a</code> to <code>b</code>.'],
                ['<code>rm file</code>', 'Delete a file. Add <code>-r</code> for a folder. <strong>There is no recycle bin.</strong>']
              ]),
              h('Looking inside files'),
              table(['Command', 'What it does'], [
                ['<code>cat file</code>', 'Print the whole file to the screen.'],
                ['<code>less file</code>', 'Scroll through a file. Press <code>q</code> to quit.'],
                ['<code>head -n 20 file</code>', 'Show the first 20 lines. <code>tail</code> shows the last.'],
                ['<code>grep pattern file</code>', 'Search for text inside a file.'],
                ['<code>find . -name "*.pdb"</code>', 'Search for files by name, starting from here.']
              ]),
              h('Try it'),
              code('cd ~\nmkdir -p practice/inputs\ncd practice\nls\ncp /etc/hostname inputs/\ncat inputs/hostname\ncd ..\npwd', 'on Woody'),
              check('Checkpoint', ['I moved up and down with cd', 'I made a folder with mkdir -p', 'I copied a file and read it with cat']),
              quiz('Which command takes you back to your home folder from anywhere?', ['cd ..', 'cd ~', 'ls ~'], 1, '<code>cd ~</code> (or plain <code>cd</code>) always goes home.')
            ]
          },
          {
            id: 'paths-help', title: 'Paths, editing, and getting unstuck', blocks: [
              h('Absolute and relative paths'),
              p('An <strong>absolute path</strong> starts from the root and works from anywhere, for example <code>/scratch/yourname/run1</code>. A <strong>relative path</strong> starts from where you are, for example <code>../results/run1</code>. When in doubt, run <code>pwd</code> to check where "here" actually is.'),
              h('Editing a text file'),
              p('<code>nano</code> is the friendliest editor on Woody. The shortcuts are listed along the bottom of the screen; <code>^</code> means Ctrl.'),
              code('nano notes.txt', 'on Woody'),
              ul(['Type your text.', 'Save: <kbd>Ctrl</kbd>+<kbd>O</kbd>, then Enter.', 'Exit: <kbd>Ctrl</kbd>+<kbd>X</kbd>.']),
              h('Recalling commands'),
              ul(['Press the <strong>up arrow</strong> to bring back previous commands.', 'Press <kbd>Tab</kbd> to complete file and folder names. Use it constantly: it prevents typos.', 'Type <code>history</code> for a list, or press <kbd>Ctrl</kbd>+<kbd>R</kbd> and start typing to search it.']),
              h('Permissions in one paragraph'),
              p('<code>ls -l</code> shows something like <code>-rwxr-xr-x</code>: read, write and execute rights for the owner, the group, and everyone else. You will rarely change these. The main time you will is to make your own script runnable:'),
              code('chmod +x my_script.sh', 'on Woody'),
              h('Getting help'),
              code('man ls          # the manual page (q to quit)\nls --help       # a quick summary', 'on Woody'),
              h('How to get out of things'),
              table(['You are stuck in', 'Press'], [
                ['<code>top</code> or <code>less</code>', '<kbd>q</kbd>'],
                ['<code>nano</code>', '<kbd>Ctrl</kbd>+<kbd>X</kbd>, then answer the prompt'],
                ['<code>vim</code>', '<kbd>Esc</kbd>, then type <code>:q!</code> and Enter'],
                ['A running command', '<kbd>Ctrl</kbd>+<kbd>C</kbd>'],
                ['A tmux session', 'Detach with <kbd>Ctrl</kbd>+<kbd>B</kbd>, then <kbd>D</kbd> (see Module 6)']
              ]),
              co('safety', 'Be careful with rm', '<ul><li><code>rm -rf</code> deletes permanently, with no confirmation and no undo. Check the path before you press Enter.</li><li>Wildcards are powerful. <code>rm *</code> in the wrong folder deletes everything in it. Run <code>pwd</code> first.</li><li>Linux is case-sensitive: <code>Results/</code> and <code>results/</code> are different folders.</li></ul>'),
              check('Checkpoint', ['I edited and saved a file with nano', 'I used Tab to complete a name', 'I know how to quit less, top and nano']),
              quiz('You opened a file with <code>less</code> and the prompt has vanished. How do you get back?', ['Ctrl+C then reboot', 'Press q', 'Close the window'], 1, '<code>q</code> quits less. Closing the window works too, but <code>q</code> is cleaner.')
            ]
          }
        ]
      },

      /* ============ 4. FILES AND PROJECTS ============ */
      {
        id: 'files', title: 'Module 4: Files and projects', lessons: [
          {
            id: 'storage', title: 'Where to put things: home, scratch, data', blocks: [
              p('Your laptop and Woody are two separate computers. Files do not move between them automatically, and once a file is on Woody you have to choose the right place for it.'),
              table(['Location', 'Size', 'Use it for'], [
                ['<code>/home</code>', '632 GB', 'Your scripts, environments and small personal files. Think of it as your desk, not your warehouse.'],
                ['<code>/scratch</code>', '3.7 TB', 'Active calculations, docking runs, and temporary output. Working space, not an archive: clean up when a run is done.'],
                ['<code>/data</code>', '73 TB', 'Large shared datasets and results worth keeping: ligand libraries, reference structures, finished results.']
              ]),
              co('note', 'Why three places?', '<p>A single virtual screen of tens of thousands of compounds can generate far more temporary output (poses, logs, intermediate files) than <code>/home</code> is built to hold. That is why <code>/scratch</code> exists, and why large source libraries belong in <code>/data</code> and not copied into your home folder.</p>'),
              h('See how full each one is'),
              code('df -h /home /scratch /data      # free space on each\ndu -sh ~/*                       # how big is each thing in my home?', 'on Woody'),
              p('Look at the <em>Use%</em> column before you start something big. At the time of writing, <code>/data</code> was already over 80% full, so tidiness matters there.'),
              co('practice', 'Rule of thumb', '<ul><li>Small scripts and environments: <code>/home</code>.</li><li>Active runs: <code>/scratch</code>.</li><li>Shared or large data, and results you want to keep: <code>/data</code>.</li><li><strong>Never let <code>/scratch</code> hold the only copy of a result you care about.</strong> Copy anything worth keeping to <code>/data</code> or off the machine. Nothing here is backed up automatically.</li></ul>'),
              check('Checkpoint', ['I ran df -h and understood the three locations', 'I know scratch is not an archive', 'I know where large shared data belongs']),
              quiz('You finished a big docking run and want to keep the best poses for a year. Where do they live?', ['Leave them in /scratch', 'Copy them to /data (and ideally off the machine)', '/home, whatever the size'], 1, 'Scratch is working space and is not backed up. Copy what matters to /data, and keep a copy elsewhere too.')
            ]
          },
          {
            id: 'transfer', title: 'Moving files to and from Woody', blocks: [
              p('Most of what you do here is uploading an input file and downloading a result. There are two ways: the <code>scp</code> command, which needs nothing installed, and a drag-and-drop program. Either works. Both use your normal Woody login, so you must be on University wifi or the Cisco VPN.'),
              h('Option 1: the scp command (nothing to install)'),
              p('<code>scp</code> copies files over the same secure connection as <code>ssh</code>. It is already on Windows 10 and 11 (in PowerShell or Windows Terminal), on Macs and on Linux. The pattern is always <code>scp  FROM  TO</code>, and the Woody end is written <code>username@' + HOST + ':path</code>. <strong>Run it in a terminal on your own computer, not inside your Woody session.</strong> It asks for your Woody password, just like <code>ssh</code>.'),
              os({
                win: [
                  code('# Upload one file from the folder you are in (your PC) to your Woody home folder\nscp ubiquitin_monomer.json [[your-username]]@' + HOST + ':~/af3/input/\n\n# Download one file from Woody into the folder you are in\nscp [[your-username]]@' + HOST + ':~/af3/output/[[job_name]]/[[job_name]]_model.cif .\n\n# Download a whole folder (-r means recursive)\nscp -r [[your-username]]@' + HOST + ':~/af3/output/[[job_name]] .', 'in PowerShell, on your own computer'),
                  p('First move PowerShell to the folder you want to work from, for example <code>cd $HOME\\Downloads</code>, so you can use short names. The <code>.</code> at the end of a download means &ldquo;put it here&rdquo;. If you do give a full Windows path, use quotes, for example <code>"C:\\Users\\you\\Documents\\input.json"</code>.')
                ],
                mac: [
                  code('# Upload one file from the folder you are in (your Mac) to your Woody home folder\nscp ubiquitin_monomer.json [[your-username]]@' + HOST + ':~/af3/input/\n\n# Download one file from Woody into the folder you are in\nscp [[your-username]]@' + HOST + ':~/af3/output/[[job_name]]/[[job_name]]_model.cif .\n\n# Download a whole folder (-r means recursive)\nscp -r [[your-username]]@' + HOST + ':~/af3/output/[[job_name]] ~/Downloads/', 'in Terminal, on your own computer'),
                  p('The <code>.</code> at the end of a download means &ldquo;put it here&rdquo;, in the folder your Terminal is in. Use <code>cd ~/Downloads</code> first if you want it there.')
                ],
                linux: [
                  code('# Upload one file from the folder you are in to your Woody home folder\nscp ubiquitin_monomer.json [[your-username]]@' + HOST + ':~/af3/input/\n\n# Download one file from Woody into the folder you are in\nscp [[your-username]]@' + HOST + ':~/af3/output/[[job_name]]/[[job_name]]_model.cif .\n\n# Download a whole folder (-r means recursive)\nscp -r [[your-username]]@' + HOST + ':~/af3/output/[[job_name]] ~/Downloads/', 'in a terminal, on your own computer'),
                  p('The <code>.</code> at the end of a download means &ldquo;put it here&rdquo;, in the folder your terminal is in.')
                ]
              }),
              p('If you set up the <code>woody</code> shortcut in Module 2, you can write it more briefly: <code>scp results.csv woody:~/af3/input/</code>.'),
              co('mistake', 'scp gotchas', '<ul><li><strong>Which computer am I on?</strong> If you type an <code>scp</code> command inside your Woody session, it tries to copy from Woody to Woody. Open a second terminal on your own computer.</li><li><strong>It overwrites without asking.</strong> If a file of the same name is already at the destination, it is replaced.</li><li><strong>A path with spaces needs quotes</strong> around it.</li><li><strong>It cannot resume.</strong> If a big transfer breaks, you start again. On Mac and Linux, <code>rsync</code> (below) can pick up where it stopped.</li></ul>'),
              co('note', 'Not yet tried on every system', '<p>The <code>scp</code> format is standard OpenSSH, but these exact examples have not been run from a Windows or Mac machine yet. If one behaves differently on yours, tell the course maintainer.</p>'),
              h('Option 2: a drag-and-drop program'),
              p('Prefer to drag and drop? Pick your operating system with the switch just below.'),
              os({
                win: [
                  h('WinSCP (drag and drop)'),
                  ol(['Open WinSCP and choose <strong>New Session</strong>. File protocol: <strong>SFTP</strong>. Host name: <code>' + HOST + '</code>. Port <strong>22</strong>. Your username.', 'Click <strong>Save</strong> and give the session a name such as <code>woody</code>.', 'Log in. The left pane is your PC and the right pane is Woody. Drag files between them.']),
                  p('Use <strong>Synchronize</strong> (Commands menu) to mirror a Woody folder to a folder on your PC and refresh it in one click.'),
                  p('WinSCP opens in your home folder. To go elsewhere, type the path (for example <code>/scratch/yourname</code>) into the address bar above the right pane.')
                ],
                mac: [
                  h('Cyberduck (drag and drop)'),
                  ol(['In Cyberduck choose <strong>Open Connection</strong>. Protocol: <strong>SFTP</strong>. Server: <code>' + HOST + '</code>. Port <strong>22</strong>. Your username.', 'Bookmark it to reconnect in one click.', 'Drag files between Cyberduck and Finder.']),
                  h('Or rsync in Terminal'),
                  p('<code>rsync</code> only copies what is new or changed, can resume an interrupted transfer, and is safe to repeat. Use it for folders and large files.'),
                  code('# Upload a folder to Woody\nrsync -avz [[local_folder]]/ [[your-username]]@' + HOST + ':[[/scratch/your-username/project/]]\n# Download a folder from Woody\nrsync -avz [[your-username]]@' + HOST + ':[[/scratch/your-username/results]] ~/Downloads/', 'in Terminal, on your own computer')
                ],
                linux: [
                  h('Your file manager'),
                  p('Most file managers have <em>Connect to Server</em>. Enter <code>sftp://your-username@' + HOST + '</code> and drag files in and out.'),
                  h('Or rsync in a terminal'),
                  p('<code>rsync</code> only copies what is new or changed, can resume an interrupted transfer, and is safe to repeat. Use it for folders and large files.'),
                  code('# Upload a folder to Woody\nrsync -avz [[local_folder]]/ [[your-username]]@' + HOST + ':[[/scratch/your-username/project/]]\n# Download a folder from Woody\nrsync -avz [[your-username]]@' + HOST + ':[[/scratch/your-username/results]] ~/Downloads/', 'in a terminal, on your own computer')
                ]
              }),
              co('mistake', 'rsync and the trailing slash', '<p>In <code>rsync</code>, <code>folder/</code> means "the contents of folder" and <code>folder</code> means "the folder itself". When the two go to different places, that one slash changes where your files end up. Try a small test folder first.</p>'),
              co('practice', 'Good practice', '<ul><li>Use <code>rsync</code> (or WinSCP Synchronize) instead of repeated one-off copies for large or growing folders.</li><li>Copy a result off Woody as soon as you have verified it.</li><li>Transfers run on your own computer, not on Woody. If a command asks for a password and nothing happens, check you did not type it on the wrong machine.</li></ul>'),
              check('Checkpoint', ['I uploaded a small file to Woody', 'I downloaded one back', 'I can see it in both places']),
              quiz('Where do you run the <code>rsync</code> upload command?', ['On Woody, in the terminal you logged into', 'On your own computer, in a local terminal', 'Either'], 1, 'Open a second terminal on your own computer. Inside the Woody session the files you want to send are not visible.')
            ]
          },
          {
            id: 'projects', title: 'Organising a project', blocks: [
              p('A consistent folder layout means you, and whoever inherits your project, can understand it in five minutes rather than an afternoon.'),
              code('my_project/\n├── README.md          what this project is and how to reproduce it\n├── input/             starting structures, ligand lists\n├── scripts/           your code\n├── environments/      conda definitions (see Module 5)\n├── runs/              raw run output (usually in /scratch)\n├── results/           processed output you keep\n└── analysis/          notebooks, figures, summaries', 'a good layout'),
              code('mkdir -p my_project/{input,scripts,environments,runs,results,analysis}\ncd my_project\nnano README.md', 'on Woody'),
              h('What goes in the README'),
              p('It does not need to be long. It should answer four questions:'),
              ul(['What is this project?', 'When did you start it?', 'What environment does it need?', 'How would someone reproduce your last result?']),
              h('Naming'),
              ul(['Use descriptive names with underscores: <code>2026-07_kinase_screen</code>, not <code>test2</code>.', 'Put the date first so folders sort in time order.', 'Keep raw run output in <code>/scratch</code>, and copy only what you have verified matters into <code>results/</code> in <code>/data</code>.']),
              co('mistake', 'Common mistakes', '<p>Folders called <code>final_v2_REAL_final</code>, and one-off scripts nobody documented, including you, in three months.</p>'),
              check('Checkpoint', ['I made a project folder with the standard sub-folders', 'I wrote a README with the four answers', 'My folder name has a date and a description'])
            ]
          }
        ]
      },

      /* ============ 5. SOFTWARE AND ENVIRONMENTS ============ */
      {
        id: 'software', title: 'Module 5: Software and environments', lessons: [
          {
            id: 'environments', title: 'Environments: never touch system Python', blocks: [
              p('Woody\'s system software is shared infrastructure. Keeping your own tools in your own isolated environment protects both your work and everyone else\'s.'),
              co('safety', 'Do not modify system Python', '<p>Woody\'s system Python is version <strong>3.6.8</strong>, and existing software (including cryo-EM tools) depends on it exactly as it is. <strong>Never</strong> use <code>sudo pip install</code>. Never install packages globally. If you think you need <code>sudo</code>, ask first.</p>'),
              h('Use conda environments instead'),
              p('A conda environment is your own private, disposable Python setup for one project. Install whatever you need without touching the system, and delete it when you are done. Conda is already available on Woody.'),
              code('conda --version                       # check conda is available\nconda create -n [[my_project_env]] python=3.10\nconda activate [[my_project_env]]\npython --version                      # now 3.10, not 3.6.8\nconda deactivate                      # leave the environment', 'on Woody'),
              p('Your prompt gains the environment name in brackets when it is active. Save a record of what is in it so the work can be reproduced:'),
              code('conda env export > environments/[[my_project_env]].yml', 'on Woody, from inside your project folder'),
              co('note', 'Which tool for which job', '<p>The AlphaFold3 course uses a Docker container, and the Boltz course uses a program with its own environment, so you do not need to build either yourself. Environments are for your own scripts and analysis. The <a href="#/python/py-why">Python for Chemists</a> course walks through making one and using it.</p>'),
              co('mistake', 'Common mistakes', '<ul><li>A global <code>pip install</code> outside any environment.</li><li>Using <code>sudo</code> with <code>pip</code> or <code>conda</code>.</li><li>Installing into the <em>base</em> environment because nothing is active. Look at your prompt first.</li></ul>'),
              check('Checkpoint', ['I created and activated an environment', 'python --version inside it differs from the system version', 'I know why I never use sudo pip']),
              quiz('You need a new Python package for your analysis. What is the right way?', ['sudo pip install it', 'Activate your own conda environment and install it there', 'Edit the system Python'], 1, 'Your environment is yours to change. The system Python is shared by everyone, so it stays untouched.')
            ]
          },
          {
            id: 'modules', title: 'Shared modules (Lmod)', blocks: [
              p('Woody also uses <strong>Lmod</strong> for a small number of shared libraries. Modules are a secondary tool here: your own environments will do most of the work.'),
              code('module avail        # list what is available\nmodule load mpi/openmpi-x86_64\nmodule list         # what do I currently have loaded?\nmodule unload mpi/openmpi-x86_64', 'on Woody'),
              p('At the time of writing the module list is short: <code>mpi/openmpi-x86_64</code> and <code>pmi/pmix-x86_64</code>. Run <code>module avail</code> to see the current list.'),
              co('note', 'Where the other software is', '<p>Most scientific programs are not modules. Each has its own course or install note: see the AlphaFold3 and Boltz-2 courses in this hub.</p>'),
              quiz('What does <code>module avail</code> do?', ['Installs a module', 'Lists the modules you can load', 'Loads everything'], 1, 'It only lists. <code>module load</code> is what turns one on.')
            ]
          }
        ]
      },

      /* ============ 6. RUNNING THINGS RESPONSIBLY ============ */
      {
        id: 'running', title: 'Module 6: Running things responsibly', lessons: [
          {
            id: 'monitor', title: 'Checking what is free', blocks: [
              p('With four GPUs and 64 threads shared across the group, looking before you launch is basic courtesy. It also saves you from starting a job into resources that are already spoken for.'),
              table(['Command', 'What it shows'], [
                ['<code>nvidia-smi</code>', 'GPU use and memory, one row per card.'],
                ['<code>top</code>', 'Live CPU and memory by process. Press <code>q</code> to exit.'],
                ['<code>free -h</code>', 'Total, used and free RAM.'],
                ['<code>df -h</code>', 'Free space on each disk (<code>/home</code>, <code>/scratch</code>, <code>/data</code>).'],
                ['<code>du -sh folder</code>', 'The total size of one folder: useful for finding what is eating space.'],
                ['<code>docker ps</code>', 'Which containers (for example AlphaFold3 runs) are running, and for how long.']
              ]),
              co('note', 'htop is not installed', '<p>You may see <code>htop</code> recommended elsewhere. On Woody use <code>top</code>.</p>'),
              co('mistake', 'A GPU full of memory is not necessarily busy', '<p>Some programs, AlphaFold3 among them, reserve a GPU\'s memory as soon as they start, even while still doing CPU work at 0% utilisation. A card showing 23 GB used and 0% utilisation is probably <em>about to be used</em>, not free. Check <code>docker ps</code> and ask the group if you are unsure. Choose a card showing only a few hundred MiB.</p>'),
              co('practice', 'Before launching anything large', '<p>Run <code>nvidia-smi</code>, <code>free -h</code> and <code>df -h</code>. If every GPU is near full, your job will fail or slow everyone down. Check first, or ask in the group chat.</p>'),
              check('Checkpoint', ['I can read the nvidia-smi table', 'I know how much RAM and disk are free', 'I can see which containers are running']),
              quiz('GPU 1 shows 190 MiB used. GPU 2 shows 23 GB used and 0% utilisation. Which do you pick?', ['GPU 2: nothing is happening on it', 'GPU 1', 'Both, to go faster'], 1, 'GPU 2 is probably reserved by a job in its CPU stage. GPU 1 is free.')
            ]
          },
          {
            id: 'long-jobs', title: 'Long jobs: tmux, screen and nohup', blocks: [
              p('Woody has no job scheduler, so nothing protects your job automatically. If your SSH connection drops or you close the terminal, <strong>any job running in that session dies with it</strong>, unless you protect it.'),
              h('tmux (recommended)'),
              code('tmux new -s [[gpu2_screen_batch3]]      # start a named session\n# ...run your job here...\n# detach WITHOUT stopping it: Ctrl+B, release, then D\ntmux ls                                 # list sessions\ntmux attach -t [[gpu2_screen_batch3]]   # come back later, from anywhere', 'on Woody'),
              p('Your job keeps running after you detach, even after you close your laptop, because it belongs to the tmux session on Woody and not to your connection.'),
              co('note', 'Detaching: the usual stumbling block', '<p>Press <kbd>Ctrl</kbd>+<kbd>B</kbd>, <strong>let go of both keys</strong>, then press <kbd>D</kbd>. Pressing all three together is the usual reason it seems not to work. Do not press Ctrl+C or type <code>exit</code> inside the session unless you want the job to end.</p>'),
              h('Alternatives'),
              ul(['<strong>screen</strong> works similarly and is fine if you already know it.', '<strong>nohup</strong> is for a quick one-off. It survives a disconnect and writes output to <code>nohup.out</code>:']),
              code('nohup [[python my_script.py]] > run.log 2>&1 &', 'on Woody'),
              co('practice', 'Good practice', '<ul><li>Name sessions descriptively (<code>kinase_dock_gpu1</code>), never <code>test</code>.</li><li>Tell your labmates which GPU(s) you are using. A quick message goes a long way when nothing enforces fairness.</li><li>Check on your job. Do not leave forgotten work holding a GPU.</li></ul>'),
              h('A typical workflow'),
              p('The group\'s usual docking or co-folding project moves through the same stages. The software courses cover the middle steps.'),
              ul(['Protein (get and check the structure or sequence)', 'Preparation', 'Ligand library', 'Docking or co-folding (<a href="#/alphafold3/ubiquitin">AlphaFold3</a>, <a href="#/boltz/first-run">Boltz-2</a>)', 'Analysis', 'Experimental validation']),
              check('Checkpoint', ['I started a tmux session and detached with Ctrl+B then D', 'I listed it with tmux ls and re-attached', 'I know what happens to an unprotected job when I close the terminal']),
              quiz('You started a job inside tmux, then closed your laptop. What happens to it?', ['It stops', 'It carries on running on Woody', 'It pauses until you log back in'], 1, 'The job belongs to the tmux session on Woody, not to your connection.')
            ]
          },
          {
            id: 'troubleshoot', title: 'When something goes wrong', blocks: [
              table(['Symptom', 'Likely cause', 'Try this'], [
                ['<code>command not found</code>', 'A typo, or the environment or module is not loaded', 'Check the spelling; <code>module load</code> or <code>conda activate</code>'],
                ['<code>Permission denied</code>', 'Wrong directory, or the file belongs to someone else', '<code>ls -l</code>; confirm you are working in your own space'],
                ['Missing files', 'Wrong path, or cleaned from <code>/scratch</code>', '<code>find</code> to search; check whether it was ever copied to <code>/data</code>'],
                ['Frozen terminal', 'A long-running foreground process, or a dropped connection', 'Open a new session rather than force-closing. Do not kill jobs you do not recognise'],
                ['Storage full', 'Old runs left in <code>/scratch</code>', '<code>du -sh */</code> to find the culprit, then clean up your own'],
                ['Connection times out', 'Not on University wifi and the Cisco VPN is not connected, or wrong address', 'Join University wifi or connect the Cisco VPN, then check the address'],
                ['Job vanished on disconnect', 'Not in tmux', 'Always start long jobs in tmux']
              ]),
              h('A method for any problem'),
              ol(['Read the <strong>last 20 lines</strong> of the output, not the first. The error is nearly always at the end.', 'Check the basics: <code>pwd</code> (am I where I think I am?), <code>ls</code> (is the file there?), <code>nvidia-smi</code> and <code>df -h</code> (is anything full?).', 'Search the error text in the table above.', 'Still stuck? Send the person helping you the <strong>exact command you ran</strong> and the <strong>last 20 lines</strong>, as text. A screenshot of a cropped window is much harder to work from.']),
              co('safety', 'Never', '<ul><li>Kill a process or container you do not recognise.</li><li>Delete files you did not create.</li><li>Use <code>sudo</code> to get around a permission error. Ask first.</li></ul>'),
              quiz('Your command fails with a long error. Which part do you read first?', ['The first line', 'The last lines', 'Neither: just re-run it'], 1, 'Programs usually print the real error last, after a trail of context.')
            ]
          }
        ]
      },

      /* ============ 7. CHEAT SHEET ============ */
      {
        id: 'wrapup', title: 'Module 7: Cheat sheet', lessons: [
          {
            id: 'woody-cheatsheet', title: 'One-page cheat sheet', blocks: [
              p('Everything above, compressed. Print it from <strong>Settings</strong> (the cog, bottom left) and pin it above your desk.'),
              table(['Connect and transfer', ''], [
                ['<code>ssh woody</code>', 'connect (after setting up the shortcut)'],
                ['<code>scp file user@woody.chem.gla.ac.uk:path</code>', 'upload (run on your own computer; nothing to install)'],
                ['<code>scp [-r] user@woody.chem.gla.ac.uk:path .</code>', 'download a file or, with <code>-r</code>, a folder'],
                ['WinSCP / Cyberduck / <code>sftp://</code>', 'drag and drop files'],
                ['<code>rsync -avz src/ dest/</code>', 'sync folders (run on your own computer)']
              ]),
              table(['Navigation', ''], [
                ['<code>pwd</code>', 'where am I'],
                ['<code>ls -la</code>', 'list everything'],
                ['<code>cd</code> / <code>cd ..</code> / <code>cd ~</code> / <code>cd -</code>', 'move around']
              ]),
              table(['Files', ''], [
                ['<code>mkdir -p</code> / <code>cp -r</code> / <code>mv</code> / <code>rm</code>', 'make, copy, move, delete (no undo)'],
                ['<code>cat</code> / <code>less</code> / <code>head</code> / <code>tail</code> / <code>grep</code> / <code>find</code>', 'read and search'],
                ['<code>nano file</code>', 'edit (Ctrl+O save, Ctrl+X exit)']
              ]),
              table(['Check before you launch', ''], [
                ['<code>nvidia-smi</code>', 'GPU status'],
                ['<code>top</code>', 'CPU and processes'],
                ['<code>free -h</code>', 'RAM'],
                ['<code>df -h</code> / <code>du -sh</code>', 'disk space'],
                ['<code>docker ps</code>', 'running containers']
              ]),
              table(['Long jobs', ''], [
                ['<code>tmux new -s name</code>', 'start a session'],
                ['Ctrl+B, release, D', 'detach (job keeps running)'],
                ['<code>tmux ls</code> / <code>tmux attach -t name</code>', 'list / go back']
              ]),
              table(['Storage', ''], [
                ['<code>/home</code>', 'scripts and environments (632 GB)'],
                ['<code>/scratch</code>', 'active runs, not an archive (3.7 TB)'],
                ['<code>/data</code>', 'shared data and kept results (73 TB)']
              ]),
              table(['Getting out', ''], [
                ['<code>q</code>', 'top, less'],
                ['Ctrl+X', 'nano'],
                ['Ctrl+C', 'a running command']
              ]),
              h('Final check'),
              check('You are ready when', ['I can connect with one short command', 'I know where each kind of file belongs', 'I can move files both ways', 'I never use sudo or global pip', 'I check the GPUs before launching and run long jobs in tmux']),
              quiz('Which of these is the best first move before starting a big job?', ['Launch it and see', 'Check nvidia-smi, free -h and df -h', 'Ask for more disk'], 1, 'Looking before you launch is the habit that makes a shared machine work.'),
              p('Next: <a href="#/alphafold3/what-is-af3">AlphaFold3 on Woody</a> or <a href="#/boltz/before">Boltz-2 on Woody</a>.')
            ]
          }
        ]
      }
    ]
  });
})();
