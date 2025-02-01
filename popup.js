document.addEventListener('DOMContentLoaded', async () => {
    const deviceIdInput = document.getElementById('deviceId');
    const saveDeviceButton = document.getElementById('saveDeviceButton');

    const proxyEnabledCheckbox = document.getElementById('proxyEnabled');
    const proxyIpInput = document.getElementById('proxyIp');
    const proxyPortInput = document.getElementById('proxyPort');
    const proxyUsernameInput = document.getElementById('proxyUsername');
    const proxyPasswordInput = document.getElementById('proxyPassword');
    const saveProxyButton = document.getElementById('saveProxyButton');

    // We'll use #toast for our notifications now
    const toastDiv = document.getElementById('toast');

    const ownConversationsOnlyCheckbox = document.getElementById('ownConversationsOnly');
    const clearConversationsButton = document.getElementById('clearConversationsButton');

    // Set default values
    const defaultDeviceId = '9b651939-97c7-43fe-9aec-80960cb88ff3';
    const defaultProxySettings = {
        ip: '34.94.178.166',
        port: 3128,
        username: 'openaiisbad',
        password: 'openaiisbad'
    };

    // Load saved device ID or use default
    chrome.storage.sync.get(['deviceId'], (result) => {
        deviceIdInput.value = result.deviceId || defaultDeviceId;
    });

    // Load proxy settings
    chrome.storage.sync.get(['proxyEnabled', 'proxySettings'], (result) => {
        const enabled = result.proxyEnabled === undefined ? true : result.proxyEnabled;
        const proxySettings = result.proxySettings || defaultProxySettings;

        proxyEnabledCheckbox.checked = enabled;
        proxyIpInput.value = proxySettings.ip;
        proxyPortInput.value = proxySettings.port;
        proxyUsernameInput.value = proxySettings.username;
        proxyPasswordInput.value = proxySettings.password;
    });

    // Load saved setting for own conversations only
    chrome.storage.sync.get(['ownConversationsOnly'], (result) => {
        ownConversationsOnlyCheckbox.checked = result.ownConversationsOnly !== undefined
            ? result.ownConversationsOnly
            : true;
    });

    // Save Device ID
    saveDeviceButton.addEventListener('click', async () => {
        const deviceId = deviceIdInput.value.trim();
        
        if (!deviceId) {
            showToast('Please enter a valid device ID', true);
            return;
        }

        // Validate device ID format
        const deviceIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!deviceIdRegex.test(deviceId)) {
            showToast('Please use the correct UUID format', true);
            return;
        }

        await chrome.storage.sync.set({ deviceId });
        showToast('Device ID saved!');
    });

    // Save Proxy Settings
    saveProxyButton.addEventListener('click', async () => {
        const enabled = proxyEnabledCheckbox.checked;
        const ip = proxyIpInput.value.trim();
        const port = parseInt(proxyPortInput.value.trim(), 10);
        const username = proxyUsernameInput.value.trim();
        const password = proxyPasswordInput.value;

        if (enabled && (!ip || !port)) {
            showToast('Please enter a valid proxy IP and port.', true);
            return;
        }

        const proxySettings = { ip, port, username, password };
        await chrome.storage.sync.set({
            proxyEnabled: enabled,
            proxySettings: proxySettings
        });
        showToast('Proxy settings saved!');
    });

    ownConversationsOnlyCheckbox.addEventListener('change', async () => {
        const checked = ownConversationsOnlyCheckbox.checked;
        await chrome.storage.sync.set({ ownConversationsOnly: checked });
        showToast('Conversation preference updated!');
    });

    // Clear stored conversations
    clearConversationsButton.addEventListener('click', async () => {
        await chrome.storage.sync.remove('conversations');
        showToast('Conversations cleared!');
    });

    /**
     * Displays a toast message.
     * @param {string} message - The message to be displayed in the toast.
     * @param {boolean} [isError=false] - Whether this is an error message (changes the color).
     */
    function showToast(message, isError = false) {
        toastDiv.textContent = message;
        
        // Use bright green (#28a745) for success and red (#D9534F) for error
        toastDiv.style.backgroundColor = isError ? '#D9534F' : '#28a745';

        // Show the toast
        toastDiv.classList.add('show');

        // Hide after 3 seconds
        setTimeout(() => {
            toastDiv.classList.remove('show');
        }, 3000);
    }
}); 