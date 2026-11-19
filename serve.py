"""Serve the game on http://127.0.0.1:8000 and tell the browser never to cache it.

Plain `python3 -m http.server` lets a browser reuse old copies of the game's JavaScript files,
which breaks the page after any change. Use this instead:  python3 serve.py [port]
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
print(f"Round Trip is at http://127.0.0.1:{port}  (Ctrl+C to stop)")
ThreadingHTTPServer(("127.0.0.1", port), NoCache).serve_forever()
