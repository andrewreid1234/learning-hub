# Jamieson Lab Learning Hub

Interactive, hands-on courses for the software the Jamieson group uses on **Woody**, the group's shared Linux GPU server (School of Chemistry, University of Glasgow). The courses are written for complete beginners, with a skippable foundations section for experienced users. Everything in them is done by the learner, by hand, on their own terminal, so nothing needs an AI assistant or a maintainer to run.

**Live site:** https://andrewreid1234.github.io/learning-hub/

## Courses

| Course | Start here if | Lessons |
|---|---|---|
| **Using Woody** | You are new to Woody or to the Linux terminal. Take this first. | 16 |
| **Python for Chemists (part 1)** | You want to script and automate your work: environments, the basics, files, FASTA and CSV, tables and plots. Runs on Woody. Part 2 (RDKit, batch automation) is planned. | 13 |
| **AlphaFold3 on Woody** | You need to predict a structure or a protein-ligand complex. | 21 |
| **Boltz-2 on Woody** | You want a second predictor, or binding-affinity prediction. | 16 |

Using Woody covers connecting, the terminal, files and storage, environments, tmux and shared-machine etiquette. Python for Chemists teaches the Python needed for the rest, with real drugs and proteins, and ends by turning a FASTA file into a folder of AlphaFold3 input files. The AlphaFold3 and Boltz-2 courses cover setting up a run, every parameter and how to tune it per experiment, and reading the results. They include interactive tools: an input builder, a parameter explorer, a command builder, a confidence-score trainer using real FFA4 outputs, and a triage game.

Woody is reachable from the University wifi or through the Cisco VPN.

## Features

- **Windows / Mac / Linux.** Steps that run on the learner's own computer follow their operating system (WinSCP on Windows, Cyberduck or `rsync` on Mac, an `sftp://` file manager or `rsync` on Linux).
- **Checkpoints and quizzes** at the end of lessons, and a cheat sheet for each course.
- **Landing page** with course cards, progress, a "continue where you left off" button and lesson search.
- **Profiles and Settings** (the cog at the bottom left of the sidebar): a name keeps progress, operating system and theme separate for each person using a browser. Progress can be reset per course or in full, and exported or imported as a file.
- **Light and dark themes**, a phone-width layout, and print styles.
- **No build step, no dependencies, no network calls.** It is plain HTML, CSS and JavaScript, and works offline.

## Using it

**As a learner:** open the live site above, or open `index.html` from a download of this repository.

**Locally:** open `index.html` directly in a browser, or serve the folder with any static server, for example `python3 -m http.server` and then visit `http://localhost:8000`.

**As a single file:** `dist/learning-hub.html` is the whole hub in one self-contained file, for attaching to an email or vendoring into another site. Regenerate it with `python3 tools/bundle.py` after any change.

### Privacy and storage

Profiles and progress are stored in the browser's `localStorage` on that computer and are never sent anywhere. A profile is only a name: there are no accounts or passwords, and progress does not follow a person between browsers or computers unless they use Settings, then Export and Import. If browser storage is blocked, the hub still works but forgets progress when the page closes.

## Repository layout

```
learning-hub/
├── index.html            Page shell, styles, and the list of course scripts
├── hub.js                The engine: routing, rendering, profiles, search, settings
├── courses/              The course content and its interactive widgets
├── tools/                Build script, data generator, and headless browser tests
└── dist/                 The single-file build of the whole hub
```

Each folder has its own README:

- [`courses/`](courses/README.md): one file per course (content as data), a widgets file for courses that need interactive tools, and the real example data.
- [`tools/`](tools/README.md): `bundle.py`, `extract_examples.py`, and the self-test (`selftest.html`, `serve_test.py`).
- [`dist/`](dist/README.md): the generated `learning-hub.html`.

## How a course works

A course is a plain JavaScript object, passed to `Hub.register`:

```
course  { id, title, tag, minutes, blurb, modules: [...] }
module  { id, title, skippable, lessons: [...] }
lesson  { id, title, blocks: [...] }
```

A lesson is a list of blocks. The block types are:

| Block | Purpose |
|---|---|
| `h`, `sub`, `p`, `html`, `list` | Headings, paragraphs and lists |
| `code` | A copyable command. `[[like this]]` marks text the reader must replace; the markers are stripped when copied |
| `callout` | A highlighted box. Kinds: `summary`, `note`, `practice`, `mistake`, `safety`, `todo` |
| `table` | A table |
| `check` | A tickable checkpoint, saved per profile |
| `quiz` | A multiple-choice question with an explanation |
| `os` | Different blocks for Windows, Mac and Linux, chosen by the reader's setting |
| `widget` | An interactive tool registered with `Hub.widget` |

The course files define short helper functions (`p`, `code`, `co`, `check` and so on) that build these objects, so content reads close to prose. `courses/woody.js` is the simplest example to copy from.

## Adding a course

1. Create `courses/<name>.js` that calls `Hub.register({...})`.
2. If it needs interactive tools, put them in `courses/<name>-widgets.js` and register each with `Hub.widget(name, fn)`.
3. Add a `<script>` tag for each file between the `COURSES` markers in `index.html` and in `tools/selftest.html`. The order of the tags is the order of the course cards.
4. Run the tests (see below) and `python3 tools/bundle.py`.
5. Commit and push. GitHub Pages serves the repository root, so the change goes live with the push.

## Testing

The self-test loads every lesson of every course in headless Firefox, checks for JavaScript errors and unresolved widgets, and exercises the landing page, search, profiles, Settings, resets and the operating-system switch. See [`tools/README.md`](tools/README.md) for how to run it.

## Content standards

- **Commands are checked against the real install.** Paths, flags, defaults, timings and machine specifications in the courses were verified on Woody. Where something could not be checked, the lesson says so.
- **Real, published examples only.** The examples use ubiquitin and FFA4 with TUG-891. Do not add unpublished project data, sequences or structures to the courses: this repository is public.
- **Do not depend on an assistant.** A learner must be able to follow every lesson without one.

## Known gaps

- The ChimeraX and PyMOL commands in the AlphaFold3 viewing lesson were checked against the real output files but not run in the viewers.
- Boltz-2 is installed in a personal scratch folder on Woody. It has not been tested from a second account, and `/scratch` is not backed up.
- The courses have not yet had a cold read-through by a real newcomer.

## Maintenance

Paths such as `/data/20260825_AndrewR_af3` and `/scratch/drewdog/boltz`, and the address `woody.chem.gla.ac.uk`, are specific to the group's server. If Woody changes, update them in the course files. The dated AlphaFold3 database path is the one most likely to move.

The courses also feed the [Jamieson Lab Handbook](https://github.com/andrewreid1234/Jamieson-Lab-Handbook), which links to the live site from Computation, then Software.

## Licence

No licence has been chosen yet. Until one is added, the contents are all rights reserved by the authors. Ask before reusing them outside the group. The AlphaFold3 model parameters have their own terms of use, which every AlphaFold3 output folder includes as `TERMS_OF_USE.md`.
