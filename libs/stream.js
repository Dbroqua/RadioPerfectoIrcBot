const request = require('request');

let notifications = require('./notifications');

class Stream {
    constructor(bot, db, artist, song) {
        this.bot = bot;
        this.db = db;
        this.artist = new notifications('artist', db);
        this.song = new notifications('songName', db);
        this.url = "https://rc1.nobexinc.com//nowplaying.ashx?stationid=70642";
        this.currentSong = null;
        this.previousSong = null;

        this.watcher();
    }

    getStream(callback) {
        let that = this;

        request.post({
            url: that.url
        }, function(error, response, body) {
            if (response.statusCode === 200) {
                let res = JSON.parse(body);
                callback(null, res);
            } else {
                callback('Some good song... I think :D', null);
            }
        });
    }

    watcher() {
        let that = this;
        that.getStream(function(error, res) {
            if (error) {
                that.bot.publicMessage(err);
            } else {
                that.currentSong = res;
                that.bot.currentSong(that.currentSong);
                if (that.previousSong !== res.songName) {
                    that.previousSong = res.songName;
                    that.db.savePlayed(res);
                    that.bot.publicMessage('Now playing: ' + res.artist + ' - ' + res.songName);
                    that.artist.autoNotifyFor(res.artist, that.bot.pm);
                    that.song.autoNotifyFor(res.songName, that.bot.pm);
                }
            }

            setTimeout(function() {
                that.watcher();
            }, 5000);
        });
    }
}

module.exports = Stream;