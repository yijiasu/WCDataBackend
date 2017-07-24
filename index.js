var express = require('express');
var app = express();

var redis = require("redis");
var sub = redis.createClient(), pub = redis.createClient();
var crypto = require('crypto');
sub.subscribe("GetExtInfoReply");

app.get('/query', function(req, res){
  var rand_hash = crypto.randomBytes(20).toString('hex');
  if (req.query.url) {
    var pub_msg = "GET_EXT_INFO_TASK" + "^^^^" + rand_hash + "^^^^" + req.query.url
    pub.publish("GetExtInfo", pub_msg);
  }
  else {
    res.send('{"status":"error", "reason":"no url param"}');
  }
  sub.on("message", function (channel, message) {
    console.log(message);
    var replyJSON = JSON.parse(message);
    if (replyJSON['task_id'] == rand_hash) {
      res.send(message);
    }
  });
});

app.listen(3000);
console.log("HTTP Server Listening...")
