// this code is supposed to serve as an example on how you can query the database
const db = require("./index.js");

// assume db is a database with a table users
// where users has the format (id PKEY, username, count)

async function example_query() {
    const res = await db.query("select * from users where username = 'tom'");
    //console.log(res);

    // for persistent transactions, request a client
    const client = await db.get_client();
    const affected = (await client.query("select * from users where count % 2 > 0")).rows;
    const ids = affected.map((row) => row.id);     
    // lets begin a transaction
    if (ids.len > 0) {
	await client.query("BEGIN;");
	const update_query = "update users set count = 0 where id in (" + ids.join(", ") + ");";
	await client.query(update_query);
	// commit the transaction
	await client.query("COMMIT;");
    }
    
    // clients need to be freed
    await client.release();

    
}

example_query();
