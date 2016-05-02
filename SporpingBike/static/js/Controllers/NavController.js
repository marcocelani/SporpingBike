'use strict';

(function(SporpingBike, undefined){
var HOSTNAME = window.location.origin;

SporpingBike.sporpingApp.controller('NavController', ['$scope', 'Global', '$uibModal',
	function($scope, Global, $uibModal){
		var init = function(){};
		
		$scope.changeMenu = function(id){
			Global.changeMenu(id);
		};
		
		$scope.search = function(){
			$uibModal.open({
				animation : true,
				size : 'lg',
				controller : 'SearchController',
				templateUrl : 'search_modal.html'
			}).result.then(
				function(result){},
				function result(result) {
					Global.changeMenu('nav_home')
				}
			);
		};
		
		init();
	}
]);

SporpingBike.sporpingApp.controller('SearchController', ['$scope', '$uibModalInstance',
                                    'Global', 'sharedContent', '$http',
   function($scope, $uibModalInstance, Global, sharedContent, $http){
        $scope.search_item = {};
        $scope.isOpened = false;
        
		$scope.openDatePopUp = function(){
			$scope.isOpened = !$scope.isOpened;	
		};
		
        $scope.dateOptions = {
            formatYear: 'yyyy',
            maxDate: new Date(),
            startingDay: 1
        };
        
        var init = function(){
            $scope.search_item.FoundDate = new Date();
            Global.changeMenu('nav_search');
			console.log(sharedContent.searchedBikes.length);
        };
        
        $scope.search = function(){
            $http.post(HOSTNAME + '/api/0.1/search', JSON.stringify($scope.search_item))
			.then(
				function (result) {
					/* TODO */
				},
				function (result) {
					/* TODO */
				}
			);   
        };
        
        $scope.cancel = function(){
            $uibModalInstance.dismiss();
        };
        
        init();
    }]);
}(window.SporpingBike = window.SporpingBike || {}));