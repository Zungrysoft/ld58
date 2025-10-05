precision mediump float;

uniform sampler2D texture;
uniform vec4 color;
uniform float scroll;

varying vec2 uv;
varying vec3 normal;
varying vec4 worldPosition;
varying vec4 viewPosition;
varying vec3 origNormal;

float map(float n, float start1, float stop1, float start2, float stop2) {
  return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
}

void main() {
  // Scrolling
  vec2 uv2 = vec2(uv.x, (1.0 - uv.y) - scroll);

  // Get diffuse color
  vec4 diffuse = texture2D(texture, uv2) * color;
  if (diffuse.a == 0.0) { discard; }

  // Apply basic shading
  vec3 shadingAngle = normalize(vec3(0.5, 1.8, 3.0));
  vec4 shaded = vec4(
    diffuse.rgb * map(dot(normal, shadingAngle), -1.0, 1.0, 0.4, 1.0),
    diffuse.a
  );

  gl_FragColor = shaded;
  // gl_FragColor = vec4((normal+1.0)/2.0, 1.0);
}

