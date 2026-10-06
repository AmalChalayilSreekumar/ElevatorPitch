import { createPrompt } from '../ui/prompt.js';
import { node } from '../ui/dom.js';
import { isTouch } from '../player/device.js';
import { CAR_SPAWN, ELEVATOR_FRONT } from '../objects/elevator/Elevator.js';

// Seconds of free exploring on a floor before suggesting the elevator.
const NUDGE_AFTER = 180;
// Returning players are turned to face the button panel.
const PANEL = 'mButtonSquare';

// Steers players who aren't used to games back to the elevator:
//   exploring --(3 min outside the car, or complete())--> nudged --(walks in, or E / Teleport back)--> pickNext
//   nudged --(× / Q)--> done (until the next floor)
// The timer only runs while the player is outside the car and free to walk (not riding, not holding the gun).
// A "Back to elevator" chip (E on desktop, tap on mobile) returns them at any point on a floor.
export function createFloorGuide(camera, look, elevator) {
  let state = 'idle';
  let elapsed = 0;
  let pulseButtons = [];
  let wasLocked = false;
  // Prompts are built on first use: their wording depends on the control mode, chosen after this is created.
  let nudge = null;
  let pickNext = null;

  const chip = node('button', 'return-chip');
  chip.type = 'button';
  chip.hidden = true;
  chip.addEventListener('click', returnToCar);
  document.body.append(chip);

  const inCar = () => camera.position.z > ELEVATOR_FRONT.z;

  function setState(next) {
    state = next;
    elapsed = 0;
    if (next !== 'nudged') nudge?.hide();
    if (next !== 'pickNext') {
      pickNext?.hide();
      elevator.setPulsing([]);
    }
  }

  function startNudge(headline) {
    setState('nudged');
    nudge ??= createPrompt('', {
      actions: isTouch() ? [{ label: 'Teleport back', run: returnToCar }] : [],
      onClose: dismiss,
    });
    const how = isTouch() ? 'Tap Teleport back' : 'Press E';
    const close = isTouch() ? '' : '\nQ to close';
    nudge.setText(`${headline} ${how} to return to the elevator and explore another floor.${close}`);
    nudge.show();
  }

  function startPickNext(returned) {
    setState('pickNext');
    pickNext ??= createPrompt('');
    const how = isTouch() ? 'aim at a glowing button and tap.' : 'click one of the glowing buttons.';
    pickNext.setText(`${returned ? "You're back in the elevator. " : ''}Pick another floor: ${how}`);
    pickNext.show();
    elevator.setPulsing(pulseButtons);
  }

  function teleport() {
    camera.position.copy(CAR_SPAWN);
    const panel = elevator.worldPosition(PANEL);
    if (!panel) return look.reset();
    const d = panel.sub(camera.position);
    look.reset(Math.atan2(-d.x, -d.z), Math.atan2(d.y, Math.hypot(d.x, d.z)));
  }

  // Ignored while the last frame was locked, so E for putting the gun down never also teleports.
  function returnToCar() {
    if (state === 'idle' || wasLocked || inCar()) return;
    teleport();
    startPickNext(true);
  }

  function dismiss() {
    if (state === 'nudged') setState('done');
  }

  document.addEventListener('keydown', (e) => {
    if (isTouch()) return;
    if (e.code === 'KeyE') returnToCar();
    else if (e.code === 'KeyQ') dismiss();
  });

  return {
    // pulse: floor buttons to highlight when suggesting the next floor (every floor but this one).
    arrive(pulse) {
      pulseButtons = pulse;
      chip.textContent = isTouch() ? 'Click to return back to elevator' : 'E · Back to elevator';
      setState('exploring');
    },
    leave() {
      setState('idle');
      chip.hidden = true;
    },
    // The floor's main activity is finished (e.g. the coaster ride): nudge straight away.
    complete(headline) {
      if (state === 'exploring') startNudge(headline);
    },
    update(delta, locked) {
      wasLocked = locked;
      const outside = state !== 'idle' && !locked && !inCar();
      if (chip.hidden === outside) chip.hidden = !outside;
      if (state === 'nudged') {
        if (locked) nudge.hide();
        else nudge.show();
      }
      if (state === 'idle' || locked) return;

      if (state === 'exploring') {
        if (!inCar()) elapsed += delta;
        if (elapsed >= NUDGE_AFTER) startNudge('');
      } else if (state === 'nudged' && inCar()) {
        startPickNext(false);
      } else if (state === 'pickNext' && !inCar()) {
        setState('done');
      }
    },
  };
}
