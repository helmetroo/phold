attribute vec2 vertexPos;
attribute vec2 inTextureCoord;

varying highp vec2 outTextureCoord;

void main(void) {
  outTextureCoord = inTextureCoord;
  gl_Position = vec4(vertexPos, 0.0, 1.0);
}
