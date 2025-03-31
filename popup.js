const EXTENSION_ID = "jngdjadfpacgipaieakjnpnfjalnfbjh";
import { crawlWebsite, crawlEntireSite } from './utils/crawlUtils.js';

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
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentUrl = tabs[0]?.url;
      let statusText = `Current Page: ${currentUrl}. `;
      chrome.storage.local.get('scanResults', function(data) {
        const results = data.scanResults || {};
        if (results[currentUrl]) {
          const count = results[currentUrl].structuredContacts?.length || 0;
          statusText += `Cache: ${count} contacts stored.`;
        } else {
          statusText += "No cache found for this page.";
        }
        pageStatus.textContent = statusText;
      });
    });
  }

  // Initial status update and refresh every 10 seconds.
  updatePageStatus();
  setInterval(updatePageStatus, 10000);

  // First, try to import contentLoader.js
  let initializeActiveTab, sendPingMessage;
  try {
    const contentLoader = await import('./contentLoader.js');
    initializeActiveTab = contentLoader.initializeActiveTab;
    sendPingMessage = contentLoader.sendPingMessage;
  } catch (error) {
    console.error("Failed to load contentLoader.js:", error);
    return;
  }

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
  chrome.storage.local.get('ignoreRobots', (data) => {
    ignoreRobotsToggle.checked = !!data.ignoreRobots;
  });

  // Save settings when changed
  ignoreRobotsToggle.addEventListener('change', () => {
    chrome.storage.local.set({ ignoreRobots: ignoreRobotsToggle.checked });
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

  // Replace the scan button event listener:
  scanButton.addEventListener('click', function() {
    const inputUrl = document.getElementById('websiteInput').value.trim();
    if (!inputUrl) {
        alert("Please enter a website address.");
        return;
    }
    updateButtonStates(true);
    statusLabel.textContent = 'Scanning...';
    debugInfo.textContent = 'Starting scan...';
    console.log("Scan button clicked, target URL:", inputUrl);
    // Use the entered URL as target
    const targetUrl = inputUrl;
    // Prompt for bypass flag once 
    const bypassConfirmation = confirm(
      "Do you want to enable aggressive anti-scraping bypass measures? " +
      "This may violate website terms of service and could lead to blocking."
    );
    crawlWebsite({ url: targetUrl, netnutApiKey: '', bypassAntiBot: bypassConfirmation })
      .then(result => {
        console.log("crawlWebsite result:", result);
        displayContacts(result.contacts);
        if(result.contactBlocks && result.contactBlocks.length > 0){
          displayContactPageInfo(result.contactBlocks);
        } else {
          displayContactPageInfo([]); 
        }
        emailCount.textContent = result.emails?.length || 0;
        phoneCount.textContent = result.phonesFound?.length || 0;
        nameCount.textContent = result.names?.length || 0;
        statusLabel.textContent = 'Contacts page scan complete!';
        debugInfo.textContent = 'Contacts page scan complete!';
      })
      .catch(error => {
        console.error("Error during contacts page scan:", error);
        handleError(error.message);
        statusLabel.textContent = 'Error scanning contacts page';
        debugInfo.textContent = `Error: ${error.message}`;
      })
      .finally(() => {
        updateButtonStates(false);
      });
  });

  // Update the stop button event listener with better error handling
  stopButton.addEventListener('click', function() {
    console.log('Stop button clicked');
    statusLabel.textContent = 'Stopping scan...';
    updateButtonStates(false); // Disable scanning UI immediately

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || !tabs[0]) {
        console.error('No active tab found');
        statusLabel.textContent = 'Error: No active tab found';
        return;
      }

      const tabId = tabs[0].id;
      const stopTimeout = setTimeout(() => {
        console.warn("Stop scan message timed out");
        statusLabel.textContent = 'Stop scan command timed out';
      }, 5000); // 5 seconds timeout

      chrome.tabs.sendMessage(tabId, { action: 'stopScan' }, function(response) {
        clearTimeout(stopTimeout); // Clear timeout if response is received

        if (chrome.runtime.lastError) {
          console.error("Error stopping scan:", chrome.runtime.lastError.message);
          handleError(`Error stopping scan: ${chrome.runtime.lastError.message}`);
          return;
        }

        if (response && (response.status === 'stopped' || response.status === 'not_scanning')) {
          console.log('Scan stopped successfully or was not running');
          statusLabel.textContent = response.status === 'stopped' ? 'Scan stopped' : 'No scan was running';
          updateButtonStates(false);
        } else {
          console.warn('Unexpected response while stopping scan:', JSON.stringify(response));
          statusLabel.textContent = 'Scan stopped (unknown status)';
          updateButtonStates(false);
        }
      });
    });
  });

  clearButton.addEventListener('click', clearContacts);
  exportButton.addEventListener('click', exportContacts);

  // Load any saved contacts
  loadSavedContacts();

  // Add message listener for communication with background/content scripts
  chrome.runtime.onMessage.addListener(function(message) {
    console.log('Popup received message:', message);

    // NEW: Handle CAPTCHA detection
    if (message.action === 'captchaDetected') {
      showCaptchaModal(message.url);
      return;
    }

    // NEW: Append live debug logs to the debug container
    if (message.action && message.action === 'debugLog') {
      const debugEl = document.getElementById('debugInfo');
      // Append the new debug message with timestamp on a new line
      debugEl.textContent += `\n[${message.timestamp}] ${message.message}`;
      return; // Optionally stop further processing for debug logs
    }

    if (message.progress !== undefined) {
      // Update progress bar with smooth animation
      const currentWidth = parseInt(progressBar.style.width) || 0;
      const targetWidth = message.progress;
      
      // If progress is increasing, animate it
      if (targetWidth > currentWidth) {
        animateProgressBar(currentWidth, targetWidth);
      } else {
        // If progress is decreasing (rare case), just set it
        progressBar.style.width = targetWidth + '%';
      }
      
      // Only update the text if we have progress info
      if (message.pagesScanned !== undefined && message.maxPages !== undefined) {
        debugInfo.textContent = `Scanning in progress... ${message.progress}% complete (${message.pagesScanned}/${message.maxPages} pages)`;
      } else {
        debugInfo.textContent = `Scanning in progress... ${message.progress}% complete`;
      }

      if (message.progress >= 100) {
        updateButtonStates(false);
        debugInfo.textContent = 'Scan complete!';
      }
    }

    if (message.status) {
      statusLabel.textContent = message.status;
    }

    // NEW: Handle intermediate contact updates
    if (message.action === 'updateContacts') {
      displayContacts(message.currentContacts);
      emailCount.textContent = message.emailCount || 0;
      phoneCount.textContent = message.phoneCount || 0;
      nameCount.textContent = message.nameCount || 0;
      debugInfo.textContent = `Crawled: ${message.currentUrl}`;
    }

    // NEW: Handle final contact results
    if (message.action === 'finalContacts') {
      displayContacts(message.finalContacts);
      emailCount.textContent = message.emailCount || 0;
      phoneCount.textContent = message.phoneCount || 0;
      nameCount.textContent = message.nameCount || 0;
      statusLabel.textContent = 'Scan complete!';
    }

    if (message.action === 'scanStopped') {
      updateButtonStates(false);
      statusLabel.textContent = 'Scan stopped by user';
    }
  });

  // NEW: Function to show the CAPTCHA modal
  function showCaptchaModal(url) {
    const captchaModal = document.createElement('div');
    captchaModal.id = 'captchaModal';
    captchaModal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(0, 0, 0, 0.5); display: flex;
      justify-content: center; align-items: center; z-index: 1001;
    `;

    const captchaContent = document.createElement('div');
    captchaContent.style.cssText = `
      background-color: #fff; padding: 20px; border-radius: 5px;
      text-align: center;
    `;

    captchaContent.innerHTML = `
      <h2>CAPTCHA Detected</h2>
      <p>Please solve the CAPTCHA on this page:</p>
      <a href="${url}" target="_blank">${url}</a>
      <p>Once solved, click the button below to resume scanning.</p>
      <button id="resumeScanButton">Resume Scan</button>
    `;

    captchaModal.appendChild(captchaContent);
    document.body.appendChild(captchaModal);

    // Add event listener to the resume button
    document.getElementById('resumeScanButton').addEventListener('click', () => {
      captchaModal.remove();
      // Resume the scan (you'll need to implement a way to track and resume)
      resumeCrawl(url);
    });
  }

  // NEW: Placeholder for resume crawl function
  function resumeCrawl(url) {
    console.log(`Resuming crawl after CAPTCHA solved on ${url}`);
    // Implement logic to resume the crawl from where it left off
    // This might involve re-injecting the content script and sending a message
    // to continue scanning.
  }

  // Helper function to animate the progress bar
  function animateProgressBar(startWidth, endWidth) {
    const duration = 300; // animation duration in ms
    const startTime = performance.now();
    
    function updateProgress(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentValue = startWidth + (endWidth - startWidth) * progress;
      
      progressBar.style.width = currentValue + '%';
      
      if (progress < 1) {
        requestAnimationFrame(updateProgress);
      }
    }
    
    requestAnimationFrame(updateProgress);
  }

  // Set up navigation links
  const storedInfoLink = document.getElementById('storedInfoLink');
  const settingsLink = document.getElementById('settingsLink');

  if (storedInfoLink) {
    storedInfoLink.addEventListener('click', function(event) {
      event.preventDefault();
      chrome.tabs.create({ url: chrome.runtime.getURL('stored.html') });
    });
  }

  if (settingsLink) {
    settingsLink.addEventListener('click', function(event) {
      event.preventDefault();
      chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    });
  }

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
    
    // Save the contacts to storage
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0]?.url;
      if (!currentUrl) return;
      
      chrome.storage.local.get('scanResults', (data) => {
        const results = data.scanResults || {};
        results[currentUrl] = {
          structuredContacts: contacts,
          timestamp: Date.now()
        };
        
        chrome.storage.local.set({scanResults: results});
      });
    });

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
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0]?.url;
      if (!currentUrl) return;

      chrome.storage.local.get('scanResults', (data) => {
        const results = data.scanResults || {};
        if (results[currentUrl]) {
          delete results[currentUrl];
          chrome.storage.local.set({scanResults: results});
        }
      });
    });
  }

  // Export contacts
  function exportContacts() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0]?.url;
      if (!currentUrl) return;

      chrome.storage.local.get('scanResults', (data) => {
        const results = data.scanResults || {};
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
      });
    });
  }

  // Load saved contacts
  function loadSavedContacts() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0]?.url;
      if (!currentUrl) return;

      chrome.storage.local.get('scanResults', (data) => {
        const results = data.scanResults || {};
        const pageResults = results[currentUrl];
        
        // Check if pageResults exists before accessing structuredContacts
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
      });
    });
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
    chrome.runtime.sendMessage(EXTENSION_ID, { action: 'error', error: errorMessage });
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
});
