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
//    console.log('working');
//    console.log(process.env.SPOTIFY_CLIENT_ID);
    var scopes = 'user-read-private user-read-email user-top-read';
    res.redirect('https://accounts.spotify.com/authorize' +
		 '?response_type=code' +
		 '&client_id=' + client_id +
		 (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
		 '&redirect_uri=' + encodeURIComponent(redirect_uri));
});

async function create_page_visit(auth_code, user) {    
    var auth_header = { "Authorization": "Bearer " + auth_code };
    const page_visit = await db.create_page_visit(user);
    // get top songs
    const sresponse = await axios({
	url: "https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term",
	headers: auth_header,
    });
    body = sresponse.data;
    if (!body) {
	return null;
    }
    // TEMP: calculate the score as average of (1 - popularity/100) of the songs
    var total_score = 0;
    var count = 0;
    for (const song of body.items) {
	const song_image_url = song.album.images[0].url;
	var song_ = await db.find_or_insert_song(song.name, song.uri,
						 song.external_urls.spotify,
						 song_image_url);
	if (song_.need_features) {
	    const song_id = song.uri.slice(14);
	    const audio_features = await axios({
		url: "https://api.spotify.com/v1/audio-features/" + song_id,
		headers: auth_header,
	    });
	    const features = audio_features.data;
	    song_ = await db.add_song_features(song_.song, features);
	} else {
	    song_ = song_.song;
	}
	for (const artist of song.artists) {
	    const _ = db.find_or_insert_artist(artist.name,
					       artist.uri,
					       artist.external_urls.spotify)
		  .then((artist_) => {
		      db.link_artist_to_song(artist_, song_);
		  });
	}
	total_score += 1.0 - (+song.popularity / 100.0);
	count += 1;
	const ignore = await db.link_song_to_visit(song_, page_visit);
    }
    const score = total_score / count;
    const _ = db.set_page_visit_score(page_visit, score);
    //console.log(body);
}

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

    await create_page_visit(auth_code, user);
    
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
    if (!user_id) {
	return;
    }
    const user = await db.find_user(user_id);
    if (!user) {
	return;
    }
    const data = await db.get_page_visits_info(user);
    console.log(data);
    const recent_visit = data[data.length - 1];
    var songs = "";
    for (song of recent_visit.songs) {
	const song_html = `
<div>
  <h2>${song.name}</h2>
  <p>${song.tempo}</p>
  <img src=${song.image_url}></img>
</div>
`;
	songs += song_html;
    }
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
    <ul>${songs}</ul>
</body>
</html>
`;
    res.set("Content-Type", "text/html");
    res.send(Buffer.from(html));
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
