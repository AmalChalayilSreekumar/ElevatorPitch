import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export function createProjectFloor(renderer, scene){
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./../../../draco/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const textureLoader = new THREE.TextureLoader();
    const overlayTexture = textureLoader.load(
        '/blenderFiles/ProjectsFloor/overlayImageTest.png',
        () => console.log('Texture loaded OK'),
        undefined,
        (err) => console.error('Texture failed to load:', err)
    );

    const overlayTextureWalls = textureLoader.load(
        '/blenderFiles/ProjectsFloor/image1.png',
        () => console.log('Texture loaded OK'),
        undefined,
        (err) => console.error('Texture failed to load:', err)
    );
    overlayTexture.colorSpace = THREE.SRGBColorSpace;

    const wallMaterial = new THREE.MeshBasicMaterial({
        map: overlayTextureWalls,
        side: THREE.DoubleSide,
        transparent: true,
    });

    const groundMaterial = new THREE.MeshBasicMaterial({
        map: overlayTexture,
        side: THREE.DoubleSide,
        transparent: true,
    });
    
    let projectFloor;

    loader.load(
        "./../../../blenderFiles/ProjectsFloor/ProjectsFloor.glb",
        (gltf) => {
            projectFloor = gltf.scene;

            if (gltf.animations.length > 0) {
                console.log("animation exists");
                const mixer = new THREE.AnimationMixer(projectFloor);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
            }

            projectFloor.traverse((child) => {
                if (child.isMesh) console.log('mesh found:', child.name);
            });

            const xPos = 0, yPos = 0.3, zPos = -10;
            projectFloor.position.set(xPos, yPos, zPos);
            scene.add(projectFloor);

            const wallGeometry = new THREE.PlaneGeometry(20, 3);
            const floorGeometry = new THREE.PlaneGeometry(3.6, 20)
            const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
            const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
            const floor = new THREE.Mesh(floorGeometry, groundMaterial);
            const roof = new THREE.Mesh(floorGeometry, wallMaterial);
            leftWall.position.set(-1.4,1.7,-10);
            leftWall.rotation.y= THREE.MathUtils.degToRad(90);
            rightWall.position.set(1.4, 1.7, -10);
            rightWall.rotation.y = THREE.MathUtils.degToRad(90);
            floor.position.set(0,0.1,-10);
            floor.rotation.x = THREE.MathUtils.degToRad(90);
            roof.position.set(0,3.2,-10);
            roof.rotation.x = THREE.MathUtils.degToRad(90);
            
            scene.add(floor)
            scene.add(rightWall);
            scene.add(leftWall);
            scene.add(roof)
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
