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
import CollectParticle from './particlecollect.js'
import SmokeParticle from './particlesmoke.js'
import SparkParticle from './particleSpark.js'
import Announcement from './announcement.js'
import ShrapnelParticle from './particleShrapnel.js'

export const MARBLE_STOP_THRESHOLD = 0.04;

export const FIRE_MARBLE_SPEED_THRESHOLD = 1.8;
export const SHOCK_FORCE = 15;
export const SHOCK_RANGE = 3;

export function getMarbleScale(type) {
  if (type.includes('goal')) {
    return 0.72;
  }
  if (type === 'bonus') {
    return 0.5;
  }
  if (type === 'heavy') {
    return 0.9;
  }
  else if (type === 'mega') {
    return 1.3;
  }

  return 0.5;
}

export function getMarbleDensity(type) {
  if (type.includes('goal')) {
    return 1.1;
  }
  if (type.includes('metal')) {
    return 20;
  }
  return 1.0;
}

export function getMarbleUnshaded(type) {
  if (['fire'].includes(type)) {
    return true;
  }
  return false;
}

export default class Marble extends Thing {
  time = 0
  tableTouchTime = 999999

  constructor (type, position, velocity) {
    super()

    this.type = type ?? 'basic';

    this.density = getMarbleDensity(type);
    this.scale = getMarbleScale(type);

    this.position = [...(position ?? [0, 0, 0])];
    this.position[2] += this.scale * 0.5 + 0.1;
    this.velocity = [...(velocity ?? [0, 0, 0])];

    this.rotation = [0, 0, 0];
  }

  getMass() {
    return (4 / 3) * Math.PI * ((this.scale / 2) ** 3) * 15.18 * this.density;
  }

  update () {
    // super.update()

    this.time ++
    this.tableTouchTime --;

    if (this.position[2] < (game.getThing('table')?.collectHeight ?? -5)) {
      this.collect();
    }

    if (this.isShot && this.tableTouchTime < 3 && vec3.magnitude(this.velocity) < MARBLE_STOP_THRESHOLD * 2) {
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

        soundmanager.playSound('transform', 1, 0.7);

        game.getThing('table').setWaitUntilEndOfShot(60);
      }
    }

    if (this.isOnFire()) {
      if (Math.random() < 0.2) {
        game.addThing(new SmokeParticle(this.position))
      }
      if (Math.random() < 0.6) {
        game.addThing(new SparkParticle(this.position))
      }
    }

    if (this.isMarkedForDeath) {
      this.kill();
    }
  }

  isOnFire() {
    return this.type === 'fire' && this.isSpeedy();
  }

  isSpeedy() {
    return vec3.magnitude(this.velocity) > FIRE_MARBLE_SPEED_THRESHOLD;
  }

  burnUp() {
    if (!(this.type.includes('goal'))) {
      for (let i = 0; i < 20; i ++) {
        game.addThing(new SparkParticle(this.position))
      }
      for (let i = 0; i < 5; i ++) {
        const radius = this.scale * 0.9;
        const smokePos = [
          Math.random() * radius * 2 - radius,
          Math.random() * radius * 2 - radius,
          Math.random() * radius * 2 - radius,
        ]
        game.addThing(new SmokeParticle(vec3.add(this.position, smokePos), 2))
      }
      this.isMarkedForDeath = true;

      soundmanager.playSound('hiss', 1, 1);
    }
  }

  sendShockWave() {
    this.isMarkedForDeath = true;
    const ph = game.getThing('table').physicsHandler;

    soundmanager.playSound('explode', 1, 1);

    // Send other marbles away
    for (const marble of game.getThings().filter(x => x instanceof Marble)) {
      let dist = vec3.magnitude(vec3.subtract(this.position, marble.position))
      if (dist < SHOCK_RANGE) {
        const impulseForce = u.map(dist, 0, SHOCK_RANGE, SHOCK_FORCE, 0, true);
        const impulseDirection = vec3.normalize(vec3.subtract(marble.position, this.position));
        const impulse = vec3.scale(impulseDirection, impulseForce);

        ph.applyImpulse(marble, impulse);
      }
    }

    // Particles
    for (let i = 0; i < 22; i ++) {
      const radius = this.scale * 0.9;
      const smokePos = [
        Math.random() * radius * 2 - radius,
        Math.random() * radius * 2 - radius,
        Math.random() * radius * 2 - radius,
      ]
      if (i < 5) {
        game.addThing(new SmokeParticle(vec3.add(this.position, smokePos), 2))
      }
      game.addThing(new ShrapnelParticle(vec3.add(this.position, smokePos)))
    }
  }

  collect() {
    const table = game.getThing('table');
    this.isDead = true;

    if (this.isShot) {
      soundmanager.playSound('bad', 1, 1);
    }
    else {
      if (this.type === 'bonus' && !table.gotExtraMove) {
        soundmanager.playSound('extra_turn', 1, 1);
        table.movesLeft ++;
        table.gotExtraMove = true;
        game.addThing(new Announcement('Bonus Shot!'), 70, 3);
      }
      else {
        soundmanager.playSound('collect', 1, 1);
      }

      if (this.type.includes('goal')) {
        soundmanager.playSound('goal', 1, 1);
      }

      for (let i = 0; i < 15; i ++) {
        game.addThing(new CollectParticle(this.position, this.type))
      }

      game.getThing('table').addMarble(this.type);
    }
    

    this.kill();
  }

  kill() {
    this.isDead = true;
    const ph = game.getThing('table').physicsHandler;
    if (ph) {
      ph.removeMarble(this);
    }
  }

  unfreeze() {
    this.shouldBeFrozen = false;
    if (this.isFrozen) {
      this.isFrozen = false;
      game.getThing('table').physicsHandler.unfreezeMarble(this);
    }
  }

  checkForFreeze() {
    if (this.shouldBeFrozen && !this.isFrozen) {
      this.isFrozen = true;
      game.getThing('table').physicsHandler.freezeMarble(this);
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
    if (this.isFrozen) {
      rTexture = assets.textures['uv_marble_rock'];
    }

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
      unshaded: getMarbleUnshaded(this.type) && !this.isFrozen,
    })
  }
}

