import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as mat from 'matrices'
import * as render from './renderer.js'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { assets } from 'game'
import Marble, { getMarbleScale, getMarbleUnshaded, MARBLE_STOP_THRESHOLD } from './marble.js'
import MarblePhysicsHandler from './physics.js'
import Structure from './structure.js'
import CollectParticle from './particlecollect.js'
import CollectedMarble from './collectedmarble.js'
import drawText from './text.js'
import StageSelectMenu from './menustage.js'
import Announcement from './announcement.js'
import QuitButton from './quitbutton.js'

const SHOOT_TIME = 55;
const MAX_SHOOT_POWER = 30;

const COLLECTION_ANIMATION_DURATION = 25;

const MAX_INVENTORY_SIZE = 12;

export default class Table extends Thing {
  time = 0
  errorTime = 0
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
  movesLeft = 2
  noZoom = false

  constructor (levelData, isSingleplayer) {
    super()
    game.setThingName(this, 'table')

    this.isSingleplayer = isSingleplayer;
    this.title = levelData.title;
    this.mesh = levelData.stageMesh;
    this.texture = levelData.stageTexture;
    this.theme = levelData.theme;
    this.marbleCollectHeight = levelData.marbleCollectHeight;
    this.inventoryP1 = [...levelData.marbleCollection];
    this.inventoryP2 = this.isSingleplayer ? [...levelData.aiMarbleCollection] : [...levelData.marbleCollection];

    if (!this.isSingleplayer) {
      this.movesLeft = 1;
    }

    this.shootZones = levelData.shootZones;
    if (levelData.featureSymmetry) {
      const pShootZones = [...this.shootZones];

      for (const ps of pShootZones) {
        const newShootZone = {
          height: ps.height,
          polygon: [],
        }

        for (const pt of ps.polygon) {
          if (levelData.featureSymmetry === 'mirror') {
            newShootZone.polygon.push([
              pt[0],
              -pt[1],
            ])
          }
          else {
            newShootZone.polygon.push([
              -pt[0],
              -pt[1],
            ])
          }
        }

        this.shootZones.push(newShootZone);
      }
    }

    game.addThing(new QuitButton())

    for (const marble of levelData.marbles) {
      game.addThing(new Marble(marble.type, [...marble.position]));
      if (levelData.featureSymmetry) {
        let mirrorPosition;

        if (levelData.featureSymmetry === 'rotate') {
          if (marble.position[0] === 0 && marble.position[1] === 0) {
            continue;
          }

          mirrorPosition = [
            -marble.position[0],
            -marble.position[1],
            marble.position[2],
          ];
        }
        else if (levelData.featureSymmetry === 'mirror') {
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
        if (!levelData.noTeamMirror) {
          if (mirrorType.includes('p1')) {
            mirrorType = mirrorType.replace('p1', 'p2')
          }
          else if (mirrorType.includes('p2')) {
            mirrorType = mirrorType.replace('p2', 'p1')
          }
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
    game.getThing('background').setupCamera(levelData)

    // Physics setup
    this.physicsHandler = new MarblePhysicsHandler(this.meshVerts)
    for (const thing of game.getThings().filter(x => x instanceof Marble)) {
      this.physicsHandler.addMarble(thing)
    }

    this.deQueueMarbles();
  }

  update () {
    // super.update()

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

    if (this.phase === 'picking' && this.prevSelectedMarble !== selectedMarble && selectedMarble < this.getActiveInventory().length && selectedMarble >= 0) {
      soundmanager.playSound('menu3', 1, 1)
    }
    this.prevSelectedMarble = selectedMarble;

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
    else if (this.phase === 'ai') {
      this.updateAi();
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

  addMarble(type, instantaneous) {
    this.gotMarble = true;
    const isAiTurn = this.isSingleplayer && this.activePlayer !== 'p1';

    if (type === 'goal_p1') {
      if (game.getThings().filter(x => x instanceof Marble && !x.isDead && x.type === 'goal_p1').length === 0) {
        this.setPhase('victory');
        this.playerWin = 'p2';
      }
    }
    else if (type === 'goal_p2') {
      if (game.getThings().filter(x => x instanceof Marble && !x.isDead && x.type === 'goal_p2').length === 0) {
        this.setPhase('victory');
        this.playerWin = 'p1';
      }
    }
    else if (!(['evil'].includes(type)) && !isAiTurn) {
      if (instantaneous) {
        this.getActiveInventory().push(type);
        this.inventoryTrayMarbleCollectionTimers[this.getActiveInventory().length - 1] = COLLECTION_ANIMATION_DURATION;
      }
      else {
        this.getActiveInventoryQueue().push(type);
      }
      
    }

    if (this.phase !== 'victory' && !isAiTurn /* && !instantaneous */) {
      game.addThing(new CollectedMarble(type, this.activePlayer === 'p1' ? 'right' : 'left'));
    }
  }

  deQueueMarbles() {
    // Return the shooter marble to the player's inventory
    if (!(this.isSingleplayer && this.activePlayer === 'p2')) {
      const shooterIndex = this.getActiveInventory().findIndex(x => x.includes('shooter'));
      if (shooterIndex === -1) {
        this.getActiveInventoryQueue().push('shooter_' + (this.activePlayer === 'p1' ? 'p1' : 'p2'));
      }
    }

    while(this.getActiveInventoryQueue().length > 0) {
      this.getActiveInventory().push(this.getActiveInventoryQueue()[0]);
      this.getActiveInventoryQueue().splice(0, 1);
      this.inventoryTrayMarbleCollectionTimers[this.getActiveInventory().length - 1] = COLLECTION_ANIMATION_DURATION;
    }

    // Remove marbles if there are too many
    // Prioritize basic marbles. Then just delete the oldest ones
    while (this.getActiveInventory().length > MAX_INVENTORY_SIZE && this.getActiveInventory().includes('basic')) {
      const ind = this.getActiveInventory().findIndex(x => x === 'basic');
      this.getActiveInventory().splice(ind, 1);
    }
    while (this.getActiveInventory().length > MAX_INVENTORY_SIZE) {
      const ind = this.getActiveInventory().findIndex(x => !x.includes('shooter'));
      this.getActiveInventory().splice(ind, 1)
    }
  }

  getSelectedMarble() {
    const SPACING = 70;
    const mousePosX = this.activePlayer === 'p1' ? game.mouse.position[0] : game.config.width - game.mouse.position[0];
    if (game.mouse.position[1] < (game.config.height - 40) && game.mouse.position[1] > (game.config.height - 120)) {
      return Math.floor((mousePosX - 15) / SPACING);
    }
    return -1;
  }

  updatePicking() {
    const selectedMarble = this.getSelectedMarble();
    if (game.mouse.leftClick && selectedMarble < this.getActiveInventory().length && selectedMarble >= 0 && this.phaseTime > 5) {
      if (this.getActiveInventory()[selectedMarble] === 'plus_one') {
        this.setPhase('picking');
        this.addMarble('basic');
        soundmanager.playSound('collect', 1, 1);
        this.movesLeft --;
        if (this.movesLeft === 0) {
          this.waitUntilEndOfShot = 20;
          this.noZoom = true
          this.setPhase('shot')
        }
      }
      else {
        this.setPhase('positioning');
        this.pickedMarbleIndex = selectedMarble;
        soundmanager.playSound('pick', 1.0, 1.0)
      }
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
    let potentialPathPoints = [];
    let potentialPathDistances = [];
    for (const shootZone of this.shootZones) {
      if (shootZone.playerRestriction && shootZone.playerRestriction !== this.activePlayer) {
        continue;
      }

      const pointOnPlane = vec3.pointAtZ(cameraPos, cameraRay, shootZone.height);

      const pathPoint = vec2.closestPointOnPath(shootZone.polygon, pointOnPlane, 3);
      if (pathPoint) {
        potentialPathPoints.push([...pathPoint, pointOnPlane[2]]);
        potentialPathDistances.push(vec2.distance(pathPoint, pointOnPlane))
      }
    }

    if (potentialPathPoints.length > 0) {
      let best = null;
      let bestDist = 99999;
      for (let i = 0; i < potentialPathPoints.length; i ++) {
        if (potentialPathDistances[i] < bestDist) {
          bestDist = potentialPathDistances[i];
          best = potentialPathPoints[i];
        }
      }
      
      this.selectedShootPosition = best;
    }

    if (game.mouse.leftClick && this.selectedShootPosition && this.phaseTime > 5) {
      this.setPhase('shooting');
      this.readyToShoot = false; // Wait until player releases LMB before starting shot
      this.shootPower = 0;
      this.noZoom = false
      game.getThing('background').viewPositionTargetShooting = this.selectedShootPosition;
      soundmanager.playSound('place', 0.8, 1);

      // Add platform and marble
      this.shootingPlatform = game.addThing(new Structure('platform', null, this.selectedShootPosition));
      this.shootingMarble = game.addThing(new Marble(this.getActiveInventory()[this.pickedMarbleIndex], [...this.selectedShootPosition], true));
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

    if (game.mouse.leftButton && this.readyToShoot && this.shootPower < SHOOT_TIME) {
      if ((SHOOT_TIME - this.shootPower) % 5 === 0) {
        const pitch = u.map(this.shootPower, 0, SHOOT_TIME, 1.0, 2.0);
        soundmanager.playSound('aim', 0.9, pitch);
      }
      this.shootPower ++;
    }

    if (!game.mouse.leftButton && this.readyToShoot && this.shootPower > 0) {
      this.setPhase('shot');

      const impulseForce = u.map(this.shootPower, 0, SHOOT_TIME, 0.1, MAX_SHOOT_POWER, true) * this.shootingMarble.getMass();
      const impulseDirection = vec3.normalize(vec3.subtract(this.selectedShootTargetPosition, this.selectedShootPosition));
      const impulse = vec3.scale(impulseDirection, impulseForce);

      this.physicsHandler.applyImpulse(this.shootingMarble, impulse);
      this.shootingMarble.shouldBeFrozen = true;
      this.shootingMarble = null;
      this.gotMarble = false;
      this.gotExtraMove = false;
      this.movesLeft --;
      this.waitUntilEndOfShot = 30;
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

  noAnnouncements() {
    return game.getThings().filter(x => x instanceof Announcement).length === 0;
  }

  setWaitUntilEndOfShot(wait) {
    this.waitUntilEndOfShot = Math.max(this.waitUntilEndOfShot, wait);
  }

  updateShot() {
    if (this.shootingPlatform && !this.shootingPlatform.isDead && this.phaseTime === 30) {
      this.shootingPlatform.shrink();
    }

    if (this.allMarblesStopped()) {
      this.waitUntilEndOfShot --;
      this.physicsHandler.stopAllMarbles(); // Make sure they're really stopped
    }
    if (this.waitUntilEndOfShot <= 0 && this.noAnnouncements()) {
      this.physicsHandler.stopAllMarbles();
      // if (this.getActiveInventory().length === 0 && this.getActiveInventoryQueue().length === 0) {
      //   this.setPhase('victory');
      //   this.playerWin = this.activePlayer === 'p1' ? 'p2' : 'p1';
      //   this.winFromRunOut = true;
      //   return;
      // }
      

      if (this.movesLeft === 0 || this.getActiveInventory().length === 0) {
        this.activePlayer = this.activePlayer === 'p1' ? 'p2' : 'p1';
        soundmanager.playSound('switch_players', 1.0, this.activePlayer === 'p1' ? 1.2 : 1.0);
        if (!this.isSingleplayer) {
          game.addThing(new Announcement('Switch Players!', 80, 2))
        }
        this.movesLeft = 2;

        this.deQueueMarbles();
        this.isInventoryForfeit = false;
        

        for (const thing of game.getThings().filter(x => x instanceof Structure)) {
          thing.turnsAlive ++;
          if (thing.turnsAlive >= 5 * 2) {
            thing.shrink();
          }
        }

        for (const thing of game.getThings().filter(x => x instanceof Marble && x.type.includes('shooter'))) {
          thing.shrink();
        }
        
        // Unfreeze all marbles
        for (const thing of game.getThings().filter(x => x instanceof Marble)) {
          thing.unfreeze();
          thing.isNotShot();
        }
      }
      else {
        // Freeze all marbles that moved last turn
        if (!this.gotExtraMove) {
          for (const thing of game.getThings().filter(x => x instanceof Marble)) {
            thing.checkForFreeze();
          }
        }
      }

      if (this.activePlayer === 'p2' && this.isSingleplayer) {
        this.setPhase('ai');
      }
      else {
        this.setPhase('picking');
      }
    }
  }

  updateAi() {

    if (this.phaseTime === 30) {
      for (let i = 0; i < 30; i ++) {
        // Decide what to do
        // const randomPath = this.shootZones[Math.floor(this.shootZones.length * Math.random())]
        // this.selectedShootPosition = vec2.pickRandomPoint(randomPath.polygon)
        this.selectedShootPosition = [...vec2.pickRandomPoint(this.shootZones.map(x => x.polygon)), 0.2]

        let closestGoalMarble = null;
        let closestDist = 9999999999;
        for (const marble of game.getThings().filter(x => x instanceof Marble && x.type.includes('goal'))) {
          let dist = vec3.distance(this.selectedShootPosition, marble.position);
          if (marble.isFrozen) {
            dist += 1000
          }

          if (dist < closestDist) {
            closestDist = dist;
            closestGoalMarble = marble;
          }
        }
        this.selectedShootTargetPosition = [...closestGoalMarble.position]
        
        this.isDefensive = closestGoalMarble?.type === 'goal_p2'

        // Prefer offensive plays
        if (this.isDefensive && Math.random() < 0.6) {
          continue
        }

        this.pickedMarbleIndex = Math.floor(Math.random() * this.getActiveInventory().length)
        

        // If this will put the marble closer to where we want it to go, do it.
        const dir = vec3.normalize(vec3.subtract(this.selectedShootTargetPosition, this.selectedShootPosition))
        const willTakeMarbleFurther = vec3.magnitude(this.selectedShootTargetPosition) <
          vec3.magnitude(vec3.add(this.selectedShootTargetPosition, dir))
        if (willTakeMarbleFurther && !this.isDefensive) {
          // console.log(this.selectedShootTargetPosition, dir, willTakeMarbleFurther, this.isDefensive)
          break;
        }
        if (!willTakeMarbleFurther && this.isDefensive) {
          // console.log(this.selectedShootTargetPosition, dir, willTakeMarbleFurther, this.isDefensive)
          break;
        }

        
        
      }

      this.noZoom = true
      soundmanager.playSound('place', 0.8, 1);

      // Add platform and marble
      const pickedMarbleType = this.isDefensive ? this.getActiveInventory()[0] : this.getActiveInventory()[this.pickedMarbleIndex];
      this.shootingPlatform = game.addThing(new Structure('platform', null, this.selectedShootPosition));
      this.shootingMarble = game.addThing(new Marble(pickedMarbleType, [...this.selectedShootPosition]), true);
      this.physicsHandler.addStructure(this.shootingPlatform);
      this.physicsHandler.addMarble(this.shootingMarble);
    }

    if (this.phaseTime === 80) {
      const rForce = Math.random() * 0.2 + 0.9
      const impulseForce = MAX_SHOOT_POWER * (this.isDefensive ? 0.5 : 1.03) * this.shootingMarble.getMass() * rForce;
      const impulseDirection = vec3.normalize(vec3.subtract(this.selectedShootTargetPosition, this.selectedShootPosition));
      const impulse = vec3.scale(impulseDirection, impulseForce);

      this.physicsHandler.applyImpulse(this.shootingMarble, impulse);
      this.shootingMarble.shouldBeFrozen = true;
      this.shootingMarble = null;
      this.gotMarble = false;
      this.gotExtraMove = false;
      this.movesLeft --;
      this.waitUntilEndOfShot = 5;

      this.setPhase('shot');
    }
  }

  updateVictory() {
    const isDefeat = this.isSingleplayer && this.playerWin === 'p2';

    if (this.phaseTime === 2) {
      soundmanager.playSound(isDefeat ? 'defeat' : 'victory', 1, 1);
    }


    if (this.phaseTime < 60*3 && this.phaseTime % 8 === 0) {
      game.addThing(new CollectedMarble('goal_' + this.playerWin, isDefeat ? 'defeat' : 'victory'));
    }

    if (this.phaseTime > 60*3 && game.mouse.leftClick) {
      
      this.quit()
    }
  }

  clearInventory() {
    while (this.getActiveInventory().length > 1) {
      this.getActiveInventory().splice(1, 1)
    }
    while (this.getActiveInventoryQueue().length > 0) {
      this.getActiveInventory().splice(0, 1)
    }
  }

  quit() {
    game.addThing(new StageSelectMenu(!this.isSingleplayer))
    soundmanager.playSound('menu', 1, 1);
    this.cleanUp();
  }

  cleanUp() {
    this.isDead = true
    for (const thing of game.getThings().filter(x => x instanceof Marble || x instanceof Structure || x instanceof QuitButton)) {
      thing.isDead = true;
    }
  }

  invScale() {
    return this.activePlayer === 'p1' ? 1 : -1;
  }

  draw () {
    // Table mesh
    render.drawMesh({
      mesh: assets.meshes[this.mesh],
      texture: assets.textures[this.texture] ?? assets.textures.square,
      position: [0, 0, 0],
      color: [0.75, 0.75, 0.75, 1]
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
    if (this.phase === 'shooting' && this.selectedShootPosition && this.selectedShootTargetPosition && this.readyToShoot) {
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
          color: powerForce >= d ? [0.7, 0, 0, 1] : [0.9, 0.8, 0, 1],
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
      
      if (marbleType === 'plus_one') {
        render.drawUIMesh({
          mesh: assets.meshes.plus_one,
          texture: assets.textures.square,
          position: [xPos*this.invScale(), -10.4, -3.7 + (this.inventoryTrayPosition * 1.7) + ((this.inventoryTrayMarbleHeights[0]) * 0.7)],
          scale: 2,
          rotation: [0, 0, Math.PI],
          color: [0, 0.9, 0, 1],
          unshaded: false,
        })
      }
      else {
        render.drawUIMesh({
          mesh: assets.meshes.sphere,
          texture: assets.textures['uv_marble_' + marbleType] ?? assets.textures.square,
          position: [xPos*this.invScale(), -10.4, -3.7 + (this.inventoryTrayPosition * 1.7) + ((this.inventoryTrayMarbleHeights[i] ?? 0) * 0.7)],
          scale: 2 * getMarbleScale(marbleType) * collectScale,
          rotation: [0, 0, 0],
          unshaded: getMarbleUnshaded(marbleType),
        })
      }

      if (['positioning', 'shooting'].includes(this.phase) && i === this.pickedMarbleIndex) {
        render.drawUIMesh({
          mesh: assets.meshes.pointer,
          texture: assets.textures.square,
          position: [xPos*this.invScale(), -10.4, -3.7 + (this.inventoryTrayPosition * 1.7)],
          scale: 0.5,
          rotation: [0, 0, this.time * 0.02],
          color: this.activePlayer === 'p1' ? [0, 0, 1, 1] : [1, 0, 0, 1],
          unshaded: false,
        })
      }
      xPos -= 1.6
      i ++;
    }

    // Who's turn?
    let textColor = this.activePlayer === 'p1' ? 'blue' : '#c24823';
    if (this.phase !== 'victory') {
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
      turnText += ` - ${this.movesLeft} shot${this.movesLeft === 1 ? '' : 's'} left`
      drawText(
        turnText,
        80, textColor, [0, 104], [0, -1]
      )
    }
    
    // Phase hint
    let phaseText = '';
    if (this.phase === 'picking') {
      phaseText = 'Select a marble from your collection';
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
        hintText = this.playerWin === 'p1' ? 'You captured all of your opponent\'s goal marbles!' : 'Your opponent captured all of your goal marbles!'
        if (this.playerWin !== this.activePlayer) {
          hintText = this.playerWin === 'p1' ? 'Your opponent accidentally captured their own goal marble!' : 'You captured your own goal marble!'
        }
        if (this.winFromRunOut) {
          hintText = this.playerWin === 'p1' ? 'Your opponent ran out of marbles!' : 'You ran out of marbles!'
        }
      }
      else {
        victoryText = this.playerWin === 'p1' ? 'Blue Wins!' : 'Red Wins!'
        hintText = this.playerWin === 'p1' ? 'Blue captured all of Red\'s goal marbles!' : 'Red captured all of Blue\'s goal marbles!'
        if (this.playerWin !== this.activePlayer) {
          hintText = this.playerWin === 'p1' ? 'Red accidentally captured their own goal marble!' : 'Blue accidentally captured their own goal marble!';
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
      if (this.phase === 'victory' && this.phaseTime > 60*5) {
        drawText(
          'Click to exit',
          60, textColor, [0, 220], [0, 0]
        )
      }
    }
  }
}
