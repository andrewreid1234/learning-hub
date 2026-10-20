# dist/

The generated, single-file build of the hub.

`learning-hub.html` is `../index.html` with `../hub.js` and every course script inlined, so the whole hub is one self-contained file of about 500 KB. It needs no other files and no network, and it works from a download, an email attachment or `file://`.

Use it when you need the hub as a single file, for example to send to someone or to vendor into another site such as the handbook. The live GitHub Pages site does not use it: Pages serves `../index.html` and the separate scripts directly.

**Do not edit it by hand.** It is overwritten every time you run:

```bash
python3 tools/bundle.py
```

Rebuild it and commit it after any change to `index.html`, `hub.js` or anything in `courses/`, so the file here always matches the source.
