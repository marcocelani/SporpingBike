(function(SporpingBike, undefined){
SporpingBike.sporpingApp.controller('NavController', ['$scope', 'Global',
	function($scope, Global){
		var init = function(){};
		
		$scope.changeMenu = function(id){
			Global.changeMenu(id);
		};
		
		init();
	}
]);
}(window.SporpingBike = window.SporpingBike || {}));