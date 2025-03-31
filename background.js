// background.js

const EXTENSION_ID = "jngdjadfpacgipaieakjnpnfjalnfbjh";

// Track active scans
let activeScan = {
  tabId: null,
  inProgress: false,
  timestamp: null
};

let autoStopTimeout = null;

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Web Contact Finder extension installed.');
  // Initialize storage
  chrome.storage.local.set({
    scanResults: {},
    activeScan: null,
    ignoreRobots: false // Default to respecting robots.txt rules
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    console.log('Background received message:', message, 'from:', sender);
    if (message.action === 'debugLog') {
      console.log(`[DEBUG][${message.timestamp}] ${message.message}`);
      sendResponse({ status: 'log_received' });
      return true;
    }
    if (message.action === 'injectContentScript') {
      if (sender.tab) {
        chrome.scripting.executeScript({
          target: { tabId: sender.tab.id },
          files: ['content.js']
        })
        .then(() => {
          console.log('Content script injected successfully into tab', sender.tab.id);
          sendResponse({ status: 'injected' });
        })
        .catch(err => {
          console.error('Error injecting content script:', err);
          sendResponse({ status: 'error', error: err.message });
        });
        return true; // Keep the message channel open for async response
      } else {
        console.error('No sender tab found for injection.');
        sendResponse({ status: 'error', error: 'No sender tab found' });
        return false;
      }
    }
    if (message.action === 'storeResults') {
      chrome.storage.local.get('scanResults', (data) => {
        const results = data.scanResults || {};
        results[message.url] = {
          structuredContacts: message.structuredContacts,
          rawContacts: message.rawContacts,
          timestamp: Date.now()
        };
        chrome.storage.local.set({ scanResults: results }, () => {
          sendResponse({ status: 'stored' });
        });
      });
      return true;
    } else if (message.action === 'getResults') {
      chrome.storage.local.get('scanResults', (data) => {
        const results = data.scanResults || {};
        sendResponse({ results: results[message.url] || null, allResults: results });
      });
      return true;
    }
    sendResponse({ status: 'message_received' });
  } catch (error) {
    console.error('Error in onMessage listener:', error);
    sendResponse({ status: 'error', error: error.message });
    chrome.runtime.sendMessage(EXTENSION_ID, { action: 'error', error: error.message });
  }
});

// Safe message sending utility
function safeTabMessage(tabId, message, callback = null) {
  if (!tabId) {
    console.error('Cannot send message: No tabId provided');
    if (callback) callback(null);
    return;
  }
  try {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        const errorMessage = chrome.runtime.lastError.message || 'Unknown error';
        console.log(`Error sending message to tab ${tabId}:`, errorMessage);
        if (callback) callback(null);
      } else if (callback) {
        callback(response);
      }
    });
  } catch (error) {
    console.error(`Exception sending message to tab ${tabId}:`, error);
    if (callback) callback(null);
  }
}
