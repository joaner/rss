#!/usr/bin/env node

var argv = require('argv'),
	http = require('https'),
	xml  = require('xml2js');

var sites = [
	"https://xiaoai.me?feed=rss2"
];

var redis = require("redis").createClient({
   	host: "127.0.0.1",
    port: 6379
});

var k = 0;
for (; k < sites.length; ++k) {
	var site = sites[k],
		cacheKey = "rss:site:" + k;
	
	http.get(site, function(response){
		var body = [];

		response.on('data', function(chunk) {
			body.push(chunk);
		});
		response.on('end', function(){
			body = Buffer.concat(body);

			response.destroy();

			xml.parseString(body.toString(), function(err, result) {
				var posts = result.rss.channel[0].item;
				var i = 0, limit = posts.length;

				var multi = redis.multi();
				multi.del(cacheKey);

				for (; i < limit; ++i) {
					var post = posts[i];
					var feed = {
						title: post.title[0],
						pubDate: post.pubDate[0],
						link: post.link[0],
						description: post.description[0]
					};
					var pubTime = new Date(post.pubDate[0]).getTime();
					multi.zadd(cacheKey, pubTime, JSON.stringify(feed));
				}
				
				multi.expire(cacheKey, 86400*7);
				multi.exec(function(){
					if (sites[k+1] === undefined) {
						redis.end();
					}
				});
			});
		});

	});
}

console.log('hello');
