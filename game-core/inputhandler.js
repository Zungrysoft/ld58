/** @module inputhandler */

import {
  keysDown,
  mouse,
  gamepads
} from './game.js'

/**
 * A class that makes it more convenient to unify inputs from
 * keyboard, mouse, and controllers.
 */
class InputHandler {
  /**
   * An object that stores input listeners.
   * @type {Object.<string, function>}
   */
  inputs = {}

  /**
   * An object that stores active input listeners.
   * @type {Object.<string, function>}
   */
  active = {}

  /**
   * An object that stores the last active input listeners.
   * @type {Object.<string, function>}
   */
  lastActive = {}

  /**
   * Creates an instance of InputHandler.
   * @constructor
   * @param {Object.<string, function>} [data={}] - An object containing input listeners.
   */
  constructor (data = {}) {
    for (const [name, listener] of Object.entries(data)) {
      this.addInput(name, listener)
    }
  }

  /**
   * Adds an input listener to the `inputs` object.
   * @param {string} name - The name of the input listener.
   * @param {function} listener - The input listener function.
   */
  addInput (name, listener) {
    this.inputs[name] = listener
  }

  /**
   * Updates the `active` and `lastActive` objects with the current input listeners.
   */
  update () {
    // replace last active with active, and empty active
    for (const input in this.lastActive) delete this.lastActive[input]
    for (const input in this.active) {
      this.lastActive[input] = this.active[input]
      delete this.active[input]
    }

    for (const input in this.inputs) {
      const listener = this.inputs[input]
      this.active[input] = listener(keysDown, mouse, gamepads[0])
    }
  }

  /**
   * Returns the current state of an input listener.
   * @param {string} input - The name of the input listener.
   * @returns {boolean} - The current state of the input listener.
   */
  get (input) {
    return this.active[input]
  }

  /**
   * Returns true if an input was just pressed.
   * @param {string} input - The name of the input listener.
   * @returns {boolean} - True if the input was just pressed; otherwise false.
   */
  pressed (input) {
    return this.active[input] && !this.lastActive[input]
  }
}

export default InputHandler
