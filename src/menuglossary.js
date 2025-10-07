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
import { getMarbleScale, getMarbleUnshaded } from './marble.js'


export default class GlossaryMenu extends Menu {
  buttons = [
    {
      text: 'Back',
      action: 'back',
    }
  ]
  header = 'Marble Glossary'
  buttonColumns = 6

  marbleHeights = [1]
  selectedMarble = 0;

  marbles = [
    {
      type: 'basic',
      title: 'Basic Marble',
      description: [
        'Standard marble with no abilities.',
      ]
    },
    {
      type: 'shooter_p1',
      title: 'Shooter Marble',
      description: [
        'Returns to your collection at the end of turn to be used again.',
      ]
    },
    {
      type: 'shock',
      title: 'Shockwave Marble',
      description: [
        'Explodes whenever it collides with another marble at high speed.',
        'Great for scattering dense clusters of marbles!',
      ]
    },
    {
      type: 'fire',
      title: 'Fire Marble',
      description: [
        'Destroys any other marble it hits if it is moving fast enough.',
        '(Goal Marbles are indestructible.)',
      ]
    },
    {
      type: 'structure_ramp',
      title: 'Ramp Builder Marble',
      description: [
        'After you shoot this, it transforms in to a ramp once it stops moving.',
        'The ramp faces in the the direction the marble was traveling in.',
        '',
        'Disappears after 5 turns.',
      ]
    },
    {
      type: 'structure_pillar',
      title: 'Pillar Builder Marble',
      description: [
        'After you shoot this, it transforms in to a pillar once it stops moving.',
        '',
        'Disappears after 5 turns.',
      ]
    },
    {
      type: 'bonus',
      title: 'Bonus Marble',
      description: [
        'Grants an extra shot for this turn when you collect it.',
      ]
    },
    {
      type: 'evil',
      title: 'Danger Marble',
      description: [
        'You lose all of your marbles if you collect this. So don\'t.',
      ]
    },
    {
      type: 'metal',
      title: 'Steel Marble',
      description: [
        'Completely plows through other marbles and is very hard to move',
        'once placed.',
      ]
    },
    {
      type: 'goal_p2',
      title: 'Goal Marble',
      description: [
        'Collect all of your opponents\' Goal Marbles to win the game!',
        '',
        'Tip: You can move your own Goal Marbles around or put other',
        'marbles in front of them to protect them.',
      ]
    },
  ]

  update() {
    super.update();

    const selectedMarble = this.getSelectedMarble();
    if (selectedMarble >= 0 && selectedMarble < this.marbles.length && selectedMarble !== this.selectedMarble) {
      this.selectedMarble = selectedMarble;
      soundmanager.playSound('menu3', 1, 1)
    }
    
    for (let i = 0; i < this.marbles.length; i ++) {
      this.marbleHeights[i] = u.lerp(this.marbleHeights[i] ?? 0, i === this.selectedMarble ? 1 : 0, 0.2)
    }

    
  }

  getSelectedMarble() {
    const SPACING = 70;
    const mousePosX = game.mouse.position[0];
    if (game.mouse.position[1] < (game.config.height - 40) && game.mouse.position[1] > (game.config.height - 120)) {
      return Math.floor((mousePosX - 15) / SPACING);
    }
    return -1;
  }

  menuEvent(action) {
    if (action === 'back') {
      this.isDead = true;
      this.playBackSound();
      game.addThing(new MainMenu())
    }
  }

  draw() {
    super.draw()

    if (this.selectedMarble >= 0) {
      let height = 300;

      drawText(this.marbles[this.selectedMarble].title, 60, 'white', [160, height], [0, -1])
      height += 80;

      for (const desc of this.marbles[this.selectedMarble].description) {
        drawText(desc, 40, 'white', [320, height], [-1, -1])
        height += 80;
      }
    }
    

    let xPos = 9.2;
    let i = 0;
    for (const marb of this.marbles) {
      const marbleType = marb.type;
      
      render.drawUIMesh({
        mesh: assets.meshes.sphere,
        texture: assets.textures['uv_marble_' + marbleType] ?? assets.textures.square,
        position: [xPos, -10.4, -3.7 + ((this.marbleHeights[i] ?? 0) * 0.7)],
        scale: 2 * getMarbleScale(marbleType),
        rotation: [0, 0, 0],
        unshaded: getMarbleUnshaded(marbleType),
      })
      xPos -= 1.6
      i ++;
    }

    
  }
}

