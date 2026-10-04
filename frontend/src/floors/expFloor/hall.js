import * as THREE from 'three';
import { createDoorwayWall } from '../doorwayWall.js';
import { ELEVATOR_FRONT } from '../../objects/elevator/Elevator.js';

// Encloses every point of track.js CONTROL_POINTS with clearance; the front wall sits flush with the elevator.
const MIN_X = -27;
const MAX_X = 33;
const FRONT_Z = ELEVATOR_FRONT.z;
const BACK_Z = -42.5;
const HEIGHT = 17;

const STAR_COUNT = 700;
const STRIP_SPACING = 8;

const noRaycast = () => {};

function gridTexture(repeatX, repeatY) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0d0f1c';
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = '#3b2f7a';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

// Scattered over the ceiling and the upper half of the side and back walls.
function createStars(width, depth) {
  const positions = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    let x = MIN_X + Math.random() * width;
    let y = HEIGHT * (0.55 + Math.random() * 0.44);
    let z = BACK_Z + Math.random() * depth;
    const surface = Math.floor(Math.random() * 4);
    if (surface === 0) y = HEIGHT - 0.05;
    else if (surface === 1) x = MIN_X + 0.05;
    else if (surface === 2) x = MAX_X - 0.05;
    else z = BACK_Z + 0.05;
    positions.set([x, y, z], i * 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 }));
  stars.raycast = noRaycast;
  return stars;
}

function createLightStrips() {
  const stripHeight = HEIGHT - 3;
  const placements = [];
  for (let z = FRONT_Z - STRIP_SPACING; z > BACK_Z; z -= STRIP_SPACING) {
    placements.push([MIN_X + 0.05, z, Math.PI / 2], [MAX_X - 0.05, z, -Math.PI / 2]);
  }
  for (let x = MIN_X + STRIP_SPACING; x < MAX_X; x += STRIP_SPACING) {
    placements.push([x, BACK_Z + 0.05, 0]);
  }

  const strips = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.2, stripHeight),
    new THREE.MeshBasicMaterial({ color: 0x2de2e6 }),
    placements.length
  );
  const dummy = new THREE.Object3D();
  placements.forEach(([x, z, rotation], i) => {
    dummy.position.set(x, 1 + stripHeight / 2, z);
    dummy.rotation.y = rotation;
    dummy.updateMatrix();
    strips.setMatrixAt(i, dummy.matrix);
  });
  strips.raycast = noRaycast;
  return strips;
}

export function createHall() {
  const width = MAX_X - MIN_X;
  const depth = FRONT_Z - BACK_Z;
  const centerX = (MIN_X + MAX_X) / 2;
  const centerZ = (FRONT_Z + BACK_Z) / 2;
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x0b0d1a });

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshLambertMaterial({ map: gridTexture(width / 2, depth / 2) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(centerX, 0.02, centerZ);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), wallMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(centerX, HEIGHT, centerZ);

  const sideGeometry = new THREE.PlaneGeometry(depth, HEIGHT);
  const leftWall = new THREE.Mesh(sideGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(MIN_X, HEIGHT / 2, centerZ);

  const rightWall = new THREE.Mesh(sideGeometry, wallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(MAX_X, HEIGHT / 2, centerZ);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(width, HEIGHT), wallMaterial);
  backWall.position.set(centerX, HEIGHT / 2, BACK_Z);

  const frontWall = createDoorwayWall({ minX: MIN_X, maxX: MAX_X, height: HEIGHT, z: FRONT_Z }, wallMaterial);

  const hall = new THREE.Group();
  hall.add(
    floor, ceiling, leftWall, rightWall, backWall, frontWall,
    createStars(width, depth), createLightStrips()
  );
  return hall;
}
