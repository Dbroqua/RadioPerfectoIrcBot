let moment = require('moment'),
    formatString = require('./helpers').formatString;

moment.locale('fr');

class Statistics {
    constructor(db) {
        this.db = db;
    }

    action(from, text, data, callback) {
        let that = this,
            search = text.substr(6);

        if (search !== '') {
            that.lastplayed(from, search, callback);
        } else {
            that.last10songs(callback);
        }
    }

    lastplayed(from, search, callback) {
        let that = this,
            query = {
                find: {
                    $or: [{
                            artist: formatString(search)
                        },
                        {
                            songName: formatString(search)
                        }
                    ]
                },
                sort: {
                    createdAt: 'desc'
                },
                limit: 1
            };

        that.db.find('histories', query, function(err, res) {
            if (err) {
                console.log(err);
                callback('#500 - Impossible de te répondre pour le moment !', null);
            } else {
                if (res.length === 0) {
                    callback(null, [{
                        text: 'A priori ' + search + ' n\'a jamais était joué :/'
                    }]);
                } else {
                    res = res[0];

                    let date = moment(res.createdAt).format('DD MMMM YYYY à HH:mm');
                    res.text = search + ' a été joué pour la dernière fois sur cette putain de radio le ' + date;
                    callback(null, [res]);
                }
            }
        });
    }

    last10songs(callback) {
        let query = {
            find: {},
            sort: {
                createdAt: 'desc'
            },
            limit: 10
        };
        this.db.find('histories', query, function(err, histories) {
            let results = [];
            if (!err) {
                histories.forEach(function(history) {
                    results.push({
                        text: "- " + history.artist + ' - ' + history.songName,
                        playedAt: history.createdAt,
                        artist: history.artist,
                        songName: history.songName
                    });
                });
            }
            callback(err, results);
        });
    }
}

module.exports = Statistics;