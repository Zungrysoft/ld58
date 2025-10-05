import * as game from 'game'
import SandParticle from './particlesand.js'

export function getTheme(theme) {
  return game.assets.data.themes[theme]
}

export function spawnParticle(theme, position) {
  const themeData = getTheme(theme)
  if (Math.random() < themeData.particleRate) {
    if (themeData.particle === "sand") {
      game.addThing(new SandParticle(position))
    }
  }
}
