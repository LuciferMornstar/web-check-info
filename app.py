from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import tempfile
import os

app = Flask(__name__)
CORS(app)  # Enable cross-origin requests

@app.route('/scrape', methods=['GET'])
def scrape_url():
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "URL parameter is required"}), 400
    
    try:
        # Create a temporary file to store the scrapy output
        with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp:
            tmp_filename = tmp.name
        
        # Run the scrapy spider as a subprocess
        process = subprocess.Popen([
            'scrapy', 'runspider', 'scrapy_spider.py',
            '-a', f'url={url}',
            '-o', tmp_filename,
            '-t', 'json'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        stdout, stderr = process.communicate()
        
        # Read the output file
        with open(tmp_filename, 'r') as f:
            results = json.load(f)
        
        # Delete the temporary file
        os.unlink(tmp_filename)
        
        # Return first item if it's a list
        if isinstance(results, list) and len(results) > 0:
            return jsonify(results[0])
        
        return jsonify({"error": "No data returned from scraper"}), 500
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
