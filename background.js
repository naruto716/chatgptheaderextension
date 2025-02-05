// --- Global device ID logic ---

// Set a default device id (as in your previous rules.json)
var deviceId = '3ac29ce5-b60f-4795-bd05-50f8a5eef871';

// Load a saved device id or use the default
chrome.storage.sync.get('deviceId', function(result) {
  if (result.deviceId) {
    deviceId = result.deviceId;
    console.log('Loaded device ID from storage:', deviceId);
  } else {
    chrome.storage.sync.set({ deviceId: deviceId }, function() {
      console.log('No saved device ID found, using and saving default:', deviceId);
    });
  }
});

// Listen for changes to update the device ID
chrome.storage.onChanged.addListener(function(changes, area) {
  if (area === 'sync' && changes.deviceId) {
    deviceId = changes.deviceId.newValue;
    console.log('Device ID updated:', deviceId);
  }
});

// --- Header modification using webRequest.onBeforeSendHeaders ---
// This listener intercepts requests to the ChatGPT conversation endpoint and
// injects/updates headers in the outgoing request.
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    const headers = details.requestHeaders;
    
    for (let i = 0; i < headers.length; i++) {
      const headerName = headers[i].name.toLowerCase();

      // Existing headers (example)
      if (headerName === 'oai-device-id') {
        headers[i].value = deviceId;  // already defined in your code
      }
      if (headerName === 'oai-language') {
        headers[i].value = 'en-US';
      }
      if (headerName === 'user-agent') {
        headers[i].value =
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/132.0.0.0 Safari/537.36';
      }

      // Only overwrite if these headers are already in the request:
      if (headerName === 'sec-ch-ua') {
        headers[i].value = '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"';
      }
      if (headerName === 'sec-ch-ua-arch') {
        headers[i].value = '"arm"';
      }
      if (headerName === 'sec-ch-ua-bitness') {
        headers[i].value = '"64"';
      }
      if (headerName === 'sec-ch-ua-full-version') {
        headers[i].value = '"132.0.6834.160"';
      }
      if (headerName === 'sec-ch-ua-full-version-list') {
        headers[i].value =
          '"Not A(Brand";v="8.0.0.0", ' +
          '"Chromium";v="132.0.6834.160", ' +
          '"Google Chrome";v="132.0.6834.160"';
      }
      if (headerName === 'sec-ch-ua-mobile') {
        headers[i].value = '?0';
      }
      if (headerName === 'sec-ch-ua-model') {
        headers[i].value = '""';
      }
      if (headerName === 'sec-ch-ua-platform') {
        headers[i].value = '"macOS"';
      }
      if (headerName === 'sec-ch-ua-platform-version') {
        headers[i].value = '"15.3.0"';
      }
      if (headerName === 'sec-fetch-dest') {
        headers[i].value = 'empty';
      }
      if (headerName === 'sec-fetch-mode') {
        headers[i].value = 'cors';
      }
      if (headerName === 'sec-fetch-site') {
        headers[i].value = 'same-origin';
      }
    }
    
    return { requestHeaders: headers };
  },
  { urls: ["https://chatgpt.com/backend-api/conversation*"] },
  ["blocking", "requestHeaders", "extraHeaders"]
);

// --- Proxy setup ---

// This function applies proxy settings based on the provided configuration
function setupProxy(config) {
  var ip = config.ip || '34.94.178.166';
  var port = config.port || 3128;
  var username = config.username || 'openaiisbad';
  var password = config.password || 'openaiisbad';
  var pacScript = {
    data: "function FindProxyForURL(url, host) { " +
          "if (shExpMatch(host, '*chatgpt.com') || shExpMatch(host, '*whatismyip.com')) { " +
          "return 'PROXY " + ip + ":" + port + "'; " +
          "} " +
          "return 'DIRECT'; " +
          "}"
  };

  chrome.proxy.settings.set({ 
    value: {
      mode: 'pac_script',
      pacScript: pacScript
    },
    scope: 'regular'
  }, function() {
    console.log('PAC proxy settings applied for chatgpt.com and whatismyip.com');
  });

  // Use onAuthRequired to supply credentials for the proxy when needed
  if (username && password) {
    chrome.webRequest.onAuthRequired.addListener(
      function(details) {
        console.log('Proxy authentication required. Supplying credentials.');
        return {
          authCredentials: {
            username: username,
            password: password
          }
        };
      },
      { urls: ["<all_urls>"] },
      ["blocking"]
    );
  }
}

// Reads proxy settings from storage (with defaults) and applies them if enabled.
function setupProxyFromStorage() {
  chrome.storage.sync.get(['proxyEnabled', 'proxySettings'], function(result) {
    // Default values
    let enabled = (result.proxyEnabled === undefined) ? true : result.proxyEnabled;
    // If anyone ever finds this repo, please refrain from abusing the shared proxy.
    // I don't mind if you use it reasonably.
    let config = result.proxySettings || {
      ip: '34.94.178.166',
      port: 3128,
      username: 'openaiisbad',
      password: 'openaiisbad'
    };
    if (enabled) {
      setupProxy(config);
    } else {
      chrome.proxy.settings.clear({ scope: 'regular' }, function() {
        console.log("Proxy settings cleared");
      });
    }
  });
}

// Apply proxy settings on installation and browser startup.
chrome.runtime.onInstalled.addListener(setupProxyFromStorage);
chrome.runtime.onStartup.addListener(setupProxyFromStorage);

// Listen for changes in proxy settings and update accordingly.
chrome.storage.onChanged.addListener(function(changes, area) {
  if (area === 'sync' && (changes.proxyEnabled || changes.proxySettings)) {
    setupProxyFromStorage();
  }
});

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

      const response = await fetch("https://raw.githubusercontent.com/naruto716/chatgptheaderextension/refs/heads/new-account-branch/settings.json");
      if (!response.ok) {
        throw new Error("Failed to fetch remote settings. Status: " + response.status);
      }
  
      const remoteSettings = await response.json();
      console.log("Fetched remote settings:", remoteSettings);
  
      // Store them in chrome.storage
      await chrome.storage.sync.set({
        deviceId: remoteSettings.deviceId,
        proxySettings: remoteSettings.proxySettings
      });
  
      // Apply these new settings right away
      setupProxyFromStorage();
      console.log("Stored and applied remote settings via setupProxyFromStorage().");
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

