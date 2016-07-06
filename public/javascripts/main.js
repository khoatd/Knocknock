var app = angular.module('ng-main', [
    'ngResource',
    'ngRoute',
    'ngCookies',
    'ngSanitize',
    'btford.socket-io'
  ])
  .value('nickName', 'anonymous').directive('chatBox', function() {
        return {
            restrict: 'E',
            template: '<textarea style="width: 100%; height: 200px" ng-disable="true" ng-model="messageLog"></textarea>',
            controller: function($scope, $element) {
                $scope.$watch('messageLog', function() {
                  var textArea = $element[0].children[0];
                  textArea.scrollTop = textArea.scrollHeight;
                });
            }
        };
    })
.factory('chatSocket', function (socketFactory) {
      var socket = socketFactory();
      socket.forward('broadcast');
      return socket;
  }).value('messageFormatter', function(date, nick, message) {
    return date.toLocaleTimeString() + ' - ' + 
           nick + ' - ' + 
           message + '\n';
    
  });


app.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/', {
            templateUrl: 'partials/main.html',
            controller: 'MainCtrl'
        })
        .when('/chat', {
            templateUrl: 'partials/chat.html',
            controller: 'ChatCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);


app.controller('MainCtrl', ['$scope', '$resource', '$location',
    function($scope, $resource, $location){
        
    }]);

app.controller('ChatCtrl',
     function ($log, $scope, chatSocket, messageFormatter, nickName) {
  $scope.nickName = nickName;
  $scope.messageLog = 'Ready to chat!';
  $scope.sendMessage = function() {
    var match = $scope.message.match('^\/nick (.*)');

    if (angular.isDefined(match) && angular.isArray(match) && match.length === 2) {
      var oldNick = nickName;
      nickName = match[1];
      $scope.message = '';
      $scope.messageLog = messageFormatter(new Date(), 
                      nickName, 'nickname changed - from ' + 
                        oldNick + ' to ' + nickName + '!') + $scope.messageLog;
      $scope.nickName = nickName;
    }

    $log.debug('sending message', $scope.message);
    chatSocket.emit('message', nickName, $scope.message);
    $scope.message = '';
  };

  $scope.$on('socket:broadcast', function(event, data) {
    $log.debug('got a message', event.name);
    if (!data.payload) {
      $log.error('invalid message', 'event', event, 'data', JSON.stringify(data));
      return;
    } 
    $scope.$apply(function() {
      $scope.messageLog = $scope.messageLog + messageFormatter(new Date(), data.source, data.payload);
    });
  });
});


