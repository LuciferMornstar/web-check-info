import * as uiHandlers from './utils/uiHandlers.js';

document.addEventListener('DOMContentLoaded', function () {
  console.log('Popup initialized');

  // Initialize UI elements
  uiHandlers.setupUI();

  // WebSocket and session management
  let socket;
  let sessionId = generateSessionId();

  // Initialize WebSocket connection
  function initializeSocket() {
    socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('WebSocket connected');
      uiHandlers.updateDebugInfo('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      uiHandlers.updateDebugInfo('WebSocket disconnected');
    });

    socket.on('scrape_update', handleScrapeUpdate);
    socket.on('scrape_complete', handleScrapeComplete);
  }

  // Generate a unique session ID
  function generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2, 15);
  }

  // Handle real-time updates from the server
  function handleScrapeUpdate(data) {
    if (data.session_id !== sessionId) return;

    console.log('Scrape update:', data);

    if (data.status === 'crawling') {
      uiHandlers.updateStatus(`Scanning: ${data.url}`);
    } else if (data.status === 'progress') {
      uiHandlers.updateCounter(`${data.type}Count`, data.count);
      uiHandlers.addFoundItem(data.type, data.value);
    }
  }

  // Handle scrape completion
  function handleScrapeComplete(data) {
    if (data.session_id !== sessionId) return;

    console.log('Scrape complete:', data);

    if (data.status === 'complete') {
      uiHandlers.displayContacts(data.data.structuredContacts);
      uiHandlers.updateStatus('Scrapy-based scan complete!');
      uiHandlers.updateDebugInfo(
        `Scan complete. Found ${data.data.emailCount} emails, ${data.data.phoneCount} phones, and ${data.data.nameCount} names.`
      );
    } else if (data.status === 'error') {
      uiHandlers.showErrorModal(data.message);
      uiHandlers.updateStatus('Error scanning');
      uiHandlers.updateDebugInfo(`Error: ${data.message}`);
    }
  }

  // Call the Scrapy spider via the Flask API
  async function callScrapySpider(url) {
    try {
      sessionId = generateSessionId();
      console.log(`Generated session ID: ${sessionId}`);

      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
        console.log(`Added protocol to URL: ${url}`);
      }

      const response = await fetch(
        `http://localhost:5000/scrape?url=${encodeURIComponent(url)}&session_id=${sessionId}`
      );

      if (!response.ok) {
        throw new Error(`Scrapy spider returned status ${response.status}`);
      }

      const result = await response.json();
      console.log('Scrape started:', result);
      return result;
    } catch (error) {
      console.error('Failed to call Scrapy spider:', error);
      throw error;
    }
  }

  // Event handler for starting the scan
  async function handleScan() {
    const websiteInput = document.getElementById('websiteInput');
    const inputUrl = websiteInput ? websiteInput.value.trim() : '';
    if (!inputUrl) {
      alert('Please enter a website address.');
      return;
    }

    console.log(`Starting scan for: ${inputUrl}`);

    uiHandlers.clearContacts();
    uiHandlers.updateCounter('emailCount', 0);
    uiHandlers.updateCounter('phoneCount', 0);
    uiHandlers.updateCounter('nameCount', 0);

    if (!socket || !socket.connected) {
      console.log('Socket not connected, reinitializing...');
      initializeSocket();
    }

    uiHandlers.updateStatus('Starting scan...');
    uiHandlers.updateDebugInfo(`Starting scan of ${inputUrl}`);

    try {
      await callScrapySpider(inputUrl);
      console.log('Scan initiated successfully');
    } catch (error) {
      console.error('Error starting scan:', error);
      uiHandlers.showErrorModal(error.message || 'Failed to start scan');
      uiHandlers.updateStatus('Error scanning');
      uiHandlers.updateDebugInfo(`Error: ${error.message || 'Unknown error'}`);
    }
  }

  // Attach event listener to the input field for Enter key
  const websiteInput = document.getElementById('websiteInput');
  if (websiteInput) {
    websiteInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        handleScan();
      }
    });
  }

  // Initialize WebSocket
  initializeSocket();
});
