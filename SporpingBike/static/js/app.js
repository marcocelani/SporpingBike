(function(SporpingBike, angular, undefined) {
	'use strict';
	
	SporpingBike.sporpingApp = angular.module('sporpingApp', ['ui.bootstrap', 'ngRoute', 'ngFileUpload',
															  'ngTouch'
															 ]);

	SporpingBike.sporpingApp.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/', { controller: 'MainController', templateUrl: 'main.html' })
		.when('/add', { controller: 'AddSporpingController', templateUrl:'add_modal.html'})
		.when('/about', { controller: 'AboutController', templateUrl: 'about.html' })
		.otherwise({controller: 'MainController', templateUrl: 'main.html'})
	}]);
	
}(window.SporpingBike = window.SporpingBike || {}, angular));

// sporpingApp.config(['$httpProvider', function($httpProvider) {
	// $httpProvider.defaults.useXDomain = false;
		// delete $httpProvider.defaults.headers.common['X-Requested-With'];
    // }
// ]);

