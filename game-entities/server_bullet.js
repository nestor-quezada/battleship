/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase para facilitar el manejo de las balas.
* 
* @class ServerBullet
* @constructor
* @param {PlayerServer} player - Objeto del que se obtiene el punto de salida de la bala y la velocidad inicial de esta.
*  
*/

var ServerBullet = function(player){
     
    this.player = player;
    this.rotation = player.rotation;
    this.x = player.x;
    this.y = player.y;
    this.bullets = player.bullets;
    this.width =  this.WIDTH;
    this.height =  this.HEIGHT;
    this.id = this.player.id; 
       
    this.velocityFromRotation(this.rotation, 700);
    this.startTimer();
};

ServerBullet.prototype.LIFESPAN = 1200;
ServerBullet.prototype.WIDTH = 44;
ServerBullet.prototype.HEIGHT = 44;
ServerBullet.prototype.TYPE = 1;

/**
 * Calcula las componentes vectoriales x e y de la velocidad dado un ángulo.
 * 
 * @param {Number} rotation
 * @param {Number} speed
 * @returns {undefined}
 */

ServerBullet.prototype.velocityFromRotation = function (rotation, speed) {
    this.vx = Math.cos(rotation) * speed;
    this.vy = Math.sin(rotation) * speed;
};

/**
 * Suma a la posición actual un dx que depende de la velocidad.
 * 
 * @returns {undefined}
 */

ServerBullet.prototype.computeVelocity = function(){
    var delta = 1 / 60;
       
    this.x += this.vx * delta;
    this.y += this.vy * delta;
       
};

/**
 * Timer para limitar la vida de la bala.
 * 
 * @returns {undefined}
 */

ServerBullet.prototype.startTimer = function(){
    setTimeout(function(){
        var index = this.bullets.indexOf(this);
        this.bullets.splice(index,1);
    }.bind(this), this.LIFESPAN);
};

/**
 * Actualiza el estado de la bala.
 * 
 * @returns {undefined}
 */

ServerBullet.prototype.update = function(){
    this.computeVelocity();
};

/**
 * Método que sirve para determinar las colisiones con otros elementos.
 * 
 * @returns {Object}
 */

ServerBullet.prototype.getRec = function(){
    return {
        x : this.x,
        y : this.y,
        width : this.WIDTH,
        h : this.HEIGHT,
        points : this.getPoints()
    };
};

/**
 * Sirve para obtener los puntos que determinan el rectángulo del sprite.
 * 
 * @returns {Array}
 */

ServerBullet.prototype.getPoints = function(){
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

ServerBullet.prototype.rotatePoint= function(point) {
    var pivot = [this.x, this.y];
    var angle = this.rotation;

    var x = point[0] - pivot[0];
    var y = point[1] - pivot[1];

    var x1 = Math.cos(angle) * x - y * Math.sin(angle) + pivot[0];
    var y1 = Math.cos(angle) * y + x * Math.sin(angle) + pivot[1];
                 
    return {x: x1, y: y1};
};

/**
 * Elimina esta bala.
 * 
 * @returns {undefined}
 */

ServerBullet.prototype.kill = function(){
    var index = this.bullets.indexOf(this);
    this.bullets.splice(index, 1);
};

exports.ServerBullet = ServerBullet;