import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';


export function createProjectFloor(renderer, scene){
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./../../../draco/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    let projectFloor;

    loader.load(
        "./../../../blenderFiles/ProjectsFloor/ProjectsFloor.glb",
        (gltf) => {
            projectFloor = gltf.scene;

            const mixer = new THREE.AnimationMixer(projectFloor);

            if (gltf.animations.length > 0) {
                console.log("animation exists");
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
            }

            const xPos = 0, yPos = .3, zPos = -10;
            projectFloor.position.set(xPos, yPos, zPos);
            scene.add(projectFloor);
        },
        (progress) => {
            console.log('Loading:', Math.round((progress.loaded / progress.total) * 100) + '%');
        },
        (error) => {
            console.error('Error:', error);
        }
    );

    return projectFloor;
}
