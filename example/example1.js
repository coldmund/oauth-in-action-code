var express = require("express");
var request = require("request");
var url = require("url");

var app = express();

app.use('/', express.static('files'));

app.get("/authorize", function(req, res){
	var authorizeUrl = url.format({
		protocol: 'http', 
		hostname: 'localhost',
		port: '8433',
		pathname: '/oauth/authorize', 
		query: {
			response_type: 'code', 
			scope: 'openid', 
			client_id: '788732372078-l4duigdj7793hb53871p3frd05v7n6df',
			redirect_uri: 'http://localhost:8080/oauth/callback',
			//TODO state
			state: ''
		}
	});
	console.log("redirect", authorizeUrl);
	res.redirect(authorizeUrl);
});


app.get("/oauth/callback", function(req, res){
	//TODO state
	var state = req.query.state;

	var code = req.query.code;
	console.log("code %s",code);

	var requestOptions = {
		url : 'http://localhost:8433/oauth/token',
		method: 'POST',
		json: true,
		form: {
			grant_type: 'authorization_code',
			code: code,
			client_id: '788732372078-l4duigdj7793hb53871p3frd05v7n6df',
			client_secret:'',
			redirect_uri: 'http://localhost:8080/oauth/callback'
		}

	};

	request(requestOptions, function(error, authorizationServerResponse, body) {
		if (error) {
			console.log("error while retrieving access token");
			res.status(500).end();
			return;
		}

		if (authorizationServerResponse.statusCode !== 200) {
			console.log("error while retrieving access token with status code %s %j", authorizationServerResponse.statusCode, body);
			res.status(500).end();
			return;
		}
		console.log("acces token", body.access_token);
		res.status(200).end();
	});

});

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
 
