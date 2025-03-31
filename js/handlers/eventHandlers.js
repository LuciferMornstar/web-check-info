import { updateStatus, updateScanButton } from '../ui/uiHandlers.js';
import { startScan, stopScan } from '../utils/scanner.js';
import { clearContacts } from '../utils/storage.js';
import { exportContacts } from '../utils/export.js';

/**
 * Set up event listeners for UI elements
 * @param {Object} elements - UI elements object
 * @param {Object} contentLoader - Content loader utility
 */
export function setupEventListeners(elements, contentLoader) {
  let isScanning = false;
  
  // Scan/Stop button
  elements.scanButton.addEventListener('click', async () => {
    if (isScanning) {
      await stopScan(elements);
      isScanning = false;
      updateScanButton(elements.scanButton, isScanning);
    } else {
      isScanning = await startScan(elements, contentLoader);
      updateScanButton(elements.scanButton, isScanning);
    }
  });
  
  // Clear button
  elements.clearButton.addEventListener('click', () => {
    clearContacts(elements);
  });
  
  // Export button
  elements.exportButton.addEventListener('click', () => {
    exportContacts();
  });
}
