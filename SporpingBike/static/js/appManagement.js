(function(SporpingBike, angular, undefined){
'use strict';
var HOSTNAME = window.location.origin;
SporpingBike.sporpingManagement = angular.module('sporpingManagement', ['ui.bootstrap']);

SporpingBike.sporpingManagement.directive('styleParent', 
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
	
SporpingBike.sporpingManagement.controller('ManagementController', ['$scope', '$q', '$http',
	function($scope, $q, $http){
		$scope.bikes = [];
		
		var init = function(){
			$q.all([getInactive()]).then(
				function(){
				},
				function(){
				}
			);
		}
		
		var getInactive = function(){
			return $http.get(HOSTNAME+'/api/0.1/getDisabled')
			.then(
				function(result){
					$scope.bikes = result.data;
				},
				function(result){
					console.log(result);
					alert('Error getting inactive bike. See log.');
				}
			);
		}
		
		$scope.enableBike = function(index){
			$http.post(HOSTNAME+'/api/0.1/enableBike', { bike : { id : $scope.bikes[index]._id }}).then(
				function(result){
					console.log(result.data);
					if(result.data.status == 'ok'){
						$scope.bikes.splice(index, 1);
					} else {
						console.log(result);
						alert('Error enabling Bike. See log.');
					}
				},
				function(result){
					console.log(result);
					alert('Error enabling Bike. See log.');
				}
			);
		};
		
		$scope.deleteBike = function(index){
			if(!confirm('Are your shure?'))
				return;
			$http.post(HOSTNAME+'/api/0.1/deleteBike', { bike : { id : $scope.bikes[index]._id }}).then(
				function(result){
					console.log(result.data);
					if(result.data.status == 'ok'){
						$scope.bikes.splice(index, 1);
					} else {
						console.log(result);
						alert('Error enabling Bike. See log.');
					}
				},
				function(result){
					console.log(result);
					alert('Error enabling Bike. See log.');
				}
			);
		};
		
		init();
	}
]);
}(window.SporpingBike = window.SporpingBike || {}, angular));
