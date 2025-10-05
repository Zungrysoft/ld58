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
import CollectedMarble from './collectedmarble.js'


export default class TitleMenu extends Menu {
  buttons = [
    {
      text: '',
      action: '',
    },
    {
      text: '',
      action: '',
    },
    {
      text: '',
      action: '',
    },
    {
      text: '',
      action: '',
    },
    {
      text: '',
      action: '',
    },
    {
      text: '',
      action: '',
    },
    {
      text: '',
      action: '',
    },
    {
      text: 'Start Game',
      action: 'start',
    },
  ]
  header = 'Rocky Mountain Marbles'
  subheader = 'made by ZungryWare for Ludum Dare 58'
  buttonsPerColumn = 4

  menuEvent(action) {
    if (action === 'start') {
      this.isDead = true;
      this.playClickSound();
      game.addThing(new MainMenu())
    }
  }

  update() {
    super.update()

    if (this.time > 30 && this.time % 8 === 0 && Math.random() < 0.2) {
      let marbleType = 'basic';
      if (Math.random() < 0.1) {marbleType = 'basic'}
      if (Math.random() < 0.03) {marbleType = 'heavy'}
      if (Math.random() < 0.001) {marbleType = 'mega'}
      if (Math.random() < 0.08) {marbleType = 'structure_ramp'}
      if (Math.random() < 0.08) {marbleType = 'fire'}
      if (Math.random() < 0.05) {marbleType = 'metal'}
      if (Math.random() < 0.1) {marbleType = 'shock'}
      if (Math.random() < 0.16) {marbleType = 'bonus'}

      game.addThing(new CollectedMarble(marbleType, 'victory'));
    }
  }
}

