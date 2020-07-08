/**
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

