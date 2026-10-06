import * as THREE from 'three';

const postGeometry = new THREE.BoxGeometry(0.15, 1, 0.15);
const postMaterial = new THREE.MeshLambertMaterial({ color: 0x2b2d42 });

// The intro screen's pixel font (loaded in index.html).
const FONT = '"Press Start 2P", monospace';
const TEXT_WIDTH = 960;

// Pixel fonts stay crisp at multiples of 8px, so shrink in those steps until the text fits rather than squashing it.
function fitFont(ctx, text, start, min) {
  let size = start;
  ctx.font = `${size}px ${FONT}`;
  while (size > min && ctx.measureText(text).width > TEXT_WIDTH) {
    size -= 8;
    ctx.font = `${size}px ${FONT}`;
  }
}

function drawSign(ctx, title, subtitle, color) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fitFont(ctx, title, 72, 32);
  ctx.fillText(title, width / 2, 100, TEXT_WIDTH);
  fitFont(ctx, subtitle, 40, 24);
  ctx.fillText(subtitle, width / 2, 190, TEXT_WIDTH);
}

function signTexture(title, subtitle, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  drawSign(ctx, title, subtitle, color);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  // A canvas quietly falls back to another font if the web font isn't ready yet; redraw once it is.
  if (!document.fonts.check(`40px ${FONT}`)) {
    document.fonts.load(`40px ${FONT}`).then(() => {
      drawSign(ctx, title, subtitle, color);
      texture.needsUpdate = true;
    });
  }
  return texture;
}

// Two posts and a 4:1 board facing local +Z.
export function createSign({ title, subtitle, color }, { span = 2.8, height = 3.4 } = {}) {
  const sign = new THREE.Group();
  const postHeight = height + 0.4;

  for (const x of [-span / 2, span / 2]) {
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.scale.y = postHeight;
    post.position.set(x, postHeight / 2, 0);
    sign.add(post);
  }

  // Two single-sided faces so the text reads correctly from both sides.
  const width = span + 0.4;
  const boardGeometry = new THREE.PlaneGeometry(width, width / 4);
  const boardMaterial = new THREE.MeshBasicMaterial({ map: signTexture(title, subtitle, color) });
  for (const facing of [1, -1]) {
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.set(0, height, 0.1 * facing);
    if (facing < 0) board.rotation.y = Math.PI;
    sign.add(board);
  }

  return sign;
}
