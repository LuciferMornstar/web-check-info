import * as uiHandlers from './utils/uiHandlers.js';

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Popup initialized');

  // Initialize UI elements
  uiHandlers.setupUI();
  
  // Setup WebSocket connection
  let socket;
  let sessionId = generateSessionId();
  
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
    
    socket.on('scrape_update', (data) => {
      // Only process updates for our session
      if (data.session_id !== sessionId) return;
      
      console.log('Scrape update:', data);
      
      if (data.status === 'crawling') {
        uiHandlers.updateStatus(`Scanning: ${data.url}`);
      }
      
      if (data.status === 'progress') {
        if (data.type === 'email') {
          uiHandlers.updateCounter('emailCount', data.count);
          uiHandlers.addFoundItem('email', data.value);
        } else if (data.type === 'phone') {
          uiHandlers.updateCounter('phoneCount', data.count);
          uiHandlers.addFoundItem('phone', data.value);
        } else if (data.type === 'name') {
          uiHandlers.updateCounter('nameCount', data.count);
          uiHandlers.addFoundItem('name', data.value);
        }
      }
    });
    
    socket.on('scrape_complete', (data) => {
      // Only process updates for our session
      if (data.session_id !== sessionId) return;
      
      console.log('Scrape complete:', data);
      
      if (data.status === 'complete') {
        // Store the results
        const inputUrl = websiteInput.value.trim();
        const scanResults = JSON.parse(localStorage.getItem('scanResults')) || {};
        scanResults[inputUrl] = data.data;
        localStorage.setItem('scanResults', JSON.stringify(scanResults));
        
        // Update UI
        uiHandlers.displayContacts(data.data.structuredContacts);
        uiHandlers.updateStatus('Scrapy-based scan complete!');
        uiHandlers.updateDebugInfo(`Scan complete. Found ${data.data.emailCount} emails, ${data.data.phoneCount} phones, and ${data.data.nameCount} names across ${data.data.pageCount} pages.`);
      } else if (data.status === 'error') {
        uiHandlers.showErrorModal(data.message);
        uiHandlers.updateStatus('Error scanning');
        uiHandlers.updateDebugInfo(`Error: ${data.message}`);
      }
      
      updateButtonStates(false);
    });
  }
  
  function generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2, 15);
  }

  // Load saved settings
  const ignoreRobotsToggle = document.getElementById('ignoreRobotsToggle');
  const websiteInput = document.getElementById('websiteInput');

  const ignoreRobots = localStorage.getItem('ignoreRobots') === 'true';
  ignoreRobotsToggle.checked = ignoreRobots;

  ignoreRobotsToggle.addEventListener('change', () => {
    localStorage.setItem('ignoreRobots', ignoreRobotsToggle.checked);
    console.log('Ignore robots.txt setting updated:', ignoreRobotsToggle.checked);
  });

  // Function to update button states
  function updateButtonStates(isScanning) {
    const scanButton = document.getElementById('scanButton');
    const stopButton = document.getElementById('stopButton');
    scanButton.disabled = isScanning;
    stopButton.disabled = !isScanning;
    scanButton.classList.toggle('disabled', isScanning);
    stopButton.classList.toggle('disabled', !isScanning);
    scanButton.style.pointerEvents = isScanning ? 'none' : 'auto';
    stopButton.style.pointerEvents = isScanning ? 'auto' : 'none';
  }

  // Set initial state: stop button disabled by default
  updateButtonStates(false);

  // Add stopCrawl flag
  let stopCrawl = false;

  // Initialize WebSocket
  initializeSocket();

  // Helper function to call Scrapy spider with WebSocket support
  async function callScrapySpider(url) {
    try {
      // Generate new session ID for this scan
      sessionId = generateSessionId();
      
      const response = await fetch(`http://localhost:5000/scrape?url=${encodeURIComponent(url)}&session_id=${sessionId}`);
      if (!response.ok) {
        throw new Error(`Scrapy spider returned status ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Scrape started:", result);
      
      return { status: 'started', message: result.message };
    } catch (error) {
      console.error("Failed to call Scrapy spider:", error);
      throw error;
    }
  }

  // Scan button click event
  const scanButton = document.getElementById('scanButton');
  scanButton.addEventListener('click', async function() {
    const inputUrl = websiteInput.value.trim();
    if (!inputUrl) {
      alert("Please enter a website address.");
      return;
    }
    
    // Reset UI for new scan
    uiHandlers.clearContacts();
    uiHandlers.updateCounter('emailCount', 0);
    uiHandlers.updateCounter('phoneCount', 0);
    uiHandlers.updateCounter('nameCount', 0);
    
    updateButtonStates(true);
    uiHandlers.updateStatus('Starting scan...');
    uiHandlers.updateDebugInfo(`Starting scan of ${inputUrl}`);
    console.log("Scan button clicked, target URL:", inputUrl);

    // Reset stopCrawl flag
    stopCrawl = false;

    try {
      // Call Scrapy spider - this now returns immediately while updates come via WebSocket
      await callScrapySpider(inputUrl);
      
      // No need to update UI here - it's handled by WebSocket events
    } catch (error) {
      console.error("Error starting scan:", error);
      uiHandlers.showErrorModal(error.message);
      uiHandlers.updateStatus('Error starting scan');
      uiHandlers.updateDebugInfo(`Error: ${error.message}`);
      updateButtonStates(false);
    }
  });

  // Stop button click event
  const stopButton = document.getElementById('stopButton');
  stopButton.addEventListener('click', async function() {
    console.log('Stop button clicked');
    uiHandlers.updateStatus('Stopping scan...');
    
    // Send cancel request to server
    try {
      const response = await fetch('http://localhost:5000/cancel-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      
      const result = await response.json();
      console.log("Cancel result:", result);
      
      if (result.status === 'cancelled') {
        uiHandlers.updateStatus('Scan cancelled');
        uiHandlers.updateDebugInfo('Scan cancelled by user');
      } else {
        uiHandlers.updateStatus('Failed to cancel scan');
        uiHandlers.updateDebugInfo(`Failed to cancel: ${result.message}`);
      }
    } catch (error) {
      console.error("Error cancelling scan:", error);
      uiHandlers.updateDebugInfo(`Error cancelling scan: ${error.message}`);
    }
    
    // Set stopCrawl to true
    stopCrawl = true;
    updateButtonStates(false);
  });

  // Clear button click event
  const clearButton = document.getElementById('clearButton');
  clearButton.addEventListener('click', () => {
    uiHandlers.clearContacts();
    localStorage.removeItem('scanResults');
    uiHandlers.updateStatus('Cleared contacts and cache.');
  });

  // Export button click event
  const exportButton = document.getElementById('exportButton');
  exportButton.addEventListener('click', exportContacts);

  // Load saved contacts
  loadSavedContacts();

  // Export contacts function
  function exportContacts() {
    const currentUrl = websiteInput.value.trim();
    if (!currentUrl) return;

    const results = JSON.parse(localStorage.getItem('scanResults')) || {};
    const pageResults = results[currentUrl];
    if (!pageResults || !pageResults.structuredContacts || pageResults.structuredContacts.length === 0) {
      alert('No contacts to export!');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Name,Phone,Email\n";
    pageResults.structuredContacts.forEach(contact => {
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

  // Load saved contacts function
  function loadSavedContacts() {
    const currentUrl = websiteInput.value.trim();
    if (!currentUrl) return;
    const results = JSON.parse(localStorage.getItem('scanResults')) || {};
    const pageResults = results[currentUrl];
    if (pageResults && pageResults.structuredContacts) {
      uiHandlers.displayContacts(pageResults.structuredContacts);

      if (pageResults.rawContacts) {
        uiHandlers.updateCounter('emailCount', pageResults.rawContacts.emails?.length || 0);
        uiHandlers.updateCounter('phoneCount', pageResults.rawContacts.phones?.length || 0);
        uiHandlers.updateCounter('nameCount', pageResults.rawContacts.names?.length || 0);
      } else {
        const emailsCount = pageResults.structuredContacts.filter(c => c.email).length;
        const phonesCount = pageResults.structuredContacts.filter(c => c.phone).length;
        const namesCount = pageResults.structuredContacts.filter(c => c.name).length;

        uiHandlers.updateCounter('emailCount', emailsCount);
        uiHandlers.updateCounter('phoneCount', phonesCount);
        uiHandlers.updateCounter('nameCount', namesCount);
      }
    } else {
      uiHandlers.clearContacts();
    }
  }
});
