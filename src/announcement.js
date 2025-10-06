import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import Thing from 'thing'
import drawText from './text.js'

export default class Announcement extends Thing {
  time = 0
  position = [0, 0]
  depth = 2000

  constructor(text, fontSize=70, lingerTimeSeconds = 4) {
    super();
    this.text = text;
    this.middlePos = [0, 0];
    this.position = [-2000, 0];
    this.endPos = [2000, 0];
    this.fontSize = fontSize;
    this.lingerTimeSeconds = lingerTimeSeconds;
  }

  update() {
    this.time ++

    if (this.time < this.lingerTimeSeconds * 60) {
      this.position = vec2.lerp(this.position, this.middlePos, 0.06)
    }
    else {
      this.position = vec2.lerp(this.position, this.endPos, 0.06)
      if (vec2.distance(this.position, this.endPos) < 40) {
        this.isDead = true;
      }
      if (this.time > this.lingerTimeSeconds * 2 * 60) {
        this.isDead = true
      }
    }
  }

  draw() {
    drawText(
      this.text,
      this.fontSize, 'yellow', this.position, [0, 0]
    )
  }
}
