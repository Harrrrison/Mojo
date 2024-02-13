# using a database
Databases aren't really something you can commit to a git repo, so if you want to test this stuff, I'd recommend setting up your own. When I make the schema, I will document it here with some example data to fill in.

# Setting up the database
Run the script `create_tables.js` with:
```bash 
$ node create_tables.js reset
```
This will clear any existing tables with conflicting names and initialize the schema for our database. (NOTE: the schema is not final, and if it changes, for now you just have to rerun the script and *will* lose data - if you really want to preserve data in the database let me know and I can set up a path that alters the tables rather than recreating them.)

# BELOW HERE IS EXAMPLE STUFF (YOU CAN IGNORE IT I THINK)
The example explains the things it wants.

# To set up psql
First, you need to install postgresql (I can't help you with this, google it)
Then, in a command prompt (unix only - windows, you are on your own).
(This shows how to create the table shown in the example.js file)
(Yes, I'm aware setting the password to password is dumb, its temporary I swear)
``` zsh
$> sudo -u postgres psql
--------- at this point you should enter a psql prompt ----------
psql>alter user postgres password 'password';
psql>create database mojo;
psql>create table users (
	id SERIAL PRIMARY KEY NOT NULL UNIQUE,
	username VARCHAR(50) UNIQUE NOT NULL,
	count INT,
	);
psql>insert into users (username, count) values (
	('user1', 1),
	('user2', 3),
	('user3', 112)
	);
psql>\q
--------- at this point you should exit the psql prompt ----------
```
Make sure you do not forget semi-colons!
After each prompt executes, psql will give you a message. If you don't see one when you expect to, it's likely because you missed a semi-colon.
