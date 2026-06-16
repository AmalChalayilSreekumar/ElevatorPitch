import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';


// function openDoors(elevator, gltf){
//     const mixer = new THREE.AnimationMixer(elevator);
//     const i = 0
//     if (gltf.animations.length > 0) {
//         // Play the very first animation track found in the file
        // const action = mixer.clipAction(gltf.animations[0]);
        // action.play();
//     } else if (i==1){
//         console.log("No animation");
//         i+=1
//     }
// }

export function createElevator(renderer, scene){
    // --- DRACO + GLTF loader setup ---
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./../../../draco/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    let elevator;


    loader.load("./../../../blenderFiles/Elevator/ElevatorMain.glb", (gltf) => {
        elevator = gltf.scene;

        const mixer = new THREE.AnimationMixer(elevator);

        if (gltf.animations.length > 0){
            console.log("animation exists")
        }

        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        // Override every mesh's material roughness after loading
        elevator.traverse((child) => {
        
        if (child.isMesh) {
            child.material.roughness = 0.3;
            child.material.metalness = 0.9;
        }
        if (child.name == "world") {
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            child.material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 4.0
            });


            console.log(child.position);
            const light1 = new THREE.PointLight(0xffffff, 1.5);
            light1.castShadow = true;
            light1.shadow.radius = 100;
            child.add(light1)
        }

        child.receiveShadow = true;

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


    return elevator;
}