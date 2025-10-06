import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as render from './renderer.js'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import * as game from 'game'
import Thing from 'thing'
import { assets } from 'game'
import Menu from './menu.js'
import MainMenu from './menumain.js'
import Table from './table.js'
import drawText from './text.js'


export default class QuitButton extends Thing {
  constructor() {
    super()
  }

  update() {
    if (game.mouse.leftClick && game.mouse.position[0] > game.config.width - 50 && game.mouse.position[1] < 20) {
      game.getThing('table').quit();
    }
  }

  draw() {
    drawText('QUIT', 30, 'red', [20, 35], [1, -1]);
  }
}

