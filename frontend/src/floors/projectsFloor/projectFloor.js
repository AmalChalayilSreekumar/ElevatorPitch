import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { projects } from '../../data/projects.js';
import { createPainting, prepareFrameTemplate } from './painting.js';

// Gallery layout in world metres, the only numbers to change when lining frames up with the wall panels.
// Left-wall values; the right wall mirrors them automatically.
const GALLERY = {
    firstPairZ: -2.7,   // how far down the hall the first pair hangs (more negative = further from the elevator)
    height: 2.1,        // centre of each frame above the floor
    pairSpacing: 4.2,   // distance between one pair and the next
    wallX: 1.49,        // centre of hall to back of frame (walls are at ±1.5)
};

// Projects fill the hall in facing pairs: even indices on the left wall, odd directly opposite.
function hangPaintings(group, frameTemplate) {
    const interactions = {};

    projects.forEach((project, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        // Labels sit on the far side of every painting, so the right wall is a true mirror of the left.
        const painting = createPainting(project, frameTemplate, { labelSide: -side });
        const pair = Math.floor(i / 2);
        painting.position.set(
            side * GALLERY.wallX,
            GALLERY.height,
            GALLERY.firstPairZ - pair * GALLERY.pairSpacing
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
