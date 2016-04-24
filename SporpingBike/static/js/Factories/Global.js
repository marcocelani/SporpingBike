(function(SporpingBike, undefined){
	SporpingBike.sporpingApp.factory('Global', 
		function(){
			/* It returns right date in DD MMMM YYYY format */
			var getDate = function(date){
				if(date){
					if(moment(date).isValid()){
						return moment(date).format('DD MMMM YYYY');
					}
				}
				return '';
			};
			
			var changeMenu = function(id){
				var home = angular.element('#nav_home');
				var search = angular.element('#nav_search');
				var add = angular.element('#nav_add');
				var about = angular.element('#nav_about');
				
				if(home)
					home.removeClass('active');
				if(search)
					search.removeClass('active');
				if(add)
					add.removeClass('active');
				if(about)
					about.removeClass('active');
				
				angular.element('#' + id).addClass('active');
			};
			
			return {
				getDate : getDate,
				changeMenu : changeMenu
			}
		}
	);
}(SporpingBike));