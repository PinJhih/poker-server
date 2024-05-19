var express = require("express");
var router = express.Router();

router.get("/", function (_, res) {
    res.send("<h1>Poker</h1>");
});

module.exports = router;
