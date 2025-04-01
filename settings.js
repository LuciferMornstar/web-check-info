document.addEventListener('DOMContentLoaded', function() {
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

  function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('settings')) || defaultSettings;
    maxPagesInput.value = settings.maxPages;
    crawlDelayInput.value = settings.crawlDelay;
    ignoreRobotsToggle.checked = settings.ignoreRobots;
    themeSelect.value = settings.theme;
    document.documentElement.setAttribute('data-theme', settings.theme);
  }
  function saveSettings() {
    const settings = {
      maxPages: parseInt(maxPagesInput.value, 10),
      crawlDelay: parseInt(crawlDelayInput.value, 10),
      ignoreRobots: ignoreRobotsToggle.checked,
      theme: themeSelect.value
    };
    localStorage.setItem('settings', JSON.stringify(settings));
    showToast('Settings saved successfully!');
    document.documentElement.setAttribute('data-theme', settings.theme);
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
  loadSettings();
});
