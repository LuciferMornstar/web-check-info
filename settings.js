import Amplify from 'aws-amplify';
// Dynamically import the correct aws-exports file
import awsExports from './aws-exports';
Amplify.configure(awsExports);

document.addEventListener('DOMContentLoaded', async function() {
  const maxPagesInput = document.getElementById('maxPages');
  const crawlDelayInput = document.getElementById('crawlDelay');
  const ignoreRobotsToggle = document.getElementById('ignoreRobots');
  const themeSelect = document.getElementById('themeSelect');
  const defaultSettings = {
    maxPages: 20,
    crawlDelay: 300,
    ignoreRobots: false,
    theme: 'dark'
  };

  async function loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('settings')) || defaultSettings;
      maxPagesInput.value = settings.maxPages || defaultSettings.maxPages;
      crawlDelayInput.value = settings.crawlDelay || defaultSettings.crawlDelay;
      ignoreRobotsToggle.checked = settings.ignoreRobots !== undefined ? settings.ignoreRobots : defaultSettings.ignoreRobots;
      themeSelect.value = settings.theme || defaultSettings.theme;
      document.documentElement.setAttribute('data-theme', settings.theme || defaultSettings.theme);
      console.log("Settings loaded:", settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      maxPagesInput.value = defaultSettings.maxPages;
      crawlDelayInput.value = defaultSettings.crawlDelay;
      ignoreRobotsToggle.checked = defaultSettings.ignoreRobots;
      themeSelect.value = defaultSettings.theme;
      document.documentElement.setAttribute('data-theme', defaultSettings.theme);
    }
  }

  async function saveSettings() {
    try {
      const maxPages = parseInt(maxPagesInput.value, 10);
      const crawlDelay = parseInt(crawlDelayInput.value, 10);
      if (isNaN(maxPages) || isNaN(crawlDelay)) throw new Error("Invalid number entered.");
      const settings = {
        maxPages,
        crawlDelay,
        ignoreRobots: ignoreRobotsToggle.checked,
        theme: themeSelect.value
      };
      localStorage.setItem('settings', JSON.stringify(settings));
      showToast('Settings saved successfully!');
      document.documentElement.setAttribute('data-theme', settings.theme);
      console.log("Settings saved:", settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings!');
    }
  }

  [maxPagesInput, crawlDelayInput, ignoreRobotsToggle, themeSelect].forEach(input =>
    input.addEventListener('change', saveSettings)
  );

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
  }

  await loadSettings();
});
