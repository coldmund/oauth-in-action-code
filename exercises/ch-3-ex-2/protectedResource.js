var express = require("express");
var bodyParser = require('body-parser');
var cons = require('consolidate');
var nosql = require('nosql').load('database.nosql');
var cors = require('cors');

var app = express();

app.use(bodyParser.urlencoded({ extended: true })); // support form-encoded bodies (for bearer tokens)

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', 'files/protectedResource');
app.set('json spaces', 4);

app.use('/', express.static('files/protectedResource'));
app.use(cors());

var resource = {
	"name": "Protected Resource",
	"description": "This data has been protected by OAuth 2.0"
};

var getAccessToken = function(req, res, next) {
	// check the auth header first
	var auth = req.headers['authorization'];
	var inToken = null;
	if (auth && auth.toLowerCase().indexOf('bearer') == 0) {
		inToken = auth.slice('bearer '.length);
	} else if (req.body && req.body.access_token) {
		// not in the header, check in the form body
		inToken = req.body.access_token;
	} else if (req.query && req.query.access_token) {
		inToken = req.query.access_token
	}

	console.log('Incoming token: "%s"', inToken);
	if(inToken.length == 0) {
		console.log('token length is 0');
		next();
		return;
	}
	// comment out the original code for node.js 8.0(or below) and nosql 3.0.3
	// and insert new code for node.js 10 and nosql 6.1.0
	// refer to https://github.com/oauthinaction/oauth-in-action-code/issues/18
	// nosql.one(function(token) {
	// 	if (token.access_token == inToken) {
	// 		return token;
	// 	}
	// }, function(err, token) {
	// 	if (token) {
	// 		console.log("We found a matching token: %s", inToken);
	// 	} else {
	// 		console.log('No matching token was found.');
	// 	}
	// 	req.access_token = token;
	// 	next();
	// 	return;
	// });
	nosql.find().make(function(filter) {
		filter.where('access_token', '=', inToken);
		filter.callback(function(err, token) {
			if(token) {
				console.log('We found a matching token: "%s"', inToken);
			} else {
				console.log('No matching token was found.');
			}
			req.access_token = token;
			next();
			return;
		});
	});
};

app.options('/resource', cors());
app.post("/resource", cors(), getAccessToken, function(req, res){

	if (req.access_token) {
		res.json(resource);
	} else {
		res.status(401).end();
	}
});

var server = app.listen(9002, 'localhost', function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('OAuth Resource Server is listening at http://%s:%s', host, port);
});
