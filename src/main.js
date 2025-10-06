import * as game from 'game'
import * as gfx from 'webgl'
import Table from './table.js'
import Renderer from './renderer.js'
import Background from './background.js'
import TitleMenu from './menutitle.js'

game.config.width = 900
game.config.height = 540
//game.config.isWebglEnabled = false
document.title = 'Rocky Mountain Marbles'

await game.loadAssets({
  images: {
    background: 'images/bg1.png',
    square: 'images/square.png',
    smoke: 'images/smoke.png',

    uv_deco_mountains: 'images/uv_deco_mountains.png',
    uv_deco_sand: 'images/uv_deco_sand.png',
    uv_deco_dumptruck: 'images/uv_deco_dumptruck.png',

    uv_marble_goal_p1: 'images/uv_marble_goal_p1.png',
    uv_marble_goal_p2: 'images/uv_marble_goal_p2.png',
    uv_marble_bonus: 'images/uv_marble_bonus.png',
    uv_marble_structure_ramp: 'images/uv_marble_structure_ramp.png',
    uv_marble_fire: 'images/uv_marble_fire.png',
    uv_marble_rock: 'images/uv_marble_rock.png',
    uv_marble_shock: 'images/uv_marble_shock.png',
    uv_marble_metal: 'images/uv_marble_metal.png',
  },

  models: {
    cube: 'models/cube.obj',
    sphere: 'models/sphere.obj',
    table1: 'models/table1.obj',
    table_test_1: 'models/table_test_1.obj',
    table_test_2: 'models/table_test_2.obj',
    skybox: 'models/skybox.obj',
    platform: 'models/platform.obj',
    aim: 'models/aim.obj',
    ramp: 'models/ramp.obj',
    pointer: 'models/pointer.obj',

    deco_mountains: 'models/deco_mountains.obj',
    deco_sand: 'models/deco_sand.obj',
    deco_dumptruck: 'models/deco_dumptruck.obj',
    deco_dumptruck_sand: 'models/deco_dumptruck_sand.obj',
    deco_scrap_beams: 'models/deco_scrap_beams.obj',
  },

  sounds: {
    hitMarble: 'sounds/hit_marble.wav',
    hitTable: 'sounds/hit_table.wav',
    place: 'sounds/place.wav',
    pick: 'sounds/pick.wav',

    bad: 'sounds/bad.wav',
    break: 'sounds/break.wav',
    collect: 'sounds/collect.wav',
    explode: 'sounds/explode.wav',
    extra_turn: 'sounds/extra_turn.wav',
    hiss: 'sounds/hiss.wav',
    zap: 'sounds/zap.wav',
    menu: 'sounds/menu.wav',
    menu2: 'sounds/menu2.wav',
    transform: 'sounds/transform.wav',
    victory: 'sounds/victory.wav',
    defeat: 'sounds/defeat.wav',
    aim: 'sounds/aim.wav',
    switch: 'sounds/switch.wav',
    switch_players: 'sounds/switch_players.wav',
  },

  data: {
    stages: 'data/stages.json',
    stageListSingleplayer: 'data/stagelist_singleplayer.json',
    stageListMultiplayer: 'data/stagelist_multiplayer.json',
    themes: 'data/themes.json',
  },

  shaderSources: {
    shadedVert: 'shaders/shaded.vert',
    shadedFrag: 'shaders/shaded.frag',

    unshadedFrag: 'shaders/unshaded.frag',

    billboardVert: 'shaders/billboard.vert',

    screenVert: 'shaders/screen.vert',
    screenFrag: 'shaders/screen.frag',
  },
})

const { assets } = game
assets.shaders = {
  shaded: gfx.createShader(
    assets.shaderSources.shadedVert,
    assets.shaderSources.shadedFrag
  ),
  unshaded: gfx.createShader(
    assets.shaderSources.shadedVert,
    assets.shaderSources.unshadedFrag
  ),
  billboard: gfx.createShader(
    assets.shaderSources.billboardVert,
    assets.shaderSources.unshadedFrag
  ),
  screen: gfx.createShader(
    assets.shaderSources.screenVert,
    assets.shaderSources.screenFrag
  ),
}

assets.textures = Object.fromEntries(
  Object.entries(assets.images).map(([name, image]) => [
    name, gfx.createTexture(image)
  ])
)

assets.meshes = Object.fromEntries(
  Object.entries(assets.models).map(([name, model]) => [
    name, gfx.createMesh(model)
  ])
)

game.globals.framebuffer = gfx.createFramebufferWithDepth()
game.globals.framebufferUnshaded = gfx.createFramebufferWithDepth()

game.setScene(() => {
  const testLevel = "level1";
  const levelData = game.assets.data.stages[testLevel];

  game.addThing(new Renderer())
  game.addThing(new Background())
  game.addThing(new TitleMenu())
  // game.addThing(new Table(levelData))
})
