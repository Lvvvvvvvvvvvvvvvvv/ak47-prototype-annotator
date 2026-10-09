chrome.action.onClicked.addListener(function(tab) {
  if (!tab.id) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  }).catch(function(error) {
    console.warn("Dsign 无法注入当前页面：", error);
  });
});
