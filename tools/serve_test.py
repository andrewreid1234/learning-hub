import http.server, sys, os, json
os.chdir(os.path.expanduser('~/projects/learning-hub'))
OUT = sys.argv[1]
class H(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0)); open(OUT, 'wb').write(self.rfile.read(n)); self.send_response(200); self.end_headers()
    def log_message(self, *a): pass
http.server.HTTPServer(('127.0.0.1', 8765), H).serve_forever()
