import { node } from './dom.js';

// Metres: the hint only appears once the player has walked up to the object.
const HINT_RANGE = 2.5;

// A small label under the crosshair describing what the hovered object does; set() is cheap to call every frame.
export function createHoverHint() {
  const el = node('p', 'hover-hint');
  el.hidden = true;
  document.body.appendChild(el);

  let shown = null;

  return {
    set(text, distance) {
      if (distance > HINT_RANGE) text = null;
      if (text === shown) return;
      shown = text;
      el.hidden = !text;
      if (text) el.textContent = text;
    },
  };
}
