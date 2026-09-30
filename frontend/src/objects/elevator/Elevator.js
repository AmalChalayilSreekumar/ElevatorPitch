import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { createFloorDisplay } from './floorDisplay.js';

// Display mesh -> world direction its screen faces (into the car / out to the floor).
const DISPLAYS = {
    floorDisplayInside001: new THREE.Vector3(0, 0, 1),
    floorDisplayOutside001: new THREE.Vector3(0, 0, -1),
};


export function createElevator(renderer, scene){
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./../../../draco/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    let mixer = null;
    let doorActions = [];
    let displays = [];
    let displayText = '';

    loader.load("./../../../blenderFiles/Elevator/ElevatorMain.glb", (gltf) => {
        const elevator = gltf.scene;

        // Door clips run forward to open and in reverse to close; they start paused on the closed pose.
        mixer = new THREE.AnimationMixer(elevator);
        doorActions = gltf.animations.map((clip) => {
            const action = mixer.clipAction(clip);
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.play();
            action.paused = true;
            return action;
        });

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

        displays = Object.entries(DISPLAYS).map(([name, facing]) =>
            createFloorDisplay(elevator.getObjectByName(name), facing)
        );
        displays.forEach((show) => show(displayText));
    },
    (progress) => {
        console.log('Loading:', Math.round((progress.loaded / progress.total) * 100) + '%');
    },
    (error) => {
        console.error('Error:', error);
    }
    );

    let doorsOpen = false;

    function setDoors(open) {
        if (open === doorsOpen || doorActions.length === 0) return Promise.resolve();
        doorsOpen = open;

        return new Promise((resolve) => {
            let remaining = doorActions.length;
            const onFinished = (e) => {
                if (!doorActions.includes(e.action) || --remaining > 0) return;
                mixer.removeEventListener('finished', onFinished);
                resolve();
            };
            mixer.addEventListener('finished', onFinished);

            for (const action of doorActions) {
                action.timeScale = open ? 1 : -1;
                action.paused = false;
                action.play();
            }
        });
    }

    return {
        openDoors: () => setDoors(true),
        closeDoors: () => setDoors(false),
        setDisplay(text) {
            displayText = text;
            displays.forEach((show) => show(text));
        },
        update(delta) {
            if (mixer) mixer.update(delta);
        }
    };
}
