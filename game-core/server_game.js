/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Núcleo del juego para el servidor.
* 
* @class BattleShip
* @constructor
* @param {object} gameInfo - Información sobre el estado en el que debe empezar el juego e informacón sobre las posiciones de los jugadores.
* 
*/ 
var Player = require("../game-entities/server_player").ServerPlayer;
var QuadTree = require("../game-utils/server_quadtree").QuadTree;
var Coin = require("../game-entities/server_coin").ServerCoin;
var Whirlwind = require("../game-entities/server_whirlwind").ServerWhirlwind;
var Enemy = require("../game-entities/server_enemy").ServerEnemy;
var SAT = require("../game-utils/server_SAT");
var AccurateTimer = require("../game-utils/server_accurate_timer").AccurateTimer;

"use strict";

var Game = function (gameInfo){
       
    this.started = false;   
    this.players = [];
    this.coins = [];
    this.enemies = [];
    this.whirlwinds = [];
    this.updatesCont = 0;
    this.enemiesId = 0;
    this.last_time =0 ;
    this.init(gameInfo);
          
};

Game.prototype.WORLD_HEIGHT = 1770*2;
Game.prototype.LEADERBOARD_INTERVAL = 1000;
Game.prototype.COINS_INTERVAL = 1000 * 60 * 0.5;
Game.prototype.WORLD_WIDTH = 1905 * 2;
Game.prototype.FRAME_TIME = 16;
Game.prototype.MAX_COINS = 50;
Game.prototype.MAX_ENEMIES = 10;
Game.prototype.PLAYERS_ENTITY_TYPE = 0;
Game.prototype.ENEMY_ENTITY_TYPE = 4;
Game.prototype.whirlwindCoor = [{x:960,y:960},{x:960,y:960*3},{x:960*3,y:960},{x:960*3,y:960*3}];

/**
 * Inicializamos el juego.
 * 
 * @param {type} gameInfo
 * @returns {undefined}
 */

Game.prototype.init = function(gameInfo){
    this.name = gameInfo.name;
    this.room = gameInfo.room;
    this.wss  = gameInfo.wss;
    this.quad = new QuadTree({
                                x: 0,
                                y: 0,
                                width : this.WORLD_WIDTH,
                                height: this.WORLD_HEIGHT
                            }, 4, 8);
                            
    this.createCoins();
    this.createEnemies();
    this.createWhirlwinds();
       
};

/**
 * Facilita la creación de monedas.
 * 
 * @returns {undefined}
 */

Game.prototype.createCoins = function(){
    this.coins = [];
    for(var i = 0; i < this.MAX_COINS; i++){
        this.coins.push(new Coin(this));
    }
};

/**
 * Facilita la creación de enemigos.
 * 
 * @returns {undefined}
 */

Game.prototype.createEnemies = function(){
    
    for(var i = 0; i < this.MAX_ENEMIES; i++){
        this.enemies.push(new Enemy(this, this.enemiesId));
        this.enemiesId++;
    }
   
};

/**
 * Facilita la creación de torbellinos.
 * 
 * @returns {undefined}
 */

Game.prototype.createWhirlwinds = function(){
    for(var i = 0; i < this.whirlwindCoor.length; i++){
        var x= this.whirlwindCoor[i].x;
        var y = this.whirlwindCoor[i].y;
        var whirlwind = new Whirlwind(x,y);
        this.whirlwinds.push(whirlwind);
         
    }
};

/**
 * Facilita la creación de nuevos jugadores.
 * 
 * @param {Strinf} nickname - Nombre del jugador
 * @param {Number} id - Identificador del jugador
 * @returns {ServerPlayer}
 */

Game.prototype.addPlayer = function(nickname, id, socket ){
    var player = new Player(nickname, id, this, socket);
    this.players.push(player);
    return player;
};

/**
 * Actualiza el estado del juego.
 * 
 * @returns {undefined}
 */

Game.prototype.update = function(){
   
    if(this.enemies.length === 0){
        this.createEnemies();
    }
    
    this.quad.clear();
    for(var i = 0; i < this.players.length ; i++){
        this.players[i].update();
        this.quad.insert(this.players[i]);
        
        for(var ii=0; ii < this.players[i].bullets.length; ii++){
            this.quad.insert(this.players[i].bullets[ii]);
        }
    }
    
    for(var i = 0; i < this.enemies.length; i++){
        this.enemies[i].update();
        this.quad.insert(this.enemies[i]);
    }
    
    for(var i = 0; i < this.coins.length; i++){
        this.quad.insert(this.coins[i]);
    }
    
    for(var i = 0; i < this.whirlwinds.length; i++){
        this.quad.insert(this.whirlwinds[i]);
    }
    
   
    
    for(var i = 0; i < this.players.length ; i++){
        if(!this.players[i].active) continue;
        var candidates = this.quad.retrieve( this.players[i] );
       
        for(var j = 0; j < candidates.length; j++){
                 
            if(this.checkCollision(candidates[j].getRec(),this.players[i].getRec())){
                
                if(candidates[j].id !== this.players[i].id && candidates[j].TYPE === this.ObjType.PLAYER){ 
                    if(this.players[i].crashedToOther(candidates[j])){
                        this.quad.removeObject( this.players[i] );
                        this.players[i].kill('b');
                        break;
                    }
                }else if( candidates[j].id !== this.players[i].id && candidates[j].TYPE === this.ObjType.BULLET){
                   if(this.players[i].decreaseLife(candidates[j].player.getLevel())){
                        candidates[j].player.incrKills();
                        this.quad.removeObject( this.players[i] );
                        this.players[i].kill('b');
                        this.quad.removeObject( candidates[j] );
                        candidates[j].kill();
                        break;

                    }
                    candidates[j].kill();
                    this.quad.removeObject( candidates[j] );
                }else if(candidates[j].TYPE === this.ObjType.COIN){
                    candidates[j].kill();
                    this.players[i].increaseCoins();                       
                    this.quad.removeObject( candidates[j] );
                }else if(candidates[j].TYPE === this.ObjType.WHIRLWIND){
                    this.quad.removeObject( this.players[i] );                                     
                    this.players[i].kill('w');
                    break;
                }else if(candidates[j].TYPE === this.ObjType.ENEMY){
                    if(this.players[i].decreaseLifeByEnemy()){
                        this.quad.removeObject( this.players[i] );
                        this.players[i].kill('b');
                        this.quad.removeObject( candidates[j] );
                        candidates[j].eliminatePostUpdate = true;

                        break;
                    }
                    
                    this.quad.removeObject( candidates[j] );
                    candidates[j].eliminatePostUpdate = true;

                }
            };
        }
    }
    
    
    for(var i = 0; i < this.enemies.length ; i++){
        var candidates = this.quad.retrieve( this.enemies[i] );
        
        for(var j=0; j < candidates.length; j++ ){
            if(this.checkCollision(candidates[j].getRec(),this.enemies[i].getRec())){
                
                if(candidates[j].TYPE === this.ObjType.BULLET){
                    this.quad.removeObject( this.enemies[i] );
                    this.enemies[i].eliminatePostUpdate = true;
                    this.quad.removeObject( candidates[j] );
                    candidates[j].player.incrKills();
                    candidates[j].kill();
                    break;
                    
                }
            }
        }
    }
    
    this.quad.cleanup();
    
    
    if(this.updatesCont === 2){
         
       this.sendUpdate();
        
        this.updatesCont = 0;
    }
    this.updatesCont++;
    
    
};

/**
 * Sirve para detectar colisiones incluso si la entidad esta rotada. Esto es posible gracias a la librería SAT.
 * 
 * @param {Object} rec1 - Coordenadas de la entidad
 * @param {Object} rec2 - Coordenadas de la otra entidad
 * @returns {Boolean}
 */

Game.prototype.checkCollision = function(rec1, rec2){
    var p1 = new SAT.Polygon(new SAT.Vector(0,0), [
      new SAT.Vector(rec1.points[0].x,rec1.points[0].y),
      new SAT.Vector(rec1.points[1].x,rec1.points[1].y),
      new SAT.Vector(rec1.points[2].x,rec1.points[2].y),
      new SAT.Vector(rec1.points[3].x,rec1.points[3].y)
      
    ]);
    
    var p2 = new SAT.Polygon(new SAT.Vector(0,0), [
      new SAT.Vector(rec2.points[0].x,rec2.points[0].y),
      new SAT.Vector(rec2.points[1].x,rec2.points[1].y),
      new SAT.Vector(rec2.points[2].x,rec2.points[2].y),
      new SAT.Vector(rec2.points[3].x,rec2.points[3].y)
      
    ]);
   
    var collided = SAT.testPolygonPolygon(p1, p2);
    
    return collided;
   
};


/**
 * Sirve para determinar la distancia entre dos puntos.
 * 
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 * @returns {Number}
 */

Game.prototype.distance = function (x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    
    return Math.sqrt(dx * dx + dy * dy);

};

/**
 * Inicializa el loop principal del juego, aparte de otros.
 * 
 * @returns {undefined}
 */

Game.prototype.start = function(){
    this.updatesTimer = new AccurateTimer(this.update.bind(this), this.FRAME_TIME);
    this.updatesTimer.start();
          
    this.leaderboardTimer = setInterval(this.sendLeaderboard.bind(this), this.LEADERBOARD_INTERVAL);
    this.coinsTimer = setInterval(this.sendCoins.bind(this), this.COINS_INTERVAL);
    
        
    this.started = true;   
};

/**
 * Para el timer principal del juego.
 * 
 * @returns {undefined}
 */

Game.prototype.stop = function(){
    this.started = false;
    this.updatesTimer.stop();
    clearInterval(this.leaderboardTimer);
    clearInterval(this.coinsTimer);
        
};

/**
 * Envía broadcast del estado del juego en el servidor cada cierto tiempo.
 * 
 * @returns {undefined}
 */

Game.prototype.sendUpdate = function(){
               
    var snapshot = this.status();
    this.wss.clients.forEach(function(client, index){
        if(client.readyState === 1 && client.gameJoined )client.send(snapshot);

    }.bind(this));
     
            
 };

/**
 * Facilita el obtener el estado de las monedas en estado binario.
 * 
 * @returns {Buffer}
 * 
 */

Game.prototype.getCoins = function(){
    
    var buffCoins = new Buffer([]);
        
    for(var i = 0; i < this.coins.length; i++){
        
        var coinStatus = this.coins[i].binaryStatus();
       
        buffCoins = Buffer.concat([buffCoins,  coinStatus]);
        
    }
    
    return buffCoins;
    
    
};

/**
 * Envía monedas a los clientes cada cierto tiempo.
 * 
 * @returns {undefined}
 */

Game.prototype.sendCoins = function(){
    this.createCoins();
    var coins = this.getCoins();
    var buffCoins = new Buffer([EventCode.COINS]);
    coins = Buffer.concat([buffCoins,  coins]);
    
    this.wss.clients.forEach(function(client, index){
        if(client.gameJoined && client.readyState === 1 )client.send(coins);
    }.bind(this));
            
};

/**
 * Sirve para inicializar a los clientes cuando se unen a la partida.
 * 
 * @returns {nm$_server_game.Game.prototype.info.server_gameAnonym$11}
 */

Game.prototype.info = function(){
    return {
        players : this.getPlayersStatus(),
        coins : this.getCoinsStatus(),
        enemies : this.getEnemiesStatus()
    };
};

var EventCode = {
    
    GET_GAMES_LIST : 0,
    JOIN_GAME      : 1,
    UPDATE_GAME    : 2,
    CHAT_MESSAGE   : 3,
    UPDATE_GAMES_LIST : 4,
    NEW_PLAYER     : 5,
    INI_STATUS     : 6,
    PLAYER_LEFT    : 7,
    GAME_OVER_WHIRLWIND : 8,
    UPDATE_PLAYER  : 9,
    LEADERBOARD    : 10,
    COINS          : 11,
    GAME_OVER_BULLET : 12
    
    
   
};

/**
 * Estado del juego en el servidor en formato binario.
 * 
 * @returns {Buffer}
 */
Game.prototype.status = function(){
    var buffStatus ;
    var binPlayers = this.getPlayersBinaryStatus();
    
    if(binPlayers && binPlayers.num > 0){ 
        buffStatus = new Buffer([EventCode.UPDATE_GAME,this.PLAYERS_ENTITY_TYPE, binPlayers.num]);
        buffStatus = Buffer.concat([buffStatus, binPlayers.buff]);
    }
    else{
        buffStatus = new Buffer([EventCode.UPDATE_GAME]);
    }
     
    
    var buffEnemiesStatus = new Buffer([this.ENEMY_ENTITY_TYPE, this.enemies.length]);
    
    buffEnemiesStatus = Buffer.concat([buffEnemiesStatus, this.getEnemiesBinaryStatus()]);
    
    buffStatus = Buffer.concat([buffStatus, buffEnemiesStatus]);
    
    return buffStatus;

};

/**
 * Retorna el estado de todos los jugadores en formato binario.
 * 
 * @returns {Buffer}
 */

Game.prototype.getPlayersBinaryStatus = function(){
    var buffPlayersStatus = new Buffer([]);
    var numPlayers=0;
    for(var i = 0; i < this.players.length; i++){
        
        var playerStatus = this.players[i].stats();
       
        if(playerStatus) {
            numPlayers++;
            buffPlayersStatus = Buffer.concat([buffPlayersStatus, playerStatus]);
        }
    }
    
    if(this.players.length > 0 && buffPlayersStatus.lenght !== 0 ){ 
        return {num:numPlayers,buff:buffPlayersStatus};
    }else  { 
        return null;
    }
    
};

/**
 * Retorna el estado de todos los enemigos en formato binario.
 * 
 * @returns {Buffer}
 */

Game.prototype.getEnemiesBinaryStatus = function(){
    var buffEnemiesStatus = new Buffer([]);
    for(var i = 0; i < this.enemies.length; i++){
        
        var enemyStatus = this.enemies[i].binaryStatus();
       
        if(enemyStatus) {
            
            buffEnemiesStatus = Buffer.concat([buffEnemiesStatus, enemyStatus]);
        }
    }
    
    return buffEnemiesStatus;
};

/**
 * Retorna el estado de los enemigos en forma de array.
 * 
 * @returns {Array}
 */

Game.prototype.getEnemiesStatus = function(){
    var enemiesStatus = [];
    
    for(var i = 0 ; i < this.enemies.length ; i++){
        enemiesStatus.push(this.enemies[i].status());
    }
    
    return enemiesStatus;
};

/**
 * Retorna el estado de los jugadores en forma de array.
 * 
 * @returns {Array}
 */

Game.prototype.getPlayersStatus = function(){
    var playersStatus = [];
    
    for(var i = 0 ; i < this.players.length ; i++){
        playersStatus.push(this.players[i].status());
    }
    
    return playersStatus;
};

/**
 * Retorna el estado de las monedas en forma de array.
 * 
 * @returns {Array}
 */

Game.prototype.getCoinsStatus = function(){
    var coinsStatus = [];
    
    for(var i = 0 ; i < this.coins.length ; i++){
        coinsStatus.push(this.coins[i].status());
    }
    
    return coinsStatus;
};

/**
 * Facilita la creación de la tabla de posiciones.
 * 
 * @returns {Array}
 */

Game.prototype.getLeaderboard = function(){
    var leaderboard = [];
   
    for(var i=0; i < this.players.length; i++){
        leaderboard.push({ n:this.players[i].nickname, nk:this.players[i].numKills });
    }
    
    var compareCheck = function(player1, player2){
        if(player1.nk < player2.nk){
            return 1;
        }else if(player1.nk > player2.nk){
            return  -1;
        };
        
        return  0;
    };
    
    leaderboard = leaderboard.sort(compareCheck);
    
    if(leaderboard.length > 5) leaderboard.splice(5,leaderboard.length-5); 
    var leaderArr = [];
    for(var i=0;i<leaderboard.length;i++){
        leaderArr.push(leaderboard[i].n);
    }
    
    return leaderArr;
};

/**
 * Sirve para enviar la tabla de posiciones cada cierto tiempo.
 * 
 * @returns {undefined}
 */

Game.prototype.sendLeaderboard = function(){
    var leaderboard = this.getLeaderboard();
    // comprobar que a los clientes que se les  manda este activos
    leaderboard = {t:EventCode.LEADERBOARD,d:leaderboard};
    this.wss.clients.forEach(function(client, index){
        if(client.gameJoined && client.readyState === 1 )client.send(JSON.stringify(leaderboard));
    }.bind(this));
};

/**
 * Ayuda a determinar el tipo de objeto en la detección de colisiones.
 *  
 */

Game.prototype.ObjType = {
    
    PLAYER : 0,
    BULLET : 1,
    COIN   : 2,
    WHIRLWIND : 3,
    ENEMY : 4
};


exports.Game = Game;


















