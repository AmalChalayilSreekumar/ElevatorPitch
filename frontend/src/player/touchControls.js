import { createJoystick } from './joystick.js';
import { node } from '../ui/dom.js';
import './touchControls.css';

// Radians turned per pixel dragged on the screen.
const DRAG_LOOK = 0.005;
// A touch that moves less than this many pixels before lifting counts as a tap, not a look drag.
const TAP_SLOP = 10;

// Left stick moves, dragging anywhere else looks, a tap interacts, and context buttons stand in for missing keys.
export function createTouchControls(look, canvas, onTap) {
  const moveStick = createJoystick('joystick--move');
  const actionBar = node('div', 'touch-actions');
  const hoverButton = node('button', 'touch-hover');
  hoverButton.type = 'button';
  hoverButton.hidden = true;

  const root = node('div', 'touch-controls');
  root.hidden = true;
  root.append(moveStick.el, actionBar, hoverButton);
  document.body.append(root);

  let shownActions = null;
  let hoverAction = null;
  hoverButton.addEventListener('click', () => hoverAction?.run());

  // One finger at a time drives the look; the move stick captures its own pointer, so both work together.
  let dragId = null;
  let lastX = 0;
  let lastY = 0;
  let travelled = 0;

  canvas.addEventListener('pointerdown', (e) => {
    if (dragId !== null) return;
    dragId = e.pointerId;
    canvas.setPointerCapture(dragId);
    lastX = e.clientX;
    lastY = e.clientY;
    travelled = 0;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== dragId) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    travelled += Math.hypot(dx, dy);
    look.turn(dx * DRAG_LOOK, dy * DRAG_LOOK);
  });
  // Interactions fire on release so that starting a drag never presses whatever is under the crosshair.
  canvas.addEventListener('pointerup', (e) => {
    if (e.pointerId !== dragId) return;
    dragId = null;
    if (travelled < TAP_SLOP) onTap();
  });
  canvas.addEventListener('pointercancel', (e) => {
    if (e.pointerId === dragId) dragId = null;
  });

  // A finger lifted after the page loses focus (a link opening a new tab, switching apps) never reports its
  // pointerup here, which would leave the stick walking or the drag stuck; let go of both instead.
  const releaseTouches = () => {
    moveStick.reset();
    dragId = null;
  };
  window.addEventListener('blur', releaseTouches);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseTouches(); });

  return {
    move: moveStick.value,
    show() {
      root.hidden = false;
      document.body.classList.add('touch-mode');
    },
    // Hidden while movement is locked (riding the coaster, holding the gun), freeing the screen for cards.
    setMoveEnabled(enabled) {
      if (moveStick.el.hidden !== enabled) return;
      moveStick.el.hidden = !enabled;
      if (!enabled) moveStick.reset();
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
