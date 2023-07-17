#version 300 es

precision highp float;

in vec2 vertexPos;
in vec2 inTextureCoord;

out vec2 outTextureCoord;

void main(void) {
  outTextureCoord = inTextureCoord;
  gl_Position = vec4(vertexPos, 0.0f, 1.0f);
}
