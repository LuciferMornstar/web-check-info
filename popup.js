import { crawlWebsite, crawlEntireSite } from './utils/crawlUtils.js';
import * as uiHandlers from './utils/uiHandlers.js';

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Popup initialized');

  // Initialize UI elements
  uiHandlers.setupUI();

  // Load saved settings
  const ignoreRobotsToggle = document.getElementById('ignoreRobotsToggle');
  const websiteInput = document.getElementById('websiteInput');

  // Load saved settings
  const ignoreRobots = localStorage.getItem('ignoreRobots') === 'true';
  ignoreRobotsToggle.checked = ignoreRobots;

  // Save settings when changed
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

  // Scan button click event
  const scanButton = document.getElementById('scanButton');
  scanButton.addEventListener('click', async function() {
    const inputUrl = websiteInput.value.trim();
    if (!inputUrl) {
      alert("Please enter a website address.");
      return;
    }
    updateButtonStates(true);
    uiHandlers.updateStatus('Scanning...');
    uiHandlers.updateDebugInfo('Starting scan...');
    console.log("Scan button clicked, target URL:", inputUrl);
    const targetUrl = inputUrl;
    const bypassConfirmation = confirm(
      "Do you want to enable aggressive anti-scraping bypass measures? " +
      "This may violate website terms of service and could lead to blocking."
    );

    // Reset stopCrawl flag
    stopCrawl = false;

    try {
      const result = await crawlWebsite({ url: targetUrl, netnutApiKey: '', bypassAntiBot: bypassConfirmation, stopCrawl: () => stopCrawl });
      console.log("crawlWebsite result:", result);
      if (result) { // Check if result is not undefined
        uiHandlers.displayContacts(result.contacts);
        uiHandlers.updateCounter('emailCount', result.emails?.length || 0);
        uiHandlers.updateCounter('phoneCount', result.phonesFound?.length || 0);
        uiHandlers.updateCounter('nameCount', result.names?.length || 0);
        uiHandlers.updateStatus('Contacts page scan complete!');
        uiHandlers.updateDebugInfo('Contacts page scan complete!');

        // Save scan results locally
        const scanResults = JSON.parse(localStorage.getItem('scanResults')) || {};
        scanResults[targetUrl] = {
          structuredContacts: result.contacts,
          rawContacts: {
            emails: result.emails || [],
            phones: result.phonesFound || [],
            names: result.names || []
          }
        };
        localStorage.setItem('scanResults', JSON.stringify(scanResults));
      } else {
        uiHandlers.updateStatus('Scan completed, but no results returned.');
        uiHandlers.updateDebugInfo('Scan completed, but no results returned.');
      }
    } catch (error) {
      console.error("Error during contacts page scan:", error);
      uiHandlers.showErrorModal(error.message);
      uiHandlers.updateStatus('Error scanning contacts page');
      uiHandlers.updateDebugInfo(`Error: ${error.message}`);
    } finally {
      updateButtonStates(false);
    }
  });

  // Stop button click event
  const stopButton = document.getElementById('stopButton');
  stopButton.addEventListener('click', function() {
    console.log('Stop button clicked');
    uiHandlers.updateStatus('Stopping scan...');
    // Set stopCrawl to true
    stopCrawl = true;
    updateButtonStates(false);
  });

  // Clear button click event
  const clearButton = document.getElementById('clearButton');
  clearButton.addEventListener('click', () => {
    uiHandlers.clearContacts();
    // Clear local storage as well
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

      // Update counts if rawContacts exists
      if (pageResults.rawContacts) {
        uiHandlers.updateCounter('emailCount', pageResults.rawContacts.emails?.length || 0);
        uiHandlers.updateCounter('phoneCount', pageResults.rawContacts.phones?.length || 0);
        uiHandlers.updateCounter('nameCount', pageResults.rawContacts.names?.length || 0);
      } else {
        // If no rawContacts, use length of structuredContacts as a fallback
        const emailsCount = pageResults.structuredContacts.filter(c => c.email).length;
        const phonesCount = pageResults.structuredContacts.filter(c => c.phone).length;
        const namesCount = pageResults.structuredContacts.filter(c => c.name).length;

        uiHandlers.updateCounter('emailCount', emailsCount);
        uiHandlers.updateCounter('phoneCount', phonesCount);
        uiHandlers.updateCounter('nameCount', namesCount);
      }
    } else {
      // No saved contacts - reset the UI
      uiHandlers.clearContacts();
    }
  }
});
