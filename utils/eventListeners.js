import { updateProgressBar, displayContacts } from './uiHandlers.js';
import { handleExportContacts } from './exportUtils.js';
import { crawlWebsite } from './crawlUtils.js';

export function initializePopup() {
  const findContactsButton = document.getElementById('findContacts');
  const stopScanButton = document.getElementById('stopScan');
  const exportContactsButton = document.getElementById('exportContacts');

  findContactsButton.addEventListener('click', startScan);
  stopScanButton.addEventListener('click', stopScan);
  exportContactsButton.addEventListener('click', handleExportContacts);
}

function startScan() {
  chrome.runtime.sendMessage({ action: 'startCrawl' });
}

function stopScan() {
  chrome.runtime.sendMessage({ action: 'stopScan' });
}
