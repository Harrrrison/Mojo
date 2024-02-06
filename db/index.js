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

module.exports = { query, get_client };
