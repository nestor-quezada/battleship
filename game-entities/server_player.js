/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase encargada de almacenar en el servidor el estado actual del jugador.
* 
* @class ServerPlayer
* @constructor
* @param {string} _nickname - Nombre de usuario.
* @param {number} _id - Identificador de usuario (Public ID).
* 
*/
var Bullet = require("./server_bullet").ServerBullet;
var SAT = require("../game-utils/server_SAT");

var ServerPlayer =   function ( nickname, id , game, socket) {
    
    this.WORLD_WIDTH = game.WORLD_WIDTH;
    this.WORLD_HEIGHT = game.WORLD_HEIGHT;
            
    this.width = this.WIDTH_LEVEL_ONE;
    this.numCoins = 0;
    this.height = this.HEIGHT_LEVEL_ONE;
    this.life = this.MAX_LIFE_LEVEL_ONE;
    this.actualMaxLife = this.MAX_LIFE_LEVEL_ONE;
    this.nickname = nickname;
    this.bulletTime = 0;
    this.currentBulletInterval = 400;
    this.fired = false;
    this.rotation = 0;
    this.numKills = 0;
    this.vx = this.vy = 0;
    this.game = game;
    this.bullets = [];
    this.numBullets = 30;
    this.inputs = [];
    this.id = id;
    this.sequence = -1;
    this.server_seq = -1;
    this.active = false;
    this.timeLastInput = 0;
    this.socket = socket;
    
    this.init();
   
};

ServerPlayer.prototype.WIDTH_LEVEL_ONE = 105;
ServerPlayer.prototype.WIDTH_LEVEL_TWO = 179;
ServerPlayer.prototype.WIDTH_LEVEL_THREE = 368;
ServerPlayer.prototype.HEIGHT_LEVEL_ONE = 54;
ServerPlayer.prototype.HEIGHT_LEVEL_TWO = 62;
ServerPlayer.prototype.HEIGHT_LEVEL_THREE = 122;
ServerPlayer.prototype.VEL_LEVEL_ONE = 300;
ServerPlayer.prototype.VEL_LEVEL_TWO = 200;
ServerPlayer.prototype.VEL_LEVEL_THREE = 170;
ServerPlayer.prototype.BULLET_INTER_TWO = 500;
ServerPlayer.prototype.BULLET_INTER_THREE = 400;
ServerPlayer.prototype.LEVEL_ONE = 1;
ServerPlayer.prototype.LEVEL_TWO = 2;
ServerPlayer.prototype.LEVEL_THREE = 3;
ServerPlayer.prototype.MAX_LIFE_LEVEL_ONE = 30;
ServerPlayer.prototype.TYPE = 0;
ServerPlayer.prototype.I_ID = 1;
ServerPlayer.prototype.I_S  = 2;
ServerPlayer.prototype.I_F  = 3;
ServerPlayer.prototype.I_L  = 4;
ServerPlayer.prototype.I_X  = 5;
ServerPlayer.prototype.I_Y  = 6;
ServerPlayer.prototype.I_R  = 7;
ServerPlayer.prototype.I_K  = 8;


ServerPlayer.prototype.setFired = function(newFired) {
    this.fired = newFired;
};

/**
 * Calcula coordenadas aleatorias dentro de mundo.
 * 
 * @returns {Number}
 */

ServerPlayer.prototype.getIniCoor =  function () {
    
    var max = this.WORLD_HEIGHT - 100;
    var min = 100;
    return parseFloat((Math.random() * (max - min) + min).toFixed(3));
};

/**
 * Inicializa el jugador.
 * 
 * @returns {undefined}
 */

ServerPlayer.prototype.init =  function () {
    
    this.x = this.getIniCoor();
    this.y = this.getIniCoor();
    this.currentVelocity = this.VEL_LEVEL_ONE;
    this.level = this.LEVEL_ONE;
     
};

/**
 * Aumenta el número de balas dependiendo de si colisiona con una moneda.
 * 
 * @returns {undefined}
 */

ServerPlayer.prototype.increaseCoins =  function () {
    if(this.numBullets < 250)
    this.numBullets += 5;
  
};

/**
 * Decrementamos el número de balas al disparar una.
 * 
 * @returns {undefined}
 */

ServerPlayer.prototype.decreaseBullets =  function () {
    if(this.numBullets > 0) this.numBullets -=1;
};

/**
 * 
 * Calcula el ángulo a determinado punto.
 * 
 * @param {Number} x
 * @param {Number} y
 * @returns {Number}
 */

ServerPlayer.prototype.angleToPoint = function(x, y){
    
    var dx = x - this.x;
    var dy = y - this.y;

    return parseFloat(Math.atan2(dy, dx).toFixed(3));

    
};
/**
 * Actualiza el jugador.
 * 
 * @returns {undefined}
 */
ServerPlayer.prototype.update = function (){
   
    if( this.inputs.length > 0 ){
        this.active = true;
                
        this.sequence++;
        
        if(this.distance(this.x, this.y, this.inputs[0][this.I_X], this.inputs[0][this.I_Y]) < 100){
            this.vx = 0;
            this.vy = 0;
            this.rotation = this.angleToPoint(this.inputs[0][this.I_X], this.inputs[0][this.I_Y]);
        
        }else{
            this.rotation = this.moveToXY(this.inputs[0][this.I_X], this.inputs[0][this.I_Y], 1000);
                                            
        }
        
        this.setFired(this.inputs[0][this.I_F]);
                      
        
        
                 
        this.computeVelocity();
        this.keepOnBounds();
        this.updateBullets();
        
        this.inputs.shift();
    }
    
};

/**
 * Actualiza las balas del jugador.
 * 
 * @returns {undefined}
 */

ServerPlayer.prototype.updateBullets = function(){
    for(var i = 0; i < this.bullets.length; i++){
        this.bullets[i].update();
    }
};

/**
 * Facilita configurar las balas del jugador.
 * 
 * @param {Number} vx
 * @param {Number} vy
 * @returns {undefined}
 */

ServerPlayer.prototype.setVelocity = function(vx,vy){
    this.vx = vx;
    this.vy = vy;
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
    GAME_OVER      : 8,
    UPDATE_PLAYER  : 9,
    LEADERBOARD    : 10,
    COINS          : 11
    
    
   
};
/**
 * Elimina al jugador.
 * 
 * @param {String} type
 * @returns {undefined}
 */
ServerPlayer.prototype.kill = function(type){
    
    // Limpiamos los datos sobre cliente.
    this.resetClient();
    // Evento para avisar a los jugadores de que un jugador ha dejado la partida o que ha perdido.        
    this.game.wss.clients.forEach(function(client, index){
        if(client.gameJoined && client.readyState === 1 )client.send(JSON.stringify({t:EventCode.PLAYER_LEFT,d:{id:this.id,t:type}}));
    }.bind(this));
    this.socket.gameJoined = false; 
    // Eliminamos al cliente del array de jugadores.
    var index = this.game.players.indexOf(this);
    this.game.players.splice(index, 1);
    
    if(!this.game.players.length){
        this.game.stop();
        console.log('Game stopped');
    } 
    
};

/**
 * Resetea la información sobre el jugador(id)
 * 
 * @returns {undefined}
 */

ServerPlayer.prototype.resetClient = function(){
    var ci = this.game.clientsInfo;
    for(var index in ci) { 
        if(ci[index].publicId === this.id){
            delete ci[index];
        } 
    }
};

/**
 * Actualiza la posición del jugador.
 * 
 * @returns {undefined}
 */

ServerPlayer.prototype.computeVelocity = function(){
    
    if(this.vx === undefined || this.vy === undefined ) return;
        
    var delta = 0.016;
    
    this.x += parseFloat((this.vx * delta).toFixed(3));
    this.y += parseFloat((this.vy * delta).toFixed(3));
     
};

/**
 * Dispara la bala.
 * 
 * @param {Boolean} fired
 * @returns {undefined}
 */

ServerPlayer.prototype.setFired = function(fired){
   this.fired = fired;
   // Creamos la bala
   if(this.fired && Date.now() > this.bulletTime && this.numBullets >0  ){
       this.bullets.push(new Bullet(this));
       this.bulletTime = Date.now() + this.currentBulletInterval;
       this.decreaseBullets();
    }
};

/**
 * Mueve la entidad hacia las coordenadas x,y
 * 
 * @param {Number} x
 * @param {NUmber} y
 * @returns {Number} -
 */

ServerPlayer.prototype.moveToXY = function(x, y , maxTime){
    
    var rotation = 0;
    var speed;
         
    rotation = this.angleBetween(this.x, this.y, x, y);
    speed = this.currentVelocity;
    this.setVelocity(Math.cos(rotation) * speed, Math.sin(rotation) * speed );

    return parseFloat(rotation);
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

ServerPlayer.prototype.distance = function (x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    
    return Math.sqrt(dx * dx + dy * dy);

};

/**
 * Sirve para calcular el ángulo entre dos puntos.
 * 
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 * @returns {Number}
 */

ServerPlayer.prototype.angleBetween = function (x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1).toFixed(3);
};

ServerPlayer.prototype.addInputs = function (data){
           
    for(var i=0; i < (data.length-2)/5; i++){
        var input = [];
        input[this.I_F] = data[2+5*i];
        input[this.I_X] = new Uint16Array(new Uint8Array([data[3+5*i], data[4+5*i]]).buffer)[0];
        input[this.I_Y] = new Uint16Array(new Uint8Array([data[5+5*i], data[6+5*i]]).buffer)[0];
        
        this.inputs.push(input);
    }
        
};

/**
 * Sirve para obtener los puntos que determinan el rectángulo del sprite.
 * 
 * @returns {Array}
 */

ServerPlayer.prototype.getPoints = function(){
    var x = this.x, y = this.y;
    return [
            this.rotatePoint( [x - this.width/2, y - this.height/2] ),
            this.rotatePoint( [x + this.width/2, y - this.height/2] ),
            this.rotatePoint( [x + this.width/2, y + this.height/2] ),
            this.rotatePoint( [x - this.width/2, y + this.height/2] )
          ];
};

/**
 * Se encarga de rotar los puntos del rectángulo del sprite según su rotación (Detección de colisiones más precisa).
 * 
 * @param {type} point
 * @returns {Object}
 */

ServerPlayer.prototype.rotatePoint= function(point) {
    
    var pivot = [this.x, this.y];
    var angle = this.rotation;

    var x = point[0] - pivot[0];
    var y = point[1] - pivot[1];

    var x1 = Math.cos(angle) * x - y * Math.sin(angle) + pivot[0];
    var y1 = Math.cos(angle) * y + x * Math.sin(angle) + pivot[1];
    
             
    return {x: x1, y: y1};
};

/**
 * Status para inicializar el jugador en el cliente.
 * 
 * @returns {Object}
 */

ServerPlayer.prototype.status = function(){
    return {
        id : this.id,
        n  : this.nickname,
        x  : parseFloat(this.x.toFixed(3)),
        y  : parseFloat(this.y.toFixed(3))
    };
    
};

ServerPlayer.prototype.stats = function(){
    // 21 Bytes por jugador   
    var firstChunk =  new Buffer([ this.id, this.numBullets, this.fired, this.life, this.numKills ]);
    var secondChunk = new Buffer(new Float32Array([parseFloat(this.x.toFixed(3)), parseFloat(this.y.toFixed(3)), parseFloat(this.rotation.toFixed(3))]).buffer);
    var thirdChunk = new Buffer(new Uint32Array([this.sequence]).buffer);
    
    var state = Buffer.concat([firstChunk, secondChunk]);
        state = Buffer.concat([state, thirdChunk]);
       
    // Salvaguarda para no enviar información repetida o no válida.
    if(this.last_seq === undefined || this.sequence === -1 ) state = null;
   
    this.last_seq = this.sequence;
    return state;
};

ServerPlayer.prototype.keepOnBounds = function(){
    if(this.x - (this.width)/2  < 0 ){
        this.x = (this.width)/2;
        this.vx = 0;
    }
    if(this.y< (this.height)/2){
        this.y = (this.height)/2;
        this.vy = 0;
    }
    if(this.x > this.WORLD_WIDTH - (this.width)/2){
        this.x = this.WORLD_WIDTH - (this.width)/2;
        this.vx = 0;
    }
    if(this.y > this.WORLD_HEIGHT - (this.height)/2){
        this.y = this.WORLD_HEIGHT - (this.height)/2;
        this.vy = 0;
    }  
    
};

ServerPlayer.prototype.getRec = function(){
    var x = this.x, y = this.y;
    return {
        x : this.x,
        y : this.y,
        width : this.width,
        height : this.height,
       
        points:this.getPoints() 
    };
};

ServerPlayer.prototype.incrKills = function(){
    this.numKills++;
    if(this.numKills > 0){
        
        this.level = this.LEVEL_TWO;
        this.currentVelocity = this.VEL_LEVEL_TWO;
        this.currentBulletInterval = this.BULLET_INTER_TWO;
        this.width = this.WIDTH_LEVEL_TWO;
        this.height = this.HEIGHT_LEVEL_TWO;
        
        
    }
    if(this.numKills > 1){
        
        this.level = this.LEVEL_THREE;
        this.currentVelocity = this.VEL_LEVEL_THREE;
        this.currentBulletInterval = this.BULLET_INTER_THREE;
        this.width = this.WIDTH_LEVEL_THREE;
        this.height = this.HEIGHT_LEVEL_THREE;
            
        
    }
    
};

/**
 * Obtiene el nivel actual del jugador
 * 
 * @returns {Number}
 */

ServerPlayer.prototype.getLevel = function(){
    return this.level;
};

/**
 * Detecta si un jugador ha chocado contra otro.
 * 
 * @param {ServerPlayer} otherPlayer
 * @returns {Boolean}
 */
ServerPlayer.prototype.crashedToOther = function(otherPlayer){
    
    var C = SAT.Circle;
    var V = SAT.Vector;
    // Coordenadas del vértice del barco
    var x = this.x + Math.cos(this.rotation)*this.width/2;
    var y = this.y + Math.sin(this.rotation)*this.height/2;
    
    var otherPlayerRect = otherPlayer.getRec();
    // Comprobamos si el vértice de este barco esta sobre la superficie del otro barco
    var p = new SAT.Polygon(new SAT.Vector(0,0), [
      new SAT.Vector(otherPlayerRect.points[0].x,otherPlayerRect.points[0].y),
      new SAT.Vector(otherPlayerRect.points[1].x,otherPlayerRect.points[1].y),
      new SAT.Vector(otherPlayerRect.points[2].x,otherPlayerRect.points[2].y),
      new SAT.Vector(otherPlayerRect.points[3].x,otherPlayerRect.points[3].y)
      
    ]);
      
    var collided = SAT.pointInPolygon(new V(parseFloat(x),parseFloat(y)), p);
       
    return collided ;
    
};

/**
 * Decrementa la vida del jugador dependiendo de su nivel y del otro jugador.
 * 
 * @param {Number} otherPlayerLevel
 * @returns {Boolean}
 */
ServerPlayer.prototype.decreaseLife = function(otherPlayerLevel){
    var isDead = false;
    
    if(otherPlayerLevel === this.LEVEL_ONE){
        if(this.level === this.LEVEL_ONE){
            this.life -= 5;
        }
        else if(this.level === this.LEVEL_TWO){
             this.life -= 1;
        }
        else if(this.level === this.LEVEL_THREE){
             this.life -= 1;
        }
    } 
    else if(otherPlayerLevel === this.LEVEL_TWO){
       
        if(this.level === this.LEVEL_ONE){
             this.life -= 10;
        }
        else if(this.level === this.LEVEL_TWO){
             this.life -= 2;
        }
        else if(this.level === this.LEVEL_THREE){
             this.life -= 1;
        }
    } 
    else if(otherPlayerLevel === this.LEVEL_THREE){
        
        if(this.level === this.LEVEL_ONE){
            this.life -= 15;
        }
        else if(this.level === this.LEVEL_TWO){
             this.life -= 3;
        }
        else if(this.level === this.LEVEL_THREE){
             this.life -= 1;
        }
    }
        
    if(this.life <= 0 ) {
        isDead = true;
        
    }
    return isDead;
};

/**
 * Cuando un enemigo choca contra un jugador decrementa la vida del jugador en una cantida fija.
 * 
 * @returns {Boolean}
 */
ServerPlayer.prototype.decreaseLifeByEnemy = function(){
    var isDead = false;
    
    if(this.level === this.LEVEL_ONE){
        this.life -= 10;
    }
    else if(this.level === this.LEVEL_TWO){
         this.life -= 2;
    }
    else if(this.level === this.LEVEL_THREE){
         this.life -= 1;
    }

        
    if(this.life <= 0 ) {
        isDead = true;
        
    }
    return isDead;
};

exports.ServerPlayer = ServerPlayer;
