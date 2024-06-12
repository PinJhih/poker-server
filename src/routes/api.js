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

function generateDeck() {
    const suits = ['S', 'H', 'D', 'C'];
    const deck = [];

    for (let suit of suits) {
        for (let rank = 1; rank <= 13; rank++) {
            deck.push(`${rank}${suit}`);
        }
    }

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
    }

    return deck;
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

router.get("/room/:id", function (req, res) {
    let id = req.params.id;
    let room = rooms[id];
    let names = "";
    for (let i = 0; i < room.players.length; i++) {
        if (names.length != 0) {
            names += "-";
        }
        names += room.players[i];
    }
    res.json({ "players": names });
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
    rooms[roomID] = {
        players: [userName],
        connections: [],
        deck: generateDeck(),
    };
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
        console.log(`Websocket: ${JSON.stringify(data)}`);

        switch (data.type) {
            case 'join': {
                let id = data.id;
                rooms[id].connections.push(ws);

                let num = rooms[id].connections.length;
                let message = `num:${num}`;
                ws.send(message);

                let cards = rooms[id].deck.slice(0, 2);
                rooms[id].deck.shift();
                rooms[id].deck.shift();
                console.log(rooms[id].deck);
                ws.send(`card:${cards[0]}-${cards[1]}`);
                broadcast(id, "join:");
                break;
            }

            case 'action': {
                let id = data.id;
                if (data.action === "raise")
                    broadcast(id, `action:${data.action}:${data.amount}`);
                else
                    broadcast(id, `action:${data.action}`);
                break;
            }

            case 'open': {
                let id = data.id;
                let cards = rooms[id].deck[0];
                rooms[id].deck.shift();
                broadcast(id, `open:${cards}`);
                break;
            }
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

    ws.on('close', function () {
        if (currentRoomId) {
            // TODO: Leave
        }
    });
})

module.exports = router;
