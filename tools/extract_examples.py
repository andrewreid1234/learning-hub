"""Pack real AF3 confidence outputs (FFA4 monomer, FFA4+TUG-891) into a JS data file
for the Results trainer. PAE is quantised to uint8 (value*8, cap 31.875 A) and base64'd."""
import json, base64, sys, os
OUT = os.path.expanduser('~/af3/output')
def load(name):
    c = json.load(open(f'{OUT}/{name}/{name}_confidences.json'))
    s = json.load(open(f'{OUT}/{name}/{name}_summary_confidences.json'))
    pae = c['pae']; n = len(pae)
    raw = bytes(min(255, int(round(v * 8))) for row in pae for v in row)
    # per-residue pLDDT for protein chain: mean of atoms by token? use atom arrays w/ chain ids
    pl = c['atom_plddts']; ac = c['atom_chain_ids']
    # map atoms -> residues of chain A via the mmCIF (label_seq_id), then average
    cols, rows = [], []
    for line in open(f'{OUT}/{name}/{name}_model.cif'):
        if line.startswith('_atom_site.'): cols.append(line.strip()[11:])
        elif line.startswith(('ATOM', 'HETATM')): rows.append(line.split())
    ci, si = cols.index('label_asym_id'), cols.index('label_seq_id')
    assert len(rows) == len(pl), (len(rows), len(pl))
    per = {}
    for r, p in zip(rows, pl):
        if r[ci] == 'A': per.setdefault(int(r[si]), []).append(p)
    prot = [round(sum(v) / len(v), 1) for k, v in sorted(per.items())]
    lig = [round(p, 1) for p, ch in zip(pl, ac) if ch == 'B']
    tr = c['token_res_ids']; tc = c['token_chain_ids']
    summ = {k: v for k, v in s.items() if k != 'chain_ids' and k != 'chain_pair_pae_min'}
    return dict(name=name, n=n, tokenChains=tc, summary=summ,
                paeB64=base64.b64encode(raw).decode(),
                ligandPlddt=lig, residuePlddtA=prot, tokenResIds=tr)
data = {n: load(n) for n in ('ffa4_monomer', 'ffa4_tug891')}
# atom-level pLDDT is long; reduce to per-residue means for chain A using atom->token map if present
dst = os.path.expanduser('~/projects/learning-hub/courses/real-examples.js')
with open(dst, 'w') as f:
    f.write('window.AF3_REAL = ' + json.dumps(data, separators=(',', ':')) + ';\n')
print('wrote', dst, os.path.getsize(dst))
