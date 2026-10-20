# courses/

The content of the Learning Hub. Each course is a plain JavaScript file that registers itself with the engine (`../hub.js`) by calling `Hub.register({...})`. Content is data: edit the text in these files and reload the page. There is no build step.

## Files

| File | What it is |
|---|---|
| `woody.js` | **Using Woody** (16 lessons, 7 modules). Connecting, the Linux terminal, files and storage, environments, tmux and etiquette. Ported from the handbook's Woody Guide, Volume 1. This is the simplest file to copy when writing a new course. |
| `alphafold3.js` | **AlphaFold3 on Woody** (21 lessons, 7 modules). Setting up a run, the input JSON, every parameter, docking-style experiments, viewing and reading results, troubleshooting. |
| `alphafold3-widgets.js` | The interactive tools used by the AlphaFold3 course: `jsonbuilder` (input JSON builder), `paramref` (parameter explorer, reused by other courses through `Hub.paramSets`), `cmdbuilder` (command builder with per-experiment recipes), `scorecalc` (ranking-score calculator), `resulttrainer` (results trainer) and `triage` (triage game), and `samplesdemo` (what more diffusion samples do, using real scores). |
| `boltz.js` | **Boltz-2 on Woody** (16 lessons, 7 modules). Includes MSA handling, affinity prediction, cyclic peptides and constraints. |
| `boltz-widgets.js` | The Boltz-2 tools: `boltzyaml` (YAML builder), `boltzcmd` (command and parameter builder) and `boltzscore` (confidence-score calculator). |
| `real-examples.js` | **Generated file. Do not edit by hand.** Real AlphaFold3 confidence data (PAE and per-residue pLDDT) for the FFA4 monomer and FFA4 with TUG-891, used by the results trainer. Produced by `../tools/extract_examples.py`. |

## Load order

The order of the `<script>` tags in `../index.html` matters. Widget files and `real-examples.js` must load before the course that uses them, and the order of the course files is the order of the course cards on the landing page. Using Woody comes first on purpose, as it is the course to take before any software course.

## Conventions

- Each course file starts with short helper functions (`p`, `h`, `code`, `co`, `check`, `quiz`, `os`, and so on) that build block objects. The block types are listed in the top-level README.
- In a `code` block, `[[like this]]` marks text the reader must replace. The highlighting is removed when they copy the block.
- Lesson ids must be unique within a course, and links between lessons use `#/<course-id>/<lesson-id>`. Renaming a lesson id breaks links to it from other courses, so search for the old id first.
- Use an `os` block wherever a step differs between Windows, Mac and Linux.
- Check every command, flag, path and number against the real install before writing it down, and say so in the lesson when something could not be checked.
- Only use published or constructed examples (ubiquitin, FFA4 with TUG-891). This repository is public, so no unpublished data.
- Machine-specific values (the Woody address, `/data/20260825_AndrewR_af3`, `/scratch/drewdog/boltz`) live in the lessons that use them. Search for them if Woody changes.
