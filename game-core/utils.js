/** @module utils */

/********************************************************************************
Math and Mapping
********************************************************************************/

/**
 * Custom modulo operator that behaves in a more standard way
 * For example, mod(-10, 7) returns 4
 * @param {number} n
 * @param {number} m
 * @returns
 */
export function mod (n, m) {
  return ((n % m) + m) % m
}

/**
 * Linearly interpolates between two values
 * @param {number} a - value when t=0
 * @param {number} b - value when t=1
 * @param {number} t - interpolator
 * @returns Interpolated value
 */
export function lerp (a, b, t) {
  return (1 - t) * a + t * b
}

/**
 * Linearly interpolates element-wise between two numerical arrays
 * @param {array} a - array when t=0
 * @param {array} b - array when t=1
 * @param {number} t - interpolator
 * @returns Interpolated array
 */
export function lerpArray (a, b, t) {
  const result = []
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    result[i] = lerp(a[i], b[i], t)
  }
  return result
}

/**
 * Sets a value's min and max
 * @param {number} n - The value to clamp
 * @param {number} min
 * @param {number} max
 * @returns Clamped value
 */
export function clamp (n, min, max) {
  if (min < max) {
    return Math.min(Math.max(n, min), max)
  }

  return Math.min(Math.max(n, max), min)
}

/**
 * Linearly remaps a value from one range to another
 * @param {number} n - The value to map
 * @param {number} start1 - Input range start
 * @param {number} stop1 - Input range end
 * @param {number} start2 - Output range start
 * @param {number} stop2 - Output range end
 * @param {number} withinBounds - Whether the output should be clamped between start2 and stop2
 * @returns Mapped value
 */
export function map (n, start1, stop1, start2, stop2, clampOutput = false) {
  const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2

  if (!clampOutput) {
    return newval
  }

  return clamp(newval, start2, stop2)
}

/**
 * Quadratically remaps a value from one range to another
 * @param {number} n - The value to map
 * @param {number} start1 - Input range start
 * @param {number} stop1 - Input range end
 * @param {number} start2 - Output range start
 * @param {number} stop2 - Output range end
 * @param {number} withinBounds - Whether the output should be clamped between start2 and stop2
 * @returns Mapped value
 */
export function squareMap (n, start1, stop1, start2, stop2, clampOutput = false) {
  return curveMap(n, start1, stop1, start2, stop2, clampOutput, -0.33)
}

/**
 * Inverse-quadratically remaps a value from one range to another
 * @param {number} n - The value to map
 * @param {number} start1 - Input range start
 * @param {number} stop1 - Input range end
 * @param {number} start2 - Output range start
 * @param {number} stop2 - Output range end
 * @param {number} withinBounds - Whether the output should be clamped between start2 and stop2
 * @returns Mapped value
 */
export function inverseSquareMap (n, start1, stop1, start2, stop2, clampOutput = false) {
  return curveMap(n, start1, stop1, start2, stop2, clampOutput, 0.33)
}

/**
 * Remaps a value from one range to another using an exponential curve
 * https://www.desmos.com/calculator/zt4ghiba0g
 * @param {number} n - The value to map
 * @param {number} start1 - Input range start
 * @param {number} stop1 - Input range end
 * @param {number} start2 - Output range start
 * @param {number} stop2 - Output range end
 * @param {number} withinBounds - Whether the output should be clamped between start2 and stop2
 * @param {number} exponent - Defines the shape of the curve; Should be in range (-1, 1)
 * @returns Mapped value
 */
export function exponentialMap (n, start1, stop1, start2, stop2, clampOutput = false, exponent = 0.5) {
  let x = map(n, start1, stop1, 0, 1, false)
  x = Math.pow(x, (1 / ((exponent / -2) + 0.5)) - 1)
  return map(x, 0, 1, start2, stop2, clampOutput)
}

/**
 * Remaps a value from one range to another using an S-curve
 * https://www.desmos.com/calculator/psed9ey8jy
 * @param {number} n - The value to map
 * @param {number} start1 - Input range start
 * @param {number} stop1 - Input range end
 * @param {number} start2 - Output range start
 * @param {number} stop2 - Output range end
 * @param {number} withinBounds - Whether the output should be clamped between start2 and stop2
 * @param {number} curveFactor - Defines the shape of the S-curve; Should be in range (-1, 1)
 * @returns Mapped value
 */
export function curveMap (n, start1, stop1, start2, stop2, clampOutput = false, curveFactor = 0.5) {
  let x = map(n, start1, stop1, 0, 1, false)
  const k = curveFactor
  if (x < 0.5) {
    x = Math.min(((k * 2 * x - 2 * x) / (2 * k * 2 * x - k - 1)) * 0.5, 0.5)
  } else {
    x = Math.max(((-k * 2 * (x - 0.5) - 2 * (x - 0.5)) / (2 * -k * 2 * (x - 0.5) + k - 1)) * 0.5 + 0.5, 0.5)
  }
  return map(x, 0, 1, start2, stop2, clampOutput)
}

/**
 * Returns -1, 0, or 1 based on the sign of x
 * @param {number} x
 * @returns -1, 0, or 1 based on the sign of x
 */
export function sign (x) {
  return x && (x > 0 ? 1 : -1)
}

/**
 * Creates an evenly-spaced list of numbers between two values
 * @param {number} start Start value
 * @param {number} end End value
 * @param {number} iter Spacing between values
 * @returns List of ranged values in the range [start, end)
 */
export function range (start, end, iter = 1) {
  return new Array(Math.ceil((end - start) / iter)).fill(0).map((_, i) => (
    start + (i * iter)
  ))
}

/********************************************************************************
Vectors
********************************************************************************/

/**
 * Based on args does either 2d or 3d distance
 * The following are accepted:
 *   two 2D vectors
 *   two 3D vectors
 *   four numbers that make up 2 2D vectors
 *   six numbers that make up 2 3D vectors
 * @returns {number} Euclidian distance
 */
export function distance (...args) {
  if (args.length === 2) {
    if (args[0].length === 2 && args[1].length === 2) {
      return distance2D(...args[0], ...args[1])
    } else if (args[0].length === 3 && args[1].length === 3) {
      return distance3D(...args[0], ...args[1])
    }
  }

  if (args.length === 4) {
    return distance2D(...args)
  }

  if (args.length === 6) {
    return distance3D(...args)
  }

  throw new Error(`Arity not four or six! Given ${JSON.stringify(args)}`)
}

/**
 * Finds the distance between two 2D vectors
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns Euclidean distance
 */
export function distance2D (x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

/**
 * Finds the distance between two 3D vectors
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns Euclidean distance
 */
export function distance3D (x1, y1, z1, x2, y2, z2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2)
}

/********************************************************************************
Random Number Generation
********************************************************************************/

function * randomGenerator (seed = 0) {
  const m = BigInt(4294967296) // 2^32
  const a = BigInt(1664525)
  const c = BigInt(1013904223)

  let currentSeed = BigInt(seed)

  while (true) {
    currentSeed = (a * currentSeed + c) % m
    yield Number(currentSeed) / Number(m)
  }
}

/**
 * Returns a function that generates random numbers between `low` and `high`.
 *
 * @param {number} [seed=0] - The seed value to initialize the random number generator.
 * @returns {function(): number} - A function that generates random numbers between `low` and `high`.
 */
export function randomizer (seed = 0) {
  const r = randomGenerator(seed)
  return function (low = 0, high = 1) {
    return r.next().value * (high - low) + low
  }
}

/**
 * Returns a random number between `low` and `high`.
 *
 * @param {number} [low=0] - The lower bound of the range of random numbers.
 * @param {number} [high=1] - The upper bound of the range of random numbers.
 * @returns Random number between `low` and `high`.
 */
export const random = randomizer()

/**
 * Returns a random element in the given array, with the given randomness function.
 *
 * @param {array} element - The list of elements to choose from.
 * @param {function} rand - The randomness function to use when choosing.
 * @returns Random element from given array.
 */
export function choose (elements, rand = random) {
  return elements[Math.min(Math.floor(rand(0, elements.length)), elements.length - 1)]
}

/**
 * Shuffles the given array in-place.
 *
 * @param {array} element - The list to be shuffled.
 * @param {function} rand - The randomness function to use when choosing.
 * @returns The given array.
 */
export function shuffle (array, rand = random) {
  let currentIndex = array.length
  while (currentIndex > 0) {
    const randomIndex = Math.floor(rand() * currentIndex)
    currentIndex -= 1
    ;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
  }
  return array
}

/**
 * Generates a pseudo-random number from a 2D/3D coordinate
 * from https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
 * @param {array} vector
 * @returns A pseudo-random number
 */
export function hashVector (vector) {
  let hash = 0
  for (const element of vector) {
    hash = ((hash << 5) - hash) + element
    hash |= 0
  }
  return hash
}

/**
 * Picks a random object from a list using weights
 * For example: An object of weight 6 is twice as likely to be picked as an object of weight 3
 * @param {array} list - List of objects that have a 'weight' property
 * @returns A random object from the list
 */
export function weightedPick (list, rand = random) {
  // Filter out objects with no weight
  list = list.filter(x => x.weight && typeof x.weight === 'number')

  // If list is empty, return
  if (list.length === 0) {
    return undefined
  }

  // Determine the total weight
  let total = 0
  for (const obj of list) {
    total += obj.weight
  }

  // Generate a random number based on the total
  let selection = rand() * total

  // Use the random number to make a selection
  for (const obj of list) {
    selection -= obj.weight
    if (selection < 0) {
      return obj
    }
  }

  // Default return
  return list[0]
}

/********************************************************************************
Color
********************************************************************************/

/**
 * Converts an RGB color to an HSV color
 * @param {array} rgb RGB color vector
 * @returns HSV color vector
 */
export function rgbToHsv ([r, g, b]) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const v = max
  const d = max - min
  let h
  let s

  if (max === min) {
    h = 0 // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }

    h /= 6
  }

  return [h, s, v]
}

/**
 * Converts an HSV color to an RGB color
 * @param {array} hsv HSV vector
 * @returns RGB color vector
 */
export function hsvToRgb ([h, s, v]) {
  let r
  let g
  let b
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }

  return [r, g, b]
}

/**
 * Converts an RGB vector and an alpha value into an RGBA string for use in canvas style functions
 * @param {array} rgba - RGB vector with optional fourth alpha component, all in 0-1 range
 * @returns Canvas/CSS style string
 */
export function colorToString ([r, g, b, a = 1]) {
  r = Math.floor(r * 255)
  g = Math.floor(g * 255)
  b = Math.floor(b * 255)
  return `rgba(${r}, ${g}, ${b}, ${a || 1})`
}

export function stringToColor (hex, mod = []) {
  if (hex[0] !== '#') { hex = '#' + hex }
  mod[0] = parseInt(hex.slice(1, 3), 16) / 255
  mod[1] = parseInt(hex.slice(3, 5), 16) / 255
  mod[2] = parseInt(hex.slice(5, 7), 16) / 255
  mod[3] = hex.length > 7 ? parseInt(hex.slice(7, 9), 16) / 255 : 1
  return mod
}

export function lerpStringToColor (str1, str2, t) {
  return lerpArray(stringToColor(str1), stringToColor(str2), t)
}

/********************************************************************************
Noise
********************************************************************************/

export function noise (x, y = 0, z = 0) {
  const random = (x, y, z) => {
    const angle = (
      Math.sin(x * 1074 + y * 210) +
      Math.sin(y * 2321 + z * 302) +
      Math.sin(z * 543 + x * 3043) +
      Math.sin(z * 1003)
    )
    return Math.sin(angle * 512)
  }

  const fx = x >= 0 ? Math.floor(x) : Math.ceil(x)
  const fy = x >= 0 ? Math.floor(y) : Math.ceil(y)
  const fz = x >= 0 ? Math.floor(z) : Math.ceil(z)

  const v1 = lerp(random(fx, fy, fz), random(fx + 1, fy, fz), x % 1)
  const v2 = lerp(random(fx, fy + 1, fz), random(fx + 1, fy + 1, fz), x % 1)
  const v3 = lerp(v1, v2, y % 1)

  if (z % 1 !== 0) {
    // interpolate between different z levels, if a z is specified
    const v4 = lerp(random(fx, fy, fz + 1), random(fx + 1, fy, fz + 1), x % 1)
    const v5 = lerp(random(fx, fy + 1, fz + 1), random(fx + 1, fy + 1, fz + 1), x % 1)
    const v6 = lerp(v4, v5, y % 1)
    return lerp(v3, v6, z % 1)
  }

  // otherwise just return 2D noise
  return v3
}

export function octaveNoise (x, y = 0, z = 0, octaves = 4) {
  let value = 0
  let total = 0

  for (let o = 1; o <= octaves; o += 1) {
    const f = Math.pow(0.5, o)
    value /= 2
    total /= 2
    value += noise(x * f, y * f, z * f)
    total += 1
  }

  return value / total
}

/********************************************************************************
Spatial Grid
********************************************************************************/

// assuming row-major with perfectly square chunks
export function chunkGridToSpatialGrid (chunkGrid) {
  const result = {}
  for (const [chunkCoordString, chunk] of Object.entries(chunkGrid)) {
    const chunkCoord = chunkCoordString.split(',').map(Number)
    const chunkSize = Math.sqrt(chunk.length)
    for (let i = 0; i < chunk.length; i += 1) {
      if (!chunk[i]) { continue }
      const coord = [
        i % chunkSize + chunkCoord[0],
        Math.floor(i / chunkSize) + chunkCoord[1]
      ]
      result[coord] = chunk[i]
    }
  }
  return result
}

// turns a spatial grid into a chunk grid of square chunks
export function spatialGridToChunkGrid (spatialGrid, chunkSize = 64) {
  const chunkGrid = {}
  for (const tileCoordString of Object.keys(spatialGrid)) {
    const tileCoord = tileCoordString.split(',').map(Number)
    const chunkCoord = tileCoord.map(x => Math.floor(x / chunkSize))
    if (!chunkGrid[chunkCoord]) {
      chunkGrid[chunkCoord] = Array(chunkSize ** 2).fill(0)
    }
    const chunk = chunkGrid[chunkCoord]
    chunk[tileCoord[0] + tileCoord[1] * chunkSize] = spatialGrid[tileCoordString]
  }
  return chunkGrid
}

/********************************************************************************
AABBs
********************************************************************************/

/* determine whether to use 2D or 3D intersection on-the-fly based on
the arguments provided */
export function checkAabbIntersection (aabb1, aabb2, p1 = [0, 0], p2 = [0, 0]) {
  // both AABBs are 3D
  if (aabb1.length === 6 &&
      aabb2.length === 6 &&
      p1[2] !== undefined &&
      p2[2] !== undefined) {
    return checkAabbIntersection3D(aabb1, aabb2, p1, p2)
  }

  // standard 2D intersection
  aabb1 = aabb2D(aabb1)
  aabb2 = aabb2D(aabb2)
  return checkAabbIntersection2D(aabb1, aabb2, p1, p2)
}

export function checkAabbIntersection2D (aabb1, aabb2, p1 = [0, 0], p2 = [0, 0]) {
  const [x1, y1] = p1
  const [x2, y2] = p2
  return (
    aabb1[0] + x1 <= aabb2[2] + x2 &&
    aabb1[1] + y1 <= aabb2[3] + y2 &&
    aabb1[2] + x1 >= aabb2[0] + x2 &&
    aabb1[3] + y1 >= aabb2[1] + y2
  )
}

export function checkAabbIntersection3D (aabb1, aabb2, p1 = [0, 0, 0], p2 = [0, 0, 0]) {
  const [x1, y1, z1] = p1
  const [x2, y2, z2] = p2
  return (
    aabb1[0] + x1 <= aabb2[3] + x2 &&
    aabb1[1] + y1 <= aabb2[4] + y2 &&
    aabb1[2] + z1 <= aabb2[5] + z2 &&
    aabb1[3] + x1 >= aabb2[0] + x2 &&
    aabb1[4] + y1 >= aabb2[1] + y2 &&
    aabb1[5] + z1 >= aabb2[2] + z2
  )
}

// convert AABB to a 2D AABB
export function aabb2D (aabb) {
  if (aabb.length === 6) {
    return [aabb[0], aabb[1], aabb[3], aabb[4]]
  }

  if (aabb.length === 4) {
    return aabb
  }

  throw new Error(`AABB ${JSON.stringify(aabb)} is neither 2D nor 3D!`)
}

// convert AABB (and position) into an XYWH (x, y, width, height)
export function aabbToXywh (aabb, position = [0, 0, 0]) {
  if (aabb.length === 6) {
    return [
      aabb[0] + position[0],
      aabb[1] + position[1],
      aabb[2] + position[2],
      aabb[3] - aabb[0],
      aabb[4] - aabb[1],
      aabb[5] - aabb[2]
    ]
  }

  if (aabb.length === 4) {
    return [
      aabb[0] + position[0],
      aabb[1] + position[1],
      aabb[2] - aabb[0],
      aabb[3] - aabb[1]
    ]
  }

  throw new Error(`AABB ${JSON.stringify(aabb)} is neither 2D nor 3D!`)
}

/*
   Return an AABB in the form of [-w / 2, -h / 2, w / 2, h / 2]
   from a list of points given as [x, y], [x, y], [x, y]
*/
export function getAabbFromPoints (...points) {
  const { width, height } = getWidthAndHeightFromPoints(points)
  return [-width / 2, -height / 2, width / 2, height / 2]
}

export function getWidthAndHeightFromPoints (...points) {
  let xMin = Infinity
  let yMin = Infinity
  let xMax = -1 * Infinity
  let yMax = -1 * Infinity
  for (const point of points) {
    xMin = Math.min(xMin, point[0])
    yMin = Math.min(yMin, point[1])
    xMax = Math.max(xMax, point[0])
    yMax = Math.max(yMax, point[1])
  }
  const width = xMax - xMin
  const height = yMax - yMin
  return { width, height }
}

/********************************************************************************
Programming Helpers
********************************************************************************/

/**
 * Wraps a function so that its return values are cached based on its parameters
 * @param {*} fn - The function to wrap
 * @param {*} maxEntries - Max entries in cache
 * @returns Wrapped function
 */
export function memoize (fn, maxEntries = 1024) {
  const makeMap = x => typeof x === 'object' ? new WeakMap() : new Map()
  let rootCache
  const limitSize = (cache) => {
    if (cache.size === undefined) { return }
    for (const [key] of cache) {
      if (cache.size <= maxEntries) { break }
      cache.delete(key)
    }
  }
  return (...args) => {
    if (!rootCache) {
      rootCache = makeMap(args[0])
    }
    let cache = rootCache
    for (let i = 0; i < args.length - 1; i++) {
      const arg = args[i]
      if (!cache.has(arg)) {
        cache.set(arg, makeMap(args[i + 1]))
        limitSize(cache)
      }
      cache = cache.get(arg)
    }
    if (!cache.has(args.at(-1))) {
      cache.set(args.at(-1), fn(...args))
      limitSize(cache)
    }
    return cache.get(args.at(-1))
  }
}
