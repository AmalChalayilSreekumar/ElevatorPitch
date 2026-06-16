import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


export function objectInteraction(scene, camera, renderer){
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
    const screenCenter = new THREE.Vector2(0, 0);

    function updateOutline() {
    raycaster.setFromCamera(screenCenter, camera);
    const intersects = raycaster.intersectObjects(glowableRoots, true);

    if (intersects.length > 0) {
        outlinePass.selectedObjects = [intersects[0].object];
    } else {
        outlinePass.selectedObjects = [];
    }
    }
}