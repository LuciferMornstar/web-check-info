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
      const inputUrl = getWebsiteInput();
      const scanResults = loadScanResults();
      scanResults[inputUrl] = data.data;
      saveScanResults(scanResults);

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

    updateButtonStates(false);
  }

  // Helper to get the website input value
  function getWebsiteInput() {
    const websiteInput = document.getElementById('websiteInput');
    return websiteInput ? websiteInput.value.trim() : '';
  }

  // Helper to load scan results from localStorage
  function loadScanResults() {
    return JSON.parse(localStorage.getItem('scanResults')) || {};
  }

  // Helper to save scan results to localStorage
  function saveScanResults(results) {
    localStorage.setItem('scanResults', JSON.stringify(results));
  }

  // Update button states
  function updateButtonStates(isScanning) {
    const scanButton = document.getElementById('scanButton');
    const stopButton = document.getElementById('stopButton');
    scanButton.disabled = isScanning;
    stopButton.disabled = !isScanning;
    scanButton.classList.toggle('disabled', isScanning);
    stopButton.classList.toggle('disabled', !isScanning);
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

  // Event handler for the scan button
  async function handleScanButtonClick() {
    const inputUrl = getWebsiteInput();
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

    updateButtonStates(true);
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
      updateButtonStates(false);
    }
  }

  // Event handler for the stop button
  async function handleStopButtonClick() {
    console.log('Stop button clicked');
    uiHandlers.updateStatus('Stopping scan...');

    try {
      const response = await fetch('http://localhost:5000/cancel-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const result = await response.json();
      console.log('Cancel result:', result);

      if (result.status === 'cancelled') {
        uiHandlers.updateStatus('Scan cancelled');
        uiHandlers.updateDebugInfo('Scan cancelled by user');
      } else {
        uiHandlers.updateStatus('Failed to cancel scan');
        uiHandlers.updateDebugInfo(`Failed to cancel: ${result.message}`);
      }
    } catch (error) {
      console.error('Error cancelling scan:', error);
      uiHandlers.updateDebugInfo(`Error cancelling scan: ${error.message}`);
    }

    updateButtonStates(false);
  }

  // Event handler for the clear button
  function handleClearButtonClick() {
    uiHandlers.clearContacts();
    localStorage.removeItem('scanResults');
    uiHandlers.updateStatus('Cleared contacts and cache.');
  }

  // Event handler for the export button
  function handleExportButtonClick() {
    const inputUrl = getWebsiteInput();
    if (!inputUrl) return;

    const scanResults = loadScanResults();
    const pageResults = scanResults[inputUrl];
    if (!pageResults || !pageResults.structuredContacts || pageResults.structuredContacts.length === 0) {
      alert('No contacts to export!');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,Name,Phone,Email\n';
    pageResults.structuredContacts.forEach((contact) => {
      csvContent += `"${contact.name || ''}","${contact.phone || ''}","${contact.email || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'contacts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Attach event listeners to buttons
  document.getElementById('scanButton').addEventListener('click', handleScanButtonClick);
  document.getElementById('stopButton').addEventListener('click', handleStopButtonClick);
  document.getElementById('clearButton').addEventListener('click', handleClearButtonClick);
  document.getElementById('exportButton').addEventListener('click', handleExportButtonClick);

  // Initialize WebSocket
  initializeSocket();
});
