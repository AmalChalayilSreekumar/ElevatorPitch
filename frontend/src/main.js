import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'



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