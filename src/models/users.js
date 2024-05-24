const db = require("../utils/database");

async function login(account, password) {
    let sql = `SELECT * FROM user WHERE account='${account}'`
    let user = await db.query(sql);

    if (user.length == 0)
        return undefined;
    if (user[0].password != password)
        return undefined
    delete user[0].password;
    return user[0];
}

function addUser(account, name, password) {
    let sql = `INSERT INTO user (account, name, password)
                VALUES ("${account}", "${name}", "${password}")`
    db.query(sql);
}

module.exports = { login, addUser };
