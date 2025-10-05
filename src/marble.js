import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as render from './renderer.js'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import * as game from 'game'
import Thing from 'thing'
import { assets } from 'game'
import Structure from './structure.js'
import PaintParticle from './particlepaint.js'


export default class Marble extends Thing {
  time = 0
  tableTouchTime = 999999

  constructor (type, position, velocity) {
    super()

    this.type = type ?? 'basic';

    this.density = 1.0;
    this.scale = 0.5;
    if (this.type.includes('goal')) {
      this.scale = 0.72;
      this.density = 0.9;
    }
    if (this.type === 'bonus') {
      this.scale = 0.46;
    }
    if (this.type === 'heavy') {
      this.scale = 0.9;
    }
    else if (this.type === 'mega') {
      this.scale = 1.3;
    }

    this.position = [...(position ?? [0, 0, 0])];
    this.position[2] += this.scale * 0.5 + 0.1;
    this.velocity = [...(velocity ?? [0, 0, 0])];

    this.rotation = [0, 0, 0];
  }

  update () {
    // super.update()

    this.time ++
    this.tableTouchTime --;

    if (this.isShot && this.tableTouchTime < 3 && vec3.magnitude(this.velocity) < 0.06) {
      if (this.type.includes('structure_')) {
        let angle = vec2.vectorToAngle(this.velocity);

        this.kill();

        const ph = game.getThing('table').physicsHandler;
        
        const pos = [
          this.position[0],
          this.position[1],
          this.position[2] - (this.scale * 0.5),
        ]
        const ramp = game.addThing(new Structure(this.type.split('_')[1], null, pos, angle))
        ph.addStructure(ramp);

        // Particle effect
        for (let i = 0; i < 20; i ++) {
          game.addThing(new PaintParticle(this.position, [1, 1, 1, 1]))
        }
      }
    }
  }

  kill() {
    this.isDead = true;
    const ph = game.getThing('table').physicsHandler;
    if (ph) {
      ph.removeMarble(this);
    }
  }

  draw () {
    // Don't render if destroyed
    if (this.destroyed) {
      return
    }

    // Mesh
    let rMesh = assets.meshes.sphere;

    // Texture
    let rTexture = assets.textures['uv_marble_' + this.type] ?? assets.textures.square;

    // Position
    let rPos = this.position;

    // Rotation
    let rRot = this.rotationVis ?? [0, 0, 0]

    // Scale
    let rScale = this.scale ?? 1;

    // Color
    let rColor = [1, 1, 1, 1];

    // Glow
    let rGlow = 0.0

    // Draw the base model
    render.drawMesh({
      mesh: rMesh,
      texture: rTexture,
      position: rPos,
      rotation: rRot,
      scale: rScale,
      color: rColor,
      glow: rGlow,
    })
  }
}

