const db = require("../utils/database");

async function login(username, password) {
    let sql = `SELECT * FROM user WHERE name='${username}'`
    let user = await db.query(sql);

    if (user.length == 0)
        return undefined;
    if (user[0].password != password)
        return undefined
    return { id: user[0].id, username: user[0].name };
}

function addUser(username, password) {
    let sql = `INSERT INTO user (name, password)
                VALUES ("${username}", "${password}")`
    db.query(sql);
}

module.exports = { login, addUser };
