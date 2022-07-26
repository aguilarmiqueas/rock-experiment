varying float vOpacity;

void main () {
  vec2 p = 2. * (gl_PointCoord - .5);
  float opacity = .1 / length(p.xy);

  // float strength = .1 / length(p.xy)
  vec3 color = vec3(1. - length(p.xy));
  color *=  vec3(0.82, 0.61, 0.35);
  opacity *= vOpacity;

  gl_FragColor = vec4(color, opacity);
}