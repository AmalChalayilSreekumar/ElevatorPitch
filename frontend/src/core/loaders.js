import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// One Draco decoder for the app, so rebuilding a floor reuses its worker pool and WASM instead of starting new ones.
const dracoLoader = new DRACOLoader().setDecoderPath('/draco/');

export const gltfLoader = new GLTFLoader().setDRACOLoader(dracoLoader);
