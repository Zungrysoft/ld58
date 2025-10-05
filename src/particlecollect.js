import * as game from 'game'
import * as u from 'utils'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { assets } from 'game'
import * as render from './renderer.js'

export default class CollectParticle extends Thing {
  constructor (position, type) {
    super()
    this.position = [...position]
    this.type = type
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

    this.position[2] += 0.2

    // Drag
    this.velocity = vec3.lerp(this.velocity, [0, 0, 0], 0.1)

    // Make particle smaller and smaller
    if (vec3.magnitude(this.velocity) < 0.01) {
      this.isDead = true
    }
  }

  draw () {
    render.drawBillboard({
      texture: assets.textures['uv_marble_' + this.type] ?? assets.textures.square,
      position: this.position,
      scale: 0.03,
      unshaded: true,
    })
  }
}
