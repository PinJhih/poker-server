const express = require("express");
const router = express.Router();
var jwt = require("jsonwebtoken");

const users = require("../models/users");

function getToken(user) {
    let payload = user;
    let token = jwt.sign(payload, "(gw#wyx(yZlxcZrSdhOUYIvw*AC_T)Ry", {
        expiresIn: 7 * 24 * 60 * 60 * 1000,
    });
    return token;
}

router.post("/login", async function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    if (username == undefined || password == undefined)
        return res.status(400).send("Empty username/password");

    let user = await users.login(username, password);
    if (user == undefined)
        return res.status(401).send("Wrong username/password");

    let token = getToken(user);
    res.send({ "token": token });
});

module.exports = router;
