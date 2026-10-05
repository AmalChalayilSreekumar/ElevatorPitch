import express from 'express';
import { profile } from './data/profile.js';
import { projects } from './data/projects.js';
import { experience } from './data/experience.js';
import { stack, stackBoards } from './data/stack.js';

const PORT = process.env.PORT ?? 3000;
// Set when the frontend is served from another origin (e.g. a static host in front of this API).
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

const content = { profile, projects, experience, stack, stackBoards };

const app = express();

if (CLIENT_ORIGIN) {
  app.use((_req, res, next) => {
    res.set('Access-Control-Allow-Origin', CLIENT_ORIGIN);
    next();
  });
}

// Everything the site needs in one request; single resources are available for anything that wants less.
app.get('/api/content', (_req, res) => res.json(content));

app.get('/api/:name', (req, res) => {
  const resource = Object.hasOwn(content, req.params.name) ? content[req.params.name] : undefined;
  if (resource === undefined) return res.status(404).json({ error: `Unknown resource "${req.params.name}"` });
  res.json(resource);
});

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
