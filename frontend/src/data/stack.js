// The tech stack, used twice on the stack floor:
//  - range targets pop up one at a time in this order;
//  - the boards above the counter list each entry under its `board` title.
// image: path relative to frontend/public/ (e.g. '/stack/Python.png'); null prints the name instead.
// SVG logos need width/height attributes on the root <svg> so they can be drawn onto canvases.

// Board titles, left to right (the gun's sign hangs between the 2nd and 3rd).
export const stackBoards = ['Frameworks','Languages', 'Data & ML', 'Databases & Tools'];

export const stack = [
  { name: 'JavaScript', image: '/stack/JavaScript.png', board: 'Languages' },
  { name: 'React.js', image: '/stack/React.png', board: 'Frameworks' },
  { name: 'Node.js', image: '/stack/Node.png', board: 'Frameworks' },
  { name: 'Python', image: '/stack/Python.png', board: 'Languages' },
  { name: 'Pandas', image: '/stack/Pandas.png', board: 'Data & ML' },
  { name: 'Matplotlib', image: '/stack/Matplotlib.png', board: 'Data & ML' },
  { name: 'PyTorch', image: '/stack/PyTorch.png', board: 'Data & ML' },
  { name: 'OpenCV', image: '/stack/OpenCV.png', board: 'Data & ML' },
  { name: 'Java', image: '/stack/Java.png', board: 'Languages' },
  { name: 'C', image: '/stack/C.png', board: 'Languages' },
  { name: 'PostgreSQL', image: '/stack/PostgreSQL.png', board: 'Databases & Tools' },
  { name: 'TypeScript', image: '/stack/TypeScript.png', board: 'Languages' },
  { name: 'Three.js', image: '/stack/Three.js.png', board: 'Frameworks' },
  { name: 'Vite', image: '/stack/Vite.png', board: 'Frameworks' },
  { name: 'FastAPI', image: '/stack/FastAPI.png', board: 'Frameworks' },
  { name: 'Jupyter Lab', image: '/stack/JupyterLab.png', board: 'Data & ML' },
];
