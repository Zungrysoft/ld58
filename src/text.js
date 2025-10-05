import * as game from 'game'

export default function drawText(text, fontSize=40, color='white', position=[0, 0], align=[0, 0]) {
  const { ctx } = game;
  // Hud scale and text size
  const hs = 0.5

  // Align horizontal
  let textAlign = 'left'
  let finalPosition = [0, 0]
  if (align[0] < 0) {
    finalPosition[0] = Math.round(position[0]*hs)
    textAlign = 'left'
  }
  else if (align[0] > 0) {
    finalPosition[0] = game.config.width - Math.round(position[0]*hs)
    textAlign = 'right'
  }
  else {
    finalPosition[0] = game.config.width/2 + Math.round(position[0]*hs)
    textAlign = 'center'
  }

  // Align vertical
  if (align[1] < 0) {
    finalPosition[1] = Math.round(position[1]*hs)
  }
  else if (align[1] > 0) {
    finalPosition[1] = game.config.height - Math.round(position[1]*hs)
  }
  else {
    finalPosition[1] = game.config.height/2 + Math.round(position[1]*hs)
  }

  // Font size
  const adjustedFontSize = Math.round(fontSize * hs)

  // Shadow spacing
  const shadowSpacing = Math.ceil((fontSize * hs) / 30);

  // Render
  ctx.save()
  ctx.translate(...finalPosition)
  ctx.font = `italic ${adjustedFontSize}px Verdana`
  const str = text
  ctx.textAlign = textAlign
  ctx.fillStyle = 'black'
  ctx.fillText(str, 0, 0)
  ctx.fillStyle = color
  ctx.fillText(str, shadowSpacing, -shadowSpacing)
  ctx.restore()
}