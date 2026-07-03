// main.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { initScene } from './core/scene.js';
import { lookControlsPC, movementPC } from './player/movement.js';
import { createElevator } from './objects/elevator/Elevator.js';
import { objectInteraction } from './player/objectInteractions.js';
import { createProjectFloor } from './floors/floorManager.js';



const { scene, camera, renderer } = initScene();

const clock = new THREE.Clock();
const elevator = createElevator(renderer, scene);
const projectFloor = createProjectFloor(renderer, scene);


// --- Floor ---
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshLambertMaterial({ color: 0x888888 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

lookControlsPC(camera, renderer);
const updateMovement = movementPC(camera, scene);

const { composer, updateOutline } = objectInteraction(scene, camera, renderer);



function animate() {
  requestAnimationFrame(animate);
  elevator.update(clock.getDelta());
  updateMovement();
  const current = updateOutline();
  composer.render();
}

animate();