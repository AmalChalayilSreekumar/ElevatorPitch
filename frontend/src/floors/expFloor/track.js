import * as THREE from 'three';

// Rail-centre path. First point is the station; the highest point ends the chain lift.
const CONTROL_POINTS = [
  [0, 0.2, -5], [5, 0.2, -5], [10, 0.6, -5], [16, 3.5, -5.5], [21, 8, -7], [25, 12, -10],
  [27, 12.5, -13], [28, 6, -18], [26, 1.2, -25], [20, 1.5, -31], [12, 5, -35],
  [4, 8, -37], [-4, 5, -38], [-12, 1.5, -36], [-19, 3, -30], [-23, 7, -23],
  [-22, 5, -15], [-17, 1.5, -9], [-6, 0.2, -5],
];

const GAUGE = 0.45;
const SEGMENTS = 600;
const TIE_SPACING = 0.8;
const SUPPORT_SPACING = 4;
const SPINE_DROP = 0.25;
const UP = new THREE.Vector3(0, 1, 0);

// The track is far from walkable space; skipping it keeps per-frame raycasts cheap.
const noRaycast = () => {};

export function createTrack() {
  const curve = new THREE.CatmullRomCurve3(
    CONTROL_POINTS.map((p) => new THREE.Vector3(...p)),
    true,
    'centripetal'
  );
  curve.arcLengthDivisions = 2000;
  const length = curve.getLength();

  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const back = new THREE.Vector3();
  const basis = new THREE.Matrix4();

  function frameAt(distance) {
    const u = THREE.MathUtils.euclideanModulo(distance / length, 1);
    curve.getPointAt(u, point);
    curve.getTangentAt(u, tangent);
    right.crossVectors(tangent, UP).normalize();
    up.crossVectors(right, tangent);
  }

  // Orients an object so its -Z faces along the track and +Y is track-up.
  function placeAt(distance, object) {
    frameAt(distance);
    object.position.copy(point);
    back.copy(tangent).negate();
    object.quaternion.setFromRotationMatrix(basis.makeBasis(right, up, back));
  }

  const group = new THREE.Group();
  const rails = [[], [], []];
  let peakDistance = 0;
  let peakHeight = -Infinity;

  for (let i = 0; i < SEGMENTS; i++) {
    const distance = (i / SEGMENTS) * length;
    frameAt(distance);
    rails[0].push(point.clone().addScaledVector(right, -GAUGE));
    rails[1].push(point.clone().addScaledVector(right, GAUGE));
    rails[2].push(point.clone().addScaledVector(up, -SPINE_DROP));
    if (point.y > peakHeight) {
      peakHeight = point.y;
      peakDistance = distance;
    }
  }

  const railMaterial = new THREE.MeshBasicMaterial({ color: 0xff2e88 });
  const steelMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5064 });
  const tube = (points, radius, material) =>
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), SEGMENTS, radius, 6, true),
      material
    );

  group.add(
    tube(rails[0], 0.05, railMaterial),
    tube(rails[1], 0.05, railMaterial),
    tube(rails[2], 0.12, steelMaterial)
  );

  const dummy = new THREE.Object3D();
  const tieCount = Math.floor(length / TIE_SPACING);
  const ties = new THREE.InstancedMesh(
    new THREE.BoxGeometry(GAUGE * 2 + 0.15, 0.08, 0.14),
    steelMaterial,
    tieCount
  );
  for (let i = 0; i < tieCount; i++) {
    placeAt(i * TIE_SPACING, dummy);
    dummy.translateY(-0.08);
    dummy.updateMatrix();
    ties.setMatrixAt(i, dummy.matrix);
  }

  const supportMatrices = [];
  dummy.quaternion.identity();
  for (let d = 0; d < length; d += SUPPORT_SPACING) {
    frameAt(d);
    const height = point.y - SPINE_DROP;
    if (height < 0.8) continue;
    dummy.position.set(point.x, height / 2, point.z);
    dummy.scale.set(1, height, 1);
    dummy.updateMatrix();
    supportMatrices.push(dummy.matrix.clone());
  }
  const supports = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.08, 0.12, 1, 6),
    steelMaterial,
    supportMatrices.length
  );
  supportMatrices.forEach((m, i) => supports.setMatrixAt(i, m));

  group.add(ties, supports);
  group.traverse((child) => {
    if (child.isMesh) child.raycast = noRaycast;
  });

  return { group, length, peakDistance, peakHeight, placeAt };
}
