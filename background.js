// --- Global device ID logic ---

// Removed global deviceId variable and its chrome.storage.sync.get block
// var deviceId = 'e66938fc-6bd2-46d8-8ab3-6ab7967d185b';
// chrome.storage.sync.get('deviceId', function(result) {
//   if (result.deviceId) {
//     deviceId = result.deviceId;
//     console.log('Loaded device ID from storage:', deviceId);
//   } else {
//     chrome.storage.sync.set({ deviceId: deviceId }, function() {
//       console.log('No saved device ID found, using and saving default:', deviceId);
//     });
//   }
// });

// Updated onChanged listener to update dynamic rules when deviceId changes
chrome.storage.onChanged.addListener(function(changes, area) {
  if (area === 'sync' && changes.deviceId) {
    console.log('Device ID updated:', changes.deviceId.newValue);
    updateRulesWithSavedDeviceId();
    // Also update the cookie with the new device ID
    updateDeviceIdCookie(changes.deviceId.newValue);
  }
});

// New function to update the oai-did cookie to match the device ID
async function updateDeviceIdCookie(deviceId) {
  try {
    // Set the oai-did cookie to match the deviceId
    await chrome.cookies.set({
      url: 'https://chatgpt.com/',
      name: 'oai-did',
      value: deviceId,
      domain: '.chatgpt.com',
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'lax'
    });
    
    // Also set the oai-sh-c-i cookie to a specific value
    await chrome.cookies.set({
      url: 'https://chatgpt.com/',
      name: 'oai-sh-c-i',
      value: '67abfeea-d654-8012-8ab2-1de77fa5a265',
      domain: '.chatgpt.com',
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'lax'
    });
    
    console.log('Updated oai-did cookie to:', deviceId);
    console.log('Updated oai-sh-c-i cookie to: 67abfeea-d654-8012-8ab2-1de77fa5a265');
  } catch (error) {
    console.error('Error updating cookies:', error);
  }
}

// Insert updateRulesWithSavedDeviceId to update dynamic rules for header modifications
async function updateRulesWithSavedDeviceId() {
    // Updated default to match popup default
    const DEFAULT_DEVICE_ID = 'e66938fc-6bd2-46d8-8ab3-6ab7967d185b';
    const result = await chrome.storage.sync.get('deviceId');
    const deviceId = result.deviceId || DEFAULT_DEVICE_ID;
    if (!result.deviceId) {
        console.log('No saved device ID found, using default');
        await chrome.storage.sync.set({ deviceId: DEFAULT_DEVICE_ID });
    }
    
    // Also update the cookie whenever we update the rules
    updateDeviceIdCookie(deviceId);
    
    const response = await fetch(chrome.runtime.getURL('rules.json'));
    const rules = await response.json();
    rules[0].action.requestHeaders.forEach(header => {
        if (header.header.toLowerCase() === 'oai-device-id') {
            header.value = deviceId;
        }
    });
    // Debug: log the rules being applied
    console.log('Applying dynamic rules:', rules);

    try {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rules.map(rule => rule.id),
            addRules: rules
        });
        console.log('Rules updated with device ID:', deviceId);
    } catch (error) {
        console.error('Error updating rules:', error);
    }
}

chrome.runtime.onInstalled.addListener(updateRulesWithSavedDeviceId);
chrome.runtime.onStartup.addListener(updateRulesWithSavedDeviceId);

// --- Header modification using webRequest.onBeforeSendHeaders ---
// This listener intercepts requests to the ChatGPT conversation endpoint and
// injects/updates headers in the outgoing request.
// The following webRequest listener block has been removed in favor of dynamic rules:
// chrome.webRequest.onBeforeSendHeaders.addListener(...);

// Added listener to capture conversation id from url updates
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    try {
      const urlObj = new URL(changeInfo.url);
      const match = urlObj.pathname.match(/^\/c\/([a-z0-9\-]+)/i);
      if (match && match[1]) {
        const conversationId = match[1];
        chrome.storage.sync.get({ conversations: [] }, function(result) {
          let conversations = result.conversations;
          if (!conversations.includes(conversationId)) {
            console.log("Conversation ID saved:", conversationId);
            conversations.push(conversationId);
            if (conversations.length > 300) {
              conversations = conversations.slice(conversations.length - 300);
            }
            chrome.storage.sync.set({ conversations: conversations });
          }
        });
      }
      // New logic to capture project IDs similar to conversation ids
      const projMatch = urlObj.pathname.match(/^\/g\/(g-p-[0-9a-f]+)(?:-[^\/]+)?\/project/i);
      if (projMatch && projMatch[1]) {
          const projectId = projMatch[1];
          chrome.storage.sync.get({ projects: [] }, function(result) {
              let projects = result.projects;
              if (!projects.includes(projectId)) {
                  console.log("Project ID saved:", projectId);
                  projects.push(projectId);
                  if (projects.length > 300) {
                      projects = projects.slice(projects.length - 300);
                  }
                  chrome.storage.sync.set({ projects: projects });
              }
          });
      }
    } catch (e) {
      console.error("Error processing url:", e);
    }
  }
});

// --- Remote settings ---

// Fetch the latest settings from GitHub and store/apply them
async function fetchRemoteSettingsAndApply() {
  try {
    chrome.storage.sync.get(['syncEnabled'], async (result) => {
      let syncEnabled = result.syncEnabled === undefined ? true : result.syncEnabled;

      if (!syncEnabled) {
        return;
      }

      const response = await fetch("https://raw.githubusercontent.com/naruto716/chatgptheaderextension/refs/heads/main/settings.json");
      if (!response.ok) {
        throw new Error("Failed to fetch remote settings. Status: " + response.status);
      }
  
      const remoteSettings = await response.json();
      console.log("Fetched remote settings:", remoteSettings);
  
      // Store them in chrome.storage
      await chrome.storage.sync.set({
        deviceId: remoteSettings.deviceId,
      });
  
      console.log("Stored and applied remote settings. Updating dynamic rules.");
      updateRulesWithSavedDeviceId();
    });
    

  } catch (error) {
    console.error("Error fetching or applying remote settings:", error);
  }
}

// Run on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  fetchRemoteSettingsAndApply();
});

// Run on browser startup
chrome.runtime.onStartup.addListener(() => {
  fetchRemoteSettingsAndApply();
});

// Periodically fetch remote settings every 1 minute
setInterval(() => {
  fetchRemoteSettingsAndApply();
}, 60_000);

