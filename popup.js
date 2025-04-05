import Amplify from 'aws-amplify';
import awsExports from './aws-exports';
Amplify.configure(awsExports);
import { API, graphqlOperation } from 'aws-amplify';
import { crawlWebsite, crawlEntireSite } from './utils/crawlUtils.js';
import { createScanResult } from './graphql/mutations';
import * as uiHandlers from './utils/uiHandlers.js';

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Popup initialized');

  // Initialize UI elements
  uiHandlers.setupUI();

  // Load saved settings
  const ignoreRobotsToggle = document.getElementById('ignoreRobotsToggle');
  const websiteInput = document.getElementById('websiteInput');
  const openTabsSelect = document.getElementById('openTabsSelect');

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

  async function saveScanResult(url, contacts) {
    try {
      const input = {
        url,
        domain: new URL(url).hostname,
        timestamp: Date.now(),
        contactCount: contacts.length,
        structuredContacts: contacts,
      };
      await API.graphql(graphqlOperation(createScanResult, { input }));
      console.log('Scan result saved successfully!');
    } catch (error) {
      console.error('Error saving scan result:', error);
      uiHandlers.showErrorModal('Failed to save scan result. Please try again.');
    }
  }

  // Scan button click event
  document.getElementById('scanButton').addEventListener('click', async function() {
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

    try {
      const result = await crawlWebsite({ url: targetUrl, netnutApiKey: '', bypassAntiBot: bypassConfirmation });
      console.log("crawlWebsite result:", result);
      uiHandlers.displayContacts(result.contacts);
      uiHandlers.updateCounter('emailCount', result.emails?.length || 0);
      uiHandlers.updateCounter('phoneCount', result.phonesFound?.length || 0);
      uiHandlers.updateCounter('nameCount', result.names?.length || 0);
      uiHandlers.updateStatus('Contacts page scan complete!');
      uiHandlers.updateDebugInfo('Contacts page scan complete!');

      await saveScanResult(targetUrl, result.contacts);
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
  document.getElementById('stopButton').addEventListener('click', function() {
    console.log('Stop button clicked');
    uiHandlers.updateStatus('Stopping scan...');
    chrome.runtime.sendMessage({ action: 'stopScan' }, function(response) {
      console.log('Stop scan response:', response);
    });
    updateButtonStates(false);
  });

  // Clear button click event
  document.getElementById('clearButton').addEventListener('click', () => {
    uiHandlers.clearContacts();
    // Clear local storage as well
    localStorage.removeItem('scanResults');
    uiHandlers.updateStatus('Cleared contacts and cache.');
  });

  // Export button click event
  document.getElementById('exportButton').addEventListener('click', exportContacts);

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

  // Populate open tabs dropdown
  function populateOpenTabs() {
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
      // Clear previous options except the first placeholder
      openTabsSelect.innerHTML = '<option value="">-- Select open tab --</option>';
      tabs.forEach(tab => {
        if (tab.url && tab.url.startsWith('http')) {
          const option = document.createElement('option');
          option.value = tab.url;
          option.textContent = tab.title || tab.url;
          openTabsSelect.appendChild(option);
        }
      });
    });
  }
  populateOpenTabs();
  // Refresh dropdown every 30 seconds
  setInterval(populateOpenTabs, 30000);

  // Update websiteInput when the dropdown changes
  openTabsSelect.addEventListener('change', function() {
    const selectedUrl = this.value;
    if (selectedUrl) {
      websiteInput.value = selectedUrl;
      updatePageStatus();
    }
  });

  // Update websiteInput when the import button is clicked
  document.getElementById('importTabButton').addEventListener('click', function() {
    const selectedUrl = openTabsSelect.value;
    if (selectedUrl) {
      websiteInput.value = selectedUrl;
      updatePageStatus();
    } else {
      alert("Please select an open tab from the dropdown.");
    }
  });
});
