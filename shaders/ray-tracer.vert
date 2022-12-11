#version 100

precision highp float;

attribute vec2   a_position;
// attribute Ball[] a_balls;

varying   vec2 v_position;

void main() {
    v_position  = a_position;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
