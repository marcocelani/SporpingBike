(function(SporpingBike, angular, undefined) {
	'use strict';
	
	SporpingBike.sporpingApp = angular.module('sporpingApp', ['ui.bootstrap', 'ngRoute', 'ngFileUpload']);

	SporpingBike.sporpingApp.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/', { controller: 'MainController', templateUrl: 'main.html' })
		.when('/add', { controller: 'AddSporpingController', templateUrl:'add_modal.html'})
		.when('/about', { controller: 'AboutController', templateUrl:'about.html' })
		.otherwise({controller: 'MainController', templateUrl: 'main.html'})
	}]);
	
	SporpingBike.sporpingApp.directive('styleParent', 
		function(){ 
			return {
				restrict: 'A',
				link: function(scope, elem, attr) {
				elem.on('load', function() {
					var w = $(this).width();
					var	h = $(this).height();
					var p = elem.parent();
					
					/*elem.css('max-width', '100% !important');
					elem.css('max-height', '100% !important');*/
					
					$(this).addClass('img-responsive');
					
					if(w > h){//landscape
						$(this).css('width', '100%');
					} else if(h >= w){//portrait
						$(this).css('width', '70%');
						
					 }
					p.css('margin-left', 'auto');
					p.css('margin-right', 'auto');
				});
				}
			};
		}
	);
}(window.SporpingBike = window.SporpingBike || {}, angular));

// sporpingApp.config(['$httpProvider', function($httpProvider) {
	// $httpProvider.defaults.useXDomain = false;
		// delete $httpProvider.defaults.headers.common['X-Requested-With'];
    // }
// ]);

