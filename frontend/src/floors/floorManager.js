import { createProjectFloor } from './projectsFloor/projectFloor.js';
import { createExpFloor } from './expFloor/expFloor.js';
import { createStackFloor } from './stackFloor/stackFloor.js';

// Elevator button mesh name -> floor key. Panel top to bottom: buttonInner (Me), 1 (Experience), 3 (Stack), 2 (Projects).
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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Every floor returns { group, ready, enter?, exit?, update?, interactions?, controlsLocked? }.
export function createFloorManager(scene, camera, look, elevator) {
    const factories = {
        projects: () => createProjectFloor(),
        experience: () => createExpFloor(camera, look),
        stack: () => createStackFloor(camera, look),
    };
    const floors = {};
    let current = null;
    let currentName = 'lobby';
    let travelling = false;

    const label = (name) => FLOORS[name].label.toUpperCase();
    const showArrived = () => elevator.setDisplay(`${FLOORS[currentName].level} ${label(currentName)}`);
    showArrived();

    const load = (name) => (floors[name] ??= factories[name]());

    async function select(name) {
        if (!factories[name] || travelling) return;
        if (name === currentName) return elevator.openDoors();

        travelling = true;
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
            if (current) await elevator.openDoors();
            travelling = false;
        }
    }

    function interact(objectName) {
        if (FLOOR_BUTTONS[objectName]) select(FLOOR_BUTTONS[objectName]);
        else current?.interactions?.[objectName]?.();
    }

    return {
        preload: (name) => load(name),
        interact,
        update: (delta) => current?.update?.(delta),
        controlsLocked: () => current?.controlsLocked?.() ?? false,
    };
}
