/**
 * uiHandlers.js
 * Handles UI updates for the popup, including progress bar, contact display, and status messages.
 */

export function setupUI() {
  const progressBarFill = document.getElementById('progressBarFill');
  if (progressBarFill) {
    progressBarFill.setAttribute('aria-valuenow', 0);
  } else {
    console.warn('Progress bar element not found');
  }
  console.log('uiHandlers: setupUI called');
}

export function updateProgressBar(progress) {
  const progressBar = document.getElementById('progressBar');
  if (!progressBar) {
    console.error('updateProgressBar: progressBar element not found');
    return;
  }
  progressBar.style.width = progress + '%';
  progressBar.setAttribute('aria-valuenow', progress);
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

export function showErrorModal(errorMessage) {
  const errorDetails = document.getElementById('errorDetails');
  const errorModal = document.getElementById('errorModal');
  if (!errorDetails || !errorModal) {
    console.error('showErrorModal: errorDetails or errorModal element not found');
    return;
  }
  errorDetails.textContent = errorMessage || 'An unknown error occurred.';
  errorModal.style.display = 'block';
  console.error(errorMessage);
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
        <p>Try scanning more pages on this website</p>
      </td>
    </tr>
  `;
  updateCounter('emailCount', 0);
  updateCounter('phoneCount', 0);
  updateCounter('nameCount', 0);
}

export function addFoundItem(type, value) {
  // Add a small notification for newly found items
  const foundItem = document.createElement('div');
  foundItem.className = 'found-item';
  foundItem.innerHTML = `<strong>${type}:</strong> ${value}`;
  
  // Add to a container for found items
  const foundItemsContainer = document.getElementById('foundItemsContainer');
  if (foundItemsContainer) {
    // Add at the top and trim if too many
    foundItemsContainer.insertBefore(foundItem, foundItemsContainer.firstChild);
    
    // Remove items if there are too many (keep last 10)
    while (foundItemsContainer.children.length > 10) {
      foundItemsContainer.removeChild(foundItemsContainer.lastChild);
    }
    
    // Auto-fade out after 5 seconds
    setTimeout(() => {
      foundItem.style.opacity = '0';
      setTimeout(() => {
        if (foundItem.parentNode === foundItemsContainer) {
          foundItemsContainer.removeChild(foundItem);
        }
      }, 500); // Remove after fade animation
    }, 5000);
  }
}
