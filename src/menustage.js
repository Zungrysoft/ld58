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


export default class StageSelectMenu extends Menu {
  buttons = []
  header = ''

  constructor(isMultiplayer) {
    super()

    const levelsList = isMultiplayer ? game.assets.data.stageListMultiplayer : game.assets.data.stageListSingleplayer;
    this.buttons = levelsList.map(x => ({
      text: game.assets.data.stages[x].title,
      action: x,
    }))

    this.buttons.push({
      text: 'Back',
      action: 'back',
    })

    this.header = isMultiplayer ? 'Select Arena' : 'Select Stage';
  }

  menuEvent(action) {
    if (action === 'back') {
      this.isDead = true;
      this.playBackSound();
      game.addThing(new MainMenu())
    }
    else {
      this.isDead = true
      this.playClickSound();
      game.addThing(new Table(game.assets.data.stages[action]))
    }
  }
}

