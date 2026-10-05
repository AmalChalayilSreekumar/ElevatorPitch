// Gallery order: 1st hangs centred on the back wall, 2nd on the left wall, 3rd on the right wall.
// Up to 3 projects; extras are skipped (add spots in WALL_SLOTS in frontend/src/floors/projectsFloor/projectFloor.js).
// Media paths are relative to frontend/public/ (e.g. '/projects/site.mp4'). Leave both null for a placeholder.
// tech: logo file names in frontend/public/stack/ without '.png' (e.g. 'JavaScript' -> /stack/JavaScript.png), shown as the label.
//       A name with no matching file shows its initial instead.
// contributors: names listed under the description; leave empty for solo projects.
export const projects = [
  {
    title: 'Autonomous Drone with Fruitfly Brain',
    description: 'A Brian2 neural network built from real FlyWire connectome data flies a drone, using a fly\'s escape and stabilization circuits. The same controller runs on a PyBullet simulator or a real DJI Tello, with a safety layer that overrides it near obstacles. A YOLOv8 and MobileNetV2 pipeline finds and "eats" bananas, and the escape reflex passed 5/5 swat tests with no false positives.',
    tech: ['Python', 'PyTorch', 'OpenCV'],
    image: null,
    video: null,
    link: 'https://github.com/Parth-Joshi0/Fly-Brain-Drone',
    contributors: ["Akshin Makkar, Parth Joshi, Amal Chalayil Sreekumar"],
  },
  {
    title: 'Facial Detection Neural Network',
    description: 'One or two sentences on what it does and what you built.',
    tech: ['Python', 'Matplotlib', 'PyTorch'],
    image: null,
    video: null,
    link: 'https://github.com/AmalChalayilSreekumar/GeekedVsLockedNeuralNet',
    contributors: [],
  },
  {
    title: 'This Website',
    description: 'An interactive 3D elevator portfolio built with Three.js and Blender, where each floor (a project gallery, a career roller coaster and a tech-stack shooting range) turns a résumé into something you can explore.',
    tech: ['Three', 'Vite', 'JavaScript'],
    image: null,
    video: null,
    link: null,
    contributors: ['Amal Chalayil Sreekumar'],
  },
  {
    title: 'Project Four',
    description: 'One or two sentences on what it does and what you built.',
    tech: ['Tech', 'Stack'],
    image: null,
    video: null,
    link: null,
    contributors: [],
  },
];
