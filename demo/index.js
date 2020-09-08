var width = 360;
var height = 181;
const canvasPct = .75;
var lastTime;
var currentTime;
var tUnit = 27;

// weather vis 
var vis = {
    canvas: document.getElementById('weatherVis'),
    program: null,
    posBuffer: null,
    texBuffer: null,
    images: [],
    textures: [],
    x: null,
    y: null,
    pct: 0.8,
    width: null,
    height: null,
}

// dobson graphics
var dob = {
    program: null,
    x: null,
    y: null,
    width: null,
    height: null,
    data: [],
}

// text graphics
var info = {
    canvas: document.getElementById('unitVis'),
    ctx: null,
    width: null,
    height: null,
}

window.onload = function() {
    // get contexts
    info.ctx = info.canvas.getContext('2d');
    info.ctx.strokeStyle = "#303030";
    info.ctx.font = "10px Courier New";
    gl = vis.canvas.getContext('webgl');

    // get time for animation
    lastTime = performance.now();

    // load json and images async
    loadJson(dob, "./data/jsonData/ozone_unit.json");
    loadImages(init, window.requestAnimationFrame);

    // format graphics size
    format();
}

window.onresize = function() {
    format();
    gl.bindBuffer(gl.ARRAY_BUFFER, vis.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 
        new Float32Array([0, 0, width, height, width, 0, 0, 0, width, height, 0, height,]), 
        gl.STATIC_DRAW);
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

    // set webgl canvas size
    vis.canvas.width = width = newWidth;
    vis.canvas.height = height = newHeight;

    // we are rendering the graphics smaller than the actual webgl canvas size
    vis.width = width * vis.pct;
    vis.height = height * vis.pct;
    vis.x = width*(1 - vis.pct)/2
    vis.y = height*(1 - vis.pct)/2;

    // set canvas2d size 
    info.width = info.canvas.width = window.innerWidth;
    info.height = info.canvas.height = height + 100;

    // set dobson graphics
    dob.width = vis.width;
    dob.height = (vis.height) * .025;
    dob.x = vis.x;
    dob.y = vis.y + vis.height*1.015;
}

function init() {
    vis.program = createProgram(drawVisVertSource, drawVisFragSource);
    dob.program  = createProgram(drawUnitVertSource, drawUnitFragSource);
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
    // clear background
    info.ctx.clearRect(0, 0, info.canvas.width, info.canvas.height);
    
    // scale font 
    info.ctx.font = Math.round(info.height * .02) + "px Courier New";

    // draw text
    drawText();

    // get time for animatiion
    currentTime = performance.now();
    var timeDiff = (currentTime - lastTime)/1000; // seconds

    // draw graphics
    if (timeDiff > .15) {
        if (tUnit == 1) tUnit = 27;
        gl.viewport(vis.x, vis.y, vis.width, vis.height);
        drawTexture();
        gl.viewport(dob.x, dob.y, dob.width, dob.height);
        drawUnit();
        lastTime = performance.now();
        tUnit--;
    }
    
    // callback for animation
    window.requestAnimationFrame(draw);
}

function drawText() {
    drawCoord();
    drawDobson();
    drawTitle();
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
    const space = vis.width*.01;
    const xOff = (info.width - vis.width)/2; 
    const yOff = (info.height - vis.height)/2; 
    const lat = ["90N", "60N", "30N", "EQ", "30S", "60S", "90S"];
    const lon = ["0", "60E", "120E", "180", "120W", "60W","0"];

    info.ctx.textAlign = "right";
    var yCurr = yOff;
    for (var i = 0; i < 7; i++) {
        const t = { x: xOff-space, y: yCurr + 2 }
        info.ctx.fillText(lat[i], t.x, t.y);
        yCurr += vis.height/6;
    }

    info.ctx.textAlign = "center";
    var xCurr = xOff;
    for (var i = 0; i < 7; i++) {
        var t = { x: xCurr, y: yOff + vis.height + space*1.7}
        info.ctx.fillText(lon[i], t.x, t.y);
        xCurr+=vis.width/6;
    }
}

function drawDobson() {
    const xOff = (info.width - vis.width)/2;
    const yOff = (info.height - vis.height)/2 - (dob.height)*2.1;
    const dobson = [170, 200, 230, 260, 290, 320, 350, 380, 410, 440, 470, 500];
    info.ctx.textAlign = "center";
    var xCurr = xOff;
    for (var i = 0; i < 12; i++) {
        const t = { x: xCurr, y: yOff };
        info.ctx.fillText(dobson[i], t.x, t.y);
        xCurr+=vis.width/dob.data.length;
    }
}

function drawTitle() {
    const xOff = info.width/2;
    const yTitle = (info.height - vis.height)/6.6;
    const yDate = (info.height - vis.height)/4;
    info.ctx.font = Math.round(info.height * .03) + "px Courier New";
    info.ctx.fillText("Ozone (DU)", xOff, yTitle);
    info.ctx.font = Math.round(info.height * .02) + "px Courier New";
    info.ctx.fillText("9/25 - 9/31", xOff, yDate);
}

function drawUnit() {
    gl.useProgram(dob.program);
    bindAttribute(vis.posBuffer, gl.getAttribLocation(dob.program, "a_position"), 2);
    gl.uniform1fv(gl.getUniformLocation(dob.program, "u_hues"), dob.data);
    gl.uniform2f(gl.getUniformLocation(dob.program, "u_resolution"), gl.canvas.width, gl.canvas.height);
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
    };
    xhr.send(null);
}