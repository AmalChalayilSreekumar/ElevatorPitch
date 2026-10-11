<!-- Replace <your-domain> on the next line with the real domain before pushing. -->
# Elevator Pitch

A first-person portfolio you walk around in, built with Three.js.

**[Website Link](https://<amals-elevator-pitch.com>)**

## What it is

You start inside an elevator modelled in Blender. Press a floor button, the doors close, and they open onto a completely different world:

- **Projects** — an art gallery where each painting plays a project demo, with its stack and write-up framed alongside it.
- **Experience** — a roller coaster whose stops are a career timeline. You board a cart, ride the lift hill, and the track brakes into one job at a time.
- **Stack** — a shooting range where every target is a technology, and the boards overhead group them by category.

It runs on desktop and on phones, and all of the content comes from plain data files rather than a CMS or an API.

## Controls

| Desktop | | Mobile | |
|---|---|---|---|
| `WASD` | Move | Left stick | Move |
| Mouse | Look around | Drag | Look around |
| Click | Press buttons and interact | Tap | Press buttons and interact |
| `Esc` | Release the mouse | | |

The intro screen asks which you're on, so touch devices never get keyboard hints.

## Tech stack

| | |
|---|---|
| Rendering | Three.js `^0.184` — no 3D framework or scene-graph wrapper |
| Language | Vanilla ES modules; no TypeScript, no UI framework |
| Build | Vite 8 |
| Assets | Blender → glTF, geometry compressed with Draco |
| Hosting | Cloudflare static assets |

`three` is the only runtime dependency. There is no backend.

## Engineering highlights

### A uniform floor interface

Every floor is a factory returning the same shape:

```js
{ group, ready, dispose, enter?, exit?, update?, interactions?, controlsLocked?, primary?, actions? }
```

The floor manager only ever talks to a floor through that interface, so the three worlds are interchangeable despite having nothing in common visually. Travelling between them is one async sequence — close the doors, await the floor, swap the scene graph, reopen — and the reopen sits in a `finally`, so a failed asset load logs an error instead of sealing the player in.

### The elevator is the loading screen

Floors are built the moment you choose one, not up front. The load is awaited against a minimum ride time, so it happens *inside* the elevator animation. There is no spinner or progress bar between floors; waiting is part of the fiction.

### Bounded GPU memory

Leaving a floor tears it down rather than caching it. One traversal disposes its geometry, materials, textures, instanced buffers and light shadow maps, and releases the `<video>` decoders feeding the gallery. Each floor also owns an `AbortController` for its page-level listeners and removes its own DOM overlays, so a single call cleans up all three kinds of resource.

Only the floor you are standing on is resident, which keeps peak memory at the size of the largest floor instead of the sum of every floor visited — the difference that matters on a mid-range phone. It is measured, not assumed: cycling the floors repeatedly returns `renderer.info.memory` to the same baseline instead of climbing.

### One input layer, two form factors

Desktop uses pointer lock with raw mouse deltas; touch uses a Pointer Events joystick, drag-to-look, and a tap that interacts with whatever the crosshair is on. Both drive the same movement and interaction code. A few fixes came from real devices rather than theory: dropping the oversized pointer-lock deltas Chromium occasionally reports on Windows, releasing held keys when the page loses focus so opening a link can't leave you walking, and the attribute-level coaxing iOS needs before it will autoplay an inline video texture.

### Performance work

Repeated geometry (coaster ties and supports, light strips, range fixtures) is drawn with instanced meshes. Signs, boards, target faces and gallery panels are drawn procedurally to canvases instead of downloading images. Decorative meshes opt out of raycasting so the per-frame crosshair pick stays cheap, shots test only live targets, one shared Draco loader serves every model, and the first floor preloads behind the intro screen.

## Content is data-driven

Everything the site says lives in `frontend/src/data/`:

| File | Drives |
|---|---|
| `profile.js` | Name, title, intro pitch, control legends |
| `projects.js` | The gallery paintings |
| `experience.js` | The coaster stops |
| `stack.js` | The range targets and the boards above them |

Add an entry and the world rebuilds around it — a new painting, a new stop spaced along the track, a new target. It's bundled at build time, so there's nothing to fetch and nothing to deploy separately. Two limits are worth knowing: the gallery has three wall slots, and a `tech` entry renders a logo from `frontend/public/stack/<Name>.png`, falling back to its initial when no file matches.

## Project structure

```
frontend/
├─ index.html              Mount point, crosshair, HUD and overlay styles
├─ wrangler.jsonc          Cloudflare deploy config (serves ./dist)
├─ public/
│  ├─ blenderFiles/        Elevator and gallery models (.glb + .blend sources)
│  ├─ draco/               Draco decoder (WASM)
│  ├─ projects/            Project demo videos
│  └─ stack/               Tech logos
└─ src/
   ├─ main.js              Entry point; owns the render loop
   ├─ core/                Renderer, scene, camera; shared model loader
   ├─ data/                All site content
   ├─ objects/elevator/    The car: doors, floor display, button wiring
   ├─ floors/              Floor manager, return guide, shared doorway wall
   │  ├─ projectsFloor/    Gallery room and paintings
   │  ├─ expFloor/         Coaster: track, cart, signs, hall, timeline card
   │  └─ stackFloor/       Range: targets, gun, room, boards, HUD
   ├─ player/              Look, movement, collision, interaction, touch controls
   ├─ ui/                  Intro screen, tutorial, prompts, toasts, hints
   └─ utils/               Canvas-texture helpers, GPU teardown
```

## Running locally

Needs Node 18+ and a browser with WebGL2.

```bash
cd frontend
npm install
npm run dev        # dev server
npm run build      # production build into dist/
npm run preview    # serve the build
```

## Deploying

`npm run build` emits `frontend/dist`, which Cloudflare serves as static assets per `frontend/wrangler.jsonc`.

## Author

Amal Chalayil Sreekumar — Mathematics and Computer Science @ Western University, Ontario.
