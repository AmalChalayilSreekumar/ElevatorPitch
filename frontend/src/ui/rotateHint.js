import { node } from './dom.js';
import './rotateHint.css';

// Mobile mode only: covers the screen while the phone is upright (CSS orientation query) and clears itself in landscape.
// Players with rotation lock on can dismiss it and play in portrait.
export function createRotateHint() {
  const dismiss = node('button', 'rotate-hint__dismiss', 'Continue in portrait');
  dismiss.type = 'button';

  const el = node('div', 'rotate-hint');
  el.append(
    node('div', 'rotate-hint__phone'),
    node('p', 'rotate-hint__title', 'Rotate your phone'),
    node('p', 'rotate-hint__text', 'This site plays best in landscape. Turn your phone sideways to continue.'),
    dismiss
  );
  dismiss.addEventListener('click', () => el.remove());
  document.body.append(el);
}
