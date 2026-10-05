import * as THREE from 'three';
import { RANGE } from './range.js';
import { canvasTexture, drawContained } from '../../utils/canvas.js';

// Paper sheets hung in a row above the counter: the stack boards either side of the "click the gun" sign.
const SHEET_WIDTH = 1.25;
const SHEET_HEIGHT = 1.6;
const SHEET_SPACING = 2.6;
// Sheet centre; the bottom edge (2.35m) stays above every sight line from the counter to the targets.
const SHEET_Y = 3.15;
const SHEET_Z = RANGE.counterZ - 0.45;
const ROLL_RADIUS = 0.035;

const PX_PER_METRE = 800;
const W = SHEET_WIDTH * PX_PER_METRE;
const H = SHEET_HEIGHT * PX_PER_METRE;
const MARGIN = 60;
const WAVE = 14;

const PAPER = '#f4efe6';
const INK = '#1c1c1c';
const ACCENT = '#ff6b2c';

const sheetGeometry = new THREE.PlaneGeometry(SHEET_WIDTH, SHEET_HEIGHT);
const rollGeometry = new THREE.CylinderGeometry(ROLL_RADIUS, ROLL_RADIUS, SHEET_WIDTH + 0.06, 12).rotateZ(Math.PI / 2);
const wireLength = RANGE.height - (SHEET_Y + SHEET_HEIGHT / 2);
const wireGeometry = new THREE.CylinderGeometry(0.006, 0.006, wireLength, 6);
const rollMaterial = new THREE.MeshLambertMaterial({ color: 0xefe6d2 });
const wireMaterial = new THREE.MeshLambertMaterial({ color: 0x9aa0a6 });

const noRaycast = () => {};

// Paper with a shaded band under the top roll and a slightly wavy bottom edge; outside the paper stays transparent.
function drawPaper(ctx) {
  ctx.clearRect(0, 0, W, H);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, H - WAVE * 2);
  const waves = 4;
  for (let i = 1; i <= waves; i++) {
    const x = W - (W / waves) * i;
    ctx.quadraticCurveTo(x + W / waves / 2, H - WAVE * (i % 2 ? 0 : 4), x, H - WAVE * 2);
  }
  ctx.closePath();
  ctx.fillStyle = PAPER;
  ctx.fill();

  const shadow = ctx.createLinearGradient(0, 0, 0, 70);
  shadow.addColorStop(0, 'rgba(90, 70, 40, 0.35)');
  shadow.addColorStop(1, 'rgba(90, 70, 40, 0)');
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, W, 70);
}

function drawTile(ctx, logo, name, x, y, size) {
  if (logo) return drawContained(ctx, logo, x, y, size);
  ctx.fillStyle = '#e2d9c6';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#7a6a53';
  ctx.font = `bold ${Math.round(size * 0.5)}px system-ui, sans-serif`;
  ctx.fillText(name.charAt(0).toUpperCase(), x + size / 2, y + size / 2);
}

// Title over a two-column grid of logos with names underneath; a lone last item is centred.
function boardTexture(title, entries) {
  const logos = new Map();

  const draw = (ctx) => {
    drawPaper(ctx);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = INK;
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.fillText(title.toUpperCase(), W / 2, 150, W - MARGIN * 2);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(W * 0.2, 205, W * 0.6, 8);

    const top = 250;
    const columnWidth = (W - MARGIN * 2) / 2;
    const rows = Math.ceil(entries.length / 2);
    const cell = Math.min((H - WAVE * 4 - 40 - top) / Math.max(rows, 1), columnWidth);
    const icon = Math.max(40, Math.min(columnWidth * 0.6, cell - 80));

    entries.forEach((entry, i) => {
      const row = Math.floor(i / 2);
      const alone = i === entries.length - 1 && i % 2 === 0;
      const centerX = alone ? W / 2 : MARGIN + columnWidth * (i % 2) + columnWidth / 2;
      const y = top + row * cell + (cell - icon - 60) / 2;
      drawTile(ctx, logos.get(entry), entry.name, centerX - icon / 2, y, icon);
      ctx.fillStyle = INK;
      ctx.font = '40px system-ui, sans-serif';
      ctx.fillText(entry.name, centerX, y + icon + 36, columnWidth - 20);
    });
  };

  const texture = canvasTexture(W, H, draw);
  for (const entry of entries) {
    if (!entry.image) continue;
    const logo = new Image();
    logo.onload = () => {
      logos.set(entry, logo);
      draw(texture.image.getContext('2d'));
      texture.needsUpdate = true;
    };
    logo.src = entry.image;
  }
  return texture;
}

function signTexture() {
  return canvasTexture(W, H, (ctx) => {
    drawPaper(ctx);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ACCENT;
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.fillText('STACK RANGE', W / 2, 140);
    ctx.fillStyle = INK;
    ctx.font = 'bold 150px system-ui, sans-serif';
    ['CLICK', 'GUN', 'TO', 'PLAY'].forEach((word, i) => ctx.fillText(word, W / 2, 330 + i * 160, W - MARGIN * 2));
    ctx.fillStyle = ACCENT;
    ctx.font = '120px system-ui, sans-serif';
    ctx.fillText('▼', W / 2, 1040);
  });
}

function createSheet(texture) {
  const sheet = new THREE.Group();
  const paper = new THREE.Mesh(sheetGeometry, new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5 }));

  const roll = new THREE.Mesh(rollGeometry, rollMaterial);
  roll.position.set(0, SHEET_HEIGHT / 2, 0.02);
  sheet.add(paper, roll);

  for (const x of [-SHEET_WIDTH / 2 + 0.1, SHEET_WIDTH / 2 - 0.1]) {
    const wire = new THREE.Mesh(wireGeometry, wireMaterial);
    wire.position.set(x, SHEET_HEIGHT / 2 + wireLength / 2, 0.02);
    sheet.add(wire);
  }
  return sheet;
}

function groupByBoard(stack, stackBoards) {
  const boards = new Map(stackBoards.map((title) => [title, []]));
  for (const entry of stack) {
    const entries = boards.get(entry.board);
    if (entries) entries.push(entry);
    else console.warn(`Stack entry "${entry.name}" has board "${entry.board}", which isn't in stackBoards.`);
  }
  return boards;
}

export function createStackBoards(stack, stackBoards) {
  const boards = [...groupByBoard(stack, stackBoards)].map(([title, entries]) => boardTexture(title, entries));
  const half = Math.ceil(boards.length / 2);
  const textures = [...boards.slice(0, half), signTexture(), ...boards.slice(half)];

  const row = new THREE.Group();
  textures.forEach((texture, i) => {
    const sheet = createSheet(texture);
    sheet.position.set((i - (textures.length - 1) / 2) * SHEET_SPACING, SHEET_Y, SHEET_Z);
    row.add(sheet);
  });
  row.traverse((child) => { child.raycast = noRaycast; });
  return row;
}
