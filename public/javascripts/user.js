var app = angular.module('ng-users', ['ngResource','ngRoute']);

app.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/', {
            templateUrl: 'partials/login.html',
            controller: 'LoginCtrl'
        })
        .when('/login', {
            templateUrl: 'partials/login.html',
            controller: 'LoginCtrl'
        })
        .when('/register', {
            templateUrl: 'partials/register.html',
            controller: 'RegisterCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);

app.controller('LoginCtrl', ['$scope', '$resource', '$location',
    function($scope, $resource, $location){
        $scope.submit = function(){
            var login = $resource('/accounts/login');
            login.save($scope.account, function(){
                $location.path('#/chat');
            });
        };
    }]);

app.controller('RegisterCtrl', ['$scope', '$resource', '$location',
    function($scope, $resource, $location){
        $scope.register = function(){
            var regis = $resource('/accounts/register');
            regis.save($scope.account, function(){
                $location.path('/');
            });
        };

        $scope.back = function(){
            console.log("clicked back");
            $location.path('#/');
        };
    }]);