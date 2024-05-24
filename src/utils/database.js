const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const filePath = __dirname + "/../../ntcu-gui.db";

function init() {
    let sql = `CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account TEXT,
    name TEXT,
    password TEXT)`;

    fs.access(filePath, fs.constants.F_OK, async (err) => {
        if (err) {
            fs.writeFile(filePath, "", async (err) => {
                if (err) {
                    console.error("Error creating file:", err);
                } else {
                    await query(sql);
                }
            });
        } else {
            await query(sql);
        }
    });
}

function connect() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(filePath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error(err.message);
                reject(err);
            }
            resolve(db);
        });
    });
}

async function query(sql) {
    const db = await connect();
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            }

            db.close((err) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
            });
            resolve(rows);
        });
    });
}

init();

module.exports = {
    query,
};
