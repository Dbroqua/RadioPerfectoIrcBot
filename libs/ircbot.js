const irc = require("irc");

let notifications = require('./notifications');

class IrcBot {
    constructor(db) {
        let that = this,
            channel = process.env.channel || "#radioperfecto",
            server = process.env.server || "irc.freenode.net",
            botName = process.env.bot_name || "Doro",
            options = {
                channels: [channel],
                realName: 'Radio Perfecto Playing Bot'
            };

        this.db = db;
        this.botName = botName;
        this.channel = channel;
        this.pause = false;
        this.Artists = new notifications('artist', db);
        this.Songs = new notifications('songName', db);
        this._currentSong;

        // Create the bot name
        this.bot = new irc.Client(server, botName, options);

        // Attach listeners
        this._listeners();
    }

    _listeners() {
        let that = this;

        // Listen for joins
        this.bot.addListener("join", function(channel, who) {
            // Welcome them in!
            if (who !== that.botName) {
                that.publicMessage('Hello ' + who + '! Have a metal day! \\m/(-.-)\\m/');
            }
        });

        // Listen for any message, say to him/her in the room
        this.bot.addListener("message", function(from, to, text, message) {

            switch (text) {
                case '!listening':
                    // playing(say);
                    break;
                case '!stop':
                    that.pause = true;
                    that.bot.say(that.channel, 'Ok... tu préfères Motley Crue...');
                    break;
                case '!start':
                    that.pause = false;
                    that.bot.say(that.channel, 'We are Motörhead and we play Rock\'n\'Roll!');
                    break;
                case '!last':
                    that.db.last(function(message) {
                        that.publicMessage(message);
                    });
                    break;
                default:
                    if (text.indexOf('!artist') === 0) {
                        that.Artists.action(from, text, that._currentSong, function(to, msg) {
                            that.pm(to, msg);
                        });
                    } else if (text.indexOf('!song') === 0) {
                        that.Songs.action(from, text, that._currentSong, function(to, msg) {
                            that.pm(to.msg);
                        });
                    }
            }
        });

        this.bot.addListener('error', function(message) {
            console.log('error: ', message);
        });
    }

    publicMessage(message) {
        let that = this;
        if (!that.pause) {
            that.bot.say(that.channel, message);
        }
    }

    pm(who, msg) {
        this.bot.say(who, msg);
    }

    currentSong(currentSong) {
        this._currentSong = currentSong;
    }
}

module.exports = IrcBot;