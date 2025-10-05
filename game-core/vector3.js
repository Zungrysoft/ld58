/** @module vector3 */

/********************************************************************************
Math
********************************************************************************/

/**
 * Checks value equality of two 3D vectors
 * @param {array} v1
 * @param {array} v2
 * @returns true if a and b are equal
 */
export function equals (v1, v2) {
  return (
    v1[0] === v2[0] &&
    v1[1] === v2[1] &&
    v1[2] === v2[2]
  )
}

/**
 * Takes the cross product of two 3D vectors
 * @param {array} v1
 * @param {array} v2
 * @returns Cross product
 */
export function crossProduct (v1, v2) {
  return [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0]
  ]
}

/**
 * Takes the dot product between two 3D vectors
 * @param {array} v1
 * @param {array} v2
 * @returns Dot product
 */
export function dotProduct (v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
}

/**
 * Element-wise sums two 3D vectors
 * @param {array} v1
 * @param {array} v2
 * @returns Element-wise sum
 */
export function add (v1, v2) {
  return [
    v1[0] + v2[0],
    v1[1] + v2[1],
    v1[2] + v2[2]
  ]
}

/**
 * Subtracts one 3D vector from another
 * @param {array} v1
 * @param {array} v2
 * @returns Element-wise difference
 */
export function subtract (v1, v2) {
  return [
    v1[0] - v2[0],
    v1[1] - v2[1],
    v1[2] - v2[2]
  ]
}

/**
 * Scales a 3D vector by a scalar
 * @param {array} vector
 * @param {array} scalar
 * @returns Scaled vector
 */
export function scale (vector, scalar) {
  return [
    vector[0] * scalar,
    vector[1] * scalar,
    vector[2] * scalar
  ]
}

/**
 * Inverts a 3D vector
 * @param {array} vector
 * @returns Inverted vector
 */
export function invert (vector) {
  return [
    vector[0] * -1,
    vector[1] * -1,
    vector[2] * -1
  ]
}

/**
 * Normalizes a 3D vector to magnitude 1
 * @param {array} vector
 * @returns Normalized vector
 */
export function normalize (vector) {
  const magnitude = Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2)

  // prevent dividing by 0 and causing NaNs by ORing with 1
  return [
    vector[0] / (magnitude || 1),
    vector[1] / (magnitude || 1),
    vector[2] / (magnitude || 1)
  ]
}

/**
 * Rescales a 3D vector to a new length
 * @param {array} vector - Vector to rescale
 * @param {array} length - Desired length
 * @returns Scaled vector
 */
export function toMagnitude (vector, length) {
  const magnitude = Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2)

  // prevent dividing by 0 and causing NaNs by ORing with 1
  return [
    vector[0] * length / (magnitude || 1),
    vector[1] * length / (magnitude || 1),
    vector[2] * length / (magnitude || 1)
  ]
}

/**
 * Gets the magnitude of a 3D vector
 * @param {array} vector
 * @returns Magnitude
 */
export function magnitude (vector) {
  return Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2)
}

/**
 * Gets the Euclidean distance between two points in 3D space
 * @param {array} v1
 * @param {array} v2
 * @returns Distance
 */
export function distance (v1, v2) {
  return Math.sqrt((v1[0] - v2[0]) ** 2 + (v1[1] - v2[1]) ** 2 + (v1[2] - v2[2]) ** 2)
}

/**
 * Gets the Manhattan distance between two points in 3D space
 * @param {array} v1
 * @param {array} v2
 * @returns Distance
 */
export function distanceManhattan (v1, v2) {
  return Math.abs(v1[0] - v2[0]) + Math.abs(v1[1] - v2[1]) + Math.abs(v1[2] - v2[2])
}

/**
 * Linearly interpolates between two 3D vectors
 * @param {number} a - vector when t=0
 * @param {number} b - vector when t=1
 * @param {number} t - interpolator
 * @returns Interpolated vector
 */
export function lerp (v1, v2, t) {
  return [
    (1 - t) * v1[0] + t * v2[0],
    (1 - t) * v1[1] + t * v2[1],
    (1 - t) * v1[2] + t * v2[2]
  ]
}

/********************************************************************************
Angles
********************************************************************************/

/**
 * Converts an angles vector to 3D vector of a particular length
 * @param {number} yaw
 * @param {number} pitch
 * @param {number} length
 * @returns Direction vector
 */
export function anglesToVector (yaw, pitch, length = 1) {
  return toMagnitude([
    Math.cos(yaw) * Math.max(Math.cos(pitch), 0.001),
    Math.sin(yaw) * Math.max(Math.cos(pitch), 0.001),
    Math.sin(pitch)
  ], length)
}

/**
 * Gets the angles of a 3D vector
 * @param {array} vector
 * @returns Angle of the vector
 */
export function vectorToAngles (vector) {
  return [
    Math.atan2(vector[1], vector[0]),
    Math.asin(vector[2]),
    0
  ]
}

/********************************************************************************
Directions
********************************************************************************/
const allDirections = [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]]
const directionToVectorMap = {
  west: [-1, 0, 0],
  east: [1, 0, 0],
  north: [0, -1, 0],
  south: [0, 1, 0],
  down: [0, 0, -1],
  up: [0, 0, 1]
}
const closestDirectionMap = {
  '-1,0,0': 'west',
  '1,0,0': 'east',
  '0,-1,0': 'north',
  '0,1,0': 'south',
  '0,0,-1': 'down',
  '0,0,1': 'up'
}
const oppositeDirectionMap = {
  west: 'east',
  east: 'west',
  north: 'south',
  south: 'north',
  down: 'up',
  up: 'down'
}

/**
 * Gets the 3D unit vector corresponding to a cardinal direction
 * @param {string} direction - Should be 'north', 'south', 'west', 'east', 'down', or 'up'
 * @returns Unit vector in cardinal direction
 */
export function directionToVector (direction) {
  return directionToVectorMap[direction]
}

/**
 * Gets the cardinal direction most similar to a given vector
 * @param {array} vector
 * @returns Cardinal direction most similar to the given vector
 */
export function closestDirection (vector) {
  return closestDirectionMap[findMostSimilarVector(vector, allDirections)]
}

/**
 * Gets direction opposite to a cardinal direction
 * @param {string} cardinalDirection - Should be 'north', 'south', 'west', 'east', 'down', or 'up'
 * @returns Direction opposite the given cardinal direction
 */
export function oppositeDirection (direction) {
  return oppositeDirectionMap[direction]
}

/********************************************************************************
Triangles
********************************************************************************/

/**
 * Calculates the normal vector of a triangle.
 *
 * @param {Array<number>} v1 - The first vertex of the triangle.
 * @param {Array<number>} v2 - The second vertex of the triangle.
 * @param {Array<number>} v3 - The third vertex of the triangle.
 * @returns {Array<number>} - The normal vector of the triangle.
 */
export function getNormalOf (v1, v2, v3) {
  return normalize(crossProduct(
    subtract(v2, v1),
    subtract(v3, v2)
  ))
}

/**
 * Calculates the area of a triangle.
 *
 * @param {Array<number>} v1 - The first vertex of the triangle.
 * @param {Array<number>} v2 - The second vertex of the triangle.
 * @param {Array<number>} v3 - The third vertex of the triangle.
 * @returns {number} - The area of the triangle.
 */
export function areaOfTriangle (v1, v2, v3) {
  return 0.5 * magnitude(crossProduct(
    subtract(v2, v1),
    subtract(v3, v2)
  ))
}

function triEdge (p1, p2, position, normal) {
  const s1x = p2[0] - p1[0]
  const s1y = p2[1] - p1[1]
  const s1z = p2[2] - p1[2]
  const s2x = position[0] - p1[0]
  const s2y = position[1] - p1[1]
  const s2z = position[2] - p1[2]
  const ex = s1y * s2z - s1z * s2y
  const ey = s1z * s2x - s1x * s2z
  const ez = s1x * s2y - s1y * s2x
  return ex * normal[0] + ey * normal[1] + ez * normal[2]
}

/**
 * Determines whether the given position is inside the triangular
 * prism defined by the triangle and its normal vector.
 *
 * @param {Array<number>} v1 - The first vertex of the triangle.
 * @param {Array<number>} v2 - The second vertex of the triangle.
 * @param {Array<number>} v3 - The third vertex of the triangle.
 * @param {Array<number>} normal - The normal vector of the triangle.
 * @param {Array<number>} position - The point to test.
 * @returns {boolean} - The result of the test.
 */
export function isInsideTriangle (p1, p2, p3, normal, position) {
  const e1 = triEdge(p1, p2, position, normal)
  const e2 = triEdge(p2, p3, position, normal)
  const e3 = triEdge(p3, p1, position, normal)
  return (e1 >= 0 && e2 >= 0 && e3 >= 0) || (e1 < 0 && e2 < 0 && e3 < 0)
}

/**
 * Calculates the distance between a point and a triangle.
 *
 * @param {Array<number>} p1 - The first point of the triangle.
 * @param {Array<number>} normal - The normal vector of the triangle.
 * @param {Array<number>} position - The position vector of the point.
 * @returns {number} - The distance between the point and the triangle.
 */
export function distanceToTriangle (p1, normal, position) {
  return dotProduct(position, normal) - dotProduct(p1, normal)
}

/**
 * Calculates the point on a plane that intersects with a ray.
 *
 * @param {Array<number>} r1 - The starting point of the ray.
 * @param {Array<number>} rayDir - The direction vector of the ray.
 * @param {Array<number>} p1 - The first point of the triangle.
 * @param {Array<number>} normal - The normal vector of the triangle.
 * @returns {Array<number>|null} - The point on the plane that intersects with the ray, or null if there is no intersection.
 */
export function getPointOnPlane (r1, rayDir, p1, normal) {
  const dist = distanceToTriangle(p1, normal, r1)
  const dot = dotProduct(rayDir, normal)

  // don't divide by zero!
  if (dot >= 0) {
    return null
  }

  return add(r1, scale(rayDir, Math.abs(dist / dot)))
}

/**
 * Calculates the intersection point of a ray and a triangle.
 *
 * @param {Array<number>} r1 - The starting point of the ray.
 * @param {Array<number>} rayDir - The direction vector of the ray.
 * @param {Array<number>} p1 - The first vertex of the triangle.
 * @param {Array<number>} p2 - The second vertex of the triangle.
 * @param {Array<number>} p3 - The third vertex of the triangle.
 * @param {Array<number>} normal - The normal vector of the triangle.
 * @returns {Array<number>|null} - The intersection point of the ray and the triangle, or null if there is no intersection.
 */
export function rayTriangleIntersection (r1, rayDir, p1, p2, p3, normal) {
  const point = getPointOnPlane(r1, rayDir, p1, normal)
  if (!point) return point
  return isInsideTriangle(p1, p2, p3, normal, point) ? point : null
}

/**
 * Calculates the intersection point of a ray and a sphere.
 *
 * @param {Array<number>} ray - The direction vector of the ray.
 * @param {Array<number>} sphere - The position vector of the sphere.
 * @param {number} radius - The radius of the sphere.
 * @returns {Array<number>|undefined} - The intersection point of the ray and the sphere, or undefined if there is no intersection.
 */
export function raySphere (ray, sphere, radius) {
  const sphereProjection = dotProduct(ray, sphere)
  const testPoint = [
    ray[0] + sphereProjection,
    ray[1] + sphereProjection,
    ray[2] + sphereProjection
  ]

  const dist = distance(testPoint, sphere)
  if (dist < radius) {
    return testPoint
  }
}

/********************************************************************************
Misc.
********************************************************************************/

/**
 * Finds the most similar 3D vector from a list
 * @param {*} mainVector - Vector the list is compared to
 * @param {*} list - List of vectors to compare to mainVector
 * @returns The vector from the list that is most similar to the mainVector
 */
export function findMostSimilarVector (mainVector, list) {
  let bestDot = -1 * Infinity
  let bestVector = null

  for (const thing of list) {
    const dot = dotProduct(thing, mainVector)
    if (dot > bestDot) {
      bestDot = dot
      bestVector = thing
    }
  }

  return bestVector
}

export function pointAtZ(origin, ray, targetZ) {
    if (ray[2] === 0) {
        if (origin[2] === targetZ) {
            return { ...origin };
        } else {
            return null;
        }
    }

    const t = (targetZ - origin[2]) / ray[2];

    return [
        origin[0] + ray[0] * t,
        origin[1] + ray[1] * t,
        targetZ
    ];
}
