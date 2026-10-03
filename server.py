"""
Lightweight Localhost HTTP Server for AI Treasure Escape Web Application.
Serves on http://localhost:8000
"""

import http.server
import socketserver
import socket
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable caching-friendly headers for dev / demo
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def run():
    os.chdir(DIRECTORY)
    # Allow port reuse immediately
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        # Detect local LAN IP address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(('8.8.8.8', 80))
            lan_ip = s.getsockname()[0]
        except Exception:
            lan_ip = socket.gethostbyname(socket.gethostname())
        finally:
            s.close()
    except Exception:
        lan_ip = "127.0.0.1"

    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            local_url = f"http://localhost:{PORT}"
            network_url = f"http://{lan_ip}:{PORT}"
            print("=" * 60)
            print(" [AI TREASURE ESCAPE] LOCALHOST SERVER ACTIVE")
            print(f" Local URL:   {local_url}")
            print(f" Network URL: {network_url}")
            print(f" Directory:   {DIRECTORY}")
            print("=" * 60)
            print("Press Ctrl+C to stop the server.\n")

            # Open default browser automatically
            try:
                webbrowser.open(local_url)
            except Exception as e:
                print(f"Could not open browser automatically: {e}")

            httpd.serve_forever()
    except OSError as e:
        if e.errno == 10048 or "Address already in use" in str(e):
            print(f"\n[Warning] Port {PORT} is already in use. Trying port {PORT + 1}...")
            with socketserver.TCPServer(("", PORT + 1), Handler) as httpd:
                url = f"http://localhost:{PORT + 1}"
                print(f" 🌐  URL: {url}")
                try:
                    webbrowser.open(url)
                except Exception:
                    pass
                httpd.serve_forever()
        else:
            raise e

if __name__ == '__main__':
    run()
