async function updateRulesWithSavedDeviceId() {
    // Load saved device ID or use default
    const DEFAULT_DEVICE_ID = '9b651939-97c7-43fe-9aec-80960cb88ff3';
    const result = await chrome.storage.sync.get('deviceId');
    const deviceId = result.deviceId || DEFAULT_DEVICE_ID;

    if (!result.deviceId) {
        console.log('No saved device ID found, using default');
        // Save the default ID to storage
        await chrome.storage.sync.set({ deviceId: DEFAULT_DEVICE_ID });
    }

    // Load and update rules
    const response = await fetch(chrome.runtime.getURL('rules.json'));
    const rules = await response.json();
    
    // Update the device ID in the rules
    rules[0].action.requestHeaders.forEach(header => {
        if (header.header === 'oai-device-id') {
            header.value = deviceId;
        }
    });

    // Update the dynamic rules
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

// Update rules when extension loads
chrome.runtime.onInstalled.addListener(updateRulesWithSavedDeviceId);
chrome.runtime.onStartup.addListener(updateRulesWithSavedDeviceId); 