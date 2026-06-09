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

    camera.rotation.order = 'YXZ'; 
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  });
}

export function movementPC(camera) {
  const keys = {};

  document.addEventListener('keydown', (e) => { keys[e.code] = true; });
  document.addEventListener('keyup',   (e) => { keys[e.code] = false; });

  return function update() {
    const speed = 0.1;
    const direction = new THREE.Vector3();

    if (keys['ShiftLeft'] && (keys['KeyW'] || keys['ArrowUp']))
        direction.z -= 0.5;
    if (keys['KeyW'] || keys['ArrowUp'])    
        direction.z -= 0.2;
    if (keys['KeyS'] || keys['ArrowDown'])  
        direction.z += 0.2;
    if (keys['KeyA'] || keys['ArrowLeft'])  
        direction.x -= 0.2;
    if (keys['KeyD'] || keys['ArrowRight'])
        direction.x += 0.2;

    // Move relative to where the camera is facing
    direction.applyEuler(camera.rotation);
    direction.y = 0;

    camera.position.addScaledVector(direction, speed);
  }
}