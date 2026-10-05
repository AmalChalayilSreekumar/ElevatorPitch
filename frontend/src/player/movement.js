import * as THREE from 'three'
import { createPlayerCollisions } from './collisions.js';
import { isTouch } from './device.js';

const MAX_PITCH = Math.PI / 2;
const STEP = 0.2;
// Pushing the move stick forward walks faster than keyboard W; phones have no Shift to sprint with.
const STICK_FORWARD_BOOST = 2;

export function lookControls(camera, renderer) {
  const sensitivity = 0.002;

  let yaw = 0; // left/right movement
  let pitch = 0; // up/down movement

  function turn(dYaw, dPitch) {
    yaw -= dYaw;
    pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch - dPitch));
    camera.rotation.set(pitch, yaw, 0);
  }

  // Mobile mode looks with the right joystick and never locks the pointer (iOS doesn't implement it).
  renderer.domElement.addEventListener('click', () => {
    if (!isTouch()) renderer.domElement.requestPointerLock();
  });

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== renderer.domElement) return;
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

    if (keys['ShiftLeft'] && (keys['KeyW'] || keys['ArrowUp']))
        direction.z -= 0.5;
    if (keys['KeyW'] || keys['ArrowUp'])
        direction.z -= STEP;
    if (keys['KeyS'] || keys['ArrowDown'])
        direction.z += STEP;
    if (keys['KeyA'] || keys['ArrowLeft'])
        direction.x -= STEP;
    if (keys['KeyD'] || keys['ArrowRight'])
        direction.x += STEP;

    if (stick) {
      direction.x += stick.x * STEP;
      direction.z += stick.y * STEP * (stick.y < 0 ? STICK_FORWARD_BOOST : 1);
    }

    direction.applyEuler(camera.rotation);
    direction.y = 0;

    const safe = resolveCollisions(camera, direction);
    camera.position.addScaledVector(safe, speed);  // ← was: direction
  }
}
