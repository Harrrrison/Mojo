// following the spotify API tutorial so this will not be close to the final implemetation
// https://developer.spotify.com/documentation/general/guides/authorization-guide/

require('dotenv').config();
const express = require('express');
const axios = require('axios');
//const request = require('request');

const app = express();
const port = 3000;
const path = require('path');
app.use(express.static(path.join(__dirname, 'StaticFiles')));

// not yet used - still messing around
const db = require('./db/index.js');

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

// Redirect to Spotify's authentication page
app.get('/login', function(req, res) {
    console.log('working');
    console.log(process.env.SPOTIFY_CLIENT_ID);
    var scopes = 'user-read-private user-read-email user-top-read';
    res.redirect('https://accounts.spotify.com/authorize' +
		 '?response_type=code' +
		 '&client_id=' + client_id +
		 (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
		 '&redirect_uri=' + encodeURIComponent(redirect_uri));
});

async function get_and_store_user_data(auth_code) {
    var done = false;
    var auth_header = { "Authorization": "Bearer " + auth_code };

    // get the user info
    const uresponse = await axios({
	url: "https://api.spotify.com/v1/me",
	headers: auth_header,
    });
    var body = uresponse.data;    
    if (!body) {
	return null;
    }

    const user = await db.find_or_insert_user(body.display_name, body.uri);

    // get top songs
    const sresponse = await axios({
	url: "https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term",
	headers: auth_header,
    });
    body = sresponse.data;
    if (!body) {
	return null;
    }
    for (const song of body.items) {
	for (const artist of song.artists) {
	    const artist = await db.find_or_insert_artist()
	}
	
    }
    console.log(body);
    
    return user;
}

// Callback service parsing the authorization token and asking for the access token
app.get('/callback', async (req, res) => {
    var code = req.query.code || null;

    var params = new URLSearchParams();
    params.append("code", code);
    params.append("redirect_uri", redirect_uri);
    params.append("grant_type", "authorization_code");
    
    var options = {
        headers: {
            'Authorization':
	    'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
    };

    axios.post("https://accounts.spotify.com/api/token", params, options)
	.then(async (response) => {
	    if (response.status !== 200) {
		return;
	    }
	    const user = await get_and_store_user_data(response.data.access_token);
	    var uri = 'http://localhost:3000/stats';
	    res.redirect(uri + '?user_id=' + user.uid);
	});
    /*
    axios.post("https://accounts.spotify.com/api/", new URLSearchParams({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
    }),  options).then(async (response) => {
	if (response.status !== 200) {
	    // TODO: how to handle
	    return;
	}
	var uri = 'http://localhost:3000/stats';
	const user = await get_and_store_user_data(body.access_token);
	var uri = 'http://localhost:3000/stats';
	res.redirect(uri + '?user_id=' + user.uid);	
    }).catch((err) => {
	console.log(err);
	});
    */
});

app.get("/stats", async (req, res) => {
    const user_id = req.query.user_id;
    const user = await db.find_user(user_id);
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"></script>
    <script src="jsMain.js"></script>
    <link rel="stylesheet" href="styleSheet.css">
    <title>MOJO | ${user.username}</title>
</head>
<body class="background">
    <div id="data">Hello ${user.username}</div>
</body>
</html>
`;    
    res.set("Content-Type", "text/html");
    res.send(Buffer.from(html));
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
