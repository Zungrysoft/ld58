/** @module vector2 */

/********************************************************************************
Math
********************************************************************************/

/**
 * Checks value equality of two 2D vectors
 * @param {array} v1
 * @param {array} v2
 * @returns true if a and b are equal
 */
export function equals (a, b) {
  return a[0] === b[0] && a[1] === b[1]
}

/**
 * Takes the dot product between two 2D vectors
 * @param {array} v1
 * @param {array} v2
 * @returns Dot product
 */
export function dotProduct (a, b) {
  return a[0] * b[0] + a[1] * b[1]
}

/**
 * Element-wise sums two 2D vectors
 * @param {array} v1
 * @param {array} v2
 * @returns Element-wise sum
 */
export function add (a, b) {
  return [
    a[0] + b[0],
    a[1] + b[1]
  ]
}

/**
 * Subtracts one 2D vector from another
 * @param {array} v1
 * @param {array} v2
 * @returns Element-wise difference
 */
export function subtract (a, b) {
  return [
    a[0] - b[0],
    a[1] - b[1]
  ]
}

/**
 * Scales a 2D vector by a scalar
 * @param {array} vector
 * @param {array} scalar
 * @returns Scaled vector
 */
export function scale (vector, scale) {
  return [
    vector[0] * scale,
    vector[1] * scale
  ]
}

/**
 * Inverts a 2D vector
 * @param {array} vector
 * @returns Inverted vector
 */
export function invert (vector) {
  return [
    vector[0] * -1,
    vector[1] * -1
  ]
}

/**
 * Normalizes a 2D vector to magnitude 1
 * @param {array} vector
 * @returns Normalized vector
 */
export function normalize (vector) {
  const magnitude = Math.sqrt(vector[0] ** 2 + vector[1] ** 2)

  // prevent dividing by 0 and causing NaNs by ORing with 1
  return [
    vector[0] / (magnitude || 1),
    vector[1] / (magnitude || 1)
  ]
}

/**
 * Rescales a 2D vector to a new length
 * @param {array} vector - Vector to rescale
 * @param {array} length - Desired length
 * @returns Scaled vector
 */
export function toMagnitude (vector, length) {
  return scale(vector, length / (magnitude(vector) || 1))
}

/**
 * Gets the magnitude of a 2D vector
 * @param {array} vector
 * @returns Magnitude
 */
export function magnitude (vector) {
  return Math.sqrt(vector[0] ** 2 + vector[1] ** 2)
}

/**
 * Gets the Euclidean distance between two points in 2D space
 * @param {array} v1
 * @param {array} v2
 * @returns Distance
 */
export function distance (a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)
}

/**
 * Gets the Manhattan distance between two points in 2D space
 * @param {array} v1
 * @param {array} v2
 * @returns Distance
 */
export function distanceManhattan (v1, v2) {
  return Math.abs(v1[0] - v2[0]) + Math.abs(v1[1] - v2[1])
}

/**
 * Linearly interpolates between two 2D vectors
 * @param {number} a - vector when t=0
 * @param {number} b - vector when t=1
 * @param {number} t - interpolator
 * @returns Interpolated vector
 */
export function lerp (v1, v2, t) {
  return [
    (1 - t) * v1[0] + t * v2[0],
    (1 - t) * v1[1] + t * v2[1]
  ]
}

/********************************************************************************
Angles
********************************************************************************/

/**
 * Rotates a 2D vector by an angle
 * @param {array} vector
 * @param {number} angle
 * @returns Rotated vector
 */
export function rotate (vector, angle) {
  return [
    Math.cos(angle) * vector[0] - Math.sin(angle) * vector[1],
    Math.sin(angle) * vector[0] + Math.cos(angle) * vector[1]
  ]
}

/**
 * Converts an angle to a 2D vector of a particular length
 * @param {number} angle
 * @param {number} length
 * @returns Direction vector
 */
export function angleToVector (angle, length = 1) {
  return toMagnitude([Math.cos(angle), Math.sin(angle)], length)
}

/**
 * Gets the angle of a 2D vector
 * @param {array} vector
 * @returns Angle of the vector
 */
export function vectorToAngle (vector) {
  return Math.atan2(vector[1], vector[0])
}

/**
 * Gets the angle between two 2D vectors
 * @param {*} v1
 * @param {*} v2
 * @returns The angle between the two 2D vectors
 */
export function angleBetween (v1, v2) {
  return Math.atan2(v1[1] - v2[1], v1[0] - v2[0])
}

/**
 * Gets the angle between two angles
 * @param {*} a
 * @param {*} b
 * @returns The angle between the two angles
 */
export function angleDistance (a, b) {
  // Bind angles to be from 0 to 2*PI
  a = a % (Math.PI * 2)
  b = b % (Math.PI * 2)

  // Find the shortest distance
  let minDist = Math.abs(a - b)

  const d1 = Math.abs((a + (Math.PI * 2)) - b)
  if (d1 < minDist) {
    minDist = d1
  }

  const d2 = Math.abs((a - (Math.PI * 2)) - b)
  if (d2 < minDist) {
    minDist = d2
  }

  return minDist
}

/**
 * Linearly interpolates between two angles
 * @param {number} a - angle when t=0
 * @param {number} b - angle when t=1
 * @param {number} t - interpolator
 * @returns Interpolated angle
 */
export function lerpAngles (a, b, t) {
  // Bind angles to be from 0 to 2*PI
  a = a % (Math.PI * 2)
  b = b % (Math.PI * 2)

  // Determine which direction to lerp yaw in
  let minMode = 0
  let minDist = Math.abs(a - b)

  const d1 = Math.abs((a + (Math.PI * 2)) - b)
  if (d1 < minDist) {
    minDist = d1
    minMode = 1
  }

  const d2 = Math.abs((a - (Math.PI * 2)) - b)
  if (d2 < minDist) {
    minDist = d2
    minMode = 2
  }

  // Apply mode
  if (minMode === 1) {
    a += Math.PI * 2
  } else if (minMode === 2) {
    a -= Math.PI * 2
  }

  return (1 - t) * a + t * b
}

/********************************************************************************
Directions
********************************************************************************/
const allDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const directionToVectorMap = {
  west: [-1, 0],
  east: [1, 0],
  north: [0, -1],
  south: [0, 1]
}
const closestDirectionMap = {
  '-1,0': 'west',
  '1,0': 'east',
  '0,-1': 'north',
  '0,1': 'south'
}
const oppositeDirectionMap = {
  west: 'east',
  east: 'west',
  north: 'south',
  south: 'north'
}

/**
 * Gets the 2D unit vector corresponding to a cardinal direction
 * @param {string} direction - Should be 'north', 'south', 'west', or 'east'
 * @returns Unit vector in cardinal direction
 */
export function directionToVector (direction) {
  return directionToVectorMap[direction]
}

/**
 * Gets the cardinal direction most similar to a given 2D vector
 * @param {array} vector
 * @returns Cardinal direction most similar to the given vector
 */
export function closestDirection (vector) {
  return closestDirectionMap[findMostSimilarVector(vector, allDirections)]
}

/**
 * Gets direction opposite to a cardinal direction
 * @param {string} cardinalDirection - Should be 'north', 'south', 'west', or 'east'
 * @returns Direction opposite the given cardinal direction
 */
export function oppositeDirection (direction) {
  return oppositeDirectionMap[direction]
}

/********************************************************************************
Misc.
********************************************************************************/

/**
 * Finds the most similar 2D vector from a list
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


export function isPointInPolygon(polygon, point) {
  const [px, py] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const onEdge = ((yi - py) * (xj - xi) - (xi - px) * (yj - yi)) === 0 &&
                    px >= Math.min(xi, xj) && px <= Math.max(xi, xj) &&
                    py >= Math.min(yi, yj) && py <= Math.max(yi, yj);
    if (onEdge) return true;

    const intersect = ((yi > py) !== (yj > py)) &&
                      (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

export function closestPointOnPath(path, point, maxDist) {
  if (path.length < 2) return null;

  const [px, py] = point;
  let closest = null;
  let minDistSq = maxDist * maxDist;

  for (let i = 0; i < path.length - 1; i++) {
    const [x1, y1] = path[i];
    const [x2, y2] = path[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;

    // Project point onto segment, clamped between 0 and 1
    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    const clampedT = Math.max(0, Math.min(1, t));

    const cx = x1 + clampedT * dx;
    const cy = y1 + clampedT * dy;

    const distSq = (px - cx) ** 2 + (py - cy) ** 2;
    if (distSq < minDistSq) {
      minDistSq = distSq;
      closest = [cx, cy];
    }
  }

  return closest;
}

export function pickRandomPoint(paths) {
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error("paths must be a non-empty array");
  }

  // Compute total length of all paths
  const pathLengths = paths.map(path => {
    let len = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = path[i];
      const [x2, y2] = path[i + 1];
      len += Math.hypot(x2 - x1, y2 - y1);
    }
    return len;
  });

  const totalLength = pathLengths.reduce((a, b) => a + b, 0);
  if (totalLength === 0) throw new Error("all paths have zero length");

  // Pick a random position along total length
  let target = Math.random() * totalLength;

  // Find which path the target falls into
  let pathIndex = 0;
  while (target > pathLengths[pathIndex]) {
    target -= pathLengths[pathIndex];
    pathIndex++;
  }

  const path = paths[pathIndex];

  // Now find which segment within the chosen path
  for (let i = 0; i < path.length - 1; i++) {
    const [x1, y1] = path[i];
    const [x2, y2] = path[i + 1];
    const segLen = Math.hypot(x2 - x1, y2 - y1);

    if (target <= segLen) {
      const t = segLen === 0 ? 0 : target / segLen;
      const x = x1 + t * (x2 - x1);
      const y = y1 + t * (y2 - y1);
      return [x, y];
    }
    target -= segLen;
  }

  // Fallback: return last point of last path
  return path[path.length - 1];
}

