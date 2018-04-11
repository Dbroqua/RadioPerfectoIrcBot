class Notifications {
    constructor(type, db) {
        this.db = db;
        this.type = type;
        this.attribute = (type == 'artist' ? 'artist' : 'songName');
    }

    action(from, text, data, pm) {
        let _actions = text.split(' '),
            that = this;
        switch (_actions[1]) {
            case 'add':
                switch (_actions[2]) {
                    case 'good':
                    case 'god':
                    case 'bad':
                        that.add(from, _actions[2], data, pm);
                        break;
                }
                break;
            case 'del':
                switch (_actions[2]) {
                    case 'good':
                    case 'god':
                    case 'bad':
                        that.remove(from, _actions[2], data, pm);
                        break;
                }
                break;
            case 'list':
                switch (_actions[2]) {
                    case 'good':
                    case 'god':
                    case 'bad':
                        that.list(from, _actions[2], data, pm);
                        break;
                }
                break;
        }
    }

    add(from, notification, data, pm) {
        let that = this,
            item = {
                user: from,
                notification: notification,
                property: that.type,
                value: data[that.attribute]
            };

        that.db.find('notifications', item, function(err, res) {
            if (err) {
                pm(from, '#500 - Impossible de sauvegarder cette demande (1)');
            } else {
                if (res.length === 0) {
                    that.db.save('notifications', item, function(err) {
                        console.log(err);
                        if (err) {
                            pm(from, '#500 - Impossible de sauvegarder cette demande (2)');
                        } else {
                            pm(from, data[that.attribute] + ' correctement ajouté dans la liste des ' + notification);
                        }
                    });
                } else {
                    pm(from, data[that.attribute] + ' est déja dans ta liste des ' + notification);
                }
            }
        });
    }

    remove(from, notification, data, pm) {
        let that = this,
            item = {
                user: from,
                notification: notification,
                property: that.type,
                value: data[that.attribute]
            };

        that.db.remove('notifications', item, function(err, res) {
            if (err) {
                pm(from, '#500 - Impossible de supprimer ' + data[that.attribute] + ' (1)');
            } else {
                pm(from, data[that.attribute] + ' correctement supprimé de la liste des ' + notification);
            }
        });
    }

    list(from, notification, data, pm) {
        let that = this,
            item = {
                user: from,
                notification: notification,
                property: that.type
            };

        that.db.find('notifications', item, function(err, res) {
            if (err) {
                pm(from, '#500 - Impossible de charger cette liste');
            } else {
                if (res.length === 0) {
                    pm(from, 'Cette liste est vide');
                } else {
                    pm(from, 'Ta liste ' + notification + ' contient ' + res.length + ' élément(s) :');
                    let count = 0,
                        text = '',
                        _send = function() {
                            if (text !== '') {
                                pm(from, text);
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
                    pm(from, '--------------------------------------------------------------');
                }
            }
        });
    }

    autoNotifyFor(value, pm) {
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
                                pm(item.user, 'Hey! Y\'a ' + value + ' ! Monte le son !');
                                break;
                            case 'god':
                                pm(item.user, 'Arrête tout, monte le son, dieu en personne revient avec ' + value + ' !');
                                break;
                            case 'bad':
                                pm(item.user, 'Bon... on est d\'accord... on peut couper le son là...');
                                break;
                        }
                    });
                }
            }
        });
    }
}

module.exports = Notifications;