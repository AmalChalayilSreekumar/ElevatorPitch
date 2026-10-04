import * as THREE from 'three';
import { ELEVATOR_FRONT } from '../objects/elevator/Elevator.js';

// The wall overlaps the elevator face by this much on each edge so no seam shows around the car.
const OVERLAP = 0.02;

// The wall a floor's elevator opens through, facing -Z into the floor, with a hole that frames the car's front face.
export function createDoorwayWall({ minX, maxX, height, z }, material) {
  const halfWidth = ELEVATOR_FRONT.halfWidth - OVERLAP;
  const bottom = ELEVATOR_FRONT.bottom + OVERLAP;
  const top = ELEVATOR_FRONT.top - OVERLAP;

  // Faces -Z after the half turn, so shape x is mirrored world x.
  const shape = new THREE.Shape()
    .moveTo(-maxX, 0).lineTo(-minX, 0).lineTo(-minX, height).lineTo(-maxX, height).closePath();
  shape.holes.push(new THREE.Path()
    .moveTo(-halfWidth, bottom).lineTo(-halfWidth, top)
    .lineTo(halfWidth, top).lineTo(halfWidth, bottom).closePath());

  // Shape UVs come out in metres; normalise so a texture spans the whole wall like it would on a plane.
  const geometry = new THREE.ShapeGeometry(shape);
  const uv = geometry.attributes.uv;
  const width = maxX - minX;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (uv.getX(i) + maxX) / width, uv.getY(i) / height);
  }

  const wall = new THREE.Mesh(geometry, material);
  wall.rotation.y = Math.PI;
  wall.position.z = z;
  return wall;
}
