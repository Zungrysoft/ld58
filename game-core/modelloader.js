/** @module modelloader */

/**
 * Loads an object from a file string.
 *
 * @param {string} fileString - The file string to load the object from.
 * @param {Object} [options={}] - The options object.
 * @param {boolean} [options.axisMapping=['x', 'y', 'z']] - Which axis to use as the left, forward, and up axes.
 * @param {boolean} [options.combine=false] - Whether to combine all objects into one.
 * @returns {(Object|Array)} The loaded object or array of vertices.
 */
export function loadObj (fileString, options = {}) {
  const positions = []
  const uvs = []
  const normals = []
  const objects = {}
  let currentObject

  const makeObject = (name) => {
    objects[name] = {
      verts: [],
      positions: [],
      uvs: [],
      normals: [],
      lines: [],
      name
    }
    currentObject = objects[name]
  }
  makeObject('default')

  for (const line of fileString.split(/\r?\n/)) {
    const words = line.split(/ +/)

    if (words[0] === 'o') {
      makeObject(words[1])
      continue
    }

    if (words[0] === 'usemtl') {
      currentObject.material = words[1]
    }

    if (words[0] === 'f') {
      const verts = words.slice(1) // list of v/vt/vn triplets

      // simple convex triangulation
      for (let i = 2; i < verts.length; i++) {
        for (let vert of [verts[0], verts[i - 1], verts[i]]) {
          vert = vert.split('/').map(x => Number(x) - 1)
          currentObject.verts.push(
            ...positions[vert[0]],
            ...uvs[vert[1]],
            ...normals[vert[2]]
          )
        }
      }
      continue
    }

    const value = words.slice(1).map(Number)

    if (words[0] === 'l') {
      currentObject.lines.push(value.map(i => positions[i]))
      continue
    }

    const getAxisValue = (vector, axis) => {
      if (axis === '-x') {return -vector[0]}
      if (axis === 'y') {return vector[1]}
      if (axis === '-y') {return -vector[1]}
      if (axis === 'z') {return vector[2]}
      if (axis === '-z') {return -vector[2]}
      return vector[0]
    }

    if (words[0] === 'v') {
      if (options.axisMapping) {
        let valueSave = [...value]
        value[0] = getAxisValue(valueSave, options.axisMapping[0])
        value[1] = getAxisValue(valueSave, options.axisMapping[1])
        value[2] = getAxisValue(valueSave, options.axisMapping[2])
      }
      positions.push(value)
      currentObject.positions.push(value)
      continue
    }

    if (words[0] === 'vt') {
      uvs.push(value)
      currentObject.uvs.push(value)
      continue
    }

    if (words[0] === 'vn') {
      if (options.axisMapping) {
        let valueSave = [...value]
        value[0] = getAxisValue(valueSave, options.axisMapping[0])
        value[1] = getAxisValue(valueSave, options.axisMapping[1])
        value[2] = getAxisValue(valueSave, options.axisMapping[2])
      }
      normals.push(value)
      currentObject.normals.push(value)
      continue
    }
  }

  if (options.combine) {
    const result = []
    for (const name in objects) {
      result.push(...objects[name].verts)
    }
    return result
  }

  return objects
}
