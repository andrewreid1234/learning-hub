/* Python for Chemists, part 1: set-up, the basics, and files and data. Everything runs on Woody.
 * Every code block and every "you should see" output in this file was run in a fresh conda environment on Woody
 * (python 3.10, pandas, matplotlib) on 2026-10-20. Compounds are well-known drugs and the sequences are ubiquitin,
 * the GB1 domain and the villin headpiece. The "inhibition" numbers in the practice table are invented and say so.
 * Planned later modules (not written yet): RDKit, batch automation of AlphaFold3 / Boltz jobs. */
(function () {
  'use strict';
  var p = function (html) { return { t: 'p', html: html }; };
  var h = function (text, id) { return { t: 'h', text: text, id: id }; };
  var ul = function (items, ordered) { return { t: 'list', items: items, ordered: !!ordered }; };
  var ol = function (items) { return { t: 'list', items: items, ordered: true }; };
  var code = function (text, label) { return { t: 'code', text: text, label: label }; };
  /* code that contains real [[ ]] (pandas), so the swap highlighting must stay off */
  var lit = function (text, label) { return { t: 'code', text: text, label: label, literal: true }; };
  var co = function (kind, label, html) { return { t: 'callout', kind: kind, label: label, html: html }; };
  var table = function (head, rows) { return { t: 'table', head: head, rows: rows }; };
  var check = function (title, items) { return { t: 'check', title: title, items: items }; };
  var quiz = function (q, opts, answer, why) { return { t: 'quiz', q: q, opts: opts, answer: answer, why: why }; };
  /* a try-it-yourself exercise with a click-to-reveal answer */
  var ex = function (question, answerHtml) {
    return { t: 'html', html: '<div class="card"><h4>Try it yourself</h4><p style="margin-top:0">' + question + '</p><details><summary>Show a possible answer</summary>' + answerHtml + '</details></div>' };
  };

  var UBQ = 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG';
  var CSV = 'name,smiles,mw,heavy_atoms,inhibition_pct\n' +
    'aspirin,CC(=O)Oc1ccccc1C(=O)O,180.16,13,22.5\n' +
    'caffeine,Cn1cnc2c1c(=O)n(C)c(=O)n2C,194.19,14,8.0\n' +
    'ibuprofen,CC(C)Cc1ccc(cc1)C(C)C(=O)O,206.28,15,61.0\n' +
    'paracetamol,CC(=O)Nc1ccc(O)cc1,151.16,11,15.5\n' +
    'naproxen,COc1ccc2cc(ccc2c1)C(C)C(=O)O,230.26,17,74.0';
  var FASTA = '>ubiquitin\n' + UBQ + '\n>GB1\nMTYKLILNGKTLKGETTTEAVDAATAEKVFKQYANDNGVDGEWTYDDATKTFTVTE\n>villin_HP35\nLSDEDFKAVFGMTRSAFANLPLWKQQNLKKEKGLF';

  Hub.register({
    id: 'python',
    title: 'Python for Chemists (part 1)',
    tag: 'Foundations',
    minutes: 180,
    blurb: 'Learn the Python you actually need on Woody: set up your own environment, write and run scripts, read error messages, and work with sequence files and compound tables. Examples use real drugs and proteins. Later parts will add RDKit and batch automation.',
    modules: [

      /* ============ 1. SET-UP ============ */
      {
        id: 'py-setup', title: 'Module 1: Getting set up', lessons: [
          {
            id: 'py-why', title: 'Why Python, and how we use it here', blocks: [
              p('Python is a general-purpose language that scientists use to automate repetitive work, process data and glue other programs together. It reads close to English, and you do not need to be a programmer to get a lot out of it.'),
              h('What you will be able to do after this part'),
              ul(['Run a Python script on Woody, and read the error when it fails.', 'Handle text, numbers, lists and tables of compounds and sequences.', 'Read and write files, including FASTA and CSV.', 'Turn a list of sequences into a folder of AlphaFold3 input files with one command, instead of building each by hand.']),
              p('A later part will add <strong>RDKit</strong> (working with molecules themselves) and automating batches of AlphaFold3 and Boltz-2 jobs. This part builds the foundations they need.'),
              h('How we will work'),
              ul(['Everything runs on <strong>Woody</strong>, in the terminal, so the code runs where the data and the software are. You do not install Python on your own computer for this course.', 'You will <strong>type</strong> the code, not just paste it. Typing is how it sticks, and the course gives you the expected output so you can check yourself.', 'You will write small <strong>scripts</strong>: text files ending in <code>.py</code> that you run. This is what you will use for real work, and it is repeatable, unlike typing into a prompt and losing it.']),
              co('summary', 'You need the Woody basics first', '<p>This course assumes you can log in, move around with <code>cd</code> and <code>ls</code>, and edit a file with <code>nano</code>. If not, do <a href="#/woody/what-is-woody"><strong>Using Woody</strong></a> first. It takes about an hour and a half.</p>'),
              co('safety', 'The one rule', '<p>Woody\'s built-in Python is version 3.6.8, and other software depends on it. <strong>Never install packages into it, and never use <code>sudo pip</code>.</strong> The next lesson shows how to have your own Python instead.</p>'),
              check('Checkpoint', ['I can log in to Woody and use cd, ls and nano', 'I know the built-in Python must not be changed']),
              quiz('Where does the Python code in this course run?', ['On my own laptop', 'On Woody, in the terminal', 'In my web browser'], 1, 'Everything runs on Woody, where the data and the scientific software live.')
            ]
          },
          {
            id: 'py-env', title: 'Your own Python environment', blocks: [
              p('A <strong>conda environment</strong> is your own private copy of Python plus whatever packages you choose, kept in your home folder. You can install, upgrade and delete things in it without affecting anyone else or the system. Conda is already installed on Woody.'),
              h('Create it'),
              code('conda --version                                   # check conda is there (you should see a version number)\nconda create -n pychem python=3.10 pandas matplotlib', 'on Woody'),
              p('Conda lists what it will install and asks <code>Proceed ([y]/n)?</code>. Type <code>y</code> and press Enter. When we tested this on Woody it took about half a minute. <code>pychem</code> is the environment\'s name; you can choose another, but then use it everywhere below.'),
              h('Switch it on'),
              code('conda activate pychem', 'on Woody'),
              p('Your prompt now starts with the environment name, so you can see it is active:'),
              code('(pychem) [you@woody ~]$', 'what the prompt looks like'),
              code('python --version\nwhich python', 'on Woody, with the environment active'),
              p('You should see <code>Python 3.10.x</code> and a path that contains <code>.conda/envs/pychem</code>. Now see what happens without the environment:'),
              code('conda deactivate\npython3 --version', 'on Woody'),
              p('That prints <code>Python 3.6.8</code>: the system one you must not touch. Switch your environment back on with <code>conda activate pychem</code> before every Python session. <strong>If the prompt does not start with <code>(pychem)</code>, you are in the wrong Python.</strong>'),
              h('Everyday environment commands'),
              table(['Command', 'What it does'], [
                ['<code>conda env list</code>', 'Show all environments you can see. The active one has a star.'],
                ['<code>conda activate pychem</code>', 'Switch an environment on.'],
                ['<code>conda deactivate</code>', 'Switch it off and return to the system Python.'],
                ['<code>conda install -n pychem numpy</code>', 'Add a package to the environment called pychem.'],
                ['<code>conda env remove -n pychem</code>', 'Delete the whole environment. Nothing else is affected.']
              ]),
              co('note', 'Installing more later', '<p>Prefer <code>conda install</code>. If a package is not on conda, <code>pip install</code> is fine <strong>only while your environment is active</strong>, because it then goes into your environment and not the system. Never use <code>sudo</code>. If <code>conda activate</code> reports that conda is not set up for your shell, run <code>conda init bash</code>, log out, and log back in.</p>'),
              co('mistake', 'Common mistakes', '<ul><li>Forgetting to activate, then getting <code>ModuleNotFoundError: No module named \'pandas\'</code>. Check the prompt for <code>(pychem)</code>.</li><li>Installing packages with nothing active.</li><li>Making a new environment for every tiny script. One environment per project or topic is enough.</li></ul>'),
              check('Checkpoint', ['I created the pychem environment', 'My prompt starts with (pychem) after activating', 'python --version shows 3.10 inside it and python3 --version shows 3.6.8 outside it', 'I know how to delete an environment']),
              quiz('Your prompt does not start with <code>(pychem)</code> and you type <code>pip install pandas</code>. What is wrong?', ['Nothing: pip always installs to a safe place', 'The environment is not active, so it would install into the wrong Python', 'pandas is not available'], 1, 'Without the environment active you are in the system Python, which must not be changed. Activate first.')
            ]
          },
          {
            id: 'py-run', title: 'Running Python: the prompt and scripts', blocks: [
              p('There are two ways to run Python. Use the first to experiment and the second for real work. Start by making a folder for this course, and switch your environment on:'),
              code('mkdir -p ~/python-course\ncd ~/python-course\nconda activate pychem', 'on Woody'),
              h('1. The interactive prompt'),
              code('python', 'on Woody'),
              p('The prompt changes to <code>&gt;&gt;&gt;</code>. Type a line, press Enter, and Python answers straight away. Try these:'),
              code('2 + 2\nmw = 180.16\nmw * 2\n"CCO".count("C")\nexit()', 'at the >>> prompt, one line at a time'),
              p('You should see <code>4</code>, then nothing for the assignment, then <code>360.32</code>, then <code>2</code>. <code>exit()</code> (or <kbd>Ctrl</kbd>+<kbd>D</kbd>) returns you to the Woody prompt. The prompt is excellent for trying one idea. Its drawback: everything is lost when you leave.'),
              h('2. Scripts'),
              p('A <strong>script</strong> is a text file of Python lines. Create one with <code>nano</code>:'),
              code('nano hello.py', 'on Woody'),
              code('name = "aspirin"\nmw = 180.16\nprint("Compound:", name)\nprint("Molecular weight:", mw, "g/mol")', 'type this into nano, then Ctrl+O, Enter, Ctrl+X'),
              code('python hello.py', 'on Woody'),
              code('Compound: aspirin\nMolecular weight: 180.16 g/mol', 'you should see'),
              p('<code>print(...)</code> is how a script shows you something. In the prompt a value appears automatically, but in a script nothing appears unless you <code>print</code> it. Edit the file with <code>nano hello.py</code>, change the name or the number, and run it again. This is the loop you will use all the time: <strong>edit, save, run, read</strong>.'),
              h('A one-line shortcut'),
              code('python -c "print(2 + 2)"', 'on Woody'),
              co('note', 'Long-running scripts', '<p>A script that runs for more than a few minutes should be started inside <code>tmux</code>, so it survives you closing the window. See <a href="#/woody/long-jobs">Long jobs: tmux, screen and nohup</a>.</p>'),
              co('mistake', 'Common mistakes', '<ul><li>Typing <code>python hello.py</code> from the wrong folder. Run <code>pwd</code> and <code>ls</code> to check the file is where you are.</li><li>Typing Python code at the Woody <code>$</code> prompt, or terminal commands at the <code>&gt;&gt;&gt;</code> prompt. The prompt tells you which one you are talking to.</li><li>Saving the file but forgetting the <code>.py</code> ending, or typing curly quotes copied from a document.</li></ul>'),
              check('Checkpoint', ['I ran Python at the >>> prompt and left with exit()', 'I wrote hello.py with nano and ran it', 'I edited it and ran it again', 'I can tell the Woody prompt from the Python prompt']),
              quiz('You write <code>mw = 180.16</code> in a script and run it. Nothing is displayed. Why?', ['The script failed', 'A script only shows what you print', 'Python does not support decimals'], 1, 'The line worked: it stored the number. Add <code>print(mw)</code> to see it.')
            ]
          }
        ]
      },

      /* ============ 2. BASICS ============ */
      {
        id: 'py-basics', title: 'Module 2: The basics', lessons: [
          {
            id: 'py-values', title: 'Numbers, text and variables', blocks: [
              p('A <strong>variable</strong> is a name attached to a value. Python works out the type of a value for you: whole numbers are <code>int</code>, decimals are <code>float</code>, and text is <code>str</code> (a string). To the computer a SMILES string or a protein sequence is just text. Python knows nothing about chemistry yet.'),
              p('Make a script <code>basics1.py</code> with <code>nano</code> and run it as you did before:'),
              code('smiles = "CC(=O)Oc1ccccc1C(=O)O"\nprint(len(smiles))\nprint(smiles.count("c"))\nprint(smiles.upper())\n\nmw = 180.16\nmass_mg = 25.0\nmoles = mass_mg / 1000 / mw\nprint(moles)\nprint(f"{moles * 1e6:.1f} umol")\nprint(10 // 3, 10 % 3, 2 ** 10)\nprint(type(mw), type(smiles), type(25))', 'contents of basics1.py'),
              code('21\n6\nCC(=O)OC1CCCCC1C(=O)O\n0.00013876554174067497\n138.8 umol\n3 1 1024\n<class \'float\'> <class \'str\'> <class \'int\'>', 'you should see'),
              h('What each line showed you'),
              ul(['<code>len(smiles)</code> is the number of characters: 21. <code>.count("c")</code> counts how many times a character appears.', '<strong>Text methods</strong> such as <code>.upper()</code> change the characters. Look at the result: it made <code>CC(=O)OC1CCCCC1C(=O)O</code>. In SMILES a lower-case <code>c</code> means an aromatic carbon and an upper-case <code>C</code> means an aliphatic one, so the benzene ring has become cyclohexane. <strong>Python happily changed your molecule because it sees only letters.</strong> Always remember SMILES are case-sensitive.', '<code>/</code> divides and gives a decimal. <code>//</code> is whole-number division, <code>%</code> is the remainder, and <code>**</code> is a power.', 'An <strong>f-string</strong> (<code>f"..."</code>) puts values inside text. Anything in <code>{ }</code> is calculated, and <code>:.1f</code> means one decimal place.', '<code>1e6</code> is scientific notation for 1,000,000.']),
              h('Naming things'),
              ul(['Use lower case with underscores: <code>mass_mg</code>, <code>molecular_weight</code>. Names are case-sensitive: <code>MW</code> and <code>mw</code> are different.', 'Pick names that say what the value is, and include the unit when it is not obvious (<code>mass_mg</code>). Your future self will thank you.', 'A name cannot start with a digit or contain spaces or hyphens.']),
              ex('Caffeine has a molecular weight of 194.19. You weigh out 50 mg. How many micromoles is that? Write a script that prints the answer to one decimal place.', '<pre>mw = 194.19\nmass_mg = 50\numol = mass_mg / 1000 / mw * 1e6\nprint(f"{umol:.1f} umol")</pre><p>It prints <code>257.5 umol</code>.</p>'),
              check('Checkpoint', ['I ran basics1.py and got the same output', 'I can explain why .upper() broke the SMILES', 'I can use an f-string to print a number to a set number of decimals']),
              quiz('What does <code>10 % 3</code> give?', ['3', '1', '3.33'], 1, '<code>%</code> is the remainder: 10 divided by 3 is 3 with 1 left over.')
            ]
          },
          {
            id: 'py-collections', title: 'Lists and dictionaries', blocks: [
              p('Real work involves many values at once: a list of compounds, a table of weights. Python has two containers you will use constantly.'),
              ul(['A <strong>list</strong> holds items in order: <code>["aspirin", "caffeine"]</code>. You find an item by its position.', 'A <strong>dictionary</strong> (dict) holds pairs, a <em>key</em> and the <em>value</em> it points to: <code>{"aspirin": 180.16}</code>. You find a value by its key.']),
              p('Write <code>basics2.py</code>:'),
              code('ubq = "' + UBQ + '"\nprint(len(ubq))\nprint(ubq[:10])\nprint(ubq[-5:])\nprint(ubq[0])\nprint(ubq.count("K"))\n\ncompounds = ["aspirin", "caffeine", "ibuprofen", "paracetamol"]\nprint(compounds[0], compounds[-1], len(compounds))\ncompounds.append("naproxen")\nprint(compounds)\nprint("caffeine" in compounds)\n\nmw = {"aspirin": 180.16, "caffeine": 194.19, "ibuprofen": 206.28, "paracetamol": 151.16}\nprint(mw["caffeine"])\nmw["naproxen"] = 230.26\nprint(mw)\nprint(list(mw.keys()))', 'contents of basics2.py'),
              code('76\nMQIFVKTLTG\nRLRGG\nM\n7\naspirin paracetamol 4\n[\'aspirin\', \'caffeine\', \'ibuprofen\', \'paracetamol\', \'naproxen\']\nTrue\n194.19\n{\'aspirin\': 180.16, \'caffeine\': 194.19, \'ibuprofen\': 206.28, \'paracetamol\': 151.16, \'naproxen\': 230.26}\n[\'aspirin\', \'caffeine\', \'ibuprofen\', \'paracetamol\', \'naproxen\']', 'you should see'),
              h('The things to remember'),
              ul(['<strong>Counting starts at 0.</strong> <code>compounds[0]</code> is the first item. This catches everyone out at first.', '<strong>Negative numbers count from the end.</strong> <code>[-1]</code> is the last item and <code>ubq[-5:]</code> is the last five letters.', '<strong>Slices</strong> use <code>[start:stop]</code>. The stop position is <em>not</em> included, so <code>ubq[:10]</code> is the first ten residues. Strings are sliced exactly like lists.', '<code>.append(x)</code> adds to the end of a list. <code>x in compounds</code> asks whether something is there.', 'Setting <code>mw["naproxen"] = ...</code> adds a new pair to a dict, or changes it if the key exists.', 'Asking a dict for a key it does not have is an error (a <code>KeyError</code>), which you will meet in the lesson on error messages.']),
              ex('Print the <strong>last ten residues</strong> of ubiquitin, and residues 11 to 20 (counting from 1).', '<pre>print(ubq[-10:])\nprint(ubq[10:20])</pre><p>The first prints <code>LHLVLRLRGG</code>. The second prints <code>KTITLEVEPS</code>. Residue 11 is position 10 because Python starts at 0.</p>'),
              check('Checkpoint', ['I ran basics2.py and matched the output', 'I know the first item is at position 0', 'I can slice a string and use negative positions', 'I can look up a value in a dict by its key']),
              quiz('<code>ubq[:10]</code> gives which residues?', ['Residues 1 to 10', 'Residues 1 to 11', 'Residues 2 to 10'], 0, 'A slice starts at position 0 and stops before position 10, giving exactly ten characters: residues 1 to 10.')
            ]
          },
          {
            id: 'py-control', title: 'Decisions and loops', blocks: [
              p('Two ideas turn a list of compounds into something useful: <strong>do this for each item</strong> (a loop) and <strong>only do this if</strong> a condition holds (an if). Python uses <strong>indentation</strong>, the spaces at the start of a line, to show what belongs inside. Use four spaces, and keep it consistent.'),
              code('mw = {"aspirin": 180.16, "caffeine": 194.19, "ibuprofen": 206.28, "paracetamol": 151.16, "naproxen": 230.26}\nfor name in mw:\n    print(name, mw[name])\nprint("---")\nfor name, weight in mw.items():\n    if weight < 200:\n        print(name, "is under 200")\n    elif weight < 225:\n        print(name, "is 200 to 225")\n    else:\n        print(name, "is 225 or more")\nprint("---")\nlight = [name for name, weight in mw.items() if weight < 200]\nprint(light)\ntotal = 0\nfor weight in mw.values():\n    total = total + weight\nprint(total / len(mw))\nfor i in range(3):\n    print("repeat", i)\ncount = 0\nwhile count < 3:\n    count += 1\nprint(count)', 'contents of control.py'),
              code('aspirin 180.16\ncaffeine 194.19\nibuprofen 206.28\nparacetamol 151.16\nnaproxen 230.26\n---\naspirin is under 200\ncaffeine is under 200\nibuprofen is 200 to 225\nparacetamol is under 200\nnaproxen is 225 or more\n---\n[\'aspirin\', \'caffeine\', \'paracetamol\']\n192.41\nrepeat 0\nrepeat 1\nrepeat 2\n3', 'you should see'),
              h('Reading it'),
              ul(['<code>for name in mw:</code> repeats the indented lines once per key. <code>.items()</code> gives the key and the value together, <code>.values()</code> gives just the values.', '<code>if</code> / <code>elif</code> / <code>else</code> pick one branch. The colon at the end of the line is required. Comparisons are <code>&lt;  &gt;  &lt;=  &gt;=  ==</code> (equal) and <code>!=</code> (not equal). <strong>A single <code>=</code> stores a value; <code>==</code> compares.</strong>', 'The line starting <code>light =</code> is a <strong>list comprehension</strong>: a one-line way to build a filtered list. Read it as &ldquo;the names, for each name and weight in the dict, if the weight is under 200&rdquo;.', '<code>range(3)</code> gives 0, 1, 2. A <code>while</code> loop repeats while its condition is true. Make sure something inside changes it, or it never stops (<kbd>Ctrl</kbd>+<kbd>C</kbd> will stop it).']),
              co('mistake', 'Indentation errors', '<p>If the lines inside a loop or an <code>if</code> are not indented, or are indented by different amounts, Python stops with an <code>IndentationError</code>. Use four spaces, never a mix of spaces and tabs. In <code>nano</code> pressing Tab inserts a tab, so type four spaces.</p>'),
              ex('From the <code>mw</code> dict, print the names of the compounds with a weight between 190 and 210.', '<pre>for name, weight in mw.items():\n    if 190 &lt; weight &lt; 210:\n        print(name)</pre><p>It prints <code>caffeine</code> and <code>ibuprofen</code>. Python allows a chained comparison such as <code>190 &lt; weight &lt; 210</code>.</p>'),
              check('Checkpoint', ['I ran control.py and matched the output', 'I know why the indentation matters', 'I can tell = from ==', 'I can write a loop with an if inside it']),
              quiz('Which line is correct?', ['if weight = 200:', 'if weight == 200:', 'if weight == 200'], 1, 'Comparison uses <code>==</code>, and the line must end with a colon.')
            ]
          },
          {
            id: 'py-functions', title: 'Functions', blocks: [
              p('A <strong>function</strong> is a named piece of code you can reuse. You have already used built-in ones: <code>print</code>, <code>len</code>, <code>type</code>. Writing your own stops you copying the same lines again and again, and gives a piece of logic a name you can read.'),
              code('RESIDUE_CHARGE = {"K": 1, "R": 1, "D": -1, "E": -1}\n\ndef count_residue(sequence, residue):\n    """Count how many times one amino acid appears."""\n    return sequence.count(residue)\n\ndef rough_charge(sequence):\n    """Crude net charge at pH 7: +1 for K and R, -1 for D and E. Ignores His and the termini."""\n    total = 0\n    for aa in sequence:\n        total += RESIDUE_CHARGE.get(aa, 0)\n    return total\n\nubq = "' + UBQ + '"\nprint(count_residue(ubq, "K"))\nprint(rough_charge(ubq))\nprint(rough_charge("GGGG"))\nprint(rough_charge(""))', 'contents of functions.py'),
              code('7\n0\n0\n0', 'you should see'),
              h('The anatomy of a function'),
              ul(['<code>def name(inputs):</code> starts it. The inputs are called <strong>parameters</strong>. The indented lines below are its body.', '<code>return</code> hands a value back to whoever called it. Without a <code>return</code>, a function gives back nothing.', 'The text in triple quotes straight after the first line is a <strong>docstring</strong>: a note saying what the function does. Always write one. Notice this one also says what the function ignores.', '<code>RESIDUE_CHARGE.get(aa, 0)</code> looks up a key but returns 0 if it is missing, so letters such as G do not cause an error.', 'A name in capitals, such as <code>RESIDUE_CHARGE</code>, is a convention for a value that is a fixed constant.']),
              co('note', 'Check your own results', '<p>Ubiquitin has 7 lysines (K), 4 arginines (R), 5 aspartates (D) and 6 glutamates (E), which is why the rough charge is 11 &minus; 11 = 0. This is a crude count that ignores histidine, the termini and the local environment, so treat it as an exercise and not a real pI calculation. Testing a function on an input where you already know the answer, like the empty string, is a good habit.</p>'),
              h('Default values'),
              p('A parameter can have a default so callers can leave it out: <code>def is_light(mw, limit=200):</code>. Calling <code>is_light(180)</code> uses 200, and <code>is_light(180, limit=150)</code> overrides it.'),
              ex('Write a function <code>micromoles(mass_mg, mw)</code> that returns the number of micromoles. Use it to print the answer for 50 mg of caffeine (194.19) and 25 mg of aspirin (180.16), rounded to one decimal place.', '<pre>def micromoles(mass_mg, mw):\n    """Micromoles in mass_mg milligrams of a compound of weight mw."""\n    return mass_mg / 1000 / mw * 1e6\n\nprint(round(micromoles(50, 194.19), 1))\nprint(round(micromoles(25, 180.16), 1))</pre><p>It prints <code>257.5</code> and <code>138.8</code>, matching the earlier lesson.</p>'),
              check('Checkpoint', ['I ran functions.py and matched the output', 'I can write a function with parameters and a return', 'I wrote a docstring', 'I tested a function on an input where I knew the answer']),
              quiz('A function has no <code>return</code> line. What does calling it give back?', ['The last value it calculated', 'Nothing useful (None)', 'An error'], 1, 'Without <code>return</code>, a function gives back <code>None</code>. Use <code>return</code> to hand a value to the caller.')
            ]
          },
          {
            id: 'py-errors', title: 'Reading error messages', blocks: [
              p('Errors are not failures: they are Python telling you exactly what is wrong. Beginners often stop at the red text. Experts <strong>read it from the bottom</strong>. The last line says what went wrong, and the lines above it say where.'),
              code('Traceback (most recent call last):\n  File "e.py", line 2, in <module>\n    print(mw["caffeine"])\nKeyError: \'caffeine\'', 'an example'),
              ul(['The <strong>last line</strong> is the error type and a message: <code>KeyError: \'caffeine\'</code>.', 'The lines above give the <strong>file and line number</strong> where it happened, and show that line.', 'Fix the first error first. Later ones are often just fallout.']),
              p('Here are the errors you will meet most. Each was produced on Woody by one line of code. (The exact wording changes a little between Python versions.)'),
              table(['You wrote', 'Python says', 'What it means'], [
                ['<code>print(mw)</code> before ever defining <code>mw</code>', '<code>NameError: name \'mw\' is not defined</code>', 'A misspelt name, or a variable you have not created yet (or created in another script).'],
                ['<code>mw["caffeine"]</code> when the key is not there', '<code>KeyError: \'caffeine\'</code>', 'The dict has no such key. Check spelling and capital letters.'],
                ['<code>"Mass is " + 180.16</code>', '<code>TypeError: can only concatenate str (not "float") to str</code>', 'You mixed text and a number. Use an f-string: <code>f"Mass is {mw}"</code>.'],
                ['a <code>for</code> line followed by an unindented line', '<code>IndentationError: expected an indented block after \'for\' statement on line 1</code>', 'The body of the loop must be indented.'],
                ['<code>print("hello)</code>', '<code>SyntaxError: unterminated string literal (detected at line 1)</code>', 'A missing closing quote. Look at the line, and the one before it.'],
                ['<code>compounds[5]</code> in a list of 2', '<code>IndexError: list index out of range</code>', 'The position does not exist. Remember counting starts at 0.'],
                ['<code>open("missing.csv")</code>', '<code>FileNotFoundError: [Errno 2] No such file or directory: \'missing.csv\'</code>', 'Wrong name, or you are in the wrong folder. Check with <code>pwd</code> and <code>ls</code>.'],
                ['<code>import padas</code> (a typo for pandas)', '<code>ModuleNotFoundError: No module named \'padas\'</code>', 'Misspelt, or the package is not installed in the active environment.'],
                ['<code>double()</code> with no input', '<code>TypeError: double() missing 1 required positional argument: \'x\'</code>', 'You forgot to give the function something it needs.']
              ]),
              h('A method for fixing an error'),
              ol(['Read the <strong>last line</strong>. What kind of error is it?', 'Look at the <strong>line number</strong> it points to. The mistake is on that line or just before it.', 'Check the usual suspects: spelling, capital letters, quotes, indentation, the colon at the end of the line, the right folder, the right environment.', 'Make <strong>one change</strong> and run it again.', 'Still stuck? Copy the whole error as <strong>text</strong>, not a screenshot, and send it with your script.']),
              co('practice', 'Make an error on purpose', '<p>Make a script with one line, <code>print(mw)</code>, and run it. Then change it to <code>mw = 180.16</code> above that line and run it again. Break things deliberately a few times: you will recognise the messages instantly when they are real.</p>'),
              check('Checkpoint', ['I read an error from the bottom up', 'I can tell a NameError from a KeyError from a TypeError', 'I made at least two errors on purpose and fixed them']),
              quiz('Your script stops with <code>KeyError: \'Caffeine\'</code> but your dict has <code>"caffeine"</code>. What is the cause?', ['A capital letter: dictionary keys are case-sensitive', 'The dict is empty', 'An indentation problem'], 0, 'Python treats <code>Caffeine</code> and <code>caffeine</code> as different keys.'),
              quiz('Which line of an error message should you read first?', ['The first line of the traceback', 'The last line', 'None of it'], 1, 'The last line names the error and its cause. The lines above show where it happened.')
            ]
          }
        ]
      },

      /* ============ 3. FILES AND DATA ============ */
      {
        id: 'py-data', title: 'Module 3: Files and data', lessons: [
          {
            id: 'py-files', title: 'Reading and writing files', blocks: [
              p('Real data lives in files. Here you will read a <strong>FASTA</strong> file of protein sequences, which is the format sequences usually arrive in. It is a text file where each record is a line starting with <code>&gt;</code> and a name, followed by the sequence. Make a folder and a file:'),
              code('mkdir -p ~/python-course/files\ncd ~/python-course/files\nnano proteins.fasta', 'on Woody'),
              code(FASTA, 'contents of proteins.fasta (ubiquitin, the GB1 domain and the villin headpiece)'),
              code('sequences = {}\nname = None\nwith open("proteins.fasta") as handle:\n    for line in handle:\n        line = line.strip()\n        if line.startswith(">"):\n            name = line[1:]\n            sequences[name] = ""\n        elif line:\n            sequences[name] += line\n\nfor name, seq in sequences.items():\n    print(name, len(seq))', 'contents of readfasta.py (save in the same folder and run: python readfasta.py)'),
              code('ubiquitin 76\nGB1 56\nvillin_HP35 35', 'you should see'),
              h('What the code does'),
              ul(['<code>with open("proteins.fasta") as handle:</code> opens the file and <strong>closes it for you</strong> when the indented block ends. Always use <code>with</code>.', '<code>for line in handle:</code> gives you one line at a time. <code>.strip()</code> removes the invisible newline at the end.', '<code>line.startswith(">")</code> spots a header. <code>line[1:]</code> is the line without its first character, which is the name.', 'Sequences can be split over several lines, so the code <strong>adds</strong> each piece (<code>+=</code>) to the current record.', 'The result is a dict of names to sequences, exactly the kind of thing you learned about earlier.']),
              h('Writing a file'),
              code('with open("summary.txt", "w") as out:\n    for name, seq in sequences.items():\n        out.write(f"{name}\\t{len(seq)}\\n")', 'add to readfasta.py, run it, then look at the file with cat summary.txt'),
              p('<code>"w"</code> means write, and it <strong>replaces</strong> the file if it exists. Use <code>"a"</code> to add to the end instead. <code>\\t</code> is a tab and <code>\\n</code> a new line.'),
              co('mistake', 'Paths and the working folder', '<p>A name like <code>"proteins.fasta"</code> is looked for in the folder you ran Python from, not where the script is saved. If you get <code>FileNotFoundError</code>, run <code>pwd</code> and <code>ls</code>. For files elsewhere, give the full path, for example <code>"/scratch/yourname/data/proteins.fasta"</code>.</p>'),
              ex('Change the loop so it also prints the <strong>name of the longest sequence</strong> at the end.', '<pre>longest = max(sequences, key=lambda n: len(sequences[n]))\nprint("Longest:", longest)</pre><p>It prints <code>Longest: ubiquitin</code>. <code>max</code> with a <code>key</code> picks the item that scores highest by the rule you give it.</p>'),
              check('Checkpoint', ['I made proteins.fasta and read it with Python', 'I got 76, 56 and 35', 'I wrote a file and looked at it with cat', 'I know why to use with open(...)']),
              quiz('What happens if you open an existing file with <code>"w"</code>?', ['The new lines are added to the end', 'The old contents are replaced', 'It is opened read-only'], 1, '<code>"w"</code> overwrites. Use <code>"a"</code> to append.')
            ]
          },
          {
            id: 'py-json', title: 'Project: making AlphaFold3 input files', blocks: [
              p('Now put it together. In the AlphaFold3 course you built an input JSON by hand. With a FASTA file and twelve lines of Python you can make one for <strong>every</strong> sequence at once. JSON is a text format for structured data, and Python has a built-in <code>json</code> module that reads and writes it, and it maps neatly onto the dicts and lists you already know.'),
              p('Work in the same folder as <code>proteins.fasta</code> and create <code>makejson.py</code>:'),
              code('import json\nfrom pathlib import Path\n\ndef read_fasta(path):\n    sequences = {}\n    name = None\n    with open(path) as handle:\n        for line in handle:\n            line = line.strip()\n            if line.startswith(">"):\n                name = line[1:]\n                sequences[name] = ""\n            elif line:\n                sequences[name] += line\n    return sequences\n\ndef af3_input(name, sequence, seeds=(1,)):\n    return {\n        "name": name,\n        "sequences": [{"protein": {"id": "A", "sequence": sequence}}],\n        "modelSeeds": list(seeds),\n        "dialect": "alphafold3",\n        "version": 4,\n    }\n\noutdir = Path("af3_input")\noutdir.mkdir(exist_ok=True)\nfor name, seq in read_fasta("proteins.fasta").items():\n    path = outdir / (name + ".json")\n    with open(path, "w") as handle:\n        json.dump(af3_input(name, seq), handle, indent=2)\n    print("wrote", path)', 'contents of makejson.py'),
              code('python makejson.py\nls af3_input\npython -m json.tool af3_input/GB1.json', 'on Woody'),
              code('wrote af3_input/ubiquitin.json\nwrote af3_input/GB1.json\nwrote af3_input/villin_HP35.json\nGB1.json  ubiquitin.json  villin_HP35.json\n{\n    "name": "GB1",\n    "sequences": [\n        {\n            "protein": {\n                "id": "A",\n                "sequence": "MTYKLILNGKTLKGETTTEAVDAATAEKVFKQYANDNGVDGEWTYDDATKTFTVTE"\n            }\n        }\n    ],\n    "modelSeeds": [\n        1\n    ],\n    "dialect": "alphafold3",\n    "version": 4\n}', 'you should see'),
              h('What is new here'),
              ul(['<code>def read_fasta(path)</code> is your earlier code wrapped in a <strong>function</strong>, so it can be reused. Moving working code into a function is how scripts grow safely.', '<code>af3_input(...)</code> builds a <strong>dict</strong> with the same fields as the AlphaFold3 input in the AlphaFold3 course. <code>seeds=(1,)</code> is a default value, so you can ask for more seeds by passing them.', '<code>Path("af3_input")</code> and the <code>/</code> operator build file paths in a way that works anywhere. <code>mkdir(exist_ok=True)</code> makes the folder if it is not there already.', '<code>json.dump(data, handle, indent=2)</code> writes the dict as tidy JSON. <code>python -m json.tool</code> re-reads it, which both proves it is valid and prints it neatly.']),
              co('note', 'Check it against the real format', '<p>The fields match the AlphaFold3 JSON used on Woody (<code>name</code>, <code>sequences</code>, <code>modelSeeds</code>, <code>dialect</code> and <code>version</code>). Optional extras, such as a <code>description</code> inside the protein entry, are left out. Copy one file into <code>~/af3/input</code> and use it exactly as in <a href="#/alphafold3/ubiquitin">Fold a protein, start to finish</a> to confirm it runs in your hands, and ask someone before you launch a long batch.</p>'),
              co('practice', 'Where this goes next', '<p>This is the seed of batch automation: the same pattern, with <strong>ligands</strong> read from a table, will make a screen of hundreds of jobs. A later part of this course will build that, using the staged runs from the AlphaFold3 course so the slow search is only done once.</p>'),
              ex('Change the script so every file asks for <strong>three seeds</strong>.', '<pre>json.dump(af3_input(name, seq, seeds=(1, 2, 3)), handle, indent=2)</pre><p>Open one file afterwards and you will see <code>"modelSeeds": [1, 2, 3]</code>.</p>'),
              check('Checkpoint', ['makejson.py ran and wrote three files', 'python -m json.tool prints a file without an error', 'I changed the number of seeds and saw it change in the output', 'I understand every line, or I know which I want to ask about']),
              quiz('Why use <code>python -m json.tool</code> on the file you just wrote?', ['It makes the file smaller', 'It re-reads the file, proving it is valid JSON, and prints it neatly', 'It runs AlphaFold3'], 1, 'If the JSON were broken it would report an error instead of printing.')
            ]
          },
          {
            id: 'py-pandas', title: 'Tables with pandas', blocks: [
              p('Chemists live in tables: compounds, measurements, results. <strong>pandas</strong> is the standard Python tool for them. Its main object is a <strong>DataFrame</strong>, which is a table whose columns have names. You installed pandas in the first lesson.'),
              p('Make a folder and a CSV file (comma-separated values):'),
              code('mkdir -p ~/python-course/tables\ncd ~/python-course/tables\nnano compounds.csv', 'on Woody'),
              code(CSV, 'contents of compounds.csv'),
              co('note', 'The numbers in the last column are invented', '<p>The compounds and their weights are real, well-known drugs. The <code>inhibition_pct</code> column is made-up practice data and means nothing about these drugs. It is there so you have a number to filter and sort.</p>'),
              lit('import pandas as pd\n\ndf = pd.read_csv("compounds.csv")\nprint(df[["name", "mw", "heavy_atoms", "inhibition_pct"]])\nprint(df.shape)\nprint(df.columns.tolist())\nprint(df["mw"].mean())\nprint(df["mw"].max())', 'contents of pd1.py'),
              code('          name      mw  heavy_atoms  inhibition_pct\n0      aspirin  180.16           13            22.5\n1     caffeine  194.19           14             8.0\n2    ibuprofen  206.28           15            61.0\n3  paracetamol  151.16           11            15.5\n4     naproxen  230.26           17            74.0\n(5, 5)\n[\'name\', \'smiles\', \'mw\', \'heavy_atoms\', \'inhibition_pct\']\n192.41\n230.26', 'you should see'),
              ul(['<code>pd.read_csv</code> loads the file. <code>df.shape</code> is (rows, columns).', '<code>df["mw"]</code> picks out one column. Methods such as <code>.mean()</code> and <code>.max()</code> work on a whole column at once, with no loop.', 'To print only some columns, give a <strong>list</strong> of names inside the brackets: <code>df[["name", "mw"]]</code>. Printing the whole table can hide columns behind <code>...</code> if it is wide, which is why this script chooses columns.']),
              h('Filtering, sorting and new columns'),
              lit('import pandas as pd\n\ndf = pd.read_csv("compounds.csv")\nsmall = df[df["mw"] < 200]\nprint(small[["name", "mw"]])\nprint()\nranked = df.sort_values("inhibition_pct", ascending=False)\nprint(ranked[["name", "inhibition_pct"]])\nprint()\ndf["mw_per_heavy_atom"] = (df["mw"] / df["heavy_atoms"]).round(2)\nprint(df[["name", "mw_per_heavy_atom"]])\nactive = df[df["inhibition_pct"] > 50]\nactive.to_csv("actives.csv", index=False)\nprint("saved", len(active), "rows")', 'contents of pd2.py'),
              code('          name      mw\n0      aspirin  180.16\n1     caffeine  194.19\n3  paracetamol  151.16\n\n          name  inhibition_pct\n4     naproxen            74.0\n2    ibuprofen            61.0\n0      aspirin            22.5\n3  paracetamol            15.5\n1     caffeine             8.0\n\n          name  mw_per_heavy_atom\n0      aspirin              13.86\n1     caffeine              13.87\n2    ibuprofen              13.75\n3  paracetamol              13.74\n4     naproxen              13.54\nsaved 2 rows', 'you should see'),
              ul(['<code>df[df["mw"] &lt; 200]</code> keeps the rows where the test is true. Read it as &ldquo;the table, where mw is under 200&rdquo;.', '<code>sort_values</code> orders the rows. <code>ascending=False</code> puts the biggest first.', 'Assigning to a new column name (<code>df["mw_per_heavy_atom"] = ...</code>) adds a column calculated for every row at once.', '<code>to_csv(..., index=False)</code> saves a table. <code>index=False</code> stops pandas adding a column of row numbers. Check the result with <code>cat actives.csv</code>.']),
              co('mistake', 'Common mistakes', '<ul><li>Combining two tests needs brackets and <code>&amp;</code> (and) or <code>|</code> (or): <code>df[(df["mw"] &lt; 210) &amp; (df["inhibition_pct"] &gt; 20)]</code>. Plain <code>and</code> does not work.</li><li>Misspelt column names cause a <code>KeyError</code>. Print <code>df.columns.tolist()</code> to see the exact names.</li><li>The original CSV is <strong>not</strong> changed by anything you do to the DataFrame unless you save it.</li></ul>'),
              ex('Show the names, weights and inhibition of compounds with inhibition above 20 <strong>and</strong> a weight below 210.', '<pre>hits = df[(df["inhibition_pct"] &gt; 20) &amp; (df["mw"] &lt; 210)]\nprint(hits[["name", "mw", "inhibition_pct"]])</pre><p>This gives aspirin (180.16, 22.5) and ibuprofen (206.28, 61.0).</p>'),
              check('Checkpoint', ['I loaded a CSV into a DataFrame', 'I filtered, sorted and added a column', 'I saved a filtered table and checked it with cat', 'I know what the brackets and & are for when combining tests']),
              quiz('<code>df[df["mw"] &lt; 200]</code> returns&hellip;', ['The weights under 200 as a plain list', 'The rows of the table where mw is under 200', 'The number of rows under 200'], 1, 'A true/false test inside the brackets selects those rows of the whole table.')
            ]
          },
          {
            id: 'py-plot', title: 'Your first plot', blocks: [
              p('A plot is the quickest way to see what your numbers are doing. <strong>matplotlib</strong> draws it. Woody has no screen, so instead of opening a window you <strong>save the plot as an image</strong> and copy that to your computer. The two lines about <code>Agg</code> below tell matplotlib not to look for a screen.'),
              code('import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\nimport pandas as pd\n\ndf = pd.read_csv("compounds.csv")\nfig, ax = plt.subplots(figsize=(5, 4))\nax.scatter(df["mw"], df["inhibition_pct"])\nfor _, row in df.iterrows():\n    ax.annotate(row["name"], (row["mw"], row["inhibition_pct"]), textcoords="offset points", xytext=(5, 5))\nax.set_xlabel("Molecular weight (g/mol)")\nax.set_ylabel("Inhibition (%)")\nax.set_title("Practice data (invented)")\nfig.tight_layout()\nfig.savefig("mw_vs_inhibition.png", dpi=150)\nprint("saved mw_vs_inhibition.png")', 'contents of plot1.py (in the folder with compounds.csv)'),
              code('python plot1.py\nls -l mw_vs_inhibition.png', 'on Woody'),
              p('You should see <code>saved mw_vs_inhibition.png</code> and a file of a few tens of kilobytes. Now copy it to your own computer to look at it. The <code>scp</code> method in <a href="#/woody/transfer">Moving files to and from Woody</a> is the quickest:'),
              code('scp [[your-username]]@woody.chem.gla.ac.uk:~/python-course/tables/mw_vs_inhibition.png .', 'on your own computer, not on Woody'),
              ul(['<code>ax.scatter(x, y)</code> draws the points. <code>ax.annotate</code> writes each compound\'s name beside its point.', 'Always label the axes with their <strong>units</strong> and give the plot a title. A plot without units is a decoration.', '<code>dpi=150</code> is sharp enough for a slide. Use 300 for print.', 'Change one thing and re-run: the title, the size, a colour with <code>color="tomato"</code> inside <code>scatter</code>. Plots are learnt by tweaking.']),
              co('mistake', 'Common mistakes', '<ul><li>Leaving out <code>matplotlib.use("Agg")</code> on a server with no screen. Depending on the setup it may fail with a display error.</li><li>Calling <code>plt.show()</code> on Woody. There is nothing to show it on. Save the file instead.</li><li>Presenting invented practice data as a result. Replace it with your own before using the plot anywhere.</li></ul>'),
              check('Checkpoint', ['I made the plot and saved a PNG on Woody', 'I copied it to my own computer and opened it', 'I changed something about it and re-ran the script']),
              quiz('Why save a plot as an image on Woody rather than showing it?', ['Woody has no screen to show it on', 'Showing plots is not possible in Python', 'Images are always faster'], 0, 'The server has no display, so you save the picture and copy it to a computer that does.')
            ]
          },
          {
            id: 'py-cheat', title: 'Review: cheat sheet and mini-project', blocks: [
              p('Part 1 ends with a one-page summary and a small project that uses everything.'),
              h('Cheat sheet'),
              table(['Setting up', ''], [
                ['<code>conda create -n pychem python=3.10 pandas matplotlib</code>', 'make your environment (once)'],
                ['<code>conda activate pychem</code> / <code>conda deactivate</code>', 'switch it on and off. Check the prompt for (pychem)'],
                ['<code>python script.py</code>', 'run a script. <code>python</code> alone gives the &gt;&gt;&gt; prompt']
              ]),
              table(['Values and containers', ''], [
                ['<code>x = 5</code>, <code>"text"</code>, <code>3.14</code>', 'int, str, float. <code>f"{x:.1f}"</code> formats numbers'],
                ['<code>items[0]</code>, <code>items[-1]</code>, <code>items[:10]</code>', 'first, last, first ten (counting starts at 0)'],
                ['<code>{"a": 1}</code> and <code>d["a"]</code>', 'dict: look up by key. <code>.items()</code> gives pairs']
              ]),
              table(['Control and functions', ''], [
                ['<code>for x in items:</code> and <code>if x &lt; 5:</code>', 'repeat and decide. Indent four spaces. <code>=</code> stores, <code>==</code> compares'],
                ['<code>[x for x in items if x &lt; 5]</code>', 'filter in one line'],
                ['<code>def name(a, b=1):</code> ... <code>return</code>', 'a reusable function with a docstring']
              ]),
              table(['Files and data', ''], [
                ['<code>with open("f") as h:</code>', 'read a file safely. <code>"w"</code> writes, <code>"a"</code> appends'],
                ['<code>json.dump(d, h, indent=2)</code>', 'write a dict as JSON. Check with <code>python -m json.tool</code>'],
                ['<code>pd.read_csv</code>, <code>df[df["c"] &gt; 5]</code>, <code>.sort_values</code>, <code>.to_csv(index=False)</code>', 'load, filter, sort, save tables'],
                ['<code>fig.savefig("p.png", dpi=150)</code>', 'save a plot (use matplotlib.use("Agg"))']
              ]),
              table(['When it breaks', ''], [
                ['Read the <strong>last line</strong> of the error first', 'then the line number it names'],
                ['NameError, KeyError, TypeError, IndentationError', 'spelling, case, mixed types, indent'],
                ['<code>ModuleNotFoundError</code>', 'is the environment active?']
              ]),
              h('Mini-project'),
              p('Combine the lessons into one script, <code>report.py</code>, that works on <code>compounds.csv</code> from the pandas lesson:'),
              ol(['Read the table with pandas.', 'Write a function <code>lipinski_weight_ok(mw)</code> that returns <code>True</code> when the weight is 500 or less. (This is only one of the usual rule-of-five checks, and a rough guide to drug-likeness for ordinary small molecules. It is <em>not</em> a rule for macrocycles or peptides.)', 'Add a column to the table that uses the function.', 'Keep only the rows where the inhibition is above 20, sort them from highest to lowest, and save them to <code>report.csv</code>.', 'Print how many compounds you started with and how many you kept.']),
              p('<details><summary>Show a possible answer</summary><pre>import pandas as pd\n\ndef lipinski_weight_ok(mw):\n    """True if the weight is 500 or less (one rule-of-five check only)."""\n    return mw &lt;= 500\n\ndf = pd.read_csv("compounds.csv")\ndf["weight_ok"] = df["mw"].apply(lipinski_weight_ok)\nkept = df[df["inhibition_pct"] &gt; 20].sort_values("inhibition_pct", ascending=False)\nkept.to_csv("report.csv", index=False)\nprint("started with", len(df), "kept", len(kept))</pre><p>It prints <code>started with 5 kept 3</code>, and <code>report.csv</code> holds naproxen, ibuprofen and aspirin in that order.</p></details></p>'),
              co('note', 'What comes next', '<p>Part 2 is planned to cover <strong>RDKit</strong>, working with real molecules (properties, substructure search, drawing), and then <strong>automating batches</strong> of AlphaFold3 and Boltz-2 jobs from a compound table. Neither is written yet.</p>'),
              check('You are ready for part 2 when', ['I can set up and activate my own environment', 'I can write and run a script, and read its errors', 'I can read a FASTA file and a CSV table', 'I can filter, sort and save a table', 'I made the mini-project work']),
              quiz('Which statement about the mini-project check <code>mw &lt;= 500</code> is true?', ['It proves a compound is a good drug', 'It is a rough guide for ordinary small molecules and does not apply to macrocycles or peptides', 'It works for every kind of molecule'], 1, 'Rule-of-five style filters were designed for ordinary small-molecule drugs. Macrocycles and peptides, which the group often works on, break them by design.')
            ]
          }
        ]
      }
    ]
  });
})();
