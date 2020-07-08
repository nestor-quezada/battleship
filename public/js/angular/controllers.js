/* 
 * @author   Néstor Quezada Castillo <neqc2015@gmail.com>
 * 
 * Controllers de la aplicación.
 */
"use strict";

var appCtrls = angular.module('AppCtrls', []);

/* Controller de la página principal juego(pantalla lista de partidas) */

appCtrls.controller('AppCtrl', ['$scope', 'socket', 'game', 
                            function($scope, socket, game) {
    
    game.initGame();
        
    $('#viewport').attr('content', 'user-scalable=no, initial-scale=1, width=device-width');
        
    $scope.availableGames = [ 
            {
                n : 'Play online',
                r : 0
            
            }];
    $scope.user = {};    
        
    $scope.play = function(gameIndex) {
            
        var room = gameIndex;
        var clientData = {};
        clientData.nickname = $scope.user.nickname;
        clientData.room = room;
        $('#mainView').hide();

        var viewPortScale = 1 / window.devicePixelRatio;
        $('#viewport').attr('content', 'user-scalable=no, initial-scale=' + viewPortScale + ', width=device-width');

        socket.emit(EventCode.JOIN_GAME, clientData, true);
    };
   
    socket.on(EventCode.INI_STATUS, function(data){
      
        game.setInitialStatus(data.is);
        socket.id = data.id;
        game.startGame();
    
    });
   
   
}]);

/* Controller del cuadro para enviar mensajes */

appCtrls.controller('MessagesCtrl',['$scope','socket', function($scope, socket) {
    $scope.message = '';
        
    $scope.sendMessage = function(message){
        var m = message.trim();
        if(!m) return;
        socket.emit(EventCode.CHAT_MESSAGE, {id:socket.id,m:message}, true);
        $scope.message = '';
    };
        
}]);

/* Controller de la página donde aparece el juego */

appCtrls.controller('LoginCtrl',['$scope','socket',  function($scope,socket) {
    
    $scope.user = {
      nickname: ''
    };
    
    $scope.hideLogin = false;
    $scope.showWelcome = false;
    
    $scope.sendUserData = function (){
        if($scope.user.nickname.trim()){
            
            socket.nickname = $scope.user.nickname;
            $scope.hideLogin = true;
            $scope.showWelcome = true;
            
        }
    };
    
}])
.config(['$mdThemingProvider',function($mdThemingProvider) {

  $mdThemingProvider.theme('docs-dark', 'default')
    .primaryPalette('yellow')
    .dark();

}]);

/* WebSockets service */

appCtrls.factory('socket',['$rootScope', function ($rootScope) {
   
  
    var socket = new WebSocket("ws://"+window.location.hostname+":8000");
    var id;
    var events = [];
    socket.binaryType = "arraybuffer";
       
    socket.onclose = function() {
        console.log("disconnected");
        window.location.href = '/';
    };
    
    var decodeBinaryMessage = function(data){
        var view = new Uint8Array(data);
        var messType = view[0];
        return {type:messType,data:view};
    };
    
    
    var decodeJSONMessage = function(data){
        var mess = JSON.parse(data);
        return {type:mess.t, data:mess.d};
    };
    
    socket.emit = function(eventName, data, isText){
       isText ? socket.send(JSON.stringify({t:eventName,d:data})): socket.send(data);
       
    };

    socket.onopen = function(){
        console.log('connection opened');
    };
    
    socket.onmessage = function(e){
        var messg ;
        typeof(e.data) === 'string' ? messg = decodeJSONMessage(e.data): messg = decodeBinaryMessage(e.data);
       
        var type = messg.type;
        var data = messg.data;
              
        events.forEach(function(el, index){
            if(type === index){ 
                var args = data;
                
                events[index](args);
               
            } 
        });
    };
              
    return {
        on: function (eventName, callback) {
            events[eventName] = callback;
            
            
        },
        emit: function (eventName, data, isText) {
            socket.emit(eventName, data, isText);
        },
        id: id,
        nickname: ''
        
    };
}]);

/* Servicio que facilita el acceso al juego, permite adaptar el juego a diferentes tamaños de pantalla */

appCtrls.factory('game', ['$rootScope', 'socket', function ($rootScope, socket) {
    var game,
        setInitialStatus,
        canvasSize,
        initGame,
        startGame;
       
    setInitialStatus = function(status){
        game.setInitialStatus(status);
    };
    
    // Se necarga de adaptar el canvas a diferentes tamaños de pantalla
    canvasSize = function(){
        var canvasSize = {};
        
        canvasSize.w = $(window).width() * window.devicePixelRatio;
        canvasSize.h = $(window).height()* window.devicePixelRatio;
                       
        return canvasSize; 
    };
           
    initGame = function (){
        game = new BattleShip(canvasSize().w, canvasSize().h, '', socket); 
        game.init();
    };
    
    startGame = function (){
        $('#mainView').hide();
        game.start();
    };
    
    return {
        
        initGame: initGame,
        
        startGame: startGame,
        
        setInitialStatus : setInitialStatus
                
    };
    
}]);


