import * as THREE from 'three';
import { createDoorwayWall } from '../doorwayWall.js';
import { ELEVATOR_FRONT } from '../../objects/elevator/Elevator.js';
import { canvasTexture } from '../../utils/canvas.js';

// The front wall sits flush with the elevator; the counter splits the shooter booth from the range.
export const RANGE = {
  minX: -7,
  maxX: 7,
  frontZ: ELEVATOR_FRONT.z,
  backZ: -15,
  height: 4.5,
  counterZ: -4.5,
  counterHeight: 1.1,
};

const COUNTER_DEPTH = 0.6;
const BAFFLE_SPACING = 3;
const DISTANCE_LINES = [-7, -10, -13];

const noRaycast = () => {};

function hazardTexture(repeat) {
  const texture = canvasTexture(64, 64, (ctx) => {
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#1c1c1c';
    for (const offset of [-64, 0, 64]) {
      ctx.beginPath();
      ctx.moveTo(offset, 64);
      ctx.lineTo(offset + 32, 0);
      ctx.lineTo(offset + 64, 0);
      ctx.lineTo(offset + 32, 64);
      ctx.fill();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(repeat, 1);
  return texture;
}

function createShell() {
  const { minX, maxX, frontZ, backZ, height } = RANGE;
  const width = maxX - minX;
  const depth = frontZ - backZ;
  const centerZ = (frontZ + backZ) / 2;
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x3d4047 });

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshLambertMaterial({ color: 0x55585e })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.02, centerZ);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshLambertMaterial({ color: 0x1f2125 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, height, centerZ);

  const sideGeometry = new THREE.PlaneGeometry(depth, height);
  const leftWall = new THREE.Mesh(sideGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(minX, height / 2, centerZ);

  const rightWall = new THREE.Mesh(sideGeometry, wallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(maxX, height / 2, centerZ);

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshLambertMaterial({ color: 0x4a3626 })
  );
  backWall.position.set(0, height / 2, backZ);

  // Sloped sand berm catching shots at the foot of the back wall.
  const berm = new THREE.Mesh(
    new THREE.PlaneGeometry(width, 2.4),
    new THREE.MeshLambertMaterial({ color: 0x8a6a45 })
  );
  berm.rotation.x = -Math.PI / 4;
  berm.position.set(0, 0.85, backZ + 0.85);

  const frontWall = createDoorwayWall({ minX, maxX, height, z: frontZ }, wallMaterial);

  return [floor, ceiling, leftWall, rightWall, backWall, berm, frontWall];
}

function createBooth() {
  const { minX, maxX, counterZ, counterHeight, height } = RANGE;
  const width = maxX - minX;
  const frontFaceZ = counterZ + COUNTER_DEPTH / 2;

  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(width, counterHeight, COUNTER_DEPTH),
    new THREE.MeshLambertMaterial({ color: 0x6b4f3a })
  );
  counter.position.set(0, counterHeight / 2, counterZ);

  const hazard = new THREE.Mesh(
    new THREE.PlaneGeometry(width, 0.12),
    new THREE.MeshBasicMaterial({ map: hazardTexture(width * 4) })
  );
  hazard.position.set(0, counterHeight - 0.08, frontFaceZ + 0.005);

  // Invisible pane above the counter so the player can't walk downrange; shots ignore it.
  const barrier = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height - counterHeight),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  barrier.position.set(0, counterHeight + (height - counterHeight) / 2, frontFaceZ);

  return [counter, hazard, barrier];
}

function createDistanceLines() {
  const { minX, maxX } = RANGE;
  const lines = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(maxX - minX, 0.08).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffd166 }),
    DISTANCE_LINES.length
  );

  const matrix = new THREE.Matrix4();
  DISTANCE_LINES.forEach((z, i) => lines.setMatrixAt(i, matrix.makeTranslation(0, 0.03, z)));
  lines.raycast = noRaycast;
  return lines;
}

function createCeilingFixtures() {
  const { minX, maxX, frontZ, backZ, height } = RANGE;
  const placements = [];
  for (let z = frontZ - BAFFLE_SPACING; z > backZ; z -= BAFFLE_SPACING) placements.push(z);

  const baffles = new THREE.InstancedMesh(
    new THREE.BoxGeometry(maxX - minX, 0.5, 0.08),
    new THREE.MeshLambertMaterial({ color: 0x15161a }),
    placements.length
  );
  const lights = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(maxX - minX - 1, 0.25).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xfff4e0 }),
    placements.length
  );

  const matrix = new THREE.Matrix4();
  placements.forEach((z, i) => {
    baffles.setMatrixAt(i, matrix.makeTranslation(0, height - 0.25, z));
    lights.setMatrixAt(i, matrix.makeTranslation(0, height - 0.01, z + BAFFLE_SPACING / 2));
  });
  baffles.raycast = lights.raycast = noRaycast;
  return [baffles, lights];
}

export function createRange() {
  const range = new THREE.Group();
  range.add(
    ...createShell(),
    ...createBooth(),
    createDistanceLines(),
    ...createCeilingFixtures(),
    new THREE.HemisphereLight(0xfff4e0, 0x202024, 1.2)
  );
  return range;
}
