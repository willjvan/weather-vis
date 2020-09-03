var drawWaveFragSource = `
    precision mediump float;

    uniform vec2 u_resolution;
    uniform sampler2D u_wind;
    uniform sampler2D u_map;

    varying vec2 v_texCoord;

    vec4 texture2D_bilinear(sampler2D t, vec2 uv, vec2 textureSize, vec2 texelSize) {
        vec4 tl = texture2D(t, uv);
        vec4 tr = texture2D(t, uv + vec2(texelSize.x, 0.0));
        vec4 bl = texture2D(t, uv + vec2(0.0, texelSize.y));
        vec4 br = texture2D(t, uv + vec2(texelSize.x, texelSize.y));
        vec2 f = fract( uv * textureSize );
        vec4 tA = mix( tl, tr, f.x );
        vec4 tB = mix( bl, br, f.x );
        return mix( tA, tB, f.y );
    }

    void main() {
        vec4 color = texture2D_bilinear(u_wind, v_texCoord, u_resolution, (1.0/u_resolution));
        vec4 map = texture2D_bilinear(u_map, v_texCoord, u_resolution, (1.0/u_resolution));
        gl_FragColor = vec4(color.r, color.g, color.b, 1.0);
    }
`;
