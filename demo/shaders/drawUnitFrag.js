var drawUnitFragSource = `
    precision mediump float;
    uniform vec3 u_units[7];

    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;