const EXTENSION_ID = "jngdjadfpacgipaieakjnpnfjalnfbjh";
import Amplify from 'aws-amplify';
import awsExports from './aws-exports';
Amplify.configure(awsExports);
import { API, graphqlOperation } from 'aws-amplify'; // <-- NEW: Added missing API and graphqlOperation import
import { crawlWebsite, crawlEntireSite } from './utils/crawlUtils.js';
import { createScanResult } from './graphql/mutations';

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Popup initialized');

  // NEW: Create a status element at the top of the popup body
  const pageStatus = document.createElement('div');
  pageStatus.id = 'pageStatus';
  pageStatus.style.padding = '5px';
  pageStatus.style.fontSize = '12px';
  pageStatus.style.textAlign = 'center';
  pageStatus.style.marginBottom = '10px';
  document.body.insertBefore(pageStatus, document.body.firstChild);

  // NEW: Create a debug box below the page status
  const debugBox = document.createElement('div');
  debugBox.id = 'debugBox';
  debugBox.style.padding = '5px';
  debugBox.style.fontSize = '10px';
  debugBox.style.backgroundColor = 'rgba(0,0,0,0.5)';
  debugBox.style.color = '#fff';
  debugBox.style.marginBottom = '10px';
  debugBox.style.maxHeight = '80px';
  debugBox.style.overflowY = 'auto';
  document.body.insertBefore(debugBox, document.getElementById('pageStatus').nextSibling);

  // Utility to append messages to the debug box
  function updateDebug(message) {
    const timestamp = new Date().toLocaleTimeString();
    debugBox.textContent += `[${timestamp}] ${message}\n`;
    debugBox.scrollTop = debugBox.scrollHeight;
  }

  // Function to update page status using current tab and stored cache info
  function updatePageStatus() {
    const currentUrl = document.getElementById('websiteInput').value.trim();
    let statusText = `Current Page: ${currentUrl}. `;
    const results = JSON.parse(localStorage.getItem('scanResults')) || {};
    if (results[currentUrl]) {
      const count = results[currentUrl].structuredContacts?.length || 0;
      statusText += `Cache: ${count} contacts stored.`;
    } else {
      statusText += "No cache found for this page.";
    }
    pageStatus.textContent = statusText;
  }

  // Initial status update and refresh every 10 seconds.
  updatePageStatus();
  setInterval(updatePageStatus, 10000);

  const scanButton = document.getElementById('scanButton');
  const stopButton = document.getElementById('stopButton');
  const clearButton = document.getElementById('clearButton');
  const exportButton = document.getElementById('exportButton');
  const progressBar = document.getElementById('progressBar');
  const statusLabel = document.getElementById('statusLabel');
  const contactsTable = document.getElementById('contactsTable');
  const emailCount = document.getElementById('emailCount');
  const phoneCount = document.getElementById('phoneCount');
  const nameCount = document.getElementById('nameCount');
  const contactPageContainer = document.getElementById('contactPageContainer');
  const contactPageInfo = document.getElementById('contactPageInfo');
  const debugInfo = document.getElementById('debugInfo');
  const ignoreRobotsToggle = document.getElementById('ignoreRobotsToggle');

  // Error modal elements
  const errorModal = document.getElementById('errorModal');
  const closeErrorModal = document.getElementById('closeErrorModal');
  const errorDetails = document.getElementById('errorDetails');

  // Function to show the error modal with a specific message
  function showErrorModal(errorMessage) {
    errorDetails.textContent = errorMessage || 'An unknown error occurred.';
    errorModal.style.display = 'block';
  }

  // Close the error modal when the close button is clicked
  closeErrorModal.addEventListener('click', () => {
    errorModal.style.display = 'none';
  });

  // Close the error modal when clicking outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target === errorModal) {
      errorModal.style.display = 'none';
    }
  });

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
    scanButton.disabled = isScanning;
    stopButton.disabled = !isScanning;
    if (isScanning) {
      scanButton.classList.add('disabled');
      stopButton.classList.remove('disabled');
    } else {
      scanButton.classList.remove('disabled');
      stopButton.classList.add('disabled');
    }
    
    // Ensure the buttons are visibly disabled/enabled
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
    }
  }

  // Replace the scan button event listener with web app version:
  scanButton.addEventListener('click', async function() {
    const inputUrl = document.getElementById('websiteInput').value.trim();
    if (!inputUrl) {
        alert("Please enter a website address.");
        return;
    }
    updateButtonStates(true);
    statusLabel.textContent = 'Scanning...';
    debugInfo.textContent = 'Starting scan...';
    console.log("Scan button clicked, target URL:", inputUrl);
    const targetUrl = inputUrl;
    const bypassConfirmation = confirm(
      "Do you want to enable aggressive anti-scraping bypass measures? " +
      "This may violate website terms of service and could lead to blocking."
    );
    
    try {
      const result = await crawlWebsite({ url: targetUrl, netnutApiKey: '', bypassAntiBot: bypassConfirmation });
      console.log("crawlWebsite result:", result);
      displayContacts(result.contacts);
      if (result.contactBlocks && result.contactBlocks.length > 0) {
        displayContactPageInfo(result.contactBlocks);
      } else {
        displayContactPageInfo([]);
      }
      emailCount.textContent = result.emails?.length || 0;
      phoneCount.textContent = result.phonesFound?.length || 0;
      nameCount.textContent = result.names?.length || 0;
      statusLabel.textContent = 'Contacts page scan complete!';
      debugInfo.textContent = 'Contacts page scan complete!';
      
      await saveScanResult(targetUrl, result.contacts);
    } catch (error) {
      console.error("Error during contacts page scan:", error);
      handleError(error.message);
      statusLabel.textContent = 'Error scanning contacts page';
      debugInfo.textContent = `Error: ${error.message}`;
    } finally {
      updateButtonStates(false);
    }
  });

  stopButton.addEventListener('click', function() {
    console.log('Stop button clicked');
    statusLabel.textContent = 'Stopping scan...';
    updateButtonStates(false); // Disable scanning UI immediately
  });

  clearButton.addEventListener('click', clearContacts);
  exportButton.addEventListener('click', exportContacts);

  // Load any saved contacts
  loadSavedContacts();

  // Display contacts in the contacts table
  function displayContacts(contacts) {
    if (!contacts || contacts.length === 0) {
      contactsTable.innerHTML = `
        <tr>
          <td colspan="3" class="empty-state">
            <div>No contacts found</div>
            <p>Try scanning more pages on this website</p>
          </td>
        </tr>
      `;
      return;
    }

    // Clear the table first
    contactsTable.innerHTML = '';
    
    // Add each contact to the table
    contacts.forEach(contact => {
      const row = document.createElement('tr');
      
      // Format emails: either a single email or a comma-separated list
      const emailDisplay = Array.isArray(contact.emails) 
        ? contact.emails.join('<br>') 
        : (contact.email || '-');
      
      row.innerHTML = `
        <td>${contact.name || '-'}</td>
        <td>${emailDisplay}</td>
        <td>${contact.phone || '-'}</td>
      `;
      contactsTable.appendChild(row);
    });
    
    // Save the contacts to localStorage
    const currentUrl = document.getElementById('websiteInput').value.trim();
    if (!currentUrl) return;
    
    let results = JSON.parse(localStorage.getItem('scanResults')) || {};
    results[currentUrl] = {
      structuredContacts: contacts,
      timestamp: Date.now()
    };
    localStorage.setItem('scanResults', JSON.stringify(results));

    // NEW: Update results font size using the slider's current value
    updateResultsFontSize();
  }

  function updateResultsFontSize() {
    const slider = document.getElementById('fontSizeSlider');
    if (slider) {
      document.querySelectorAll("#contactsTable td, #contactsTable th").forEach(el => {
        el.style.fontSize = slider.value + "px";
      });
    }
  }

  // Clear contacts
  function clearContacts() {
    contactsTable.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">
          <div>No contacts found</div>
          <p>Try scanning more pages on this website</p>
        </td>
      </tr>
    `;
    emailCount.textContent = '0';
    phoneCount.textContent = '0';
    nameCount.textContent = '0';
    
    const currentUrl = document.getElementById('websiteInput').value.trim();
    if (!currentUrl) return;

    let results = JSON.parse(localStorage.getItem('scanResults')) || {};
    if (results[currentUrl]) {
      delete results[currentUrl];
      localStorage.setItem('scanResults', JSON.stringify(results));
    }
  }

  // Export contacts
  function exportContacts() {
    const currentUrl = document.getElementById('websiteInput').value.trim();
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

  // Load saved contacts
  function loadSavedContacts() {
    const currentUrl = document.getElementById('websiteInput').value.trim();
    if (!currentUrl) return;
    const results = JSON.parse(localStorage.getItem('scanResults')) || {};
    const pageResults = results[currentUrl];
    if (pageResults && pageResults.structuredContacts) {
      displayContacts(pageResults.structuredContacts);
      
      // Update counts if rawContacts exists
      if (pageResults.rawContacts) {
        emailCount.textContent = pageResults.rawContacts.emails?.length || 0;
        phoneCount.textContent = pageResults.rawContacts.phones?.length || 0;
        nameCount.textContent = pageResults.rawContacts.names?.length || 0;
      } else {
        // If no rawContacts, use length of structuredContacts as a fallback
        const emailsCount = pageResults.structuredContacts.filter(c => c.email).length;
        const phonesCount = pageResults.structuredContacts.filter(c => c.phone).length;
        const namesCount = pageResults.structuredContacts.filter(c => c.name).length;
        
        emailCount.textContent = emailsCount;
        phoneCount.textContent = phonesCount;
        nameCount.textContent = namesCount;
      }
    } else {
      // No saved contacts - reset the UI
      contactsTable.innerHTML = `
        <tr>
          <td colspan="3" class="empty-state">
            <div>No contacts found</div>
            <p>Try scanning more pages on this website</p>
          </td>
        </tr>
      `;
      emailCount.textContent = '0';
      phoneCount.textContent = '0';
      nameCount.textContent = '0';
    }
  }

  // NEW: Updated function to display contact page information from contactBlocks array
  function displayContactPageInfo(contactBlocks) {
    // If contactBlocks is an array with values, display each block in a card layout
    if (Array.isArray(contactBlocks) && contactBlocks.length > 0) {
      const formatted = contactBlocks.map(block =>
        `<div class="contact-block" style="margin-bottom:10px; padding:10px; background:#2a2a2a; border:1px solid rgba(255,255,255,0.1); border-radius:4px;">${block}</div>`
      ).join("<hr>");
      document.getElementById('contactPageInfo').innerHTML = formatted;
    } else {
      document.getElementById('contactPageInfo').innerHTML = 'No contact page info found.';
    }
  }

  function appendContact(contact) {
    const contactsTable = document.getElementById('contactsTable');
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${contact.name || '-'}</td>
      <td>${contact.email || '-'}</td>
      <td>${contact.phone || '-'}</td>
    `;
    contactsTable.appendChild(row);
  }

  // Function to handle errors and show the error modal
  function handleError(errorMessage) {
    console.error('Error:', errorMessage);
    showErrorModal(errorMessage);
  }

  const fontSizeSlider = document.getElementById('fontSizeSlider');
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', function() {
      document.querySelectorAll("#contactsTable td, #contactsTable th").forEach(el => {
        el.style.fontSize = fontSizeSlider.value + "px";
      });
    });
    // NEW: Apply the initial slider value immediately
    fontSizeSlider.dispatchEvent(new Event('input'));
  }

  // NEW: Populate open tabs dropdown
  function populateOpenTabs() {
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
      const select = document.getElementById('openTabsSelect');
      // Clear previous options except the first placeholder
      select.innerHTML = '<option value="">-- Select open tab --</option>';
      tabs.forEach(tab => {
        if (tab.url && tab.url.startsWith('http')) {
          const option = document.createElement('option');
          option.value = tab.url;
          option.textContent = tab.title || tab.url;
          select.appendChild(option);
        }
      });
    });
  }
  populateOpenTabs();
  // Refresh dropdown every 30 seconds
  setInterval(populateOpenTabs, 30000);

  // NEW: Update websiteInput when the dropdown changes
  document.getElementById('openTabsSelect').addEventListener('change', function() {
    const selectedUrl = this.value;
    if (selectedUrl) {
      document.getElementById('websiteInput').value = selectedUrl;
    }
  });
});
