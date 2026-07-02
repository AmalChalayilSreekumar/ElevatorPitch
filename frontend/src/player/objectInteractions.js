import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


const interactionalObjects = ["buttonInner","buttonInner1","buttonInner2","buttonInner3"]

export function objectInteraction(scene, camera, renderer) {
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const crossHairPos = new THREE.Vector2(window.innerWidth, window.innerHeight)
    const outlinePass = new OutlinePass(crossHairPos, scene, camera);

    outlinePass.edgeStrength = 6;
    outlinePass.edgeGlow = 0.4;
    outlinePass.edgeThickness = 1;
    outlinePass.visibleEdgeColor.set('#ffffff');
    outlinePass.hiddenEdgeColor.set('#000000');
    composer.addPass(outlinePass);
    composer.addPass(new OutputPass());

    const raycaster = new THREE.Raycaster();
    raycaster.far = 10;
    const center = new THREE.Vector2(0, 0);
    let currentSelected = null;

    window.addEventListener('resize', () => {
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    function updateOutline() {
        raycaster.setFromCamera(center, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        let hit = null;
        for (let i = 0; i < intersects.length; i++) {
            if (interactionalObjects.includes(intersects[i].object.name)) {
                hit = intersects[i];
                break;
            }
        }

        const newSelected = hit ? hit.object : null;
        if (newSelected !== currentSelected) {
            currentSelected = newSelected;
            outlinePass.selectedObjects = newSelected ? [newSelected] : [];
        }
        return currentSelected;
    }

    return { composer, updateOutline };
}
