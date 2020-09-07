var drawUnitVertSource = `
    precision mediump float;

    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform float u_hues[12];

    varying vec4 v_pos;

    void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        v_pos = vec4(a_position.x, a_position.y, 0.0, 1.0);
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
`;