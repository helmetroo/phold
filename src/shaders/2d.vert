attribute vec4 vertexPos;
attribute vec2 inTextureCoord;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying highp vec2 outTextureCoord;

void main(void) {
  gl_Position = projectionMatrix * modelViewMatrix * vertexPos;
  outTextureCoord = inTextureCoord;
}
