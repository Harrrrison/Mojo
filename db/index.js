const pg = require('pg');

const pool = new pg.Pool({
    user: "postgres",
    password: "password",
    database: "mojo",
});

const query = async (query, params) => {
    return pool.query(query, params);
}

const get_client = () => {
    return pool.connect();
}

const find_user = async (uid) => {
    if (!(/^spotify:user:[a-zA-Z0-9]+$/.test(uid))) {
	console.error("invalid uid: " + uid);
	return null;
    }
    const search_query = "select * from users where uid = $1;";
    const res = await query(search_query, [uid]);
    if (res.rowCount > 0) {
	return res.rows[0];
    }
    return null;
}

const find_or_insert_user = async (username, uid) => {
    const user = await find_user(uid);
    if (user !== null) {
	return user;
    };
    
    // user not found
    const insert_query = "insert into users(username, uid) values ($1, $2) returning *;"
    const res2 = await query(insert_query, [username, uid]);
    return res2.rows[0];
}

const create_page_visit = async (user) => {
    const q = "insert into page_visits(user_id) values ($1) returning *;";
    const res = await query(q, [user.id]);
    return res.rows[0];
}

const set_page_visit_score = async(page_visit, score) => {
    const q = "update page_visits set score = $1 where id = $2";
    const _ = query(q, [score, page_visit.id]);
}

const find_or_insert_artist = async (name, uid, url) => {
    if (!(/^spotify:artist:[a-zA-Z0-9]+$/.test(uid))) {
	console.error("invalid uid: " + uid);
	return null;
    }
    const search_query = "select * from artists where uid = $1;";
    const res = await query(search_query, [uid]);
    if (res.rowCount > 0) {
	return res.rows[0];
    }
    // artist not found, insert
    const ins_query = "insert into artists(name, uid, url) values ($1, $2, $3) returning *;";
    const res2 = await query(ins_query, [name, uid, url]);
    return res2.rows[0];
}

const find_and_delete_user = async (user) => {
    // TODO
    console.error("TODO: not implemented");
}

const find_or_insert_song = async (name, uid, url, image_url) => {
    if (!(/^spotify:track:[a-zA-Z0-9]+$/.test(uid))) {
	console.error("invalid uid: " + uid);
	return null;
    }
    const search_query = "select * from songs where uid = $1;";
    const res = await query(search_query, [uid]);
    var song = null;
    if (res.rowCount > 0) {
	song = res.rows[0];
    } else {
	// song not found, insert
	const ins_query = "insert into songs(name, uid, url, image_url) values ($1, $2, $3, $4) returning *;";
	const res2 = await query(ins_query, [name, uid, url, image_url]);
	song = res2.rows[0];
    }
    return {
	song: song,
	// only need to check one feature, as they are all set at once
	need_features: (song.danceability === null),
    };
}

const add_song_features = async (song, features) => {
    const q = "update songs set danceability = $2, energy = $3, key = $4, loudness = $5, mode = $6, speechiness = $7, acousticness = $8, instrumentalness = $9, liveness = $10, valence = $11, tempo = $12 where id = $1 returning *";
    const res = await query(q,
			    [song.id, features.danceability, features.energy, features.key,
			     features.loudness, features.mode, features.speechiness,
			     features.acousticness, features.instrumentalness,
			     features.liveness, features.valence, features.tempo
			    ]);
    return res.rows[0];
}

const link_artist_to_song = async (artist, song) => {
    const query1 = "select * from song_artists where song_id = $1 and artist_id = $2;";
    const res = await query(query1, [song.id, artist.id]);
    if (res.rowCount == 0) {
	const query2 =
	      "insert into song_artists(song_id, artist_id) values ($1, $2) returning *";
	const res2 = await query(query2, [song.id, artist.id]);
	return res2;
    }
    return res;
}

const link_song_and_artist_to_visit = async (song, artist, visit, term, ranking) => {
    const q = "insert into page_visit_rankings(page_visit_id, song_id, artist_id, term, ranking) values ($1, $2, $3, $4, $5);";
    const res = await query(q, [visit.id, song.id, artist.id, term, ranking]);
}

const get_page_visits_info = async (user) => {
    const find_query = "select * from page_visits where user_id = $1";
    const res = await query(find_query, [user.id]);
    const out = res.rows;
    var i = 0;
    for (const row of res.rows) {
	// fetch the song info for each page visit
	// TODO: a better way to do this in a single query?
	const song_query = "select * from (page_visit_rankings join songs on page_visit_rankings.song_id = songs.id) where page_visit_id = $1;";
	const res2 = await query(song_query, [row.id]);
	var j = 0;
	for (song of res2.rows) {
	    const artist_query = "select * from (song_artists join artists on song_artists.artist_id = artists.id) where song_id = $1;";
	    const res3 = await query(artist_query, [song.id]);
	    res2.rows[j].artists = res3.rows;
	    j += 1;
	}
	out[i].songs = res2.rows;

	const artist_query = "select * from (page_visit_rankings join artists on page_visit_rankings.artist_id = artists.id) where page_visit_id = $1;";
	const res4 = await query(artist_query, [row.id]);
	out[i].artists = res4.rows;

	i += 1;
    }
    return out;
}

module.exports = {
    query,
    get_client,
    find_user,
    find_or_insert_user,
    create_page_visit,
    find_or_insert_artist,
    link_artist_to_song,
    find_or_insert_song,
    add_song_features,
    get_page_visits_info,
    link_song_and_artist_to_visit,
    set_page_visit_score
};
