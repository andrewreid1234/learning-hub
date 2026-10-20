import http.server, sys, os, json
"""Serve the repository on 127.0.0.1:8765 and save anything POSTed to it to the file given as argv[1].
tools/selftest.html POSTs its results here, because a headless browser cannot write files itself."""
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = sys.argv[1]
class H(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0)); open(OUT, 'wb').write(self.rfile.read(n)); self.send_response(200); self.end_headers()
    def log_message(self, *a): pass
http.server.HTTPServer(('127.0.0.1', 8765), H).serve_forever()
