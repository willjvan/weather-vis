var drawWaveVertSource = `
    precision mediump float;

    attribute vec2 a_position;
    attribute vec2 a_texCoord;

    uniform sampler2D u_wave;
    uniform mat4 u_matrix;
    uniform vec2 u_resolution;

    varying vec2 v_texCoord;

    void main() {
        v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
        
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
     
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        //gl_Position = vec4(a_position,0,1);
    }
`;
