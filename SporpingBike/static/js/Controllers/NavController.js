'use strict';

(function(SporpingBike, undefined){
var HOSTNAME = window.location.origin;

SporpingBike.sporpingApp.controller('NavController', ['$scope', 'Global', '$uibModal',
	function($scope, Global, $uibModal){
		var init = function(){
			Global.changeMenu('nav_home');
		};
		
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
        $scope.tabOpened = false;
		$scope.resultLength = 0;
		$scope.searchedBikes = [];
		
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
        };
        
        $scope.search = function(){
            $http.post(HOSTNAME + '/api/0.1/search', JSON.stringify($scope.search_item))
			.then(
				function (result) {
					sharedContent.setSearchedBikes(result.data.data);
					$scope.searchedBikes = result.data.data;
					$scope.resultLength = result.data.data.length;
					$scope.tabOpened = true;
				},
				function (result) {
					console.log(result);
					alert('Error:' + result.data.message);
				}
			);   
        };
        
        $scope.cancel = function(){
            $uibModalInstance.dismiss();
        };
        
        init();
    }]);
}(window.SporpingBike = window.SporpingBike || {}));