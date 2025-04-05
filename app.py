from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import subprocess
import json
import tempfile
import os
import threading
import time
import re

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Track active crawling processes
active_processes = {}

@app.route('/scrape', methods=['GET'])
def scrape_url():
    url = request.args.get('url')
    session_id = request.args.get('session_id')
    
    if not url:
        return jsonify({"error": "URL parameter is required"}), 400
    
    if not session_id:
        session_id = "default_session"
    
    # Start a new thread for the scraping process
    thread = threading.Thread(target=run_scraper, args=(url, session_id))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "status": "started",
        "message": f"Scraping {url} has begun. Updates will be sent via WebSocket.",
        "session_id": session_id
    })

def run_scraper(url, session_id):
    try:
        # Create a temporary file to store the scrapy output
        with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp:
            tmp_filename = tmp.name
        
        # Notify client that scraping is starting
        socketio.emit('scrape_update', {
            'status': 'starting',
            'message': f'Starting to scrape {url}',
            'session_id': session_id
        })
        
        # Run the scrapy spider as a subprocess with -s LOG_STDOUT=True to get logs
        process = subprocess.Popen([
            'scrapy', 'runspider', 'scrapy_spider.py',
            '-a', f'url={url}',
            '-a', f'session_id={session_id}', 
            '-s', 'LOG_STDOUT=True',
            '-o', tmp_filename,
            '-t', 'json'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
        
        # Store the process for potential cancellation
        active_processes[session_id] = process
        
        # Process output in real-time
        email_count = 0
        phone_count = 0
        name_count = 0
        
        while True:
            line = process.stdout.readline()
            if not line and process.poll() is not None:
                break
                
            if line:
                # Parse scrapy output for relevant information
                if "Found email:" in line:
                    email = re.search(r'Found email: (.*?)$', line)
                    if email:
                        email_count += 1
                        socketio.emit('scrape_update', {
                            'status': 'progress',
                            'type': 'email',
                            'value': email.group(1),
                            'count': email_count,
                            'session_id': session_id
                        })
                
                elif "Found phone:" in line:
                    phone = re.search(r'Found phone: (.*?)$', line)
                    if phone:
                        phone_count += 1
                        socketio.emit('scrape_update', {
                            'status': 'progress',
                            'type': 'phone',
                            'value': phone.group(1),
                            'count': phone_count,
                            'session_id': session_id
                        })
                
                elif "Found name:" in line:
                    name = re.search(r'Found name: (.*?)$', line)
                    if name:
                        name_count += 1
                        socketio.emit('scrape_update', {
                            'status': 'progress',
                            'type': 'name',
                            'value': name.group(1),
                            'count': name_count,
                            'session_id': session_id
                        })
                
                elif "Crawled" in line and "200" in line:
                    url_match = re.search(r'Crawled \(200\) <GET (.*?)>', line)
                    if url_match:
                        socketio.emit('scrape_update', {
                            'status': 'crawling',
                            'url': url_match.group(1),
                            'session_id': session_id
                        })
        
        # Process has finished, read the output file
        with open(tmp_filename, 'r') as f:
            try:
                results = json.load(f)
            except json.JSONDecodeError:
                results = []
        
        # Delete the temporary file
        os.unlink(tmp_filename)
        
        # Remove process from active processes
        if session_id in active_processes:
            del active_processes[session_id]
        
        # Return results via WebSocket
        if isinstance(results, list) and len(results > 0):
            socketio.emit('scrape_complete', {
                'status': 'complete',
                'data': results[0],
                'session_id': session_id,
                'stats': {
                    'emailCount': email_count,
                    'phoneCount': phone_count,
                    'nameCount': name_count
                }
            })
        else:
            socketio.emit('scrape_complete', {
                'status': 'error',
                'message': 'No data returned from scraper',
                'session_id': session_id
            })
    
    except Exception as e:
        socketio.emit('scrape_complete', {
            'status': 'error',
            'message': str(e),
            'session_id': session_id
        })
        if session_id in active_processes:
            del active_processes[session_id]

@app.route('/cancel-scrape', methods=['POST'])
def cancel_scrape():
    session_id = request.json.get('session_id')
    if not session_id:
        return jsonify({"error": "session_id parameter is required"}), 400
    
    if session_id in active_processes:
        # Kill the process
        active_processes[session_id].terminate()
        del active_processes[session_id]
        return jsonify({"status": "cancelled", "message": "Scraping process cancelled"})
    else:
        return jsonify({"status": "not_found", "message": "No active scraping process found for this session"}), 404

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
