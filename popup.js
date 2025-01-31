document.addEventListener('DOMContentLoaded', async () => {
    const deviceIdInput = document.getElementById('deviceId');
    const saveButton = document.getElementById('saveButton');
    const statusDiv = document.getElementById('status');

    // Load saved device ID
    const result = await chrome.storage.sync.get('deviceId');
    if (result.deviceId) {
        deviceIdInput.value = result.deviceId;
    }

    saveButton.addEventListener('click', async () => {
        const deviceId = deviceIdInput.value.trim();
        
        if (!deviceId) {
            alert('Please enter a valid device ID');
            return;
        }

        // Validate device ID format
        const deviceIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!deviceIdRegex.test(deviceId)) {
            alert('Please enter a device ID in the correct format (e.g., 9b651939-97c7-43fe-9aec-80960cb88ff1)');
            return;
        }

        // Save to storage
        await chrome.storage.sync.set({ deviceId });

        // Update the rules
        const response = await fetch(chrome.runtime.getURL('rules.json'));
        const rules = await response.json();
        
        // Update the device ID in the rules
        rules[0].action.requestHeaders.forEach(header => {
            if (header.header === 'oai-device-id') {
                header.value = deviceId;
            }
        });

        // Update the dynamic rules
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rules.map(rule => rule.id),
            addRules: rules
        });

        // Show success message
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 2000);
    });
}); 