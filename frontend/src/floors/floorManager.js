import { createProjectFloor } from './projectsFloor/projectFloor.js';
import { createExpFloor } from './expFloor/expFloor.js';
import { createStackFloor } from './stackFloor/stackFloor.js';
import { createPrompt } from '../ui/prompt.js';
import { createToast } from '../ui/toast.js';
import { ELEVATOR_FRONT } from '../objects/elevator/Elevator.js';

// Elevator button mesh name -> floor key. Panel top to bottom: 1 (Experience), 3 (Stack), 2 (Projects), buttonInner (close doors).
const DOOR_BUTTON = 'buttonInner';
const FLOOR_BUTTONS = {
    buttonInner1: 'experience',
    buttonInner2: 'projects',
    buttonInner3: 'stack',
};

// Shown on the elevator displays; level sets the travel arrow direction.
const FLOORS = {
    lobby: { level: 0, label: 'Lobby' },
    projects: { level: 1, label: 'Projects' },
    stack: { level: 2, label: 'Stack' },
    experience: { level: 3, label: 'Experience' },
};

// Minimum ride time so a cached floor still feels like the elevator travelled.
const MIN_TRAVEL_MS = 1500;

// How long the player can idle in the car after arriving before being nudged out.
const EXIT_PROMPT_DELAY = 3;

// How far past the door line the player must stand before the doors may close on them (player radius + door depth).
const INSIDE_MARGIN = 0.4;

const NO_ACTIONS = [];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Every floor returns { group, ready, enter?, exit?, update?, interactions?, controlsLocked?, primary?, actions? }.
// primary() gets first say on a click/tap and returns true if it used it; actions() returns a stable array of
// { label, run } for the touch context buttons.
export function createFloorManager(scene, camera, look, elevator, content) {
    const factories = {
        projects: () => createProjectFloor(content.projects),
        experience: () => createExpFloor(camera, look, content.experience),
        stack: () => createStackFloor(camera, look, content.stack, content.stackBoards),
    };
    const floors = {};
    let current = null;
    let currentName = 'lobby';
    let travelling = false;
    // Seconds spent in the car since the doors opened on this floor; null once the player has stepped out.
    let idleInCar = null;
    const exitPrompt = createPrompt('The doors are open. Walk out with W to explore.');
    const toast = createToast();
    let markSelected;
    const firstSelection = new Promise((resolve) => { markSelected = resolve; });

    const label = (name) => FLOORS[name].label.toUpperCase();
    const showArrived = () => elevator.setDisplay(`${FLOORS[currentName].level} ${label(currentName)}`);
    showArrived();

    const load = (name) => (floors[name] ??= factories[name]());

    // Tappable prompt shown on mobile while the crosshair rests on a floor button; same object per button.
    const floorPrompts = Object.fromEntries(Object.entries(FLOOR_BUTTONS).map(([button, name]) => [
        button,
        { label: `Tap to enter ${FLOORS[name].label} floor`, run: () => select(name) },
    ]));

    async function select(name) {
        if (!factories[name] || travelling) return;
        if (name === currentName) return elevator.openDoors();

        travelling = true;
        markSelected();
        try {
            await elevator.closeDoors();
            elevator.setDisplay(`${FLOORS[name].level > FLOORS[currentName].level ? '▲' : '▼'} ${label(name)}`);
            await Promise.all([load(name).ready, wait(MIN_TRAVEL_MS)]);

            if (current) {
                scene.remove(current.group);
                current.exit?.(scene);
            }
            current = floors[name];
            currentName = name;
            scene.add(current.group);
            current.enter?.(scene);
        } catch (error) {
            console.error(`Floor "${name}" failed to load:`, error);
        } finally {
            showArrived();
            if (current) {
                await elevator.openDoors();
                idleInCar = 0;
            }
            travelling = false;
        }
    }

    async function closeDoors() {
        if (travelling) return;
        if (!current) return toast.show('Pick a floor first. The doors open when you arrive.');
        if (!elevator.isOpen()) return toast.show('The doors are already closed. Press a floor button.');
        if (camera.position.z < ELEVATOR_FRONT.z + INSIDE_MARGIN) return toast.show('Step inside the elevator first.');

        idleInCar = null;
        await elevator.closeDoors();
        toast.show('Doors closed. Choose a floor.');
    }

    // Only nags right after arrival: walking back into the car to pick another floor doesn't re-trigger it.
    function updateExitPrompt(delta) {
        if (camera.position.z < ELEVATOR_FRONT.z) idleInCar = null;
        const waiting = idleInCar !== null && !travelling && !controlsLocked();
        if (waiting) idleInCar += delta;

        if (waiting && idleInCar >= EXIT_PROMPT_DELAY) exitPrompt.show();
        else exitPrompt.hide();
    }

    const controlsLocked = () => current?.controlsLocked?.() ?? false;

    function interact(objectName) {
        if (objectName === DOOR_BUTTON) closeDoors();
        else if (FLOOR_BUTTONS[objectName]) select(FLOOR_BUTTONS[objectName]);
        else current?.interactions?.[objectName]?.();
    }

    return {
        preload: (name) => load(name),
        floorButtons: Object.keys(FLOOR_BUTTONS),
        touchPrompt: (objectName) => (travelling ? null : floorPrompts[objectName] ?? null),
        firstSelection,
        primary(objectName) {
            if (!current?.primary?.()) interact(objectName);
        },
        actions: () => current?.actions?.() ?? NO_ACTIONS,
        update(delta) {
            current?.update?.(delta);
            updateExitPrompt(delta);
        },
        controlsLocked,
    };
}
