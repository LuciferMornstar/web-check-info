// Store UI element references for use throughout the app
let elements = null;

/**
 * Initialize UI elements
 * @returns {Object} Object containing all UI element references
 */
export function initializeUI() {
  elements = {
    scanButton: document.getElementById('scanButton'),
    clearButton: document.getElementById('clearButton'),
    exportButton: document.getElementById('exportButton'),
    progressBar: document.getElementById('progressBar'),
    statusLabel: document.getElementById('statusLabel'),
    contactsTable: document.getElementById('contactsTable'),
    emailCount: document.getElementById('emailCount'),
    phoneCount: document.getElementById('phoneCount'),
    nameCount: document.getElementById('nameCount')
  };
  
  return elements;
}

/**
 * Get UI elements object
 * @returns {Object} Object containing all UI element references
 */
export function getUIElements() {
  if (!elements) {
    return initializeUI();
  }
  return elements;
}
