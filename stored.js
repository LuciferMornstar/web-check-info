const EXTENSION_ID = "";

document.addEventListener('DOMContentLoaded', function() {
  console.log('Stored data page initialized');

  // Get references to page elements
  const sitesContainer = document.getElementById('sitesContainer');
  const noDataMessage = document.getElementById('noDataMessage');
  const searchBox = document.getElementById('searchBox');
  const exportAllButton = document.getElementById('exportAllButton');
  const clearAllButton = document.getElementById('clearAllButton');
  const detailsContainer = document.getElementById('detailsContainer');
  const detailsTitle = document.getElementById('detailsTitle');
  const detailsContent = document.getElementById('detailsContent');
  const closeDetails = document.getElementById('closeDetails');
  const paginationContainer = document.getElementById('paginationContainer');
  const toast = document.getElementById('toast');

  // Variables to track state
  let allScans = [];
  let filteredScans = [];
  let currentPage = 1;
  const itemsPerPage = 10;

  // Load all stored scan data
  loadAllScans();

  // Add event listeners
  searchBox.addEventListener('input', handleSearch);
  exportAllButton.addEventListener('click', exportAllContacts);
  clearAllButton.addEventListener('click', clearAllData);
  closeDetails.addEventListener('click', () => {
    detailsContainer.style.display = 'none';
  });
  
  // Add navigation handler for the "Home" link
  const homeLink = document.querySelector('.navigation a[href="popup.html"]');
  if (homeLink) {
    homeLink.addEventListener('click', function(event) {
      event.preventDefault();
      window.location.href = 'popup.html';
    });
  }

  // Function to load all saved scans
  function loadAllScans() {
    const stored = JSON.parse(localStorage.getItem('scanResults')) || {};
    
    if (Object.keys(stored).length === 0) {
      noDataMessage.style.display = 'block';
      sitesContainer.innerHTML = '';
      paginationContainer.innerHTML = '';
      return;
    }
    
    // Convert object to array for easier filtering and sorting
    allScans = Object.keys(stored).map(url => {
      const scan = stored[url];
      const domain = extractDomain(url);
      const contactCount = scan.structuredContacts?.length || 0;
      const emailCount = scan.rawContacts?.emails?.length || 0;
      const phoneCount = scan.rawContacts?.phones?.length || 0;
      
      return {
        url: url,
        domain: domain,
        timestamp: scan.timestamp || Date.now(),
        contactCount: contactCount,
        emailCount: emailCount,
        phoneCount: phoneCount,
        structuredContacts: scan.structuredContacts || [],
        rawContacts: scan.rawContacts || { emails: [], phones: [], names: [] }
      };
    });
    
    // Sort by timestamp (newest first)
    allScans.sort((a, b) => b.timestamp - a.timestamp);
    
    filteredScans = [...allScans];
    displayScans(filteredScans);
  }

  // Function to display scans with pagination
  function displayScans(scans) {
    if (scans.length === 0) {
      noDataMessage.style.display = 'block';
      sitesContainer.innerHTML = '';
      paginationContainer.innerHTML = '';
      return;
    }
    
    noDataMessage.style.display = 'none';
    
    // Calculate pagination
    const totalPages = Math.ceil(scans.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = 1;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, scans.length);
    const currentScans = scans.slice(startIndex, endIndex);
    
    // Build the table
    let tableHTML = `
      <table class="sites-table">
        <thead>
          <tr>
            <th>Website</th>
            <th>Scan Date</th>
            <th>Found Contacts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    currentScans.forEach(scan => {
      const date = new Date(scan.timestamp);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      
      tableHTML += `
        <tr>
          <td class="site-url" title="${scan.url}">${scan.domain}</td>
          <td class="scan-date">${formattedDate}</td>
          <td>
            <div class="counts">
              <div class="count-item">
                Emails: <span>${scan.emailCount}</span>
              </div>
              <div class="count-item">
                Phones: <span>${scan.phoneCount}</span>
              </div>
            </div>
          </td>
          <td class="actions">
            <button class="button" onclick="viewContacts('${encodeURIComponent(scan.url)}')">View</button>
            <button class="button" onclick="exportScan('${encodeURIComponent(scan.url)}')">Export</button>
            <button class="button" onclick="deleteScan('${encodeURIComponent(scan.url)}')">Delete</button>
          </td>
        </tr>
      `;
    });
    
    tableHTML += `
        </tbody>
      </table>
    `;
    
    sitesContainer.innerHTML = tableHTML;
    
    // Build pagination controls
    if (totalPages > 1) {
      let paginationHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Prev</button>
      `;
      
      for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
          <button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>
        `;
      }
      
      paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next</button>
      `;
      
      paginationContainer.innerHTML = paginationHTML;
    } else {
      paginationContainer.innerHTML = '';
    }
    
    // Set up global functions for table buttons
    window.viewContacts = function(encodedUrl) {
      const url = decodeURIComponent(encodedUrl);
      showContactDetails(url);
    };
    
    window.exportScan = function(encodedUrl) {
      const url = decodeURIComponent(encodedUrl);
      exportSingleScan(url);
    };
    
    window.deleteScan = function(encodedUrl) {
      const url = decodeURIComponent(encodedUrl);
      if (confirm('Are you sure you want to delete this scan?')) {
        const stored = JSON.parse(localStorage.getItem('scanResults')) || {};
        if (stored[url]) {
          delete stored[url];
          localStorage.setItem('scanResults', JSON.stringify(stored));
          loadAllScans();
          showToast('Scan deleted successfully!');
        }
      }
    };
    
    window.changePage = function(pageNum) {
      currentPage = pageNum;
      displayScans(filteredScans);
    };
  }

  // Function to handle search
  function handleSearch() {
    const searchTerm = searchBox.value.toLowerCase();
    
    if (!searchTerm) {
      filteredScans = [...allScans];
    } else {
      filteredScans = allScans.filter(scan => 
        scan.domain.toLowerCase().includes(searchTerm) ||
        scan.url.toLowerCase().includes(searchTerm)
      );
    }
    
    currentPage = 1; // Reset to first page on new search
    displayScans(filteredScans);
  }

  // Function to export all contacts
  function exportAllContacts() {
    if (allScans.length === 0) {
      showToast('No contacts to export!');
      return;
    }
    
    let allContacts = [];
    
    allScans.forEach(scan => {
      scan.structuredContacts.forEach(contact => {
        allContacts.push({
          name: contact.name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          website: scan.domain
        });
      });
    });
    
    if (allContacts.length === 0) {
      showToast('No contacts to export!');
      return;
    }
    
    // Create CSV
    let csvContent = "data:text/csv;charset=utf-8,Name,Email,Phone,Website\n";
    allContacts.forEach(contact => {
      csvContent += `"${contact.name}","${contact.email}","${contact.phone}","${contact.website}"\n`;
    });
    
    // Download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'all_contacts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${allContacts.length} contacts successfully!`);
  }

  // Function to clear all data
  function clearAllData() {
    if (confirm('Are you sure you want to delete all stored scan results? This action cannot be undone.')) {
      localStorage.setItem('scanResults', JSON.stringify({}));
      allScans = [];
      filteredScans = [];
      displayScans(filteredScans);
      showToast('All scan data cleared successfully!');
    }
  }

  // Function to show contact details
  function showContactDetails(url) {
    const scan = allScans.find(s => s.url === url);
    if (!scan) return;
    
    detailsTitle.textContent = `Contacts for ${scan.domain}`;
    
    if (scan.structuredContacts.length === 0) {
      detailsContent.innerHTML = '<div class="empty-state">No structured contacts found for this site.</div>';
    } else {
      let contactsHTML = '';
      
      scan.structuredContacts.forEach(contact => {
        contactsHTML += `
          <div class="contact-card">
            <div class="contact-field">
              <div class="contact-field-label">Name</div>
              <div class="contact-field-value">${contact.name || '-'}</div>
            </div>
            <div class="contact-field">
              <div class="contact-field-label">Email</div>
              <div class="contact-field-value">${contact.email || '-'}</div>
            </div>
            <div class="contact-field">
              <div class="contact-field-label">Phone</div>
              <div class="contact-field-value">${contact.phone || '-'}</div>
            </div>
          </div>
        `;
      });
      
      detailsContent.innerHTML = contactsHTML;
    }
    
    detailsContainer.style.display = 'block';
  }

  // Function to export a single scan
  function exportSingleScan(url) {
    const scan = allScans.find(s => s.url === url);
    if (!scan || scan.structuredContacts.length === 0) {
      showToast('No contacts to export!');
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,Name,Email,Phone,Website\n";
    scan.structuredContacts.forEach(contact => {
      csvContent += `"${contact.name || ''}","${contact.email || ''}","${contact.phone || ''}","${scan.domain}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contacts_${scan.domain}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Contacts exported successfully!');
  }

  // Helper function to extract domain from URL
  function extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url;
    }
  }

  // Function to show toast message
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
});
