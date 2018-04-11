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

        that.db.renove('notifications', item, function(err, res) {
            if (err) {
                pm(from, '#500 - Impossible de supprimer ' + data[that.attribute] + ' (1)');
            } else {
                pm(from, data[that.attribute] + ' correctement supprimé de la liste des ' + notification);
            }
        });
    }
}

module.exports = Notifications;