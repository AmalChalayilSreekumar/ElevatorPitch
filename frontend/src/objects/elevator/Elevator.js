import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { createFloorDisplay } from './floorDisplay.js';

// Display mesh -> world direction its screen faces (into the car / out to the floor).
const DISPLAYS = {
    floorDisplayInside001: new THREE.Vector3(0, 0, 1),
    floorDisplayOutside001: new THREE.Vector3(0, 0, -1),
};

// Panel button -> [label plate, label text, rim] around it (GLTFLoader drops the '.' from Blender's 'Cube.001').
// The buttons alone are small targets, so aiming at any of their parts presses the button; the plate glows with it.
const BUTTON_PARTS = {
    buttonInner1: ['Cube', 'Text001', 'Cylinder001'], // Experience
    buttonInner3: ['Cube002', 'Text002', 'Cylinder'], // Stack
    buttonInner2: ['Cube003', 'Text', 'Cylinder003'], // Projects
    buttonInner: ['Cube001', 'Text003', 'Cylinder002'], // Close door
};

// The car's outer front face (mButtonSquare.001 in ElevatorMain.glb), measured in world metres once placed.
// Every floor's front wall stands at z with a doorway cut to this face (floors/doorwayWall.js).
export const ELEVATOR_FRONT = { z: -0.5, halfWidth: 1.38, bottom: 0.25, top: 3.15 };
// Where the player stands inside the car: the start of the game and where the floor guide returns them.
export const CAR_SPAWN = new THREE.Vector3(0, 1.7, 2);
const MODEL_FACE_Z = -0.343;
// The face sits just behind the floor's front wall so the two never z-fight.
const FACE_INSET = 0.01;

// Meshes passed to setPulsing breathe with this soft backlight glow.
const PULSE_COLOR = 0xfff1d6;
const PULSE_SPEED = 4;


export function createElevator(renderer, scene){
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./../../../draco/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    let mixer = null;
    let doorActions = [];
    let displays = [];
    let displayText = '';
    let model = null;
    let pulseNames = [];
    let pulseMaterials = [];
    let pulse = 0;

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

        elevator.position.set(0, 1.7, ELEVATOR_FRONT.z + FACE_INSET - MODEL_FACE_Z);
        scene.add(elevator);

        displays = Object.entries(DISPLAYS).map(([name, facing]) =>
            createFloorDisplay(elevator.getObjectByName(name), facing)
        );
        displays.forEach((show) => show(displayText));

        for (const [buttonName, partNames] of Object.entries(BUTTON_PARTS)) {
            const button = elevator.getObjectByName(buttonName);
            const parts = partNames.map((name) => elevator.getObjectByName(name));
            for (const part of parts) {
                part.userData.interactive = true;
                part.userData.pressTarget = button;
            }
            button.userData.outline = [button, parts[0]];
        }

        model = elevator;
        applyPulse();
    },
    (progress) => {
        console.log('Loading:', Math.round((progress.loaded / progress.total) * 100) + '%');
    },
    (error) => {
        console.error('Error:', error);
    }
    );

    let doorsOpen = false;

    function applyPulse() {
        pulseMaterials.forEach((material) => { material.emissiveIntensity = 0; });
        // A pulsing button takes its label plate with it.
        const names = pulseNames.flatMap((name) => (BUTTON_PARTS[name] ? [name, BUTTON_PARTS[name][0]] : [name]));
        pulseMaterials = names.map((name) => {
            const mesh = model.getObjectByName(name);
            // Own copy so the glow can't leak onto other meshes sharing the material.
            if (!mesh.userData.pulseMaterial) {
                mesh.material = mesh.userData.pulseMaterial = mesh.material.clone();
                mesh.material.emissive.set(PULSE_COLOR);
            }
            return mesh.material;
        });
        pulse = 0;
    }

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
        isOpen: () => doorsOpen,
        // World position of a named part of the car, or null before the model has loaded.
        worldPosition: (name, target = new THREE.Vector3()) => model?.getObjectByName(name)?.getWorldPosition(target) ?? null,
        openDoors: () => setDoors(true),
        closeDoors: () => setDoors(false),
        setDisplay(text) {
            displayText = text;
            displays.forEach((show) => show(text));
        },
        // Mesh names to pulse; [] stops. Applied once the model loads if called earlier.
        setPulsing(names) {
            pulseNames = names;
            if (model) applyPulse();
        },
        update(delta) {
            if (mixer) mixer.update(delta);
            if (pulseMaterials.length) {
                pulse += delta * PULSE_SPEED;
                const intensity = 0.5 - 0.5 * Math.cos(pulse);
                pulseMaterials.forEach((material) => { material.emissiveIntensity = intensity; });
            }
        }
    };
}
