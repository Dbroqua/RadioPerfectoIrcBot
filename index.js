const irc = require("irc"),
    c = require('irc-colors'),
    request = require('request');

// Create the configuration
let config = {
        server: "irc.freenode.net",
        botName: "Doro",
        options: {
            channels: ["#radioperfectobottest"],
            // channels: ["#radioperfecto"],
            realName: 'Radio Perfecto Playing Bot'
        }
    },
    userToNotify = ['darkou', 'brunus'],
    requestedArtists = ['trust', 'ac/dc', 'foo fighters', 'no one is innocent', 'the rolling stones', 'blue oyster cult', 'judas priest', 'misfits', 'black sabbath', 'ozzy osbourne', 'metallica', 'aerosmith', 'queen', 'fff', 'patti smith'],
    requestedBadArtists = ['taxi girl', 'kiss', 'motley crue', 'depeche mode', 'u2'],
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
            let _artist = artist.toLowerCase();
            if (requestedArtists.indexOf(_artist) > -1) {
                bot.say(config.options.channels[0], c.blue(artist + ' - ' + song + ' < c\'est le moment de monter le son ' + userToNotify.toString().replace(/,/g, ', ')));
            } else if (requestedBadArtists.indexOf(_artist) > -1) {
                bot.say(config.options.channels[0], c.red(artist + ' - ' + song + ' /!\\ Alerte son moisi ! ' + userToNotify.toString().replace(/,/g, ', ')));
            } else {
                bot.say(config.options.channels[0], artist + ' - ' + song);
            }
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
var bot = new irc.Client(config.server, config.botName, config.options);

// Listen for joins
bot.addListener("join", function(channel, who) {
    // Welcome them in!
    bot.say(channel, c.red("I'm so Bad..."));
});

// Listen for any message, say to him/her in the room
bot.addListener("message", function(from, to, text, message) {
    switch (text) {
        case 'listening?':
            playing(say);
            break;
        case 'stop':
            pause = true;
            bot.say(config.options.channels[0], 'Ok... tu préfères Motley Crue...');
            break;
        case 'start':
            pause = false;
            bot.say(config.options.channels[0], 'We are Motörhead and we play Rock\'n\'Roll!');
            break;
    }
});

bot.addListener('error', function(message) {
    console.log('error: ', message);
});

streaming();