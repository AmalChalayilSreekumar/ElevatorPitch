import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { projects } from '../../data/projects.js';
import { createPainting, prepareFrameTemplate } from './painting.js';

const HALL_HALF_WIDTH = 1.5;
const FIRST_PAINTING_Z = -3;
const PAINTING_SPACING = 2.6;
const PAINTING_HEIGHT = 1.7;

// Alternates walls, staggering the right wall so paintings never face each other directly.
function hangPaintings(group, frameTemplate) {
    const interactions = {};

    projects.forEach((project, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const painting = createPainting(project, frameTemplate);
        painting.position.set(
            side * (HALL_HALF_WIDTH - 0.01),
            PAINTING_HEIGHT,
            FIRST_PAINTING_Z - Math.floor(i / 2) * PAINTING_SPACING - (side > 0 ? PAINTING_SPACING / 2 : 0)
        );
        painting.rotation.y = -side * Math.PI / 2;

        if (project.link) {
            painting.name = `project-${i}`;
            painting.userData.interactive = true;
            interactions[painting.name] = () => window.open(project.link, '_blank', 'noopener');
        }
        group.add(painting);
    });

    return interactions;
}

export function createProjectFloor() {
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
            Object.assign(interactions, hangPaintings(group, frameTemplate));

            const wallGeometry = new THREE.PlaneGeometry(20, 3.1);
            const floorGeometry = new THREE.PlaneGeometry(3.1, 20);
            const backWallGeometry = new THREE.PlaneGeometry(3,3.2)
            const rightWall = new THREE.Mesh(wallGeometry, roofMaterial);
            const leftWall = new THREE.Mesh(wallGeometry, roofMaterial);
            const floor = new THREE.Mesh(floorGeometry, groundMaterial);
            const roof = new THREE.Mesh(floorGeometry, backWallMaterial);
            const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial)
            leftWall.position.set(-1.5,1.7,-10);
            leftWall.rotation.y= THREE.MathUtils.degToRad(90);
            rightWall.position.set(1.5, 1.7, -10);
            rightWall.rotation.y = THREE.MathUtils.degToRad(90);
            floor.position.set(0,0.1,-10);
            floor.rotation.x = THREE.MathUtils.degToRad(90);
            roof.position.set(0,3.2,-10);
            roof.rotation.x = THREE.MathUtils.degToRad(90);
            backWall.position.set(0,1.7,-20)

            group.add(floor, rightWall, leftWall, roof, backWall);
            resolve();
        },
        undefined,
        reject
    ));

    return { group, ready, interactions };
}
