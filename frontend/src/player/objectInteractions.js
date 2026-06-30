import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


export function objectInteraction(scene, camera, renderer) {
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const outlinePass = new OutlinePass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        scene,
        camera
    );

    outlinePass.edgeStrength = 6;
    outlinePass.edgeGlow = 0.4;
    outlinePass.edgeThickness = 1;
    outlinePass.visibleEdgeColor.set('#ffffff');
    outlinePass.hiddenEdgeColor.set('#000000');
    composer.addPass(outlinePass);
    composer.addPass(new OutputPass());

    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    let currentSelected = null;

    window.addEventListener('resize', () => {
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    function updateOutline() {
        raycaster.setFromCamera(center, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        const newSelected = intersects.length > 0 ? intersects[0].object : null;
        if (newSelected !== currentSelected) {
            currentSelected = newSelected;
            outlinePass.selectedObjects = newSelected ? [newSelected] : [];
        }
    }

    return { composer, updateOutline };
}
