import { createPrompt } from './prompt.js';
import { isTouch } from '../player/device.js';

const DESKTOP_TEXT = 'Click one of the glowing buttons in the elevator to choose a floor. Make sure to explore them all!! \nWASD to move \n Shift to sprint \n Cursor to look \n Esc to exit game view';
const TOUCH_TEXT = 'Aim at one of the glowing buttons and tap to choose a floor. Make sure to explore them all!!\nLeft stick to move and drag anywhere to look around';


// First-run hint: the floor buttons pulse and the text stays until a floor is picked.
export function createTutorial(elevator, floorButtons) {
  let prompt = null;

  return {
    start() {
      prompt = createPrompt(isTouch() ? TOUCH_TEXT : DESKTOP_TEXT);
      prompt.show();
      elevator.setPulsing(floorButtons);
    },
    finish() {
      elevator.setPulsing([]);
      prompt?.hide();
    },
  };
}
