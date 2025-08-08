// user-service.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let mongoDBConnectionString = process.env.MONGO_URL;

let Schema = mongoose.Schema;

let userSchema = new Schema({
    userName: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    favourites: [String],
    history: [String]
});

let User; 

module.exports.connect = function () {
    return new Promise(function (resolve, reject) {
        if (!mongoDBConnectionString) {
            reject("MONGO_URL not defined in environment");
            return;
        }

        // Use createConnection to match starter pattern (separate connection)
        let db = mongoose.createConnection(mongoDBConnectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        db.on('error', err => {
            reject(err);
        });

        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {
        if (!userData || !userData.userName) {
            reject("Missing user data");
            return;
        }

        if (userData.password != userData.password2) {
            reject("Passwords do not match");
            return;
        }

        bcrypt.hash(userData.password, 10)
            .then(hash => {
                userData.password = hash;
                const newUser = new User({
                    userName: userData.userName,
                    password: userData.password,
                    favourites: userData.favourites || [],
                    history: userData.history || []
                });

                newUser.save()
                    .then(() => {
                        resolve("User " + userData.userName + " successfully registered");
                    })
                    .catch(err => {
                        if (err && err.code === 11000) {
                            reject("User Name already taken");
                        } else {
                            reject("There was an error creating the user: " + err);
                        }
                    });
            })
            .catch(err => reject("Error hashing password: " + err));
    });
};

module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        if (!userData || !userData.userName) {
            reject("Missing user data");
            return;
        }

        User.findOne({ userName: userData.userName })
            .exec()
            .then(user => {
                if (!user) {
                    reject("Unable to find user " + userData.userName);
                    return;
                }
                bcrypt.compare(userData.password, user.password)
                    .then(match => {
                        if (match === true) {
                            resolve(user);
                        } else {
                            reject("Incorrect password for user " + userData.userName);
                        }
                    })
                    .catch(err => reject("Error comparing passwords: " + err));
            })
            .catch(err => {
                reject("Unable to find user " + userData.userName);
            });
    });
};

module.exports.getUserById = function (id) {
    return new Promise(function (resolve, reject) {
        if (!id) {
            reject("No id provided");
            return;
        }
        User.findById(id)
            .exec()
            .then(user => {
                if (user) resolve(user);
                else reject(`User not found: ${id}`);
            }).catch(err => {
                reject(`Unable to find user ${id} - ${err}`);
            });
    });
};

module.exports.getFavourites = function (id) {
    return new Promise(function (resolve, reject) {
        if (!id) {
            reject("No id provided");
            return;
        }
        User.findById(id)
            .exec()
            .then(user => {
                if (user) resolve(user.favourites || []);
                else reject(`User not found: ${id}`);
            }).catch(err => {
                reject(`Unable to get favourites for user with id: ${id} - ${err}`);
            });
    });
};

module.exports.addFavourite = function (id, favId) {
    return new Promise(function (resolve, reject) {
        if (!id || !favId) {
            reject("Missing id or favId");
            return;
        }

        User.findById(id).exec()
            .then(user => {
                if (!user) {
                    reject(`User not found: ${id}`);
                    return;
                }

                if (user.favourites.length < 50) {
                    User.findByIdAndUpdate(id,
                        { $addToSet: { favourites: favId } },
                        { new: true }
                    ).exec()
                        .then(updatedUser => { resolve(updatedUser.favourites); })
                        .catch(err => { reject(`Unable to update favourites for user with id: ${id} - ${err}`); });
                } else {
                    reject(`Unable to update favourites for user with id: ${id} - limit reached`);
                }
            })
            .catch(err => reject(`Unable to find user ${id} - ${err}`));
    });
};

module.exports.removeFavourite = function (id, favId) {
    return new Promise(function (resolve, reject) {
        if (!id || !favId) {
            reject("Missing id or favId");
            return;
        }

        User.findByIdAndUpdate(id,
            { $pull: { favourites: favId } },
            { new: true }
        ).exec()
            .then(user => {
                if (user) resolve(user.favourites || []);
                else reject(`User not found: ${id}`);
            })
            .catch(err => {
                reject(`Unable to update favourites for user with id: ${id} - ${err}`);
            });
    });
};

module.exports.getHistory = function (id) {
    return new Promise(function (resolve, reject) {
        if (!id) {
            reject("No id provided");
            return;
        }
        User.findById(id)
            .exec()
            .then(user => {
                if (user) resolve(user.history || []);
                else reject(`User not found: ${id}`);
            }).catch(err => {
                reject(`Unable to get history for user with id: ${id} - ${err}`);
            });
    });
};

module.exports.addHistory = function (id, historyId) {
    return new Promise(function (resolve, reject) {
        if (!id || !historyId) {
            reject("Missing id or historyId");
            return;
        }

        User.findById(id).exec()
            .then(user => {
                if (!user) {
                    reject(`User not found: ${id}`);
                    return;
                }

                if (user.history.length < 50) {
                    User.findByIdAndUpdate(id,
                        { $addToSet: { history: historyId } },
                        { new: true }
                    ).exec()
                        .then(updatedUser => { resolve(updatedUser.history); })
                        .catch(err => { reject(`Unable to update history for user with id: ${id} - ${err}`); });
                } else {
                    reject(`Unable to update history for user with id: ${id} - limit reached`);
                }
            })
            .catch(err => reject(`Unable to find user ${id} - ${err}`));
    });
};

module.exports.removeHistory = function (id, historyId) {
    return new Promise(function (resolve, reject) {
        if (!id || !historyId) {
            reject("Missing id or historyId");
            return;
        }

        User.findByIdAndUpdate(id,
            { $pull: { history: historyId } },
            { new: true }
        ).exec()
            .then(user => {
                if (user) resolve(user.history || []);
                else reject(`User not found: ${id}`);
            })
            .catch(err => {
                reject(`Unable to update history for user with id: ${id} - ${err}`);
            });
    });
};
