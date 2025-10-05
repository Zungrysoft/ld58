import * as game from 'game'
import * as u from 'utils'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { assets } from 'game'
import * as render from './renderer.js'

export default class SmokeParticle extends Thing {
  time = 0

  constructor (position, scale = 1.0) {
    super()

    this.position = [...position];
    this.scale = (Math.random() * 0.04 + 0.2) * scale
    this.alpha = 2;
    
  }

  update () {
    this.time ++
    this.position[2] += 0.01;
    if (this.time > 20) {
      this.scale -= 0.01
    }
    if (this.scale <= 0) {
      this.isDead = true
    }
  }

  draw () {
    render.drawBillboard({
      texture: assets.textures.smoke,
      position: this.position,
      color: [0.3, 0.3, 0.3, 1.0],
      scale: this.scale,
      unshaded: false,
    })
  }
}
