"use strict";

import { crawlWebsite, crawlEntireSite } from './utils/crawlUtils.js';

// Global flag to indicate the script is loaded
window.contentScriptLoaded = true;
const contentScriptLoadTime = Date.now();
console.log(`Content script loaded at ${new Date(contentScriptLoadTime).toISOString()}`);

const EXTENSION_ID = "";

let crawlCancelToken = { cancelled: false };

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Content script received message:", request.action);

  if (request.action === "ping") {
    sendResponse({ status: "alive", loadTime: contentScriptLoadTime });
    return true;
  } else if (request.action === "test") {
    sendResponse({ status: "ok", loadTime: contentScriptLoadTime });
    return true;
  }

  if (request.action === 'startCrawl') {
    crawlCancelToken = { cancelled: false }; // Reset cancel token
    const { url, netnutApiKey, bypassAntiBot } = request;
    
    crawlEntireSite({ url, netnutApiKey, bypassAntiBot }, function(update) {
      // Send intermediate results back to popup
      chrome.runtime.sendMessage({
        action: 'updateContacts',
        currentContacts: update.contacts,
        emailCount: update.aggregated.emails.length,
        phoneCount: update.aggregated.phonesFound.length,
        nameCount: update.aggregated.names.length,
        currentUrl: update.currentUrl
      });
    }, crawlCancelToken, function(debugMessage) {
      chrome.runtime.sendMessage({
        action: 'debugLog',
        message: debugMessage,
        timestamp: new Date().toLocaleTimeString()
      });
    })
    .then(finalResult => {
      chrome.runtime.sendMessage({
        action: 'finalContacts',
        finalContacts: finalResult.contacts,
        emailCount: finalResult.aggregated.emails.length,
        phoneCount: finalResult.aggregated.phonesFound.length,
        nameCount: finalResult.aggregated.names.length
      });
    })
    .catch(error => {
      chrome.runtime.sendMessage({ action: 'crawlError', error: error.message });
      console.error('Crawl error:', error);
    });
    sendResponse({ status: 'crawlStarted' });
    return true;
  }

  if (request.action === 'stopScan') {
    crawlCancelToken.cancelled = true;
    console.log('Stopping scan');
    sendResponse({ status: 'stopped' });
    return true;
  }

  sendResponse({ status: 'unknownAction' });
  return true; // Required for asynchronous responses
});

function performCrawl(sendResponse) {
  const crawlResults = [];
  let currentIndex = 0;

  function crawlNext() {
    if (currentIndex < document.links.length) {
      const link = document.links[currentIndex];
      console.log(`Crawling link: ${link.href}`);
      crawlResults.push(link.href);
      currentIndex++;
      chrome.runtime.sendMessage({ action: "crawlProgress", link: link.href });
      setTimeout(crawlNext, 100); // Simulate async crawling
    } else {
      console.log("Crawl completed.");
      sendResponse({ status: "crawled", result: crawlResults });
    }
  }

  crawlNext();
}

export {};  // Mark this file as a module