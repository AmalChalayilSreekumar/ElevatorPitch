// main.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { initScene } from './core/scene.js';
import { lookControlsPC, movementPC } from './player/movement.js';
import { createElevator } from './objects/elevator/Elevator.js';
import { objectInteraction } from './player/objectInteractions.js';
import { createFloorManager } from './floors/floorManager.js';
import { createIntroScreen } from './ui/introScreen.js';
import { profile } from './data/profile.js';



const { scene, camera, renderer } = initScene();

let playing = false;
createIntroScreen(profile, () => {
  playing = true;
  Promise.resolve(renderer.domElement.requestPointerLock()).catch(() => {});
});

const clock = new THREE.Clock();
const elevator = createElevator(renderer, scene);


// --- Floor ---
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshLambertMaterial({ color: 0x888888 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const look = lookControlsPC(camera, renderer);
const updateMovement = movementPC(camera, scene);

const floors = createFloorManager(scene, camera, look, elevator);
floors.preload('projects');

const { composer, updateOutline } = objectInteraction(scene, camera, renderer);
let hovered = null;

renderer.domElement.addEventListener('click', () => {
  if (hovered && document.pointerLockElement === renderer.domElement) floors.interact(hovered);
});



function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  elevator.update(delta);
  floors.update(delta);
  if (playing && !floors.controlsLocked()) updateMovement();
  hovered = updateOutline();
  composer.render();
}

animate();