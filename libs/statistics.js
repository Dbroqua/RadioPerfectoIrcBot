let moment = require('moment'),
    formatString = require('./helpers').formatString;

moment.locale('fr');

class Statistics {
    constructor(db) {
        this.db = db;
    }

    _setPeriodFilter(period) {
        period = period.split(' ')[0];

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
            case 'lastweek':
                start = start.subtract(1, 'w').startOf('week');
                end = end.subtract(1, 'w').endOf('week');
                break;
            case 'month':
                start = start.startOf('month');
                break;
            case 'lastmonth':
                start = start.subtract(1, 'm').startOf('month');
                end = end.subtract(1, 'm').endOf('month');
                break;
        }

        return {
            createdAt: {
                $gte: start.format(),
                $lte: end.format()
            }
        };
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
            case '!list':
                that.list(text.substr(6), callback);
                break;
            case '!stats':
                that.stats(text.substr(7), callback);
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
            let _firstSpace = period.indexOf(' '),
                _search = (_firstSpace > -1) ? period.substr(_firstSpace + 1) : null;

            query.find = this._setPeriodFilter(period);

            if (_search !== null) {
                query.find['$or'] = [{
                    'artist': formatString(_search)
                }, {
                    'songName': formatString(_search)
                }];
            }

            that.db.find('histories', query, function(err, res) {
                if (err) {
                    console.log(err);
                    callback('#500 - Impossible de te répondre pour le moment !', null);
                } else {
                    let _statistics = [],
                        _max = 16,
                        _length = res.length;


                    if (res.length > 0) {
                        for (let i = 0; i < _length; i++) {
                            let _found = false;
                            for (let j = 0; j < _statistics.length; j++) {
                                if (_statistics[j].artist.toLowerCase() === res[i].artist.toLowerCase()) {
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
                            _statistics[i].text = _search + ' a été entendu ' + _statistics[i].played + ' fois';

                            if (i > _max) {
                                break;
                            }
                        }
                    } else {
                        _statistics = [{
                            text: 'Aucune stat à afficher pour ces critères'
                        }];
                    }

                    callback(null, {
                        rows: _statistics,
                        to: 'public'
                    });
                }
            });
        }
    }

    list(period, callback) {
        let that = this,
            query = {
                find: {},
                sort: {
                    createdAt: 'asc'
                }
            };
        if (period !== null) {
            let _firstSpace = period.indexOf(' '),
                _artist = (_firstSpace > -1) ? period.substr(_firstSpace + 1) : null;

            query.find = this._setPeriodFilter(period);

            if (_artist !== null) {
                query.find['$or'] = [{
                    'artist': formatString(_artist)
                }, {
                    'songName': formatString(_artist)
                }];
            }

            console.log(query);

            that.db.find('histories', query, function(err, res) {
                if (err) {
                    console.log(err);
                    callback('#500 - Impossible de te répondre pour le moment !', null);
                } else {
                    let results = [];

                    res.forEach(function(result) {
                        results.push({
                            text: "- " + result.songName + ' le ' + moment(result.createdAt).format('D MMMM YYYY à H:m')
                        });
                    });

                    callback(null, {
                        rows: results,
                        to: 'public'
                    });
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
                    callback(null, {
                        rows: [{
                            text: 'A priori ' + search + ' n\'a jamais été joué, t\'es sur que c\'est du rock ?'
                        }],
                        to: 'public'
                    });
                } else {
                    res = res[0];

                    let date = moment(res.createdAt).format('DD MMMM YYYY à HH:mm');
                    callback(null, {
                        rows: [{
                            text: search + ' a été joué pour la dernière fois sur cette putain de radio le ' + date
                        }],
                        to: 'public'
                    });
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
            callback(null, {
                rows: results,
                to: 'public'
            });
        });
    }
}

module.exports = Statistics;