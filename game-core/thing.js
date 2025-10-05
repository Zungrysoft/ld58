/** @module thing */

import * as u from './utils.js'
import * as game from './game.js'

/**
 * Class representing a game Thing.
 * Things make up the functionality of a game.
 */
class Thing {
  /**
   * Thing's image to render on the 2D canvas, if a sprite is given.
   * @type {object|null}
   * @default null
   */
  sprite = null

  /**
   * The rotation of this Thing's sprite on the 2D canvas, clockwise in radians.
   * @type {number}
   * @default 0
   */
  rotation = 0

  /**
   * The scale of this Thing's sprite on the 2D canvas. 2D vector in the x and y dimension.
   * @type {number[]}
   * @default [1, 1]
   */
  scale = [1, 1]

  /**
   * The depth of this Thing in the Scene.
   * Things are drawn in ascending depth order.
   * Therefore Things with lower depth will be drawn before Things with higher depth.
   * @default 0
   */
  depth = 0

  /**
   * The position of this Thing. Can be 2D or 3D.
   * @type {number[]}
   * @default [0, 0]
   */
  position = [0, 0]

  /**
   * The velocity of this Thing. Can be 2D or 3D.
   * @type {number[]}
   * @default [0, 0]
   */
  velocity = [0, 0]

  /**
   * The AABB of this Thing. Can be 2D (4 elements) or 3D (6 elements).
   * @type {number[]}
   * @default [-32, -32, 32, 32]
   */
  aabb = [-32, -32, 32, 32]

  /**
   * What directions this Thing came into contact with a solid when moving using its default 2D move() function.
   * @type {{ left: false, right: false, up: false, down: false }}
   * @default { left: false, right: false, up: false, down: false }
   */
  contactDirections = {
    left: false,
    right: false,
    up: false,
    down: false
  }

  /**
   * Whether other Things can overlap AABBs with this Thing.
   * @type {boolean}
   * @default true
   */
  isOverlapEnabled = true

  /**
   * Whether other Things can move through me with their default 2D move() function.
   * @type {boolean}
   * @default false
   */
  isSolid = false

  /**
   * How far back this Thing should be pushed to resolve a collision using its default 2D move() function.
   * @type {number}
   * @default 0.0001
   */
  movementPushback = 0.0001

  /**
   * Animation definitions for this Thing's 2D sprite.
   * By default there is one 'idle' animation definition in the animations object.
   * When animating, a Thing's sprite is used as an animation strip with 64x64 pixel frames.
   * An animation object is defined by a list of frames, a speed, and a frameSize.
   * @type {object}
   * @default { idle: { frames: [0], speed: 0, frameSize: 64 } }
   */
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 64 }
  }

  /**
   * What animation the Thing is currently playing.
   * @type {string}
   * @default 'idle'
   */
  animation = 'idle'

  /**
   * What animation the Thing was last playing.
     @private
   * @type {string}
   * @default 'idle'
   */
  #lastAnimation = 'idle'

  /**
   * How far through the animation this Thing is.
   * @type {number}
   * @default 0
   */
  animationIndex = 0

  /**
   * Object that stores the current timers in this Thing.
   * @private
   * @type {object}
   */
  #timers = {}

  /**
   * Whether this Thing will be persistent between Scenes.
   * @type {boolean}
   * @default false
   */
  isPersistent = false

  /**
   * Whether this Thing will be removed from the Scene this frame.
   * @type {boolean}
   * @default false
   */
  isDead = false

  /**
   * Whether this Thing is paused and cannot update.
   * @type {boolean}
   * @default false
   */
  isPaused = false

  /********************************************************************************
     scene events
  ********************************************************************************/

  /**
   * Update this Thing.
   * This function is called 60 times per second.
   * By default this function calls this.updateTimers(), this.move(), and this.animate() in that order.
   */
  update () {
    this.updateTimers()
    this.move()
    this.animate()
  }

  /**
   * Called before draw(), not in the Scene's Camera2D coordinate frame.
   */
  preDraw () {}

  /**
   * Draw this Thing.
   * This function is called after all Things have been updated, and in the Scene's Camera2D coordinate frame.
   *
   * If the framerate is capped, this function is not called more than 60 times per second, otherwise it may be called more.
   * This function is not guaranteed to be called an exact amount of times per second.
   * By default this function calls this.drawSprite().
   */
  draw () {
    this.drawSprite()
  }

  /**
   * Called after draw(), not in the Scene's Camera2D coordinate frame.
   */
  postDraw () {}

  /**
   * Called when this Thing has been removed from the Scene.
   */
  onDeath () {}

  /**
   * Called when the active Scene is unloaded and swapped with a different Scene.
   */
  onUnload () {}

  /********************************************************************************
     timer handling
  ********************************************************************************/

  setTimer (time, action, name = crypto.randomUUID()) {
    this.#timers[name] = { time, start: time, action }
  }

  getTimerStartingTime (name) {
    if (!this.#timers[name]) return Infinity
    return this.#timers[name].start
  }

  getTimerAction (name) {
    if (!this.#timers[name]) return () => {}
    return this.#timers[name].action
  }

  timerExists (name) {
    return name in this.#timers
  }

  getTimer (name) {
    if (!this.#timers[name]) return 0
    return this.#timers[name].time
  }

  /*
     returns timer progress as a fraction from 0 to 1.
     returns -1 when the timer does not exist
  */
  getTimerFraction (name) {
    if (!this.#timers[name]) return 0
    return 1 - this.#timers[name].time / this.#timers[name].start
  }

  cancelTimer (name) {
    if (this.#timers[name]) {
      delete this.#timers[name]
    }
  }

  updateTimers () {
    for (const [name, value] of Object.entries(this.#timers)) {
      value.time -= 1

      // execute action after deleting timer, in case of timer restart
      if (value.time <= 0) {
        delete this.#timers[name]
        if (typeof value.action === 'function') {
          value.action()
        }
      }
    }
  }

  /********************************************************************************
     basic animation
  ********************************************************************************/

  animate () {
    const anim = this.animations[this.animation] || this.animations.idle

    // option to restart the animation on change
    if (this.animation !== this.#lastAnimation && anim.restart) {
      this.animationIndex = 0
    }
    this.#lastAnimation = this.animation

    this.animationIndex += anim.speed ?? 0

    // option to not repeat the animation
    if (anim.noRepeat) {
      this.animationIndex = Math.min(this.animationIndex, anim.frames.length - 1)
    } else {
      this.animationIndex %= anim.frames.length
    }
  }

  drawSprite (x = this.position[0], y = this.position[1], xOffset = 0, yOffset = 0) {
    const anim = this.animations[this.animation] || this.animations.idle || { frames: [0] }
    const frame = anim.frames[Math.floor(this.animationIndex) % anim.frames.length]
    const { ctx } = game

    ctx.save()
    ctx.translate(x, y)
    if (typeof this.scale === 'number') {
      ctx.scale(this.scale, this.scale)
    } else {
      ctx.scale(...this.scale)
    }
    ctx.rotate(this.rotation)
    ctx.translate(xOffset, yOffset)
    this.drawSpriteFrame(this.sprite, frame, anim.frameSize || 64)
    ctx.restore()
  }

  drawSpriteFrame (sprite, frame = 0, frameSize = 64) {
    if (!sprite) return
    const { ctx } = game
    if (typeof sprite === 'string') {
      sprite = game.assets.images[sprite]
    }
    ctx.translate(-frameSize / 2, -frameSize / 2)
    const framePosition = frame * frameSize
    ctx.drawImage(
      sprite,
      framePosition % sprite.width,
      Math.floor(framePosition / sprite.width) * frameSize,
      frameSize,
      frameSize,
      0,
      0,
      frameSize,
      frameSize
    )
  }

  /********************************************************************************
     movement and collision handling
  ********************************************************************************/

  move (dx = this.velocity[0], dy = this.velocity[1], stepSize = 1) {
    for (const key in this.contactDirections) this.contactDirections[key] = false
    const { sign } = u

    while (Math.round(dx * 1000)) {
      const step = sign(dx) * Math.min(Math.abs(dx), stepSize)
      if (this.checkCollision(this.position[0] + step, this.position[1])) {
        this.velocity[0] = 0
        this.position[0] = Math.round(this.position[0]) - sign(dx) * this.movementPushback
        if (sign(dx) > 0) this.contactDirections.right = true
        if (sign(dx) < 0) this.contactDirections.left = true
        break
      }
      this.position[0] += step
      dx -= step
    }

    while (Math.round(dy * 1000)) {
      const step = sign(dy) * Math.min(Math.abs(dy), stepSize)
      if (this.checkCollision(this.position[0], this.position[1] + step)) {
        this.velocity[1] = 0
        this.position[1] = Math.round(this.position[1]) - sign(dy) * this.movementPushback
        if (sign(dy) > 0) this.contactDirections.down = true
        if (sign(dy) < 0) this.contactDirections.up = true
        break
      }
      this.position[1] += step
      dy -= step
    }
  }

  checkOverlapping (thing, x = this.position[0], y = this.position[1], z = this.position[2]) {
    return (
      thing &&
      thing !== this &&
      thing.isOverlapEnabled &&
      !thing.isDead &&
      u.checkAabbIntersection(
        this.aabb,
        thing.aabb,
        [x, y, z],
        thing.position
      )
    )
  }

  // returns the first Thing that this is overlapping
  getFirstOverlap (x = this.position[0], y = this.position[1], z = this.position[2]) {
    return (
      game.getThingsNearXywh(
        x + this.aabb[0],
        y + this.aabb[1],
        this.aabb[2] - this.aabb[0],
        this.aabb[3] - this.aabb[1]
      ).find(thing => this.checkOverlapping(thing, x, y, z))
    )
  }

  // returns all Things which have overlapping bounding boxes with this thing
  getAllOverlaps (x = this.position[0], y = this.position[1], z = this.position[2]) {
    return (
      game.getThingsNearXywh(
        x + this.aabb[0],
        y + this.aabb[1],
        this.aabb[2] - this.aabb[0],
        this.aabb[3] - this.aabb[1]
      ).filter(thing => this.checkOverlapping(thing, x, y, z))
    )
  }

  // overload me!
  checkCollision (x = this.position[0], y = this.position[1], z = this.position[2]) {
    return this.getFirstOverlap(x, y, z)?.isSolid
  }
}

export default Thing
