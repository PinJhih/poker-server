const express = require("express");
const router = express.Router();
var jwt = require("jsonwebtoken");

const users = require("../models/users");

function genToken(user) {
    let payload = user;
    let token = jwt.sign(payload, "(gw#wyx(yZlxcZrSdhOUYIvw*AC_T)Ry", {
        expiresIn: 7 * 24 * 60 * 60 * 1000,
    });
    return token;
}

router.post("/login", async function (req, res) {
    let account = req.body.account;
    let password = req.body.password;
    if (account == undefined || password == undefined)
        return res.status(400).send("Empty fields");

    let user = await users.login(account, password);
    if (user == undefined)
        return res.status(401).send("Wrong account/password");

    let token = genToken(user);
    res.send({ "token": token });
});


router.post("/register", async function (req, res) {
    let account = req.body.account;
    let name = req.body.name;
    let password = req.body.password;
    if (account == undefined || name == undefined || password == undefined)
        return res.status(400).send("Empty fields");

    users.addUser(account, name, password);
    res.json({ "message": "OK!" });
});


let rooms = {
    "id1": ["user1", "user2", "user3"],
    "id2": ["user4", "user5", "user6"]
};
router.get("/room", function (req, res) {
    let roomList = {};
    for (const id in rooms) {
        let users = "";
        for (const user of rooms[id]) {
            users += `${user},`
        }
        roomList[id] = users
    }
    res.json(roomList);
});

router.get("/join/:id", function (req, res) {
    let roomID = req.params.id;
    let userID = req.auth.id;
    rooms[roomID].push(`${userID}`)
    res.json({ "message": "OK!" });
});

router.get("/leave/:id", function (req, res) {
    let roomID = req.params.id;
    let userID = req.auth.id;
    let idx = rooms[roomID].indexOf(userID);
    rooms[roomID].splice(idx, 1);

    if (rooms[roomID].length == 0)
        delete rooms[roomID];
    res.json({ "message": "OK!" });
});

router.get("/create", function (req, res) {
    let roomID = `${Date.now()}`;
    let userID = req.auth.id;
    rooms[roomID] = [userID];
    res.json({ "message": "OK!" });
});

module.exports = router;
