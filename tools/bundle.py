"""Inline hub.js and every <script src> between the COURSES markers into one standalone HTML file."""
import re, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(f'{root}/index.html').read()
def inline(m):
    src = m.group(1)
    return '<script>\n' + open(f'{root}/{src}').read().replace('</script>', '<\\/script>') + '\n</script>'
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
os.makedirs(f'{root}/dist', exist_ok=True)
out = f'{root}/dist/learning-hub.html'
open(out, 'w').write(html)
print('wrote', out, os.path.getsize(out) // 1024, 'KB')
