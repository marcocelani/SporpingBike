'use strict';
var extend = require('util')._extend;

var checkSearchDoc = function(doc){
	if(!doc){
		console.log('doc is undefined or null.');
		return false;
	}
	return true;
};

var checkDocument = function(doc){
	if(!doc){
		console.log('doc is undefined or null.');
		return false;
	}
	// if(!doc.userEmail){
		// console.log('userEmail is undefined or null.');
		// return false;
	// }
	// if(!doc.userName){
		// console.log('userName is undefined or null.');
		// return false;
	// }
	if(!doc.foundDate){
		console.log('foundDate is undefined or null.');
		return false;
	}
	if(!doc.loc){
		console.log('loc is undefined or null.');
		return false;
	}
	if(!doc.loc.type){
		console.log('type is undefined or null.');
		return false;
	}
	if(typeof doc.loc.type !== 'string'){
		console.log('type is not a string');
		return false;
	}
	if(doc.loc.type != "Point"){
		console.log('type is not a string equals to \'Point\'');
		return false;
	}
	if(!doc.loc.coordinates){
		console.log('coordinates is undefined or null.');
		return false;
	}
	if( Object.prototype.toString.call( doc.loc.coordinates ) 
		!== '[object Array]' ){
		console.log('coordinates is not an array.');
		return false;
	}
	if(doc.loc.coordinates.length != 2){
		console.log('coordinates length:' + doc.loc.coordinates.length);
		return false;
	}
	// if(!(doc.loc.coordinates[0] === Number(doc.loc.coordinates[0]) && 
		// doc.loc.coordinates[0] % 1 !== 0)){
		// console.log('coordinates[0] is not a float.');
		// return false;
	// }
	// if(!(doc.loc.coordinates[1] === Number(doc.loc.coordinates[1]) && 
		// doc.loc.coordinates[1] % 1 !== 0)){
		// console.log('coordinates[0] is not a float.');
		// return false;
    // }
    console.log('doc is a valid document =)');
	return true;
};

exports.checkDocument = checkDocument;
exports.checkSearchDoc = checkSearchDoc;