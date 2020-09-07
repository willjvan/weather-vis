var drawUnitFragSource = `
    precision mediump float;

    uniform vec2 u_resolution;
    uniform float u_hues[12];

    varying vec4 v_pos;

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
        float x = v_pos.x;
        highp int index = int(floor(11.0 * v_pos.x/u_resolution.x));
        vec3 rgb;
        for (int i = 0; i < 12; i++) {
            if (index == i) {
                rgb = hsv2rgb(vec3(u_hues[i]/360.0, 1.0, 1.0));
                break;
            }
        }
        gl_FragColor = vec4(rgb, 1.0);
    }
`;