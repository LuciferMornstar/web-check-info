import { extractContacts } from '../utils/regexUtils.js';
import { crawlWebsite } from '../utils/crawlUtils.js';

const EXTENSION_ID = "";

/**
 * Core logic for the content script as a module.
 */
export function start() {
  console.log("Injected module started successfully!");

  // Avoid duplicate listeners by ensuring only one listener is active
  chrome.runtime.onMessage.removeListener(messageHandler);
  chrome.runtime.onMessage.addListener(messageHandler);

  function messageHandler(request, sender, sendResponse) {
    console.log("Injected script received message:", request.action);
    try {
      if (request.action === 'ping') {
        sendResponse({ status: 'alive' });
        return true;
      }
      if (request.action === 'test') {
        sendResponse({ status: 'ok' });
        return true;
      }
    } catch (error) {
      console.error("Error handling message:", error);
      sendResponse({ status: 'error', message: error.message });
      return true;
    }
  }
}

// Expose the start function so that the page can invoke it
window.injectedStart = start;