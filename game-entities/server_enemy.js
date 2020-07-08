/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase para facilitar el manejo de las balas.
* 
* @class ServerEnemy
* @constructor
* @param {PlayerServer} _player - Objeto del que se obtiene el punto de salida de la bala y la velocidad inicial de esta.
*  
*/

var ServerEnemy = function(game, id){
    
    this.WORLD_WIDTH = game.WORLD_WIDTH;
    this.WORLD_HEIGHT = game.WORLD_HEIGHT;
    this.MAX_VEL = 200;

    this.game = game;
    this.last_time = 0;
    this.width =  this.WIDTH;
    this.height =  this.HEIGHT;
    this.enemies = game.enemies;
    this.currentVelocity = 0;
    this.rotation = 0;
    this.id = id;
    this.create = true;

    this.init();
};

ServerEnemy.prototype.LIFESPAN = 800;
ServerEnemy.prototype.WIDTH = 96;
ServerEnemy.prototype.HEIGHT = 49;
ServerEnemy.prototype.DIRECTION_CHANGE_RATE = 3000;
ServerEnemy.prototype.TYPE = 4;
ServerEnemy.prototype.UPDATE_MESSAGE = 0;
ServerEnemy.prototype.KILL_MESSAGE = 1;
ServerEnemy.prototype.CREATE_MESSAGE = 2;

ServerEnemy.prototype.vx = 0;
ServerEnemy.prototype.vy = 0;
ServerEnemy.prototype.sequence = 0;
ServerEnemy.prototype.eliminatePostUpdate = false;

/**
 * Sirve para inicializar al enemigo.
 * 
 * @returns {undefined}
 */

ServerEnemy.prototype.init = function(){
    this.startTimer();
    this.target = { x: this.getIniCoor(), y: this.getIniCoor() };
    this.currentVelocity = this.MAX_VEL;
    this.x =  this.getIniCoor();
    this.y =  this.getIniCoor();
};

/**
 * Mueve la entidad hacia las coordenadas x,y
 * 
 * @param {Number} x
 * @param {NUmber} y
 * @returns {Number} -
 */

ServerEnemy.prototype.moveToXY = function(x, y){
    
    var rotation = 0;
    var speed;
        
    rotation = this.angleBetween(this.x, this.y, x, y);
    speed = this.currentVelocity;
    this.setVelocity(Math.cos(rotation) * speed, Math.sin(rotation) * speed );

    return parseFloat(rotation);
};

/**
 * Retorna coordenadas aleatorias dentro del mundo.
 * 
 * @returns {unresolved}
 */

ServerEnemy.prototype.getIniCoor =  function () {
    
    var max = this.WORLD_HEIGHT - 100;
    var min = 100;
    return parseFloat((Math.random() * (max - min) + min).toFixed(3));
};

/**
 * Retorna un número entero comprendido en el rango de min y max
 * 
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */

ServerEnemy.prototype.getRandomInt  = function (min, max) {
    return Math.round(Math.random() * (max - min + 1)) + min;
};

/**
 * Sirve para obtener un jugador al azar.
 * 
 * @returns {ServerPlayer}
 */

ServerEnemy.prototype.getRandomPlayer  = function () {
    if(this.game.players.length > 0){ 
        if(this.game.players.length === 1){
            return this.game.players[0];
        }else{
            var index = this.getRandomInt(0,this.game.players.length-1);
            return this.game.players[index];
        }
        
    }else{
        
        return false;
    }
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

ServerEnemy.prototype.angleBetween = function (x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1).toFixed(3);
};

/**
 * Incrementa o decrementa el valor de x e y según el valor de la velocidad.
 * 
 * @returns {undefined}
 */

ServerEnemy.prototype.computeVelocity = function(){
    var delta = 1 / 60;
       
    this.x += parseFloat((this.vx * delta).toFixed(3));
    this.y += parseFloat((this.vy * delta).toFixed(3));
    
};

/**
 * Timer para controlar la dirección de este enemigo.
 * 
 * @returns {undefined}
 */

ServerEnemy.prototype.startTimer = function(){
    setInterval(function(){
        this.target = { x: this.getIniCoor(), y: this.getIniCoor() };
        this.currentVelocity = this.MAX_VEL;
    }.bind(this), this.DIRECTION_CHANGE_RATE);
};

/**
 * Actualiza al enemigo y si es necesario cambia el punto al que debe perseguir.
 * 
 * @returns {undefined}
 */

ServerEnemy.prototype.update = function(){
    this.sequence++;
    this.rotation = this.moveToXY(this.target.x, this.target.y);
    this.computeVelocity();
};

/**
 * Método que sirve para determinar las colisiones con otros elementos.
 * 
 * @returns {Object}
 */

ServerEnemy.prototype.getRec = function(){
    var x = this.x, y = this.y;
    return {
        x : this.x,
        y : this.y,
        width  : this.WIDTH,
        height : this.HEIGHT,
        points : this.getPoints()
    };
};

/**
 * Sirve para obtener los puntos que determinan el rectángulo del sprite.
 * 
 * @returns {Array}
 */

ServerEnemy.prototype.getPoints = function(){
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

ServerEnemy.prototype.rotatePoint= function(point) {
    
    var pivot = [this.x, this.y];
    var angle = this.rotation;

    var x = point[0] - pivot[0];
    var y = point[1] - pivot[1];

    var x1 = Math.cos(angle) * x - y * Math.sin(angle) + pivot[0];
    var y1 = Math.cos(angle) * y + x * Math.sin(angle) + pivot[1];
    
             
    return {x: x1, y: y1};
};

/**
 * Buffer con las coordenadas del enemigo. El tipo de mensaje que devuelve depende del estado del enemigo.
 * 
 * @returns {Buffer}
 */

ServerEnemy.prototype.binaryStatus = function(){
    // 13 Bytes por enemigo 
    var state;
    if(!this.eliminatePostUpdate && !this.create){
        var firstChunk =  new Buffer([this.UPDATE_MESSAGE, this.id]);
        var secondChunk = new Buffer(new Uint8Array(new Float32Array([parseFloat(this.x.toFixed(3)), parseFloat(this.y.toFixed(3)), parseFloat(this.rotation.toFixed(3))]).buffer).buffer);
      
        state = Buffer.concat([firstChunk, secondChunk]);
        
        
    }
    
    if(this.eliminatePostUpdate){
        
       state =  new Buffer([this.KILL_MESSAGE, this.id]);
       this.kill();
       
        
    }
    
    if(this.create){
        this.create = false;
        state =  new Buffer([this.CREATE_MESSAGE, this.id]);
        
    }
    
    return state;
};

/**
 * Status para inicializar el enemigo en el cliente.
 * 
 * @returns {Object}
 */

ServerEnemy.prototype.status = function(){
    return {
        id : this.id        
    };
    
};
/**
 * Sirve para comprobar si se encuentra fuera de los límites del mundo.
 * 
 * @returns {Boolean}
 */

ServerEnemy.prototype.IsOutOfBounds = function(){
    if(this.x - (this.width)/2  < 0 
        || this.y < (this.height)/2 
        || this.x > this.WORLD_WIDTH - (this.width)/2 
        || this.y > this.WORLD_HEIGHT - (this.height)/2 ){
        
        return true;
    }
   
   return false;
    
};

/**
 * Facilita configurar la velocidad.
 * 
 * @param {Number} vx
 * @param {Number} vy
 * @returns {undefined}
 */


ServerEnemy.prototype.setVelocity = function(vx,vy){
    this.vx = vx;
    this.vy = vy;
};

/**
 * Elimina este enemigo.
 * 
 * @returns {undefined}
 */

ServerEnemy.prototype.kill = function(){
    
    var index = this.enemies.indexOf(this);
    this.enemies.splice(index, 1);
};

exports.ServerEnemy = ServerEnemy;