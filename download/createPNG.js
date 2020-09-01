const PNG = require('pngjs').PNG;
const fs = require('fs');

var width = 1440;
var height = 721;
var times = ["t00", "t06", "t12", "t18"];

function arrayToObject(arr) {
    var result = {};
    for (var i = 0; i < arr.length; i++) {
        result[arr[i].key] = arr[i].value;
    }
    return result;
}

function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function createOzonePNG(fileName) {
    var ozone = JSON.parse(fs.readFileSync("../demo/data/jsonData/" + fileName + ".json"));
    var ozone_data = arrayToObject(ozone.messages[0]);
    var ozone_values = ozone_data.values; 

    var ozonePNG = new PNG({
        colorType:2,
        filterType:4,
        width: width,
        height: height
    });
    
    for (var y = 0; y < height; y++) {    
        for (var x = 0; x < width; x++) {  
            var dataIndex = (y * width + x) * 4; 
            var ozoneIndex = y * width + ((width - 1 - x) + width / 2) % width; 
            var offset = ozonePNG.data.length - dataIndex

            var min = ozone_data.minimum;
            var max = ozone_data.maximum;
            var cur = ozone_values[ozoneIndex];
            var mappedHue = (cur - min)/(max - min); // values are between 0 and 1
            var index = Math.round(mappedHue * 9);
            var hslValues = [0, 20, 40, 60, 80, 100, 120, 140, 180, 200]
            var rgb = hslToRgb(hslValues[index]/360, 1, .6);

            ozonePNG.data[offset + 0] = rgb[0];
            ozonePNG.data[offset + 1] = rgb[1];
            ozonePNG.data[offset + 2] = rgb[2];   

            ozonePNG.data[offset + 3] = 255; 
        }
    }

    ozonePNG.pack().pipe(fs.createWriteStream("../demo/data/imageData/" + fileName + ".png"));
}

function createWindPNG(uFileName, vFileName, outFileName) {
    var u_wind = JSON.parse(fs.readFileSync("../demo/data/jsonData/" + uFileName + ".json"));
    var v_wind = JSON.parse(fs.readFileSync("../demo/data/jsonData/" + vFileName + ".json"));
    var u_data = arrayToObject(u_wind.messages[0]);
    var v_data = arrayToObject(v_wind.messages[0]);
    var u_values = u_data.values; 
    var v_values = v_data.values; 

    var windPNG = new PNG({
        colorType:2,
        filterType:4,
        width: width,
        height: height
    });

    for (var y = 0; y < height; y++) {    
        for (var x = 0; x < width; x++) {    
            var dataIndex = (y * width + x) * 4; 
            var windIndex = y * width + ((width - 1 - x) + width / 2) % width; 
            var offset = windPNG.data.length - dataIndex
            windPNG.data[offset + 0] = Math.floor(255 * (u_values[windIndex] - u_data.minimum) / (u_data.maximum - u_data.minimum)); // r
            windPNG.data[offset + 1] = Math.floor(255 * (v_values[windIndex] - v_data.minimum) / (v_data.maximum - v_data.minimum)); // g
            windPNG.data[offset + 2] = 0;   
            windPNG.data[offset + 3] = 255; 
        }
    }

    windPNG.pack().pipe(fs.createWriteStream("../demo/data/imageData/" + outFileName + ".png"));
}

function createWavePNG(fileName) {
    var wh = JSON.parse(fs.readFileSync("./data/" + fileName + ".json"));
    var wh_data = arrayToObject(wh.messages[0]);
    var w_values = wh_data.values;
    
    var wavePNG = new PNG({
        colorType:2,
        filterType:4,
        width: 360,
        height: 181
    });
    
    for (var y = 0; y < 180 * 2 + 1; y++) {
        for (var x = 0; x <  360 * 2; x++) { 
            if (y % 2 == 0 && x % 2 == 0) { 
                var dataIndex = ((y/2) * width + (x/2)) * 4;
                var offset = wavePNG.data.length - dataIndex;
                if (y >= 20 && y <= 340 && x <= 718) {
                    var waveIndex = (y - 20) * 720 + ((720 - 1 - x) + 720 / 2) % 720;
                    if (w_values[waveIndex] != null) {
                        wavePNG.data[offset + 0] = Math.floor(255 * (w_values[waveIndex] - wh_data.minimum)/ (wh_data.maximum - wh_data.minimum));   // b
                        wavePNG.data[offset + 1] = Math.floor(255 * (w_values[waveIndex] - wh_data.minimum)/ (wh_data.maximum - wh_data.minimum));   // b
                        wavePNG.data[offset + 2] = Math.floor(255 * (w_values[waveIndex] - wh_data.minimum)/ (wh_data.maximum - wh_data.minimum));   // b
                        wavePNG.data[offset + 3] = 255; 
                    } else {
                        wavePNG.data[offset + 0] = 0;
                        wavePNG.data[offset + 1] = 0;
                        wavePNG.data[offset + 2] = 0;
                        wavePNG.data[offset + 3] = 255; 
                    } 
                } else {
                    wavePNG.data[offset + 0] = 0;
                    wavePNG.data[offset + 1] = 0;
                    wavePNG.data[offset + 2] = 0;
                    wavePNG.data[offset + 3] = 255; 
                } 
            }
        }
    }
    wavePNG.pack().pipe(fs.createWriteStream("./data/imageData/" + fileName + ".png"));
}

for (var i = 1; i < 9; i++) {
    for (const t of times) {
        createWindPNG("u_wind_" + i + "_" + t, "v_wind_" + i + "_" + t, "wind_" + i + "_" + t);
        createOzonePNG("ozone_" + i + "_" + t);
    }
}

