import { node } from './dom.js';

const TOAST_MS = 2200;

// A short message at the top centre that fades itself out; a new message replaces the current one.
export function createToast() {
  const el = node('p', 'toast');
  el.hidden = true;
  document.body.appendChild(el);

  let timer = null;

  return {
    show(text) {
      el.textContent = text;
      el.hidden = false;
      clearTimeout(timer);
      timer = setTimeout(() => { el.hidden = true; }, TOAST_MS);
    },
  };
}
