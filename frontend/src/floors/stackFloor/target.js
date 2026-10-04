import * as THREE from 'three';
import { canvasTexture, drawContained } from '../../utils/canvas.js';

const TARGET_RADIUS = 0.8;

const POP_IN_TIME = 0.35;
const POP_OUT_TIME = 0.25;
const POP_OUT_SPIN = 14;
const BOB_HEIGHT = 0.08;
const BOB_SPEED = 2;

const SIZE = 512;
const CENTER = SIZE / 2;
const RINGS = ['#f4efe6', '#1c1c1c', '#f4efe6', '#ff6b2c'];
const BULLSEYE_RADIUS = 120;
const LOGO_BOX = 160;

const faceGeometry = new THREE.CircleGeometry(TARGET_RADIUS, 48);
const backingGeometry = new THREE.CylinderGeometry(TARGET_RADIUS + 0.04, TARGET_RADIUS + 0.04, 0.03, 48)
  .rotateX(Math.PI / 2);
const backingMaterial = new THREE.MeshLambertMaterial({ color: 0x3b2a1a });

// Overshoots slightly past full size before settling, for the pop.
function easeOutBack(t) {
  const c = 1.70158;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

function drawFace(ctx, name, logo) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  RINGS.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, CENTER - i * 30, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, BULLSEYE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (logo) {
    drawContained(ctx, logo, CENTER - LOGO_BOX / 2, CENTER - LOGO_BOX / 2, LOGO_BOX);
  } else {
    ctx.fillStyle = '#1c1c1c';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillText(name, CENTER, CENTER, BULLSEYE_RADIUS * 1.8);
  }

  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(116, 398, SIZE - 232, 52);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(name.toUpperCase(), CENTER, 425, SIZE - 260);
}

function faceTexture({ name, image }) {
  const texture = canvasTexture(SIZE, SIZE, (ctx) => drawFace(ctx, name, null));

  if (image) {
    const logo = new Image();
    logo.onload = () => {
      drawFace(texture.image.getContext('2d'), name, logo);
      texture.needsUpdate = true;
    };
    logo.onerror = () => console.error(`Stack logo failed to load: ${image}`);
    logo.src = image;
  }
  return texture;
}

// A floating round target: pops up at a spot, bobs there until hit, then spins away.
export function createTarget(entry) {
  const group = new THREE.Group();
  group.visible = false;

  const face = new THREE.Mesh(faceGeometry, new THREE.MeshBasicMaterial({ map: faceTexture(entry) }));
  face.position.z = 0.02;
  group.add(new THREE.Mesh(backingGeometry, backingMaterial), face);

  const home = new THREE.Vector3();
  let state = 'hidden';
  let age = 0;
  let poppedAt = 0;

  return {
    group,
    face,
    hidden: () => state === 'hidden',
    hittable: () => state === 'popIn' || state === 'up',
    popUp(position, facing) {
      home.copy(position);
      group.position.copy(position);
      group.lookAt(facing);
      group.scale.setScalar(0.001);
      group.visible = true;
      state = 'popIn';
      age = 0;
    },
    hit() {
      state = 'popOut';
      poppedAt = age;
    },
    update(dt) {
      if (state === 'hidden') return;
      age += dt;
      group.position.y = home.y + Math.sin(age * BOB_SPEED) * BOB_HEIGHT;

      if (state === 'popIn') {
        const t = Math.min(1, age / POP_IN_TIME);
        group.scale.setScalar(Math.max(0.001, easeOutBack(t)));
        if (t === 1) state = 'up';
      } else if (state === 'popOut') {
        const t = Math.min(1, (age - poppedAt) / POP_OUT_TIME);
        group.scale.setScalar(Math.max(0.001, 1 - t));
        group.rotateZ(POP_OUT_SPIN * dt);
        if (t === 1) {
          state = 'hidden';
          group.visible = false;
        }
      }
    },
  };
}
