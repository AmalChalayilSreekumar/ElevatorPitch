// A full-screen tinted hint with its message at the bottom centre; show/hide are cheap to call every frame.
export function createPrompt(text) {
  const message = document.createElement('p');
  message.className = 'prompt__text';
  message.textContent = text;

  const el = document.createElement('div');
  el.className = 'prompt';
  el.hidden = true;
  el.append(message);
  document.body.appendChild(el);

  return {
    show() {
      if (el.hidden) el.hidden = false;
    },
    hide() {
      if (!el.hidden) el.hidden = true;
    },
  };
}
