var fs = require('fs');

var randomBike = function(next){
	fs.readdir('./bike', function(err, fList){
		if(err){
			console.log(err.stack);
			next(new Error('error getting randomBike:' + err.message));
		} else {
			next(null, fList[Math.floor(Math.random() * fList.length)]);	
		}	
	});
};

randomBike(function(err, result)
	{
		if(err){
			console.log(err.stack);
		} else {
			console.log(result);
		}
	}
);
