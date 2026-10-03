import * as THREE from 'three';
import { stack } from '../../data/stack.js';
import { createRange, RANGE } from './range.js';
import { createTarget } from './target.js';
import { createGun, createMuzzleFlash } from './gun.js';
import { createRangeHud } from './rangeHud.js';

// Targets float at these spots downrange; each pop-up picks a free one, never the spot just used.
// Needs at least ACTIVE_TARGETS + 1 entries.
const SPAWN_POINTS = [
  [-2.2, 1.8, -7.5],
  [2.0, 2.2, -8],
  [0, 1.6, -9.5],
  [-3.2, 2.3, -10.5],
  [3.0, 1.7, -11],
  [-1.0, 2.5, -12.5],
  [1.6, 2.0, -13],
].map(([x, y, z]) => new THREE.Vector3(x, y, z));
// How many targets float at once; they appear in data order and the list loops after a full clear.
const ACTIVE_TARGETS = 1;
const RESPAWN_DELAY = 0.4;

const SHOOTING_POSITION = new THREE.Vector3(0, 1.7, RANGE.counterZ + 0.8);
const VIEWMODEL_OFFSET = new THREE.Vector3(0.2, -0.22, -0.45);
const FIRE_COOLDOWN = 0.15;
const RECOIL_RECOVERY = 6;
const AIM = new THREE.Vector2(0, 0);
const HALL_COLOR = 0x101114;

const noRaycast = () => {};

function createCounterGun() {
  const gun = createGun();
  gun.name = 'rangeGun';
  gun.userData.interactive = true;
  gun.position.set(0, RANGE.counterHeight + 0.036, RANGE.counterZ + 0.1);
  gun.rotation.set(0, -0.4, Math.PI / 2);
  return gun;
}

export function createStackFloor(camera, look) {
  const group = new THREE.Group();
  const slots = stack.map((entry, index) => ({ entry, index, target: createTarget(entry), point: -1 }));
  const slotByFace = new Map(slots.map((slot) => [slot.target.face, slot]));
  group.add(...slots.map(({ target }) => target.group));

  const counterGun = createCounterGun();
  const heldGun = createGun();
  const flash = createMuzzleFlash();
  heldGun.add(flash);
  const viewmodel = new THREE.Group();
  viewmodel.add(heldGun);
  viewmodel.visible = false;
  viewmodel.traverse((child) => { child.raycast = noRaycast; });

  group.add(createRange(), counterGun, viewmodel);

  const hud = createRangeHud(stack.length);
  const raycaster = new THREE.Raycaster();
  const hits = new Set();

  const rangeFog = new THREE.Fog(HALL_COLOR, 25, 60);
  const rangeBackground = new THREE.Color(HALL_COLOR);
  let outside = null;

  let armed = false;
  let cooldown = 0;
  let recoil = 0;
  let nextSlot = 0;
  let lastPoint = -1;
  let respawns = [];

  function spawn() {
    let slot;
    for (let tries = 0; tries < slots.length && !slot?.target.hidden(); tries++) {
      slot = slots[nextSlot];
      nextSlot = (nextSlot + 1) % slots.length;
    }
    if (!slot?.target.hidden()) return;

    const taken = new Set(slots.filter(({ target }) => !target.hidden()).map(({ point }) => point));
    const free = SPAWN_POINTS.map((_, i) => i).filter((i) => !taken.has(i) && i !== lastPoint);
    slot.point = lastPoint = free[Math.floor(Math.random() * free.length)];
    slot.target.popUp(SPAWN_POINTS[slot.point], SHOOTING_POSITION);
  }

  for (let i = 0; i < Math.min(ACTIVE_TARGETS, slots.length); i++) spawn();

  function pickUp() {
    if (armed) return;
    armed = true;
    camera.position.copy(SHOOTING_POSITION);
    look.reset();
    counterGun.visible = false;
    counterGun.userData.interactive = false;
    viewmodel.visible = true;
    hud.show();
  }

  function putDown() {
    if (!armed) return;
    armed = false;
    counterGun.visible = true;
    counterGun.userData.interactive = true;
    viewmodel.visible = false;
    hud.hide();
  }

  const hittable = () => slots.filter(({ target }) => target.hittable()).map(({ target }) => target.face);

  function fire() {
    if (cooldown > 0) return;
    cooldown = FIRE_COOLDOWN;
    recoil = 1;

    raycaster.setFromCamera(AIM, camera);
    const [hit] = raycaster.intersectObjects(hittable(), false);
    if (!hit) return;

    const slot = slotByFace.get(hit.object);
    slot.target.hit();
    hits.add(slot.index);
    hud.hit(slot.entry.name, hits.size);
    respawns.push(RESPAWN_DELAY);
  }

  document.addEventListener('mousedown', (e) => {
    if (armed && e.button === 0 && document.pointerLockElement) fire();
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE') putDown();
  });
  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement) putDown();
  });

  function enter(scene) {
    outside = { fog: scene.fog, background: scene.background };
    scene.fog = rangeFog;
    scene.background = rangeBackground;
  }

  function exit(scene) {
    putDown();
    scene.fog = outside.fog;
    scene.background = outside.background;
  }

  function update(delta) {
    const dt = Math.min(delta, 0.05);
    for (const { target } of slots) target.update(dt);

    respawns = respawns.map((wait) => wait - dt);
    while (respawns[0] <= 0) {
      respawns.shift();
      spawn();
    }

    if (!armed) return;
    cooldown = Math.max(0, cooldown - dt);
    recoil = Math.max(0, recoil - RECOIL_RECOVERY * dt);
    heldGun.position.copy(VIEWMODEL_OFFSET);
    heldGun.position.z += recoil * 0.06;
    heldGun.rotation.x = recoil * 0.25;
    flash.visible = recoil > 0.7;
    viewmodel.position.copy(camera.position);
    viewmodel.quaternion.copy(camera.quaternion);
  }

  return {
    group,
    ready: Promise.resolve(),
    enter,
    exit,
    update,
    interactions: { rangeGun: pickUp },
    controlsLocked: () => armed,
  };
}
