(function () {
    'use strict';

    angular
        .module('app')
        .controller('Chat.IndexController', Controller);

    function Controller($window, $log, chatSocket, messageFormatter, nickName) {
        var vm = this;

        vm.message = "";
        vm.sendMessage = sendMessage;
        
        vm.nickName = nickName;
		vm.messageLog = 'Ready to chat!';
			
        initController();

        function initController() {
            // get current user
            
        }

        function sendMessage() {
			var match = vm.message.match('^\/nick (.*)');

			if (angular.isDefined(match) && angular.isArray(match) && match.length === 2) {
			  var oldNick = nickName;
			  nickName = match[1];
			  vm.message = '';
			  vm.messageLog = messageFormatter(new Date(), 
			                  nickName, 'nickname changed - from ' + 
			                    oldNick + ' to ' + nickName + '!') + vm.messageLog;
			  vm.nickName = nickName;
			}

			//$log.debug('sending message', vm.message);
			chatSocket.emit('message', nickName, vm.message);
			vm.message = '';
    	}

    	vm.$on('socket:broadcast', function(event, data) {
				//$log.debug('got a message', event.name);
				if (!data.payload) {
				  //$log.error('invalid message', 'event', event, 'data', JSON.stringify(data));
				  return;
				} 
				vm.$apply(function() {
				  vm.messageLog = vm.messageLog + messageFormatter(new Date(), data.source, data.payload);
				});
	        });
	}

})();