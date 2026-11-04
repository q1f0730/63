import os
import sys
import socket
import threading
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8686
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))


class UTF8BookHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.4)
        return s.connect_ex(("127.0.0.1", port)) == 0


def main():
    open_browser = "--no-browser" not in sys.argv
    url = f"http://127.0.0.1:{PORT}/index.html"

    if is_port_in_use(PORT):
        print(f"[OK] Web Book server is already running at {url}")
        if open_browser:
            webbrowser.open(url)
        return

    handler = partial(UTF8BookHandler, directory=ROOT_DIR)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    print("============================================================")
    print("  Freud Three Essays Web Book - Local Server Running")
    print(f"  URL: {url}")
    print("  Press Ctrl+C to stop.")
    print("============================================================")

    if open_browser:
        threading.Timer(0.35, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.server_close()


if __name__ == "__main__":
    main()
