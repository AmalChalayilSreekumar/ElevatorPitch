import * as THREE from 'three';

const TEXT_HEIGHT = 128;
const BEZEL = 0.92;

// Overlays an upright LED screen on the face of `mesh` (a unit cube) that points toward worldFacing.
export function createFloorDisplay(mesh, worldFacing) {
  const canvas = document.createElement('canvas');
  canvas.height = TEXT_HEIGHT;
  canvas.width = Math.round(TEXT_HEIGHT * (mesh.scale.x / mesh.scale.y));
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * BEZEL, 2 * BEZEL),
    new THREE.MeshBasicMaterial({ map: texture })
  );

  mesh.updateWorldMatrix(true, false);
  const worldQuaternion = mesh.getWorldQuaternion(new THREE.Quaternion());
  const localFacing = worldFacing.clone().applyQuaternion(worldQuaternion.invert());
  screen.position.z = Math.sign(localFacing.z) * 1.02;
  mesh.add(screen);

  const worldPosition = screen.getWorldPosition(new THREE.Vector3());
  screen.lookAt(worldPosition.add(worldFacing));

  return function show(text) {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffb000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${TEXT_HEIGHT * 0.55}px ui-monospace, monospace`;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width * 0.9);
    texture.needsUpdate = true;
  };
}
