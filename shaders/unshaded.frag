precision mediump float;

uniform sampler2D texture;
uniform vec4 color;
uniform float scroll;

varying vec2 uv;
varying vec3 normal;
varying vec4 worldPosition;
varying vec4 viewPosition;
varying vec3 origNormal;

void main() {
  // Scrolling
  vec2 uv2 = vec2(uv.x, (1.0 - uv.y) + scroll);
  
  // Get diffuse color
  vec4 diffuse = texture2D(texture, uv2) * color;
  if (diffuse.a == 0.0) { discard; }

  gl_FragColor = diffuse;
}

