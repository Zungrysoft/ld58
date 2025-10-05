import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as render from './renderer.js'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import * as game from 'game'
import Thing from 'thing'
import { assets } from 'game'
import Menu from './menu.js'
import StageSelectMenu from './menustage.js'


export default class MainMenu extends Menu {
  buttons = [
    {
      text: 'Singleplayer',
      action: 'singleplayer',
    },
    {
      text: '2-Player',
      action: 'multiplayer',
    },
    {
      text: 'Tutorial',
      action: 'tutorial',
    },
    {
      text: 'Marble Glossary',
      action: 'glossary',
    },
  ]
  header = 'Main Menu'

  menuEvent(action) {
    if (action === 'singleplayer') {
      this.isDead = true;
      game.addThing(new StageSelectMenu())
    }
    if (action === 'multiplayer') {
      this.isDead = true;
      game.addThing(new StageSelectMenu(true))
    }
  }
}

