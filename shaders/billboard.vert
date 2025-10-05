attribute vec4 vertexPosition;
attribute vec2 vertexTexture;
attribute vec3 vertexNormal;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying vec2 uv;
varying vec3 normal;
varying vec4 worldPosition;
varying vec4 viewPosition;
varying vec3 origNormal;

void main() {
  normal = (modelMatrix * vec4(vertexNormal.xyz, 1.0)).xyz;
  uv = vertexTexture;

  vec4 position = vertexPosition;
  position += (vertexTexture.x*-2.0 +1.0)  * vec4(viewMatrix[0].x, viewMatrix[1].x, viewMatrix[2].x, 0.0) * vertexNormal.x;
  position += (vertexTexture.y*-2.0 +1.0) * vec4(viewMatrix[0].y, viewMatrix[1].y, viewMatrix[2].y, 0.0) * vertexNormal.x;

  origNormal = vertexNormal;
  worldPosition = modelMatrix * vertexPosition;
  viewPosition = viewMatrix * worldPosition;

  gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
}
