'use strict';

var fs = require('fs');
var	readChunk = require('read-chunk');
var imageType = require('image-type');

var processFile = function(file, id, next){
	readChunk(file.path, 0, file.size, function(error, buffer){
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

exports.processFile = processFile;
