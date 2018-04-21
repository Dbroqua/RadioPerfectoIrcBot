let formatString = require('./helpers').formatString;

class Notifications {
    constructor(type, db) {
        this.db = db;
        this.type = type;
        this.attribute = (type == 'artist' ? 'artist' : 'songName');
    }

    action(from, text, data, callback) {
        let _actions = text.split(' '),
            that = this;

        // Custom artist/song set
        if (_actions.length > 3) {
            let value = '';
            for (let i = 3; i < _actions.length; i++) {
                value += (value === '' ? '' : ' ') + _actions[i];
            }

            data[that.attribute] = value;
        }

        switch (_actions[1]) {
            case 'add':
                switch (_actions[2]) {
                    case 'good':
                    case 'god':
                    case 'bad':
                        that.add(from, _actions[2], data, callback);
                        break;
                }
                break;
            case 'del':
                switch (_actions[2]) {
                    case 'good':
                    case 'god':
                    case 'bad':
                        that.remove(from, _actions[2], data, callback);
                        break;
                }
                break;
            case 'list':
                switch (_actions[2]) {
                    case 'good':
                    case 'god':
                    case 'bad':
                        that.list(from, _actions[2], data, callback);
                        break;
                }
                break;
            case 'lastplayed':
                that.lastplayed(from, text.substr(20), callback);

                break;
        }
    }

    add(from, notification, data, callback) {
        let that = this,
            item = {
                user: from,
                property: that.type,
                value: formatString(data[that.attribute])
            },
            query = {
                find: item,
                limit: 1
            };

        that.db.find('notifications', query, function(err, res) {
            if (err) {
                callback(from, '#500 - Impossible de sauvegarder cette demande (1)');
            } else {
                item.notification = notification;
                item.value = data[that.attribute];

                if (res.length === 0) {
                    that.db.save('notifications', item, function(err) {
                        if (err) {
                            callback(from, '#500 - Impossible de sauvegarder cette demande (2)');
                        } else {
                            callback(from, data[that.attribute] + ' correctement ajouté dans la liste des ' + notification);
                        }
                    });
                } else {
                    if (res[0].notification !== notification) {
                        that.db.update('notifications', res[0]._id, {
                            notification: notification
                        }, function(err) {
                            if (err) {
                                callback(from, '#500 - Impossible de sauvegarder cette demande (3)');
                            } else {
                                callback(from, data[that.attribute] + ' correctement déplacé de la liste des ' + res[0].notification + ' vers ' + notification);
                            }
                        });
                    } else {
                        callback(from, data[that.attribute] + ' est déja dans ta liste des ' + notification);
                    }
                }
            }
        });
    }

    remove(from, notification, data, callback) {
        let that = this,
            query = {
                find: {
                    user: from,
                    notification: notification,
                    property: that.type,
                    value: formatString(data[that.attribute])
                },
                limit: 1
            };

        that.db.find('notifications', query, function(err, res) {
            if (err) {
                callback(from, '#500 - Impossible de supprimer ' + data[that.attribute] + ' (1)');
            } else {
                if (res.length === 0) {
                    callback(from, '#404 - ' + data[that.attribute] + ' non trouvé dans cette liste');
                } else {

                    that.db.remove('notifications', {
                        _id: res[0]._id
                    }, function(err, res) {
                        if (err) {
                            callback(from, '#500 - Impossible de supprimer ' + data[that.attribute] + ' (1)');
                        } else {
                            callback(from, data[that.attribute] + ' correctement supprimé de la liste des ' + notification);
                        }
                    });
                }
            }
        });
    }

    list(from, notification, data, callback) {
        let that = this,
            query = {
                find: {
                    user: from,
                    notification: notification,
                    property: that.type
                },
                sort: {
                    value: 'asc'
                }
            };

        that.db.find('notifications', query, function(err, res) {
            if (err) {
                callback(from, '#500 - Impossible de charger cette liste');
            } else {
                if (res.length === 0) {
                    callback(from, 'Cette liste est vide');
                } else {
                    callback(from, 'Ta liste ' + notification + ' contient ' + res.length + ' élément(s) :');
                    let count = 0,
                        text = '',
                        _send = function() {
                            if (text !== '') {
                                callback(from, text);
                                text = '';
                            }
                        };

                    res.forEach(function(item) {
                        text += (text !== '' ? ', ' : '') + item.value;
                        count++;
                        if (count % 20 === 0) {
                            _send();
                            count = 0;
                        }
                    });
                    _send();
                    callback(from, '--------------------------------------------------------------');
                }
            }
        });
    }

    autoNotifyFor(value, callback) {
        let that = this,
            query = {
                find: {
                    property: that.type,
                    value: formatString(value)
                }
            };

        that.db.find('notifications', query, function(err, res) {
            if (err) {
                console.log(err);
            } else {
                if (res.length > 0) {
                    let results = [];
                    res.forEach(function(item) {
                        switch (item.notification) {
                            case 'good':
                                results.push({
                                    to: item.user,
                                    msg: 'Hey! Y\'a ' + value + ' ! Monte le son !'
                                });
                                break;
                            case 'god':
                                results.push({
                                    to: item.user,
                                    msg: 'Arrête tout, monte le son, dieu en personne revient avec ' + value + ' !'
                                });
                                break;
                            case 'bad':
                                results.push({
                                    to: item.user,
                                    msg: 'Bon... on est d\'accord... on peut couper le son là...'
                                });
                                break;
                        }
                    });

                    callback(results);
                }
            }
        });
    }

    lastplayed(from, data, callback) {
        let that = this,
            query = {
                find: {},
                sort: {
                    createdAt: 'desc'
                },
                limit: 1
            };

        query.find[that.type] = formatString(data);

        that.db.find('histories', query, function(err, res) {
            if (err) {
                callback(from, '#500 - Impossible de te répondre pour le moment !');
            } else {
                if (res.length === 0) {
                    callback(from, 'A priori ' + data + ' n\'a jamais était joué :/');
                } else {
                    let date = moment(res[0].createdAt).format('DD MMMM YYYY à HH:mm');
                    callback(from, data + ' a été joué pour la dernière fois sur cette putain de radio le ' + date);
                }
            }
        });
    }
}

module.exports = Notifications;