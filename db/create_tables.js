// this code will generate a table structure for the database based on the erd
// from the initial presentation
const db = require("./index.js");

// usernames on spotify can be upto 30 characters
// since they could be unicode? (up to 4*more codepoints)
// i just allocate 128 utf8 spaces
//
// TODO(matt): Just googled and theres a different datatype for unicode,
// swap to that where necessary at some point
//
// i can't remember the size of the userid
// but somewhere on the internet it said they vary from 20-128 hex characters
// hence I just did 128
const users_query = `create or replace table users (
id SERIAL PRIMARY KEY NOT NULL UNIQUE,
username VARCHAR(128) NOT NULL UNIQUE,
uid VARCHAR(128) NOT NULL UNIQUE,
);`;

// assuming that score is going to map [0..1]
// giving 1, 10 means that the value
// will have 10 digits of precision in the range
// of +-10^1 (i think)
// setting the foreign key to cascade on delete
// means that all page visits referencing a deleted user
// also get deleted - this seems like a good idea
// for gdpr stuff (?)
const page_visit_query = `create or replace table page_visits (
id SERIAL PRIMARY KEY NOT NULL UNIQUE,
user_id SERIAL NOT NULL REFERENCES users ON DELETE CASCADE,
date DATE NOT NULL DEFAULT CURRENT_DATE,
score NUMERIC(1, 10) NOT NULL,
);`;

// again not sure what to do for name
// can populate more stuff later ?
// name is probably not a unique identifier
// but spotify must store some unique identifier for songs
// TODO(matt): add above into table
const song_entry_query = `create or replace table song_entries (
id SERIAL PRIMARY KEY NOT NULL UNIQUE,
name VARCHAR(128) NOT NULL,
);`;

// relational table for the link between songs and
// page visits (many-many)
const page_visit_song_entries_query = `create or replace table page_visit_song_entries (
id SERIAL PRIMARY KEY NOT NULL UNIQUE,
page_visit_id SERIAL NOT NULL REFERENCES page_visits ON DELETE CASCADE,,
song_entry_id SERIAL NOT NULL REFERENCES song_entries ON DELETE CASCADE,
);`;

// assuming a many to one relationship (one user can have many playlists, but
// a playlist cannot belong to more than one user) - which isn't quite true in
// practice, but for the sake of this it's simpler and okay
// TODO(matt): url length verification/something
const playlist_query = `create or replace table playlists (
id SERIAL PRIMARY KEY NOT NULL UNIQUE,
user_id SERIAL NOT NULL REFERENCES users ON DELETE CASCADE,
url VARCHAR(128) NOT NULL,
);`;

// another many-many relation table, this time to link songs to playlists
const playlist_songs_query = `create or replace table playlist_songs (
id SERIAL PRIMARY KEY NOT NULL UNIQUE,
playlist_id SERIAL NOT NULL REFERENCES playlists ON DELETE CASCADE,
song_entry_id SERIAL NOT NULL REFERENCES song_entries ON DELETE CASCASE,
);`;

async function create_tables() {
    const res = await db.query(users_query);
    const res = await db.query(page_visit_query);
    const res = await db.query(song_entry_query);
    const res = await db.query(page_visit_song_entries_query);
}
