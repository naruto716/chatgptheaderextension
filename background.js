
// --- Global device ID logic ---

// Set a default device id (as in your previous rules.json)
var deviceId = '9b651939-97c7-43fe-9aec-80960cb88ff3';

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
    var headers = details.requestHeaders;
    var hasDeviceId = false;
    var hasOaiLanguage = false;
    var hasUserAgent = false;
    
    // Iterate through headers and update them if already present.
    for (var i = 0; i < headers.length; i++) {
      var headerName = headers[i].name.toLowerCase();
      if (headerName === 'oai-device-id') {
        headers[i].value = deviceId;
        hasDeviceId = true;
      }
      if (headerName === 'oai-language') {
        headers[i].value = 'en-US';
        hasOaiLanguage = true;
      }
      if (headerName === 'user-agent') {
        headers[i].value = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';
        hasUserAgent = true;
      }
    }
    
    // If a header is missing, add it.
    if (!hasDeviceId) {
      headers.push({ name: 'oai-device-id', value: deviceId });
    }
    if (!hasOaiLanguage) {
      headers.push({ name: 'oai-language', value: 'en-US' });
    }
    if (!hasUserAgent) {
      headers.push({ name: 'User-Agent', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36' });
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