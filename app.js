var http = require('http');
var express = require('express');
var open = require('open');
var path = require('path');
var request = require('request');
var zbarimg = require('node-zbarimg');
var fs = require('fs');
const cors = require('cors');
const execSync = require('child_process').execSync;
var app = express();
var crypto = require("crypto");
var algorithm = 'aes-128-cbc';
var key = 'iCommunity123456';
var IV = '4e5Wa71fYoT7MFEX';
var encoding = 'hex';
var gpio = require('rpi-gpio');
var pin = 7;
var delay = 2000;
var count = 0;
var max = 3;

const corsOptions = {
  origin: '*'
}
app.use(cors(corsOptions));

var server = http.createServer(function(req, res, next) {
  app(req, res);
});

function scanImage(done) {
  var dateObj = new Date();
  var mon = dateObj.getUTCMonth() + 1; //months from 1-12
  var d = dateObj.getUTCDate();
  var result = {};
  var message;
  var cmd = execSync('/opt/vc/bin/raspistill --timeout 5 --output /home/pi/tmp/scan.png --width 800 --height 600 --nopreview');
  zbarimg('/home/pi/tmp/scan.png', function(err, code) {
    if (code === null) {
      message = 'ready';
      result.message = message;
      done(null, JSON.stringify(result));
    } else {
      message = 'Scanned';
      var code = decryptText(algorithm, key, IV, code, encoding);
      if (code === "error") {
        console.log('invalid Code!');
        message = 'invalid_code';
        result.message = message;
        done(null, JSON.stringify(result));
      } else {
        code = JSON.parse(code);
        if (mon !== code.month || d !== code.day ) {
          message = 'invalid';
          result.message = message;
          done(null, JSON.stringify(result));
        } else {
          message = 'Scanned';
          code.message = message;
          done(null, JSON.stringify(code));
        }
      }
    }
  });
}

app.get("/", function(req, res) {
  scanImage(function(err, result) {
    if (err) {
      res.write('Error');
      res.end();
    } else {
	console.log(result);
      if (result.message === 'invalid_code') {
        res.write(result);
        res.end();
      }
      if (result.message === 'invalid') {
        res.write(result);
        res.end();
      }
      if (result.message === 'ready') {
        res.write(result);
        res.end();
      } else {
        res.write(result);
        res.end();
      }
    }
  });
});

gpio.setup(pin, gpio.DIR_OUT);

app.get("/open/gate", function(req, res) {
  console.log("inside open gate");
  gpio.write(7, true);
  var timer = setTimeout(
    function() {
      gpio.write(7, false);
    }, 1000);
  res.write("success");
  res.end();
});

function decryptText(cipher_alg, key, iv, data, encoding){
  var decipher = crypto.createDecipheriv(cipher_alg, key, iv);
  encoding = encoding || "binary";
  try {
    var result = decipher.update(data, encoding);
    result += decipher.final();
    return result;
  } catch (ex) {
    console.log("Error in decryption");
    return "error";
  }
}

server.listen(4000, function() {
  console.log("Server Listening on Port 4000");
});