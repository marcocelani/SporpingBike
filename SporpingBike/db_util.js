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

var insertSporpingItem = function (doc, objectId, ext, next) {
    if (!utilities.checkDocument(doc)) {
        next(new Error('Cannot insert an invalid document.'));
        return;
    }
    MongoClient.connect(db_connection_str, function (err, db) {
        if (err) {
            console.log(err.stack);
            next(new Error('cannot connect:' + err.message));
        } else {
            db.collection(sporping_item_col, function (err, sporping_item) {
                if (err) {
                    console.log(err.stack);
                    next(new Error('cannot get collection:' + err.message));
                    db.close();
                } else {
                    doc._id = objectId;
                    doc.fileName = doc._id + '.' + ext.ext;
                    doc.creationDate = new Date();
                    doc.emailConfirmed = true; /* not used but necessary set to true */
                    //doc.emailHash = crypto.createHash('sha256').update('' + doc._id).digest('hex');
                    doc.enabled = false;
                    doc.rejected = false;
                    doc.loc = { type : "Point", coordinates : [parseFloat(doc.loc.coordinates[0]), parseFloat(doc.loc.coordinates[1])] };
                    if (!doc.userName)
                        doc.userName = "Anonymous";
                    sporping_item.insertOne(doc, { w : 1 }, function (err, r) {
                        if (err) {
                            console.log(err.stack);
                            next(new Error('cannot insert:' + err.message));
                        } else {
                            next(null, undefined);//doc.emailHash);
                            db.close();
                        }
                    });
                }
            });
        }
    });
};

var getDisabledBike = function (next) {
    MongoClient.connect(db_connection_str, function (err, db) {
        if (err) {
            console.log(err.stack);
            next(new Error('cannot connect:' + err.message));
        } else {
            db.collection(sporping_item_col, function (err, sporping_item) {
                if (err) {
                    console.log(err.stack);
                    next(new Error('cannot get collection:' + err.message));
                    db.close();
                } else {
                    sporping_item.find({ enabled: false, rejected : false }).toArray(function (err, docs) {
                        if (err) {
                            console.log(err.stack);
                            next(new Error(err.message));
                            db.close();
                        } else {
                            next(null, docs);
                            db.close();
                        }
                    });
                }
            });
        }
    });
};

var insert_into_last = function (id, whereToSearch) {
    MongoClient.connect(db_connection_str, function (err, db) {
        if (err) {
            console.log('cannot connect:' + err.message);
        } else {
            db.collection(sporping_item_col, function (err, collection) {
                if (err) {
                    console.log(err.stack);
                    next(new Error('cannot get collection:' + err.message));
                    db.close();
                } else {
                    var query = (whereToSearch) ? { _id : id, emailConfirmed : true } : 
								  { emailHash : id, enabled : true }; //emailHash is not used.
                    collection.find(query)
					.toArray(
                        function (err, documents) {
                            if (err) {
                                console.log(err.stack);
                                console.log('cannot insert document into sporping_last:' + err.message);
                                db.close();
                            } else {
                                if (documents.length == 0) {
                                    console.log('document is empty');
                                    db.close();
                                    return;
                                }
                                if (documents.length > 1)
                                    console.log('Warning! There are many documents, I chose first one.');
                                db.collection(sporping_item_last_col, function (err, sporping_last) {
                                    if (err) {
                                        console.log(err.stack);
                                        console.log('Error, cannot get collection:' + err.message);
                                        db.close();
                                    } else {
                                        var item = {
                                            _id : new ObjectID(documents[0]._id),
                                            foundDate : documents[0].foundDate,
                                            fileName : documents[0].fileName,
                                            userName : documents[0].userName,
                                            loc : documents[0].loc
                                        };
                                        if (documents[0].title) {
                                            item.title = documents[0].title;
                                        }
                                        sporping_last.insertOne(item, { w : 1 }, function (err, r) {
                                            if (err) {
                                                console.log(err.stack);
                                                console.log('Error, cannot insert:' + err.message);
                                                db.close();
                                                return false;
                                            }
                                            db.close();
                                            return true;
                                        });
                                    }
                                });
                            }
                        }
                    );
                }
            });
        }
    });
};

/* NOT USED */
var activateRequest = function (id, next) {
    MongoClient.connect(db_connection_str, function (err, db) {
        if (err) {
            console.log(err.stack);
            next(new Error('cannot connect:' + err.message));
        } else {
            db.collection(sporping_item_col, function (err, sporping_item) {
                if (err) {
                    console.log(err.stack);
                    next(new Error('cannot get collection:' + err.message));
                    db.close();
                } else {
                    sporping_item.updateOne({ emailHash: id, emailConfirmed: false }, { $set: { emailConfirmed: true } }, function (err, r) {
                        if (err) {
                            console.log(err.stack);
                            next(new Error('cannot update document:' + err.message));
                            db.close();
                        } else {
                            //result: { ok: 1, n: 0, upserted: [] },
                            if (r.result.n == 1) {
                                insert_into_last(id, false);
                                next(null);
                            } else {
                                next(new Error('Is ID valid?'));
                            }
                            db.close();
                        }
                    });
                }
            });
        }
    });
};

var enableBike = function (id, next) {
    MongoClient.connect(db_connection_str, function (err, db) {
        if (err) {
            console.log(err.stack);
            next(new Error('cannot connect:' + err.message));
        } else {
            db.collection(sporping_item_col, function (err, sporping_item) {
                if (err) {
                    console.log(err.stack);
                    next(new Error('cannot get collection:' + err.message));
                    db.close();
                } else {
                    var o_id = new ObjectID(id);
                    sporping_item.updateOne({ _id : o_id }, { $set: { enabled : true } }, function (err, r) {
                        if (err) {
                            console.log(err.stack);
                            next(new Error('cannot update document:' + err.message));
                            db.close();
                        } else {
                            if (r.result.n == 1) {
                                insert_into_last(o_id, true);
                                next(null);
                            } else {
                                next(new Error('is ID valid?'));
                            }
                            db.close();
                        }
                    });
                }
            });
        }
    });
};

var disableBike = function (id, next) {
    MongoClient.connect(db_connection_str, function (err, db) {
        if (err) {
            console.log(err.stack);
            next(new Error('cannot connect:' + err.message));
        } else {
            db.collection(sporping_item_col, function (err, sporping_item) {
                if (err) {
                    console.log(err.stack);
                    next(new Error('cannot get collection:' + err.message));
                    db.close();
                } else {
                    var o_id = new ObjectID(id);
                    /*sporping_item.find({_id : o_id}).toArray( function(err, documents){
						if(err){
							console.log(err.stack);
							console.log('cannot unlink file:' + err.message);
						} else {
							/*io_util.removeBike(documents[0], function(err){
								if(err) console.log(err);
							});
						}
					});*/
					sporping_item.updateOne({ _id : o_id }, { $set: { rejected : true } }, function (err, r) {
                        if (err) {
                            console.log(err.stack);
                            next(new Error('cannot update document:' + err.message));
                            db.close();
                        } else {
                            //result: { ok: 1, n: 0, upserted: [] },
                            if (r.result.n == 1) {
                                next(null);
                            } else {
                                next(new Error('Is ID valid?'));
                            }
                            db.close();
                        }
                    });
                }
            });
        }
    });
};

var getLastBikes = function (bikes, next) {
    if (!bikes)
        bikes = {};
    MongoClient.connect(db_connection_str, function (err, db) {
        if (err) {
            console.log(err.stack);
            next(new Error('cannot connect:' + err.message));
        } else {
            db.collection(sporping_item_last_col, function (err, sporping_last) {
                sporping_last.find({}).sort({ foundDate: -1 }).toArray(function (err, documents) {
                    if (err) {
                        console.log(err.stack);
                        next(new Error('cannot getting collection:' + err.message));
                        db.close();
                        return;
                    } else {
                        bikes.lastBikes = documents;
                        next(null);
                        db.close();
                    }
                });
            });
        }
    });
};

var getNearestBike = function (center, max, next) {
    MongoClient.connect(db_connection_str, function (err, db) {
        if (err) {
            console.log(err.stack);
            next(new Error('cannot connect:' + err.message));
        } else {
            if (center &&
			   center.lat &&
			   center.lng) {
                db.collection(sporping_item_col, function (err, sporping_item) {
                    if (err) {
                        console.log(err.stack);
                        next(new Error('cannot get collection:' + err.message));
                        db.close();
                    } else {
                        var distance = (max) ? MAX_DISTANCE : MIN_DISTANCE;
                        var result = [];
                        sporping_item.find(
                            {
                                loc: {
                                    $near: {
                                        $geometry: {
                                            type: 'Point', 
                                            coordinates : [parseFloat(center.lat), parseFloat(center.lng)]
                                        },
                                        $maxDistance : distance
                                    }
                                },
                                rejected: false
                            }
                        ).toArray(function (err, items) {
                            if (err) {
                                console.log(err.stack);
                                next(new Error('cannot get array:' + err.message));
                                db.close();
                            } else {
                                /* n steps  for Tick */
                                var n = 10;
                                var idx = 0;
                                var dim = items.length;
                                
                                function partial_loop() {
                                    for (var i = idx; i < (idx + n) && i < dim; ++i) {
                                        var obj = {
                                            id : items[i]._id,
                                            userName : items[i].userName, 
                                            loc : items[i].loc,
                                            fileName : items[i].fileName,
                                            foundDate : items[i].foundDate
                                        };
                                        if (items[i].title)
                                            obj.title = items[i].title;
                                        result.push(obj);
                                    }
                                    
                                    if (i >= dim) {
                                        next(null, result);
                                        db.close();
                                    } else {
                                        idx += n;
                                        /* the magic happens here :-) */
                                        process.nextTick(partial_loop);
                                    }
                                }
                                partial_loop();
                            }
                        });
                    }
                });
            }
        }
    });
};

/* This function returns the bikes count. */
var getBikesCount = function (next) {
    async.waterfall(
        [
            function (next) {
                MongoClient.connect(db_connection_str, function (err, db) {
                    if (err) {
                        next(err);
                        return;
                    }
                    next(null, db);
                });
            },
            function (db, next) {
                db.collection(sporping_item_col, function (err, sporping_item) {
                    if (err) {
                        next(err);
                        db.close();
                        return;
                    }
                    next(null, db, sporping_item);
                });
            },
            function (db, sporping_item, next) {
                sporping_item.find({ enabled : true, rejected : false })
                .count(function (err, count) {
                    if (err) {
                        next(err);
                        return;
                    }
                    next(null, count);
                    db.close();
                });
            }
        ], function (err, count) {
            if (err) {
                console.log(err.stack);
                next(err);
                return;
            }
            next(null, count);
        });
};

var randomBike = function (cb) {
    async.waterfall([
        function (cb) {
            MongoClient.connect(db_connection_str, function (err, db) {
                if (err) {
                    cb(err);
                    return;
                }
                cb(null, db);
            });
        },
        function (db, cb) {
            /* getting collection */
            db.collection(sporping_item_col, function (err, sporping_item) {
                if (err) {
                    cb(err);
                    db.close();
                    return;
                }
                cb(null, db, sporping_item);
            });
        },
        function (db, sporping_item, cb) {
            /* counting documents */
            sporping_item.find({ enabled : true, rejected : false }).count(function (err, count) {
                if (err) {
                    cb(err);
                    db.close();
                    return;
                }
                cb(null, db, sporping_item, count);
            });
        },
        /* getting document */
        function (db, sporping_item, count, cb) {
            var randomNumber = Math.floor(Math.random() * count);
            sporping_item.find({ enabled : true, rejected : false })
            .skip(randomNumber - 1)
            .nextObject(function (err, item) {
                if (err) {
                    cb(err);
                    db.close();
                    return;
                }
                if (item)
                    cb(null, { fileName : 'bike/' + item.fileName, coordinates : item.loc.coordinates });
                else
                    cb(new Error('No document found.'));
            });
        }
    ], function (err, data) {
        if (err) {
            console.log(err.stackTrace());
            cb(err);
            return;
        }
        cb(null, data);
    });
};

exports.insertSporpingItem = insertSporpingItem;
exports.getDisabledBike = getDisabledBike;
//exports.activateRequest = activateRequest;
exports.enableBike = enableBike;
exports.disableBike = disableBike;
exports.getLastBikes = getLastBikes;
exports.getNearestBike = getNearestBike;
exports.getBikesCount = getBikesCount;
exports.randomBike = randomBike;
