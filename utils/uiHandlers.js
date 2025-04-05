/**
 * uiHandlers.js
 * Handles UI updates for the popup, including progress bar, contact display, and status messages.
 */

export function setupUI() {
  console.log('UI setup completed');
}

export function displayContacts(contacts) {
  const contactsTable = document.getElementById('contactsTable');
  if (!contactsTable) {
    console.error('displayContacts: contactsTable element not found');
    return;
  }
  const contactsTableBody = contactsTable.querySelector('tbody');
  if (!contactsTableBody) {
    console.error('displayContacts: contactsTableBody element not found');
    return;
  }
  contactsTableBody.innerHTML = ''; // Clear previous results

  if (contacts && Array.isArray(contacts)) {
    contacts.forEach(contact => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      const phoneCell = document.createElement('td');
      const emailCell = document.createElement('td');

      nameCell.textContent = contact.name || '';
      phoneCell.textContent = contact.phone || '';
      emailCell.textContent = contact.email || '';

      row.appendChild(nameCell);
      row.appendChild(phoneCell);
      row.appendChild(emailCell);
      contactsTableBody.appendChild(row);
    });
  } else {
    const row = document.createElement('tr');
    const noDataCell = document.createElement('td');
    noDataCell.textContent = 'No contacts found.';
    noDataCell.colSpan = 3;
    row.appendChild(noDataCell);
    contactsTableBody.appendChild(row);
  }
}

export function updateCounter(elementId, count) {
  const counterElement = document.getElementById(elementId);
  if (!counterElement) {
    console.error(`updateCounter: ${elementId} element not found`);
    return;
  }
  counterElement.textContent = count;
}

export function updateStatus(message) {
  const statusLabel = document.getElementById('statusLabel');
  if (statusLabel) statusLabel.textContent = message;
}

export function updateDebugInfo(message) {
  const debugInfo = document.getElementById('debugInfo');
  if (debugInfo) debugInfo.textContent = message;
}

export function clearContacts() {
  const contactsTable = document.getElementById('contactsTable');
  if (!contactsTable) {
    console.error('clearContacts: contactsTable element not found');
    return;
  }
  const contactsTableBody = contactsTable.querySelector('tbody');
  if (!contactsTableBody) {
    console.error('clearContacts: contactsTableBody element not found');
    return;
  }
  contactsTableBody.innerHTML = `
    <tr>
      <td colspan="3" class="empty-state">
        <div>No contacts found</div>
        <p>Enter a website address to start scanning</p>
      </td>
    </tr>
  `;
}
