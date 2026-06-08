// main.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { initScene } from './core/scene.js';
import { lookControlsPC } from './player/movement.js';


const { scene, camera, renderer } = initScene();

// --- DRACO + GLTF loader setup ---
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

let elevator;


  loader.load('/blenderFiles/Elevator/ElevatorMain.glb', (gltf) => {
    elevator = gltf.scene;

    // Override every mesh's material roughness after loading
    elevator.traverse((child) => {
    
      if (child.isMesh) {
        child.material.roughness = 0.3;
        child.material.metalness = 0.9;
      }
      console.log(child.parent)
    });

    elevator.position.set(0,1.7,0)
    scene.add(elevator);
  },
  (progress) => {
    console.log('Loading:', Math.round((progress.loaded / progress.total) * 100) + '%');
  },
  (error) => {
    console.error('Error:', error);
  }
);

// --- Floor ---
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshLambertMaterial({ color: 0x888888 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

lookControlsPC(camera, renderer);


// --- Game loop ---
function animate() {
  requestAnimationFrame(animate);
  // camera.rotation.x = 0.5
  renderer.render(scene, camera);
}

animate();