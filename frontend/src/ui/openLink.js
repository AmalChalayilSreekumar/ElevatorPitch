import { createPrompt } from './prompt.js';

let blockedPrompt = null;
let pendingUrl = null;

const isGitHub = (url) => new URL(url, location.href).hostname.includes('github');

function openPending() {
  window.open(pendingUrl, '_blank', 'noopener');
  blockedPrompt.hide();
}

// Opens url in a new tab; if a pop-up blocker stops it, says so and offers a button (a direct click, which
// blockers allow). Opened without 'noopener' so a blocked tab is detectable: with it, window.open always returns null.
export function openInNewTab(url) {
  const win = window.open(url, '_blank');
  if (win && !win.closed) {
    win.opener = null;
    return;
  }

  pendingUrl = url;
  const github = isGitHub(url);
  blockedPrompt ??= createPrompt('', {
    actions: [{ label: 'Open', run: openPending }],
    onClose: () => blockedPrompt.hide(),
  });
  blockedPrompt.setText(`Your browser blocked the ${github ? 'GitHub' : 'new'} tab. Allow pop-ups for this site, or open it here:`);
  blockedPrompt.setActionLabel(0, github ? 'Open GitHub' : 'Open link');
  blockedPrompt.show();
  // Free the cursor on desktop so the button can be clicked.
  document.exitPointerLock?.();
}
