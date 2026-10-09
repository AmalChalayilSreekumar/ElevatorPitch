import * as THREE from 'three';
import { createTrack } from './track.js';
import { createCart, RIDER_EYE } from './cart.js';
import { createSign } from './sign.js';
import { createTimelineCard } from './timelineCard.js';
import { createHall } from './hall.js';
import { isTouch } from '../../player/device.js';
import { disposeObject } from '../../utils/dispose.js';

const GRAVITY = 9.8;
// Lift speed up to the first peak, and the speed the cart crests at.
const CHAIN_SPEED = 5;
const MAX_ACCEL = 8;
const BRAKE_DECEL = 8;
const CREEP_SPEED = 0.3;
const EXIT_POSITION = new THREE.Vector3(0, 1.7, -2.5);
const HALL_COLOR = 0x05060f;
const NO_ACTIONS = [];

function createStation() {
  const station = new THREE.Group();

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.1, 3.9),
    new THREE.MeshLambertMaterial({ color: 0x3a3d4d })
  );
  platform.position.set(0, 0, -2.45);

  const safetyEdge = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.02, 0.2),
    new THREE.MeshLambertMaterial({ color: 0xffd166 })
  );
  safetyEdge.position.set(0, 0.06, -4.3);

  const sign = createSign(
    { title: 'Career Coaster', subtitle: isTouch() ? 'Tap On Cart' : 'Click On Cart', color: '#1d3557' },
    { span: 3.2, height: 2.8 }
  );
  sign.position.z = -3.9;

  station.add(platform, safetyEdge, sign);
  return station;
}

// onComplete: called when the player finishes the whole ride and is let off at the station.
export function createExpFloor(camera, look, experience, onComplete) {
  const group = new THREE.Group();
  const track = createTrack();
  const cart = createCart();
  const card = createTimelineCard();

  // One stop per job, spread evenly between the lift peak and the station; the station is the final stop.
  const timelineLength = track.length - track.peakDistance;
  const stops = experience.map(
    (_, i) => track.peakDistance + (timelineLength * (i + 1)) / (experience.length + 1)
  );
  stops.push(track.length);

  experience.forEach((job, i) => {
    const sign = createSign({ title: job.company, subtitle: job.period, color: job.color });
    track.placeAt(stops[i], sign);
    group.add(sign);
  });

  track.placeAt(0, cart);
  group.add(track.group, cart, createStation(), createHall());

  // Dark fog so the hall fades into blackness; the previous look is restored on exit.
  const hallFog = new THREE.Fog(HALL_COLOR, 20, 75);
  const hallBackground = new THREE.Color(HALL_COLOR);
  let outside = null;

  function enter(scene) {
    outside = { fog: scene.fog, background: scene.background };
    scene.fog = hallFog;
    scene.background = hallBackground;
  }

  // The camera rides inside the cart, so it must be back in the scene before this floor is torn down.
  function exit(scene) {
    if (riding) {
      held = false;
      card.hide();
      dismount();
    }
    scene.fog = outside.fog;
    scene.background = outside.background;
  }

  let riding = false;
  let held = false;
  let distance = 0;
  let speed = 0;
  let nextStop = 0;
  const heldActions = [{ label: 'Continue', run: resume }];

  function board() {
    if (riding) return;
    riding = true;
    distance = speed = nextStop = 0;
    cart.userData.interactive = false;
    cart.add(camera);
    camera.position.copy(RIDER_EYE);
    look.reset();
  }

  function dismount() {
    riding = false;
    distance = 0;
    track.placeAt(0, cart);
    cart.remove(camera);
    cart.userData.interactive = true;
    camera.position.copy(EXIT_POSITION);
    look.reset();
  }

  function arrive() {
    speed = 0;
    if (nextStop === stops.length - 1) {
      dismount();
      return onComplete?.();
    }
    held = true;
    card.show(experience[nextStop], nextStop, experience.length);
  }

  function resume() {
    if (!held) return;
    held = false;
    nextStop++;
    card.hide();
  }

  const listeners = new AbortController();
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') resume();
  }, { signal: listeners.signal });

  function dispose() {
    listeners.abort();
    card.dispose();
    disposeObject(group);
  }

  function update(delta) {
    if (!riding || held) return;
    const dt = Math.min(delta, 0.05);
    const stop = stops[nextStop];

    // Chain lift to the peak, then energy conservation from the peak; brake profile caps speed near each stop.
    const freeSpeed = distance < track.peakDistance
      ? CHAIN_SPEED
      : Math.sqrt(CHAIN_SPEED ** 2 + 2 * GRAVITY * (track.peakHeight - cart.position.y));
    const brakeSpeed = Math.sqrt(2 * BRAKE_DECEL * (stop - distance));
    speed = Math.max(CREEP_SPEED, Math.min(freeSpeed, brakeSpeed, speed + MAX_ACCEL * dt));

    distance = Math.min(stop, distance + speed * dt);
    track.placeAt(distance, cart);
    if (distance === stop) arrive();
  }

  return {
    group,
    ready: Promise.resolve(),
    enter,
    exit,
    dispose,
    update,
    interactions: { coasterCart: board },
    controlsLocked: () => riding,
    primary() {
      if (held) resume();
      return riding;
    },
    actions: () => (held ? heldActions : NO_ACTIONS),
  };
}
