'use strict';

var fs = require('fs');
var	readChunk = require('read-chunk');
var imageType = require('image-type');

var processFile = function(file, id, next){
	var buffer = readChunk(file.path, 0, file.size, function(error, buffer){
		if(error){
			next(new Error('Cannot read file:' + error.message), null);
		} else {
			var ext = imageType(buffer);
			fs.rename(file.path, file.destination + id + '.' + ext.ext, function(err){
				if(err){
					next(new Error(err.message), null);
				} else {
					next(null, ext);
				}
			});
		}
	});
};

/* NOT USED */
var removeBike = function(doc, next){
	if(doc){
		fs.unlink('bike/' + doc.fileName, function(err){
			if(err){
				console.log('cannot unlink:' + err.message);
				next(new Error(err.message));
			}
			next(null);
		});
	}
};

/* next(null, bike) is a random image file */
/*var randomBike = function(next){
	fs.readdir('./bike', function(err, fList){
		if(err){
			console.log(err.stack);
			next(new Error('error getting randomBike:' + err.message));
		} else {
			next(null, fList[Math.floor(Math.random() * fList.length)]);	
		}	
	});
};*/

exports.processFile = processFile;
//exports.removeBike = removeBike;
//exports.randomBike = randomBike;
