attribute vec4 vertexPosition;
attribute vec2 vertexTexture;

varying vec2 vTexCoord;

void main() {
    vTexCoord = vertexTexture;
    gl_Position = vertexPosition;
}
