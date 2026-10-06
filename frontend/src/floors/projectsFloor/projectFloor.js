import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { createPainting, prepareFrameTemplate, playVideos } from './painting.js';
import { createDoorwayWall } from '../doorwayWall.js';
import { ELEVATOR_FRONT } from '../../objects/elevator/Elevator.js';

// Short hall in world metres: the front wall sits flush with the elevator, paintings hang on the other three walls.
const ROOM = {
    halfWidth: 3.6,
    floorY: 0.1,
    height: 4,
    frontZ: ELEVATOR_FRONT.z,
    backZ: -6.5,
};

const HANG_GAP = 0.01;

// Where each wall's paintings hang, facing into the room. `along` runs across the wall: x on the back wall, z on the sides.
const WALLS = {
    back: { rotationY: 0, position: (along, y) => [along, y, ROOM.backZ + HANG_GAP] },
    left: { rotationY: Math.PI / 2, position: (along, y) => [-ROOM.halfWidth + HANG_GAP, y, along] },
    right: { rotationY: -Math.PI / 2, position: (along, y) => [ROOM.halfWidth - HANG_GAP, y, along] },
};

const SIDE_CENTER_Z = (ROOM.frontZ + ROOM.backZ) / 2;

// Projects fill these in order: back-wall centrepiece, then left wall, then right wall.
// y is the frame centre above the floor; scale enlarges the frame together with its title and side panels.
const WALL_SLOTS = [
    { wall: 'back', along: 0, y: 1.95, scale: 1.8 },
    { wall: 'left', along: SIDE_CENTER_Z, y: 1.95, scale: 1.8 },
    { wall: 'right', along: SIDE_CENTER_Z, y: 1.95, scale: 1.8 },
];

function hangPaintings(group, frameTemplate, projects) {
    const interactions = {};
    if (projects.length > WALL_SLOTS.length) {
        console.warn(`Projects floor has ${WALL_SLOTS.length} wall spots; ${projects.length - WALL_SLOTS.length} project(s) not hung.`);
    }

    projects.slice(0, WALL_SLOTS.length).forEach((project, i) => {
        const { wall, along, y, scale } = WALL_SLOTS[i];
        const painting = createPainting(project, frameTemplate, { scale });
        painting.position.set(...WALLS[wall].position(along, y));
        painting.rotation.y = WALLS[wall].rotationY;

        if (project.link) {
            painting.name = `project-${i}`;
            painting.userData.interactive = true;
            interactions[painting.name] = () => window.open(project.link, '_blank', 'noopener');
        }
        group.add(painting);
    });

    return interactions;
}

function createRoom(materials) {
    const { halfWidth, floorY, height, frontZ, backZ } = ROOM;
    const width = halfWidth * 2;
    const depth = frontZ - backZ;
    const centerZ = (frontZ + backZ) / 2;
    const wallHeight = height - floorY;
    const wallY = floorY + wallHeight / 2;

    const sideGeometry = new THREE.PlaneGeometry(depth, wallHeight);
    const leftWall = new THREE.Mesh(sideGeometry, materials.backWall);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-halfWidth, wallY, centerZ);
    const rightWall = new THREE.Mesh(sideGeometry, materials.backWall);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(halfWidth, wallY, centerZ);

    const flatGeometry = new THREE.PlaneGeometry(width, depth);
    const floor = new THREE.Mesh(flatGeometry, materials.ground);
    floor.rotation.x = Math.PI / 2;
    floor.position.set(0, floorY, centerZ);
    const roof = new THREE.Mesh(flatGeometry, materials.backWall);
    roof.rotation.x = Math.PI / 2;
    roof.position.set(0, height, centerZ);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(width, wallHeight), materials.backWall);
    backWall.position.set(0, wallY, backZ);

    const frontWall = createDoorwayWall({ minX: -halfWidth, maxX: halfWidth, height, z: frontZ }, materials.wall);

    return [leftWall, rightWall, floor, roof, backWall, frontWall];
}

export function createProjectFloor(projects) {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./../../../draco/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const textureLoader = new THREE.TextureLoader();
    const overlayTexture = textureLoader.load(
        '/blenderFiles/ProjectsFloor/image2.png',
        () => console.log('Texture loaded OK'),
        undefined,
        (err) => console.error('Texture failed to load:', err)
    );

    const overlayTextureRoof = textureLoader.load(
        '/blenderFiles/ProjectsFloor/wallReference.png',
        () => console.log('Texture loaded OK'),
        undefined,
        (err) => console.error('Texture failed to load:', err)
    );

    const overlayTextureBackWall = textureLoader.load(
        '/blenderFiles/ProjectsFloor/image1.png',
        () => console.log('Texture loaded OK'),
        undefined,
        (err) => console.error('Texture failed to load:', err)
    );
    overlayTexture.colorSpace = THREE.SRGBColorSpace;

    const backWallMaterial = new THREE.MeshBasicMaterial({
        map: overlayTextureBackWall,
        side: THREE.DoubleSide,
        transparent: true,
    });

    const groundMaterial = new THREE.MeshBasicMaterial({
        map: overlayTexture,
        side: THREE.DoubleSide,
        transparent: true,
    });

    const roofMaterial = new THREE.MeshBasicMaterial({
        map: overlayTextureRoof,
        side: THREE.DoubleSide,
        transparent: true,
    });

    const group = new THREE.Group();
    const interactions = {};

    const ready = new Promise((resolve, reject) => loader.load(
        "./../../../blenderFiles/ProjectsFloor/ProjectsFloor.glb",
        (gltf) => {
            const frameTemplate = prepareFrameTemplate(gltf.scene.getObjectByName('Picture_Frame'));
            Object.assign(interactions, hangPaintings(group, frameTemplate, projects));

            group.add(...createRoom({ wall: roofMaterial, ground: groundMaterial, backWall: backWallMaterial }));
            resolve();
        },
        undefined,
        reject
    ));

    // Videos the phone refused to start (or paused in the background) get another try on arrival.
    return { group, ready, interactions, enter: playVideos };
}
