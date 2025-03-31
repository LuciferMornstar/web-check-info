export function handleExportContacts() {
  // Get contacts from storage instead of using an empty array
  chrome.storage.local.get('scanResults', (data) => {
    const results = data.scanResults || {};
    
    // Get current tab URL to find the right results
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0].url;
      const pageResults = results[currentUrl];
      
      if (!pageResults || !pageResults.structuredContacts || pageResults.structuredContacts.length === 0) {
        alert('No contacts to export!');
        return;
      }
      
      let csvContent = "data:text/csv;charset=utf-8,Name,Phone,Email\n";
      pageResults.structuredContacts.forEach(contact => {
        csvContent += `"${contact.name || ''}","${contact.phone || ''}","${contact.email || ''}"\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'contacts.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });
}
