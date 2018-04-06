const irc = require("irc"),
    c = require('irc-colors'),
    request = require('request');

// Create the configuration
let config = {
        channels: ["#radioperfecto"],
        server: "irc.freenode.net",
        botName: "Doro"
    },
    pause = false,
    previousSong = null;

let playing = function(callback) {
        request.post({
            url: "https://rc1.nobexinc.com//nowplaying.ashx?stationid=70642"
        }, function(error, response, body) {
            if (response.statusCode === 200) {
                let res = JSON.parse(body);
                callback(res.artist, res.songName);
            } else {
                callback('Some good song... I think :D');
            }
        });
    },
    say = function(artist, song) {
        if (!pause) {
            bot.say(config.channels[0], c.rainbow(artist + ' - ' + song));
        }
    },
    streaming = function() {
        playing(function(artist, song) {
            if (previousSong !== song) {
                previousSong = song;
                say(artist, song);
            }
            setTimeout(function() {
                streaming();
            }, 5000);
        });
    };

// Create the bot name
var bot = new irc.Client(config.server, config.botName, {
    channels: config.channels
});

// Listen for joins
bot.addListener("join", function(channel, who) {
    // Welcome them in!
    bot.say(channel, c.red("I'm so Bad..."));

    streaming();
});

// Listen for any message, say to him/her in the room
bot.addListener("message", function(from, to, text, message) {
    switch (text) {
        case 'listening?':
            playing(say);
            break;
        case 'stop':
            pause = true;
            bot.say(config.channels[0], 'Ok... tu préfères Motley Crue...');
            break;
        case 'start':
            pause = false;
            bot.say(config.channels[0], 'We are Motörhead and we play Rock\'n\'Roll!');
            break;
    }
});