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

/* NOT USED */
var sendMail = function(emailTo, userName, sha256, next){
	if(!userName) userName = 'Anonymous';
	var mailOptions = {
		from: 'SporpingBike <sporpingbike@gmail@gmail.com>', // sender address
		to: emailTo, // list of receivers
		subject: 'Hello', // Subject line
		text: 'Thank you ' + userName + ' for adding new Bike.\n \
			   Now, please follow this link for enabling your request: \
			   \nhttp://'+HOSTNAME+'/activate?id=' + sha256, // plaintext body
		html: 'Thank you ' + userName + ' for adding new Bike.\n \
			   Now, please follow this link for enabling your request: \
			   \nhttp://'+HOSTNAME+'/activate?id=' + sha256  // html body
	};
	
	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			console.log(error);
			next(new Error(error.message));
		}
		console.log('Message sent: ' + info.response);
		next(null);
	});
};

var sendNotification = function(userEmail, userName, next){
	//userEmail is not used.
	if(!userName) userName = 'Anonymous';
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



//exports.sendMail = sendMail;
exports.sendNotification = sendNotification;
