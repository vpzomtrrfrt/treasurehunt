var pg = require('pg');
var cookies = require('cookies');
var http = require('http');
var hat = require('hat');
var qr = require('qr-image');

if(!process.env.DATABASE_URL) {
	console.error("DATABASE_URL missing.");
	process.exit();
}
var db = new pg.Client(process.env.DATABASE_URL);
db.connect();

var PORT = process.env.PORT || 7000;

function die(res, status, text, type) {
	if(arguments.length === 2) {
		text = status;
		status = 500;
	}
	if(!type) {
		type = "text/plain";
	}
	text = ""+text;
	res.writeHead(status, {"Content-type": type});
	res.write(text);
	res.end();
}

http.createServer(function(req, res) {
	var cookiejar = new cookies(req, res);
	var user = cookiejar.get("TreasureHuntUser");
	if(!user) {
		cookiejar.set("TreasureHuntUser", hat(), {maxAge: 600000000});
		res.writeHead(200, {"Content-type": "text/plain", "Location": req.url});
		res.write("If you see this, reload the page and/or enable cookies");
		res.end();
		return;
	}
	if(req.url.indexOf("/clue/") === 0) {
		var id = req.url.substring(6);
		db.query("SELECT * FROM clues WHERE id=$1", [id], function(err, result) {
			if(err) {
				die(res, err);
				return;
			}
			if(result.rows.length !== 1) {
				die(res, 404, "Clue not found");
				return;
			}
			var main = function(clue) {
				var writeClue = function(time) {
					var passed = new Date().getTime()-time.getTime();
					console.log(passed);
					var j = JSON.parse(clue.data);
					var tr = j.slice(0, 1+passed/200000);
					die(res, 200, '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'+tr.join("<br/><br/>")+'</body></html>', "text/html");
				};
				db.query("SELECT * FROM found WHERE \"user\"=$1 AND clue=$2", [user, id], function(err, result) {
					if(err) {
						die(res, err);
						return;
					}
					if(result.rows.length === 1) {
						writeClue(result.rows[0].time);
						return;
					}
					db.query("INSERT INTO found (\"user\", clue, time) VALUES ($1, $2, localtimestamp) RETURNING time", [user, id], function(err, result) {
						if(err) {
							console.error(err);
							die(res, err);
							return;
						}
						writeClue(result.rows[0].time);
					});
				});
			};
			if(!result.rows[0].depends) {
				main(result.rows[0]);
			}
			else {
				db.query("SELECT * FROM found WHERE \"user\"=$1 AND clue=$2", [user, result.rows[0].depends], function(err, results) {
					if(err) {
						die(res, err);
						return;
					}
					if(results.rows.length !== 1) {
						die(res, 403, "You have not unlocked this clue yet");
						return;
					}
					main(result.rows[0]);
				});
			}
		});
	}
	else if(req.url.indexOf("/qr/") === 0) {
		var id = req.url.substring(4);
		res.writeHead(200, {"Content-type": "image/png"});
		console.log(Object.keys(req).sort());
		var url = "http://"+req.headers.host+"/clue/"+id;
		console.log(url);
		qr.image(url).pipe(res);
	}
	else {
		die(res, 404, "404 Not Found");
	}
}).listen(PORT);
