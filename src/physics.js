// physics-cannon-es.js
// npm: `npm install cannon-es`
// Usage: import { simulateStep } from './physics-cannon-es.js';

import * as soundmanager from 'soundmanager'
import * as u from 'utils'


const World = CANNON.World;
const Body = CANNON.Body;
const Sphere = CANNON.Sphere;
const Trimesh = CANNON.Trimesh;
const Vec3 = CANNON.Vec3;
const Material = CANNON.Material;
const ContactMaterial = CANNON.ContactMaterial;
const NaiveBroadphase = CANNON.NaiveBroadphase;

const TABLE_RESTITUTION = 0.5;
const TABLE_FRICTION = 0.06;
const MARBLE_RESTITUTION = 0.95;
const MARBLE_FRICTION = 0.1;
const MARBLE_LINEAR_DAMPING = 0.7;
const MARBLE_ANGULAR_DAMPING = 0.9;

function quaternionToYawPitchRoll(q) {
    const x = q[2], y = q[1], z = q[0], w = q[3];

    // roll (x-axis rotation)
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    // pitch (y-axis rotation)
    let sinp = 2 * (w * y - z * x);
    let pitch;
    if (Math.abs(sinp) >= 1)
        pitch = Math.sign(sinp) * Math.PI / 2; // clamp to +-90°
    else
        pitch = Math.asin(sinp);

    // yaw (z-axis rotation)
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);
    
    return [yaw, pitch, roll];
}


export default class MarblePhysicsHandler {
    constructor(meshTriangles) {
        // Create physics world
        this.world = new World();
        this.world.gravity.set(0, 0, -30); // Gravity along -Y
        this.world.broadphase = new NaiveBroadphase();
        this.world.solver.iterations = 20;

        // Track marbles: object reference -> body
        this.marbles = new Map();
        this.structures = new Map();

        const vertices = [];
        const indices = [];
        let vi = 0;
        for (let i = 0; i < meshTriangles.length; i += 3) {
          // three vertices per triangle
          for (let j = 0; j < 3; j++) {
            const v = meshTriangles[i + j]; // [x,y,z]
            vertices.push(v[0], v[1], v[2]);
            indices.push(vi++);
          }
        }

        // Use typed arrays (Trimesh accepts numeric arrays / typed arrays)
        const verticesFA = new Float32Array(vertices);
        const indicesIA = new Int16Array(indices); // Int16 is typical; if you have >32k verts, use Int32Array

        // 3) Create trimesh shape & static body (table)
        const tableShape = new Trimesh(Array.from(verticesFA), Array.from(indicesIA));

        this.tableBody = new Body({
            mass: 0, // static
            shape: tableShape,
            material: new Material({ friction: TABLE_FRICTION, restitution: TABLE_RESTITUTION })
        });

        this.world.addBody(this.tableBody);
    }

    addMarble(marbleObj) {
        const radius = marbleObj.scale / 2;

        const sphereShape = new Sphere(radius);

        // Material with perfectly elastic collisions
        const marbleMaterial = new Material({ friction: 0.1, restitution: 0.9 });
        const contactMaterial = new ContactMaterial(
            marbleMaterial,
            marbleMaterial,
            {
                restitution: MARBLE_RESTITUTION,
                friction: MARBLE_FRICTION,
            }
        );
        this.world.addContactMaterial(contactMaterial);

        const marbleBody = new Body({
            mass: 1,
            shape: sphereShape,
            position: new Vec3(...marbleObj.position),
            velocity: new Vec3(...marbleObj.velocity),
            material: marbleMaterial,
            linearDamping: MARBLE_LINEAR_DAMPING,
            angularDamping: MARBLE_ANGULAR_DAMPING,
        });

        this.world.addBody(marbleBody);
        this.marbles.set(marbleObj, marbleBody);

        marbleBody.addEventListener("collide", (event) => {
          const self = marbleBody;
          const other = event.body;

          const contact = event.contact; // CANNON.ContactEquation
          const relativeVelocity = contact.getImpactVelocityAlongNormal();
          const massA = self.mass;
          const massB = other.mass;

          if (massB === 0) {
            const dt = 1 / 60;
            const force = Math.abs(relativeVelocity) / dt;
            if (force > 50) {
              soundmanager.playSound(
                'hitTable',
                u.map(force, 0, 1000, 0, 1, true),
                u.map(force, 0, 2000, 0.7, 1.2, true),
              );
            }
          }
          else if (massA !== 0 && massB !== 0 && self.id < other.id) {
            const dt = 1 / 60;
            const force = Math.abs(relativeVelocity) * (massA * massB) / (massA + massB) / dt;
            if (force > 10) {
              soundmanager.playSound(
                'hitMarble',
                u.map(force, 0, 1000, 0, 1, true),
                u.map(force, 0, 2000, 0.5, 1.1, true),
              );
            }
          }
      });
    }

    removeMarble(marbleObj) {
        const body = this.marbles.get(marbleObj);
        if (body) {
            this.world.removeBody(body);
            this.marbles.delete(marbleObj);
        }
    }

    applyImpulse(marbleObj, impulse) {
      const body = this.marbles.get(marbleObj);
      if (!body) return;

      const impulseVec = new CANNON.Vec3(...impulse);

      // Apply impulse through center of mass (no torque)
      body.applyImpulse(impulseVec, body.position);
    }

    addStructure(structureObj) {
      const meshTriangles = structureObj.meshTriangles;

      const vertices = [];
      const indices = [];
      let vi = 0;
      for (let i = 0; i < meshTriangles.length; i += 3) {
        // three vertices per triangle
        for (let j = 0; j < 3; j++) {
          const v = meshTriangles[i + j];
          vertices.push(v[0], v[1], v[2]);
          indices.push(vi++);
        }
      }

      // Use typed arrays (Trimesh accepts numeric arrays / typed arrays)
      const verticesFA = new Float32Array(vertices);
      const indicesIA = new Int16Array(indices); // Int16 is typical; if you have >32k verts, use Int32Array

      // 3) Create trimesh shape & static body
      const structureShape = new Trimesh(Array.from(verticesFA), Array.from(indicesIA));

      const structureBody = new Body({
          mass: 0, // static
          position: new Vec3(...structureObj.position),
          shape: structureShape,
          material: new Material({ friction: TABLE_FRICTION, restitution: TABLE_RESTITUTION })
      });

      this.world.addBody(structureBody);
      this.structures.set(structureObj, structureBody);
    }

    removeStructure(structureObj) {
        const body = this.structures.get(structureObj);
        if (body) {
            this.world.removeBody(body);
            this.structures.delete(structureObj);
        }
    }

    simulateStep() {
        const timeStep = 1 / 60;
        this.world.step(timeStep);

        this.marbles.forEach((body, marbleObj) => {
            // Update position array
            marbleObj.position = [
              body.position.x,
              body.position.y,
              body.position.z,
            ]

            // Update velocity array
            marbleObj.velocity = [
              body.velocity.x,
              body.velocity.y,
              body.velocity.z,
            ]

            // Update rotation as quaternion array [x, y, z, w]
            marbleObj.rotation = [
                body.quaternion.x,
                body.quaternion.y,
                body.quaternion.z,
                body.quaternion.w
            ];
            marbleObj.rotationVis = quaternionToYawPitchRoll([
                body.quaternion.x,
                body.quaternion.y,
                body.quaternion.z,
                body.quaternion.w
            ])
        });
    }
}
