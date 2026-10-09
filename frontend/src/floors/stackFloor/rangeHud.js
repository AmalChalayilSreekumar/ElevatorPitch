import { isTouch } from '../../player/device.js';

const TOAST_MS = 1600;
const RESULTS_MS = 8000;

function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

// Accuracy is hits over every shot fired.
const accuracy = (hits, shots) => (shots ? `${Math.round((hits / shots) * 100)}%` : '—');

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

  // Final score, shown in the HUD's spot once the player has been put out of the booth.
  const results = node('div', 'range-results');
  results.hidden = true;
  document.body.appendChild(results);

  let toastTimer = null;
  let resultsTimer = null;

  // stats: { cleared, shots, hits } — distinct stack items hit, shots fired, shots that hit.
  const setTally = ({ cleared, shots, hits }) => {
    tally.textContent = `${cleared} / ${total} hit · ${accuracy(hits, shots)} accuracy`;
  };
  setTally({ cleared: 0, shots: 0, hits: 0 });

  return {
    // Each pick-up shows the shooting hint again until the next hit.
    show(stats) {
      setTally(stats);
      hud.hidden = false;
      callout.hidden = false;
      results.hidden = true;
    },
    hide() {
      hud.hidden = true;
      callout.hidden = true;
    },
    hit(name, stats) {
      callout.hidden = true;
      setTally(stats);
      toast.textContent = name;
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.hidden = true; }, TOAST_MS);
    },
    miss(stats) {
      setTally(stats);
    },
    results({ shots, hits }) {
      results.replaceChildren(
        node('p', 'range-results__title', 'Full stack cleared!'),
        node('p', 'range-results__score', `Accuracy ${accuracy(hits, shots)} (${hits} of ${shots} shots)`)
      );
      results.hidden = false;
      clearTimeout(resultsTimer);
      resultsTimer = setTimeout(() => { results.hidden = true; }, RESULTS_MS);
    },
    dispose() {
      clearTimeout(toastTimer);
      clearTimeout(resultsTimer);
      hud.remove();
      callout.remove();
      results.remove();
    },
  };
}
