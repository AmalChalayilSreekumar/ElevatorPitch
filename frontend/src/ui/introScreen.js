import * as THREE from 'three';
import './introScreen.css';

const TYPE_INTERVAL_MS = 22;

function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

// Tracks THREE.DefaultLoadingManager, types out the pitch, and calls onStart once the player continues.
export function createIntroScreen(profile, onStart) {
  const bar = node('div', 'intro__bar-fill');
  const status = node('p', 'intro__status', 'Loading 0%');
  const pitchLines = profile.pitch.map(() => node('p'));
  const prompt = node('p', 'intro__prompt', 'Press any key to start');
  prompt.hidden = true;

  const controls = node('dl', 'intro__controls');
  for (const [key, action] of profile.controls) controls.append(node('dt', null, key), node('dd', null, action));

  const barTrack = node('div', 'intro__bar');
  barTrack.append(bar);

  const panel = node('div', 'intro__panel');
  panel.append(
    node('p', 'intro__kicker', profile.title),
    node('h1', 'intro__title', profile.name),
    ...pitchLines,
    controls,
    barTrack,
    status,
    prompt
  );

  const screen = node('div', 'intro');
  screen.append(panel);
  document.body.append(screen);

  let loaded = false;
  let typed = false;
  let typingTimer = null;

  const manager = THREE.DefaultLoadingManager;
  manager.onProgress = (_url, done, total) => {
    const percent = Math.round((done / total) * 100);
    bar.style.width = `${percent}%`;
    status.textContent = `Loading ${percent}%`;
  };
  manager.onLoad = () => {
    loaded = true;
    bar.style.width = '100%';
    status.textContent = 'Ready';
    refreshPrompt();
  };

  function refreshPrompt() {
    prompt.hidden = !(loaded && typed);
  }

  function typePitch() {
    let line = 0;
    let char = 0;
    typingTimer = setInterval(() => {
      const text = profile.pitch[line];
      pitchLines[line].textContent = text.slice(0, ++char);
      if (char < text.length) return;
      line++;
      char = 0;
      if (line === profile.pitch.length) finishTyping();
    }, TYPE_INTERVAL_MS);
  }

  function finishTyping() {
    clearInterval(typingTimer);
    pitchLines.forEach((el, i) => (el.textContent = profile.pitch[i]));
    typed = true;
    refreshPrompt();
  }

  // First input skips the typing; once everything is ready, the next one starts the game.
  function handleInput() {
    if (!typed) return finishTyping();
    if (!loaded) return;

    manager.onProgress = manager.onLoad = undefined;
    window.removeEventListener('keydown', handleInput);
    screen.removeEventListener('click', handleInput);
    screen.classList.add('intro--leaving');
    screen.addEventListener('transitionend', () => screen.remove(), { once: true });
    onStart();
  }

  window.addEventListener('keydown', handleInput);
  screen.addEventListener('click', handleInput);
  typePitch();
}
