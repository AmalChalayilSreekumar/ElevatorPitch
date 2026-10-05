import { createJoystick } from './joystick.js';
import { node } from '../ui/dom.js';
import './touchControls.css';

// Radians per second at full deflection of the look stick.
const LOOK_RATE = 1.4;

// Left stick moves, right stick looks, and context buttons stand in for keys a phone doesn't have.
export function createTouchControls(look) {
  const moveStick = createJoystick('joystick--move');
  const lookStick = createJoystick('joystick--look');
  const actionBar = node('div', 'touch-actions');
  const hoverButton = node('button', 'touch-hover');
  hoverButton.type = 'button';
  hoverButton.hidden = true;

  const root = node('div', 'touch-controls');
  root.hidden = true;
  root.append(moveStick.el, lookStick.el, actionBar, hoverButton);
  document.body.append(root);

  let shownActions = null;
  let hoverAction = null;
  hoverButton.addEventListener('click', () => hoverAction?.run());

  return {
    move: moveStick.value,
    show() {
      root.hidden = false;
      document.body.classList.add('touch-mode');
    },
    update(delta) {
      const { x, y } = lookStick.value;
      if (!x && !y) return;
      // Squared response: small pushes turn slowly for fine aiming, a full push still turns at LOOK_RATE.
      const rate = Math.hypot(x, y) * LOOK_RATE * delta;
      look.turn(x * rate, y * rate);
    },
    // Small tappable prompt under the crosshair for whatever it's resting on; null hides it.
    setHoverAction(action) {
      if (action === hoverAction) return;
      hoverAction = action;
      hoverButton.hidden = !action;
      if (action) hoverButton.textContent = action.label;
    },
    // Floors hand back the same array while nothing changes, so this only touches the DOM on a change.
    setActions(actions) {
      if (actions === shownActions) return;
      shownActions = actions;
      actionBar.replaceChildren(...actions.map(({ label, run }) => {
        const button = node('button', 'touch-actions__button', label);
        button.type = 'button';
        button.addEventListener('click', run);
        return button;
      }));
    },
  };
}
