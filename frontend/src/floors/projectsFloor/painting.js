import * as THREE from 'three';
import { canvasTexture, drawContained } from '../../utils/canvas.js';

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

// Panel sizes in metres at scale 1; the whole painting is scaled together.
const PANEL_GAP = 0.06;
const TITLE_HEIGHT = 0.12;
const STACK_WIDTH = 0.24;
const DESCRIPTION_SIZE = [0.5, 0.42];
const PX_PER_METRE = 1000;

const PAPER = '#fbf8f1';
const INK = '#1b1b1b';
const MUTED = '#7a6a53';

const canvasGeometry = new THREE.PlaneGeometry(CANVAS_WIDTH, CANVAS_HEIGHT);
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

// Returns the baseline of the last line drawn.
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
  return y;
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

function paper(ctx) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function titleTexture(title, width, height) {
  return canvasTexture(width, height, (ctx) => {
    paper(ctx);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(height * 0.55)}px Georgia, serif`;
    ctx.fillText(title, width / 2, height / 2, width - 40);
  });
}

// "STACK" header over one cell per tech entry: logo from public/stack/<name>.png with the name underneath.
// Missing logos show the name's initial on a tile.
function stackTexture(tech, width, height) {
  const HEADER = 70;
  const LABEL = 32;
  const logos = new Map();

  const draw = (ctx) => {
    paper(ctx);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = INK;
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText('STACK', width / 2, 38);
    ctx.fillStyle = MUTED;
    ctx.fillRect(24, HEADER - 10, width - 48, 2);

    const cell = Math.min((height - HEADER - 12) / Math.max(tech.length, 1), width);
    const icon = Math.max(16, Math.min(width - 60, cell - LABEL - 12));
    tech.forEach((name, i) => {
      const top = HEADER + i * cell + (cell - icon - LABEL) / 2;
      const left = (width - icon) / 2;
      const logo = logos.get(name);
      if (logo) {
        drawContained(ctx, logo, left, top, icon);
      } else {
        ctx.fillStyle = '#e9e2d3';
        ctx.fillRect(left, top, icon, icon);
        ctx.fillStyle = MUTED;
        ctx.font = `bold ${Math.round(icon * 0.5)}px Georgia, serif`;
        ctx.fillText(name.charAt(0).toUpperCase(), width / 2, top + icon / 2);
      }
      ctx.fillStyle = INK;
      ctx.font = '22px Georgia, serif';
      ctx.fillText(name, width / 2, top + icon + LABEL / 2 + 4, width - 16);
    });
  };

  const texture = canvasTexture(width, height, draw);
  for (const name of tech) {
    const logo = new Image();
    logo.onload = () => {
      logos.set(name, logo);
      draw(texture.image.getContext('2d'));
      texture.needsUpdate = true;
    };
    logo.src = `/stack/${encodeURIComponent(name)}.png`;
  }
  return texture;
}

function descriptionTexture({ description, contributors = [], link }, width, height) {
  return canvasTexture(width, height, (ctx) => {
    paper(ctx);
    const margin = 28;
    const textWidth = width - margin * 2;
    ctx.fillStyle = '#333333';
    ctx.font = '24px Georgia, serif';
    const y = wrapText(ctx, description, margin, 48, textWidth, 32);

    if (contributors.length) {
      ctx.fillStyle = MUTED;
      ctx.font = 'italic bold 20px Georgia, serif';
      ctx.fillText('Contributors', margin, y + 52);
      ctx.fillStyle = '#333333';
      ctx.font = '22px Georgia, serif';
      wrapText(ctx, contributors.join(', '), margin, y + 82, textWidth, 28);
    }
    if (link) {
      ctx.fillStyle = MUTED;
      ctx.font = 'italic 20px Georgia, serif';
      ctx.fillText('Click the painting to open', margin, height - 24);
    }
  });
}

function panel(texture, width, height) {
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture }));
}

const px = (metres) => Math.round(metres * PX_PER_METRE);

// Prepares the loaded Blender frame to be cloned per project, and measures it so panels can sit around it.
// Position only aligns the model with its canvas; wall placement lives in WALL_SLOTS in projectFloor.js.
export function prepareFrameTemplate(frame) {
  frame.removeFromParent();
  frame.position.set(0, 0, 0);
  frame.quaternion.copy(FRAME_ROTATION);
  frame.traverse((child) => {
    if (!child.isMesh) return;
    if (child.material.map) child.visible = false; // placeholder canvas, replaced by project media
    else child.material.metalness = 0;
  });
  frame.updateMatrixWorld(true);
  frame.userData.size = new THREE.Box3().setFromObject(frame).getSize(new THREE.Vector3());
  return frame;
}

// A framed project facing local +Z: title above, tech stack column to the left, description to the right.
// scale enlarges the whole arrangement.
export function createPainting(project, frameTemplate, { scale = 1 } = {}) {
  const frame = frameTemplate.userData.size;

  const canvas = new THREE.Mesh(canvasGeometry, new THREE.MeshBasicMaterial({ map: mediaTexture(project) }));
  canvas.position.z = 0.008;

  const title = panel(titleTexture(project.title, px(frame.x), px(TITLE_HEIGHT)), frame.x, TITLE_HEIGHT);
  title.position.set(0, frame.y / 2 + PANEL_GAP + TITLE_HEIGHT / 2, 0.005);

  const stack = panel(stackTexture(project.tech, px(STACK_WIDTH), px(frame.y)), STACK_WIDTH, frame.y);
  stack.position.set(-(frame.x / 2 + PANEL_GAP + STACK_WIDTH / 2), 0, 0.005);

  const [descriptionWidth, descriptionHeight] = DESCRIPTION_SIZE;
  const description = panel(
    descriptionTexture(project, px(descriptionWidth), px(descriptionHeight)),
    descriptionWidth,
    descriptionHeight
  );
  description.position.set(frame.x / 2 + PANEL_GAP + descriptionWidth / 2, 0, 0.005);

  const painting = new THREE.Group();
  painting.add(frameTemplate.clone(), canvas, title, stack, description);
  painting.scale.setScalar(scale);
  return painting;
}
