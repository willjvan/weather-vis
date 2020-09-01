var positionBuffer;
var textureBuffer;
var windImage;
var windImages;
var currentImage;
var drawProgram;
var width;
var height;
var lastTime;
var currentTime;

class Node {
    constructor(element, next) {
        this.element = element;
        this.next = next;
    }
}

class LinkedList {
    constructor() {
        this.head = null;
        this.last = null;
        this.size = 0;
    }
    add(element) {
        if (this.head == null){
            var node = new Node(element, node);
            this.head = node;
            this.last = node;
            this.size++;
        } else {
            if (this.size == 1) {
                var node = new Node(element, this.head);
                this.head.next = node;
                this.last = node;
            } else {
                var node = new Node(element, this.head);
                this.last.next = node;
                this.last = node;
            }
            this.size++;
        }
    }
    getHead() {
        return this.head;
    }
}

window.onload = function() {
    lastTime = performance.now();
    canvas = document.getElementById('weatherAnim'); 
    width = 360;
    height = 181;
    var pct = .8;
    var newWidth = pct * window.innerWidth;
    var scale = newWidth/width;
    var newHeight = height * scale;
    width = newWidth;
    height = newHeight;
    canvas.width = width;
    canvas.height = height;
    gl = canvas.getContext('webgl');     
    setup();    
    //draw();
    window.requestAnimationFrame(draw);
}

window.onresize = function() {
    width = 360;
    height = 181;
    
    var pct = .8;
    var newWidth = pct * window.innerWidth;
    var scale = newWidth/width;
    var newHeight = height * scale;

    width = newWidth;
    height = newHeight;

    canvas.width = width;
    canvas.height = height;

    var posData = [
        0,0,
        width, height,
        width,0,
        0,0,
        width, height,
        0,height,
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(posData), gl.STATIC_DRAW);

    draw();
}

function setupBuffer() {
    var posData = [
        0,0,
        width, height,
        width,0,
        0,0,
        width, height,
        0,height,
    ];
    var textureData = [
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0,
        
        0.0,  1.0,
        1.0,  0.0,
        0.0,  0.0,
    ];
    positionBuffer = createBuffer(posData);
    textureBuffer = createBuffer(textureData);
}

function setupWave() {
    windImage = document.getElementById("windImage1");
    windImages = new LinkedList;
    for (var i = 1; i < 29; i++) {
        windImages.add(document.getElementById("windImage" + i));
    }
    currentImage = windImages.getHead();
    waveTexture = createTexture(gl.LINEAR, currentImage.element);
    activateTexture(waveTexture, 0);
}

function setup() {
    drawProgram = createProgram(drawWaveVertSource, drawWaveFragSource);
    setupBuffer();
    setupWave();
}

function draw() {
    currentTime = performance.now();
    var timeDiff = (currentTime - lastTime)/1000; // ms
    if (timeDiff > .05) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        currentImage = currentImage.next;
        waveTexture = createTexture(gl.LINEAR, currentImage.element);
        activateTexture(waveTexture, 0);
        drawWave();
        lastTime = performance.now();
    }
    window.requestAnimationFrame(draw);
}

function drawWave() {
    gl.useProgram(drawProgram);
    bindAttribute(positionBuffer, gl.getAttribLocation(drawProgram, "a_position"), 2);
    bindAttribute(textureBuffer, gl.getAttribLocation(drawProgram, "a_texCoord"), 2);
    gl.uniform1i(gl.getUniformLocation(drawProgram, "u_wave"), 0);
    gl.uniform2f(gl.getUniformLocation(drawProgram, "u_resolution"), gl.canvas.width, gl.canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function createTexture(filter, data) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // clamp to edge makes image
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); // or data fit 1 X 1 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); // min and mag filter control how pixels          
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter); // map to texels when of different size
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.bindTexture(gl.TEXTURE_2D, null); 
    return texture;
}

function createBuffer(data) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
}

function createShader(type, source) {
    var shader = gl.createShader(type); 
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.error('ERROR compiling shader', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(vertSource, fragSource) {
    vertexShader = createShader(gl.VERTEX_SHADER, vertSource);
    fragmentShader  = createShader(gl.FRAGMENT_SHADER, fragSource)
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    } 
    console.error('ERROR linking program', gl.getProgramInfoLog);
    gl.deleteProgram(program);
}

function activateTexture(texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
}

function bindAttribute(buffer, attribLocation, numComponents) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(attribLocation);
    gl.vertexAttribPointer(attribLocation, numComponents, gl.FLOAT, false, 0, 0);
}
