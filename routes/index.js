var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET feed list page. */
router.get('/feed', function(req, res, next) {
  var redis = require("lib/redis").client;
  var last = req.last || 10000000000000, limit = 10;

  redis.zrevrangebyscore(["rss:site:0", last, 0, "LIMIT", 0, limit], function(err, feeds){
	if (err) throw err;

	for (var k in feeds) {
		feeds[k] = JSON.parse(feeds[k]);
	}
	res.render('feed', { title: 'Feed', feeds: feeds });
  });
});


module.exports = router;
