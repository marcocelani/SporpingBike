(function(SporpingBike, undefined){
    'use strict';
    
    SporpingBike.sporpingApp
    .directive('geoLocationSearch', function(){
        return {
            restrict: 'E',
            templateUrl: window.location.origin + '/geolocation_search.html'
        }
    });
}(window.SporpingBike = window.SporpingBike || {}))