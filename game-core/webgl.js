/** @module webgl */

import { loadObj } from './modelloader.js'
import * as game from './game.js'
import * as vec3 from './vector3.js'

let currentShader

// the vertex format used for .obj files
const defaultVertexFormat = [
  {
    name: 'vertexPosition',
    count: 3
  },

  {
    name: 'vertexTexture',
    count: 2
  },

  {
    name: 'vertexNormal',
    count: 3
  }
]

// returns how many bytes there are in a form
// based off of what data type the form is
function byteOffset (form) {
  const { gl } = game
  let bytes = 1
  if (!form.what) form.what = gl.FLOAT
  if (form.what === gl.FLOAT) {
    bytes = 4
  }
  return form.count * bytes
}

/********************************************************************************
   set and draw graphics primitives
 ********************************************************************************/

/**
 * Sets the value of a uniform variable in the current shader program.
 *
 * @param {string} name - The name of the uniform variable.
 * @param {number[]|Float32Array} value - The value to set.
 * @param {string} [kind='float'] - The type of the uniform variable.
 *
 * @returns {void}
 */
export function set (name, value, kind = 'float') {
  const { gl } = game

  if (Array.isArray(value)) {
    if (value.length === 16) {
      gl.uniformMatrix4fv(gl.getUniformLocation(currentShader, name), false, value)
      return
    }

    if (value.length === 4) {
      gl.uniform4fv(gl.getUniformLocation(currentShader, name), value)
      return
    }

    if (value.length === 3) {
      gl.uniform3fv(gl.getUniformLocation(currentShader, name), value)
      return
    }

    if (value.length === 2) {
      gl.uniform2fv(gl.getUniformLocation(currentShader, name), value)
      return
    }
  }

  if (kind === 'int') {
    gl.uniform1i(gl.getUniformLocation(currentShader, name), value)
    return
  }

  gl.uniform1f(gl.getUniformLocation(currentShader, name), value)
}

/**
 * Sets the current shader program to the specified shader.
 *
 * @param {WebGLProgram} shader - The shader program to set.
 *
 * @returns {void}
 */
export function setShader (shader) {
  const { gl } = game
  currentShader = shader
  gl.useProgram(shader)
}

/**
 * Sets the specified texture to the specified texture unit.
 *
 * @param {WebGLTexture} texture - The texture to set.
 * @param {number} [index=0] - The index of the texture unit.
 *
 * @returns {void}
 */
export function setTexture (texture, index = 0) {
  const { gl } = game
  gl.activeTexture(gl['TEXTURE' + index])
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.activeTexture(gl.TEXTURE0)
}

/**
 * Binds the specified framebuffer to the WebGLRenderingContext.FRAMEBUFFER target.
 *
 * @param {WebGLFramebuffer|null} [fb=null] - The framebuffer to bind.
 *
 * @returns {void}
 */
export function setFramebuffer (fb = null) {
  const { gl } = game
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb?.framebuffer ? fb.framebuffer : fb)
}

/**
 * Draws a mesh using the current shader program.
 *
 * @param {object} mesh - The mesh to draw.
 * @param {string} [drawType='triangles'] - The type of primitive to draw.
 *
 * @returns {void}
 */
export function drawMesh (mesh, drawType = 'triangles') {
  const { gl } = game
  const {
    buffer,
    format,
    verts
  } = mesh
  const shader = currentShader
  let offset = 0

  // count how much data is in one vertex
  let byteStride = 0
  let stride = 0
  for (const form of format) {
    byteStride += byteOffset(form)
    stride += form.count
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  for (const form of format) {
    const location = gl.getAttribLocation(shader, form.name)
    if (location !== -1) {
      gl.vertexAttribPointer(
        location,
        form.count,
        form.what,
        false, // do not normalize
        byteStride,
        offset
      )
      gl.enableVertexAttribArray(location)
    }
    offset += byteOffset(form)
  }

  gl.drawArrays(gl[drawType.toUpperCase()], 0, verts.length / stride)
}

/**
 * Draws a shader over the entire screen.
 */
export function drawScreen() {
  // Draw the quad
  drawQuad(-1, -1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0)
}

let billboardMesh
const triVerts = new Float32Array([
  0, 0, 0, 0, 0, 1, 0, 0,
  0, 0, 1, 0, 1, 1, 0, 0,
  1, 0, 0, 1, 0, 1, 0, 0
])
let triMesh
const quadVerts = new Float32Array([
  0, 0, 0, 0, 0, 1, 0, 0,
  0, 0, 1, 0, 1, 1, 0, 0,
  1, 0, 0, 1, 0, 1, 0, 0,
  1, 0, 1, 1, 1, 1, 0, 0
])
let quadMesh

/**
 * Draws a billboard using the current shader program.
 *
 * @returns {void}
 */
export function drawBillboard () {
  billboardMesh = billboardMesh || createMesh([
    0, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 0, 1, 0, 1, 0, 0,
    0, 0, 0, 0, 1, 1, 0, 0,
    0, 0, 0, 1, 1, 1, 0, 0
  ])
  drawMesh(billboardMesh, 'triangle_strip')
}

/**
 * Draws a triangle using the current shader program in x, y, z, u, v, nx, ny, nz format.
 *
 * @param {...number} points - The vertices of the triangle mesh.
 *
 * @returns {void}
 */
export function drawTri (...points) {
  triMesh = triMesh || createMesh(triVerts, { isStreamed: true })
  if (points) {
    let i = 0
    for (let p = 0; p < points.length; p += 3) {
      triVerts[i] = points[p]
      triVerts[i + 1] = points[p + 1]
      triVerts[i + 2] = points[p + 2]
      i += 8
    }
    modifyMesh(triMesh, triVerts)
  }
  drawMesh(triMesh)
}

/**
 * Draws a quad using the current shader program in x, y, z, u, v, nx, ny, nz format.
 *
 * @param {...number} points - The vertices of the quad mesh.
 *
 * @returns {void}
 */
export function drawQuad (...points) {
  quadMesh = quadMesh || createMesh(quadVerts, { isStreamed: true })
  if (points) {
    let i = 0
    for (let p = 0; p < points.length; p += 3) {
      quadVerts[i] = points[p]
      quadVerts[i + 1] = points[p + 1]
      quadVerts[i + 2] = points[p + 2]
      i += 8
    }
    modifyMesh(quadMesh, quadVerts)
  }
  drawMesh(quadMesh, 'triangle_strip')
}

/**
 * Draws a line between two points with a specified width.
 *
 * @param {number[]} p1 - The first point.
 * @param {number[]} p2 - The second point.
 * @param {number} [w=1] - The width of the line.
 *
 * @returns {number[]} - The cross product of the vector between the two points and the camera's look vector.
 */
export function drawLine (p1, p2, w = 1) {
  const vector = vec3.normalize(vec3.subtract(p1, p2))
  const cross = vec3.normalize(vec3.crossProduct(vector, game.getCamera3D().lookVector))
  cross[0] *= w
  cross[1] *= w
  cross[2] *= w

  drawQuad(
    p1[0] - cross[0], p1[1] - cross[1], p1[2] - cross[2],
    p1[0] + cross[0], p1[1] + cross[1], p1[2] + cross[2],
    p2[0] - cross[0], p2[1] - cross[1], p2[2] - cross[2],
    p2[0] + cross[0], p2[1] + cross[1], p2[2] + cross[2]
  )

  return cross
}

/********************************************************************************
   graphics primitives creation functions
 ********************************************************************************/

/**
 * Compiles and links a shader program from the specified vertex and fragment shader sources.
 *
 * @param {string} vsSource - The vertex shader source code.
 * @param {string} fsSource - The fragment shader source code.
 *
 * @returns {WebGLProgram} - The compiled and linked shader program.
 *
 * @throws {Error} - If the shader program could not be initialized.
 */
export function createShader (vsSource, fsSource) {
  const { gl } = game
  function compileShader (what, source) {
    const shader = gl.createShader(what)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader))
    }

    return shader
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource)
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource)

  // Create the shader program
  const shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram))
  }

  return shaderProgram
}

/**
 * Creates a new texture object and initializes it with the specified image.
 *
 * @param {HTMLImageElement} image - The image to use as the texture.
 * @param {string|{min: string, mag: string}} [filter='nearest'] - The filter to use for minification and magnification.
 * This can also be an object with 'min' and 'mag' properties.
 * @param {boolean} [edgeClamp=false] - Whether to clamp the texture to its edges.
 *
 * @returns {WebGLTexture} - The created texture object.
 *
 * @throws {Error} - If no image is provided.
 */
export function createTexture (image, filter = 'nearest', edgeClamp = false) {
  const { gl } = game
  if (typeof filter === 'string') {
    filter = {
      min: filter,
      mag: filter
    }
  }

  if (!image) console.error(`No image provided! Got ${image} instead!`)
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)

  const level = 0
  const internalFormat = gl.RGBA
  const srcFormat = gl.RGBA
  const srcType = gl.UNSIGNED_BYTE
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    srcFormat,
    srcType,
    image
  )
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[filter.min.toUpperCase()])
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[filter.mag.toUpperCase()])
  if (edgeClamp) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  return texture
}

/**
 * Creates a new mesh object and initializes it with the specified vertices.
 *
 * @param {Float32Array|string} verts - The vertices to use for the mesh. If this is a string, it is parsed in OBJ format.
 * @param {object} [options={}] - The options to use for the mesh.
 * @param {boolean} [options.isStreamed=false] - Whether the mesh is streamed.
 * @param {object[]} [options.format=defaultVertexFormat] - The format of the vertices.
 *
 * @returns {object} - The created mesh object.
 */
export function createMesh (verts, { isStreamed = false, format = defaultVertexFormat } = {}) {
  const { gl } = game
  if (typeof verts === 'string') {
    verts = loadObj(verts, { combine: true, axisMapping: ['x', '-z', 'y'] })
  }

  // make sure verts is a Float32Array
  verts = verts.constructor === Float32Array ? verts : new Float32Array(verts)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    verts,
    isStreamed ? gl.STREAM_DRAW : gl.STATIC_DRAW
  )

  return {
    buffer,
    format,
    verts,
    isStreamed
  }
}

/**
 * Modifies the specified mesh object with the specified vertices.
 *
 * @param {object} mesh - The mesh to modify.
 * @param {Float32Array} verts - The vertices to use for the mesh.
 *
 * @returns {void}
 */
export function modifyMesh (mesh, verts) {
  const { gl } = game
  verts = verts.constructor === Float32Array ? verts : new Float32Array(verts)
  mesh.verts = verts

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    verts,
    mesh.isStreamed ? gl.STREAM_DRAW : gl.STATIC_DRAW
  )
}

/**
 * Creates a new framebuffer object and initializes it with the specified texture.
 *
 * @returns {object} - The created object that stores the framebuffer and texture.
 */
export function createFramebuffer () {
  const { gl } = game
  const { width, height } = game.config

  // create the texture that the framebuffer renders to
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  )
  // gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const renderbuffer = gl.createRenderbuffer()
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, width, height)

  // create the framebuffer, and bind the texture to it
  const framebuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, renderbuffer)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  return {
    framebuffer,
    texture,
  }
}

export function createDepthbuffer() {
  const { gl } = game
  const { width, height } = game.config

  // create the texture that the framebuffer renders to
  const depthTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, depthTexture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.DEPTH_COMPONENT,
    width,
    height,
    0,
    gl.DEPTH_COMPONENT,
    gl.UNSIGNED_INT,
    null
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  // create the framebuffer, and bind the texture to it
  const framebuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  return {
    framebuffer,
    depthTexture,
  }
}

export function createFramebufferWithDepth() {
  const { gl } = game;
  const { width, height } = game.config;

  // Create the framebuffer
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  // Create the color texture
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  // Create the depth texture
  const depthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {
    framebuffer,
    texture,
    depthTexture,
  };
}

export function clearFramebuffer () {
  const { gl } = game
  gl.clearColor(0.25, 0.5, 1, 1)
  gl.clearDepth(1.0)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.enable(gl.BLEND)
  gl.blendEquation(gl.FUNC_ADD)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
}

