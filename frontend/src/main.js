import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x222222)

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 2, 8)

// Renderer
const isMobile = /Mobi|Android/i.test(navigator.userAgent)
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
document.body.appendChild(renderer.domElement)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
directionalLight.position.set(5, 10, 5)
scene.add(directionalLight)

const pointLight = new THREE.PointLight(0x0fffff, 7, 100)
pointLight.position.set(0, 5, 5)
scene.add(pointLight)

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const loader = new GLTFLoader()
loader.setDRACOLoader(dracoLoader)

let elevator

loader.load(
  '/blenderFiles/Elevator/ElevatorMain.glb',
  (gltf) => {
    elevator = gltf.scene

    const box = new THREE.Box3().setFromObject(elevator)
    const center = box.getCenter(new THREE.Vector3())
    elevator.position.sub(center)

    // Log size so we can check if camera needs adjusting
    const size = box.getSize(new THREE.Vector3())
    console.log('Model size:', size)

    scene.add(elevator)
  },
  (progress) => {
    console.log('Loading:', Math.round((progress.loaded / progress.total) * 100) + '%')
  },
  (error) => {
    console.error('Error:', error)
  }
)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

function animate() {
  requestAnimationFrame(animate)
  if (elevator) elevator.rotation.y += 0.005
  controls.update()
  renderer.render(scene, camera)
}

animate()