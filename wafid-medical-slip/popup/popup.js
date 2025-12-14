// Minimal popup script to trigger DOM change on wafid.com

const btn = document.getElementById('changeMcBtn');
const result = document.getElementById('result');

btn?.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      result.textContent = 'No active tab.';
      return;
    }
    const url = tab.url || '';
    if (!/\.?(wafid)\.com/i.test(url)) {
      result.textContent = 'Open wafid.com to use this.';
      return;
    }
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'setChooseMc' });
    if (response && response.ok) {
      result.textContent = 'Updated: choose-mc set to "Choose mc done"';
    } else {
      result.textContent = response?.reason || 'Element not found.';
    }
  } catch (e) {
    result.textContent = 'Unable to communicate with the page. Try refreshing wafid.com.';
    // console.error(e);
  }
});
