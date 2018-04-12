class Notifications {
    constructor(type, db) {
        this.db = db;
        this.type = type;
        this.attribute = (type == 'artist' ? 'artist' : 'songName');
    }

    action(from, text, data, callback) {
        let _actions = text.split(' '),
            that = this;
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
        }
    }

    add(from, notification, data, callback) {
        let that = this,
            item = {
                user: from,
                notification: notification,
                property: that.type,
                value: new RegExp('^' + data[that.attribute].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', "i")
            };

        that.db.find('notifications', item, function(err, res) {
            if (err) {
                callback(from, '#500 - Impossible de sauvegarder cette demande (1)');
            } else {
                if (res.length === 0) {
                    item.value = data[that.attribute];

                    that.db.save('notifications', item, function(err) {
                        console.log(err);
                        if (err) {
                            callback(from, '#500 - Impossible de sauvegarder cette demande (2)');
                        } else {
                            callback(from, data[that.attribute] + ' correctement ajouté dans la liste des ' + notification);
                        }
                    });
                } else {
                    callback(from, data[that.attribute] + ' est déja dans ta liste des ' + notification);
                }
            }
        });
    }

    remove(from, notification, data, callback) {
        let that = this,
            item = {
                user: from,
                notification: notification,
                property: that.type,
                value: new RegExp('^' + data[that.attribute].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', "i")
            };

        that.db.find('notifications', item, function(err, res) {
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
            item = {
                user: from,
                notification: notification,
                property: that.type
            };

        that.db.find('notifications', item, function(err, res) {
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
            item = {
                property: that.type,
                value: new RegExp('^' + value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', "i")
            };

        that.db.find('notifications', item, function(err, res) {
            if (err) {
                console.log(err);
            } else {
                if (res.length > 0) {
                    res.forEach(function(item) {
                        switch (item.notification) {
                            case 'good':
                                callback(item.user, 'Hey! Y\'a ' + value + ' ! Monte le son !');
                                break;
                            case 'god':
                                callback(item.user, 'Arrête tout, monte le son, dieu en personne revient avec ' + value + ' !');
                                break;
                            case 'bad':
                                callback(item.user, 'Bon... on est d\'accord... on peut couper le son là...');
                                break;
                        }
                    });
                }
            }
        });
    }
}

module.exports = Notifications;