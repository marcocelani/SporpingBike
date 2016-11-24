(function(SporpingBike, angular, undefined){
'use strict';
var HOSTNAME = window.location.origin;
SporpingBike.sporpingManagement = angular.module('sporpingManagement', ['ui.bootstrap']);
	
SporpingBike.sporpingManagement.controller('ManagementController', ['$scope', '$q', '$http',
	function($scope, $q, $http){
		$scope.bikes = [];
		
		var map = null;
		var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
				osmAttribution = 'Map data &copy; 2012 <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
				osm = new L.TileLayer(osmUrl, {maxZoom: 18, attribution: osmAttribution});

		var init = function(){
			map = new L.Map('map', {zoomControl: true});
			map.setView(new L.LatLng(41.8933439, 12.4830718), 12).addLayer(osm);
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
					console.log(result.data);
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

		$scope.showOnMap = function(index){
			L.marker($scope.bikes[index].loc.coordinates).addTo(map);
			map.setView(new L.LatLng($scope.bikes[index].loc.coordinates[0], $scope.bikes[index].loc.coordinates[1]));
		};

		$scope.deleteBike = function(index){
			if(!confirm('Are your sure?'))
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
