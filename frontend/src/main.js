// main.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { initScene } from './core/scene.js';
import { lookControlsPC, movementPC } from './player/movement.js';



const { scene, camera, renderer } = initScene();

// --- DRACO + GLTF loader setup ---
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

let elevator;


  loader.load('/blenderFiles/Elevator/ElevatorTest.glb', (gltf) => {
    elevator = gltf.scene;

    // Override every mesh's material roughness after loading
    elevator.traverse((child) => {
    
      if (child.isMesh) {
        child.material.roughness = 0.3;
        child.material.metalness = 0.9;
      }
      if (child.name == "world"){
        child.material = new THREE.MeshStandardMaterial({
          color: 0x000000,
          emissive: 0x000000,
          emissiveIntensity: 1.0
        });

        const light = new THREE.PointLight(0xffffff, 1.5, 10);
        light.castShadow = true;


        child.add(light)
      }

    });

    elevator.position.set(0,1.7,0)
    scene.add(elevator);
  },
  // (progress) => {
  //   console.log('Loading:', Math.round((progress.loaded / progress.total) * 100) + '%');
  // },
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
const updateMovement = movementPC(camera);

function animate() {
  requestAnimationFrame(animate);
  updateMovement();
  renderer.render(scene, camera);
}

animate();