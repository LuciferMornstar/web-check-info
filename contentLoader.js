"use strict";

const EXTENSION_ID = "";

/**
 * Initialize the active tab with the content script
 */
export async function initializeActiveTab() {
  console.log("Initializing active tab with maximum checks...");
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) {
      console.error("No active tab found");
      return { success: false, error: "No active tab found" };
    }
    const tabId = tabs[0].id;
    const pingResult = await sendPingMessage(tabId, 3000);
    if (pingResult.success) {
      console.log("Content script already loaded");
      return { success: true, tabId, url: tabs[0].url };
    }
    // Force inject content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const finalPing = await sendPingMessage(tabId, 3000);
    if (!finalPing.success) {
      throw new Error("Content script could not be loaded.");
    }
    return { success: true, tabId, url: tabs[0].url };
  } catch (error) {
    console.error("Error initializing active tab:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a ping message to the content script
 */
export function sendPingMessage(tabId, timeout = 2000) {
  return new Promise(resolve => {
    const timeoutId = setTimeout(() => {
      resolve({ success: false, error: "Ping timed out" });
    }, timeout);
    try {
      chrome.tabs.sendMessage(tabId, { action: "ping" }, response => {
        clearTimeout(timeoutId);
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else if (response && response.status === "alive") {
          resolve({ success: true, response });
        } else {
          resolve({ success: false, error: "Invalid response" });
        }
      });
    } catch (error) {
      clearTimeout(timeoutId);
      resolve({ success: false, error: error.message });
    }
  });
}
