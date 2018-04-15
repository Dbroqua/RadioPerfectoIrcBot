let moment = require('moment'),
    formatString = require('./helpers').formatString,
    keysrt = require('./helpers').keysrt,
    srt = require('./helpers').srt;

moment.locale('fr');

class Statistics {
    constructor(db) {
        this.db = db;
    }

    action(from, text, data, callback) {
        let that = this,
            _cmd = text.split(' ')[0],
            search = text.substr(6);

        switch (_cmd) {
            case '!last':
                if (search !== '') {
                    that.lastplayed(from, search, callback);
                } else {
                    that.last10songs(callback);
                }
                break;
            case '!stats':
                that.stats(text.substr(6), callback);
                break;
        }
    }

    stats(period, callback) {
        let that = this,
            query = {
                find: {},
                sort: {
                    artists: 'asc'
                }
            };

        if (period !== null) {
            period = period.replace(/ /g, '');
            let start = moment().startOf('day'),
                end = moment();
            switch (period) {
                case 'year':
                    start = start.startOf('year');
                    break;
                case 'today':
                    start = start.startOf('day');
                    break;
                case 'yesterday':
                    start = start.subtract(1, 'd').startOf('day');
                    end = end.subtract(1, 'd').endOf('day');
                    break;
                case 'week':
                    start = start.startOf('week');
                    break;
                case 'month':
                    start = start.startOf('month');
                    break;
                case 'lastmonth':
                    start = start.subtract(1, 'm').startOf('month');
                    end = end.subtract(1, 'm').endOf('month');
                    break;
            }

            query.find = {
                createdAt: {
                    $gte: start.format(),
                    $lte: end.format()
                }
            };

            that.db.find('histories', query, function(err, res) {
                if (err) {
                    callback('#500 - Impossible de te répondre pour le moment !', null);
                } else {
                    let _statistics = [],
                        _max = 16,
                        _length = res.length;

                    for (let i = 0; i < _length; i++) {
                        let _found = false;
                        for (let j = 0; j < _statistics.length; j++) {
                            if (_statistics[j].artist === res[i].artist) {
                                _statistics[j].played++;
                                _found = true;
                                break;
                            }
                        }
                        if (_found === false) {
                            _statistics.push({
                                artist: res[i].artist,
                                songName: res[i].songName,
                                played: 1
                            });
                        }
                    }

                    _statistics.sort(function(a, b) {
                        return a.played < b.played ? 1 : -1;
                    });

                    for (let i = 0; i < _statistics.length; i++) {
                        _statistics[i].text = _statistics[i].artist + ' a été entendu ' + _statistics[i].played + ' fois';

                        if (i > _max) {
                            break;
                        }
                    }

                    callback(null, _statistics);
                }
            });
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