// This script runs in the context of web pages
console.log('%c FocusGuard content script loaded! ', 'background: #3498db; color: white; font-size: 14px; font-weight: bold; padding: 5px;');

// Add a debug flag that can be toggled for detailed logging
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log('%c[FocusGuard]', 'color: #3498db; font-weight: bold;', ...args);
  }
}

// Heartbeat to show the content script is still alive - reduced to once per minute
let heartbeatCounter = 0;
const heartbeatInterval = setInterval(() => {
  debugLog(`Content script heartbeat #${++heartbeatCounter}`);
  
  // Test message communication with background script every 5 heartbeats (i.e., every 5 minutes)
  if (heartbeatCounter % 5 === 0) {
    debugLog('Sending ping to background script...');
    chrome.runtime.sendMessage({
      action: 'ping',
      source: 'content_script',
      timestamp: Date.now()
    }).then(response => {
      debugLog('Ping response received:', response);
    }).catch(error => {
      console.error('Error sending ping:', error);
    });
  }
}, 60000); // Changed from 10000 (10 seconds) to 60000 (1 minute)

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  debugLog('Content script received message:', message);
  
  if (message.action === 'showCategory') {
    showCategoryIndicator(message.category, message.isRelated);
    sendResponse({received: true, status: 'showing category'});
    return true; // Indicates we'll handle the response asynchronously
  }
  
  if (message.action === 'ping') {
    debugLog('Ping received from background script');
    sendResponse({pong: true, timestamp: Date.now()});
    return true;
  }
});

// Function to show category indicator overlay
function showCategoryIndicator(category, isRelated) {
  debugLog(`Showing category indicator: ${category}, isRelated: ${isRelated}`);
  // Remove any existing indicator
  const existingIndicator = document.getElementById('focusguard-category-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // Create indicator element
  const indicator = document.createElement('div');
  indicator.id = 'focusguard-category-indicator';
  indicator.style.position = 'fixed';
  indicator.style.top = '10px';
  indicator.style.right = '10px';
  indicator.style.padding = '8px 12px';
  indicator.style.borderRadius = '5px';
  indicator.style.zIndex = '9999';
  indicator.style.fontFamily = 'Arial, sans-serif';
  indicator.style.fontSize = '14px';
  indicator.style.fontWeight = 'bold';
  indicator.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  indicator.style.transition = 'opacity 0.5s';
  
  // Set color based on relevance
  if (isRelated) {
    indicator.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';  // Green
    indicator.style.color = 'white';
  } else {
    indicator.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';  // Red
    indicator.style.color = 'white';
  }
  
  // Set content
  indicator.textContent = `Category: ${category}`;
  
  // Add to page
  document.body.appendChild(indicator);
  debugLog('Category indicator added to page');
  
  // Fade out after 5 seconds
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => {
      indicator.remove();
      debugLog('Category indicator removed');
    }, 500);
  }, 5000);
}

// Send message to background script to notify it's loaded
debugLog('Sending contentScriptLoaded message to background script...');
chrome.runtime.sendMessage({
  action: 'contentScriptLoaded',
  url: window.location.href,
  timestamp: Date.now()
}).then(response => {
  debugLog('contentScriptLoaded response received:', response);
}).catch(error => {
  console.error('Error sending contentScriptLoaded message:', error);
});

// Clean up when the content script is unloaded (page refresh/navigation)
window.addEventListener('beforeunload', () => {
  clearInterval(heartbeatInterval);
  debugLog('Content script unloading...');
});