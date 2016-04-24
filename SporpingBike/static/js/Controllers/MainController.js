(function(SporpingBike, undefined){
'use strict';
var HOSTNAME = window.location.origin;

SporpingBike.sporpingApp.controller('MainController', ['$scope', '$uibModal', '$http', '$q', '$compile', 
													   'sharedContent', 'Global',
	function($scope, $uibModal, $http, $q, $compile, sharedContent, Global){
		$scope.lastBikes = [];
		$scope.markers = [];
		var map = null;
		var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
				osmAttribution = 'Map data &copy; 2012 <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
				osm = new L.TileLayer(osmUrl, {maxZoom: 18, attribution: osmAttribution});
				
		var init = function(){
			$q.all(
				[getBikes()]
			).then(
				function(){},
				function(){}
			);
			initMap();
		};
		
		var initMap = function(){
			map = new L.Map('mapMain', {zoomControl: true});
			map.setView(new L.LatLng(41.8933439, 12.4830718), 15).addLayer(osm);
			map.on('dragend', function(e){ getNearestBike(false); });
			if(window.location.hash){
				if(window.location.hash.indexOf('?') == -1)
					return;
				var param = window.location.hash.substr(3, window.location.hash.length)
												.split("&");
				var lat = param[0].split("=")[1];
				var lng = param[1].split("=")[1];
				map.setView(new L.LatLng(parseFloat(lat), parseFloat(lng)), map.getMaxZoom());
				setTimeout(
					function(){
						window.scrollTo(0,document.body.scrollHeight);
						getNearestBike(true);
					}, 1000);
				
			}
		};
		
		$scope.showOnMap = function(index) {
			map.setView(new L.LatLng($scope.lastBikes[index].loc.coordinates[0],
								     $scope.lastBikes[index].loc.coordinates[1]
									 ),
						map.getMaxZoom());
			window.scrollTo(0,document.body.scrollHeight);
			setTimeout(function(){getNearestBike(true);}, 1000);
		};
		
		$scope.getDate = function(index){
			return Global.getDate($scope.lastBikes[index].foundDate);
		};
		
		var getNearestBike = function(max){
			// if(map.getZoom() != map.getMaxZoom()) return;
			var latLng = map.getCenter();
			var lat = latLng.lat;
			var lng = latLng.lng;
			var rest_url = HOSTNAME+'/api/0.1/getNearestBike';
			if( max ) rest_url = HOSTNAME+'/api/0.1/getMaxBike';
			$http.get(rest_url, { params : { lat : lat, lng : lng } } )
			.then(
				function(result){
					(function(){
						angular.forEach(result.data, function(item){
							if(!angular.isObject($scope.markers[item.id])){
								var fd = Global.getDate(item.foundDate);
								$scope.markers[item.id] = item;
								var m = null;
								if(item.title)
									m = L.marker([item.loc.coordinates[0], item.loc.coordinates[1]], {title : item.title, icon:sharedContent.markerIcon()});
								else 
									m = L.marker([item.loc.coordinates[0], item.loc.coordinates[1]], {icon:sharedContent.markerIcon()});
								m.bindPopup('', {closeOnClick: true, maxWidth : 250, maxHeight : 300 });
								if(item.title)
									m.setPopupContent($compile("<div id='markers'><p>"+item.userName+"</p><p>"+item.title+"</p><p>Found on:"+fd+"</p><img id='imgLatex' src='bike/" + item.fileName +"'><p><a class='pointed' data-ng-click='enlargeMe(\""+$scope.markers[item.id].id+"\")'>Enlarge View</a></p></div>")($scope)[0]);
								else 
									m.setPopupContent($compile("<div id='markers'><p>"+item.userName+"</p><p>Found on:"+fd+"</p><img id='imgLatex' src='bike/" + item.fileName +"'><p><a class='pointed' data-ng-click='enlargeMe(\""+$scope.markers[item.id].id+"\")'>Enlarge View</a></p></div>")($scope)[0]);
								
								m.addTo(map);
								$scope.markers[item.id].m = m;
							}
						});
					}());
				},
				function(result){
					console.log(result);
				}
			);
		};
		
		$scope.enlargeMe = function(id){
			$scope.markers[id].m.closePopup();
			sharedContent.setBike($scope.markers[id]);
			var modalInstance = $uibModal.open({
				animation : true,
				controller : 'MainControllerEnlargedView',
				templateUrl : 'enlargedView.html'
			});
		};
		
		var getBikes = function(){
			return $http.get(HOSTNAME+'/api/0.1/getBikes').then(
				function(result){
					$scope.lastBikes = result.data.lastBikes;
				},
				function(result){
					console.log(result);
					alert('Error getting bikes');
				}
			);
		};
		
		$scope.geoLocateMe = function(){
			map.locate({maxZoom : map.getMaxZoom(), setView : true});
			if($scope.herePopUp)
				map.removeLayer($scope.herePopUp);
			setTimeout(function(){getNearestBike(true);}, 1000);
			setTimeout(function(){
				$scope.herePopUp = L.popup().setLatLng(map.getCenter())
											.setContent("<div>You are here.</div>")
											.openOn(map);
			}, 3000);
		};
		
		init();
	}
]);

SporpingBike.sporpingApp.controller('SearchController', ['$scope', 
	function($scope){
		var init = function(){
			
		};
		
		init();
	}
]);

SporpingBike.sporpingApp.controller('MainControllerEnlargedView', ['$scope', '$uibModalInstance', 'sharedContent', 'Global',
	function($scope, $uibModalInstance, sharedContent, Global){
		$scope.bike = sharedContent.getBike();
		$scope.title = '';
		var init = function(){
			$scope.title = $scope.bike.title ? $scope.bike.title : '';
		};
		
		$scope.getDate = function() {
			return Global.getDate($scope.bike.foundDate);
		};
		
		$scope.close = function(){
			$uibModalInstance.dismiss();
		};
		
		init();
	}
]);

SporpingBike.sporpingApp.controller('AddSporpingController', ['$scope', '$http', 'Upload', 'Global',
	function($scope, $http, Upload, Global){
		$scope.sporping = {};
		$scope.searchItems = [];
		$scope.picFile = null;
		
		var map = null;
		var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
				osmAttribution = 'Map data &copy; 2012 <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
				osm = new L.TileLayer(osmUrl, {maxZoom: 18, attribution: osmAttribution});
		$scope.visibleAdd = true;	
		
		$scope.today = function() {
			$scope.dt = new Date();
		};
		$scope.today();

		$scope.clear = function () {
			$scope.dt = null;
		};

		// Disable weekend selection
		$scope.disabled = function(date, mode) {
			return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
		};

		$scope.toggleMin = function() {
			$scope.minDate = $scope.minDate ? null : new Date(2014, 1, 1);
		};
		$scope.toggleMin();
		$scope.maxDate = new Date();

		$scope.open = function($event) {
			$scope.status.opened = true;
		};

		$scope.setDate = function(year, month, day) {
			$scope.dt = new Date(year, month, day);
		};
		
		$scope.dateOptions = {
			formatYear: 'yy',
			startingDay: 1
		};

		$scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
		$scope.format = $scope.formats[0];

		$scope.status = {
			opened: false
		};

		var tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		var afterTomorrow = new Date();
		afterTomorrow.setDate(tomorrow.getDate() + 2);
		$scope.events =
			[
				{
					date: tomorrow,
					status: 'full'
				},
				{
					date: afterTomorrow,
					status: 'partially'
				}
			];

		$scope.getDayClass = function(date, mode) {
			if (mode === 'day') {
				var dayToCheck = new Date(date).setHours(0,0,0,0);

				for (var i=0;i<$scope.events.length;i++){
					var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

					if (dayToCheck === currentDay) {	
						return $scope.events[i].status;
					}
				}
			}

			return '';
		};
		
		var init = function(){
			Global.changeMenu('nav_add');
			map = new L.Map('map', {zoomControl: true});
			map.setView(new L.LatLng(41.8933439, 12.4830718), 12).addLayer(osm);
			map.on('dblclick', function(e){
				selectLocationByEvent(e.latlng.lat, e.latlng.lng);
			});
		};
		
		var selectLocationByEvent = function(lat, lng)
		{
			removeMarker();
			$scope.sporping.loc = { type: 'Point', coordinates : [parseFloat(lat), parseFloat(lng)]};
			L.marker($scope.sporping.loc.coordinates).addTo(map);
			map.setView(new L.LatLng(lat, lng));//.addLayer(osm);
		};
		
		var removeMarker = function(){
			map.eachLayer(
				function(layer){
					if (layer instanceof L.Marker)
						map.removeLayer(layer);
				}
			);
		};
		
		$scope.selectLocation = function(index){
			removeMarker();
			var locItem = $scope.searchItems[index];
			$scope.sporping.loc = {type : 'Point', coordinates: [parseFloat(locItem.lat), parseFloat(locItem.lon)]};
			L.marker($scope.sporping.loc.coordinates).addTo(map);
			map.setView(new L.LatLng(locItem.lat, locItem.lon));//.addLayer(osm);
		};
		
		var selectMyLocation = function(coords){
			removeMarker();
			$scope.sporping.loc = {type : 'Point', coordinates : [parseFloat(coords.coords.latitude), parseFloat(coords.coords.longitude)]};
			L.marker($scope.sporping.loc.coordinates).addTo(map);
			map.setView(new L.LatLng(coords.coords.latitude, coords.coords.longitude));//.addLayer(osm);
		};
		
		$scope.addr_search = function()  {
			var end_point = 'http://nominatim.openstreetmap.org/search';
			$http({
					url : end_point,
					params : {format : 'json', limit : '5', q : $scope.query_string, json_callback : 'JSON_CALLBACK' },
					method : 'JSONP',
				}).then(
				function(result){
					$scope.searchItems = result.data;
				},
				function(result){
					alert('error getting search.');
					console.log(result);
				}
			);
		};
		
		$scope.getGeolocation = function(){
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(selectMyLocation);
			} else { 
				alert("Geolocation is not supported by this browser.");
			}
		};
		
		$scope.elaborateFile = function(e){
				var input = document.getElementById("inputUpload");
				var file = input.files[0];
				
				if(!file) return;
				var picDiv = document.getElementById("picture");
				if(picDiv.firstChild)
					picDiv.removeChild(picDiv.firstChild);
				$scope.getGPS(file);
				var img = document.createElement("img");
				document.getElementById("picture").appendChild(img);
				var reader = new FileReader();  
				reader.onload = function(e) {
					img.src = e.target.result;
					
					img.onload = function(){
						img.style.maxWidth = '100%';
					img.style.maxHeight = '100%';
					img.style.marginBottom = '5px';	
					
					var canvas = document.getElementById("scaler");
					var ctx = canvas.getContext("2d");
				
					var MAX_WIDTH = 800;
					var MAX_HEIGHT = 600;
					var width = img.width;
					var height = img.height;
	
					if (width > height) {
						if (width > MAX_WIDTH) {
							height *= MAX_WIDTH / width;
							width = MAX_WIDTH;
						}
					} else {
						if (height > MAX_HEIGHT) {
							width *= MAX_HEIGHT / height;
							height = MAX_HEIGHT;
						}
					}
					canvas.width = width;
					canvas.height = height;
					console.log(width);
					console.log(height);
					ctx.drawImage(img, 0, 0, width, height);
				
					$scope.blob = dataURItoBlob(canvas.toDataURL("image/jpeg", 1));
					console.log($scope.blob);
					};
					
				};
				reader.readAsDataURL(file);
		};
		
		var dataURItoBlob = function(dataURI) {
			// convert base64/URLEncoded data component to raw binary data held in a string
			var byteString;
			if (dataURI.split(',')[0].indexOf('base64') >= 0)
				byteString = atob(dataURI.split(',')[1]);
			else
				byteString = unescape(dataURI.split(',')[1]);

			// separate out the mime component
			var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

			// write the bytes of the string to a typed array
			var ia = new Uint8Array(byteString.length);
			for (var i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}
			return new Blob([ia], {type:mimeString});
		};

   		$scope.getGPS = function(e){
			removeMarker();
			if(!e) return;
			EXIF.getData(e, function(){
				var lng;
				var lat;
				var lngArr = this.exifdata.GPSLatitude;
				var latArr = this.exifdata.GPSLongitude;
				if(lngArr && latArr){
					lng = lngArr[0].numerator + lngArr[1].numerator /
           				  (60 * lngArr[1].denominator) + lngArr[2].numerator / (3600 * lngArr[2].denominator);
					lat = latArr[0].numerator + latArr[1].numerator /
           				  (60 * latArr[1].denominator) + latArr[2].numerator / (3600 * latArr[2].denominator);
					selectLocationByEvent(lng, lat);
				}
			});
		};
		
		$scope.ok = function(){
			if(!$scope.sporping.loc){
				alert('Location data is invalid.');
				return;
			}
			if(!$scope.blob){
				alert('File not valid');
				return;
			}
			$scope.visibleAdd = !$scope.visibleAdd;
			$scope.sporping.foundDate = $scope.dt;
			// console.log($scope.blob);
			// console.log($scope.blob);
			
			// $http.post(HOSTNAME + '/api/0.1/add', {file : angular.toJson($scope.blob), sporping : $scope.sporping})
			// .then(
				// function(result){
					// alert('Thank you! Submission received.');
					// window.location = "#/";
				// },
				// function(result){
					// console.log(result.data);
					// alert('Error! Please try later.');
					// $scope.visibleAdd = !$scope.visibleAdd;
				// }
			// );
			Upload.upload({
				url: HOSTNAME + '/api/0.1/add',
				data: {file: $scope.blob, sporping : $scope.sporping}
			}).then(
				function(result){
					if(result.data.status == 'ok'){
						alert('Thank you! Submission received.');
						window.location = "#/";
					}
				},
				function(result){
					console.log(result.data);
					alert('Error! Please try later.');
					$scope.visibleAdd = !$scope.visibleAdd;
				}
			);
		};
		
		$scope.cancel = function (){
			alert('cancel clicked');
		};
		
		init();
	}
]);

SporpingBike.sporpingApp.service('sharedContent', 
	function(){
		var  bike = null;
		var marker = L.icon({
			iconUrl: 'images/cycling.png',
			//shadowUrl: 'leaf-shadow.png',
			iconSize:     [32, 37], // size of the icon
			//shadowSize:   [50, 64], // size of the shadow
			//iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
			//shadowAnchor: [4, 62],  // the same for the shadow
			//popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
		});
		return {
			getBike : function(){ return bike; },
			setBike : function(b) { bike = b; },
			markerIcon : function(){ return marker; } 
		}
	}
);
}(window.SporpingBike = window.SporpingBike || {}));
