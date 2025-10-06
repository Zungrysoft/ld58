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
import TutorialMenu from './menututorial.js'


export default class ControlsMenu extends TutorialMenu {
  header = 'Controls'

  info = [
    'Mouse: Select and Shoot Marbles',
    'Right Click: Cancel Action',
    '',
    'WASD: Adjust Camera Position',
    'Q/E: Adjust Camera Zoom',
    'Space: Toggle Shooter Cam',
  ]
}

