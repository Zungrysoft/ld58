// physics-cannon.js
// import {
//   World,
//   Body,
//   Sphere,
//   Trimesh,
//   Vec3,
//   Material,
//   ContactMaterial
// } from "cannon-es";

const World = CANNON.World;
const Body = CANNON.Body;
const Sphere = CANNON.Sphere;
const Trimesh = CANNON.Trimesh;
const Vec3 = CANNON.Vec3;
const Material = CANNON.Material;
const ContactMaterial = CANNON.ContactMaterial;

const SUBSTEPS = 5;

/**
 * Simulate one fixed step of physics (deterministic) using cannon-es.
 *
 * @param {Array<[number,number,number]>} meshTriangles  Flat array: [v0,v1,v2, v3,v4,v5, ...] where each vi is [x,y,z].
 * @param {Array<{position:[x,y,z], velocity:[x,y,z], diameter:number, mass:number}>} marbles
 * @param {number} dt  Time step in seconds (default 1/60)
 * @returns {Array} new marbles array (same order as input)
 */
export function simulateStep(meshTriangles, marbles, dt = 1 / 60) {
  // 1) Create world
  const world = new World();
  world.gravity.set(0, 0, -9.81);
  // make solver iterations deterministic and reasonably accurate
  world.solver.iterations = 20;
  // world.solver.tolerance  = 1e-6;
  // no sleeping (sleeping can hide small differences and cause nondeterministic behavior across runs)
  world.allowSleep = false;

  // 2) Convert input triangle list -> vertex array + indices for Trimesh
  // We simply expand every triangle vertex into the vertex array (duplicates allowed).
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
  const trimesh = new Trimesh(Array.from(verticesFA), Array.from(indicesIA));
  const tableBody = new Body({ mass: 0 }); // static
  tableBody.addShape(trimesh);
  world.addBody(tableBody);

  // 4) Materials & contact settings (perfectly elastic: restitution = 1)
  const marbleMaterial = new Material("marble");
  const tableMaterial = new Material("table");
  // marble vs table
  const marbleTableCM = new ContactMaterial(marbleMaterial, tableMaterial, {
    friction: 0.62,
    restitution: 0.2,
  });
  // marble vs marble
  const marbleMarbleCM = new ContactMaterial(marbleMaterial, marbleMaterial, {
    friction: 0.62,
    restitution: 0.2,
  });
  world.addContactMaterial(marbleTableCM);
  world.addContactMaterial(marbleMarbleCM);

  tableBody.material = tableMaterial;

  // 5) Create marble bodies (in the same order as inputs)
  const bodies = marbles.map((m, idx) => {
    const radius = m.diameter / 2;
    const sphereShape = new Sphere(radius);

    // set up body
    const body = new Body({
      mass: m.mass,
      position: new Vec3(m.position[0], m.position[1], m.position[2]),
      // no angular damping or linear damping unless desired:
      linearDamping: 0.1,
      angularDamping: 0.1
    });

    body.addShape(sphereShape);
    // assign material
    body.material = marbleMaterial;
    // set initial velocity
    body.velocity.set(m.velocity[0], m.velocity[1], m.velocity[2]);
    // disable sleeping for determinism
    body.allowSleep = false;

    world.addBody(body);
    return body;
  });

  // 6) Step once for dt (force a single substep equal to dt to be deterministic)
  // world.step(fixedTimeStep, timeSinceLastCall, maxSubSteps)
  // we call with (dt, dt, 1) to take exactly one substep of length dt.
  world.step(dt / SUBSTEPS, dt, SUBSTEPS);

  // 7) Read back results and return new marbles array (pure: don't mutate inputs)
  const result = marbles.map((m, i) => {
    const b = bodies[i];
    return {
      position: [b.position.x, b.position.y, b.position.z],
      velocity: [b.velocity.x, b.velocity.y, b.velocity.z],
      diameter: m.diameter,
      mass: m.mass,
      thingRef: m.thingRef,
      rotation: m.rotation,
    };
  });

  return result;
}
