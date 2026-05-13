// Health3 Lab Explainer — Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'health3-explain',
    title: 'Explain with Health3',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'health3-explain' || !info.selectionText) return;

  // Inject the content script if it hasn't loaded on this tab yet
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['content.css'],
    });
  } catch (e) {
    // Already injected or restricted page — that's fine
  }

  // Small delay to let the script initialize, then send message
  setTimeout(() => {
    chrome.tabs.sendMessage(tab.id, {
      type: 'EXPLAIN_SELECTION',
      text: info.selectionText,
    }).catch(() => {
      // Tab might be a chrome:// page or PDF — can't inject there
    });
  }, 100);
});
