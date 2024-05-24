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
    let account = req.body.account;
    let password = req.body.password;
    if (account == undefined || password == undefined)
        return res.status(400).send("Empty fields");

    let user = await users.login(account, password);
    if (user == undefined)
        return res.status(401).send("Wrong account/password");

    let token = getToken(user);
    res.send({ "token": token });
});


router.post("/register", async function (req, res) {
    let account = req.body.account;
    let name = req.body.name;
    let password = req.body.password;
    if (account == undefined || name == undefined || password == undefined)
        return res.status(400).send("Empty fields");

    users.addUser(account, name, password);
    res.send("OK!");
});

module.exports = router;
