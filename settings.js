const EXTENSION_ID = ""; {
  // Get only the available form elements
document.addEventListener('DOMContentLoaded', function() {);
  // Get only the available form elementsmentById('crawlDelay');
  const maxPagesInput = document.getElementById('maxPages');Robots');
  const crawlDelayInput = document.getElementById('crawlDelay'); Updated from 'theme'

  const themeSelect = document.getElementById('themeSelect'); // Updated from 'theme'
  const defaultSettings = {
  // Default settings now only include available controls
  const defaultSettings = {
    maxPages: 20, false,
    crawlDelay: 300,
    ignoreRobots: false,
    theme: 'dark'
  }; Load saved settings
  loadSettings();
  // Load saved settings
  loadSettings();load settings from storage
  function loadSettings() {
  // Function to load settings from storagenction(data) {
  function loadSettings() {.settings || defaultSettings;
    chrome.storage.local.get('settings', function(data) {
      const settings = data.settings || defaultSettings;Settings.maxPages;
      crawlDelayInput.value = settings.crawlDelay || defaultSettings.crawlDelay;
      maxPagesInput.value = settings.maxPages || defaultSettings.maxPages;s.ignoreRobots;
      crawlDelayInput.value = settings.crawlDelay || defaultSettings.crawlDelay;
      ignoreRobotsToggle.checked = settings.ignoreRobots || defaultSettings.ignoreRobots;
      themeSelect.value = settings.theme || defaultSettings.theme;
      document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
      // Apply the current theme
      document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
    });
  }/ Function to save settings to storage
  function saveSettings() {
    const settings = {
      maxPages: parseInt(maxPagesInput.value, 10),
      crawlDelay: parseInt(crawlDelayInput.value, 10),
      ignoreRobots: ignoreRobotsToggle.checked,
      theme: themeSelect.value
    };

    chrome.storage.local.set({ settings }, function() {
      showToast('Settings saved successfully!');
      document.documentElement.setAttribute('data-theme', settings.theme);
      chrome.storage.local.set({ ignoreRobots: settings.ignoreRobots });
    });
  }

  // Update save on change for available inputs
  [maxPagesInput, crawlDelayInput, ignoreRobotsToggle, themeSelect].forEach(input =>
    input.addEventListener('change', saveSettings)
  );

  // Function to show a toast message
  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
});
