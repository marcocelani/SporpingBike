'use strict';

(function(SporpingBike, undefined){
SporpingBike.sporpingApp.controller('SearchController', ['$scope', '$uibModalInstance',
                                    'Global', 'sharedContent',
   function($scope, $uibModalInstance, Global, sharedContent){
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
            console.log($scope.search_item);   
        };
        
        $scope.cancel = function(){
            $uibModalInstance.dismiss();
        };
        
        init();
    }]);
}(window.SporpingBike = window.SporpingBike || {}));
