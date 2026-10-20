"""Run every code block in the Python course and check the output it promises.

selftest.html saves the Python course's code blocks into the results file (key "pyblocks"). This script writes each
"contents of NAME" block to a scratch folder, runs the .py ones with the interpreter you give it, and compares the
output with the "you should see" block that follows. Use an interpreter from an environment that has pandas and
matplotlib. Blocks that show terminal output as well as script output (for example a json.tool listing) are reported
as mismatches by design, so read the MISMATCH text before worrying.

    python3 tools/serve_test.py /tmp/selftest.json      (run selftest.html as described in tools/README.md)
    ~/.conda/envs/pychem/bin/python tools/check_python_examples.py ~/.conda/envs/pychem/bin/python /tmp/selftest.json
"""
import json, os, re, subprocess, shutil, sys, tempfile

PY = sys.argv[1]
RESULTS = sys.argv[2] if len(sys.argv) > 2 else '/tmp/selftest.json'
blocks = json.load(open(RESULTS))['pyblocks']
root = tempfile.mkdtemp(prefix='pycheck_')
modules = {'py-setup': ['py-why', 'py-env', 'py-run'],
           'py-basics': ['py-values', 'py-collections', 'py-control', 'py-functions', 'py-errors'],
           'py-data': ['py-files', 'py-json', 'py-pandas', 'py-plot', 'py-cheat']}
group = lambda lid: next(m for m, ls in modules.items() if lid in ls)
last, ok, bad, ran = None, 0, 0, 0
for lid, label, text, literal in blocks:
    lid = lid.split('/')[-1]
    wd = os.path.join(root, group(lid))
    os.makedirs(wd, exist_ok=True)
    m = re.match(r'contents of ([\w.]+)', label)
    if m:
        fn = m.group(1)
        open(os.path.join(wd, fn), 'w').write(text + '\n')
        if fn.endswith('.py'):
            r = subprocess.run([PY, fn], cwd=wd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
            ran += 1
            last = (lid, fn, r.stdout.rstrip('\n'))
            if r.returncode:
                print('RUN FAIL', lid, fn, r.stderr[-300:])
                bad += 1
        continue
    if label == 'you should see' and last and last[0] == lid:
        if text.rstrip('\n') == last[2]:
            ok += 1
        else:
            bad += 1
            print('MISMATCH', lid, last[1], '\nEXPECTED:\n' + text.rstrip('\n'), '\nGOT:\n' + last[2])
        last = None
print('scripts run', ran, '| outputs matched', ok, '| problems', bad)
shutil.rmtree(root, ignore_errors=True)
