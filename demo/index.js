var width = 360;
var height = 181;
var canvasPct = .8;
var lastTime;
var currentTime;
var tUnit = 1;

// variables related to weather visualization
vis = {
    canvas: document.getElementById('weatherVis'),
    program: null,
    posBuffer: null,
    texBuffer: null,
    images: [],
    textures: [],
    x: null,
    y: null,
    pct: 0.9,
    width: null,
    height: null,
}

// variables related to unit/colour graphics 
unit = {
    program: null,
    x: null,
    y: null,
    width: null,
    height: null,
    data: [],
}

// all variables related to coordinate graphics
coord = {
    canvas: document.getElementById('unitVis'),
    context: null,
    width: null,
    height: null,
}

window.onload = function() {
    context = coord.canvas.getContext('2d');
    context.strokeStyle = "#303030";
    context.font = "10px Arial";
    gl = vis.canvas.getContext('webgl');
    lastTime = performance.now();
    loadJson(unit, "./data/jsonData/ozone_unit.json");
    loadImages(init, window.requestAnimationFrame);
    format();
}

window.onresize = function() {
    format();
    gl.bindBuffer(gl.ARRAY_BUFFER, vis.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0, width, height, width, 0,
        0, 0, width, height, 0, height,
    ]), gl.STATIC_DRAW);
}

async function loadImages(init, requestFrame) {
    const promiseArray = [];
    const times = ["t00", "t06", "t12", "t18"];
    for (var i = 1; i < 8; i++) {
        for (var t = 3; t >= 0; t--) {
            promiseArray.push(new Promise((resolve) => {
                const img = new Image();
                img.onload = resolve;
                img.src = "./data/imageData/ozone_" + i + "_" + times[t] + ".png";
                vis.images.push(img);
            }));
        }
    }
    await Promise.all(promiseArray);
    init();
    requestFrame(draw);
}

function format() {
    var newWidth = canvasPct * window.innerWidth;
    var scale = newWidth / width;
    var newHeight = height * scale;

    vis.canvas.width = width = newWidth;
    vis.canvas.height = height = newHeight;
    vis.width = width * vis.pct;
    vis.height = height * vis.pct;
    vis.x = width*(1 - vis.pct)/2
    vis.y = height*(1 - vis.pct)/2;

    coord.width = coord.canvas.width = window.innerWidth;
    coord.height = coord.canvas.height = height + 100;

    unit.width = vis.width;
    unit.height = vis.height * .1;
    unit.x = vis.x;
    unit.y = height - vis.y + 5;
}

function init() {
    vis.program = createProgram(drawVisVertSource, drawVisFragSource);
    unit.program  = createProgram(drawUnitVertSource, drawUnitFragSource);
    initBuffers();
    initTextures();
}

function initBuffers() {
    var posData = [
        0, 0, width, height, width, 0,
        0, 0, width, height, 0, height,
    ];
    var textureData = [
        0.0,  1.0, 1.0,  0.0, 1.0,  1.0,
        0.0,  1.0, 1.0,  0.0, 0.0,  0.0,
    ];
    vis.posBuffer = createBuffer(posData);
    vis.texBuffer = createBuffer(textureData);
}

function initTextures() {
    // map = document.getElementById("worldMap");
    for (var i = 1; i < 29; i++) {
        vis.textures[i] = createTexture(gl.LINEAR, vis.images[i-1]);
    }
    for (var i = 1; i < 29; i++) {
        activateTexture(vis.textures[i], i);
    }
    // mapTexture = createTexture(gl.LINEAR, map);
    // activateTexture(mapTexture, 0);
}

function draw() {
    drawCoord();    
    currentTime = performance.now();
    var timeDiff = (currentTime - lastTime)/1000; // seconds
    if (timeDiff > .15) {
        if (tUnit == 28) tUnit = 1;
        gl.viewport(vis.x, vis.y, vis.width, vis.height);
        drawTexture();
        gl.viewport(unit.x, unit.y, unit.width, unit.height);
        drawUnit();
        lastTime = performance.now();
        tUnit++;
    }
    window.requestAnimationFrame(draw);
}

function drawTexture() {
    gl.useProgram(vis.program);
    bindAttribute(vis.posBuffer, gl.getAttribLocation(vis.program, "a_position"), 2);
    bindAttribute(vis.texBuffer, gl.getAttribLocation(vis.program, "a_texCoord"), 2);
    gl.uniform1i(gl.getUniformLocation(vis.program, "u_wind"), tUnit);
    gl.uniform1i(gl.getUniformLocation(vis.program, "u_map"), 0);
    gl.uniform2f(gl.getUniformLocation(vis.program, "u_resolution"), gl.canvas.width, gl.canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawCoord() {
    context.clearRect(0, 0, coord.canvas.width, coord.canvas.height);
    const space = 10;
    const xOff = (coord.width - vis.width)/2; // top left corner of
    const yOff = (coord.height - vis.height)/2; // the webgl frame
    const lat = ["90N", "60N", "30N", "EQ", "30S", "60S", "90S"];
    const lon = ["0", "60E", "120E", "180", "120W", "60W","0"];

    var index = 0;
    context.textAlign = "right";
    for (var i = yOff; i <= yOff + vis.height; i += vis.height/6) {
        const a = { x: xOff + 3 - space, y: i }
        const b = { x: xOff + 5 - space, y: i }
        const t = { x: xOff-space, y: i + 2 }
        context.beginPath(); 
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
        context.fillText(lat[index], t.x, t.y);
        index++;
    }
    index = 0;
    context.textAlign = "center";
    for (var i = xOff; i <= xOff + vis.width; i += vis.width/6) {
        var a = { x: i, y: yOff + vis.height+3}
        var b = { x: i, y: yOff + vis.height+5}
        var t = { x: i, y: yOff + vis.height + space*1.5}
        context.beginPath(); 
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
        context.fillText(lon[index], t.x, t.y);
        index++;
    }
}

function drawUnit() {
    gl.useProgram(unit.program);
    bindAttribute(vis.posBuffer, gl.getAttribLocation(unit.program, "a_position"), 2);
    gl.uniform1fv(gl.getUniformLocation(unit.program, "u_hues"), unit.data);
    gl.uniform2f(gl.getUniformLocation(unit.program, "u_resolution"), gl.canvas.width, gl.canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function loadJson(obj, url) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open('GET', url, true);
    xhr.onload = function() {
        obj.data = xhr.response.hues;
        console.log(unit.data);
    };
    xhr.send(null);
}