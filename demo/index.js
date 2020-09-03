// webgl variables
var positionBuffer;
var textureBuffer;
var images;
var map;
var mapTexture;
var drawProgram;
var unit;

// canvas variables
var width;
var height;
var pct;

// animation variables
var lastTime;
var currentTime;


window.onload = function() {
    weatherCanvas = document.getElementById('weatherVis'); 
    unitCanvas = document.getElementById('unitVis');
    context = unitCanvas.getContext('2d');
    gl = weatherCanvas.getContext('webgl');

    unit = 1;
    lastTime = performance.now();
    width = 360;
    height = 181;
    pct = .8;


    setupCanvas();
    setupAnimation();
    window.requestAnimationFrame(draw);
}

window.onresize = function() {
    setupCanvas();
    var posData = [
        0, 0,
        width, height,
        width, 0,
        0, 0,
        width, height,
        0, height,
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(posData), gl.STATIC_DRAW);
}

function drawUnits() {
    context.clearRect(0, 0, unitCanvas.width, unitCanvas.height);

    var space = 10;
    var xOff = (unitCanvas.width - weatherCanvas.width)/2; // top left corner of
    var yOff = (unitCanvas.height - weatherCanvas.height)/2; // the webgl frame

    var lat = ["90N", "60N", "30N", "EQ", "30S", "60S", "90S"];
    var lon = ["0", "60E", "120E", "180", "120W", "60W","0"];
    
    var index = 0;
    context.textAlign = "right";
    for (var i = yOff; i <= yOff + weatherCanvas.height; i += weatherCanvas.height/6) {
        var a = { x: xOff + 3 - space, y: i }
        var b = { x: xOff + 5 - space, y: i }
        var t = { x: xOff-space, y: i + 2 }
        context.beginPath(); 
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
        context.fillText(lat[index], t.x, t.y);
        index ++;
    }

    index = 0;
    context.textAlign = "center";
    for (var i = xOff; i <= xOff + weatherCanvas.width; i += weatherCanvas.width/6) {
        var a = { x: i, y: yOff + weatherCanvas.height+3}
        var b = { x: i, y: yOff + weatherCanvas.height+5}
        var t = { x: i, y: yOff + weatherCanvas.height + space*1.5}
        context.beginPath(); 
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
        context.fillText(lon[index], t.x, t.y);
        index++;
    }
}

function setupCanvas() {
    var newWidth = pct * window.innerWidth;
    var scale = newWidth / width;
    var newHeight = height * scale;
    width = newWidth;
    height = newHeight;
    weatherCanvas.width = width;
    weatherCanvas.height = height;
    unitCanvas.width = window.innerWidth;
    unitCanvas.height = height + 100;
    context.strokeStyle = "#303030";
    context.font = "10px Arial";
}

function setupBuffers() {
    var posData = [
        0, 0,
        width, height,
        width, 0,
        0, 0,
        width, height,
        0, height,
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

function setupTextures() {
    map = document.getElementById("worldMap");
    images = [];
    for (var i = 1; i < 29; i++) {
        images[i] = createTexture(gl.LINEAR, document.getElementById("windImage" + i));
    }
    for (var i = 1; i < 29; i++) {
        activateTexture(images[i], i);
    }
    mapTexture = createTexture(gl.LINEAR, map);
    activateTexture(mapTexture, 0);
}

function setupAnimation() {
    drawProgram = createProgram(drawWaveVertSource, drawWaveFragSource);
    setupBuffers();
    setupTextures();
}

function draw() {
    drawUnits();    
    currentTime = performance.now();
    var timeDiff = (currentTime - lastTime)/1000; // ms

    if (timeDiff > .1) {
        if (unit == 28) {
            unit = 1;
        }
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        drawTexture();
        lastTime = performance.now();
        unit++;
    }
    window.requestAnimationFrame(draw);
}

function drawTexture() {
    gl.useProgram(drawProgram);
    bindAttribute(positionBuffer, gl.getAttribLocation(drawProgram, "a_position"), 2);
    bindAttribute(textureBuffer, gl.getAttribLocation(drawProgram, "a_texCoord"), 2);
    gl.uniform1i(gl.getUniformLocation(drawProgram, "u_wind"), unit);
    gl.uniform1i(gl.getUniformLocation(drawProgram, "u_map"), 0);
    gl.uniform2f(gl.getUniformLocation(drawProgram, "u_resolution"), gl.canvas.width, gl.canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}