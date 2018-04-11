class Artists {
    constructor(db) {
        this.db = db;
    }

    action(from, text, data, pm) {
        let _actions = text.split(' '),
            that = this;
        switch (_actions[1]) {
            case 'add':
                switch (_actions[2]) {
                    case 'good':
                    case 'bad':
                        that.add(from, _actions[2], data, pm);
                        break;
                }
                break;
            case 'del':
                switch (_actions[2]) {
                    case 'good':
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
                property: 'artist',
                value: data.artist
            };

        that.db.find('notifications', item, function(err, res) {
            if (err) {
                pm(from, '#500 - Impossible d\'ajouter cet artiste (1)');
            } else {
                if (res.length === 0) {
                    that.db.save('notifications', item, function(err) {
                        if (err) {
                            pm(from, '#500 - Impossible d\'ajouter cet artiste (2)');
                        } else {
                            pm(from, 'Artiste ' + data.artist + ' correctement ajouté dans la liste des ' + notification);
                        }
                    });
                } else {
                    pm(from, 'l\'artiste ' + data.artist + ' est déja dans ta liste des ' + notification);
                }
            }
        });
    }

    remove(from, notification, data, pm) {
        let that = this,
            item = {
                user: from,
                notification: notification,
                property: 'artist',
                value: data.artist
            };

        that.db.renove('notifications', item, function(err, res) {
            if (err) {
                pm(from, '#500 - Impossible de supprimer cet artiste (1)');
            } else {
                pm(from, 'Artiste ' + data.artist + ' correctement supprimé de la liste des ' + notification);
            }
        });
    }
}

module.exports = Artists;