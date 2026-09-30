import * as THREE from 'three';

const postGeometry = new THREE.BoxGeometry(0.15, 1, 0.15);
const postMaterial = new THREE.MeshLambertMaterial({ color: 0x2b2d42 });

function signTexture(title, subtitle, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 96px system-ui, sans-serif';
  ctx.fillText(title, 512, 120, 960);
  ctx.font = '56px system-ui, sans-serif';
  ctx.fillText(subtitle, 512, 205, 960);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
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

  const width = span + 0.4;
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width / 4),
    new THREE.MeshBasicMaterial({ map: signTexture(title, subtitle, color), side: THREE.DoubleSide })
  );
  board.position.set(0, height, 0.1);
  sign.add(board);

  return sign;
}
