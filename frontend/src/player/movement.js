import * as THREE from 'three'

export function lookControlsPC(camera, renderer) {
  const sensitivity = 0.002;

  // Lock the pointer on click
  renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
  });

  // Track yaw (left/right) and pitch (up/down) separately
  let yaw = 0; // left/right movement
  let pitch = 0; // up/down movement

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== renderer.domElement) return;

    yaw   -= e.movementX * sensitivity;
    pitch -= e.movementY * sensitivity;

    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch)); //This is to make sure that the pitch range = {-pi/2 <= pitch <= pi/2}

    camera.rotation.order = 'YXZ'; // ✅ Important: yaw before pitch
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  });
}