(function(SporpingBike, undefined){
SporpingBike.sporpingApp.controller('AboutController', ['$scope', '$http', '$q', 'Global', 
	function($scope, $http, $q, Global){
		$scope.aboutData = null;

		var init = function(){
			Global.changeMenu('nav_about');
			$q.all([getAboutData()])
			.then(function(){},function(){});		
		};
		
		$scope.goToMap = function(){
			window.location = '/#/?lat='+$scope.aboutData.bike.coordinates[0]+'&lng='+$scope.aboutData.bike.coordinates[1];
		};
		
		var getAboutData = function(){
			return $http.get(window.location.origin + '/api/0.1/getAboutData')
			.then(
				function(result){
					$scope.aboutData = result.data;
				},
				function(result){
					console.log(result);
				}
			);
		}
		init();
	}
]);
}(window.SporpingBike = window.SporpingBike || {}));
