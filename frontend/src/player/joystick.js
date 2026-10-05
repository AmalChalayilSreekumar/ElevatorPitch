import { node } from '../ui/dom.js';

const DEAD_ZONE = 0.12;

// A thumb stick: drag the knob within the base; value is { x, y } in [-1, 1] (y positive = pulled down).
// Each stick tracks its own pointerId, so two thumbs can drive two sticks at once.
export function createJoystick(className) {
  const knob = node('div', 'joystick__knob');
  const base = node('div', `joystick ${className}`);
  base.append(knob);

  const value = { x: 0, y: 0 };
  let pointerId = null;
  let centre = null;
  let radius = 0;

  function moveTo(e) {
    let dx = e.clientX - centre.x;
    let dy = e.clientY - centre.y;
    const length = Math.hypot(dx, dy);
    if (length > radius) {
      dx *= radius / length;
      dy *= radius / length;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;

    const strength = Math.min(length / radius, 1);
    const scale = strength < DEAD_ZONE ? 0 : (strength - DEAD_ZONE) / (1 - DEAD_ZONE) / (strength || 1);
    value.x = (dx / radius) * scale;
    value.y = (dy / radius) * scale;
  }

  function release(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    value.x = value.y = 0;
    knob.style.transform = '';
  }

  base.addEventListener('pointerdown', (e) => {
    if (pointerId !== null) return;
    e.preventDefault();
    pointerId = e.pointerId;
    base.setPointerCapture(pointerId);
    const rect = base.getBoundingClientRect();
    centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    radius = rect.width / 2;
    moveTo(e);
  });
  base.addEventListener('pointermove', (e) => {
    if (e.pointerId === pointerId) moveTo(e);
  });
  base.addEventListener('pointerup', release);
  base.addEventListener('pointercancel', release);

  return { el: base, value };
}
