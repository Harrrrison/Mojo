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

const find_or_insert_user = async (username, uid) => {
    if (!(/^[a-zA-Z0-9]+$/.test(uid))) {
	console.error("invalid uid: " + uid);
	return null;
    }
    const search_query = "select * from users where uid = $1;";
    const res = await query(search_query, [uid]);
    if (res.rowCount > 0) {
	return res.rows[0];
    }
    // user not found
    const insert_query = "insert into users(username, uid) values ($1, $2) returning *;"
    const res2 = await query(insert_query, [username, uid]);
    return res2.rows[0];
}

const find_or_insert_artist = async (name, uid, url) => {
    if (!(/^[a-zA-Z0-9]+$/.test(uid))) {
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

const insert_page_visit = async (user, score) => {
    const ins_query = "insert into page_visits(user_id, score) values ($1, $2) returning *;";
    const res = await query(ins_query, [user.id, score]);
    return res.rows[0];
}

const find_or_insert_song = async (name, url, artist) => {
    const search_query = "select * from song_entries where url = $1;";
    const res = await query(search_query, [url]);
    var song = null;
    if (res.rowCount > 0) {
	song = res.rows[0];
    } else {
	// song not found, insert
	const ins_query = "insert into song_entries(name, url, artist_id) values ($1, $2, $3) returning *;";
	const res2 = await query(ins_query, [name, url, artist.id]);
	song = res2.rows[0];
    }
    return song;
}

const link_visit_to_song = async (visit, song) => {
    const q = "insert into page_visit_song_entries(page_visit_id, song_entry_id) values ($1, $2);";
    const res = await query(q, [visit.id, song.id]);
}

const get_page_visits_info = async (user) => {
    const find_query = "select * from page_visits where user_id = $1";
    const res = await query(find_query, [user.id]);
    const out = res.rows;
    for (const row of res.rows) {
	// fetch the song info for each page visit
	const song_query = "select * from song_entries where id = (select song_entry_id from page_visit_song_entries where page_visit_id = $1)";
	const res2 = await query(song_query, [row.id]);
	out.songs = res2.rows;
    }
    return out;
}

module.exports = {
    query,
    get_client,
    find_or_insert_user,
    find_or_insert_artist,
    find_or_insert_song,
    get_page_visits_info,
    insert_page_visit,
    link_visit_to_song
};
