const express = require("express");
const router = express.Router();
var jwt = require("jsonwebtoken");
const WebSocket = require('ws');

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


let rooms = {};
router.get("/room", function (req, res) {
    let roomList = {};
    for (const id in rooms) {
        roomList[id] = rooms[id].players.length;
    }

    if (roomList.length == 0)
        res.json({});
    else
        res.json(roomList);
});

router.get("/join/:id", function (req, res) {
    let roomID = req.params.id;
    let userName = req.auth.name;
    rooms[roomID].players.push(`${userName}`);
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

router.get("/create/room", function (req, res) {
    let roomID = `${Date.now()}`;
    let userName = req.auth.name;

    roomID = roomID.substring(roomID.length - 6);
    rooms[roomID] = { players: [userName], connections: [] };
    res.json({ "id": roomID });
});

const wss = new WebSocket.Server({ port: 8080 });

wss.on('listening', () => {
    console.log('WebSocket server is running on port 8080');
});

wss.on('connection', function connection(ws) {
    let currentRoomId = null;

    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);
        console.log("Websocket: " + data);

        switch (data.type) {
            case 'join':
                id = data.id;
                rooms[id].connections.push(ws);
                break;

            case 'action':
                id = data.id;
                broadcast(id, data.action);
                break;
        }
    });

    ws.on('close', function () {
        if (currentRoomId) {
            // TODO: Leave
        }
    });

    function broadcast(roomId, message) {
        if (rooms[roomId]) {
            rooms[roomId].connections.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    }
})

module.exports = router;
