import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as render from './renderer.js'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import * as game from 'game'
import Thing from 'thing'
import { assets } from 'game'


export default class Structure extends Thing {
  time = 0
  turnsAlive = 0

  constructor (mesh, texture, position, angle) {
    super()

    this.mesh = mesh;
    this.texture = texture;
    this.position = [...(position ?? [0, 0, 0])];
    this.angle = angle ?? 0;
    this.scale = 1.0

    const meshData = game.assets.meshes[this.mesh];
    this.meshTriangles = []
    for (let t = 0; t < meshData.verts.length; t += 8) {
      this.meshTriangles.push(Array.from(meshData.verts.slice(t, t + 8)));
    }
  }

  update () {
    // super.update()

    if (this.isShrinking) {
      this.scale -= 0.1
      if (this.scale <= 0) {
        this.isDead = true;
      }
    }
    

    this.time ++
  }

  shrink() {
    const ph = game.getThing('table').physicsHandler;
    if (ph) {
      ph.removeStructure(this);
    }
    this.isShrinking = true;
  }

  kill() {
    this.isDead = true;
    const ph = game.getThing('table').physicsHandler;
    if (ph) {
      ph.removeStructure(this);
    }
  }

  draw () {
    // Don't render if destroyed
    if (this.destroyed) {
      return;
    }

    // Mesh
    let rMesh = assets.meshes[this.mesh] ?? assets.meshes.cube;

    // Texture
    let rTexture = assets.textures[this.texture] ?? assets.textures.square;

    // Position
    let rPos = this.position;

    // Rotation
    let rRot = [0, 0, this.angle];

    // Scale
    let rScale = this.scale ?? 1;

    // Color
    let rColor = [1, 1, 1, 1];

    // Glow
    let rGlow = 0.0;
    render.drawMesh({
      mesh: rMesh,
      texture: rTexture,
      position: rPos,
      rotation: rRot,
      scale: rScale,
      color: rColor,
    })
  }
}

