import { node } from './dom.js';

function button(className, label, onClick) {
  const el = node('button', className, label);
  el.type = 'button';
  el.addEventListener('click', onClick);
  return el;
}

// A hint box at the bottom centre; show/hide are cheap to call every frame.
// actions: [{ label, run }] rendered as buttons in the box (the overlay itself ignores taps).
// onClose: adds an × in the box's corner that calls it.
export function createPrompt(text, { actions = [], onClose } = {}) {
  const message = node('span', null, text);
  const box = node('p', 'prompt__text');
  box.append(message);

  if (actions.length) {
    const bar = node('span', 'prompt__actions');
    bar.append(...actions.map(({ label, run }) => button('prompt__action', label, run)));
    box.append(bar);
  }
  if (onClose) {
    const close = button('prompt__close', '×', onClose);
    close.setAttribute('aria-label', 'Close');
    box.classList.add('prompt__text--closable');
    box.append(close);
  }

  const el = node('div', 'prompt');
  el.hidden = true;
  el.append(box);
  document.body.appendChild(el);

  return {
    show() {
      if (el.hidden) el.hidden = false;
    },
    hide() {
      if (!el.hidden) el.hidden = true;
    },
    setText(next) {
      if (message.textContent !== next) message.textContent = next;
    },
  };
}
