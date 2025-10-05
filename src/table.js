import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as mat from 'matrices'
import * as render from './renderer.js'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import * as themes from './themes.js'
import Thing from 'thing'
import { assets } from 'game'
import Marble, { getMarbleScale, getMarbleUnshaded, MARBLE_STOP_THRESHOLD } from './marble.js'
import MarblePhysicsHandler from './physics.js'
import Structure from './structure.js'
import CollectParticle from './particlecollect.js'
import CollectedMarble from './collectedmarble.js'

const SHOOT_TIME = 55;
const MAX_SHOOT_POWER = 25;

const COLLECTION_ANIMATION_DURATION = 14;

export default class Table extends Thing {
  time = 0
  errorTime = 0
  viewDistance = 4
  viewPosition = [0, 0, 0]
  inventoryP1 = []
  inventoryP2 = []
  inventoryQueueP1 = []
  inventoryQueueP2 = []
  phase = 'picking'
  shootingPlatform = null
  shootingMarble = null
  shootPower = 0
  phaseTime = 0
  inventoryTrayPosition = 0
  inventoryTrayMarbleHeights = []
  inventoryTrayMarbleCollectionTimers = []
  depth = 300
  pickedMarbleIndex = 0
  waitUntilEndOfShot = 0
  activePlayer = 'p1'
  playerWin = null
  winFromRunOut = false
  victoryTime = 0

  constructor (levelData) {
    super()
    game.setThingName(this, 'table')

    this.isSingleplayer = levelData.isSingleplayer;
    this.title = levelData.title;
    this.mesh = levelData.stageMesh;
    this.texture = levelData.stageTexture;
    this.theme = levelData.theme;
    this.shootZones = levelData.shootZones;
    this.marbleCollectHeight = levelData.marbleCollectHeight;
    this.inventoryP1 = [...levelData.marbleCollection];
    this.inventoryP2 = this.isSingleplayer ? [...levelData.aiMarbleCollection] : [...levelData.marbleCollection];

    for (const marble of levelData.marbles) {
      game.addThing(new Marble(marble.type, [...marble.position]));
      if (levelData.marbleSymmetry) {
        let mirrorPosition;

        if (levelData.marbleSymmetry === 'rotate') {
          if (marble.position[0] === 0 && marble.position[1] === 0) {
            continue;
          }

          mirrorPosition = [
            -marble.position[0],
            -marble.position[1],
            marble.position[2],
          ];
        }
        else if (levelData.marbleSymmetry === 'mirror') {
          if (marble.position[1] === 0) {
            continue;
          }

          mirrorPosition = [
            marble.position[0],
            -marble.position[1],
            marble.position[2],
          ];
        }
        else {
          continue;
        }
        
        let mirrorType = marble.type;
        if (mirrorType.includes('p1')) {
          mirrorType = mirrorType.replace('p1', 'p2')
        }
        else if (mirrorType.includes('p2')) {
          mirrorType = mirrorType.replace('p2', 'p1')
        }
        game.addThing(new Marble(mirrorType, mirrorPosition));
      }
    }

    const meshData = game.assets.meshes[this.mesh];
    this.meshVerts = []
    for (let t = 0; t < meshData.verts.length; t += 8) {
      this.meshVerts.push(Array.from(meshData.verts.slice(t, t + 8)));
    }

    // Set up camera based on level params
    this.setupCamera(levelData)

    // Physics setup
    this.physicsHandler = new MarblePhysicsHandler(this.meshVerts)
    for (const thing of game.getThings().filter(x => x instanceof Marble)) {
      this.physicsHandler.addMarble(thing)
    }
  }

  setupCamera(config) {
    this.viewDistance = config.cameraDistance + 0.1;
    this.viewDistanceTarget = this.viewDistance;
    this.viewDistanceTargetShooting = config.shootCameraDistance;

    this.viewPosition = [...config.cameraPosition];
    this.viewPositionTarget = [...this.viewPosition];
    this.viewPositionTargetShooting = [...this.viewPosition];

    this.viewAngle = config.cameraStartAngle.map(x => Math.PI*(x/8))
    this.viewAngleTarget = [...this.viewAngle]
  }

  isShootingCamera() {
    return ['shooting', 'shot'].includes(this.phase);
  }

  updateCamera() {
    // Set up 3D camera
    const cam = game.getCamera3D()

    // Set up clip plane
    cam.near = 0.1
    cam.far = 1000

    const offsetPosition = [
      Math.cos(this.viewAngle[0]) * Math.cos(this.viewAngle[1]) * this.viewDistance,
      Math.sin(this.viewAngle[0]) * Math.cos(this.viewAngle[1]) * this.viewDistance,
      Math.sin(this.viewAngle[1]) * this.viewDistance + 1,
    ]
    this.viewPosition = vec3.lerp(this.viewPosition, this.isShootingCamera() ? this.viewPositionTargetShooting : this.viewPositionTarget, 0.1)
    this.viewDistance = u.lerp(this.viewDistance, this.isShootingCamera() ? this.viewDistanceTargetShooting : this.viewDistanceTarget, 0.1)
    cam.position = vec3.add(offsetPosition, this.viewPosition)
    cam.lookVector = vec3.invert(vec3.anglesToVector(this.viewAngle[0], this.viewAngle[1]))
    cam.updateMatrices()
  }

  update () {
    // super.update()

    themes.spawnParticle(this.theme);

    this.time ++;
    this.phaseTime ++;
    this.errorTime --;

    const selectedMarble = this.getSelectedMarble();
    const showInventoryTray = this.phase === 'picking';
    this.inventoryTrayPosition = u.lerp(this.inventoryTrayPosition, showInventoryTray ? 0 : -1, 0.2)
    for (let i = 0; i < Math.max(this.inventoryP1.length, this.inventoryP2.length); i ++) {
      this.inventoryTrayMarbleHeights[i] = u.lerp(this.inventoryTrayMarbleHeights[i] ?? 0, i === selectedMarble && this.phase === 'picking' ? 1 : 0, 0.2)

      if (this.phase === 'picking') {
        if (Math.abs(this.inventoryTrayPosition - 0) < 0.03) {
          this.inventoryTrayMarbleCollectionTimers[i] = (this.inventoryTrayMarbleCollectionTimers[i] ?? 0) - 1;
        }
      }
      else {
        this.inventoryTrayMarbleCollectionTimers[i] = 0;
      }
    }

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
    this.viewAngleTarget[1] = u.clamp(this.viewAngleTarget[1], 0, Math.PI/2);
    this.viewAngle = vec2.lerp(this.viewAngle, this.viewAngleTarget, 0.2);
    this.updateCamera();

    // Simulate physics
    this.physicsHandler.simulateStep();

    if (this.phase === 'picking') {
      this.updatePicking();
    }
    else if (this.phase === 'positioning') {
      this.updatePositioning();
    }
    else if (this.phase === 'shooting') {
      this.updateShooting();
    }
    else if (this.phase === 'shot') {
      this.updateShot();
    }
    else if (this.phase === 'victory') {
      this.updateVictory();
    }
  }

  setPhase(phase) {
    this.phaseTime = 0;
    this.phase = phase;
  }

  getActiveInventory() {
    if (this.activePlayer === 'p1') {
      return this.inventoryP1;
    }
    return this.inventoryP2;
  }

  getActiveInventoryQueue() {
    if (this.activePlayer === 'p1') {
      return this.inventoryQueueP1;
    }
    return this.inventoryQueueP2;
  }

  addMarble(type) {
    this.gotMarble = true;
    
    this.getActiveInventoryQueue().push(type);

    if (type === 'goal_p1') {
      this.playerWin = 'p2';
      this.setPhase('victory');
    }
    else if (type === 'goal_p2') {
      this.playerWin = 'p1';
      this.setPhase('victory');
    }
    
    if (this.phase !== 'victory') {
      game.addThing(new CollectedMarble(type));
    }
  }

  deQueueMarbles() {
    while(this.getActiveInventoryQueue().length > 0) {
      this.getActiveInventory().push(this.getActiveInventoryQueue()[0]);
      this.getActiveInventoryQueue().splice(0, 1);
      this.inventoryTrayMarbleCollectionTimers[this.getActiveInventory().length - 1] = COLLECTION_ANIMATION_DURATION;
    }
  }

  getSelectedMarble() {
    const SPACING = 70;
    if (game.mouse.position[1] < (game.config.height - 40) && game.mouse.position[1] > (game.config.height - 120)) {
      return Math.floor((game.mouse.position[0] - 15) / SPACING);
    }
    return -1;
  }

  updatePicking() {
    const selectedMarble = this.getSelectedMarble();
    if (game.mouse.leftClick && selectedMarble < this.getActiveInventory().length && selectedMarble >= 0) {
      this.setPhase('positioning');
      this.pickedMarbleIndex = selectedMarble;
    }
  }

  updatePositioning() {
    if (game.mouse.rightClick) {
      this.setPhase('picking');
      return;
    }

    const cameraPos = game.getCamera3D().position;
    const cameraRay = game.getCamera3D().getMouseRay();

    this.selectedShootPosition = null;
    for (const shootZone of this.shootZones) {
      const pointOnPlane = vec3.pointAtZ(cameraPos, cameraRay, shootZone.height);

      if (vec2.isPointInPolygon(shootZone.polygon, pointOnPlane)) {
        this.selectedShootPosition = pointOnPlane;
        break;
      }
    }

    if (game.mouse.leftClick && this.selectedShootPosition && this.phaseTime > 5) {
      this.setPhase('shooting');
      this.readyToShoot = false; // Wait until player releases LMB before starting shot
      this.shootPower = 0;
      this.viewPositionTargetShooting = this.selectedShootPosition;

      // Add platform and marble
      this.shootingPlatform = game.addThing(new Structure('platform', null, this.selectedShootPosition));
      this.shootingMarble = game.addThing(new Marble(this.getActiveInventory()[this.pickedMarbleIndex], [...this.selectedShootPosition]));
      this.physicsHandler.addStructure(this.shootingPlatform);
      this.physicsHandler.addMarble(this.shootingMarble);
    }
  }

  updateShooting() {
    if (game.mouse.rightClick) {
      if (this.shootPower > 0) {
        this.shootPower = 0;
        this.readyToShoot = false;
      }
      else {
        this.setPhase('positioning');
        this.shootingPlatform.kill();
        this.shootingMarble.kill();
        return;
      }
    }

    const cameraPos = game.getCamera3D().position;
    const cameraRay = game.getCamera3D().getMouseRay();
    this.selectedShootTargetPosition = vec3.pointAtZ(cameraPos, cameraRay, this.selectedShootPosition[2]);

    if (!game.mouse.leftButton) {
      this.readyToShoot = true;
    }

    if (game.mouse.leftButton && this.readyToShoot) {
      this.shootPower ++;
    }

    if (!game.mouse.leftButton && this.readyToShoot && this.shootPower > 0) {
      this.setPhase('shot');

      const impulseForce = u.map(this.shootPower, 0, SHOOT_TIME, 0.1, MAX_SHOOT_POWER, true) * this.shootingMarble.getMass();
      const impulseDirection = vec3.normalize(vec3.subtract(this.selectedShootTargetPosition, this.selectedShootPosition));
      const impulse = vec3.scale(impulseDirection, impulseForce);

      this.physicsHandler.applyImpulse(this.shootingMarble, impulse);
      this.shootingMarble.isShot = true;
      this.shootingMarble = null;
      this.gotMarble = false;
      this.waitUntilEndOfShot = 30;
      this.shootingPlatform.kill();
      this.getActiveInventory().splice(this.pickedMarbleIndex, 1);
    }
  }

  allMarblesStopped() {
    for (const marble of game.getThings().filter(x => x instanceof Marble)) {
      if (vec3.magnitude(marble.velocity) > MARBLE_STOP_THRESHOLD) {
        return false;
      }
    }
    return true;
  }

  setWaitUntilEndOfShot(wait) {
    this.waitUntilEndOfShot = Math.max(this.waitUntilEndOfShot, wait);
  }

  updateShot() {
    if (this.allMarblesStopped()) {
      this.waitUntilEndOfShot --;
      this.physicsHandler.stopAllMarbles(); // Make sure they're really stopped
    }
    if (this.waitUntilEndOfShot <= 0) {
      this.physicsHandler.stopAllMarbles();
      if (this.getActiveInventory().length === 0 && this.getActiveInventoryQueue().length === 0) {
        this.setPhase('victory');
        this.playerWin = this.activePlayer === 'p1' ? 'p2' : 'p1';
        this.winFromRunOut = true;
        return;
      }
      this.setPhase('picking');
      this.activePlayer = this.activePlayer === 'p1' ? 'p2' : 'p1';
      this.deQueueMarbles();
      
    }
  }

  updateVictory() {
    this.victoryTime ++;

    if (this.victoryTime < 60*3 && this.victoryTime % 8 === 0) {
      game.addThing(new CollectedMarble('goal_' + this.playerWin, this.isSingleplayer && this.playerWin === 'p2' ? 'defeat' : 'victory'));
    }

    if (this.victoryTime > 60*3 && game.mouse.leftClick) {
      console.log("TODO: Return to menu")
    }
  }

  draw () {
    const { ctx } = game;

    const drawText = (text, fontSize=40, color='white', position=[0, 0], align=[0, 0]) => {
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

    // Table mesh
    render.drawMesh({
      mesh: assets.meshes[this.mesh],
      texture: assets.textures[this.texture] ?? assets.textures.square,
      position: [0, 0, 0],
      color: [1, 1, 1, 1]
    })

    // Shooting platform
    if (this.phase === 'positioning' && this.selectedShootPosition) {
      render.drawMesh({
        mesh: assets.meshes.platform,
        texture: assets.textures.square,
        position: this.selectedShootPosition,
        color: [1, 1, 1, 1]
      })
    }

    // Shooting guide
    if (this.phase === 'shooting' && this.selectedShootPosition && this.selectedShootTargetPosition) {
      const SPACING = 1.3;
      const DISTANCE = 14;
      const deltaVector = vec3.normalize(vec3.subtract(this.selectedShootTargetPosition, this.selectedShootPosition));
      const powerForce = u.map(this.shootPower, 0, SHOOT_TIME, 0, DISTANCE)
      const angle = vec2.vectorToAngle(deltaVector);

      for (let d = SPACING; d < DISTANCE; d += SPACING) {
        const pos = vec3.add(vec3.scale(deltaVector, d), this.selectedShootPosition);

        render.drawMesh({
          mesh: assets.meshes.aim,
          texture: assets.textures[this.texture] ?? assets.textures.square,
          position: pos,
          scale: 0.09,
          color: powerForce >= d ? [0.9, 0, 0, 1] : [0.9, 0.8, 0, 1],
          rotation: [0, 0, angle],
        })
      }
    }

    // Inventory
    let xPos = 9.2;
    let i = 0;
    for (const marbleType of this.getActiveInventory()) {
      let collectScale = 1.0;
      if (this.inventoryTrayMarbleCollectionTimers[i] > 0) {
        collectScale = u.map(this.inventoryTrayMarbleCollectionTimers[i] ?? 0, COLLECTION_ANIMATION_DURATION, 0, 0, 1.2);
      }
      
      render.drawUIMesh({
        mesh: assets.meshes.sphere,
        texture: assets.textures['uv_marble_' + marbleType] ?? assets.textures.square,
        position: [xPos, -10.4, -3.7 + (this.inventoryTrayPosition * 3) + ((this.inventoryTrayMarbleHeights[i] ?? 0) * 0.7)],
        scale: 2 * getMarbleScale(marbleType) * collectScale,
        rotation: [0, 0, 0],
        unshaded: getMarbleUnshaded(marbleType),
      })
      xPos -= 1.6
      i ++;
    }

    // Who's turn?
    let textColor = this.activePlayer === 'p1' ? 'blue' : '#c24823';
    if (this.phase !== 'shot' && this.phase !== 'victory') {
      let turnText = ''
      if (this.isSingleplayer) {
        if (this.activePlayer !== 'p1') {
          turnText = 'Opponent\'s Turn';
        }
        else {
          turnText = 'Your Turn'
        }
      }
      else {
        if (this.activePlayer === 'p1') {
          turnText = 'Blue Player\'s Turn';
        }
        else {
          turnText = 'Red Player\'s Turn';
        }
      }
      drawText(
        turnText,
        80, textColor, [0, 104], [0, -1]
      )
    }
    
    // Phase hint
    let phaseText = '';
    if (this.phase === 'picking') {
      phaseText = 'Select your marble';
    }
    if (this.phase === 'positioning') {
      phaseText = 'Choose an edge point';
    }
    if (this.phase === 'shooting') {
      phaseText = 'Aim your marble';
    }
    drawText(
      phaseText,
      40, textColor, [0, 160], [0, -1]
    )

    // Victory text
    if (this.phase === 'victory') {
      let textColor = this.playerWin === 'p1' ? 'blue' : '#c24823';
      let victoryText = '';
      let hintText = '';
      if (this.isSingleplayer) {
        victoryText = this.playerWin === 'p1' ? 'Level Complete!' : 'Defeat'
        hintText = this.playerWin === 'p1' ? 'You captured your opponent\'s goal ball!' : 'Your opponent captured your goal ball!'
        if (this.playerWin !== this.activePlayer) {
          hintText = this.playerWin === 'p1' ? 'Your opponent accidentally captured their own goal ball!' : 'You captured your own goal ball!'
        }
        if (this.winFromRunOut) {
          hintText = this.playerWin === 'p1' ? 'Your opponent ran out of marbles!' : 'You ran out of marbles!'
        }
      }
      else {
        victoryText = this.playerWin === 'p1' ? 'Blue Wins!' : 'Red Wins!'
        hintText = this.playerWin === 'p1' ? 'Blue captured Red\'s goal ball!' : 'Red captured Blue\'s goal ball!'
        if (this.playerWin !== this.activePlayer) {
          hintText = this.playerWin === 'p1' ? 'Red accidentally captured their own goal ball!' : 'Blue accidentally captured their own goal ball!';
        }
        if (this.winFromRunOut) {
          hintText = this.playerWin === 'p1' ? 'Red ran out of marbles!' : 'Blue ran out of marbles!'
        }
      }

      drawText(
        victoryText,
        120, textColor, [0, -30], [0, 0]
      )
      drawText(
        hintText,
        50, textColor, [0, 30], [0, 0]
      )
      if (this.victoryTime > 60*5) {
        drawText(
          'Click to exit',
          60, textColor, [0, 220], [0, 0]
        )
      }
    }
  }
}
