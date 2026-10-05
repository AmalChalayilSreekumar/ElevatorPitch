import * as THREE from 'three';
import './introScreen.css';

const TYPE_INTERVAL_MS = 22;

function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function controlsList(controls) {
  const list = node('dl', 'intro__controls');
  for (const [key, action] of controls) list.append(node('dt', null, key), node('dd', null, action));
  return list;
}

function modeButton(mode, label, controls) {
  const button = node('button', 'intro__mode');
  button.type = 'button';
  button.dataset.mode = mode;
  button.append(node('span', 'intro__mode-title', label), controlsList(controls));
  return button;
}

// Tracks THREE.DefaultLoadingManager, types out the pitch, then asks how the player is playing.
// onStart receives 'desktop' or 'mobile'; only those buttons start the game.
export function createIntroScreen(profile, onStart) {
  const bar = node('div', 'intro__bar-fill');
  const status = node('p', 'intro__status', 'Loading 0%');
  const pitchLines = profile.pitch.map(() => node('p'));

  const buttons = [
    modeButton('desktop', 'Desktop / Laptop', profile.controls),
    modeButton('mobile', 'Mobile', profile.touchControls),
  ];
  const modes = node('div', 'intro__modes');
  modes.append(...buttons);
  const prompt = node('div', 'intro__prompt');
  prompt.append(node('p', 'intro__prompt-title', 'How are you playing?'), modes);
  prompt.hidden = true;

  const barTrack = node('div', 'intro__bar');
  barTrack.append(bar);

  const panel = node('div', 'intro__panel');
  panel.append(
    node('p', 'intro__kicker', profile.title),
    node('h1', 'intro__title', profile.name),
    ...pitchLines,
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

  // Any input skips the typing; starting needs an explicit mode choice.
  function skipTyping() {
    if (!typed) finishTyping();
  }

  function start(mode) {
    manager.onProgress = manager.onLoad = undefined;
    window.removeEventListener('keydown', skipTyping);
    screen.removeEventListener('click', skipTyping);
    screen.classList.add('intro--leaving');
    screen.addEventListener('transitionend', () => screen.remove(), { once: true });
    onStart(mode);
  }

  for (const button of buttons) button.addEventListener('click', () => start(button.dataset.mode), { once: true });
  window.addEventListener('keydown', skipTyping);
  screen.addEventListener('click', skipTyping);
  typePitch();
}
