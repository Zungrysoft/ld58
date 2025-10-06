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
import MainMenu from './menumain.js'
import drawText from './text.js'


export default class TutorialMenu extends Menu {
  buttons = [
    {
      text: 'Back',
      action: 'back',
    }
  ]
  header = 'How to Play'
  buttonColumns = 6

  info = [
    'Knock your opponent\'s colored marbles off the board to win.',
    'Other marbles you knock off are added to your collection next turn.',
    '',
    'You get two shots per turn. Marbles you hit on the first turn are',
    'frozen solid for the second turn.',
  ]

  menuEvent(action) {
    if (action === 'back') {
      this.isDead = true;
      this.playBackSound();
      game.addThing(new MainMenu())
    }
  }

  draw() {
    super.draw()

    let height = 300;
    for (const inf of this.info) {
      drawText(inf, 40, 'white', [320, height], [-1, -1])
      height += 80;
    }

    
  }
}

