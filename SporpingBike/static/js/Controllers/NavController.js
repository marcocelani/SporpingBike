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
        $scope.search_item = {
			Title : '',
			Nickname : ''
		};
        $scope.isStartOpened = false;
		$scope.isEndOpened = false;
		$scope.isOpened = true;
		$scope.searchedBikes = [];
		$scope.oneAtATime = false;
		
		$scope.openStartDatePopUp = function(){
			$scope.isStartOpened = !$scope.isStartOpened;	
		};
		
		$scope.openEndDatePopUp = function(){
			$scope.isEndOpened = !$scope.isEndOpened;
		};
		
		$scope.getDate = function(date){
			if(date)
				return moment(date)
					   .format('DD-MMMM-YYYY');
			return '';
		};
		
        $scope.dateOptions = {
            formatYear: 'yyyy',
            maxDate: new Date(),
            startingDay: 1
        };
        
		$scope.showOnMap = function(index) {
			sharedContent.setCoords({lat : $scope.searchedBikes[index].loc.coordinates[0], 
									 lng : $scope.searchedBikes[index].loc.coordinates[1] 
									});
			window.location = '/#';
			$uibModalInstance.dismiss();
		};
		
        var init = function(){
            $scope.search_item.StartDate = new Date();
			$scope.search_item.EndDate = new Date();
            Global.changeMenu('nav_search');
			$scope.searchedBikes = sharedContent.getSearchedBikes();
			$scope.isOpened = ($scope.searchedBikes.length > 0) ? false : true;
        };
        
        $scope.search = function(){
			if(
				$scope.search_item.Title.trim() === '' &&
				$scope.search_item.Nickname.trim() === ''
			) {
				alert('No search term.');
				return;	
			}
			
            $http.post(HOSTNAME + '/api/0.1/search', JSON.stringify($scope.search_item))
			.then(
				function (result) {
					sharedContent.setSearchedBikes(result.data.data);
					$scope.searchedBikes = result.data.data;
					$scope.isOpened = (result.data.data.length > 0) ? false : true;
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