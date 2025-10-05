import * as game from 'game'
import * as u from 'utils'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { assets } from 'game'
import * as render from './renderer.js'

export default class SparkParticle extends Thing {
  constructor (position) {
    super()
    this.position = [...position]
    this.velocity = this.randomVelocity()
  }

  randomVelocity() {
    const theta = 2 * Math.PI * Math.random()
    const phi = Math.acos(2 * Math.random() - 1)

    const x = Math.sin(phi) * Math.cos(theta)
    const y = Math.sin(phi) * Math.sin(theta)
    const z = Math.cos(phi)

    let ret = vec3.scale([x, y, z], u.map(Math.random(), 0, 1, 0.01, 0.2))
    if (ret[2] < 0) {
      ret[2] *= -1;
    }

    return ret;
  }

  update () {
    // Move
    this.position = vec3.add(this.position, this.velocity)

    this.velocity[2] -= 0.004;

    // Drag
    this.velocity = vec3.lerp(this.velocity, [0, 0, 0], 0.04)

    // Make particle smaller and smaller
    if (vec3.magnitude(this.velocity) < 0.1) {
      this.isDead = true
    }
  }

  draw () {
    render.drawBillboard({
      texture: assets.textures.square,
      position: this.position,
      color: [1.0, 0.8, 0.0, 1.0],
      scale: 0.03,
      unshaded: true,
    })
  }
}
