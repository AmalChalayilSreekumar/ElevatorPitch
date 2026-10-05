// main.js
import * as THREE from 'three';
import { initScene } from './core/scene.js';
import { lookControls, movementControls } from './player/movement.js';
import { createTouchControls } from './player/touchControls.js';
import { isTouch, setTouchMode } from './player/device.js';
import { createElevator } from './objects/elevator/Elevator.js';
import { objectInteraction } from './player/objectInteractions.js';
import { createFloorManager } from './floors/floorManager.js';
import { createIntroScreen } from './ui/introScreen.js';
import { createTutorial } from './ui/tutorial.js';
import { loadContent } from './api/content.js';

// Fetched before any model starts loading, so the intro screen is listening when the loading manager finishes.
const content = await loadContent();

const { scene, camera, renderer } = initScene();

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

const look = lookControls(camera, renderer);
const updateMovement = movementControls(camera, scene);

const floors = createFloorManager(scene, camera, look, elevator, content);
floors.preload('projects');
const tutorial = createTutorial(elevator, floors.floorButtons);
floors.firstSelection.then(tutorial.finish);

let playing = false;
let touch = null;
createIntroScreen(content.profile, (mode) => {
  setTouchMode(mode === 'mobile');
  if (isTouch()) {
    touch = createTouchControls(look);
    touch.show();
  } else {
    Promise.resolve(renderer.domElement.requestPointerLock()).catch(() => {});
  }
  playing = true;
  tutorial.start();
});

const { composer, updateOutline } = objectInteraction(scene, camera, renderer);
let hovered = null;

// Desktop clicks count once the pointer is locked (the first click only locks it); in mobile mode every tap counts.
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!playing || e.button !== 0) return;
  if (isTouch() || document.pointerLockElement === renderer.domElement) floors.primary(hovered);
});



function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  elevator.update(delta);
  floors.update(delta);
  if (playing) {
    touch?.update(delta);
    touch?.setActions(floors.actions());
    if (!floors.controlsLocked()) updateMovement(touch?.move);
  }
  hovered = updateOutline();
  touch?.setHoverAction(floors.touchPrompt(hovered));
  composer.render();
}

animate();
