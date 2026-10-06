import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CAR_SPAWN } from '../objects/elevator/Elevator.js';


                                    
export function initScene() {
  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // --- Scene ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // sky blue
  scene.fog = new THREE.Fog(0x87ceeb, 10, 80);  // matches background color


  // --- Camera ---
  const fov = 75;                                         
  const aspectRatio = window.innerWidth / window.innerHeight;   
  const nearCPlane = 0.1;                                       
  const farCPlane = 1000;   
  const camera = new THREE.PerspectiveCamera(fov, aspectRatio, nearCPlane, farCPlane);
  camera.position.copy(CAR_SPAWN);
  camera.rotation.order = 'YXZ';           

// Soft fill light — prevents everything from being pitch black
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

  // --- Resize handler ---
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
