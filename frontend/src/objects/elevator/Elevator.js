import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';


export function createElevator(renderer, scene){
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./../../../draco/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    let mixer = null;

    loader.load("./../../../blenderFiles/Elevator/ElevatorMain.glb", (gltf) => {
        const elevator = gltf.scene;

        if (gltf.animations.length > 0) {
            console.log("animations found:", gltf.animations.map(a => a.name));
            mixer = new THREE.AnimationMixer(elevator);
            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
                action.play();
            });
        }

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
                child.add(light1);
            }

            child.receiveShadow = true;
        });

        elevator.position.set(0, 1.7, 0);
        scene.add(elevator);
    },
    (progress) => {
        console.log('Loading:', Math.round((progress.loaded / progress.total) * 100) + '%');
    },
    (error) => {
        console.error('Error:', error);
    }
    );

    return {
        update(delta) {
            if (mixer) mixer.update(delta);
        }
    };
}
