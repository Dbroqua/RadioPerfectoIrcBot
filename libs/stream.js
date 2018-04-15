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
            if (!error && response.statusCode === 200) {
                let res = JSON.parse(body);
                if (res.artist !== undefined && res.songName !== undefined) {
                    callback(null, res);
                } else {
                    callback('Some good song... maybe :/', null);
                }
            } else {
                callback('Some good song... I think :D', null);
            }
        });
    }

    watcher() {
        let that = this;

        setInterval(function() {
            that.getStream(function(error, res) {
                if (!error) {
                    that.currentSong = res;
                    that.bot.currentSong(that.currentSong);
                    if (that.previousSong !== res.songName) {
                        that.previousSong = res.songName;
                        that.db.savePlayed(res);
                        that.bot.publicMessage('Now playing: ' + res.artist + ' - ' + res.songName);
                        that.artist.autoNotifyFor(res.artist, function(res) {
                            if (res !== undefined) {
                                res.forEach(function(row) {
                                    that.bot.pm(row.to, row.msg);
                                });
                            }
                        });
                        that.song.autoNotifyFor(res.songName, function(res) {
                            if (res) {
                                res.forEach(function(row) {
                                    that.bot.pm(row.to, row.msg);
                                });
                            }
                        });
                    }
                }
            });
        }, 4000);
    }
}

module.exports = Stream;