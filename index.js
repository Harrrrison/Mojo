// following the spotify API tutorial so this will not be close to the final implemetation
// https://developer.spotify.com/documentation/general/guides/authorization-guide/

require('dotenv').config();
const express = require('express');
const axios = require('axios');
//const request = require('request');

const app = express();
// NOTE: changed env too (didn't check in though)
const port = 8888; // NOCHECKIN: done because i accidentally rate limited original app
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

async function store_page_visit_songs_and_artists_and_get_score(auth_code, page_visit, term) {
    var auth_header = { "Authorization": "Bearer " + auth_code };
    // get top songs
    const sresponse = await axios({
	url: `https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=${term}_term`,
	headers: auth_header,
    });
    const aresponse = await axios({
	url: `https://api.spotify.com/v1/me/top/artists?limit=10&time_range=${term}_term`,
	headers: auth_header,
    });
    const body = sresponse.data;
    if (!body) {
	return null;
    }
    const body2 = aresponse.data;
    if (!body2) {
	return null;
    }
    // TEMP: calculate the score as average of (1 - popularity/100) of the songs
    var total_score = 0;
    var count = 0;
    const songs_need_features_ids = [];
    const songs_need_features = [];
    for (var i = 0; i < body.items.length; ++i) {
	const song = body.items[i];
	const artist_ = body2.items[i];
	const song_image_url = song.album.images[0].url;
	var song_ = await db.find_or_insert_song(song.name, song.uri,
						 song.external_urls.spotify,
						 song_image_url);
	
	var artist__ = await db.find_or_insert_artist(artist_.name, artist_.uri,
						      artist_.external_urls.spotify);
	
	if (song_.need_features) {
	    const song_id = song.uri.slice(14);
	    songs_need_features_ids.push(song_id);
	    songs_need_features.push(song_.song);
	    song_ = song_.song;
	} else {
	    song_ = song_.song;
	}
	for (const artist of song.artists) {
	    const _ = db.find_or_insert_artist(artist.name,
					       artist.uri,
					       artist.external_urls.spotify)
		  .then((_artist) => {
		      db.link_artist_to_song(_artist, song_);
		  });
	}
	total_score += 1.0 - (+song.popularity / 100.0);
	count += 1;
	const ignore = await db.link_song_and_artist_to_visit(song_, artist__,
							      page_visit, term, count);
    }
    if (songs_need_features.length > 0) {
	const audio_features = await axios({
	    url: "https://api.spotify.com/v1/audio-features?ids=" + songs_need_features_ids.join(),
	    headers: auth_header,
	}).catch((error) => {
	    console.log("ERROR: fetching features for songs: " + songs_need_features_ids.join());
	    console.log("ERROR: response: ", error.response.data);
	});
	var i = 0;
	for (song of songs_need_features) {
	    db.add_song_features(song, audio_features.data.audio_features[i]);
	    i += 1;
	}
    }
    return total_score / count;    
}

async function create_page_visit(auth_code, user) {    
    const page_visit = await db.create_page_visit(user);
    var score = 0;
    score += await store_page_visit_songs_and_artists_and_get_score(auth_code, page_visit, "short");
    score += await store_page_visit_songs_and_artists_and_get_score(auth_code, page_visit, "medium");
    score += await store_page_visit_songs_and_artists_and_get_score(auth_code, page_visit, "long");
    const _ = db.set_page_visit_score(page_visit, score);
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
	    var uri = `http://localhost:${port}/stats`;
	    res.redirect(uri + '?user_id=' + user.uid);
	});
});

function build_top_songs_component(page_visit_data, term) {
    const songs_list = page_visit_data.songs;
    var songs_html = "";
    const songs = songs_list.filter((s) => { return s.term === term; });
    songs.sort((a, b) => { return a.ranking - b.ranking; });
    var i = 0;
    for (song of songs) {
	if (i >= 5) { break; }
	const song_html = `
<div class="song-item">
<!--  <a href=${song.url}><img src=${song.image_url}></a> -->
  <p>${i+1}</p>
  <div>
    <p>${song.artists[0].name}</p>
    <h2>${song.name}</h2>
  </div>
</div>
`;
	songs_html += song_html;
	i += 1;
    }
    return `
<div class="draggable songs-list">
  ${songs_html}
</div>
`;
}

function build_top_artists_component(page_visit_data, term) {
    const artists_list = page_visit_data.artists;
    var artists_html = "";
    const artists = artists_list.filter((s) => { return s.term === term; });
    artists.sort((a, b) => { return a.ranking - b.ranking; });
    var i = 0;
    for (artist of artists) {
	if (i >= 5) { break; }
	const artist_html = `
<div class="song-item">
  <p>${i+1}</p>
  <div>
    <h2>${artist.name}</h2>
  </div>
</div>
`;
	artists_html += artist_html;
	i += 1;
    }
    return `
<div class="draggable songs-list">
  ${artists_html}
</div>
`;
}

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
    const recent_visit = data[data.length - 1];

    const recent_songs = build_top_songs_component(recent_visit, "short");
    const medium_term_songs = build_top_songs_component(recent_visit, "medium");
    const long_term_songs = build_top_songs_component(recent_visit, "long");

    const recent_artists = build_top_artists_component(recent_visit, "short");
    const medium_term_artists = build_top_artists_component(recent_visit, "medium");
    const long_term_artists = build_top_artists_component(recent_visit, "long");
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="draggable.js" defer></script>
    <link rel="stylesheet" href="temp_style.css">
    <title>MOJO | ${user.username}</title>
</head>
<body class="background">
    <h1 id="intro">Hello <em>${user.username}</em></h1>
    <div id="rest">
        <div id="card-container">
            <div id="card-container-col1">
                <div id="card-mojo"><em>${user.username}'s</em> mojo</div>
                <div class="draggable-container-box"></div>
                <div class="draggable-container-box"></div>
            </div>
            <div id="card-container-col2">
                <div class="draggable-container-box">${medium_term_artists}</div>
                <div class="draggable-container-box">${long_term_artists}</div>
                <div class="draggable-container-box"></div>
            </div>
        </div>
        <div id="content-container">
            <div class="draggable-container-box">${medium_term_songs}</div>
            <div class="draggable-container-box">${recent_songs}</div>
            <div class="draggable-container-box">${long_term_songs}</div>
            <div class="draggable-container-box">${recent_artists}</div>
        </div>
    </div>
</body>
</html>
`;
    res.set("Content-Type", "text/html");
    res.send(Buffer.from(html));
});

app.get('/to_main', function(error, response, body) {
    // TODO: WHY IS THIS NOT LOADING ARRRRRRRRRRRRRRTRR

    if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        var uri = `http://localhost:${port}/landingPage.html`; // redirect to the landing page
        res.redirect(uri + '?access_token=' + access_token);
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
