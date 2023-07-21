varying highp vec2 outTextureCoord;

uniform sampler2D sampler;

void main(void) {
  gl_FragColor = texture2D(sampler, outTextureCoord);
}
