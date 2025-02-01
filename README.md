# ChatGPT Account Sharing Bypass
![Screenshot](https://i.postimg.cc/mDFQmTsR/Cn-P-02022025-114144.png)

This Chrome extension allows you to bypass OpenAI's account sharing detection when using ChatGPT. It achieves this by modifying specific request headers sent to the ChatGPT API, making it appear as if requests are coming from a single, unique user. In addition, the extension can route traffic through a proxy (using a PAC script) for selected domains such as chatgpt.com and whatismyip.com.

## How It Works

The extension modifies outgoing requests to the ChatGPT backend by updating headers using the `webRequest` API (Manifest V2, deprecated yet usable, for better proxy support).

In parallel, the extension leverages proxy settings with a PAC (Proxy Auto-Config) script to route requests for certain domains (e.g., `chatgpt.com` and `whatismyip.com`) through a custom proxy server. The proxy settings—IP, port, username, and password—can all be configured via the popup interface.

Additionally, the extension now includes a conversation separation feature, allowing you to only display your own stored conversations in ChatGPT's conversation list. This helps maintain privacy if multiple accounts or devices are used.

## Installation

1. Clone this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked".
5. Select the directory where you cloned the repository.

## Usage

Once installed, the extension will:
  
- Automatically modify the necessary headers for requests to `https://chatgpt.com/backend-api/conversation`.
- Apply proxy settings on targeted websites (e.g., ChatGPT and WhatIsMyIP) using a PAC script. This makes it easier to verify the proxy is active (by visiting [WhatIsMyIP.com](https://www.whatismyip.com/)).
- Provide an option to only display conversations that are stored locally, effectively hiding others.

The extension comes with a settings popup allowing you to:
  
- Configure the unique device ID used to spoof the request.
- Enable/disable the proxy.
- Update proxy server information (IP, port, username, and password).
- Enable "Only Display My Conversations" so that you only see your own stored conversation history in ChatGPT.

Default values are pre-configured. If you find this public repo, please refrain from abusing the shared proxy settings.

## Proxy Information

The proxy functionality applies a PAC script to route only requests going to specific domains (such as `chatgpt.com` and `whatismyip.com`) through the configured proxy. This allows you to test your proxy settings easily, while other sites remain unaffected.

If you disable the proxy using the popup, the extension will clear any applied proxy settings.

## Conversation Separation

When you enable the "Only Display My Conversations" option in the popup, the extension checks the conversation IDs saved in your storage. Conversations not matching one of these IDs are hidden or removed from the interface. This adds a layer of privacy against unintentionally displaying shared or unknown conversations.

## Disclaimer

This extension is intended for educational purposes only. Bypassing OpenAI's account sharing detection may violate their terms of service. Use this extension at your own risk.

## Permissions

The extension requires the following permissions, as specified in the `manifest.json` file:

- `webRequest`
- `webRequestBlocking`
- `storage`
- `proxy`
- `<all_urls>`

In addition to the above, host permissions are required for:
  
- `https://chatgpt.com/*`
- And any additional domains (such as whatismyip.com) that the PAC script targets.

Enjoy developing and testing this extension!
