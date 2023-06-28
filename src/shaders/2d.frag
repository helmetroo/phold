varying highp vec2 outTextureCoord;

uniform sampler2D sampler;

void main(void) {
  highp vec4 texelColor = texture2D(sampler, outTextureCoord);
  gl_FragColor = vec4(texelColor.rgb, texelColor.a);
}
