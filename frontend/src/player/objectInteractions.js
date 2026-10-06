import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


const interactionalObjects = ["buttonInner","buttonInner1","buttonInner2","buttonInner3"]

function findInteractive(object) {
    for (let o = object; o; o = o.parent) {
        if (interactionalObjects.includes(o.name) || o.userData.interactive) return o;
    }
    return null;
}

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

        let newSelected = null;
        for (let i = 0; i < intersects.length && !newSelected; i++) {
            newSelected = findInteractive(intersects[i].object);
        }

        // A stand-in (e.g. a button's label plate) outlines itself and its target, and reports the target's name.
        const target = newSelected?.userData.pressTarget ?? newSelected;
        if (newSelected !== currentSelected) {
            currentSelected = newSelected;
            outlinePass.selectedObjects = !newSelected ? [] : target === newSelected ? [newSelected] : [newSelected, target];
        }
        return target?.name ?? null;
    }

    return { composer, updateOutline };
}
