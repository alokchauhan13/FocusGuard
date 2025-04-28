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
    
    // If content is not related, show the mask
    if (!message.isRelated) {
      showFocusGuardMask();
    }
    
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

// Function to create and show the mask for unrelated content
function showFocusGuardMask() {
  debugLog('Showing FocusGuard mask for unrelated content');
  
  // Remove any existing mask
  removeFocusGuardMask();
  
  // Create mask container
  const maskContainer = document.createElement('div');
  maskContainer.id = 'focusguard-mask-container';
  maskContainer.style.position = 'fixed';
  maskContainer.style.top = '0';
  maskContainer.style.left = '0';
  maskContainer.style.width = '100%';
  maskContainer.style.height = '100%';
  maskContainer.style.zIndex = '2147483647'; // Maximum z-index
  maskContainer.style.display = 'flex';
  maskContainer.style.flexDirection = 'column';
  maskContainer.style.justifyContent = 'center';
  maskContainer.style.alignItems = 'center';
  maskContainer.style.pointerEvents = 'auto';
  
  // Create the mask overlay with gradient of purple, red and yellow
  const maskOverlay = document.createElement('div');
  maskOverlay.id = 'focusguard-mask-overlay';
  maskOverlay.style.position = 'absolute';
  maskOverlay.style.top = '0';
  maskOverlay.style.left = '0';
  maskOverlay.style.width = '100%';
  maskOverlay.style.height = '100%';
  maskOverlay.style.background = 'linear-gradient(135deg, rgba(128, 0, 128, 0.5), rgba(255, 0, 0, 0.5), rgba(255, 255, 0, 0.5))';
  maskOverlay.style.opacity = '0.3';
  maskOverlay.style.pointerEvents = 'auto';
  
  // Create label above mask
  const maskLabel = document.createElement('div');
  maskLabel.id = 'focusguard-mask-label';
  maskLabel.style.position = 'relative';
  maskLabel.style.color = 'white';
  maskLabel.style.fontSize = '24px';
  maskLabel.style.fontWeight = 'bold';
  maskLabel.style.textAlign = 'center';
  maskLabel.style.padding = '10px';
  maskLabel.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
  maskLabel.style.zIndex = '2147483648';
  maskLabel.style.margin = '0 0 20px 0';
  maskLabel.textContent = 'Masked by FocusGuard';
  
  // Create remove button
  const removeButton = document.createElement('button');
  removeButton.id = 'focusguard-mask-remove-button';
  removeButton.style.position = 'relative';
  removeButton.style.zIndex = '2147483648';
  removeButton.style.padding = '10px 20px';
  removeButton.style.fontSize = '18px';
  removeButton.style.fontWeight = 'bold';
  removeButton.style.backgroundColor = 'white';
  removeButton.style.color = '#333';
  removeButton.style.border = 'none';
  removeButton.style.borderRadius = '5px';
  removeButton.style.cursor = 'pointer';
  removeButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
  removeButton.textContent = 'Remove Mask';
  
  // Add click event to remove the mask
  removeButton.addEventListener('click', removeFocusGuardMask);
  
  // Assemble the mask components
  maskContainer.appendChild(maskOverlay);
  maskContainer.appendChild(maskLabel);
  maskContainer.appendChild(removeButton);
  
  // Add to page
  document.body.appendChild(maskContainer);
  debugLog('FocusGuard mask added to page');
  
  // Also log to console to ensure visibility
  console.log('%c FocusGuard mask applied - This content is not related to your planned activities ', 'background: #9b30ff; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
}

// Function to remove the mask
function removeFocusGuardMask() {
  const existingMask = document.getElementById('focusguard-mask-container');
  if (existingMask) {
    existingMask.remove();
    debugLog('FocusGuard mask removed');
  }
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
  removeFocusGuardMask();
  debugLog('Content script unloading...');
});