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


; /* 
 * @author   Néstor Quezada Castillo <neqc2015@gmail.com>
 * 
 * Declaración del módulo de la aplicación y sus dependencias
 */
"use strict";

angular.module('BattleShip',['ngMaterial','AppCtrls','ngRoute'])
    .config(['$mdIconProvider', '$mdThemingProvider', '$routeProvider',function($mdIconProvider, $mdThemingProvider, $routeProvider) {
        var rootURL = "assets/icons/";

        $mdThemingProvider.theme('altTheme')
                        .primaryPalette('blue')
                        .accentPalette('red');    
        $mdIconProvider
                        //.defaultIconSet(rootURL + "assets/svg/avatars.svg", 128)
                        .icon("settings", rootURL + "settings.svg", 24)
                        .icon("game", rootURL + "game-icon.svg", 32)
                        .icon("menu", rootURL + "menu.svg", 24)
                        .icon("team", rootURL + "team.svg", 24);
        $routeProvider.
            when('/', {
                templateUrl: 'static/partials/landing.html',
                controller: 'AppCtrl'
            }).
            when('/game', {
                templateUrl: 'static/partials/game.html',
                controller: 'GameCtrl'
            }).
            otherwise({
                redirectTo: '/'
            });


    }]);

;/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase principal que engloba toda la lógica del juego(Estados del juego). Extiende de la clase Phaser.Game.
* Esta clase también se encarga de gestionar la comunicación con el servidor(Listeners).
* 
* @class BattleShip
* @constructor
* @param {number|string} gameWidth - La anchura del canvas en pixels.
* @param {number|string} gameHeight - La altura del canvas en pixels.
* @param {string|HTMLElement} gameContainer - Elemento contenedor donde se creará la etiqueta canvas.
* @param {socket} socket - Socket que sirve para la comunicación con el servidor.
*/
 
"use strict";
var BattleShip = function (gameWidth, gameHeight, gameContainer, socket ){
    Phaser.Game.call(this, gameWidth, gameHeight, Phaser.CANVAS, gameContainer);
       
    this.socket = socket;
    this.players = [];
    this.coins   = [];
    this.enemies = [];
    this.waiting = false;
    this.started = false;
    this.PingActive = false;
    
    // Estados del juego.    
    this.state.add("boot", BootState);
    this.state.add("load", LoadState);
    this.state.add("play", PlayState);
      
    // Inicializamos los listeners necesarios para la comunicaión con el servidor.
    this.initSocketHandlers();
    
    this.o;
            
};

BattleShip.prototype = Object.create(Phaser.Game.prototype);
BattleShip.prototype.constructor = BattleShip;

/* Inicializa el primer estado del juego(clase BootState).
 * 
 * @returns {undefined}
 */

BattleShip.prototype.init = function(){
    this.state.start("boot", false, false, null );
};

/* Sirve para iniciar el estado play( clase PlayState).
 * 
 * @returns {undefined}
 */

BattleShip.prototype.start = function(){
    this.state.start("play", false, false, null );
};

/* Facilita el guardar el estatus inicial del juego.
 * 
 * @param {Object} status - Configuración inicial del jugador.
 * @returns {undefined}
 */

BattleShip.prototype.setInitialStatus = function(status){
    this.initialStatus = status;
};

BattleShip.prototype.startPing = function(){
   
    var timer = this.time.create(false);
    this.socket.emit(EventCode.PING, Date.now(), true);
    timer.loop(1000, function(){
        this.PingActive = true;
        this.socket.emit(EventCode.PING, Date.now(), true);
    }.bind(this), this);
   
    timer.start();
    
    
};

/* Configura los listeners.
 * 
 * @returns {undefined}
 */

BattleShip.prototype.initSocketHandlers = function(){
      
    this.socket.on(EventCode.UPDATE_GAME,  this.onUpdateGame.bind(this));
    
    this.socket.on(EventCode.PING, this.onPing.bind(this));

    this.socket.on(EventCode.NEW_PLAYER ,  this.onPlayerJoined.bind(this));

    this.socket.on(EventCode.PLAYER_LEFT,  this.onPlayerLeft.bind(this));

    this.socket.on(EventCode.CHAT_MESSAGE, this.onChatMessage.bind(this));
    
    this.socket.on(EventCode.COINS, this.onCoins.bind(this));
    
    this.socket.on(EventCode.LEADERBOARD, this.onLeaderboard.bind(this));

};

BattleShip.prototype.onPing = function(data){
   this.net_latency = Date.now() - data;    
};

BattleShip.prototype.onLeaderboard = function(data){
    var leaderboard = 'Leaderboard \n\n';
    for(var i=0; i < data.length; i++){
       var nickname = data[i] === null ? 'anonymous' : data[i]; 
       leaderboard = leaderboard.concat(( i + 1 ) + '. ' + nickname + '\n' );
    }
    
    if(this.leaderboard)this.leaderboard.setText(leaderboard);
};

/* Método que sirve para partir el array de bytes(ArrayBuffer) y crear otro array( componentes tipo Number) 
 * con las coordenadas correspondientes.
 * 
 * @param {Uint8Array} data - Array con las coordenadas de las monedas.
 * @returns {undefined}
 */

BattleShip.prototype.onCoins = function(data){
    
    var view = data;
    var j=0;   
    for(var i = 1 ; i < view.length ; i = i + 4){
        var x = new Uint16Array(new Uint8Array([view[i], view[i+1]]).buffer)[0];
        var y = new Uint16Array(new Uint8Array([view[i+2], view[i+3]]).buffer)[0];
        
        this.coins[j] = [x, y];
        j++;
    }
    
};

/**
 * 
 * @param {Object} data - Objeto con la información de quien escribe el mensaje y el mensaje.
 * @returns {undefined}
 */
BattleShip.prototype.onChatMessage = function(data){
    
    var id = data.id;
    var message = data.m;
    for(var i = 0 ; i < this.players.length ; i++){

        if(this.players[i].id === id){

            this.players[i].showMessage(message);
            this.showMessageToAll(this.players[i].nickname, message);
            break;
        }
    }
    
    
};

/* Método que facilita mostrar el mensaje por pantalla.
 * 
 * @param {String} nickname - Nombre del jugador que escribe ell mensaje.
 * @param {String} message - Mensaje.
 * @returns {undefined}
 */

BattleShip.prototype.showMessageToAll = function(nickname, message){
     this.messagesToAll.setText(nickname + ' says ' + message);
};

/* Listener que sirve para añadir un nuevo jugador a la partida.
 * 
 * @param {Object} data - Objeto que contiene la información del nuevo jugador.
 * @returns {undefined}
 */

BattleShip.prototype.onPlayerJoined = function(data){
        
    var player = new Player( this, data.player );

    this.players.push(player);
                
    this.layerPlayers.add(player);

    if(this.players.length >= 2) this.waiting = false;
                 
};

/* Listener que se encarga de partir el Array de bytes y pasarle su correspondiente parte a cada jugador.
 * 
 * @param {Uint8Array} data - Actualizaciones en formato binario.
 * @returns {undefined}
 */

BattleShip.prototype.onUpdateGame = function(data){
      
    if(!this.started) return;
  
    // Los datos tienen la siguiente estructura:  EventCode(1 byte) + Status de cada uno de los jugadores(21 bytes/player) + Status enemigos 
    var nextStartIndex = this.getBinaryEntities(1, data);
    this.getBinaryEntities(nextStartIndex, data);
    
};

/* Función para decodificar cada parte del mensaje binario(cada grupo de entidades p.ej. enemigos o jugadores)
 * 
 * @param {Number} startIndex - Índice por donde empezar a leer.
 * @param {Uint8Array} data - Actualizaciones en formato binario.
 * @returns {undefined}
 */

BattleShip.prototype.getBinaryEntities = function(startIndex, data){
    // IF ENTITY TYPE === PLAYER  |ENTITY TYPE|NUM ENTITIES|STATUS PLAYER 1|STATUS PLAYER 2|...
    // IF ENTITY TYPE === ENEMY AND TYPE MESSAGE === UPDATE   |ENTITY TYPE|NUM ENTITIES|TYPE MESSAGE|STATUS ENEMY 1|STATUS ENEMY 2|...
    // IF ENTITY TYPE === ENEMY AND TYPE MESSAGE === CREATE   |ENTITY TYPE|NUM ENTITIES|TYPE MESSAGE|ID ENEMY 1    |ID ENEMY 2    |...
    // IF ENTITY TYPE === ENEMY AND TYPE MESSAGE === KILL     |ENTITY TYPE|NUM ENTITIES|TYPE MESSAGE|ID ENEMY 1    |ID ENEMY 2    |...
    
    
    var entityType = data[startIndex];
    var numOfEntities = data[startIndex + 1];
    
    var entityLen;
    
    switch(entityType){
        case Entity.Player.TYPE:
            entityLen = Entity.Player.LEN;
            var j = startIndex + 2;
        break;    
            
        case Entity.Enemy.TYPE:
                   
            var typeOfMessage = data[startIndex + 2];
            var j = startIndex + 3;
            
            
            if(typeOfMessage === Entity.Enemy.TypeOfMessage.Update.CODE ){
                entityLen = Entity.Enemy.TypeOfMessage.Update.LEN;
            }else if(typeOfMessage === Entity.Enemy.TypeOfMessage.Kill.CODE){
                entityLen = Entity.Enemy.TypeOfMessage.Kill.LEN;
            }else if(typeOfMessage === Entity.Enemy.TypeOfMessage.Create.CODE){
                entityLen = Entity.Enemy.TypeOfMessage.Create.LEN;
            }
        break;    
    }
        
    
    for(var i = 0; i < numOfEntities; i++){
        if(i > 0 && entityType === Entity.Enemy.TYPE ){
            
            typeOfMessage = data[j];
            entityLen = this.getLenOfBinaryMessage(entityType, typeOfMessage);
            j++;
            
        }
        console.log(data);
        var data2 = data;
        var entityData = data2.slice(j, j + entityLen);
       
        var id = entityData[0];
        
        if(entityType === Entity.Player.TYPE ){
            var player = this.getPlayerById(id);
            if(player) player.updateBuffer(entityData);
        }
        if(entityType === Entity.Enemy.TYPE){
            switch(typeOfMessage){
                case Entity.Enemy.TypeOfMessage.Update.CODE:
                        var enemy = this.getEnemyById(id);
                        if(enemy) enemy.updateBuffer(entityData);
                                               
                    break;
                    
                case Entity.Enemy.TypeOfMessage.Kill.CODE:
                       var enemy = this.getEnemyById(id);
                        if(enemy) enemy.tweenToDie();
                        var index = this.enemies.indexOf(enemy);
                        this.enemies.splice(index,1);
                         
                    break;
                    
                case Entity.Enemy.TypeOfMessage.Create.CODE:
                        if(this.layerEnemies){
                            
                            var alreadyExists = false;
                            for(var jj =0;jj<this.enemies.length;jj++){
                                if(this.enemies[jj].id === id){
                                  alreadyExists = true;
                                break;
                                } 
                            }
                            if(alreadyExists)continue;
                             
                            var enemy = new Enemy(this, 0, 0, 'enemy',0, id);
                            this.layerEnemies.add(enemy);
                            this.enemies.push(enemy);
                            
                        }
                    break;
                    
            }
           
        }
        
        
               
        j = j + entityLen;
    }
    
    return j;
};

/* Facilita obtener la longitud de los mensajes binarios
 * 
 * @param {Number} entityType - Tipo de entidad.
 * @param {Number} typeOfMessage - Tipo de mensaje.
 * @returns {undefined}
 */

BattleShip.prototype.getLenOfBinaryMessage = function(entityType, typeOfMessage){
    var entityLen;
    switch(entityType){
        case Entity.Player.TYPE:
            entityLen = Entity.Player.LEN;
            
        break;    
            
        case Entity.Enemy.TYPE:
                      
            if(typeOfMessage === Entity.Enemy.TypeOfMessage.Update.CODE ){
                entityLen = Entity.Enemy.TypeOfMessage.Update.LEN;
            }else if(typeOfMessage === Entity.Enemy.TypeOfMessage.Kill.CODE){
                entityLen = Entity.Enemy.TypeOfMessage.Kill.LEN;
            }else if(typeOfMessage === Entity.Enemy.TypeOfMessage.Create.CODE){
                entityLen = Entity.Enemy.TypeOfMessage.Create.LEN;
            }
        break;    
    }
    
    return entityLen;
};

/* Método que ayuda a buscar un jugador de manera sencilla.
 * 
 * @param {Number} playerId - Id publico del jugador.
 * @returns {Player}
 */

BattleShip.prototype.getPlayerById = function(playerId){
    for(var i=0 ; i < this.players.length ; i++){
        if(this.players[i].id === playerId) return this.players[i];
    }
};

/* Método que ayuda a buscar un enemigo de manera sencilla.
 * 
 * @param {Number} enemyId - Id publico del enemigo.
 * @returns {Enemy}
 */

BattleShip.prototype.getEnemyById = function(enemyId){
    for(var i=0 ; i < this.enemies.length ; i++){
        if(this.enemies[i].id === enemyId) return this.enemies[i];
    }
};

/* Se elimina al jugador que indica el mensaje y  se anima el sprite según el tipo de muerte que indica el mensaje.
 * Al ser autoritativo el servidor solo muere un jugador si este mensaje lo inidica.
 * 
 * @param {Object} data - Información del jugador que ha dejado la partida o que ha perdido junto con el tipo de muerte.
 *
 */

BattleShip.prototype.onPlayerLeft = function(data){
          
    var playerId = data.id;
    var typeOfDead = data.t;
    for(var i = 0 ; i < this.players.length ; i++){
        if(playerId === this.players[i].id){
            this.started = false;           
            switch( typeOfDead){
                case 'w':
                    this.whirlwindCollision(this.players[i]);                        
                    break;
                case 'b':
                    this.otherPlayerCollision(this.players[i]);
                    break;

            }
                
            
        }
    } 

    
    
};

/* Muerte por collisionar con torbellino. Se anima el sprite del jugador dando vueltas hasta que desaparece.
 * Si el jugador que muere es el local se muestra otra vez la pantalla inicial.
 * 
 * @param {type} player
 * @returns {undefined}
 */
BattleShip.prototype.whirlwindCollision = function (player){
    
    
    if(!player.isBouncing){
        player.isBouncing = true;
        player.tint = 0xffffff * 0.7;
        player.gun.destroy();
        var bounce1= this.add.tween(player);

        bounce1.to({width:0,height: 0, angle:720 }, 500);
        bounce1.onComplete.add(function(){
            this.killPlayer(player);
        }.bind(this), this);
        bounce1.start();
          
    }
    
     
};

/* En este caso el jugador muere por haber chocado contra otro. Se anima el sprite cambiando la opacidad hasta que desaparece.
 * Si el jugador que muere es el local se muestra otra vez la pantalla inicial.
 * 
 * @param {type} player
 * @returns {undefined}
 */

BattleShip.prototype.otherPlayerCollision = function (player){
   
    if(!player.isBouncing){
        player.isBouncing = true;
        player.tint = 0xffffff * 0.7;
        player.gun.destroy();
        var bounce1= this.add.tween(player);
        
        bounce1.to({alpha:0 }, 500);
        bounce1.onComplete.add(function(){
            this.killPlayer(player);
        }.bind(this), this);
        bounce1.start();
          
    }
    
    
};

/**
 * Se encarga de eliminar al jugador local o remoto.
 * 
 * @param {Player} player - Jugador que se ha de eliminar.
 * @returns {undefined}
 */

BattleShip.prototype.killPlayer = function (player){
    if(player.id === this.socket.id) {
        $('#mainView').show();
        if(this.device.desktop)player.emitter.destroy();
        
        player.destroy();
        

    }else{
        if(this.device.desktop)player.emitter.destroy();
        player.gun.destroy();
        player.destroy();
        var index = this.players.indexOf(player);
        this.players.splice(index,1);

        if(this.players.length === 1 && this.players[0].id === this.socket.id ){
            if(this.waitingLabel){
                this.waitingLabel.revive();
            }else{
                this.waitingLabel = this.add.bitmapText( 255, 255, 'p2', this.socket.nickname.toUpperCase() 
                    + ' \nwaiting for other players...', 20 );
                this.waitingLabel.fixedToCamera = true;
                this.waitingLabel.angle = 180;
                this.waiting = true;

            };

        }else{

           
            if(this.waitingLabel !== undefined)this.waitingLabel.destroy();
        }
    }
};
  
    
/**
 * Sirve para obtener un número determinado de componentes mediante interpolación.
 * 
 * @param {Array} arrX - Componentes x inicial y final a interpolar.
 * @param {Array} arrY - Componentes y inicial y final a interpolar.
 * @param {Array} arrR - Componentes rotation inicial y final a interpolar.
 * @param {Array} numComp - Número de componentes devueltas por el método.
 * @returns {Array} Array que contiene las muestras interpoladas, incluyendo las componentes(inicial y final) que se le han pasado al método.
 * 
 */

BattleShip.prototype.getInterpolatedData = function (arrX, arrY, arrR, numComp){
        var factX,
            factY,
            factR,
            interpData = new Array(numComp);
        // Como el jugador puede detenerse durante bastante tiempo con esta consición evitamos hacer operaciones de interpolación costosas e innecesarias.
        if(arrX[arrX.length-1] === arrX[0] && arrY[arrY.length-1] === arrY[0] && arrR[arrR.length-1] === arrR[0]){

            for (var i=0; i < numComp;i++){
                interpData[i] =  [ arrX[0], arrY[0], arrR[0] ] ;

            }

            return interpData;

        }     
        // Hallamos el factor que sirve para calcular las componentes interpoladas. Si la posición final e inicial son las mismas este factor es cero, lo que quiere decir que se ha mantenido por ejemplo la rotación constante pero no la posición x o y.
        arrX[arrX.length-1] !== arrX[0] ? 
            factX = 1/(numComp-1) : factX=0 ;
        arrY[arrY.length-1] !== arrY[0] ? 
            factY = 1/(numComp-1) : factY=0;

        // Correción para que la interpolación se adapte al sistema de coordenadas angulares de Phaser 180,-180.
        if(arrR[arrR.length-1] !== arrR[0]){
            // Primero convertimos los ángulos negativos en positivos 0,360 para facilitar el cálculo.
            if(arrR[arrR.length-1] < 0) arrR[arrR.length-1] = arrR[arrR.length-1] + 2*Math.PI;
            if(arrR[0] < 0) arrR[0] = arrR[0] + 2*Math.PI;

            if(Math.abs((arrR[arrR.length-1] - arrR[0])) > 2*Math.PI - Math.abs((arrR[arrR.length-1] - arrR[0]))){
               arrR[arrR.length-1] = arrR[arrR.length-1] - 2*Math.PI;
            }

            factR = 1/(numComp-1);
        }else{

            factR = 0;
        }  
        

        for(var i=0; i < numComp;i++){
            var dataX =  this.math.linearInterpolation(arrX, parseFloat(factX*i));
            var dataY =  this.math.linearInterpolation(arrY, parseFloat(factY*i));
            var dataR =  this.math.linearInterpolation(arrR, parseFloat(factR*i));
            if(dataR > Math.PI) dataR = dataR - 2*Math.PI; // Reconvertimos los ángulos mayores de 180 en ángulos negativos.
            interpData[i] =  [ dataX, dataY, dataR ] ;
        }

        return interpData;
    
    
    
    
};

;/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase que sirve para facilitar la animación de las balas.
* 
* @class Missile
* @constructor
* @param {Phaser.Game} game - Objeto game.
* @param {Number} x - Coordeanada x inicial del sprite.
* @param {Number} y - Coordeanada y inicial del sprite.
* @param {String} key - Nombre del recurso a utilizar para el sprite.
* @param {Number} frame - Si es un sprite sheet el numero del frame que se quiere utilizar.
*/
"use strict";
var Missile = function(game, x, y, key, frame, player) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
  
    this.WOBBLE_LIMIT = 15; 
    this.WOBBLE_SPEED = 100;
            
    this.anchor = new Phaser.Point(0.5, 0.5);
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.exists =false;
    this.wobble = this.WOBBLE_LIMIT;
    this.explode = true;
    this.player = player;
    this.game.add.tween(this)
        .to(
            { wobble: -this.WOBBLE_LIMIT },
            this.WOBBLE_SPEED, Phaser.Easing.Sinusoidal.Out, true, 0,
            Number.POSITIVE_INFINITY, true
        );

    this.explosion = game.add.sprite(0, 0, 'bexplosion');
    this.explosion.visible = false;
    this.explosion.animations.add('explosion');
    this.explosion.anchor.setTo(0.5);
    
    this.events.onKilled.add(this.dieWithExplosion, this);

};

// Extiende de la clase Phaser.Sprite
Missile.prototype = Object.create(Phaser.Sprite.prototype);
Missile.prototype.constructor = Missile;

/**
 * Se llama automaticamente por Phaser. Dentro de este se cambia la rotación de la bala para dar un efecto a la bala.
 * 
 * @returns {undefined}
 */

Missile.prototype.update = function() {
    this.rotation = this.targetRotation + this.game.math.degToRad(this.wobble);
    switch(this.player.level){
        case 1:
            
            break;
        case 2:
            
            this.explosion.scale.setTo(1.2);
            break;
        case 3:
           
            this.explosion.scale.setTo(1.9);
            break;
    }
};

/**
 * Al morir la bala se crea una explosión.
 * 
 * @returns {undefined}
 */
Missile.prototype.dieWithExplosion = function() {
    if(this.explode){
        this.explosion.reset(this.x, this.y);
        this.explosion.play('explosion', 10, false, true);
    }
   
};

;/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase que sirve para facilitar la animación de las balas.
* 
* @class Enemy
* @constructor
* @param {Phaser.Game} game - Objeto game.
* @param {Number} x - Coordeanada x inicial del enemigo.
* @param {Number} y - Coordeanada y inicial del enemigo.
* @param {String} key - Nombre del recurso a utilizar para el sprite.
* @param {Number} frame - Si es un sprite sheet el numero del frame que se quiere utilizar.
*/
"use strict";
var Enemy = function(game, x, y, key, frame, id) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
             
    this.anchor = new Phaser.Point(0.5, 0.5);
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.coorBuffer = [];
    this.anchor.setTo(0.5);
    this.id = id;
    this.visible = false;
    this.moves = false;
   
    this.explosion = game.add.sprite(0, 0, 'explosion');
    this.explosion.visible = false;
    this.explosion.animations.add('explosion');
    this.explosion.anchor.setTo(0.5);
    this.time_acumulator = 0;
    this.num_frames = 5;
    console.log('enemy id:' + this.id)
};

// Extiende de la clase Phaser.Sprite
Enemy.prototype = Object.create(Phaser.Sprite.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.prototype.I_X = 1;        
Enemy.prototype.I_Y = 2;
Enemy.prototype.I_R = 3;
Enemy.prototype.I_S = 4;
Enemy.prototype.INI_FRAMES = 2; 

Enemy.prototype.minFrames = 2;        // Número mínimo de estados del sprite para poder empezar a interpolar.
Enemy.prototype.tweenComplete = true; // Variable que indica si la interpolación se ha completado.
Enemy.prototype.interpIndex = 0;      
Enemy.prototype.minLen = 2;           // Variable que indica el tamaño máximo del buffer antes de dejar de usar la interpolación.

/**
 * Método para crear la explosión y configurarle las coordenadas donde debe aparecer.
 * 
 * @returns {undefined}
 */

Enemy.prototype.dieWithExplosion = function() {
    this.explosion.reset(this.x, this.y);
    this.explosion.play('explosion', 10, false, true);
};

/**
 * Se llama este método cuando el enemigo es eliminado para dar un efecto de explosión.
 * 
 * @returns {undefined}
 */

Enemy.prototype.tweenToDie = function() {
    
    this.dieWithExplosion();
    this.destroy();
    
};

/**
 * Se llama en cada dibujado del canvas. Se aprovecha este método para realizar la interpolación. Es similar a lo que se hace con el sprite de cada jugador.
 * 
 * @returns {undefined}
 */

Enemy.prototype.update = function() {

    this.updatePhysics();
    
};

Enemy.prototype.updatePhysics = function(){
       
    if( this.tweenComplete && this.coorBuffer.length === 0 ){
        this.minFrames = this.INI_FRAMES;
        return;
    }
       
    if(this.coorBuffer.length >= this.minFrames &&  this.tweenComplete){
       
        if(this.minFrames === this.INI_FRAMES){
            this.minFrames = 1;
            this.tweenComplete = true;
            this.x = parseFloat(this.coorBuffer[0][this.I_X].toFixed(3));
            this.y = parseFloat(this.coorBuffer[0][this.I_Y].toFixed(3));
            this.rotation = this.coorBuffer[0][this.I_R];
            this.coorBuffer.shift();
            
        }
        if(this.coorBuffer.length > 1) { 
            this.coorBuffer.splice(1,this.coorBuffer.length-1);
        }
         
        this.latestState = this.coorBuffer[0];
         
        if(this.num_frames > 2 ){
            
            this.tweenComplete = false;
            this.tweenData = this.game.getInterpolatedData(
                                                [this.x, parseFloat(this.latestState[this.I_X].toFixed(3))],
                                                [this.y, parseFloat(this.latestState[this.I_Y].toFixed(3))],
                                                [this.rotation, parseFloat(this.latestState[this.I_R].toFixed(3))], this.num_frames);
            this.tweenData.shift();                                     
            this.coorBuffer.shift();                                    
        }
        
    }
    
    if(!this.tweenComplete){
        this.interpolate();
    }
      
    
};

/**
 * Se llama cada vez que llega una actualización para este sprite. El buffer ayuda a compensar los problemas de delay y jitter.
 * 
 * 
 * @param {Uint8Array} data
 * @returns {undefined}
 */

Enemy.prototype.updateBuffer = function(data){
    // Estructura de data | ID | X | X | Y | Y| R | R | 7 bytes
    this.visible = true;
    
    var state = [];
    
;   state[this.I_X] = new Float32Array(data.slice(1,5).buffer)[0];
    state[this.I_Y] = new Float32Array(data.slice(5,9).buffer)[0];
    state[this.I_R] = new Float32Array(data.slice(9,13).buffer)[0];
    state[this.I_S] = new Uint32Array(data.slice(13,17).buffer)[0];
            
    this.coorBuffer.push(state);
   
      
};

/* Facilita el asignar los diferente valores de la interpolación al ritmo de los dibujados del juego.
 * 
 * @returns {undefined}
 */

Enemy.prototype.interpolate = function (){
    
    this.x = parseFloat(this.tweenData[this.interpIndex][0].toFixed(3));
    this.y = parseFloat(this.tweenData[this.interpIndex][1].toFixed(3));
    this.rotation = parseFloat(this.tweenData[this.interpIndex][2].toFixed(3));
    
   
    this.interpIndex++;
    if(this.interpIndex === this.tweenData.length){
        this.interpIndex = 0;
        this.tweenComplete = true;
        this.last = Date.now();
        
        
    }
    
    
};
;/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase encargada de controlar y dibujar a cada jugador.
* 
* @class Player
* @constructor
* @param {Phaser.Game} game - Objeto game.
* @param {Object} _status - Objeto con los datos iniciales sobre el estado del jugador.
*/
"use strict";

var Player = function ( game, status ){
    Phaser.Sprite.call(this, game, parseFloat(status.x.toFixed(3)), parseFloat(status.y.toFixed(3)), 'player');
    
    this.status = status;
    this.coorBuffer = [];    
    this.id = status.id;
    this.nickname = status.n;
    this.clientInputs = [];
    this.clientPredictionInputs = [];
    this.clientBinaryInputs = new Uint8Array();
    this.l_x=0;
    this.l_y=0;
    this.bulletsArray = [];
    this.last_update_time = Date.now();
    // Verificación para saber si el nuevo objeto pertenece al cliente local
    this.id === this.game.socket.id ? this.isLocalPlayer = true : this.isLocalPlayer = false;
       
    this.init();
    
    
    
    
};

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;


Player.prototype.BULLET_INTER_TWO = 500;
Player.prototype.BULLET_INTER_THREE = 400;
Player.prototype.VEL_LEVEL_TWO = 200;
Player.prototype.VEL_LEVEL_THREE = 170;
Player.prototype.INI_LIFE = 30;
Player.prototype.MAX_LIFE_ONE = 30;
Player.prototype.BULLET_FRAME_TWO = 0;
Player.prototype.BULLET_FRAME_THREE = 1;
Player.prototype.I_ID = 0;
Player.prototype.I_B  = 1;
Player.prototype.I_F  = 2;
Player.prototype.I_L  = 3;
Player.prototype.I_K  = 4;
Player.prototype.I_X  = 5;
Player.prototype.I_Y  = 6;
Player.prototype.I_R  = 7;
Player.prototype.I_S  = 8;
Player.prototype.BULLET_LIFESPAN = 700;
Player.prototype.INI_FRAMES = 2;

Player.prototype.numInputsToSend = 2; // Número de inputs que ha de contener cada envio al servidor.
Player.prototype.bulletTime = 0;
Player.prototype.fired = 0;
Player.prototype.life = Player.prototype.INI_LIFE;
Player.prototype.tweenComplete = true;
Player.prototype.minFrames = Player.prototype.INI_FRAMES; // Número mínimo de estados para poder interpolar.
Player.prototype.interpIndex = 0;
Player.prototype.numKills = 0;
Player.prototype.currentVelocity = 300; // Velocidad actual del jugador.
Player.prototype.curretBulletInterval = 400;
Player.prototype.emitterVelocityFactor = 25; // Factor que se le aplica al emisor de partículas.
Player.prototype.actualBulletFrame = 0;
Player.prototype.actualSeqNum = 0;
Player.prototype.sequence = 0;
Player.prototype.last_seq = 0;
Player.prototype.numBullets = 30;
Player.prototype.minLen = 2; // Factor que se usa para determinar si se debe o no usar interpolación. Sirve para compensar la lenta lectura del buffer.

/* Inicializa el jugador creando todos los elementos necesarios dependiendo de si es local o remoto.
 * 
 * @returns {undefined}
 */

Player.prototype.init = function() {
  
    // Creamos el grupo de las balas 
    this.bullets = this.game.add.physicsGroup();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    
    for(var i=0; i < 3; i++){
        var bullet = new Missile(this.game, 50, 50, 'bullets', 0, this);
        this.bullets.add(bullet);
        this.bulletsArray.push(bullet);
    }
    
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);
     
    // Creación y configuración de la física del jugador    
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.collideWorldBounds = true;
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    this.anchor = new Phaser.Point(0.5,0.5);
    this.scale.setTo(1.3);
    this.body.moves = false;    
    if(!this.isLocalPlayer){
        // Creamos la barra de vida del jugador remoto
        this.healthBar = this.game.add.graphics(-this.body.halfWidth, - this.INI_LIFE*5/(6*2));
        this.healthBar.rotation = 1.5708;
        this.addChild(this.healthBar);
        
    }else{
        this.lifeText = this.game.add.bitmapText( 25, 3, 'p2', 'Life', 15 );
        this.lifeText.fixedToCamera = true;
        this.lifeText.angle = -180;
        
        // Creamos la barra de vida del jugador local
        this.healthBar = this.game.add.graphics(10,15);
        this.healthBar.fixedToCamera = true;
        
    }
    
    // Nickname del jugador 
    this.text = this.game.add.bitmapText( -this.body.halfWidth - 12, 0, 'p2', this.nickname, 15 );
    this.text.anchor.set(0.5);
    this.text.y = -this.text.width/2;
    this.text.rotation = -1.5708;
    this.addChild(this.text);
    
    // Mensaje del jugador
    this.message = this.game.add.bitmapText( 0, 0, 'p2', '', 15 );
    this.message.rotation = Math.PI;
         
    if(this.game.device.desktop){// Emisor de particulas del jugador para crear el efecto de las olas.
        this.emitter = this.game.add.emitter(0, 0, 10);
        this.emitter.makeParticles( [ 'particle' ] );
        this.emitter.setAlpha(1, 0.5, 500);
        this.emitter.setScale(3, 0.3, 0.8, 0.3, 1000);
        this.emitter.start(false, 500, 50);
        this.game.emitterLayer.add(this.emitter);  
    }
    
    // Cañon
    this.gun = this.game.add.image(0, 0,'gun');
    this.gun.alpha = 0;
    this.gun.anchor.setTo(0.5);
    this.gun.scale.setTo(1);
    this.level = 1;
};

/* Dibuja el mensaje del jugador cerca del sprite correspondiente.
 * 
 * @param {String} data - Mensaje del jugador.
 * @returns {undefined}
 */

Player.prototype.showMessage = function(data){
    if(!this.nickname)this.nickname = 'anonym' + this.id;
    this.message.setText(this.nickname +': '+ data);
    if(this.clearMessage) clearInterval(this.clearMessage);
    this.clearMessage = setTimeout(function(){this.message.setText('');}.bind(this),2000);
};

/* Sirve para almacenar los update de cada jugador y tratar de compensar el retardo y jitter con el que llegan los paquetes.
 * 
 * @param {Unit8Array} data - Estado del jugador procedente del servidor en formato binario.
 * @returns {undefined}
 */
Player.prototype.updateBuffer = function(data){
    
    if(this.coorBuffer.length > 5) {
        this.minFrames = this.INI_FRAMES;
        this.coorBuffer = [];
    }
    
    var state = [];
    state[this.I_B] = data[this.I_B];
    state[this.I_S] = new Uint32Array(data.slice(17,21).buffer)[0];
    state[this.I_K] = data[this.I_K];
    state[this.I_F] = data[this.I_F];
    state[this.I_L] = data[this.I_L];
    state[this.I_X] = new Float32Array(data.slice(5,9).buffer)[0];
    state[this.I_Y] = new Float32Array(data.slice(9,13).buffer)[0];
    state[this.I_R] = new Float32Array(data.slice(13,17).buffer)[0];
    
    if( state[this.I_S] !== undefined && state[this.I_S] !== -1 && state[this.I_S] !== this.last_seq ){ 
        this.coorBuffer.push(state);
    }
   
    var maxSeqDiff = this.sequence - Math.round(this.game.net_latency/(16*2) + state[this.I_S]);
       
    if(this.isLocalPlayer && maxSeqDiff > 6){ 
         this.stopClientProcessing = true;
    }else{
        this.stopClientProcessing = false;
    }
          
        
};

/* Método que se llama de forma automática por Phaser en cada actualización del juego.
 * 
 * @returns {undefined}
 */

Player.prototype.update = function(){
       
    this.gun.alpha = 1;
        
    this.updatePhysics();
    // Solo usamos el emisor de particulas en PC ya que consume muchos recursos.
    if(this.game.device.desktop){
        this.updateEmitter();
    }
    
    // Animación de los mensajes
    this.message.x = this.x - this.body.halfWidth - 20;
    this.message.y = this.y - this.body.halfWidth - 20;
    
    this.checkPlayerLevel();
     
    this.isLocalPlayer ? this.drawLocal() : this.drawRemote();
    // Variables para calcular la veleocidad del jugador.       
    this.l_x = this.x;
    this.l_y = this.y;
    
};

Player.prototype.checkPlayerLevel = function(){
    // Dependiendo del nivel de jugador se dibuja una u otra imagen(barco).
  
;    if(this.numKills > 0){
        this.currentVelocity = this.VEL_LEVEL_TWO;
        this.curretBulletInterval = this.BULLET_INTER_TWO;
        this.actualBulletFrame = this.BULLET_FRAME_TWO;
        this.loadTexture('ship-level-2');
        this.emitterVelocityFactor = 100;
        this.body.setSize(this.width, this.height, 0, 0);
        this.gun.scale.setTo(1.2);     
        this.text.x = -this.body.halfWidth+50;
        this.text.y = -this.text.width/2;
        this.level = 1;
    }
    
    if(this.numKills > 1){
        this.currentVelocity = this.VEL_LEVEL_THREE;
        this.curretBulletInterval = this.BULLET_INTER_THREE;
        this.actualBulletFrame = this.BULLET_FRAME_THREE;
        this.loadTexture('ship-level-3');
        this.emitterVelocityFactor = 200;
        this.body.setSize(this.width, this.height, 0, 0);
        this.text.x = -this.body.halfWidth+110;
        this.text.y = -this.text.width/2;
        this.gun.scale.setTo(1.5);  
        this.level = 2;
    }
};

Player.prototype.updateEmitter = function(){
    this.vx = this.x - this.l_x;
    this.vy = this.y - this.l_y;

    var px= this.vx;
    var py= this.vy;

    px *= -1;
    py *= -1;

    // Configuramos las particulas dependiendo de la velocidad del jugador en cada instante.
    this.emitter.minParticleSpeed.set(px*this.emitterVelocityFactor, py*this.emitterVelocityFactor);
    this.emitter.maxParticleSpeed.set(px*this.emitterVelocityFactor, py*this.emitterVelocityFactor);
    
    this.emitter.emitX = this.x;
    this.emitter.emitY = this.y;
};


/* Dibuja los elementos correspondientes al jugador local.
 * 
 * @returns {undefined}
 */

Player.prototype.drawLocal = function(){
   
    this.healthBar.clear();
    this.healthBar.beginFill(0x00004d, 1);
    this.healthBar.drawRoundedRect(0+10, 0+5,this.INI_LIFE*5, 20,5);
   
    if( 20 <= this.life && this.life <= 30 ){
        this.healthBar.beginFill(0x33cc33, 1);
       
    }
    if( 10 <= this.life && this.life  < 20 ){ 
        this.healthBar.beginFill(0xffff33, 1);
         
    }
    if( 0 <= this.life && this.life < 10){ 
        this.healthBar.beginFill(0xe60000, 1);
         
    }
    this.healthBar.drawRoundedRect(0+10, 2+5, this.life * 5, 16,2);
    this.healthBar.endFill();       
    
};

/* Facilita la concatenación de arrays.
 * 
 * @returns {Uint8Array} 
 *    
 */

Player.prototype.arrayBufferConcat = function() {
  var length = 0;
  var buffer = null;

  for (var i in arguments) {
    buffer = arguments[i];
    length += buffer.byteLength;
  }

  var joined = new Uint8Array(length);
  var offset = 0;

  for (var i in arguments) {
    buffer = arguments[i];
    joined.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  return joined;
  
};

/* Crea un array con el input actual del jugador local y lo envía al servidor.
 * 
 * @returns {undefined}
 */

Player.prototype.sendInputs = function(){
    
    
 
    var firstChunk = new Uint8Array([this.fired]);
    var secondChunk= new Uint8Array(new Uint16Array([this.game.input.activePointer.worldX,this.game.input.activePointer.worldY]).buffer);
     
    var clientInput = this.arrayBufferConcat(firstChunk,secondChunk);
    
    this.clientBinaryInputs = this.arrayBufferConcat(this.clientBinaryInputs, clientInput);
    if(this.clientBinaryInputs.length === this.numInputsToSend*5) {
          
        var info = new Uint8Array([EventCode.UPDATE_PLAYER, this.id]); 
        this.clientBinaryInputs = this.arrayBufferConcat(info, this.clientBinaryInputs);
       
         this.game.socket.emit('', this.clientBinaryInputs , false);
        
         
        this.clientBinaryInputs = new Uint8Array();
    }
     
};

 /**
  *  Si el jugador no es el local lo movemos con los datos aportados por el servidor 
  *  
  */

Player.prototype.drawRemote = function(){
          
    // Actualizamos la barra de vida
    this.healthBar.clear();
    this.healthBar.beginFill(0x000000, 1);
    this.healthBar.drawRoundedRect(0, 0,this.INI_LIFE*5/6, 4,2);
    
    if( 20 <= this.life && this.life <= 30 ){
        this.healthBar.beginFill(0x33cc33, 1);
       
    }
    if( 10 <= this.life && this.life  < 20 ){ 
        this.healthBar.beginFill(0xffff33, 1);
         
    }
    if( 0 <= this.life && this.life < 10){ 
        this.healthBar.beginFill(0xe60000, 1);
         
    }
    this.healthBar.drawRoundedRect(0, 0, this.life*5/6, 4,2);
    this.healthBar.endFill();
    
   
    
};

/* Facilita el asignar los diferente valores de la interpolación al ritmo de los dibujados del juego.
 * 
 * @returns {undefined}
 */

Player.prototype.interpolate = function (){
    
    this.num_seq++;
    this.x = parseFloat(this.tweenData[this.interpIndex][0].toFixed(3));
    this.y = parseFloat(this.tweenData[this.interpIndex][1].toFixed(3));
    this.rotation = parseFloat(this.tweenData[this.interpIndex][2].toFixed(3));
  
   
    this.interpIndex++;
    if(this.interpIndex === this.tweenData.length){
        this.interpIndex = 0;
        this.tweenComplete = true;
        this.last = Date.now();
        
    }
    
    
};

/* Crea una bala solo cada cierto tiempo. Para ello utiliza un pool de balas que se van reseteando y 
 * se inicializan en la posición del jugador.
 * 
 * @returns {undefined}
 */

Player.prototype.fireBullet = function () {

    if (Date.now() > this.bulletTime && this.numBullets > 0)
    {   
        var bullet = this.bullets.getFirstExists(false);
        
        if (bullet)
        {   
                           
            bullet.rotation = this.rotation;
            bullet.reset(this.x, this.y);
            bullet.targetRotation = this.rotation;
            this.game.physics.arcade.velocityFromRotation(this.rotation, 700, bullet.body.velocity);
            this.gun.rotation = this.rotation;
            bullet.lifespan = 1200;
            
            bullet.alpha =0;
            this.game.time.events.add(100,function(){
                bullet.alpha = 1;
            }.bind(this));
            bullet.explode = true;
            
            bullet.frame = this.actualBulletFrame;
            var bounce1= this.game.add.tween(this.gun);
            var width = this.gun.width;
            var height = this.gun.height;
            // Animación del cañon
            bounce1.to({width:width*1.2,height: height*1.3 }, 100);
            bounce1.onComplete.add(function(){
               this.gun.width = width;
               this.gun.height = height;

            }.bind(this), this);
            bounce1.start();
            
            
            this.bulletTime = Date.now() + this.curretBulletInterval;
            

        }
    
    }
    
   
};

/* Facilita el acceso al grupo de balas del jugador.
 * 
 * @returns {Phaser.Group}
 */
Player.prototype.getBullets = function(){
    return this.bullets;
};

/* Sirve para almacenar los inputs del jugador local. De modo que luego puedan ser reaplicados al hacer la corrección de cliente y
 * renconciliación con el servidor.
 * 
 * @param {Array} input - Inputs del cliente local(Coordenadas del pointer).
 * @returns {undefined}
 */

Player.prototype.storeClientInput = function(input){
   this.clientInputs.push(input);
};

/* Procesa las actualizaciones del servidor.
 * 
 * @returns {undefined}
 */

Player.prototype.remotePlayerPhysics = function(){
     
    if( this.tweenComplete && this.coorBuffer.length === 0 ){
        this.minFrames = this.INI_FRAMES;
    }
    this.gun.x = this.x ;
    this.gun.y = this.y ;
    this.gun.rotation = this.rotation;      
    // Asegura que haya componentes en el buffer y que no este interpolando
    if( this.coorBuffer.length >= this.minFrames && this.tweenComplete ){
       
        if(this.coorBuffer.length > this.minLen) { // Este factor de tres igual se puede adaptar dependiendo de las ocndiciones de la red???
            this.useInterpolation = false;
            
        }
        else{
            this.useInterpolation = true;
            
        }

        // Si es la primera vez que entra se asignan directamente las coordenadas.
        if(this.minFrames === this.INI_FRAMES){
            this.x = this.coorBuffer[0][this.I_X];
            this.y = this.coorBuffer[0][this.I_Y];
            this.rotation = this.coorBuffer[0][this.I_R];
            this.last_seq = this.coorBuffer[0][this.I_S];
            this.numKills = this.coorBuffer[0][this.I_K];
            this.numBullets = this.coorBuffer[0][this.I_B];
            this.coorBuffer.shift();
            this.minFrames = 1;
                   
            return;
            
        }
              
        // Buscamos el último estado
        this.latestState = this.coorBuffer[0];
        this.coorBuffer.shift();
        // Número de secuencia actual
        this.current_seq = this.latestState[this.I_S];
        // Actualizamos el número de jugadores que ha eliminado
        this.numKills = this.latestState[this.I_K];
        // Factor que nos dice el número de muestras que se ha de interpolar
        this.fps_inter_fact = this.current_seq - this.last_seq + 1;
        // Actualizamos el valor del último número de secuencia procesado
        this.last_seq = this.latestState[this.I_S];
        // Si el factor es mayor de dos, es decir hay mas de un número de secuencia de diferencia se interpola
        if(this.fps_inter_fact > 2 && this.useInterpolation){
            this.tweenData = this.game.getInterpolatedData(
                                                [this.x, parseFloat(this.latestState[this.I_X].toFixed(3))],
                                                [this.y, parseFloat(this.latestState[this.I_Y].toFixed(3))],
                                                [this.rotation, parseFloat(this.latestState[this.I_R].toFixed(3))], this.fps_inter_fact);


            this.tweenData.shift();
            this.tweenComplete = false;
            if(this.latestState[this.I_F])this.fireBullet();
            this.life = this.latestState[this.I_L];
            this.numBullets = this.latestState[this.I_B];
        // Caso contrario se asigna directamente el valor   
        }else if(this.fps_inter_fact ===  2 || !this.useInterpolation){
            this.tweenComplete = true;
            this.x = parseFloat(this.latestState[this.I_X].toFixed(3));
            this.y = parseFloat(this.latestState[this.I_Y].toFixed(3));
            this.rotation = parseFloat(this.latestState[this.I_R].toFixed(3));    
            this.latestState[this.I_F] ? this.fireBullet() : null;
            this.life = this.latestState[this.I_L];
            this.numBullets = this.latestState[this.I_B];
            this.numKills = this.latestState[this.I_K];
        }
            
        
        
        
    }
    
    // Se interpola    
    if(!this.tweenComplete){
        this.interpolate();
    }
        
};

/* Función que realiza la predicción de cliente, corrección de cliente y reconciliación con el servidor.
 * 
 * @returns {undefined}
 */


Player.prototype.localPlayerPhysics = function(){
   
    if(this.game.input.activePointer.worldY === -1 || this.game.input.activePointer.worldX === -1 ||  this.stopClientProcessing) return;
    
    // Mínimo una componente del servidor para poder interpolar.
    this.minFrames = 1;
    
    
    
    // Predicción de cliente
    this.clientPredicction();
        
    if( this.coorBuffer.length >= this.minFrames ){
        // Correción de cliente
        this.clientCorrection();
        // Reconciliación con el servidor        
        this.serverReconciliation();
          
    }
    // Guardamos los inputs del cliente
    this.storeClientInput([this.sequence, this.game.input.activePointer.worldX, this.game.input.activePointer.worldY, this.fired]);
    this.sendInputs();        
    
    this.sequence++;
    
   
    
};

Player.prototype.clientPredicction = function(){
   
    if( this.game.physics.arcade.distanceToPointer(this) < 100 ){      
        this.body.velocity.x = 0;
        this.body.velocity.y = 0;
        this.rotation = parseFloat(this.game.physics.arcade.angleToPointer(this).toFixed(3));
        
    }else{
        var angle = Math.atan2(this.game.input.activePointer.worldY - this.y, this.game.input.activePointer.worldX - this.x);
        var speed = this.currentVelocity;
        this.tempvx = Math.cos(angle.toFixed(3)) * speed;
        this.tempvy = Math.sin(angle.toFixed(3)) * speed;
        var delta = 0.016;
        
        this.rotation = parseFloat((angle.toFixed(3)));
        this.x += parseFloat((this.tempvx * delta).toFixed(3));
        this.y += parseFloat((this.tempvy * delta).toFixed(3));
    }
    this.gun.x = parseFloat(this.x.toFixed(3));
    this.gun.y = parseFloat(this.y.toFixed(3));
    this.gun.rotation = this.rotation;
    if(this.fired)this.fireBullet();
    
};

Player.prototype.clientCorrection = function(){
    
    this.life = this.coorBuffer[0][this.I_L];
    this.numKills = this.coorBuffer[0][this.I_K];
    this.numBullets = this.coorBuffer[0][this.I_B];
    this.game.numBullets.setText('x' + this.numBullets);
    this.game.numKills.setText('x' + this.numKills);

    this.x = parseFloat(this.coorBuffer[0][this.I_X].toFixed(3));
    this.y = parseFloat(this.coorBuffer[0][this.I_Y].toFixed(3));
       
    //if(this.coorBuffer[0][this.I_F]) this.fireBullet(this.coorBuffer[0]);
    
    this.actualSeqNum = this.coorBuffer[0][this.I_S];
    this.last_seq = this.actualSeqNum;
    this.coorBuffer.shift();
    
    
};

Player.prototype.serverReconciliation = function(){
    
   // Reconciliación con el servidor
    for(var i=0; i < this.clientInputs.length; i++){

        if(this.clientInputs[i][0] <= this.actualSeqNum){
            this.clientInputs.splice(i, 1);
            i--;
        }else{

            if(this.game.physics.arcade.distanceToXY(this, this.clientInputs[i][1], this.clientInputs[i][2]) >= 100){

                var angle = Math.atan2(this.clientInputs[i][2] - this.y, this.clientInputs[i][1] - this.x);
                var speed = this.currentVelocity;
                this.tempvx = Math.cos(angle.toFixed(3)) * speed;
                this.tempvy = Math.sin(angle.toFixed(3)) * speed;
                var delta = 0.016;

                this.x += parseFloat((this.tempvx * delta).toFixed(3));
                this.y += parseFloat((this.tempvy * delta).toFixed(3));

            }

        }

    }
};

/**
 * Actualizamos la física de los jugadores dependiendo de si es jugador local o remoto.
 * 
 * @returns {undefined}
 */

Player.prototype.updatePhysics = function(){
    if(this.isLocalPlayer){
        this.localPlayerPhysics();
    }else{
        this.remotePlayerPhysics();
    }
};
;/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
*  Estado inicial del juego. Esta clase se  encarga de crear las configuraciones básicas del juego. 
*  Además es la encargada de detectar la orientación correcta en dispositivos móviles(landscape). 
* 
* @class BootState
* @constructor
* 
*  
*/ 
"use strict";

var BootState = function(){};

/* Sobreescribe el método predefinido de Phaser.State#preload. 
 * Sirve para precargar los recursos necesarios para la ejecución de este estado.
 *  
 */

BootState.prototype.preload = function(){
    // Imagen del fondo del juego
    this.game.load.image('background', 'assets/sprites/background.png');
          
};

/* Método que llama el estado para crear los sprites o configuraciones correspondientes al juego.
 * 
 * @returns {undefined}
 */

BootState.prototype.create = function(){
    
    // Configuraciones del ejecución del juego.
    this.game.world.setBounds(0, 0, 1905*2, 1770*2);
    // El canvas se adapta al tamaño de la ventana incluso si esta cambia.
    this.game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    // El canvas mantendrá las dimensiones al entrar en full screen.
    this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    // Limitamos el número de pointer a uno para mejorar el rendimiento.
    this.game.input.maxPointers = 1;
    
    this.game.device.desktop ? this.game.input.touch.enabled = false:this.game.input.mouse.enabled = false;
    // Evitamos que limpie el canvas cada dibujado ya que hay una imagen de fondo.
    this.game.renderer.clearBeforeRender = false;
    // Tiempo mínimo para considerar que es un hold.
    this.game.input.holdRate = 170;
    // El contenedor con los elementos que se quiere que se vean alentrar en full screen.
    this.game.scale.fullScreenTarget = document.getElementById('mBody');
    
    // Inicia el nuevo Phaser.State para la carga de recursos. 
    this.game.state.start('load');
}; 
;/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
*  Estado para la carga de los recursos(imagenes, spritesheets)
* 
* @class  LoadState 
* @constructor
* @param {Phaser.Game} game - Objeto al que pertenece el estado.
*  
*/ 
"use strict";

var LoadState = function(){};

LoadState.prototype.preload = function() {
    
    this.background = this.game.add.image(0, 0,'background');
    //this.game.time.advancedTiming = true;
    this.game.load.onLoadComplete.add(this.onLoadComplete, this);
    this.game.load.image('skull', 'assets/sprites/skull.png');
    this.game.load.image('particle', 'assets/sprites/circle.png');
    this.game.load.image('player', 'assets/sprites/ship-level-1.png');
    this.game.load.image('ship-level-2', 'assets/sprites/ship-level-2.png');
    this.game.load.image('enemy', 'assets/sprites/enemymin.png');
    this.game.load.image('ship-level-3', 'assets/sprites/ship-level-3.png');
    this.game.load.image('gun', 'assets/sprites/gunmin.png');
    this.game.load.bitmapFont('p2', 'assets/fonts/open-sans/ops.png', 'assets/fonts/open-sans/ops.xml');
    this.game.load.spritesheet('bullets', 'assets/sprites/new-bullets-sheet-24.png', 34, 24, 2);
    this.game.load.spritesheet('coins', 'assets/sprites/coins.png' , 40, 44, 4);
    this.game.load.spritesheet('whirlwind', 'assets/sprites/smoke-sheet.png', 256, 256, 15);
    this.game.load.spritesheet('explosion', 'assets/sprites/explosion-3.png', 128, 128, 16);
    this.game.load.spritesheet('bexplosion', 'assets/sprites/bulletexplosion.png', 128, 128, 16);
      
     
     // Si es dispositivo móvil guiamos al usuario para entrar al modo full screen.
    if(!this.game.device.desktop){
        this.game.scale.forceOrientation(true, false);
        this.game.scale.enterIncorrectOrientation.add(this.enterIncorrectOrientation, this);
        this.game.scale.leaveIncorrectOrientation.add(this.leaveIncorrectOrientation, this);
        this.game.scale.fullScreenTarget = document.getElementById('mBody');
        
    }
};

/* Se encarga de mostrar el cuadro para empezar el juego solo cuando los recursos esten cargados.
 * 
 * @returns {undefined}
 */
LoadState.prototype.onLoadComplete = function() {
    $('body').show();
    if(this.game.device.desktop)$('#mainView').show();
    
     // Aseguramos que el juego tenga las dimensiones de la pantalla del dispositivo al entrar a fullscreen.
    this.game.scale.onFullScreenChange.add(function(){
       if(this.game.scale.isFullScreen )this.game.scale.setGameSize(screen.width * window.devicePixelRatio, screen.height * window.devicePixelRatio);
    }.bind(this), this);
    
    // Si el dispositivo es tactil y ya estaba orientado correctamente mostramos el mensaje para que haga tap y entre a full screen.
    if(!this.game.device.desktop && this.game.scale.isLandscape ){
               
        $(document).one('click',function(){
            if(!this.game.scale.isFullScreen){
                this.game.scale.startFullScreen(true, true);
            }
            $('#mainView').show();
            $('#touchtostart').hide();
        }.bind(this));
        $('#touchtostart').show();
    
    }
    
   
};

 

/* Se llama cuando el dispositivo móvil rota y la posición final del dispositivo no es la correcta(portrait).
 * Al no ser la orientación correcta se muestra un mensaje para que rote el dispositivo.
 * 
 * @returns {undefined}
 */

LoadState.prototype.enterIncorrectOrientation =  function () {
    
    this.game.orientated = false;
    $('#mainView').hide();
    if(!this.game.started) $('#incorrectOrientation').show();
    $('#touchtostart').hide();
      
};

/* Se llama cuando el dispositivo móvil rota y la posición final del dispositivo es la correcta(lanscape).
 * Al ser la orientación correcta se muestra un mensaje para que el usuario haga tap y asi poder iniciar 
 * el modo fullscreen si el navegador lo permite. Esto es necesario ya que los navegadores no permiten 
 * llamar a fullscreen mediante código por motivos de seguridad.
 * 
 * @returns {undefined}
 */

LoadState.prototype.leaveIncorrectOrientation = function () {
    
    this.game.orientated = true;
    if(!this.game.started && !this.game.scale.isFullScreen)$('#touchtostart').show();
    $('#incorrectOrientation').hide();
    if(!this.game.started){
        $(document).one('click',function(){
            if(this.game.orientated && !this.game.scale.isFullScreen){
                this.game.scale.startFullScreen(true, true);
            }
            $('#mainView').show();
            $('#touchtostart').hide();
        }.bind(this));
    }
};



;/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
*  Estado principal del juego. Esta clase se encarga de crear el 'mundo' y de gestionar el control del jugador.
* 
* @class PlayState
* @constructor
*  
*/ 
"use strict";

var PlayState = function(){
    this.dialogMessagesActive = false;
    this.time_acumulator = 0;
    this.last_time = 0;
};

// Coordenadas de los remolinos.
PlayState.prototype.whirlwindCoor = [{x:960,y:960},{x:960,y:960*3},{x:960*3,y:960},{x:960*3,y:960*3}];

/**
 * Sirve para crear todos los sprites necesarios del juego.
 * 
 * @returns {undefined}
 */

PlayState.prototype.create = function () {
    if(!this.PingActive)this.game.startPing();
    this.game.world.removeAll();
    this.game.coins = [];
    this.game.players = [];
    this.game.enemies = [];
    this.background = this.game.add.image(0, 0,'background');
    this.background2 = this.game.add.image(1905, 0,'background');
    this.background3 = this.game.add.image(0, 1770,'background');
    this.background4 = this.game.add.image(1905, 1770,'background');
    this.layerWhirlwinds = this.game.add.group();
    for(var i=0; i < this.whirlwindCoor.length; i++){
        var x = this.whirlwindCoor[i].x;
        var y = this.whirlwindCoor[i].y;
        var whirlwind = this.layerWhirlwinds.create(parseFloat(x),parseFloat(y),'whirlwind',0);
        whirlwind.anchor.setTo(0.5);
        whirlwind.animations.add('whirlwind');
        whirlwind.play('whirlwind',10,true);
    }
    this.game.emitterLayer = this.game.add.group();
    this.initGame(this.game.initialStatus);
         
    if(this.game.waiting){ 
        this.game.waitingLabel = this.game.add.bitmapText( 255, 255, 'p2', this.game.socket.nickname.toUpperCase() 
            + ' \nwaiting for other players...', 20 );
        this.game.waitingLabel.fixedToCamera = true;
        this.game.waitingLabel.angle = 180;
    }
     

    // Configuraciones del juego para el pc 
    
    if(this.game.device.desktop){    
        this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(function(){

            if(this.dialogMessagesActive) {

                    if($('#mymessage').val().trim())this.game.socket.emit(EventCode.CHAT_MESSAGE,  {id:this.game.socket.id,m:$('#mymessage').val().trim()}, true);
                    $('#mymessage').val('');
                    $('#messages').css({top: $(document).height()/2, left:$(document).width()/2});

                }else {

                   this.dialogMessagesActive = true;
                   $('#messages').css({top: $(document).height()/2, left:$(document).width()/2});
                   $('#messages').show();
                   $('#labelm').trigger('click');
                   $('#messages').focus();

                }


        }.bind(this), this);
     
        $('#buttonCloseMessagesInput').click(function(){
            if(this.dialogMessagesActive){
                this.dialogMessagesActive = false;
                $('#messages').hide();
            }
        }.bind(this));
    }
    if(!this.game.device.desktop){
        this.game.input.onHold.add(function(){
                this.localPlayer.fired = 1;
                
           }.bind(this), this);
    }else{
       this.game.input.onDown.add(function(){
            this.localPlayer.fired = 1;

       }.bind(this), this); 
    }
    
    this.game.input.onUp.add(function(){
         this.localPlayer.fired = 0;

     }.bind(this), this);
   
    // Configuraciones del juego para dispositivos móviles 
    
    this.explosions = this.game.add.group();
    this.explosions.name = 'explosion';
    this.explosions.createMultiple(30, 'explosion');
    this.explosions.forEach(this.setupExplosion, this);            
      
    this.layerCoins = this.game.add.group();
    this.layerCoins.enableBody = true;
       
    this.bulletsIcon = this.game.add.image(200,18,'bullets');
    this.bulletsIcon.fixedToCamera = true;
    
    this.game.numBullets = this.game.add.bitmapText( 245, 15, 'p2', 'x10', 20 );
    this.game.numBullets.fixedToCamera = true;
    this.game.numBullets.angle = 180;
    
    this.game.leaderboard = this.game.add.bitmapText( this.game.width - 150, 15, 'p2', '', 15 );
    this.game.leaderboard.fixedToCamera = true;
    this.game.leaderboard.angle = 180;
    
    this.killsIcon = this.game.add.image(300, 15, 'skull');
    this.killsIcon.fixedToCamera = true;
    
    this.game.numKills = this.game.add.bitmapText(335, 15, 'p2', 'x0', 20);
    this.game.numKills.fixedToCamera = true;
    this.game.numKills.angle = 180;
    
    this.game.started = true;
    
    $('#leaderboard' ).show();
   
    this.MOVE_LIMIT = -100;
    this.MOVE_SPEED = 7000;
    if(this.game.device.desktop){
        this.game.messagesToAll = this.game.add.bitmapText( 0, $(document).height() - 47, 'p2', 'Press Enter to send a message', 22 );
        this.game.messagesToAll.fixedToCamera = true;
        this.game.messagesToAll.angle = 180;
        this.wobble = this.MOVE_LIMIT;
    
        this.game.add.tween(this)
            .to(
                { wobble: screen.width * window.devicePixelRatio },
                this.MOVE_SPEED, null, true, 0,
                -1, false
            );
    }
    
    this.game.camera.follow(this.localPlayer);
    this.game.camera.roundPx = false;
    
    var graphics = this.game.add.graphics(0, 0);
    this.miniMap = new MiniMap(this.game, $(document).width()- 105, $(document).height()- 105, graphics);
};

/**
 * Sirve para configurar las explosiones.
 * 
 * @param {type} explosion
 * @returns {undefined}
 */

PlayState.prototype.setupExplosion = function  (explosion) {

    explosion.anchor.x = 0.5;
    explosion.anchor.y = 0.5;
    explosion.animations.add('explosion');

};

PlayState.prototype.createCoins = function() {
    this.layerCoins.destroy();
    this.layerCoins = this.game.add.group();
    this.layerCoins.enableBody = true;
       
    for(var i = 0; i < this.game.coins.length; i++){
        var x = this.game.coins[i][0];
        var y = this.game.coins[i][1];
       
        if(this.game.device.desktop){
            setTimeout(function(x,y){
                var coin = this.layerCoins.create(x, y, 'coins', 0);
                    coin.anchor.setTo(0.5);
                    coin.moves = false;
                    coin.animations.add('rot');
                    coin.play('rot', 15, true);
                    var bounce= this.game.add.tween(coin);
                    
                    coin.width= 0;
                    coin.height=0;
                    bounce.to({ width: 24, height:24 }, 2000,Phaser.Easing.Elastic.In);
                    bounce.start();
                    
         
            }.bind(this,x,y),100*i);
        }else{
             var coin = this.layerCoins.create(x, y, 'coins', 0);
             coin.anchor.setTo(0.5);
             coin.moves = false;
             coin.width = 24;
             coin.height = 24;

        }
        
    }
       
    this.game.coins = [];
};

/**
 * Se llama automáticamente por Phaser. Sirve para principalmente para detectar las colisiones entre los diferentes sprites y aplicar los efectos gráficos correspondientes.
 * 
 * @returns {undefined}
 */

PlayState.prototype.update = function() {
              
    if(this.game.device.desktop){   
        this.game.messagesToAll.cameraOffset.x = this.wobble;
        this.game.messagesToAll.cameraOffset.y = $(document).height() * window.devicePixelRatio - 30;
    }
    if(this.game.coins.length > 0) this.createCoins();
    
    if(this.game.waitingLabel && !this.game.waiting){ 
        this.game.waitingLabel.destroy();
    }
       
    for(var i = 0 ; i < this.game.players.length ; i++){
        var player1 = this.game.players[i];
        this.game.physics.arcade.overlap( this.game.layerEnemies, player1.getBullets(), this.bulletToSprite, null, this );
        for(var j = 0 ; j < this.game.players.length ; j++){
            var player2 = this.game.players[j];
            if(player1 !== player2){
                
                this.game.physics.arcade.overlap( player1, player2.getBullets(), this.bulletToSprite, null, this );
                
            }
        }
    }
       
    this.game.physics.arcade.overlap( this.game.layerPlayers, this.layerCoins, this.coinsCollision, null, this );
    
  
    this.miniMap.update();  
};

/**
 * Sirve para animar las monedas cuando se detecta colisión.
 * 
 * @param {Player} player - Jugador que colisiona.
 * @param {Phaser.Sprite} coin - Moneda que colisiona.
 * @returns {undefined}
 */

PlayState.prototype.coinsCollision = function (player, coin){
    if(this.game.device.desktop)
    {
        var bounce = this.game.add.tween(coin);
        bounce.to({ width: 0, height:0, x:player.x,y: player.y, alpha:0, tint:0 }, 50);
        bounce.onComplete.add(function(){
            coin.destroy();
        }, this);
        bounce.start();
    }else{
        coin.destroy();
    }
};

/**
 * Sirve para configurar las coordenadas de la explosión al colisionar la bala y el jugador.
 * 
 * @param {Player} player - Jugador que colisiona.
 * @param {Missile} bullet - Bala que colisiona.
 * @returns {undefined}
 */

PlayState.prototype.bulletToSprite = function (player, bullet){
        
    if(player.id !== bullet.id);
    bullet.explode = false;
    bullet.kill();
    var explosion = this.explosions.getFirstExists(false);
        explosion.reset(player.x , player.y);
        explosion.play('explosion', 10, false, true);

};

/**
 * Sirve para inicializar los sprites con coordenadas provenientes del servidor.
 * 
 * @param {Object} initialStatus
 * @returns {undefined}
 */

PlayState.prototype.initGame = function (initialStatus){
    
    this.game.layerPlayers = this.game.add.group();
    this.game.layerPlayers.enableBody = true;
    for(var i = 0 ; i < initialStatus.players.length ; i++){
        
        var player = new Player(this.game, initialStatus.players[i]);
            this.game.players.push(player);
            
        if(this.game.socket.id === initialStatus.players[i].id){
            this.localPlayer = player;
        }
        
        this.game.layerPlayers.add(player);                
       
    }    
        
    for(var i=0; i < initialStatus.coins.length; i++ ){
        var x = initialStatus.coins[i][0];
        var y = initialStatus.coins[i][1];
        
        this.game.coins[i] = [x,y];
    }
    
    this.game.layerEnemies = this.game.add.group();
    this.game.layerEnemies.enableBody = true;
    
    for(var i=0; i < initialStatus.enemies.length; i++ ){
        var id = initialStatus.enemies[i].id;
        
        var enemy = new Enemy(this.game, 0, 0, 'enemy', 0, id);
        this.game.layerEnemies.add(enemy);
        this.game.enemies.push(enemy);
    }
    
    if(this.game.players.length === 1) this.game.waiting = true;
};
/*
PlayState.prototype.render = function(){
    this.game.debug.text(this.game.time.fps || '--', 2, 14, "#00ff00");
    
};*/




;/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase que sirve para facilitar la animación de las balas.
* 
* @class MiniMap
* @constructor
* @param {Phaser.Game} game - Objeto game.
* @param {Number} x - Coordeanada x inicial del sprite.
* @param {Number} y - Coordeanada y inicial del sprite.
* @param {String} key - Nombre del recurso a utilizar para el sprite.
* @param {Number} frame - Si es un sprite sheet el numero del frame que se quiere utilizar.
*/
"use strict";
var MiniMap = function(game, x, y, graphics) {
  
  this.game = game;
  this.x = x;
  this.y = y;
  this.scale = 0.03;
  this.width = this.game.world.bounds.width*this.scale;
  this.height = this.game.world.bounds.height*this.scale;
  this.playerDiameter = 0.07*this.width;
  this.enemyDiameter = 0.04*this.width;
  this.MapBackground = graphics; 
  this.init();
};

MiniMap.prototype.init = function() {
    
    //this.MapBackground = this.game.add.graphics(this.x, this.y);
    this.MapBackground.fixedToCamera = true;
    this.x = $(document).width()*window.devicePixelRatio - this.width - 5;
    this.y = $(document).height()*window.devicePixelRatio - this.height - 5;
};

/**
 * Se llama automaticamente por Phaser. Dentro de este se cambia la rotación de la bala para dar un efecto a la bala.
 * 
 * @returns {undefined}
 */

MiniMap.prototype.update = function() {
    this.drawMapBackground();
    this.drawPlayers();
    this.drawEnemies();
};

MiniMap.prototype.drawMapBackground = function() {
    this.MapBackground.clear();
    this.MapBackground.beginFill(0x000000, 0.6);
    this.MapBackground.drawRect(this.x, this.y, this.width, this.height);
    this.MapBackground.endFill();
};

MiniMap.prototype.drawPlayer = function(x, y, isLocalPlayer) {
    var scaledXY = this.scaleCoor(x,y);
    var color = isLocalPlayer ? 0xffffff : 0x669999;
    this.MapBackground.beginFill(color, 1);
    this.MapBackground.drawCircle(scaledXY[0], scaledXY[1], this.playerDiameter);
    this.MapBackground.endFill();
};

MiniMap.prototype.drawPlayers = function() {
    this.game.players.forEach(function(player, index){
        var isLocalPlayer = player.id === this.game.socket.id ? true : false; 
        this.drawPlayer(player.x, player.y, isLocalPlayer);
    }.bind(this));
};

MiniMap.prototype.drawEnemy = function(x, y) {
    var scaledXY = this.scaleCoor(x,y);
    var color = 0xff0000;
    this.MapBackground.beginFill(color, 1);
    this.MapBackground.drawCircle(scaledXY[0], scaledXY[1], this.enemyDiameter);
    this.MapBackground.endFill();
};

MiniMap.prototype.drawEnemies = function() {
    this.game.enemies.forEach(function(enemy, index){
        this.drawEnemy(enemy.x, enemy.y);
    }.bind(this));
};

MiniMap.prototype.scaleCoor = function(x, y) {
    var x = x/this.game.world.bounds.width * this.width + this.x;
    var y = y/this.game.world.bounds.height * this.height + this.y;
    
    return [x,y];
};;/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
*  Clase que facilita el acceder a los diferentes códigos de eventos.
*  
* 
* @class EventCode
* @constructor
* 
*  
*/ 

var EventCode = {
    
    PING              : 0 ,
    JOIN_GAME         : 1 ,
    UPDATE_GAME       : 2 ,
    CHAT_MESSAGE      : 3 ,
    UPDATE_GAMES_LIST : 4 ,
    NEW_PLAYER        : 5 ,
    INI_STATUS        : 6 ,
    PLAYER_LEFT       : 7 ,
    GAME_OVER         : 8 ,
    UPDATE_PLAYER     : 9 ,
    LEADERBOARD       : 10,
    COINS             : 11
    
};

/* 
*  Clase que facilita la decodificación de la información binaria.
*  
* 
* @class Entity
* @constructor
* 
*  
*/
 
var Entity = {
    
    Player : { 
        
                TYPE: 0,
                
                TypeOfMessage:{
                    
                    Update: { CODE : 0, LEN: 21 },
                    
                    Kill  : { CODE : 1, LEN: 1  }
                    
                },
                      
                LEN : 21
             },
             
    Enemy  : { 
                TYPE: 4,
                
                TypeOfMessage:{
                    
                    Update: { CODE : 0, LEN: 13 },
                                       
                    Kill  : { CODE : 1, LEN: 1  },
                    
                    Create: { CODE : 2, LEN: 1  }
                    
                    
                    
                }
            }
    
};
