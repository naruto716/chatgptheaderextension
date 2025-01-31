# ChatGPT Account Sharing Bypass

This Chrome extension allows you to bypass OpenAI's account sharing detection when using ChatGPT. It achieves this by modifying specific request headers sent to the ChatGPT API, making it appear as if requests are coming from a single, unique user.

## How it Works

The extension utilizes the `declarativeNetRequest` API to intercept and modify outgoing requests to the ChatGPT backend. Specifically, it targets requests made to the `/backend-api/conversation` endpoint.

The following headers are modified:

*   **`oai-device-id`**: Set to a static, unique UUID (`9b651939-97c7-43fe-9aec-80960cb88ff3`). This prevents OpenAI from identifying multiple users based on different device IDs.
*   **`oai-language`**: Set to `en-US`. This ensures consistent language settings across all users sharing the account.
*   **`User-Agent`**: Set to a common User-Agent string (`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36`). This makes it harder for OpenAI to differentiate users based on browser or device information.

These modifications are defined in the `rules.json` file:

## Installation

1. Clone this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked".
5. Select the directory where you cloned the repository.

## Usage

Once installed, the extension will automatically modify the necessary headers for requests to `https://chatgpt.com/backend-api/conversation`. No further action is required on your part.

## Disclaimer

This extension is intended for educational purposes only. Bypassing OpenAI's account sharing detection may violate their terms of service. Use this extension at your own risk.

## Permissions

The extension requires the following permissions, as specified in the `manifest.json` file:

*   `declarativeNetRequest`: Allows the extension to modify network requests.
*   `declarativeNetRequestWithHostAccess`: Grants the extension the ability to modify requests on specific hosts.
*   `declarativeNetRequestFeedback`: Enables the extension to receive feedback about modified requests.

Additionally, the extension requires host permissions for `https://chatgpt.com/*`:
