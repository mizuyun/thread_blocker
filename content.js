/* content.js */

// Selector for the "More" button inner wrapped SVG element in a post
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
  if (node.closest && node.closest('[title="Quick Block"]')) return;

  const moreWrappers = node.querySelectorAll ? node.querySelectorAll(MORE_BUTTON_WRAPPER_SELECTOR) : [];
  if (node.matches && node.matches(MORE_BUTTON_WRAPPER_SELECTOR)) {
    addBlockButton(node);
  }
  moreWrappers.forEach(addBlockButton);
}

// Function to find the block menu item by its distinct SVG path
function findBlockMenuItem() {
  const svgs = document.querySelectorAll('svg');
  for (const svg of svgs) {
    const path = svg.querySelector('path');
    if (path) {
      const d = path.getAttribute('d');
      // Look for the specific SVG path used for the "Block" (封鎖) menu item
      if (d && d.startsWith('M12 1C18.0751 1 23 5.92487 23 12')) {
        // The clickable menu item is typically a few levels up
        const menuItem = svg.closest('[role="button"], [role="menuitem"]');
        if (menuItem) return menuItem;
      }
    }
  }
  return null;
}

// Function to find the final confirm button in the dialog
function findConfirmBlockButton() {
  const dialogs = document.querySelectorAll('[role="dialog"]');
  if (dialogs.length === 0) return null;

  // Get the last dialog which should be the top-most one
  const dialog = dialogs[dialogs.length - 1];

  // Find all buttons in the dialog
  const buttons = dialog.querySelectorAll('[role="button"]');

  // We look for the one that says "Block" or "封鎖"
  for (const btn of buttons) {
    const text = btn.innerText.trim().toLowerCase();
    if (text.includes('封鎖') || text.includes('block') || text === 'bloquear') {
      return btn;
    }
  }

  return null;
}

// Helper to delay execution
const delay = ms => new Promise(res => setTimeout(res, ms));

async function simulateBlockFlow(moreBtn) {
  try {
    if (!moreBtn) {
      console.error("Could not find clickable More button");
      return false;
    }

    // 1. Simulate UI native click on More button
    moreBtn.click();
    console.log("Clicked More button");

    // 2. Wait for Menu to appear and find "Block" option
    let blockMenuItem = null;
    let retries = 0;
    while (!blockMenuItem && retries < 20) { // Wait up to 2 seconds
      await delay(100);
      blockMenuItem = findBlockMenuItem();
      retries++;
    }

    if (!blockMenuItem) {
      console.error("Block menu item not found");
      return false;
    }

    // Click "Block" from menu
    blockMenuItem.click();
    console.log("Clicked Block menu item");

    // 3. Wait for Dialog to appear and find "Confirm Block" button
    let confirmBtn = null;
    retries = 0;
    while (!confirmBtn && retries < 20) { // Wait up to 2 seconds
      await delay(100);
      confirmBtn = findConfirmBlockButton();
      retries++;
    }

    if (!confirmBtn) {
      console.error("Confirm block button not found in dialog");
      return false;
    }

    // Click confirm
    confirmBtn.click();
    console.log("Clicked Confirm block");

    return true;
  } catch (error) {
    console.error("Error during block flow simulation:", error);
    return false;
  }
}

function addBlockButton(moreWrapperInner) {
  // Find the actual button role element for the "More" button
  const moreBtn = moreWrapperInner.closest('[role="button"]');
  if (!moreBtn) return;

  // Ensure it's actually the "More" button and not another button like "Edited"
  if (moreBtn.getAttribute('aria-haspopup') !== 'menu') return;

  if (moreBtn.closest('[title="Quick Block"]')) return;

  const parentContainer = moreBtn.parentNode;
  if (!parentContainer) return;
  const grandParentContainer = parentContainer.parentNode;
  if (!grandParentContainer) return;

  // Check if we already injected in this grandparent
  if (grandParentContainer.querySelector('[title="Quick Block"]')) {
    return;
  }

  const blockBtn = document.createElement('div');
  // Use the same structural classes as the More button itself for native-like appearance
  blockBtn.className = moreBtn.className;

  // Remove trailing classes related to interactions that might duplicate bindings or states if any
  // But copy role and tabIndex
  blockBtn.role = 'button';
  blockBtn.tabIndex = 0;
  blockBtn.title = 'Quick Block';

  // Inner wrapper mimicking the structure
  const innerWrapper = document.createElement('div');
  innerWrapper.className = moreWrapperInner.className;

  // SVG Icon for Block (Circle with a diagonally crossing line)
  innerWrapper.innerHTML = `
    <svg aria-label="Block" role="img" viewBox="0 0 24 24" class="x1lliihq x2lah0s x1n2onr6 x19zyb68 x16ye13r x5lhr3w x1gaogpn block-icon-svg" style="--x-fill: currentColor; --x-height: 20px; --x-width: 20px;">
      <title>Block</title>
      <path clip-rule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9l11.21 11.21C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9z" fill="currentColor" fill-rule="evenodd"></path>
    </svg>
  `;

  blockBtn.appendChild(innerWrapper);

  blockBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Visual feedback
    blockBtn.style.pointerEvents = 'none';
    blockBtn.style.opacity = '0.5';

    const success = await simulateBlockFlow(moreBtn);

    if (success) {
      blockBtn.style.color = '#ff3040';
      blockBtn.querySelector('title').textContent = 'Blocked';
    } else {
      // If it failed, revert the visual style so user can try again
      blockBtn.style.pointerEvents = 'auto';
      blockBtn.style.opacity = '1';
    }
  });

  // Insert before the parent of the more button, they are siblings in the grandparent container
  grandParentContainer.insertBefore(blockBtn, parentContainer);
}

// Start observing
observer.observe(document.body, { childList: true, subtree: true });

// Initial process
processNode(document.body);
