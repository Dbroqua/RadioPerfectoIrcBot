const irc = require("irc");

let notifications = require('./notifications'),
    statistics = require('./statistics');

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
        this.Statistics = new statistics(db);
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
            let _cmd = text.split(' ')[0];

            switch (_cmd) {
                case '!stats':
                case '!last':
                    that.Statistics.action(from, text, that._currentSong, function(err, res) {
                        if (!err && res.rows.length > 0) {
                            let _max = res.rows.length,
                                _current = 0,
                                _call = setInterval(function() {
                                    that.publicMessage(res.rows[_current].text);
                                    _current++;
                                    if (_current === _max) {
                                        clearInterval(_call);
                                    }
                                }, 750);
                        } else {
                            that.publicMessage(err);
                        }
                    });
                    break;
                case '!artists':
                    that.Artists.action(from, text, that._currentSong, function(to, msg) {
                        if (msg !== undefined) {
                            that.pm(to, msg);
                        }
                    });
                    break;
                case '!songs':
                    that.Songs.action(from, text, that._currentSong, function(to, msg) {
                        if (msg !== undefined) {
                            that.pm(to, msg);
                        }
                    });
                    break;
            }
        });

        this.bot.addListener('error', function(message) {
            console.log('error: ', message);
        });
    }

    publicMessage(message) {
        let that = this;
        if (!that.pause && message !== undefined && message !== null) {
            that.bot.say(that.channel, message);
        }
    }

    pm(who, msg) {
        if (msg !== undefined) {
            this.bot.say(who, msg);
        }
    }

    currentSong(currentSong) {
        this._currentSong = currentSong;
    }
}

module.exports = IrcBot;