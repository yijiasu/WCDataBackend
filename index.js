var express = require('express');
var app = express();

var redis = require("redis");
var crypto = require('crypto');
var _ = require('underscore');

var sub = redis.createClient(), pub = redis.createClient();
var all_res = [];

sub.subscribe("GetExtInfoReply");
sub.on("message", function (channel, message) {
  console.log(message);
  var replyJSON = JSON.parse(message);
  if (replyJSON) {
    var res = _.find(all_res, function(context){ return context['task_id'] == replyJSON['task_id'] });
    if (res) {
      var express_res = res.obj;
      express_res.send(message);
      all_res = _.reject(all_res, function(context){ return context['task_id'] == replyJSON['task_id'] });
    }
  }
});

app.get('/query', function(req, res){
  var rand_hash = crypto.randomBytes(20).toString('hex');
  if (req.query.url) {
    var pub_msg = "GET_EXT_INFO_TASK" + "^^^^" + rand_hash + "^^^^" + req.query.url
    pub.publish("GetExtInfo", pub_msg);
    var await_obj = { task_id: rand_hash, obj: res };
    all_res.push(await_obj);
  }
  else {
    res.send('{"status":"error", "reason":"no url param"}');
  }

  setTimeout(function() {
    var res = _.find(all_res, function(context){ return context['task_id'] == rand_hash });
    if (res) {
      res.obj.send('{"status":"error", "reason":"gateway timeout"}');
      all_res = _.reject(all_res, function(context){ return context['task_id'] == rand_hash });
    }
  }, 10000);
});

app.listen(3001);
console.log("MP Data HTTP Server Listening...")
