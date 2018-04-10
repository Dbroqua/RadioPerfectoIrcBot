const mongoose = require('mongoose');

let schemas = {
        histories: mongoose.Schema({
            artist: String,
            songName: String,
            cover: String,
            videoID: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }),
        notifications: mongoose.Schema({
            user: String,
            notification: {
                type: String,
                enum: ['good', 'bad']
            },
            property: {
                type: String,
                enum: ['artist', 'songName']
            },
            value: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        })
    },
    models = {
        histories: mongoose.model('histories', schemas.histories),
        notifications: mongoose.model('notifications', schemas.notifications)
    };

class DB {
    constructor() {
        mongoose.connect('mongodb://localhost/irc-bot');
        this.db = mongoose.connection;

        this.db.on('error', console.error.bind(console, 'connection error:'));
    }

    savePlayed(values) {
        models.histories
            .find({})
            .sort({
                createdAt: 'desc'
            })
            .limit(1)
            .exec(function(err, last) {
                if (err || last.length === 0 || (last[0] !== undefined && last[0].artist !== values.artist && last[0].songName !== values.songName)) {
                    let history = new models.histories(values);
                    history.save();
                }
            });
    }

    last(action, limit) {
        models.histories
            .find({})
            .sort({
                createdAt: 'desc'
            })
            .limit(limit || 10)
            .exec(function(err, histories) {
                if (!err) {
                    histories.forEach(function(history) {
                        action("- " + history.artist + ' - ' + history.songName);
                    });
                }
            });
    }

    save(collection, values, callback) {
        let item = new models[collection](values);
        item.save(function(err) {
            callback(err);
        });
    }

    find(collection, query, callback) {
        models[collection]
            .find(query)
            .exec(callback);
    }
};

module.exports = DB;