'use strict';
var MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto');
var utilities = require('./utilities.js');
var ObjectID = require('mongodb').ObjectID;
var io_util = require('./io_util.js');
var configuration = require('./configuration.js');
var async = require('async');

var config = configuration.config;
var db_connection_str = config.DB_CONNECTION_STR;
var sporping_item_col = config.sporping_item_col;
var sporping_item_last_col = config.sporping_item_last_col;

var EXCLUDED_FIELDS = {
    userEmail: 0,
    creationDate: 0,
    emailConfirmed: 0,
    emailHash: 0,
    enabled: 0,
    rejected: 0,
};

var get_db = function (callback) {
    MongoClient.connect(db_connection_str, function (err, db) {
        if (err) {
            console.log(err.stack);
            callback(err);
            return;
        }
        callback(null, db);
    });
};

var get_collection = function (collection, callback) {
    async.waterfall([
        function (next) {
            get_db(function (err, db) {
                if (err) {
                    callback(err);
                    return;
                }
                next(null, db);
            });
        },
        function (db, next) {
            db.collection(collection, function (err, collection_obj) {
                if (err) {
                    console.log(err.stack);
                    callback(err);
                    db.close();
                    return;
                }
                next(null, db, collection_obj);
            })
        }
    ], function (err, db, collection_obj) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, db, collection_obj);
    });
};

/*
    input: 
        doc: the javascript object representing the bike;
        objectId: A mongodb objectId;
        ext: image extension (e.g. jpg, png, etc.);
    output: undefined.
*/
var insertSporpingItem = function (doc, objectId, ext, cb) {
    if (!utilities.checkDocument(doc)) {
        next(new Error('Cannot insert an invalid document.'));
        return;
    }
    get_collection(sporping_item_col, function (err, db, sporping_item) {
        if (err) {
            cb(err);
            return;
        }
        doc._id = objectId;
        doc.fileName = doc._id + '.' + ext.ext;
        doc.creationDate = new Date();
        doc.emailConfirmed = true; /* not used but necessary set to true */
        doc.enabled = false;
        doc.rejected = false;
        doc.loc = { type: "Point", coordinates: [parseFloat(doc.loc.coordinates[0]), parseFloat(doc.loc.coordinates[1])] };
        if (!doc.userName)
            doc.userName = "Anonymous";
        sporping_item.insertOne(doc, { w: 1 }, function (err, r) {
            if (err) {
                console.log(err.stack);
                next(err);
                db.close();
                return;
            }
            cb(null, {});//doc.emailHash);
            db.close();
        });
    });
};

/*
    output: array of sporping_item 
            in which 'enabled' and 
            'rejected' properties
            are set to false.
            An empty array otherwise. 
 */
var getDisabledBike = function (cb) {
    get_collection(sporping_item_col, function (err, db, sporping_item) {
        if (err) {
            cb(err);
            return;
        }
        sporping_item.find({ enabled: false, rejected: false })
            .toArray(function (err, docs) {
                if (err) {
                    console.log(err.stack);
                    next(err);
                    db.close();
                    return;
                }
                cb(null, docs);
                db.close();
            });
    });
};

var insert_into_last = function (id, whereToSearch) {
    async.waterfall([
        function (next) {
            get_db(function (err, db) {
                if (err) {
                    next(err);
                    return;
                }
                next(null, db);
            });
        },
        function (db, next) {
            db.collection(sporping_item_col, function (err, collection) {
                if (err) {
                    next(err);
                    db.close();
                    return;
                }
                next(null, db, collection);
            });
        },
        function (db, collection, next) {
            var query = (whereToSearch) ? { _id: id, emailConfirmed: true } :
                { emailHash: id, enabled: true }; //emailHash is not used.
            collection.find(query)
                .toArray(function (err, documents) {
                    if (err) {
                        next(err);
                        db.close();
                        return;
                    }
                    next(null, db, documents);
                });
        },
        function (db, documents, next) {
            if (documents.length == 0) {
                console.log('document is empty');
                db.close();
                return;
            }
            if (documents.length > 1)
                console.log('Warning! There are many documents, I chose first one.');
            db.collection(sporping_item_last_col, function (err, sporping_last) {
                if (err) {
                    next(err);
                    db.close();
                    return;
                }
                next(null, db, documents, sporping_last);
            })
        },
        function (db, documents, sporping_last, next) {
            var item = {
                _id: new ObjectID(documents[0]._id),
                foundDate: documents[0].foundDate,
                fileName: documents[0].fileName,
                userName: documents[0].userName,
                loc: documents[0].loc
            };
            if (documents[0].title) {
                item.title = documents[0].title;
            }
            sporping_last.insertOne(item, { w: 1 },
                function (err) {
                    if (err) {
                        console.log(err.stack);
                        console.log('Error, cannot insert:' + err.message);
                        db.close();
                        next(err);
                        return;
                    }
                    db.close();
                    next(null)
                });
        }
    ], function (err) {
        if (err) {
            console.log(err.stack);
            return false;
        }
        return true;
    });
};

var enableBike = function (id, cb) {
    get_collection(sporping_item_col, function (err, db, sporping_item) {
        if (err) {
            cb(err);
            return;
        }
        var o_id = new ObjectID(id);
        sporping_item.updateOne({ _id: o_id }, { $set: { enabled: true } }, function (err, r) {
            if (err) {
                console.log(err.stack);
                cb(new Error('cannot update document:' + err.message));
                db.close();
                return;
            }
            if (r.result.n == 1) {
                insert_into_last(o_id, true);
                cb(null);
            } else {
                cb(new Error('is ID valid?'));
            }
            db.close();
        });
    });
};

/*
    This function rejects a bike.
    input: 
        id: A mongodb objectId;
    output: null.
*/
var disableBike = function (id, cb) {
    get_collection(sporping_item_col, function (err, db, sporping_item) {
        if (err) {
            cb(err);
            return;
        }
        var o_id = new ObjectID(id);
        sporping_item.updateOne({ _id: o_id }, { $set: { rejected: true } }, function (err, r) {
            if (err) {
                console.log(err.stack);
                next(new Error('cannot update document:' + err.message));
                db.close();
                return;
            } //result: { ok: 1, n: 0, upserted: [] },
            if (r.result.n == 1) {
                cb(null);
            } else {
                cb(new Error('Is ID valid?'));
            }
            db.close();
        });
    });
};

/*
    It gets the all items in the capped collection.
*/
var getLastBikes = function (cb) {
    get_collection(sporping_item_last_col, function (err, db, sporping_last) {
        if (err) {
            cb(err);
            return;
        }
        async.waterfall([
            function (next) {
                sporping_last.find()
                    .sort({ foundDate: -1 })
                    .toArray(function (err, documents) {
                        if (err) {
                            console.log(err.stack);
                            next(new Error('cannot getting collection:' + err.message));
                            db.close();
                            return;
                        }
                        next(null, documents);
                        db.close();
                    });
            }], function (err, documents) {
                if (err) {
                    console.log(err.trace);
                    cb(err);
                    return;
                }
                var bikes = {};
                bikes.lastBikes = documents;
                cb(null, bikes);
            });
    });
};

/*
    Gets the bikes around the center between 
    config.MAX_DISTANCE or config.MIN_DISTANCE.
*/
var getNearestBike = function (center, max, cb) {
    if (!center && !center.lat && !center.lng) {
        next(new Error('center parameter is wrong.'));
        return;
    }

    get_collection(sporping_item_col, function (err, db, sporping_item) {
        if (err) {
            cb(err);
            return;
        }
        async.waterfall([
            function (next) {
                var distance = (max) ? config.MAX_DISTANCE : config.MIN_DISTANCE;
                sporping_item.find(
                    {
                        loc: {
                            $near: {
                                $geometry: {
                                    type: 'Point',
                                    coordinates: [parseFloat(center.lat), parseFloat(center.lng)]
                                },
                                $maxDistance: distance
                            }
                        },
                        rejected: false,
                        enabled: true,
                    }, EXCLUDED_FIELDS)
                    .toArray(function (err, items) {
                        if (err) {
                            console.log(err.stack);
                            next(new Error('cannot get array:' + err.message));
                            db.close();
                            return;
                        }
                        next(null, items);
                        db.close();
                    });
            }
        ], function (err, result) {
            if (err) {
                cb(err);
                return;
            }
            cb(null, result);
        });
    });
};

/* This function returns the bikes count. */
var getBikesCount = function (cb) {
    get_collection(sporping_item_col, function (err, db, sporping_item) {
        if (err) {
            cb(err);
            return;
        }
        async.waterfall([
            function (next) {
                sporping_item.find({ enabled: true, rejected: false })
                    .count(function (err, count) {
                        if (err) {
                            console.log(err.stack);
                            next(err);
                            db.close();
                            return;
                        }
                        next(null, count);
                        db.close();
                    });
            }
        ], function (err, count) {
            if (err) {
                cb(err);
                return;
            }
            cb(null, count);
        });
    });
};

var randomBike = function (cb) {
    get_collection(sporping_item_col, function (err, db, sporping_item) {
        if (err) {
            cb(err);
            return;
        }
        async.waterfall([
            function (next) {
                sporping_item.find({ enabled: true, rejected: false })
                    .count(function (err, count) {
                        if (err) {
                            cb(err);
                            db.close();
                            return;
                        }
                        next(null, db, sporping_item, count);
                    });
            },
            function (db, sporping_item, count, next) {
                var randomNumber = Math.floor(Math.random() * count);
                sporping_item.find({ enabled: true, rejected: false })
                    .skip(randomNumber)
                    .nextObject(function (err, item) {
                        if (err) {
                            cb(err);
                            db.close();
                            return;
                        }
                        if (item) {
                            next(null, { fileName: config.BIKE_FOLDER + item.fileName, coordinates: item.loc.coordinates });
                        }
                        else
                            next(new Error('No document found.'));
                        db.close();
                    })
            }
        ], function (err, obj) {
            if (err) {
                cb(err);
                return;
            }
            cb(null, obj);
        });
    });
};

/*
    input: an object with Title and/or
           Nickname.
    output: An array of object or empty
            array. 
*/
var search = function (data, cb) {
    if (!utilities.checkSearchDoc(data)) {
        var err = new Error('Not a valid document.');
        console.log(err.stack);
        next(err);
        return;
    }
    get_collection(sporping_item_col, function (err, db, sporping_item) {
        if (err) {
            cb(err);
            return;
        }
        var query = {};

        if (!data) {
            db.close();
            cb(null, []);
            return;
        }

        if (data.Title &&
            typeof (data.Title) === 'string' &&
            data.Title.trim() !== '' &&
            data.Title.length > 2
        ) query.title = { $regex: new RegExp(data.Title, "i") };
        
        if (data.Nickname &&
            typeof (data.Nickname) === 'string' &&
            data.Nickname.trim() !== '' &&
            data.Nickname.length > 2
        ) query.userName = { $regex: new RegExp(data.Nickname, "i") };

        if (Object.keys(query).length === 0 &&
            JSON.stringify(query) === JSON.stringify({})
        ) {
            db.close();
            cb(null, []);
            return;
        }

        if (!data.page)
            data.page = 1;

        query.enabled = true;
        query.rejected = false;

        async.waterfall(
            [
                function (next) {
                    sporping_item.find(query).count(function (err, count) {
                        if (err) {
                            db.close();
                            cb(err);
                            return;
                        }
                        next(null, count);
                    });
                },
                function (totalItems, next) {
                    sporping_item
                        .find(query, EXCLUDED_FIELDS)
                        .skip((data.page - 1) * config.PER_PAGE)
                        .limit(config.PER_PAGE)
                        .toArray(function (err, docs) {
                            if (err) {
                                console.log(err.stack);
                                db.close();
                                cb(err);
                                return;
                            }
                            next(null, { totalItems: totalItems, per_page: config.PER_PAGE, docs: docs });
                            db.close();
                        });
                }
            ],
            function (err, obj) {
                if (err) {
                    cb(err);
                    return;
                }
                cb(null, obj);
            });
    });
};

exports.insertSporpingItem = insertSporpingItem;
exports.getDisabledBike = getDisabledBike;
exports.enableBike = enableBike;
exports.disableBike = disableBike;
exports.getLastBikes = getLastBikes;
exports.getNearestBike = getNearestBike;
exports.getBikesCount = getBikesCount;
exports.randomBike = randomBike;
exports.search = search;
