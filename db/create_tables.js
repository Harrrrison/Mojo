// this code will generate a table structure for the database based on the erd
// from the initial presentation
const db = require("./index.js");

// (must be in this order because of dependencies)
// NOTE(matt): above is no longer true - cascade will drop all dependent tables
// This also contains all older names for tables
// to make sure the db is cleaned
const drop_all_tables_query = `
drop table if exists page_visit_song_entries cascade;
drop table if exists page_visit_songs cascade;
drop table if exists playlist_songs cascade;
drop table if exists song_entries cascade;
drop table if exists songs cascade;
drop table if exists page_visits cascade;
drop table if exists playlists cascade;
drop table if exists users cascade;
drop table if exists artists cascade;
`;

// NOTE: OLD (now not bothering with sized strings, just let the perf suffer
// usernames on spotify can be upto 30 characters
// since they could be unicode? (up to 4*more codepoints)
// i just allocate 128 utf8 spaces
//
// i can't remember the size of the userid
// but somewhere on the internet it said they vary from 20-128 hex characters
// hence I just did 128
const users_query = `drop table if exists users; create table users (
  id SERIAL PRIMARY KEY NOT NULL UNIQUE,
  username VARCHAR NOT NULL UNIQUE,
  uid VARCHAR NOT NULL UNIQUE
);`;

// assuming that score is going to map [0..1]
// giving 1, 10 means that the value
// will have 10 digits of precision in the range
// of +-10^1 (i think)
// setting the foreign key to cascade on delete
// means that all page visits referencing a deleted user
// also get deleted - this seems like a good idea
// for gdpr stuff (?)
const page_visit_query = `
create table page_visits (
  id SERIAL PRIMARY KEY NOT NULL UNIQUE,
  user_id SERIAL NOT NULL REFERENCES users ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  score NUMERIC(10, 1) NOT NULL
);`;

// again not sure what to do for name
// can populate more stuff later ?
// name is probably not a unique identifier
// but spotify must store some unique identifier for songs
// TODO(matt): add above into table
const songs_query = `
create table songs (
  id SERIAL PRIMARY KEY NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  url VARCHAR NOT NULL UNIQUE
);`;

const artist_query = `
create table artists (
  id SERIAL PRIMARY KEY NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  uid VARCHAR NOT NULL,
  url VARCHAR NOT NULL
);`;

const song_artists_query = `
create table song_artists (
  id SERIAL PRIMARY KEY NOT NULL UNIQUE,
  song_id SERIAL NOT NULL REFERENCES songs ON DELETE CASCADE,
  artist_id SERIAL NOT NULL REFERENCES artists ON DELETE CASCADE
);`;


// relational table for the link between songs and
// page visits (many-many)
const page_visit_songs_query = `
create table page_visit_songs (
  id SERIAL PRIMARY KEY NOT NULL UNIQUE,
  page_visit_id SERIAL NOT NULL REFERENCES page_visits ON DELETE CASCADE,
  song_id SERIAL NOT NULL REFERENCES songs ON DELETE CASCADE
);`;

// assuming a many to one relationship (one user can have many playlists, but
// a playlist cannot belong to more than one user) - which isn't quite true in
// practice, but for the sake of this it's simpler and okay
// TODO(matt): url length verification/something
const playlist_query = `
create table playlists (
  id SERIAL PRIMARY KEY NOT NULL UNIQUE,
  user_id SERIAL NOT NULL REFERENCES users ON DELETE CASCADE,
  url VARCHAR NOT NULL
);`;

// another many-many relation table, this time to link songs to playlists
const playlist_songs_query = `
create table playlist_songs (
  id SERIAL PRIMARY KEY NOT NULL UNIQUE,
  playlist_id SERIAL NOT NULL REFERENCES playlists ON DELETE CASCADE,
  song_id SERIAL NOT NULL REFERENCES songs ON DELETE CASCADE
);`;

async function create_tables() {
    console.log("Dropping all tables and recreating them...");
    // drop all the existing tables (will wipe all records)
    await db.query(drop_all_tables_query);
    await db.query(users_query);
    await db.query(page_visit_query);
    await db.query(artist_query);
    await db.query(songs_query);
    await db.query(song_artists_query);
    await db.query(page_visit_songs_query);
    await db.query(playlist_query);
    await db.query(playlist_songs_query);
}

if (process.argv.length <= 2) {
    console.log("This script is designed for updating the database schema descructively");
    console.log("Doing this will wipe all records from the database and rebuild it.");
    console.log("If you wish to proceed, rerun this script with the argument \"reset\".");
} else if (process.argv[2] == "reset") {
    create_tables();    
} else {
    console.log("This script is designed for updating the database schema descructively");
    console.log("Doing this will wipe all records from the database and rebuild it.");
    console.log("If you wish to proceed, rerun this script with the argument \"reset\".");
}
