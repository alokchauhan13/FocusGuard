document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const activity1Input = document.getElementById('activity1');
  const activity2Input = document.getElementById('activity2');
  const durationInput = document.getElementById('duration');
  const durationUnitSelect = document.getElementById('durationUnit');
  const guardBtn = document.getElementById('guardBtn');
  const statusElement = document.getElementById('status');
  const categoryElement = document.getElementById('category');
  const wordCountElements = document.querySelectorAll('.word-count');

  let isMonitoring = false;
  
  // Load saved data
  chrome.storage.local.get(['apiKey', 'activity1', 'activity2', 'isMonitoring', 'categoryValue', 'categoryStatus'], function(result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    if (result.activity1) {
      activity1Input.value = result.activity1;
      updateWordCount(activity1Input, wordCountElements[0]);
    }
    if (result.activity2) {
      activity2Input.value = result.activity2;
      updateWordCount(activity2Input, wordCountElements[1]);
    }
    
    if (result.isMonitoring) {
      isMonitoring = result.isMonitoring;
      setMonitoringState(true);
    }
    
    if (result.categoryValue) {
      categoryElement.textContent = result.categoryValue;
      if (result.categoryStatus) {
        categoryElement.className = 'category-value ' + result.categoryStatus;
      }
    }
  });

  // Toggle API key visibility
  toggleApiKeyBtn.addEventListener('click', function() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.textContent = '🔒';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.textContent = '👁️';
    }
  });

  // Word count for activity descriptions
  activity1Input.addEventListener('input', function() {
    updateWordCount(this, wordCountElements[0]);
  });

  activity2Input.addEventListener('input', function() {
    updateWordCount(this, wordCountElements[1]);
  });

  function updateWordCount(textarea, countElement) {
    const text = textarea.value;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    countElement.textContent = `${wordCount}/100 words`;
    
    // Limit to 100 words
    if (wordCount > 100) {
      const words = text.trim().split(/\s+/);
      textarea.value = words.slice(0, 100).join(' ');
      updateWordCount(textarea, countElement);
    }
  }

  // Guard button functionality
  guardBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    const activity1 = activity1Input.value.trim();
    const activity2 = activity2Input.value.trim();
    const duration = parseInt(durationInput.value);
    const durationUnit = durationUnitSelect.value;
    
    if (!apiKey) {
      alert('Please enter a Google Gemini API key.');
      return;
    }
    
    if (!activity1 && !activity2) {
      alert('Please enter at least one activity description.');
      return;
    }
    
    if (isNaN(duration) || duration <= 0) {
      alert('Please enter a valid duration.');
      return;
    }

    isMonitoring = !isMonitoring;
    setMonitoringState(isMonitoring);
    
    // Save data to storage
    chrome.storage.local.set({
      apiKey: apiKey,
      activity1: activity1,
      activity2: activity2,
      isMonitoring: isMonitoring,
      startTime: isMonitoring ? Date.now() : null,
      endTime: isMonitoring ? calculateEndTime(duration, durationUnit) : null
    });

    // Send message to background script
    chrome.runtime.sendMessage({
      action: isMonitoring ? 'startMonitoring' : 'stopMonitoring',
      apiKey: apiKey,
      activity1: activity1,
      activity2: activity2,
      duration: duration,
      durationUnit: durationUnit
    });
  });

  function setMonitoringState(monitoring) {
    isMonitoring = monitoring;
    
    if (isMonitoring) {
      guardBtn.textContent = 'Stop Guarding';
      guardBtn.classList.add('active');
      statusElement.textContent = 'Monitoring';
      
      // Make inputs readonly
      apiKeyInput.readOnly = true;
      activity1Input.readOnly = true;
      activity2Input.readOnly = true;
      durationInput.readOnly = true;
      durationUnitSelect.disabled = true;
    } else {
      guardBtn.textContent = 'Guard';
      guardBtn.classList.remove('active');
      statusElement.textContent = 'Not Monitoring';
      categoryElement.textContent = 'Not Evaluated';
      categoryElement.className = 'category-value';
      
      // Make inputs editable
      apiKeyInput.readOnly = false;
      activity1Input.readOnly = false;
      activity2Input.readOnly = false;
      durationInput.readOnly = false;
      durationUnitSelect.disabled = false;
    }
  }

  function calculateEndTime(duration, unit) {
    const now = Date.now();
    const milliseconds = duration * (unit === 'hours' ? 60 * 60 * 1000 : 60 * 1000);
    return now + milliseconds;
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === 'updateCategory') {
      categoryElement.textContent = message.category;
      categoryElement.className = 'category-value ' + (message.isRelated ? 'related' : 'unrelated');
      
      // Save category information
      chrome.storage.local.set({
        categoryValue: message.category,
        categoryStatus: message.isRelated ? 'related' : 'unrelated'
      });
    }
    
    if (message.action === 'monitoringExpired') {
      setMonitoringState(false);
      chrome.storage.local.set({ isMonitoring: false });
    }
  });
});