import * as game from 'game'
import * as u from 'utils'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { assets } from 'game'
import * as render from './renderer.js'

export default class ShrapnelParticle extends Thing {
  constructor (position) {
    super()
    this.position = [...position]
    this.velocity = this.randomVelocity()
    this.startHeight = position[2]
  }

  randomVelocity() {
    const theta = 2 * Math.PI * Math.random()
    const phi = Math.acos(2 * Math.random() - 1)

    const x = Math.sin(phi) * Math.cos(theta)
    const y = Math.sin(phi) * Math.sin(theta)
    const z = Math.cos(phi)

    let ret = vec3.scale([x, y, z], u.map(Math.random(), 0, 1, 0.01, 0.5))
    if (ret[2] < 0) {
      ret[2] *= -1;
    }

    this.avel = [Math.random() * 0.1, Math.random() * 0.1, 0];
    this.rotation = [Math.random() * Math.PI, Math.random() * Math.PI, 0];

    return ret;
  }s

  update () {
    // Move
    this.position = vec3.add(this.position, this.velocity)

    this.velocity[2] -= 0.012;

    // Drag
    this.velocity = vec3.lerp(this.velocity, [0, 0, 0], 0.04)

    this.rotation = vec3.add(this.rotation, this.avel);

    // Kill particle
    if (this.velocity[2] < 0 && this.position[2] < this.startHeight + 0.2 && Math.random() < 0.4) {
      this.isDead = true
    }
  }

  draw () {
    render.drawMesh({
      mesh: assets.meshes.pyramid,
      texture: assets.textures.square,
      position: this.position,
      rotation: this.rotation,
      color: [0.3, 0.3, 0.3, 1.0],
      scale: 0.12,
      unshaded: false,
    })
  }
}
