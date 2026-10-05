// Chosen on the intro screen: mobile uses joysticks and tap-to-interact; desktop uses WASD, mouse look and pointer lock.
let touch = false;

export const isTouch = () => touch;

export function setTouchMode(on) {
  touch = on;
}
