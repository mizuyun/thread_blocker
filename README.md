# Threads Quick Blocker

Threads Quick Blocker is a lightweight browser extension that adds a "Quick Block" button next to every post on Threads. It allows you to block users directly from their posts with a single click, without having to navigate into the "More" menu and confirming manually.

![Threads Quick Blocker](icon.png)

## Features

- **One-Click Blocking**: Bypasses the multi-step blocking process by injecting a block button next to posts.
- **Cross-Browser Support**: Works natively in Google Chrome, Microsoft Edge, and Mozilla Firefox.
- **Privacy First**: Uses native DOM interactions to securely block users without requiring API intercepting or saving your session tokens.

## Installation

### For Google Chrome & Microsoft Edge

1. Download the latest `threads-blocker-chrome.zip` from the [Releases](https://github.com/izumimizuyun/thread_blocker/releases) page.
2. Unzip the downloaded file.
3. Open your browser and navigate to the Extensions page (`chrome://extensions/` or `edge://extensions/`).
4. Enable **Developer mode** in the top right corner.
5. Click **Load unpacked** and select the unzipped folder.

### For Mozilla Firefox

1. Download the latest `threads-blocker-firefox.zip` from the [Releases](https://github.com/izumimizuyun/thread_blocker/releases) page.
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**
4. Select the `manifest.json` file inside the unzipped folder or select the `.zip` file directly.

## Development

To modify or contribute to the extension:

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/izumimizuyun/thread_blocker.git
   \`\`\`
2. Load the unpacked extension into your browser.
3. Make your changes to `content.js`, `styles.css`, or `manifest.json`.
4. Refresh the extension in your browser to see the updates.

## Automation

This project uses **GitHub Actions** to automatically build release packages. Whenever a new tag is pushed (e.g., `v1.0.0`), the CI workflow will automatically generate and upload the necessary `.zip` files for both Chrome and Firefox.

## License

This project is open-sourced under the MIT License.
