import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as render from './renderer.js'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import * as themes from './themes.js'
import * as game from 'game'
import Thing from 'thing'
import { assets } from 'game'

const MENU_VIEW_DISTANCE = 2;
const MENU_VIEW_POSITION = [0, 0, 0];
const MENU_VIEW_ANGLE = [Math.PI*(4/8), Math.PI*(-2/8)];
const MENU_SPIN_RATE = -0.003;

export default class Background extends Thing {
  time = 0;
  viewDistance = MENU_VIEW_DISTANCE;
  viewDistanceTarget = MENU_VIEW_DISTANCE;
  viewDistanceTargetShooting = MENU_VIEW_DISTANCE;
  viewPosition = MENU_VIEW_POSITION;
  viewPositionTarget = MENU_VIEW_POSITION;
  viewPositionTargetShooting = MENU_VIEW_POSITION;
  viewAngle = MENU_VIEW_ANGLE;
  viewAngleTarget = MENU_VIEW_ANGLE;

  zoomedCamera = false;

  constructor() {
    super()

    this.theme = 'mountains';
    game.setThingName(this, 'background');

    
  }

  setupCamera(config) {
    // this.viewDistance = config.cameraDistance + 0.1;
    // this.viewDistanceTarget = this.viewDistance;
    // this.viewDistanceTargetShooting = config.shootCameraDistance;

    // this.viewPosition = [...config.cameraPosition];
    // this.viewPositionTarget = [...this.viewPosition];
    // this.viewPositionTargetShooting = [...this.viewPosition];

    // this.viewAngle = config.cameraStartAngle.map(x => Math.PI*(x/8))
    // this.viewAngleTarget = [...this.viewAngle]

    this.viewDistanceTarget = config.cameraDistance + 0.1;
    this.viewDistanceTargetShooting = config.shootCameraDistance;

    this.viewPositionTarget = [...config.cameraPosition];
    this.viewPositionTargetShooting = [...config.cameraPosition];

    this.viewAngleTarget = config.cameraStartAngle.map(x => Math.PI*(x/8))
  }

  update() {
    this.time ++;

    const table = game.getThing('table')
    if (table) {
      this.setTheme(table.theme);

      this.updateCameraGame();
    }
    else {
      this.updateCameraMenu();
    }

    themes.spawnParticle(this.theme);
  }

  setTheme(theme) {
    if (this.theme !== theme) {
      game.getThings().filter(x => x.isThemeParticle).forEach(x => x.isDead = true);
      this.theme = theme;
    }
  }

  isShootingCamera() {
    return this.zoomedCamera && ['shooting', 'shot'].includes(game.getThing('table')?.phase);
  }

  updateCamera() {
    // Set up 3D camera
    const cam = game.getCamera3D()

    // Set up clip plane
    cam.near = 0.1;
    cam.far = 1000;

    const viewDistanceTarget = this.zoomedCamera ? this.viewDistanceTarget - 2 : this.viewDistanceTarget;
    this.viewAngleTarget[1] = u.clamp(this.viewAngleTarget[1], 0, Math.PI/2);
    this.viewAngle = vec2.lerp(this.viewAngle, this.viewAngleTarget, 0.2);
    this.viewPosition = vec3.lerp(this.viewPosition, this.isShootingCamera() ? this.viewPositionTargetShooting : this.viewPositionTarget, 0.1)
    this.viewDistance = u.lerp(this.viewDistance, this.isShootingCamera() ? this.viewDistanceTargetShooting : viewDistanceTarget, 0.1)

    const offsetPosition = [
      Math.cos(this.viewAngle[0]) * Math.cos(this.viewAngle[1]) * this.viewDistance,
      Math.sin(this.viewAngle[0]) * Math.cos(this.viewAngle[1]) * this.viewDistance,
      Math.sin(this.viewAngle[1]) * this.viewDistance + 1,
    ]
    cam.position = vec3.add(offsetPosition, this.viewPosition)
    cam.lookVector = vec3.invert(vec3.anglesToVector(this.viewAngle[0], this.viewAngle[1]))
    cam.updateMatrices()
  }

  updateCameraGame() {
    // Camera controls
    if (game.keysPressed.ArrowRight || game.keysPressed.KeyD) {
      this.viewAngleTarget[0] -= Math.PI/4;
    }
    if (game.keysPressed.ArrowLeft || game.keysPressed.KeyA) {
      this.viewAngleTarget[0] += Math.PI/4;
    }
    if (game.keysPressed.ArrowUp || game.keysPressed.KeyW) {
      this.viewAngleTarget[1] += Math.PI/8;
    }
    if (game.keysPressed.ArrowDown || game.keysPressed.KeyS) {
      this.viewAngleTarget[1] -= Math.PI/8;
    }
    if (game.keysPressed.KeyQ || game.keysPressed.Space) {
      this.zoomedCamera = !this.zoomedCamera;
      soundmanager.playSound('switch', 1.0, 0.9);
    }

    this.updateCamera();
  }

  updateCameraMenu() {
    this.viewAngleTarget[0] += MENU_SPIN_RATE;
    this.viewAngleTarget[1] = MENU_VIEW_ANGLE[1];
    this.viewPositionTarget = MENU_VIEW_POSITION;
    this.viewDistanceTarget = MENU_VIEW_DISTANCE;

    this.updateCamera();
  }

  draw() {
    // Skybox
    const fogDistance = themes.getTheme(this.theme).fogDistance
    render.drawMesh({
      mesh: assets.meshes.skybox,
      texture: assets.textures.square,
      position: game.getCamera3D().position,
      scale: [
        fogDistance * -3,
        fogDistance * -3,
        fogDistance * -3,
      ],
    })

    // Theme props
    for (const prop of themes.getTheme(this.theme).props) {
      render.drawMesh({
        mesh: assets.meshes[prop.mesh],
        texture: assets.textures[prop.texture],
        position: [0, 0, 0],
        color: prop.textureColor || [1, 1, 1, 1]
      })
    }
  }
}

