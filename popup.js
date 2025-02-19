document.addEventListener('DOMContentLoaded', async () => {
    const deviceIdInput = document.getElementById('deviceId');
    const saveDeviceButton = document.getElementById('saveDeviceButton');

    // We'll use #toast for our notifications now
    const toastDiv = document.getElementById('toast');

    const ownConversationsOnlyCheckbox = document.getElementById('ownConversationsOnly');
    const clearConversationsButton = document.getElementById('clearConversationsButton');

    // Set default values
    const defaultDeviceId = '3ac29ce5-b60f-4795-bd05-50f8a5eef871';

    // Load saved device ID or use default
    chrome.storage.sync.get(['deviceId'], (result) => {
        deviceIdInput.value = result.deviceId || defaultDeviceId;
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

    // Synchronization Settings
    const syncEnabledCheckbox = document.getElementById('syncEnabled');

    // Set default values
    chrome.storage.sync.get(['syncEnabled'], (result) => {
        syncEnabledCheckbox.checked = result.syncEnabled === undefined ? true : result.syncEnabled;
    });

    // Save Synchronization Settings
    syncEnabledCheckbox.addEventListener('change', async () => {
        const enabled = syncEnabledCheckbox.checked;
        await chrome.storage.sync.set({ syncEnabled: enabled });
        enabled ? showToast('Synchronization enabled') : showToast('Synchronization disabled, inform other people if you need to change your device ID', true);
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
