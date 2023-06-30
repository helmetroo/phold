#version 300 es

precision highp float;

in vec2 vertexPos;
in vec2 inTextureCoord;

uniform mat4 modelViewMatrix;

out vec2 outTextureCoord;

void main(void) {
  outTextureCoord = inTextureCoord;
  gl_Position = modelViewMatrix * vec4(vertexPos, 0.0f, 1.0f);
}
