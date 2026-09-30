import * as THREE from 'three';
import { experience } from '../../data/experience.js';
import { createTrack } from './track.js';
import { createCart, RIDER_EYE } from './cart.js';
import { createSign } from './sign.js';
import { createTimelineCard } from './timelineCard.js';

const GRAVITY = 9.8;
const CHAIN_SPEED = 3;
const MAX_ACCEL = 8;
const BRAKE_DECEL = 8;
const CREEP_SPEED = 0.3;
const EXIT_POSITION = new THREE.Vector3(0, 1.7, -2.5);

function createStation() {
  const station = new THREE.Group();

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.1, 3),
    new THREE.MeshLambertMaterial({ color: 0xb8b8b8 })
  );
  platform.position.set(0, 0, -2.9);

  const safetyEdge = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.02, 0.2),
    new THREE.MeshLambertMaterial({ color: 0xffd166 })
  );
  safetyEdge.position.set(0, 0.06, -4.3);

  const sign = createSign(
    { title: 'Career Coaster', subtitle: 'Click the cart to ride', color: '#1d3557' },
    { span: 3.2, height: 2.8 }
  );
  sign.position.z = -3.9;

  station.add(platform, safetyEdge, sign);
  return station;
}

function createEnvironment() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshLambertMaterial({ color: 0x7fb069 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(20, 40, 10);

  const environment = new THREE.Group();
  environment.add(ground, sun, new THREE.HemisphereLight(0xcfe8ff, 0x4f6d3a, 0.6));
  return environment;
}

export function createExpFloor(camera, look) {
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
  group.add(track.group, cart, createStation(), createEnvironment());

  let riding = false;
  let held = false;
  let distance = 0;
  let speed = 0;
  let nextStop = 0;

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
    if (nextStop === stops.length - 1) return dismount();
    held = true;
    card.show(experience[nextStop], nextStop, experience.length);
  }

  function resume() {
    if (!held) return;
    held = false;
    nextStop++;
    card.hide();
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') resume();
  });

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
    update,
    interactions: { coasterCart: board },
    controlsLocked: () => riding,
  };
}
