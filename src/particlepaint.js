import * as game from 'game'
import * as u from 'utils'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { assets } from 'game'
import * as render from './renderer.js'
import { COLOR_MAP } from './element.js'

export default class PaintParticle extends Thing {
  constructor (position, color) {
    super()
    this.position = position
    this.color = color
    this.velocity = this.randomVelocity()
  }

  randomVelocity() {
    const theta = 2 * Math.PI * Math.random()
    const phi = Math.acos(2 * Math.random() - 1)

    const x = Math.sin(phi) * Math.cos(theta)
    const y = Math.sin(phi) * Math.sin(theta)
    const z = Math.cos(phi)

    return vec3.scale([x, y, z], u.map(Math.random(), 0, 1, 0.01, 0.2))
  }

  update () {
    // Move
    this.position = vec3.add(this.position, this.velocity)

    // Drag
    this.velocity = vec3.lerp(this.velocity, [0, 0, 0], 0.05)

    // Make particle smaller and smaller
    if (vec3.magnitude(this.velocity) < 0.01) {
      this.isDead = true
    }
  }

  draw () {
    render.drawBillboard({
      texture: assets.textures.square,
      position: this.position,
      color: COLOR_MAP[this.color] || [1.0, 1.0, 1.0, 1.0],
      scale: 0.06,
      unshaded: true,
    })
  }
}
