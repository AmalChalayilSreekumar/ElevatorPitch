import { isTouch } from '../../player/device.js';

const TOAST_MS = 1600;

function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

export function createRangeHud(total) {
  const tally = node('p', 'range-hud__tally');
  const toast = node('p', 'range-hud__toast');
  const hud = node('div', 'range-hud');
  hud.append(tally, toast, node('p', 'range-hud__hint', isTouch() ? 'Tap to fire · Put down to leave' : 'Click to fire · E to put down'));
  hud.hidden = true;
  toast.hidden = true;
  document.body.appendChild(hud);

  // First-shot hint under the crosshair; lives outside the HUD, whose transform would anchor it to the HUD.
  const callout = node('p', 'range-callout', `Aim at the floating target and ${isTouch() ? 'tap' : 'click'} to shoot!`);
  callout.hidden = true;
  document.body.appendChild(callout);

  let toastTimer = null;
  let hits = 0;
  const setTally = (count) => { tally.textContent = `${count} / ${total} hit`; };
  setTally(0);

  return {
    // Each pick-up shows the shooting hint again until the next hit.
    show() {
      hud.hidden = false;
      callout.hidden = false;
    },
    hide() {
      hud.hidden = true;
      callout.hidden = true;
    },
    hit(name, count) {
      callout.hidden = true;
      const cleared = count === total && hits < total;
      hits = count;
      setTally(count);
      toast.textContent = cleared ? `${name} · Full stack cleared!` : name;
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.hidden = true; }, TOAST_MS);
    },
  };
}
