const irc = require("irc"),
    c = require('irc-colors'),
    request = require('request'),
    notifications = require('./libs/notifications'),
    db = require('./libs/db');

let Db = new db(),
    Artists = new notifications('artist', Db),
    Songs = new notifications('songName', Db);

// Create the configuration
let bot,
    config = {
        server: process.env.server || "irc.freenode.net",
        botName: process.env.bot_name || "Doro",
        options: {
            channels: [process.env.channel || "#radioperfecto"],
            realName: 'Radio Perfecto Playing Bot'
        }
    },
    pause = false,
    previousSong = null,
    currentSong = null;

let playing = function(callback) {
        request.post({
            url: "https://rc1.nobexinc.com//nowplaying.ashx?stationid=70642"
        }, function(error, response, body) {
            if (response.statusCode === 200) {
                let res = JSON.parse(body);
                callback(null, res);
            } else {
                callback('Some good song... I think :D', null);
            }
        });
    },
    say = function(message) {
        if (!pause) {
            // let _artist = artist.toLowerCase();
            // if (requestedArtists.indexOf(_artist) > -1) {
            //     bot.say(config.options.channels[0], c.blue(artist + ' - ' + song + ' < c\'est le moment de monter le son ' + userToNotify.toString().replace(/,/g, ', ')));
            // } else if (requestedBadArtists.indexOf(_artist) > -1) {
            //     bot.say(config.options.channels[0], c.red(artist + ' - ' + song + ' /!\\ Alerte son moisi ! ' + userToNotify.toString().replace(/,/g, ', ')));
            // } else {
            bot.say(config.options.channels[0], message);
            // }
        }
    },
    streaming = function() {
        playing(function(error, res) {
            if (error) {
                say(err);
            } else {
                currentSong = res;
                if (previousSong !== res.songName) {
                    previousSong = res.songName;
                    Db.savePlayed(res);
                    say('Now playing: ' + res.artist + ' - ' + res.songName);
                }
            }

            setTimeout(function() {
                streaming();
            }, 5000);
        });
    },
    pm = function(who, msg) {
        bot.say(who, msg);
    }

// Create the bot name
bot = new irc.Client(config.server, config.botName, config.options);

// Listen for joins
bot.addListener("join", function(channel, who) {
    // Welcome them in!
    if (who !== config.botName) {
        bot.say(channel, 'Hello ' + who + '! Have a metal day! \\m/(-.-)\\m/');
    }

});

// Listen for any message, say to him/her in the room
bot.addListener("message", function(from, to, text, message) {
    switch (text) {
        case 'listening?':
            // playing(say);
            break;
        case 'stop':
            pause = true;
            bot.say(config.options.channels[0], 'Ok... tu préfères Motley Crue...');
            break;
        case 'start':
            pause = false;
            bot.say(config.options.channels[0], 'We are Motörhead and we play Rock\'n\'Roll!');
            break;
        case '!last':
            Db.last(say);
            break;
        default:
            if (text.indexOf('!artist') === 0) {
                Artists.action(from, text, currentSong, pm);
            } else if (text.indexOf('!song') === 0) {
                Songs.action(from, text, currentSong, pm);
            }
    }
});

bot.addListener('error', function(message) {
    console.log('error: ', message);
});

streaming();