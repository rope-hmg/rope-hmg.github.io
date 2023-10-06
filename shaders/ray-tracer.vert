#version 300 es

precision highp float;

layout(location=0) in  vec2 a_position;
                   out vec2 v_position;

void main() {
    v_position  = a_position;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
