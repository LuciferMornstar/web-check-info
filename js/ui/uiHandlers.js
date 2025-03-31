/**
 * Update the scan progress bar
 * @param {HTMLElement} progressBar - The progress bar element
 * @param {number} percent - The progress percentage (0-100)
 */
export function updateProgress(progressBar, percent) {
  progressBar.style.width = `${percent}%`;
}

/**
 * Update the status message
 * @param {HTMLElement} statusLabel - The status label element
 * @param {string} message - The status message
 */
export function updateStatus(statusLabel, message) {
  statusLabel.textContent = message;
  console.log('Status:', message);
}

/**
 * Update the contact counts
 * @param {Object} elements - UI elements object
 * @param {Object} counts - Contact counts object
 */
export function updateContactCounts(elements, counts) {
  if (!counts) return;
  elements.emailCount.textContent = counts.emails || 0;
  elements.phoneCount.textContent = counts.phones || 0;
  elements.nameCount.textContent = counts.names || 0;
}

/**
 * Display contacts in the table
 * @param {HTMLElement} contactsTable - The contacts table tbody element
 * @param {Array} contacts - Array of contact objects
 * @returns {Array} The displayed contacts
 */
export function displayContacts(contactsTable, contacts) {
  if (contacts && contacts.length > 0) {
    contactsTable.innerHTML = '';
    contacts.forEach(contact => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${contact.name || '-'}</td>
        <td>${contact.email || '-'}</td>
        <td>${contact.phone || '-'}</td>
      `;
      contactsTable.appendChild(row);
    });
  } else {
    contactsTable.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">
          <div>No contacts found</div>
          <p>Try scanning more pages on this website</p>
        </td>
      </tr>
    `;
  }
  
  return contacts || [];
}

/**
 * Update the scan button state
 * @param {HTMLElement} scanButton - The scan button element
 * @param {boolean} isScanning - Whether scanning is in progress
 */
export function updateScanButton(scanButton, isScanning) {
  if (isScanning) {
    scanButton.textContent = 'Stop Scan';
    scanButton.classList.add('scanning');
  } else {
    scanButton.textContent = 'Scan Page';
    scanButton.classList.remove('scanning');
  }
}
