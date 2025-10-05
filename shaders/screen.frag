precision highp float;

uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform sampler2D colorTextureUnshaded;
uniform sampler2D depthTextureUnshaded;
uniform mat4 projectionMatrix;
uniform float fogDistance;
uniform vec3 fogColor;

varying vec2 vTexCoord;

// Finds the inverse of a mat4
mat4 inverse(mat4 m) {
    float
        a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
        a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
        a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
        a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    return mat4(
        a11 * b11 - a12 * b10 + a13 * b09,
        a02 * b10 - a01 * b11 - a03 * b09,
        a31 * b05 - a32 * b04 + a33 * b03,
        a22 * b04 - a21 * b05 - a23 * b03,
        a12 * b08 - a10 * b11 - a13 * b07,
        a00 * b11 - a02 * b08 + a03 * b07,
        a32 * b02 - a30 * b05 - a33 * b01,
        a20 * b05 - a22 * b02 + a23 * b01,
        a10 * b10 - a11 * b08 + a13 * b06,
        a01 * b08 - a00 * b10 - a03 * b06,
        a30 * b04 - a31 * b02 + a33 * b00,
        a21 * b02 - a20 * b04 - a23 * b00,
        a11 * b07 - a10 * b09 - a12 * b06,
        a00 * b09 - a01 * b07 + a02 * b06,
        a31 * b01 - a30 * b03 - a32 * b00,
        a20 * b03 - a21 * b01 + a22 * b00) / det;
}

float mod2(float a, float b) {
    float m = a - floor((a + 0.5) / b) * b;
    return floor(m + 0.5);
}

int mod2(int a, int b) {
    return (a)-((a)/(b))*(b);
}

// Converts rgb to hsv
vec3 rgb_to_hsv(vec3 rgb) {
    float r = rgb.r;
    float g = rgb.g;
    float b = rgb.b;

    float max_val = max(r, max(g, b));
    float min_val = min(r, min(g, b));
    float diff = max_val - min_val;

    // Hue
    float h = 0.0;
    h = (max_val == r) ? mod2((60.0 * ((g-b)/diff) + 360.0), 360.0) : h;
    h = (max_val == g) ? mod2((60.0 * ((b-r)/diff) + 120.0), 360.0) : h;
    h = (max_val == b) ? mod2((60.0 * ((r-g)/diff) + 240.0), 360.0) : h;
    h = h / 360.0;

    // Saturation
    float s = (max_val == 0.0) ? 0.0 : diff / max_val;

    // Value
    float v = max_val;

    // Clamp values
    h = max(min(h, 1.0), 0.0);
    s = max(min(s, 1.0), 0.0);
    v = max(min(v, 1.0), 0.0);

    return vec3(h, s, v);
}

// Converts hsv to rgb
vec3 hsv_to_rgb(vec3 hsv) {
  float h = hsv.r;
  float s = hsv.g;
  float v = hsv.b;

	int i = int(floor(h * 6.0));
	float f = h * 6.0 - float(i);
	float p = v * (1.0 - s);
	float q = v * (1.0 - f * s);
	float t = v * (1.0 - (1.0 - f) * s);

  int sw = mod2(i, 6);

  float r = 0.0;
  r = (sw == 0) ? v : r;
  r = (sw == 1) ? q : r;
  r = (sw == 2) ? p : r;
  r = (sw == 3) ? p : r;
  r = (sw == 4) ? t : r;
  r = (sw == 5) ? v : r;

  float g = 0.0;
  g = (sw == 0) ? t : g;
  g = (sw == 1) ? v : g;
  g = (sw == 2) ? v : g;
  g = (sw == 3) ? q : g;
  g = (sw == 4) ? p : g;
  g = (sw == 5) ? p : g;

  float b = 0.0;
  b = (sw == 0) ? p : b;
  b = (sw == 1) ? p : b;
  b = (sw == 2) ? t : b;
  b = (sw == 3) ? v : b;
  b = (sw == 4) ? v : b;
  b = (sw == 5) ? q : b;

	return vec3(r, g, b);
}

// Function to retrieve depth from the depth texture
float getDepth(vec2 uv) {
  return texture2D(depthTexture, uv).r;
}
float getDepthUnshaded(vec2 uv) {
  return texture2D(depthTextureUnshaded, uv).r;
}

// Function to calculate the screen-space position from the depth value
vec3 getViewPosition(vec2 uv, float depth) {
  vec4 clipSpacePosition = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  vec4 viewSpacePosition = inverse(projectionMatrix) * clipSpacePosition;
  return viewSpacePosition.xyz / viewSpacePosition.w;
}

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 randomInSphere(vec2 seed) {
    float u = fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
    float v = fract(sin(dot(seed + u, vec2(63.7264, 10.873))) * 73156.8475);
    float w = fract(sin(dot(seed + v, vec2(25.7837, 30.9583))) * 69381.0073);

    float theta = 2.0 * 3.1415926535897932384626433832795 * u;
    float phi = acos(2.0 * v - 1.0);
    float r = pow(w, 1.0 / 3.0);

    vec3 point = r * vec3(sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi));

    return point;
}

vec3 randomPosition(vec3 position, vec2 uv) {
    return position + (randomInSphere(uv) * 0.08);
}

// Function to calculate the SSAO factor
float computeSSAO(vec2 uv, vec3 position) {
  vec2 uv2 = uv * 2.0 - 1.0;
  float occlusion = 0.0;
  const int samples = 256;
  for (int i = 0; i < samples; i++) {
    // Sampled position
    vec3 samplePosition = randomPosition(position, uv + float(i));

    // Offset of sampled position in screen space
    vec2 offset = (samplePosition.xy - position.xy) * projectionMatrix[0][0] / position.z;

    // Determine true depth at the sample's screen position
    float sampleTrueDepth = getDepth(uv + offset);

    // Get the position of the sample with the true depth
    vec3 sampleTruePosition = getViewPosition(uv + offset, sampleTrueDepth);

    // If the sample point is closer, increment the occlusion
    occlusion = (length(sampleTruePosition) < length(samplePosition)) ? occlusion + 1.0 : occlusion;
  }
  return occlusion / float(samples);
}

float round (float n) {
  return floor(n + 0.5);
}

void main() {
  float depth = getDepth(vTexCoord);
  float depthUnshaded = getDepthUnshaded(vTexCoord);
  vec3 position;
  vec3 shadedColor = vec3(1.0, 1.0, 1.0);
  float ao = 0.0;
  float alpha = 1.0;
  if (depth <= depthUnshaded) {
    position = getViewPosition(vTexCoord, depth);

    ao = pow(computeSSAO(vTexCoord, position), 1.6) + 0.1;

    // Retrieve the base color from the texture
    vec4 baseColor = texture2D(colorTexture, vTexCoord);

    // Add AO
    shadedColor = baseColor.rgb * (1.3 - ao*1.5);
    alpha = baseColor.a;
  }
  else {
    position = getViewPosition(vTexCoord, depthUnshaded);

    vec4 baseColor = texture2D(colorTextureUnshaded, vTexCoord);
    shadedColor = baseColor.rgb;
    alpha = baseColor.a;
  }

  // Add Fog
  float fogFactor = min(length(position) / fogDistance, 1.0);
  vec3 foggedColor = shadedColor.rgb * (1.0 - fogFactor) + fogColor * fogFactor;

  // Conform to palette
  vec3 hsvColor = rgb_to_hsv(foggedColor);
  float hueRange = 16.0;
  float paletteRange = 13.0;
  float exponent = 0.5;
  vec3 palettizedColorHSV = vec3(
    round(hsvColor.r * hueRange) / hueRange,
    ceil((hsvColor.g + ao*0.5) * paletteRange) / paletteRange,
    pow(floor(pow(hsvColor.b, exponent) * paletteRange) / paletteRange, 1.0 / exponent)
  );
  vec3 palettizedColor = hsv_to_rgb(palettizedColorHSV);

  // Output
  gl_FragColor = vec4(palettizedColor, alpha);
}