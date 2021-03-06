'use strict';

var http = require('http'),
    express = require('express'),
    multer = require('multer'),
    bodyParser = require('body-parser'),
    db_util = require('./db_util.js'),
    io_util = require('./io_util.js'),
    ObjectID = require('mongodb').ObjectID,
    utilities = require('./utilities.js'),
    net_util = require('./net_util.js'),
    configuration = require('./configuration.js'), /* Remember to set configuragion.jsv*/
    passport = require('passport'),
    BasicStrategy = require('passport-http').BasicStrategy,
    fs = require('fs'),
    url = require('url'),
    compress = require('compression'),
    async = require('async');

var config = configuration.config;

var upload = multer({ dest: config.BIKE_FOLDER })

passport.use(new BasicStrategy(
    function (username, password, done) {
        if (username.valueOf() === config.HTTP_AUTH_USR &&
            password.valueOf() === config.HTTP_AUTH_PWD)
            return done(null, true);
        else
            return done(null, false);
    }
));

var Ok = function (res, contentType, data) {
    if (res) {
        /* CORS stuff */
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.writeHead(200, { 'Content-Type' : contentType });
        res.end(data);
    }
    else
        throw new Error("response is null or undefined.");
};

var Ko = function (res , contentType, data) {
    if (res) {
        res.writeHead(500, { 'Content-Type' : contentType });
        res.end(data);
    }
    else
        throw new Error("response is null or undefined.");
};

var fagioli = function (req, res) {
    fs.readFile(config.ROOT_DOCUMENT + '/fagioli/messicani.html', function (err, data) {
        if (err) {
            Ko(res, 'text/plain', err.message);
            return;
        }
        Ok(res, 'text/html', data);
    });
};

var getMaxBike01 = function (req, res) {
    var center = url.parse(req.url, true).query;
    db_util.getNearestBike(center, true, function (err, result) {
        if (err) {
            Ko(res, 
                    'application/json', 
                 JSON.stringify({ status : 'ko!', message : 'getNearestBike failed:' + err.message })
            );
            return;
        }
        Ok(res, 'application/json', JSON.stringify(result))
    });
};

var getNearestBike01 = function (req, res) {
    var center = url.parse(req.url, true).query;
    db_util.getNearestBike(center, false, function (err, result) {
        if (err) {
            Ko(res, 'application/json',
                JSON.stringify({ status : 'ko!', message : 'getNearestBike failed:' + err.message })
            );
            return;
        }
        Ok(res, 'application/json', JSON.stringify(result));
    });
};

var getBikes01 = function (req, res) {
    db_util.getLastBikes(function (err, bikes) {
        if (err) {
            Ko(res, 'application/json', 
               JSON.stringify({ status : 'ko!', message : 'getdBikes failed: ' + err.message })
            );
            return;
        }
        Ok(res, 'application/json', JSON.stringify(bikes));
    });
};

var getAboutData01 = function (req, res) {
    async.waterfall([
        function (callback) {
            db_util.getBikesCount(function (err, count) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, count);
                }
            });
        },
        function (count, cb) {
            db_util.randomBike(function (err, bike) {
                if (err) {
                    callback(err);
                } else {
                    cb(null, { bike : bike, count : count });
                }
            });
        }
    ],
     function (err, bike) {
        if (err) {
            Ko(res, 'application/json',
                JSON.stringify({ status: 'ko!', message : 'getAboutData:' + err.message })
            );
            return;
        }
        Ok(res, 'application/json', JSON.stringify(bike));
    });
};

var getDisabled01 = function (req, res) {
    db_util.getDisabledBike(function (err, result) {
        if (err) {
            Ko(res, 'application/json', 
               JSON.stringify({ status : 'ko!', message : 'getDisabledBike failed: ' + err.message })
            );
        } else {
            Ok(res, 'application/json', JSON.stringify(result));
        }
    });
};

var enableBike01 = function (req, res) {
    db_util.enableBike(req.body.bike.id, function (err) {
        if (err) {
            Ko(res, 'application/json',
               JSON.stringify({ status : 'ko!', message : 'enableBike failed: ' + err.message })
            );
        } else {
            Ok(res, 'application/json', JSON.stringify({ status : 'ok' }));
        }
    });
};

var deleteBike01 = function (req, res) {
    db_util.disableBike(req.body.bike.id, function (err) {
        if (err) {
            Ko(res, 'application/json',
               JSON.stringify({ status : 'ko!', message : 'deleteBike failed: ' + err.message })
            )
        } else {
            Ok(res, 'application/json', JSON.stringify({ status : 'ok' }))
        }
    });
};

var add01 = function (req, res) {
    var notValidDoc = false;
    async.waterfall(
        [
            function (next) {
                if (!utilities.checkDocument(req.body.sporping)) {
                    notValidDoc = true;
                    var error = new Error('notValidDoc');
                    next(error);
                    return;
                }
                var oId = new ObjectID();
                io_util.processFile(req.file, oId, function (err, ext) {
                    if (err) {
                        next(err);
                        return;
                    }
                    next(null, oId, ext);
                });
            },
            function (oId, ext, next) {
                db_util.insertSporpingItem(req.body.sporping, oId, ext, function (err, result) {
                    if (err) {
                        next(err);
                        return;
                    }
                    next(null); /* result is for net_util.sendEmail */
                });
            },
            function (next) {
                net_util.sendNotification(req.body.sporping.userEmail,
                    req.body.sporping.userName, 
				    function (err) {
                        if (err)
                            console.log(err);
                        next(null);
                });
            }
        ], 
        function (err) {
            if (err) {
                if (notValidDoc) {
                    Ko(res, 'application/json',
                        JSON.stringify(
                        {
                            status : 'checkDocument: ko!', 
                            message : 'It\'s not valid object.'
                        })
                    );
                }
                else {
                    Ko(res, 'application/json',
                    JSON.stringify({ status : 'insertSporpingItem:ko!', message : err.message })
                    );
                }
                return;
            }
            Ok(res, 'application/json', JSON.stringify({ status: "ok" }));
        }
    );	
};

var search_api01 = function(req, res){
	if(!utilities.checkSearchDoc(req.body)){
		Ko(res, 'application/json', 
			JSON.stringify({ status : 'Ko!', message : 'Not a valid document.' })
		);
		return;
	}
    db_util.search(req.body, function(err, result){
        if(err){
            Ko(res,
                'application/json',
                JSON.stringify({ status: 'Ko!', message : err.message })
            );
            return;
        }
        Ok(res, 'application/json', JSON.stringify({ status : 'Ok!', data : result}));
    });
};

var manage404 = function(req, res, next){
    res.status(404);
    if (req.accepts('html')) {
        fs.readFile(config.ROOT_DOCUMENT + '/html/404.html', function(err, data){
            if(err){
                console.log(err.trace);
                res.end('<html><head><title>404.</title></head><body>404 NOT FOUND</body></html>');
                return;
            }
            res.end(data);
        });
    } else if(req.accepts('json')){
        res.end(JSON.stringify({ error: 'Not found' }));
    }
    else {
        res.type('txt').end('404 not found');
    }
}

process.on('uncaughtException', function (err) {
    console.log(err.stack);
    console.log('[ERR]:' + err.message);
});

var closeServer = function () {
    if (server)
        server.close();
};

process.on('SIGTERM', function () {
    closeServer();
    console.log('bye...');
    process.exit();
});

process.on('SIGINT', function () {
    if(config &&
        config.PRODUCTION === false){
        console.log('-GOT SIGINT-');
        process.kill(process.pid, 'SIGTERM');
    }
    //else NOP.
});

var server; 

var init = function(){
    var app = express();

    /******* ROUTING *******/
app.use(compress());
app.use('/', express.static(config.ROOT_DOCUMENT + '/html', { lastModified : true }));
app.use('/images', express.static(config.ROOT_DOCUMENT + '/images', { lastModified : true }));
app.use('/js', express.static(config.ROOT_DOCUMENT + '/js', { lastModified : true }));
app.use('/css', express.static(config.ROOT_DOCUMENT + '/css', { lastModified : true }));
app.use('/bike', express.static(config.BIKE_FOLDER, { lastModified : true }));
app.use('/fagioli/js', express.static(config.ROOT_DOCUMENT + '/js', { lastModified : true }));
app.use('/fagioli/css', express.static(config.ROOT_DOCUMENT + '/css', { lastModified : true }));
app.use('/fagioli/fonts', express.static(config.ROOT_DOCUMENT + '/fonts', { lastModified : true }));
app.use('/fagioli/bike', express.static(config.BIKE_FOLDER, { lastModified : true }));
app.use('/fonts', express.static(config.ROOT_DOCUMENT + '/fonts', { lastModified : true }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.get('/api/0.1/getMaxBike', getMaxBike01);
app.get(config.BIKE_ACTIVATOR_LOCATION, passport.authenticate('basic', { session : false }), fagioli);
app.get('/api/0.1/getNearestBike', getNearestBike01);
app.get('/api/0.1/getBikes', getBikes01);
app.get('/api/0.1/getAboutData', getAboutData01);
app.get('/api/0.1/getDisabled', passport.authenticate('basic', { session : false }), getDisabled01);
app.post('/api/0.1/enableBike', passport.authenticate('basic', { session : false }), enableBike01); 
app.post('/api/0.1/deleteBike', passport.authenticate('basic', { session : false }), deleteBike01);
app.post('/api/0.1/add', upload.single('file'), add01);
app.post('/api/0.1/search', search_api01);
/* 404 */
app.use(manage404);
/***********************/
    server = app.listen(config.HTTP_PORT);
    console.log('SporpingBike started (PID:' + process.pid + ').');
};

init();
