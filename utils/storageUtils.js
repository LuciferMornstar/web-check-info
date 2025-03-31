export function saveResults(url, structuredContacts, rawContacts) {
  chrome.runtime.sendMessage({
    action: 'storeResults',
    url: url,
    structuredContacts: structuredContacts,
    rawContacts: rawContacts,
  });
}

export function loadPreviousResults(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentUrl = tabs[0].url;
    chrome.runtime.sendMessage({ action: 'getResults', url: currentUrl }, callback);
  });
}
