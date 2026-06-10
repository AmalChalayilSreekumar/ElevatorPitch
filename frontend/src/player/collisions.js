import * as THREE from 'three';

const playerRadius = 0.2;

const rayDirections =  [
    new THREE.Vector3( 1,  0,  0),  // right
    new THREE.Vector3(-1,  0,  0),  // left
    new THREE.Vector3( 0,  0,  1),  // back
    new THREE.Vector3( 0,  0, -1),  // forward
    new THREE.Vector3( 0,  1,  0),  // up
    new THREE.Vector3( 0, -1,  0),  // down
];


export function createPlayerCollisions(scene) {
    const raycaster = new THREE.Raycaster();

    // Returns a velocity vector with collision directions zeroed out
    // Call this every frame BEFORE applying movement to the camera
    function resolveCollisions(camera, velocity) {
        const origin = camera.position.clone();
        const resolved = velocity.clone();

        for (const dir of rayDirections) {
            raycaster.set(origin, dir);
            raycaster.far = playerRadius;  // only detect within arm's reach

            // true = check nested children (important for GLTF models)
            const hits = raycaster.intersectObjects(scene.children, true);

            if (hits.length > 0) {
                if (dir.x !== 0 && Math.sign(resolved.x) === Math.sign(dir.x)){
                    resolved.x = 0;
                    // console.log("x collision")
                }
                if (dir.y !== 0 && Math.sign(resolved.y) === Math.sign(dir.y)){
                    resolved.y = 0;
                    // console.log("y collision")
                } 
                if (dir.z !== 0 && Math.sign(resolved.z) === Math.sign(dir.z)) {
                    resolved.z = 0;
                    // console.log("z collision")
                }
            }
        }

        return resolved;
    }

    return { resolveCollisions };
}
