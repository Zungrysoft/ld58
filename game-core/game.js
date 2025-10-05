/* global requestAnimationFrame, Image, Audio */
/** @module game */

import Scene from './scene.js'
import * as u from './utils.js'
import * as soundmanager from './soundmanager.js'
import * as gfx from './webgl.js'

/**
 * An object for global variables in the game.
 * To be used by the user to add custom global variables shared by all Things and Scenes in the game.
 */
export const globals = {}

/**
 * An object for global assets in the game.
 * Assets loaded by loadAssets() get stored in this object.
 */
export const assets = {}

/**
 * An object for global config settings in the game.
 * @namespace config
 */
export const config = {
  /** The width of the game, in pixels. Can be changed at runtime. */
  width: 1280,
  /** The height of the game, in pixels. Can be changed at runtime. */
  height: 720,
  /** Determine if WebGL is enabled. Cannot be changed at runtime. */
  isWebglEnabled: true,
  /** The amount of dropped frames the game can recover at once. Can be changed at runtime. */
  catchupFrames: 5,
  /**
   * Whether the game prevent the player from leaving from CTRL-W or clicking X.
   * Can be helpful to leave as false during development to make refreshing the game's page easier.
   * Useful to leave Can be changed at runtime.
   */
  preventLeave: false,
  /** Whether the game can render more than 60 times per second. Can be changed at runtime. */
  isFramerateUncapped: false
}

/** A list of the currently active gamepads. */
export const gamepads = []
/** An object in which the keys are the keys on the keyboard currently held down. */
export const keysDown = {}
/** An object in which the keys are the keys on the keyboard that were held down last frame. */
export const lastKeysDown = {}
/** An object in which the keys are the keys on the keyboard that were just pressed this frame. */
export const keysPressed = {}

/**
 * An object for reasoning about the player's mouse.
 * @namespace mouse
 */
export const mouse = {
  /** The position of the player's mouse in pixels on the game's canvas. */
  position: [0, 0],
  /** The delta between the player's mouse position this frame and last frame. */
  delta: [0, 0],
  /** The amount the player scrolled in both the X and Y directions this frame. */
  scrollDelta: [0, 0],
  /** Whether the left mouse button is currently held down. */
  leftButton: false,
  /** Whether the left mouse button was clicked this frame. */
  leftClick: false,
  /** Whether the right mouse button is currently held down. */
  rightButton: false,
  /** Whether the right mouse button was clicked this frame. */
  rightClick: false,

  /**
   * Locks the mouse pointer on the canvas.
   * Will only work after the player has performed an input in the game already.
   */
  lock () {
    document.querySelector('#canvas2d').requestPointerLock({ unadjustedMovement: true })
  },

  /** Unlocks the mouse pointer from the canvas. */
  unlock () {
    document.exitPointerLock()
  },

  /**
   * Checks whether the player's mouse is locked.
   * @returns {bool} whether the mouse is locked.
   */
  isLocked () {
    return Boolean(document.pointerLockElement)
  },

  /**
   * Sets the style of the player's mouse pointer.
   * Shortcut for document.body.style.cursor = style.
   *
   * @param {string} style - The new CSS style for the mouse pointer.
   */
  setStyle (style = 'default') {
    document.body.style.cursor = style
  },

  /**
   * Returns the mouse's current CSS style
   * @returns {string} The mouse pointer's current CSS style.
   */
  getStyle () {
    return document.body.style.cursor
  }
}

// engine internal variables
let scene
let nextScene
let lastScene
let previousFrameTime = null
let accumulator = 0
let frameCount = 0
let isFocused = true
let requestedAnimationFrame = false
let frameRate = 0
let updateSpeed = 1
let impactFrameCount = 0
let gameTime = 0
let startGameTime

// canvas setup
const canvasStyle = `
position: absolute;
object-fit: contain;
image-rendering: pixelated;
width: 100vw;
height: 100vh;
`
const backgroundCanvas = document.createElement('canvas')
backgroundCanvas.width = config.width
backgroundCanvas.height = config.height
backgroundCanvas.id = 'backgroundCanvas'
backgroundCanvas.style = canvasStyle
document.body.appendChild(backgroundCanvas)
const backgroundCtx = backgroundCanvas.getContext('2d')
backgroundCtx.fillStyle = 'black'
backgroundCtx.fillRect(0, 0, config.width, config.height)

/**
 * The game's 3D canvas.
 * This canvas renders all WebGL calls and is layered behind the 2D canvas.
 * It is recommended to use the `webgl` module to draw graphics to this canvas.
 */
export const canvas3d = document.createElement('canvas')
canvas3d.width = config.width
canvas3d.height = config.height
canvas3d.id = 'canvas3d'
canvas3d.style = canvasStyle
document.body.appendChild(canvas3d)

/**
 * The game's 2D canvas.
 * This canvas is layered on top of the 3D canvas.
 * It is recommended to use the `ctx` variable exported from `game` to draw using HTML's 2D canvas API.
 */
export const canvas2d = document.createElement('canvas')
canvas2d.width = config.width
canvas2d.height = config.height
canvas2d.id = 'canvas2d'
canvas2d.style = canvasStyle
document.body.appendChild(canvas2d)
document.body.style.backgroundColor = '#001'
document.body.style.margin = '0'

/** The game's 2D canvas context. It is recommend to draw to the 2D canvas using this. */
export const ctx = canvas2d.getContext('2d')
ctx.imageSmoothingEnabled = false

/** The game's 3D canvas WebGL context. For use when the `webgl` module doesn't cut it. */
export const gl = canvas3d.getContext('webgl', { antialias: false })
const defaultVertSource = `
attribute vec4 vertexPosition;
attribute vec2 vertexTexture;
attribute vec3 vertexNormal;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying vec2 uv;
varying vec3 normal;
varying vec4 worldPosition;
varying vec4 viewPosition;

void main() {
  normal = (modelMatrix * vec4(vertexNormal.xyz, 1.0)).xyz;
  uv = vertexTexture;
  worldPosition = modelMatrix * vertexPosition;
  viewPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * viewPosition;
}
`
const ext = gl.getExtension('WEBGL_depth_texture');
if (!ext) {
  console.error('WEBGL_depth_texture extension not supported!');
}
const defaultFragSource = `
precision mediump float;

uniform sampler2D texture;
uniform vec4 color;

varying vec2 uv;

void main() {
  vec4 result = texture2D(texture, uv) * color;
  if (result.a == 0.0) { discard; }
  gl_FragColor = result;
}
`

/**
 * The game's simple default shader for 3D rendering.
 *
 * Expects the meshes' vertices to contain 3D position, 2D UVs, and 3D normals.
 * Expects a 4D color uniform.
 */
export const defaultShader = gfx.createShader(defaultVertSource, defaultFragSource)
gfx.setShader(defaultShader)
gfx.set('color', [1, 1, 1, 1])

function frame (frameTime) {
  let delta = previousFrameTime === null ? 0 : (frameTime - previousFrameTime) / 1000
  previousFrameTime = frameTime

  if (!startGameTime) {
    startGameTime = frameTime
  }

  delta *= 60
  if (delta >= 0.98 && delta <= 1.02) {
    delta = 1
  }
  delta *= updateSpeed

  // bypass adding to the accumulator during impact frames
  // so objects don't interpolate weirdly during impacts
  if (impactFrameCount > 0) {
    impactFrameCount -= delta
  } else {
    accumulator += delta
  }

  // make sure we update at 60hz
  let times = 0
  let rerender = false
  while (accumulator >= 1 && times < config.catchupFrames) {
    rerender = update() || rerender
    gameTime = frameTime
    accumulator -= 1
    times += 1
  }
  accumulator %= 1

  if (rerender || config.isFramerateUncapped) {
    draw()
    frameCount += 1
  }

  requestAnimationFrame(frame)
}

function update () {
  handleCanvasResize()
  handleTabbingInAndOut()
  handleSceneChange()

  if (!isFocused) {
    return
  }

  // update keys pressed
  for (const key in keysPressed) delete keysPressed[key]
  for (const key in keysDown) {
    if (!lastKeysDown[key]) keysPressed[key] = true
  }

  if (navigator?.getGamepads) {
    for (const [i, gamepad] of Object.entries(navigator.getGamepads())) {
      gamepads[i] = gamepad
    }
  }

  if (scene) {
    scene.clearScreen()
    scene.update()
  }
  soundmanager.update()

  // update the last keys down
  for (const key in lastKeysDown) delete lastKeysDown[key]
  for (const key in keysDown) lastKeysDown[key] = true
  mouse.leftClick = false
  mouse.rightClick = false
  mouse.delta[0] = 0
  mouse.delta[1] = 0
  mouse.scrollDelta[0] = 0
  mouse.scrollDelta[1] = 0

  // successfully updated, we should rerender
  return true
}

function draw () {
  if (!document.hasFocus()) { return }
  scene?.draw()
}

function loseFocus () {
  for (const key in keysDown) delete keysDown[key]
  for (const sound of Object.values(assets.sounds)) {
    sound.wasPlayingWhenFocused = !sound.paused
    sound.pause()
  }
}

function gainFocus () {
  accumulator = 0
  for (const sound of Object.values(assets.sounds)) {
    if (sound.wasPlayingWhenFocused) {
      sound.play()
    }
  }
}

// handle tabbing in / out of the game
// pause the game and all sound effects when tabbed out
function handleTabbingInAndOut () {
  const focused = document.hasFocus()
  if (!focused && isFocused) {
    loseFocus()
  }
  if (focused && !isFocused) {
    gainFocus()
  }
  isFocused = focused
}

function handleSceneChange () {
  if (!nextScene) return
  if (scene) {
    scene.onUnload()
    const persistent = scene.things.filter(thing => thing.isPersistent)
    const persistentNames = (
      Object.fromEntries(
        Object.entries(scene.namedThings)
          .filter(([_name, thing]) => thing.isPersistent)
      )
    )
    scene = new Scene()
    persistent.forEach(addThing)
    for (const name in persistentNames) {
      scene.namedThings[name] = persistentNames[name]
    }
  } else {
    scene = new Scene()
  }
  nextScene()
  backgroundCtx.fillStyle = 'black'
  backgroundCtx.fillRect(0, 0, config.width, config.height)
  getCamera3D().setUniforms()
  lastScene = nextScene
  nextScene = null
}

// update canvas dimensions if they don't match the config
function handleCanvasResize () {
  if (config.width !== canvas2d.width || config.height !== canvas2d.height) {
    canvas2d.width = config.width
    canvas2d.height = config.height
    canvas3d.width = config.width
    canvas3d.height = config.height
    backgroundCanvas.width = config.width
    backgroundCanvas.height = config.height
    backgroundCtx.fillStyle = 'black'
    backgroundCtx.fillRect(0, 0, config.width, config.height)
    gl.viewport(0, 0, config.width, config.height)
  }
}

/********************************************************************************
   input handling
 ********************************************************************************/

document.onkeydown = (event) => {
  keysDown[event.code] = true
  if (config.preventLeave) {
    event.preventDefault()
    return false
  }
  return true
}

document.onkeyup = (event) => {
  delete keysDown[event.code]
  if (config.preventLeave) {
    event.preventDefault()
    return false
  }
  return true
}

document.onmouseup = (event) => {
  mouse.leftButton = event.buttons & 1
  mouse.rightButton = event.buttons & 2
}

document.onmousedown = (event) => {
  mouse.leftButton = event.buttons & 1
  mouse.leftClick = event.buttons & 1
  mouse.rightButton = event.buttons & 2
  mouse.rightClick = event.buttons & 2
}

document.onwheel = (event) => {
  event.preventDefault()
  mouse.scrollDelta[0] += event.deltaX
  mouse.scrollDelta[1] += event.deltaY
}

window.onbeforeunload = (event) => {
  if (config.preventLeave) {
    event.preventDefault()

    // chrome requires returnValue to be set
    event.returnValue = 'Really want to quit the game?'
  }
}

window.oncontextmenu = (event) => {
  event.preventDefault()
}

canvas2d.onmousemove = (e) => {
  const aspect = Math.min(canvas2d.offsetWidth / config.width, canvas2d.offsetHeight / config.height)
  mouse.position[0] = u.map(
    e.offsetX,
    canvas2d.offsetWidth / 2 - aspect * config.width / 2,
    canvas2d.offsetWidth / 2 + aspect * config.width / 2,
    0,
    config.width,
    true
  )
  mouse.position[1] = u.map(
    e.offsetY,
    canvas2d.offsetHeight / 2 - aspect * config.height / 2,
    canvas2d.offsetHeight / 2 + aspect * config.height / 2,
    0,
    config.height,
    true
  )
  mouse.delta[0] += e.movementX
  mouse.delta[1] += e.movementY
}

/********************************************************************
   scene management
 ********************************************************************/

/**
 * Starts the game if it hasn't already been started.
 * Creates a new new Scene object, and initializes it with the given initialization function.
 *
 * If there was a previously active Scene, it will be swapped out with the new one between this frame and the next frame.
 *
 * @param {function} initFunction - The function that initializes the scene and adds Things to the game.
 */
export function setScene (initFunction) {
  // start the game loop if it hasn't already been started
  if (!requestedAnimationFrame) {
    requestedAnimationFrame = true
    requestAnimationFrame(frame)
    setInterval(() => {
      frameRate = frameCount
      frameCount = 0
    }, 1000)
  }

  if (!initFunction) {
    throw new Error('No function given to setScene!')
  }

  nextScene = initFunction
}

/**
 * Creates a new new Scene object, and initializes it with last given initialization function.
 * If there was a previously active Scene, it will be swapped out with the new one between this frame and the next frame.
 */
export function resetScene () {
  if (!lastScene) {
    throw new Error('No scene has been set yet!')
  }

  nextScene = lastScene
}

/**
 * Load assets into the `game.assets` variable.
 *
 * The argument is an object that contains asset source objects.
 * Asset source objects are objects where each key is the name of the asset, and the value is the path to the asset.
 * Ex: `{ "sword": "images/sword.png" }`
 * The asset source object named "images" will have its asset sources converted into HTML5 Image() objects.
 * The asset source object named "sounds" will have its asset sources converted into HTML5 Audio() objects.
 * The rest of the asset sources will load as text files.
 * When loading assets, this function will display its progress on the game's background canvas.
 *
 * @param {object} assetSources
 */
export async function loadAssets ({ images, sounds, data, ...rest }) {
  handleCanvasResize()
  const loadImage = location => {
    if (location[0] === '#') {
      const image = document.querySelector(location)
      return image
    }
    const image = new Image()
    image.src = location
    return image
  }
  const loadSound = location => {
    if (location[0] === '#') {
      const sound = document.querySelector(location)
      return sound
    }
    const sound = new Audio()
    sound.src = location
    return sound
  }
  const apply = (object, loader) => (
    Object.fromEntries(
      Object.entries(object).map(([name, url]) => [
        name, loader(url)
      ])
    )
  )
  const resolveObject = async (object) => {
    const values = await Promise.all(Object.values(object))
    return Object.fromEntries(
      Object.keys(object).map((name, i) => [name, values[i]])
    )
  }

  backgroundCtx.font = 'italic bold 32px Arial'
  const announce = (text) => {
    backgroundCtx.fillStyle = 'black'
    backgroundCtx.fillRect(0, 0, config.width, config.height)
    backgroundCtx.fillStyle = 'gray'
    backgroundCtx.fillText(text, 64, config.height - 64)
  }

  /* load images into assets.images and wait for them all to load */
  assets.images = {
    ...assets.images,
    ...apply(images, loadImage)
  }
  announce('Loading images...')
  await Promise.all(
    Object.values(assets.images).map(image => (
      new Promise(resolve => {
        if (image.complete) resolve()
        image.onload = () => resolve()
      })
    ))
  )

  /* load sounds into assets.sounds and wait for them all to load */
  assets.sounds = {
    ...assets.sounds,
    ...(await resolveObject(apply(sounds, loadSound)))
  }
  announce('Loading sounds...')
  await Promise.all(
    Object.values(assets.sounds).map(sound => (
      new Promise(resolve => {
        if (sound.complete) resolve()
        sound.oncanplay = () => resolve()
      })
    ))
  )

  // JSON data
  if (data) {
    announce('Loading config data...')
    assets.data = assets.data || {}
    for (const [name, source] of Object.entries(data)) {
      assets.data[name] = await (await fetch(source)).json()
      assets.data[name].assetName = name
    }
  }

  /* all fields not named images or sound are treated as text files */
  for (const field in rest) {
    announce(`Loading ${field}...`)
    assets[field] = assets[field] || {}
    for (const [name, source] of Object.entries(rest[field])) {
      assets[field][name] = (
        source[0] === '#'
          ? document.querySelector(source)
          : (await (await fetch(source)).text())
      )
    }
  }

  announce('Initializing...')
}

/********************************************************************
   thing management
 ********************************************************************/

/**
 * Gets a reference to the Thing in the Scene with the given name.
 *
 * @param {string} name - The name of the Thing.
 * @returns {Thing} The Thing with that name.
 */
export function getThing (name) {
  return scene.namedThings[name]
}

/**
 * Gets the name of the given Thing in the Scene.
 *
 * @param {Thing} thing - The Thing to get the name of.
 * @return {string} The name.
 */
export function getNameOfThing (thing) {
  for (const [name, check] of Object.entries(scene.namedThings)) {
    if (thing === check) {
      return name
    }
  }
}

/**
 * Sets the name of the given Thing to the provided name.
 *
 * @param {Thing} thing - The Thing to set the name of.
 * @param {string} name - The new name of the Thing.
 */
export function setThingName (thing, name) {
  scene.namedThings[name] = thing
}

/**
 * Given a bounding box in the format of x, y, width, height,
 * get a list of all Things near it (not necessarily inside it).
 *
 * @param {x} number - The x position of top-left corner of the bounding box.
 * @param {y} number - The y position of top-left corner of the bounding box.
 * @param {width} number - The width of the bounding box.
 * @param {height} number - The height of the bounding box.
 * @returns {array} The list of Things near the XYWH.
 */
export function getThingsNearXywh (x, y, w, h) {
  return scene.spatialHash.query(x, y, w, h)
}

/**
 * Given a 2D or 3D axis-aligned bounding box and a 2D or 3D position, get a list of all Things inside it.
 *
 * @param {AABB} aabb - The AABB to check.
 * @param {position} position - The position of the AABB.
 * @returns {array} The list of Things in the AABB.
 */
export function getThingsInAabb (aabb, position = [0, 0, 0]) {
  return (
    getThingsNearXywh(...u.aabbToXywh(u.aabb2D(aabb), position))
      .filter(thing => u.checkAabbIntersection(aabb, thing.aabb, position, thing.position))
  )
}

/**
 * Get a list of all Things in the current Scene.
 *
 * @returns {array} The Things in the Scene.
 */
export function getThings () {
  return scene.things
}

/**
 * Add a Thing to the current Scene.
 *
 * @param {Thing} thing - The Thing to add to the Scene.
 * @returns {Thing} The added Thing.
 */
export function addThing (thing) {
  return scene.addThing(thing)
}

/********************************************************************
   getters
 ********************************************************************/

/**
 * Get the 2D camera used to draw the Scene.
 *
 * @returns {object} The Scene's 2D camera.
 */
export function getCamera2D () {
  return scene.camera2D
}

/**
 * Get the 3D camera used to draw the Scene.
 *
 * @returns {object} The Scene's 3D camera.
 */
export function getCamera3D () {
  return scene.camera3D
}

/**
 * Get the game's current real framerate.
 *
 * @returns {number} The current framerate.
 */
export function getFramerate () {
  return frameRate
}

/**
 * Get a fraction between zero and one representing time between this update and the next update.
 * If the value is 0.75, that means the game's last update was 75% of a frame ago.
 *
 * Only works when config.isFramerateUncapped = true.
 * This function is used for interpolated rendering at high framerates.
 *
 * @returns {number} The current framerate.
 */
export function getInterpolation () {
  return (
    config.isFramerateUncapped
      ? u.clamp(accumulator % 1, 0, 1)
      : 1
  )
}

/**
 * Get the time in seconds since the game was started.
 *
 * @returns {number} The time in seconds.
 */
export function getTime () {
  return (gameTime - startGameTime) / 1000
}

/********************************************************************
   juice
 ********************************************************************/

/**
 * Sets the update speed of the game.
 *
 * @param {number} speed - A coefficient determining how much the game should speed up or slow down.
 */
export function setUpdateSpeed (speed = 1) {
  updateSpeed = speed
}

/**
 * Shakes the screen on the 2D canvas.
 *
 * @param {number} amount - How long the shake should last, in frames.
 * @param {number} strength - How strong the shake should be, in pixels.
 */
export function setScreenShake (amount = 6, strength = 2) {
  scene.screenShakes.push({
    vector: [0, 0],
    amount,
    strength
  })
}

/**
 * Set impact frames.
 * These are frames where the game temporarily pauses, to show impact on heavy actions.
 *
 * @param {number} frames - How long the impact should last, in frames.
 */
export function setImpactFrames (frames = 1) {
  impactFrameCount = frames
}
