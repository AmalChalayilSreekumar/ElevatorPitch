import { createProjectFloor } from './projectsFloor/projectFloor.js';
import { createExpFloor } from './expFloor/expFloor.js';

// Elevator button mesh name -> floor key.
const FLOOR_BUTTONS = {
    buttonInner: 'projects',
    buttonInner1: 'experience',
};

// Every floor returns { group, ready, update?, interactions?, controlsLocked? }.
export function createFloorManager(scene, camera, look) {
    const factories = {
        projects: () => createProjectFloor(),
        experience: () => createExpFloor(camera, look),
    };
    const floors = {};
    let current = null;
    let requested = null;

    async function select(name) {
        if (!factories[name] || requested === name) return;
        requested = name;
        floors[name] ??= factories[name]();

        try {
            await floors[name].ready;
        } catch (error) {
            console.error(`Floor "${name}" failed to load:`, error);
            return;
        }
        if (requested !== name) return;

        if (current) scene.remove(current.group);
        current = floors[name];
        scene.add(current.group);
    }

    function interact(objectName) {
        if (FLOOR_BUTTONS[objectName]) select(FLOOR_BUTTONS[objectName]);
        else current?.interactions?.[objectName]?.();
    }

    return {
        select,
        interact,
        update: (delta) => current?.update?.(delta),
        controlsLocked: () => current?.controlsLocked?.() ?? false,
    };
}
