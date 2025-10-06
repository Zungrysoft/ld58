import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as render from './renderer.js'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import * as game from 'game'
import Thing from 'thing'
import { assets } from 'game'
import drawText from './text.js'

const BUTTON_SPACING = 60
const BUTTON_FONT_SIZE = 75
const BUTTON_PADDING = 16
const BUTTON_HEADER = 150
const BUTTON_SELECTION_OFFSET = 90

export default class Menu extends Thing {
  buttons = []
  buttonColumns = 3
  buttonsPerColumn = 6
  header = ''
  headerFontSize = 120
  subheader = ''
  subheaderFontSize = 50

  buttonOffsets = []
  time = 0
  prevSelectedAction = null

  update() {
    this.time ++;

    const selectedButton = this.getSelectedButton();
    for (let i = 0; i < this.buttons.length; i ++) {
      this.buttonOffsets[i] = u.lerp(this.buttonOffsets[i] ?? 0, i === selectedButton? 1 : 0, 0.2);
    }

    if (game.mouse.leftClick && this.time > 5) {
      const selectedButton = this.getSelectedButton();
      if (selectedButton >= 0) {
        const action = this.buttons[selectedButton]?.action;
        if (action) {
          this.menuEvent(action);
        }
        
      }
    }

    if (this.buttons[selectedButton]?.action && this.buttons[selectedButton]?.action !== this.prevSelectedAction) {
      soundmanager.playSound('menu3', 1, 1);
    }
    this.prevSelectedAction = this.buttons[selectedButton]?.action;
  }

  menuEvent() {}

  playClickSound() {
    soundmanager.playSound('menu2', 1, 1);
  }

  playBackSound() {
    soundmanager.playSound('menu', 1, 1);
  }

  getSelectedButton() {
    const yTop = game.mouse.position[1] - BUTTON_HEADER + 40;
    if (yTop > 0 && yTop < BUTTON_SPACING * this.buttonsPerColumn ) {
      const col = Math.floor(game.mouse.position[0] / (game.config.width / this.buttonColumns));
      const row = Math.floor(yTop / BUTTON_SPACING);

      const ind = col * this.buttonsPerColumn + row;
      return ind;
    }
    return -1;
  }

  draw() {
    drawText(
      this.header,
      this.headerFontSize, 'blue', [0, this.headerFontSize + 20], [0, -1]
    )
    drawText(
      this.subheader,
      this.subheaderFontSize, 'blue', [0, this.headerFontSize + this.subheaderFontSize + 40], [0, -1]
    )

    let i = 0;
    for (const button of this.buttons) {
      const pos = [
        (Math.floor(i / this.buttonsPerColumn) * (game.config.width*2 / this.buttonColumns)) + BUTTON_PADDING + BUTTON_SELECTION_OFFSET*this.buttonOffsets[i],
        BUTTON_HEADER*2 + ((i % this.buttonsPerColumn) * BUTTON_SPACING * 2) + BUTTON_PADDING,
      ]
      drawText(
        button.text,
        BUTTON_FONT_SIZE, 'white', pos, [-1, -1]
      )

      i ++;
    }
  }
}

