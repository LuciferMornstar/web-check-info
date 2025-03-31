"use strict";
const EXTENSION_ID = "";

async function loadContentScript() {
  console.log("Loading content script...");
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) {
      console.error("No active tab found");
      return false;
    }
    const activeTab = tabs[0];
    const ping = await sendPingMessage(activeTab.id);
    if (ping.success) return true;
  } catch (e) {
    console.error("Error during ping:", e);
  }
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) {
      console.error("No active tab found");
      return false;
    }
    await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ["content.js"]
    });
    await new Promise(resolve => setTimeout(resolve, 300));
    const pingResult = await sendPingMessage(tabs[0].id);
    return pingResult.success;
  } catch (error) {
    console.error("Error in loadContentScript:", error);
    return false;
  }
}

function sendPingMessage(tabId) {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tabId, { action: "ping" }, response => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else if (response?.status === "alive") {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: "No valid response" });
      }
    });
  });
}

async function initializeActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) return { success: false, error: "No active tab" };
    const tabId = tabs[0].id;
    const injectionSuccess = await loadContentScript();
    return { success: injectionSuccess, tabId, url: tabs[0].url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

window.contentLoader = { loadContentScript, sendPingMessage, initializeActiveTab };
document.dispatchEvent(new Event('contentLoaderReady'));
