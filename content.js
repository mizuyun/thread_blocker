/* content.js */

// Inject inject.js into the main world to access variables like fb_dtsg and lsd
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from the injected script
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data || event.data.type !== 'THREADS_QUICK_BLOCK_RESULT') {
    return;
  }

  if (event.data.success) {
    // Optionally show a toast or change the button state on success
    console.log("Block successful:", event.data.response);
  } else {
    console.error("Block failed:", event.data.error);
    alert("Failed to block user. See console for details.");
  }
});

// Selector for the "More" button wrap around a post
const MORE_BUTTON_WRAPPER_SELECTOR = '.x6s0dn4.x15dp1bm.x1pg3x37.xqi6p0a.x102ru31.x78zum5.xl56j7k.x1n2onr6.x3oybdh.xx6bhzk.x12w9bfk.x11xpdln.x1qx5ct2.xw4jnvo';

// Observe DOM mutations to add the block button to new posts
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          processNode(node);
        }
      });
    }
  }
});

function processNode(node) {
  if (node.closest && node.closest('.threads-quick-block-btn')) return;

  const moreWrappers = node.querySelectorAll ? node.querySelectorAll(MORE_BUTTON_WRAPPER_SELECTOR) : [];
  if (node.matches && node.matches(MORE_BUTTON_WRAPPER_SELECTOR)) {
    addBlockButton(node);
  }
  moreWrappers.forEach(addBlockButton);
}

function addBlockButton(moreWrapper) {
  if (moreWrapper.closest && moreWrapper.closest('.threads-quick-block-btn')) return;

  // Check if we already added a button next to this More wrapper
  if (moreWrapper.parentNode && moreWrapper.parentNode.querySelector('.threads-quick-block-btn')) {
    return;
  }

  const container = moreWrapper.parentNode;

  // Try to find the closest element denoting the user context
  // Usually this corresponds to the closest article or post container

  const blockBtn = document.createElement('div');
  blockBtn.className = 'threads-quick-block-btn x1i10hfl x1qjc9v5 xjbqb8w xjqpnuy xc5r6h4 xqeqjp1 x1phubyo x13fuv20 x18b5jzi x1q0q8m5 x1t7ytsu x972fbf x10w94by x1qhh985 x14e42zd x9f619 x1ypdohk xdl72j9 x2lah0s x3ct3a4 xdj266r x14z9mp xat24cr x1lziwak x2lwn1j xeuugli xexx8yu xyri2b x18d9i69 x1c1uobl x1n2onr6 x16tdsg8 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x3nfvp2 x1q0g3np x87ps6o x1lku1pv x1a2a7pz x15dp1bm x1pg3x37 xqi6p0a x102ru31';
  blockBtn.role = 'button';
  blockBtn.tabIndex = 0;
  blockBtn.title = 'Quick Block';

  // Create an inner wrapper similar to the More button
  const innerWrapper = document.createElement('div');
  innerWrapper.className = 'x6s0dn4 x15dp1bm x1pg3x37 xqi6p0a x102ru31 x78zum5 xl56j7k x1n2onr6 x3oybdh xx6bhzk x12w9bfk x11xpdln x1qx5ct2 xw4jnvo';

  // SVG Icon for Block (Circle with a line)
  innerWrapper.innerHTML = `
    <svg aria-label="Block" role="img" viewBox="0 0 24 24" class="x1lliihq x2lah0s x1n2onr6 x19zyb68 x16ye13r x5lhr3w x1gaogpn block-icon-svg" style="--x-fill: currentColor; --x-height: 20px; --x-width: 20px;">
      <title>Block</title>
      <path clip-rule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9l11.21 11.21C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9z" fill="currentColor" fill-rule="evenodd"></path>
    </svg>
  `;

  blockBtn.appendChild(innerWrapper);

  blockBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Disable button to prevent multi-clicks
    blockBtn.style.pointerEvents = 'none';
    blockBtn.style.opacity = '0.5';

    // We need to find the user_id associated with this post.
    // The user's DOM provided in the prompt structure has a link like href="/@lovelegolas66"
    // However, finding the exact user_id from DOM is tricky.
    // Threads React Fiber objects usually hold the user_id for the post.
    // We pass a message to the inject.js script with a unique class path or we let inject.js do the lookup.

    // As a robust approach, let's find the nearest post container and use its React Fiber node from inject.js.
    // We add a temporary class so inject.js can find exactly this button, navigate up to the React Fiber node, and extract the user.
    const tempId = 'block-btn-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    blockBtn.setAttribute('data-block-id', tempId);

    window.postMessage({
      type: 'THREADS_QUICK_BLOCK_REQUEST',
      blockId: tempId
    }, '*');

    // Re-enable after a timeout in case it fails silently
    setTimeout(() => {
      blockBtn.style.pointerEvents = 'auto';
      blockBtn.style.opacity = '1';
    }, 3000);
  });

  // Insert next to the "More" button wrap
  container.insertBefore(blockBtn, moreWrapper);
}

// Start observing
observer.observe(document.body, { childList: true, subtree: true });

// Initial process
processNode(document.body);
