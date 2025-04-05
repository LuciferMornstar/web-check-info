"use strict";

const EXTENSION_ID = "";

/**
 * Initialize the active tab with the content script
 */
export async function initializeActiveTab() {
  console.log("Initializing active tab with maximum checks...");
}

/**
 * Send a ping message to the content script
 */
export function sendPingMessage(tabId, timeout = 2000) {
  return new Promise(resolve => {
    const timeoutId = setTimeout(() => {
      resolve({ success: false, error: "Ping timed out" });
    }, timeout);
  });
}
