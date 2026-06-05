import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'


//Scence and Camera init
const fov = 75;                                         
const aspectRatio = window.innerWidth / window.innerHeight;   
const nearCPlane = 0.1;                                       
const farCPlane = 1000;                                       

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(fov, aspectRatio, nearCPlane, farCPlane);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth,window.innerHeight)


