'use strict';

(function (SporpingBike, undefined) {
	var HOSTNAME = window.location.origin;

	SporpingBike.sporpingApp.controller('NavController', ['$scope', 'Global', '$uibModal',
		function ($scope, Global, $uibModal) {
			var init = function () {
				Global.changeMenu('nav_home');
			};

			$scope.changeMenu = function (id) {
				Global.changeMenu(id);
			};

			$scope.search = function () {
				$uibModal.open({
					animation: true,
					size: 'lg',
					controller: 'SearchController',
					templateUrl: 'search_modal.html'
				}).result.then(
					function (result) { },
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
		function ($scope, $uibModalInstance, Global, sharedContent, $http) {

			var isTxtChanged = false;

			$scope.search_item = {
				Title: '',
				Nickname: ''
			};
			$scope.isStartOpened = false;
			$scope.isEndOpened = false;
			$scope.isOpened = true;
			$scope.searchedBikes = [];
			$scope.oneAtATime = false;
			$scope.clicked = false;

			$scope.openStartDatePopUp = function () {
				$scope.isStartOpened = !$scope.isStartOpened;
			};

			$scope.openEndDatePopUp = function () {
				$scope.isEndOpened = !$scope.isEndOpened;
			};

			$scope.getDate = function (date) {
				if (date)
					return moment(date)
						.format('DD-MMMM-YYYY');
				return '';
			};

			$scope.dateOptions = {
				formatYear: 'yyyy',
				maxDate: new Date(),
				startingDay: 1
			};

			$scope.showOnMap = function (index) {
				sharedContent.setCoords({
					lat: $scope.searchedBikes[index].loc.coordinates[0],
					lng: $scope.searchedBikes[index].loc.coordinates[1]
				});
				window.location = '/#';
				$uibModalInstance.dismiss();
			};

			var init = function () {
				resetParams();

				$scope.search_item.StartDate = new Date();
				$scope.search_item.EndDate = new Date();
				
				Global.changeMenu('nav_search');
				$scope.searchedBikes = sharedContent.getSearchedBikes().items;
				$scope.paginationParams.currentPage = sharedContent.getSearchedBikes().page;
				
				if(!$scope.paginationParams.currentPage)
					$scope.paginationParams.currentPage = 1;
				
				$scope.paginationParams.totalItems = sharedContent.getSearchedBikes().totalItems
				$scope.paginationParams.per_page = sharedContent.getSearchedBikes().per_page;
				$scope.search_item.Title = sharedContent.getSearchedBikes().Title;
				$scope.search_item.Nickname = sharedContent.getSearchedBikes().Nickname;

				if(!$scope.search_item.Title)
					$scope.search_item.Title = '';
				if(!$scope.search_item.Nickname)
					$scope.search_item.Nickname = '';

				$scope.isOpened = (angular.isArray($scope.searchedBikes) && $scope.searchedBikes.length > 0) ? false : true;
			};

			$scope.pageChanged = function () {
				$scope.search();
			};

			$scope.txtChanged = function () {
				isTxtChanged = true;
			};

			var resetParams = function () {
				if(!$scope.paginationParams)
					$scope.paginationParams = {};
					
				$scope.paginationParams.totalItems = 0;
				$scope.paginationParams.currentPage = 1;
				$scope.paginationParams.per_page = 5;
			};

			$scope.search = function () {
				if (
					$scope.search_item.Title.trim() === '' &&
					$scope.search_item.Nickname.trim() === ''
				) {
					alert('No search term.');
					return;
				}

				if($scope.search_item.Title != sharedContent.getSearchedBikes().Title ||
				   $scope.search_item.Nickname != sharedContent.getSearchedBikes().Nickname)
				   $scope.paginationParams.currentPage = 1;
				
				$scope.clicked = true;

				if(isTxtChanged){
					resetParams();
					isTxtChanged = false;
				}

				$scope.search_item.page = $scope.paginationParams.currentPage;

				$http.post(HOSTNAME + '/api/0.1/search', JSON.stringify($scope.search_item))
					.then(
					function (result) {
						sharedContent.setSearchedBikes({ page: $scope.paginationParams.currentPage,
														 items: result.data.data.docs,
														 totalItems: result.data.data.totalItems,
														 per_page: result.data.data.per_page,
														 Title: $scope.search_item.Title,
														 Nickname: $scope.search_item.Nickname
														});
						$scope.searchedBikes = result.data.data.docs;
						$scope.paginationParams.totalItems = result.data.data.totalItems
						$scope.paginationParams.per_page = result.data.data.per_page;
						$scope.isOpened = (result.data.data.length > 0) ? false : true;
						$scope.clicked = false;
					},
					function (result) {
						console.log(result);
						alert('Error:' + result.data.message);
						$scope.clicked = false;
					}
					);
			};

			$scope.cancel = function () {
				$uibModalInstance.dismiss();
			};

			init();
		}]);
} (window.SporpingBike = window.SporpingBike || {}));