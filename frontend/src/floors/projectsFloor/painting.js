import * as THREE from 'three';

// Inner canvas of the Blender frame, in metres.
const CANVAS_WIDTH = 0.93;
const CANVAS_HEIGHT = 0.66;
const CANVAS_ASPECT = CANVAS_WIDTH / CANVAS_HEIGHT;

// The Blender frame faces +Y with its long side on Z; this turns it to face +Z with the long side on X.
const FRAME_ROTATION = new THREE.Quaternion().setFromRotationMatrix(
  new THREE.Matrix4().makeBasis(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 0, 0)
  )
);

const canvasGeometry = new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT);
const plaqueGeometry = new THREE.PlaneGeometry(0.52, 0.39);
const textureLoader = new THREE.TextureLoader();

// Crops the texture like CSS object-fit: cover.
function cover(texture, aspect) {
  if (aspect > CANVAS_ASPECT) {
    texture.repeat.set(CANVAS_ASPECT / aspect, 1);
  } else {
    texture.repeat.set(1, aspect / CANVAS_ASPECT);
  }
  texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = next;
    }
  }
  ctx.fillText(line, x, y);
}

function placeholderTexture(title) {
  return canvasTexture(930, 660, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 930, 660);
    gradient.addColorStop(0, '#1d3557');
    gradient.addColorStop(1, '#457b9d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 930, 660);
    ctx.fillStyle = '#f1faee';
    ctx.textAlign = 'center';
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.fillText(title, 465, 330, 860);
    ctx.font = '36px system-ui, sans-serif';
    ctx.fillText('Media coming soon', 465, 400);
  });
}

function mediaTexture({ image, video, title }) {
  if (video) {
    const el = document.createElement('video');
    Object.assign(el, { src: video, muted: true, loop: true, playsInline: true, crossOrigin: 'anonymous' });
    el.addEventListener('loadedmetadata', () => cover(texture, el.videoWidth / el.videoHeight), { once: true });
    el.play().catch(() => {});
    const texture = new THREE.VideoTexture(el);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  if (image) {
    const texture = textureLoader.load(image, () => cover(texture, texture.image.width / texture.image.height));
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  return placeholderTexture(title);
}

function plaqueTexture({ title, tech, description, link }) {
  return canvasTexture(512, 384, (ctx) => {
    ctx.fillStyle = '#fbf8f1';
    ctx.fillRect(0, 0, 512, 384);
    ctx.fillStyle = '#1b1b1b';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText(title, 28, 64, 456);
    ctx.fillStyle = '#7a6a53';
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText(tech.join(' · '), 28, 104, 456);
    ctx.fillStyle = '#333333';
    ctx.font = '24px Georgia, serif';
    wrapText(ctx, description, 28, 150, 456, 32);
    if (link) {
      ctx.fillStyle = '#7a6a53';
      ctx.font = 'italic 20px Georgia, serif';
      ctx.fillText('Click the painting to open', 28, 356);
    }
  });
}

// Prepares the loaded Blender frame to be cloned per project.
// Position only aligns the model with its canvas; hallway placement lives in GALLERY in projectFloor.js.
export function prepareFrameTemplate(frame) {
  frame.position.set(0, 0, 0);
  frame.quaternion.copy(FRAME_ROTATION);
  frame.traverse((child) => {
    if (!child.isMesh) return;
    if (child.material.map) child.visible = false; // placeholder canvas, replaced by project media
    else child.material.metalness = 0;
  });
  return frame;
}

// A framed project with its wall label, facing local +Z. labelSide: 1 puts the label on the local +X side, -1 on -X.
export function createPainting(project, frameTemplate, { labelSide = 1 } = {}) {
  const painting = new THREE.Group();

  const canvas = new THREE.Mesh(canvasGeometry, new THREE.MeshBasicMaterial({ map: mediaTexture(project) }));
  canvas.position.z = 0.008;

  const plaque = new THREE.Mesh(plaqueGeometry, new THREE.MeshBasicMaterial({ map: plaqueTexture(project) }));
  plaque.position.set(labelSide * 0.94, -0.12, 0.005);

  painting.add(frameTemplate.clone(), canvas, plaque);
  return painting;
}
