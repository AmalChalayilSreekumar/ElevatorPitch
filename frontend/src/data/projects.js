// Gallery order: 1st hangs centred on the back wall, 2nd on the left wall, 3rd on the right wall.
// Up to 3 projects; extras are skipped (add spots in WALL_SLOTS in projectFloor.js).
// Media paths are relative to Public/ (e.g. '/projects/site.mp4'). Leave both null for a placeholder.
// tech: logo file names in public/stack/ without '.png' (e.g. 'JavaScript' -> /stack/JavaScript.png), shown as the label.
//       A name with no matching file shows its initial instead.
// contributors: names listed under the description; leave empty for solo projects.
export const projects = [
  {
    title: 'Autonomous Drone with Fruitfly Brain',
    description: 'A first-person portfolio: ride the elevator, walk the gallery, take the career coaster.',
    tech: ['Python', 'PyTorch', 'OpenCV'],
    image: null,
    video: null,
    link: null,
    contributors: [],
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
    title: 'Project Three',
    description: 'One or two sentences on what it does and what you built.',
    tech: ['Tech', 'Stack'],
    image: null,
    video: null,
    link: null,
    contributors: [],
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
