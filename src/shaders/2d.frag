#version 300 es

precision highp float;

in vec2 outTextureCoord;
out vec4 outColor;

uniform sampler2D sampler;

void main(void) {
  vec4 texelColor = texture(sampler, outTextureCoord);
  outColor = vec4(texelColor.rgb, texelColor.a);
}
