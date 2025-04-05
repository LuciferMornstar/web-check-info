# Web Check Contact Finder

A web application that uses Scrapy to extract contact information from websites.

## Setup

### Backend Setup
1. Install Python requirements:
   ```
   pip install -r requirements.txt
   ```

2. Run the Flask server for the web application:
   ```
   python app.py
   ```

### Frontend Setup
Deploy to AWS Amplify or serve locally with a static file server.

## Usage

### Web Interface
1. Enter a website URL in the search box
2. Click "Scan Page" to extract contacts using Scrapy
3. View the contacts in the table
4. Export contacts to CSV if needed

### Command Line Usage
This project is also configured as a standard Scrapy project, so you can use Scrapy's command-line tools directly:

1. Crawl a website and save results to JSON:
   ```
   scrapy crawl contact_spider -a url="https://example.com" -o results.json
   ```

2. Open Scrapy shell to examine a page:
   ```
   scrapy shell "https://example.com"
   ```

3. List available spiders:
   ```
   scrapy list
   ```

4. Use the provided shell script for common operations:
   ```
   ./run_scrapy.sh crawl https://example.com output.json
   ```

## API Integration

The Flask API provides endpoints for running the scrapy spider and getting real-time updates:

- GET `/scrape?url=<URL>&session_id=<SESSION_ID>` - Start a scraping job
- POST `/cancel-scrape` with JSON body `{"session_id": "<SESSION_ID>"}` - Cancel a scraping job

WebSocket events:
- `scrape_update` - Real-time updates during scraping
- `scrape_complete` - Sent when scraping is complete
