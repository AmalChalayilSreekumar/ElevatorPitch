import * as THREE from 'three'
import { createPlayerCollisions } from './collisions.js';
import { isTouch } from './device.js';

const MAX_PITCH = Math.PI / 2;
const STEP = 0.2;
// Forward always runs (no Shift needed): the old Shift + W sprint speed.
const RUN = STEP + 0.5;
// The move stick walks faster than the keys in every direction, and faster still forward, close to W's run.
const STICK_SPEED = 1.5;
const STICK_FORWARD_BOOST = 2;

// Chromium on Windows sometimes reports one huge, wrong-signed movement while the pointer is locked (when the hidden
// OS cursor is re-centred). Real mouse events are tens of pixels at most, so anything bigger is dropped, not applied.
const MAX_LOOK_STEP = 250;

// Raw mouse input where supported (Chromium): bypasses the OS cursor that causes those spikes, and its acceleration.
export function lockPointer(canvas) {
  const plain = () => Promise.resolve(canvas.requestPointerLock()).catch(() => {});
  try {
    return Promise.resolve(canvas.requestPointerLock({ unadjustedMovement: true })).catch(plain);
  } catch {
    return plain();
  }
}

export function lookControls(camera, renderer) {
  const sensitivity = 0.002;

  let yaw = 0; // left/right movement
  let pitch = 0; // up/down movement

  function turn(dYaw, dPitch) {
    yaw -= dYaw;
    pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch - dPitch));
    camera.rotation.set(pitch, yaw, 0);
  }

  // Mobile mode looks by dragging (player/touchControls.js) and never locks the pointer (iOS doesn't implement it).
  renderer.domElement.addEventListener('click', () => {
    if (!isTouch()) lockPointer(renderer.domElement);
  });

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== renderer.domElement) return;
    if (Math.abs(e.movementX) > MAX_LOOK_STEP || Math.abs(e.movementY) > MAX_LOOK_STEP) return;
    turn(e.movementX * sensitivity, e.movementY * sensitivity);
  });

  return {
    turn,
    reset(newYaw = 0, newPitch = 0) {
      yaw = newYaw;
      pitch = newPitch;
      camera.rotation.set(pitch, yaw, 0);
    },
  };
}

export function movementControls(camera, scene) {
  const keys = {};
  const { resolveCollisions } = createPlayerCollisions(scene);  //  init collisions
  const direction = new THREE.Vector3();

  document.addEventListener('keydown', (e) => { keys[e.code] = true; });
  document.addEventListener('keyup',   (e) => { keys[e.code] = false; });

  // stick: optional analog input in [-1, 1], x right and y down (towards the player), as the joystick reports it.
  return function update(stick) {
    const speed = 0.1;
    direction.set(0, 0, 0);

    if (keys['KeyW'] || keys['ArrowUp'])
        direction.z -= RUN;
    if (keys['KeyS'] || keys['ArrowDown'])
        direction.z += STEP;
    if (keys['KeyA'] || keys['ArrowLeft'])
        direction.x -= STEP;
    if (keys['KeyD'] || keys['ArrowRight'])
        direction.x += STEP;

    if (stick) {
      direction.x += stick.x * STEP * STICK_SPEED;
      direction.z += stick.y * STEP * STICK_SPEED * (stick.y < 0 ? STICK_FORWARD_BOOST : 1);
    }

    direction.applyEuler(camera.rotation);
    direction.y = 0;

    const safe = resolveCollisions(camera, direction);
    camera.position.addScaledVector(safe, speed);  // ← was: direction
  }
}
