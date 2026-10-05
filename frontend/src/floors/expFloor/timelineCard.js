import { isTouch } from '../../player/device.js';

function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

export function createTimelineCard() {
  const card = node('aside', 'exp-card');
  card.hidden = true;
  document.body.appendChild(card);

  return {
    show(job, index, total) {
      const highlights = node('ul');
      highlights.append(...job.highlights.map((h) => node('li', null, h)));
      const isLast = index === total - 1;
      const action = isTouch() ? 'Tap' : 'Space';

      card.style.setProperty('--accent', job.color);
      card.replaceChildren(
        node('p', 'exp-card__stop', `Stop ${index + 1} of ${total}`),
        node('h2', 'exp-card__role', job.role),
        node('p', 'exp-card__company', job.company),
        node('p', 'exp-card__meta', [job.period, job.location].filter(Boolean).join(' · ')),
        node('p', null, job.summary),
        highlights,
        node('p', 'exp-card__hint', `${action} to ${isLast ? 'ride back to the station' : 'continue'}`)
      );
      card.hidden = false;
    },
    hide() {
      card.hidden = true;
    },
  };
}
