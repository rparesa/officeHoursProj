'use strict';

var CartServiceArray = [];

var myApp = angular.module('PencilsApp', ['ngSanitize', 'ui.router', 'ui.bootstrap','ngRoute']).constant('_', window._);
//configures routes to redirect user to correct page view
myApp.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('home', { //homepage
            url: '/',
            templateUrl: 'partials/home.html',
            controller: 'PencilsCtrl'
        })
        .state('orders', { //orders template 
            url: '/orders',
            templateUrl: 'partials/orders.html'
        })
		 .state('orders.pencils', { //orders pencil list page 
            url: '/pencils',
            templateUrl: 'partials/pencils.html',
            controller: 'PencilsCtrl'
		 })
        .state('orders.cart', { //orders cart page 
            url: '/cart',
            templateUrl: 'partials/cart.html',
            controller: 'CartCtrl'
        }).state('orders.id', { //orders details page
            url: '/:id',
            templateUrl: 'partials/pencil-id.html',
            controller: 'DetailsCtrl'
        })

		$urlRouterProvider.otherwise('/');

}])

//Controller for the Pencils page 
myApp.controller('PencilsCtrl', ['$scope', '$http', 'CartService', function($scope, $http, CartService) {
    $http.get('data/products.json').then(function(response) {
        var data = response.data;
        $scope.pencils = data;
    });
	$scope.cart = CartService.cart;
}]);


//Controller for the Orders page
myApp.controller('OrdersCtrl', ['$scope', '$http', 'CartService', function($scope, $http, CartService) {
    $http.get('data/products.json').then(function(response) {
        var data = response.data;
        $scope.pencils = data;
    });
    $scope.cart = CartService.cart;
}]);

//Controller for the details of each pencil page
myApp.controller('DetailsCtrl', ['$scope', '$stateParams', '$filter', '$http', 'CartService', function($scope, $stateParams, $filter, $http, CartService) {
    //gets pencil info from the json file
    $http.get('data/products.json').then(function(response) {
		var pencils = response.data;
		$scope.pencil = _.find(pencils, ['id', $stateParams.id]);
	});
        //initial quantity is set to 0
        $scope.quantity = 0;
          //used for the dropdown menu of color selection
        $scope.colors = {
            selectedItem: null,
            choices: [
				{name: "Black",value: "black" }, 
				{name: "Red",value: "red"}, 
				{name: "Green",value: "green"}, 
				{name: "Blue",value: "blue"}, 
				{name: "Purple",value: "purple"}, ]
        }
   
        //used to add pencils to the cart 
   $scope.savePencil = function() {
        if ($scope.quantity != undefined) {  //confirms there is a valid number of pencils 
            $scope.invalid = false; //changes button to be clickable
            var currentPencil = { //gets users input to save to a pencil
                name: $scope.pencil.name,
                quantity: Math.round($scope.quantity),
                color : $scope.colors.selectedItem,
                price: $scope.pencil.price
            }; 
            CartService.addPencil(currentPencil); //adds the pencils to the local storage cart
            $scope.invalid = true;
            $scope.quantity=0;
        } else {
            $scope.invalid = true;
        }
    }

    

}]);


//Controller for the cart 
myApp.controller('CartCtrl', ['$scope', '$http', '$uibModal', 'CartService', '_', function($scope, $http, $uibModal, CartService, _) {
    $scope.cart = CartService.cart; //gets data from the local storage
   $scope.updatePencils = function() {  //updates the total number of pencils 
        var total = 0;
        _.forEach($scope.cart, function(pencil) {
            total += (pencil.price * pencil.quantity);
        });
        return total;
    }

    $scope.removePencils = function(pencil) { //deletes the pencils 
        CartService.removePencils(pencil);
    };

    $scope.addOne = function(pencil) { //adds a single pencil if the + button is clicked
        var pencilId = _.findIndex(CartService.cart, pencil);
        CartService.cart[pencilId].quantity++;
        CartService.updatePencils();
    }

    $scope.subOne = function(pencil) { //removes a single pencil if the - button is clicked
        var pencilId = _.findIndex(CartService.cart, pencil);
        if(CartService.cart[pencilId].quantity ===1){
            CartService.removePencils(pencil);
        } else{
             CartService.cart[pencilId].quantity--;
        }
     
         CartService.updatePencils();
    }

  //opens modal to confirm buying
       $scope.modalOpen = function(){
             var  modalInstance = $uibModal.open({
            templateUrl: 'partials/modal.html', //partial to show
            controller: 'ModalCtrl', //controller for the modal
            });
       };

      $scope.getTotal = function(){
        $scope.total = 0;
         for(var i = 0; i < $scope.cart.length; i++){
            var product = $scope.cart[i];
            $scope.total += (product.price * product.quantity);
    }
    return $scope.total;
};
}]);


//Controller for the modal
myApp.controller('ModalCtrl', ['$scope', '$uibModalInstance', '_', 'CartService', function($scope, $uibModalInstance, _, CartService) {

    $scope.exit = function() {
        _.forEach(CartService.cart, function(pencil) {
            CartService.removePencils(pencil);
        })
        $uibModalInstance.close();
    }

}]);

//CartService used to keep current pencil count correct 
myApp.factory('CartService', function() {
    var service = {};

    if (localStorage.cart !== undefined && localStorage.cart !== null) { //get current cart info if it exists already
        service.cart = JSON.parse(localStorage.cart);  
    } else {
        service.cart = [];//if the cart isn't already initialized  make a new one
    }
    console.log(service.cart);
    console.log(service);

    service.addPencil = function(newPencil) { //adds a pencil
       var newItem = true;
       service.cart.forEach(function(pencil){
           if(newPencil.name === pencil.name && newPencil.color === pencil.color){
               pencil.quantity += newPencil.quantity;
               newItem = false;
           }
       })
       if(newItem){
           service.cart.push(newPencil);
       }
        localStorage.cart = JSON.stringify(service.cart);
    };

    service.removePencils = function(pencil) { //removes pencil
        service.cart.splice(_.findIndex(service.cart, pencil), 1);
        localStorage.cart = JSON.stringify(service.cart);
    };


    service.updatePencils = function() { //updates pencils
        localStorage.cart = JSON.stringify(service.cart);
    }
    return service;
});