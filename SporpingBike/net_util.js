'use strict';

var nodemailer = require('nodemailer');
var configuration = require('./configuration.js');

var config = configuration.config;

var FAGIOLI = 'http://' + config.HOSTNAME + '/fagioli/messicani.html';

var transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: config.GMAIL_USR, 
		pass: config.GMAIL_PWD
	}
});

var sendNotification = function(userEmail, userName, next){
	//userEmail is not used.
	if(!userName) {
		userName = 'Anonymous';
	}
	
    var mailOptions = {
        from : 'SporpingBike <sporpingbike@gmail.com>',
        to : 'sporpingbike@gmail.com',
        subject: 'New Sporping!',
        text: 'New sporping added by ' + userName + '\n\nFor enabling it go here:' + FAGIOLI
	};

	transporter.sendMail(mailOptions, function(err, info){
		if(err){
			console.log(err);
			next(new Error(err.message));
		}
		console.log('Message sent:' + info.response);
		next(null);
	});
};

exports.sendNotification = sendNotification;
