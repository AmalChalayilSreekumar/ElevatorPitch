import * as THREE from 'three';

// Barrel tip in gun space; -Z is forward.
export const MUZZLE = new THREE.Vector3(0, 0.025, -0.38);

const body = new THREE.MeshLambertMaterial({ color: 0x2b2d42 });
const trim = new THREE.MeshLambertMaterial({ color: 0xff6b2c });
const metal = new THREE.MeshLambertMaterial({ color: 0x8d99ae });

// [material, size, position] in gun space.
const PARTS = [
  [body, [0.07, 0.09, 0.3], [0, 0, -0.04]],
  [metal, [0.035, 0.035, 0.2], [0, 0.025, -0.28]],
  [body, [0.055, 0.14, 0.07], [0, -0.1, 0.06]],
  [trim, [0.072, 0.02, 0.24], [0, 0.035, -0.04]],
  [metal, [0.015, 0.03, 0.03], [0, 0.06, -0.16]],
];

const geometries = PARTS.map(([, size]) => new THREE.BoxGeometry(...size));

export function createGun() {
  const gun = new THREE.Group();
  PARTS.forEach(([material, , position], i) => {
    const mesh = new THREE.Mesh(geometries[i], material);
    mesh.position.set(...position);
    gun.add(mesh);
  });
  return gun;
}

function flashTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 250, 220, 1)');
  gradient.addColorStop(0.35, 'rgba(255, 170, 60, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 120, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export function createMuzzleFlash() {
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: flashTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  flash.scale.setScalar(0.18);
  flash.position.copy(MUZZLE);
  flash.visible = false;
  return flash;
}
