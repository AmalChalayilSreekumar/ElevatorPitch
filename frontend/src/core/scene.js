import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'


                                    
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
  const xPos = 0, yPos = 1.7, zPos = 2.5;

  camera.position.set(xPos, yPos, zPos);           // eye height
  camera.rotation.order = 'YXZ';            // critical for FPS look

// Soft fill light — prevents everything from being pitch black
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Directional light — acts like the sun, creates shadows
// const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
// dirLight.position.set(0, 10, 0);
// scene.add(dirLight);

//   const sun = new THREE.DirectionalLight(0xffffff, 1.0);
//   sun.position.set(0, 60, 100);
//   sun.castShadow = true;
//   sun.shadow.mapSize.set(2048, 2048);
//   sun.shadow.camera.near = 0.5;
//   sun.shadow.camera.far = 200;
//   sun.shadow.camera.left = -50;
//   sun.shadow.camera.right = 50;
//   sun.shadow.camera.top = 50;
//   sun.shadow.camera.bottom = -50;
//   scene.add(sun);

  // --- Resize handler ---
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
