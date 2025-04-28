console.log('%c FocusGuard Debug Logs Enabled ', 'background: #4CAF50; color: white; font-size: 16px; font-weight: bold; padding: 8px;');

let isMonitoring = false;
let apiKey = '';
let activity1 = '';
let activity2 = '';
let monitoringTimer = null;
let evaluatedTabs = new Set();
let initializedTabs = new Set(); // Track tabs where content script is initialized

// Add a debug flag that can be toggled for detailed logging
const DEBUG = true; // Ensure this is set to true

// Debug logging function
function debugLog(...args) {
  if (DEBUG) {
    console.log('%c[FocusGuard BG]', 'color: #e74c3c; font-weight: bold;', ...args);
  }
}

// Immediate test of debug logging
debugLog('Debug logging is working!');

// Log when background script starts
console.log('%c FocusGuard background script started! ', 'background: #e74c3c; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
debugLog('Background script initialized');

// Check if monitoring is already active when the background script starts
chrome.storage.local.get(['isMonitoring', 'apiKey', 'activity1', 'activity2', 'endTime'], function(result) {
  if (result.isMonitoring) {
    isMonitoring = true;
    apiKey = result.apiKey;
    activity1 = result.activity1;
    activity2 = result.activity2;
    
    if (result.endTime) {
      const timeLeft = result.endTime - Date.now();
      if (timeLeft > 0) {
        debugLog(`Resuming monitoring with ${Math.round(timeLeft/1000)} seconds left`);
        monitoringTimer = setTimeout(() => stopMonitoring(), timeLeft);
      } else {
        debugLog('Monitoring period has expired, stopping');
        stopMonitoring();
      }
    }
  }
  debugLog('Startup state:', { isMonitoring, apiKey: apiKey ? 'set' : 'not set' });
});

// Heartbeat to show the background script is still alive - reduced to once per minute
let heartbeatCounter = 0;
setInterval(() => {
  debugLog(`Background script heartbeat #${++heartbeatCounter}`);
  
  // Every 5 heartbeats, ping all initialized content scripts (i.e., every 5 minutes)
  if (heartbeatCounter % 5 === 0 && initializedTabs.size > 0) {
    debugLog(`Pinging ${initializedTabs.size} initialized tabs...`);
    initializedTabs.forEach(tabId => {
      chrome.tabs.sendMessage(tabId, {
        action: 'ping', 
        source: 'background_script',
        timestamp: Date.now()
      }).then(response => {
        debugLog(`Tab ${tabId} responded to ping:`, response);
      }).catch(error => {
        debugLog(`Tab ${tabId} failed to respond to ping, removing from initialized tabs`);
        initializedTabs.delete(tabId);
      });
    });
  }
}, 60000); // Changed from 10000 (10 seconds) to 60000 (1 minute)

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  debugLog('Received message:', message, 'from sender:', sender);
  
  if (message.action === 'startMonitoring') {
    startMonitoring(message.apiKey, message.activity1, message.activity2, message.duration, message.durationUnit);
    sendResponse({status: "monitoring started"});
  } else if (message.action === 'stopMonitoring') {
    stopMonitoring();
    sendResponse({status: "monitoring stopped"});
  } else if (message.action === 'contentScriptLoaded') {
    debugLog('Content script loaded in tab with URL:', message.url);
    // Track that this tab has the content script initialized
    if (sender.tab && sender.tab.id) {
      const tabId = sender.tab.id;
      initializedTabs.add(tabId);
      debugLog(`Tab ${tabId} added to initialized tabs. Total initialized tabs: ${initializedTabs.size}`);
      
      // If we're monitoring and we have a category for this tab already, send it immediately
      if (isMonitoring && evaluatedTabs.has(tabId)) {
        chrome.storage.local.get(['categoryValue', 'categoryStatus'], function(result) {
          if (result.categoryValue && result.categoryStatus) {
            debugLog(`Sending cached category data to newly initialized tab ${tabId}`);
            chrome.tabs.sendMessage(tabId, {
              action: 'showCategory',
              category: result.categoryValue,
              isRelated: result.categoryStatus === 'related'
            }).then(response => {
              debugLog(`Tab ${tabId} received category data:`, response);
            }).catch(error => {
              debugLog(`Error sending category to newly loaded content script:`, error);
            });
          }
        });
      }
    }
    sendResponse({status: "content script registered", tabCount: initializedTabs.size});
  } else if (message.action === 'ping') {
    debugLog('Ping received from', message.source || 'unknown source');
    sendResponse({
      pong: true, 
      timestamp: Date.now(), 
      monitoring: isMonitoring,
      initializedTabsCount: initializedTabs.size,
      evaluatedTabsCount: evaluatedTabs.size
    });
  }
  
  // Return true to indicate we'll send a response asynchronously
  return true;
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (isMonitoring && changeInfo.status === 'complete') {
    debugLog(`Tab ${tabId} updated with URL: ${tab.url}`);
    // Wait for 30 seconds before evaluating the page content
    const waitTime = 30000; // 30 seconds as per requirements
    
    debugLog(`Will evaluate tab ${tabId} in ${waitTime/1000} seconds`);
    setTimeout(() => {
      if (isMonitoring && !evaluatedTabs.has(tabId)) {
        evaluatePageContent(tabId, tab.url);
      }
    }, waitTime);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(function(activeInfo) {
  if (isMonitoring) {
    debugLog(`Tab ${activeInfo.tabId} activated`);
    chrome.tabs.get(activeInfo.tabId, function(tab) {
      // When a tab is activated, check if it needs evaluation
      // Wait for 30 seconds before evaluating (unless already evaluated)
      if (!evaluatedTabs.has(activeInfo.tabId)) {
        const waitTime = 30000; // 30 seconds
        
        debugLog(`Will evaluate active tab ${activeInfo.tabId} in ${waitTime/1000} seconds`);
        setTimeout(() => {
          if (isMonitoring && !evaluatedTabs.has(activeInfo.tabId)) {
            evaluatePageContent(activeInfo.tabId, tab.url);
          }
        }, waitTime);
      } else {
        debugLog(`Tab ${activeInfo.tabId} already evaluated, skipping`);
      }
    });
  }
});

// Listen for tab removal to cleanup our sets
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (initializedTabs.has(tabId)) {
    debugLog(`Tab ${tabId} was closed, removing from initialized tabs`);
    initializedTabs.delete(tabId);
  }
  if (evaluatedTabs.has(tabId)) {
    debugLog(`Tab ${tabId} was closed, removing from evaluated tabs`);
    evaluatedTabs.delete(tabId);
  }
});

function startMonitoring(key, act1, act2, duration, durationUnit) {
  debugLog('Starting monitoring...', {
    apiKeyProvided: !!key,
    activity1Words: act1 ? act1.split(/\s+/).length : 0,
    activity2Words: act2 ? act2.split(/\s+/).length : 0,
    duration,
    durationUnit
  });
  
  isMonitoring = true;
  apiKey = key;
  activity1 = act1;
  activity2 = act2;
  
  // When monitoring starts, clear the evaluatedTabs set to force reevaluation
  evaluatedTabs.clear();
  debugLog('Cleared evaluated tabs to force reevaluation');
  
  // Calculate when monitoring should end
  const durationMs = duration * (durationUnit === 'hours' ? 60 * 60 * 1000 : 60 * 1000);
  const endTime = Date.now() + durationMs;
  
  debugLog(`Monitoring will end at ${new Date(endTime).toLocaleTimeString()}`);
  
  // Clear any existing timer
  if (monitoringTimer) {
    clearTimeout(monitoringTimer);
  }
  
  // Set timer to automatically stop monitoring after the specified duration
  monitoringTimer = setTimeout(() => stopMonitoring(), durationMs);
  
  // Save monitoring state to storage
  chrome.storage.local.set({
    isMonitoring: true,
    apiKey: apiKey,
    activity1: activity1,
    activity2: activity2, 
    startTime: Date.now(),
    endTime: endTime
  });
  
  // Get all currently open tabs and schedule them for evaluation
  chrome.tabs.query({}, function(tabs) {
    debugLog(`Found ${tabs.length} open tabs to schedule for evaluation`);
    
    tabs.forEach(tab => {
      // Evaluate each tab after 30 seconds
      const waitTime = 30000; // 30 seconds
      
      setTimeout(() => {
        if (isMonitoring && !evaluatedTabs.has(tab.id)) {
          debugLog(`Evaluating tab ${tab.id} after guarding started`);
          evaluatePageContent(tab.id, tab.url);
        }
      }, waitTime);
    });
  });
  
  // For all initialized tabs, send a message that monitoring has started
  initializedTabs.forEach(tabId => {
    chrome.tabs.sendMessage(tabId, {
      action: 'monitoringStarted'
    }).catch(error => {
      debugLog(`Error notifying tab ${tabId} about monitoring start:`, error);
    });
  });
}

function stopMonitoring() {
  debugLog('Stopping monitoring...');
  isMonitoring = false;
  if (monitoringTimer) {
    clearTimeout(monitoringTimer);
    monitoringTimer = null;
  }
  evaluatedTabs.clear();
  
  // Notify popup that monitoring has ended
  chrome.runtime.sendMessage({
    action: 'monitoringExpired'
  }).catch(err => {
    debugLog('Error sending monitoringExpired message to popup:', err);
  });
  
  // Update storage
  chrome.storage.local.set({
    isMonitoring: false,
    endTime: null
  });
  
  // For all initialized tabs, send a message that monitoring has stopped
  initializedTabs.forEach(tabId => {
    chrome.tabs.sendMessage(tabId, {
      action: 'monitoringStopped'
    }).catch(error => {
      debugLog(`Error notifying tab ${tabId} about monitoring stop:`, error);
    });
  });
}

async function evaluatePageContent(tabId, url) {
  if (!isMonitoring || !apiKey) return;
  
  try {
    debugLog(`Evaluating content for tab ${tabId} with URL ${url}`);
    
    // Get page title
    let pageTitle = '';
    try {
      const tab = await new Promise((resolve) => chrome.tabs.get(tabId, resolve));
      pageTitle = tab.title;
      debugLog(`Page title: ${pageTitle}`);
    } catch (error) {
      console.error('Error getting tab info:', error);
      return;
    }
    
    // Extract content from the page
    let pageContent = '';
    try {
      debugLog(`Executing content script in tab ${tabId} to extract page content...`);
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: extractPageContent
      });
      pageContent = result.result;
      debugLog(`Page content extracted successfully (${pageContent.length} characters)`);
    } catch (error) {
      console.error('Error executing script:', error);
      debugLog(`Failed to extract content from tab ${tabId}:`, error);
      return;
    }
    
    // Prepare data for API
    const isYouTube = url.includes('youtube.com');
    let prompt = '';
    
    if (isYouTube) {
      prompt = `As FocusGuard, I'm monitoring the relevance of web content to user's planned activities.

YouTube Content Analysis:
Title: ${pageTitle}
URL: ${url}
Content: ${pageContent}

User's Planned Activities:
Activity 1: ${activity1}
Activity 2: ${activity2}

Instructions:
1. Determine the exact category of this YouTube content from this list:
E-commerce, News, Social Media, Educational, Entertainment, Health and Fitness, Finance and Investment, Travel and Tourism, Technology and Gadgets, Lifestyle and Fashion, Food and Recipes, Automotive, Real Estate, Gaming, Music and Arts, Bank, Learning platforms, College or University, Search Engines, Chatbots and AI Assistants, Online Calculators and Converters, Weather Forecast Sites, Maps and Navigation, Forums and Communities, Webmail Services, Project Management Tools, Video Conferencing Platforms, CRM Software Websites, Marketing Automation Platforms, ERP/Business Management Sites, Job Portals, Freelancing Platforms, Legal Services, Event Booking Platforms, Conferences and Webinars, Wikis and Encyclopedias, Review Aggregators, Scientific Research Platforms, API Marketplaces, Software Documentation Sites, Online Marketplaces, B2B Portals, Government Websites, Charity and Fundraising Sites, Dating Websites, Parenting and Kids Sites, Pet Care and Adoption Sites, AI-generated Content Platforms, Blockchain and Crypto Websites, Virtual Reality and Metaverse Platforms

2. Determine if this content is relevant to the user's planned activities.
Note: Content belonging to these categories should always be considered relevant regardless of specific content: Educational, Learning platforms, College or University, Scientific Research Platforms, Wikis and Encyclopedias, Project Management Tools, Software Documentation Sites, AI-generated Content Platforms, Bank, Finance and Investment, Government Websites.

Respond in this format only:
Category: [exact category name from the list]
IsRelated: [Yes/No]
Explanation: [brief explanation of why the content is related or unrelated to the user's activities]`;
    } else {
      prompt = `As FocusGuard, I'm monitoring the relevance of web content to user's planned activities.

Web Content Analysis:
Title: ${pageTitle}
URL: ${url}
Content: ${pageContent}

User's Planned Activities:
Activity 1: ${activity1}
Activity 2: ${activity2}

Instructions:
1. Determine the exact category of this website from this list:
E-commerce, News, Social Media, Educational, Entertainment, Health and Fitness, Finance and Investment, Travel and Tourism, Technology and Gadgets, Lifestyle and Fashion, Food and Recipes, Automotive, Real Estate, Gaming, Music and Arts, Bank, Learning platforms, College or University, Search Engines, Chatbots and AI Assistants, Online Calculators and Converters, Weather Forecast Sites, Maps and Navigation, Forums and Communities, Webmail Services, Project Management Tools, Video Conferencing Platforms, CRM Software Websites, Marketing Automation Platforms, ERP/Business Management Sites, Job Portals, Freelancing Platforms, Legal Services, Event Booking Platforms, Conferences and Webinars, Wikis and Encyclopedias, Review Aggregators, Scientific Research Platforms, API Marketplaces, Software Documentation Sites, Online Marketplaces, B2B Portals, Government Websites, Charity and Fundraising Sites, Dating Websites, Parenting and Kids Sites, Pet Care and Adoption Sites, AI-generated Content Platforms, Blockchain and Crypto Websites, Virtual Reality and Metaverse Platforms

2. Determine if this content is relevant to the user's planned activities.
Note: Content belonging to these categories should always be considered relevant regardless of specific content: Educational, Learning platforms, College or University, Scientific Research Platforms, Wikis and Encyclopedias, Project Management Tools, Software Documentation Sites, AI-generated Content Platforms, Bank, Finance and Investment, Government Websites.

Respond in this format only:
Category: [exact category name from the list]
IsRelated: [Yes/No]
Explanation: [brief explanation of why the content is related or unrelated to the user's activities]`;
    }
    
    // Log the full prompt for debugging
    console.log('FocusGuard Prompt Input:', prompt);
    
    // Call Google Gemini API
    debugLog('Calling Google Gemini API...');
    const response = await callGeminiAPI(apiKey, prompt);
    console.log('FocusGuard Prompt Output:', response);
    
    // Process the API response
    const category = extractCategory(response);
    const isRelated = isContentRelated(response);
    debugLog(`Extracted category: "${category}", IsRelated: ${isRelated}`);
    
    // Store the evaluation result in a table
    storeEvaluationResult(url, category, isRelated);
    
    // Add to evaluated tabs
    evaluatedTabs.add(tabId);
    debugLog(`Tab ${tabId} marked as evaluated. Total evaluated tabs: ${evaluatedTabs.size}`);
    
    // Send results to popup
    chrome.runtime.sendMessage({
      action: 'updateCategory',
      category: category,
      isRelated: isRelated
    }).then(() => {
      debugLog('Category update sent to popup');
    }).catch(err => {
      debugLog('Error sending message to popup:', err);
    });
    
    // Save results in storage
    chrome.storage.local.set({
      categoryValue: category,
      categoryStatus: isRelated ? 'related' : 'unrelated',
      lastEvaluatedTabId: tabId,
      lastEvaluatedUrl: url,
      lastEvaluatedTime: Date.now()
    });
    
    // Send message to content script to show visual indicator
    if (initializedTabs.has(tabId)) {
      debugLog(`Sending category update to content script in tab ${tabId}`);
      chrome.tabs.sendMessage(tabId, {
        action: 'showCategory',
        category: category,
        isRelated: isRelated
      }).then(response => {
        debugLog(`Content script in tab ${tabId} received category update:`, response);
      }).catch(error => {
        debugLog(`Error sending category update to content script in tab ${tabId}:`, error);
        
        // If we get an error, the content script might have been unloaded
        // Remove it from our initialized tabs list
        initializedTabs.delete(tabId);
      });
    } else {
      debugLog(`Tab ${tabId} not initialized with content script. Will not show indicator until tab is refreshed.`);
    }
    
  } catch (error) {
    console.error('Evaluation error:', error);
    debugLog('Error during page evaluation:', error);
  }
}

// Extract page content function to be executed in the content script context
function extractPageContent() {
  console.log('%c[FocusGuard Extract]', 'color: #3498db; font-weight: bold;', 'Extracting page content...');
  // Check if it's YouTube
  const isYouTube = window.location.href.includes('youtube.com');
  
  if (isYouTube) {
    // Special handling for YouTube
    let content = '';
    
    // Get video title
    const videoTitle = document.querySelector('h1.title')?.textContent || '';
    content += 'Video Title: ' + videoTitle + '\n\n';
    
    // Get video description
    const videoDescription = document.querySelector('div#description')?.textContent || '';
    content += 'Video Description: ' + videoDescription + '\n\n';
    
    // Get comments if available
    const comments = Array.from(document.querySelectorAll('ytd-comment-renderer #content-text')).slice(0, 5);
    if (comments.length > 0) {
      content += 'Top Comments:\n';
      comments.forEach((comment, index) => {
        content += `${index + 1}. ${comment.textContent.trim()}\n`;
      });
    }
    
    return content;
  } else {
    // Regular webpage content extraction
    // Get main content (prioritize article content or main visible text)
    const article = document.querySelector('article');
    const main = document.querySelector('main');
    const body = document.body;
    
    let mainElement = article || main || body;
    
    // Extract text content, limit to reasonable size
    const textContent = mainElement.textContent.trim().replace(/\s+/g, ' ').substring(0, 5000);
    
    // Get meta description
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    
    return `Page Content Summary:
Meta Description: ${metaDescription}
Content: ${textContent}`;
  }
}

async function callGeminiAPI(apiKey, prompt) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.error('API call error:', error);
    return 'Error: ' + error.message;
  }
}

function extractCategory(response) {
    // Extract category from the response
    const categoryMatch = response.match(/Category:\s*([A-Za-z\s&]+)/i);
    if (categoryMatch && categoryMatch[1]) {
        // Remove any trailing " IsRelated" from the category
        return categoryMatch[1].replace(/\s*IsRelated$/, '').trim();
    }
    return 'Unknown';
}

function isContentRelated(response) {
  // Extract isRelated from the response
  const relatedMatch = response.match(/IsRelated:\s*(Yes|No)/i);
  if (relatedMatch && relatedMatch[1]) {
    return relatedMatch[1].toLowerCase() === 'yes';
  }
  return false;
}

// Store the evaluation result in a table in chrome.storage
function storeEvaluationResult(url, category, isRelated) {
  chrome.storage.local.get(['evaluationResults'], function(result) {
    let evaluationResults = result.evaluationResults || {};
    evaluationResults[url] = { 
      category: category, 
      isRelated: isRelated,
      timestamp: Date.now() 
    };
    
    chrome.storage.local.set({ evaluationResults: evaluationResults });
    debugLog(`Stored evaluation result for URL: ${url}`);
  });
}