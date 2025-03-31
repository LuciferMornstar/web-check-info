"use strict";
import { updateProgress, updateStatus, displayContacts, updateContactCounts, updateScanButton } from "../ui/uiHandlers.js";
import { storeResults } from "../utils/storage.js";

// Global state
let currentContacts = [];

/**
 * Handles runtime messages from background or content scripts.
 * @param {Object} elements - UI elements.
 */
export function setupMessageListener(elements) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.progress !== undefined) {
      updateProgress(elements.progressBar, message.progress);
      if (message.progress >= 100) updateScanButton(elements.scanButton, false);
    }
    if (message.status) updateStatus(elements.statusLabel, message.status);
    if (message.currentContacts) {
      currentContacts = displayContacts(elements.contactsTable, message.currentContacts.structured);
      if (message.currentContacts.counts) {
        updateContactCounts(elements, message.currentContacts.counts);
      }
    }
    if (message.finalContacts) {
      currentContacts = displayContacts(elements.contactsTable, message.finalContacts.structured);
      updateContactCounts(elements, {
        emails: message.finalContacts.emails.length,
        phones: message.finalContacts.phones.length,
        names: message.finalContacts.names.length
      });
      updateScanButton(elements.scanButton, false);
      updateStatus(elements.statusLabel, "Scan complete!");
    }
  });
}

/**
 * Returns the current contacts (if stored globally).
 * @returns {Array} Array of current contacts.
 */
export function getCurrentContacts() {
  return currentContacts;
}
