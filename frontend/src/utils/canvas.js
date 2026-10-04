import * as THREE from 'three';

// A texture drawn once from a 2D canvas; the canvas stays reachable as texture.image for redraws.
export function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Fits an image inside the size x size square at (x, y), like CSS object-fit: contain.
export function drawContained(ctx, image, x, y, size) {
  const width = image.naturalWidth || size;
  const height = image.naturalHeight || size;
  const fit = Math.min(size / width, size / height);
  ctx.drawImage(image, x + (size - width * fit) / 2, y + (size - height * fit) / 2, width * fit, height * fit);
}
