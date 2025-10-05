import * as game from 'game'
import * as u from 'utils'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { assets } from 'game'
import * as render from './renderer.js'

export default class SnowParticle extends Thing {
  speed = 0.06
  windRate = 0.03
  windScale = 0.03
  position = [0, 0, 0]
  time = 0
  isThemeParticle = true;

  constructor () {
    super()
    const radius = 30
    this.position = [
      (Math.random() * 2 * radius) - radius,
      (Math.random() * 2 * radius) - radius,
      30,
    ]
  }

  update () {
    this.time ++
    const boardTime = game.getThing('background').time || 0

    // Move
    this.position = vec3.add(this.position, [-0.06, -0.006, -0.085])
    this.position[0] += Math.sin((boardTime/60) * this.windRate * Math.PI*2) * this.windScale
    this.position[0] += Math.sin((boardTime/60) * this.windRate * Math.PI*2 * 1.2) * this.windScale

    // Kill if too far away or too old
    if (vec3.magnitude(this.position) > 40 || this.time > 600) {
      this.isDead = true
    }
  }

  draw () {
    render.drawBillboard({
      texture: assets.textures.square,
      position: this.position,
      color: [1.0, 1.0, 1.0, 1.0],
      scale: 0.04,
      unshaded: true,
    })
  }
}
