import * as render from './renderer.js'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { assets } from 'game'
import { getMarbleScale, getMarbleUnshaded } from './marble.js'


export default class CollectedMarble extends Thing {
  time = 0

  constructor (type, mode) {
    super()

    this.type = type ?? 'basic';

    if (mode === 'victory') {
      this.position = [
        -6 + Math.random()*12,
        -10.4,
        -6.7,
      ]
      this.velocity = [
        -0.04 + Math.random()*0.08,
        0,
        0.6 + Math.random() * 0.08,
      ]
    }
    else if (mode === 'defeat') {
      this.position = [
        -6 + Math.random()*12,
        -10.4,
        6.7,
      ]
      this.velocity = [
        -0.02 + Math.random()*0.04,
        0,
        0,
      ]
    }
    else {
      this.position = [
        -6 + Math.random()*3,
        -10.4,
        -6.7,
      ]
      this.velocity = [
        -0.04 - Math.random()*0.04,
        0,
        0.6 + Math.random() * 0.08,
      ]
    }
    

    this.rotation = [Math.random() * Math.PI, Math.random() * Math.PI, 0];
    this.avel = [Math.random() * 0.04, Math.random() * 0.04, 0];
  }

  update () {
    this.time ++

    this.velocity[2] -= 0.02;

    this.position = vec3.add(this.position, this.velocity);

    this.rotation = vec3.add(this.rotation, this.avel);

    if (this.position[2] < -50) {
      this.isDead = true;
    }
  }

  draw () {
    render.drawUIMesh({
      mesh: assets.meshes.sphere,
      texture: assets.textures['uv_marble_' + this.type] ?? assets.textures.square,
      position: this.position,
      scale: 2 * getMarbleScale(this.type),
      rotation: this.rotation,
      unshaded: getMarbleUnshaded(this.type),
    })
  }
}

