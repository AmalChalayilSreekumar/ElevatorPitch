import * as THREE from 'three';

export const RIDER_EYE = new THREE.Vector3(0, 1.2, 0.15);

export function createCart() {
  const cart = new THREE.Group();
  cart.name = 'coasterCart';
  cart.userData.interactive = true;

  const body = new THREE.MeshLambertMaterial({ color: 0xf4a259 });
  const trim = new THREE.MeshLambertMaterial({ color: 0x1d3557 });

  // [material, size, position] in cart space; -Z is forward.
  const parts = [
    [trim, [1.0, 0.15, 1.4], [0, 0.05, 0]],
    [body, [1.1, 0.45, 1.8], [0, 0.35, 0]],
    [body, [1.1, 0.35, 0.3], [0, 0.75, -0.75]],
    [trim, [1.0, 0.7, 0.12], [0, 0.9, 0.6]],
    [trim, [0.9, 0.05, 0.05], [0, 0.72, -0.3]],
  ];

  for (const [material, size, position] of parts) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    cart.add(mesh);
  }

  return cart;
}
