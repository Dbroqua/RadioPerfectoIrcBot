const irc = require("irc"),
    c = require('irc-colors'),
    request = require('request'),
    db = require('./libs/db'),
    stream = require('./libs/stream'),
    ircbot = require('./libs/ircbot');

let Db = new db(),
    Ircbot = new ircbot(Db),
    Stream = new stream(Ircbot, Db);