# tools/

Scripts for building and testing the hub. None of them are needed to read the courses.

| File | What it does |
|---|---|
| `bundle.py` | Inlines `hub.js` and every course script into one self-contained file, `../dist/learning-hub.html`. Run `python3 tools/bundle.py` after any change. It works from any location because it finds the repository from its own path. |
| `extract_examples.py` | Regenerates `../courses/real-examples.js` from real AlphaFold3 outputs. It reads `~/af3/output/ffa4_monomer` and `~/af3/output/ffa4_tug891` on Woody, so it only runs there. It quantises the PAE matrix to one byte per value and averages pLDDT per residue to keep the file small. Only needed if the example runs change. |
| `check_python_examples.py` | Runs every code block of the Python course on Woody and compares the output with the lesson's "you should see" block. Needs the self-test results file and a Python with pandas and matplotlib; usage is in its docstring. |
| `selftest.html` | The browser test. It loads the engine and all courses, visits every lesson, and checks for JavaScript errors, unresolved widgets and leftover `[[` markers. It also tests the landing page and search, the operating-system switch, the widgets' presets and outputs, and profiles, Settings, themes and resets. Results are posted as JSON. |
| `serve_test.py` | A tiny local web server on `127.0.0.1:8765` that serves the repository and saves whatever `selftest.html` posts to a file. A headless browser cannot write files itself, so it reports through this. |

If you add a course, add its `<script>` tags to `selftest.html` as well as to `../index.html`, and update the lesson-count threshold in the test.

## Running the tests

You need a browser that can run headless. Firefox was used because Woody has no Node or Chromium. In one terminal:

```bash
python3 tools/serve_test.py /tmp/selftest.json
```

In another:

```bash
firefox --headless --profile "$(mktemp -d)" http://127.0.0.1:8765/tools/selftest.html
```

Wait about twenty seconds, then read the result and stop both programs with Ctrl+C:

```bash
python3 -c "import json; d = json.load(open('/tmp/selftest.json')); print('errors', d['errors'], 'lessons', d['lessons']); print([c for c in d['checks'] if c[0] != 'PASS'])"
```

A healthy run prints `errors []`, a lesson count (66 at the time of writing) and an empty list of failures.

## Gotchas

- Firefox caches scripts. If a check fails right after an edit, use a fresh `--profile` directory, as above.
- Do not stop the server with `pkill -f serve_test.py` from a shell whose own command line contains that text: it kills the shell too. Use Ctrl+C or kill the process by its id.
- The widgets that call into a program on Woody (for example the Boltz parser) were checked separately on Woody and are not part of this browser test.

Back to the [main README](../README.md).
