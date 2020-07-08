/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase para facilitar el manejo de las monedas.
* 
* @class ServerWhirlwind
* @constructor
* @param {ServerCoin} _game - Instancia del juego.
*  
*/

var ServerWhirlwind = function(_x,_y){
     
    this.width =  this.WIDTH;
    this.height =  this.HEIGHT;
    this.x = _x;
    this.y = _y;
    
};

ServerWhirlwind.prototype.WIDTH = 100;
ServerWhirlwind.prototype.HEIGHT = 100;
ServerWhirlwind.prototype.TYPE = 3;

/**
 * Facilita la detección de colisiones.
 * 
 * @returns {Object}
 */
ServerWhirlwind.prototype.getRec = function(){
    var x = this.x, y = this.y;
    return {
        x : this.x,
        y : this.y,
        width  : this.WIDTH,
        height : this.HEIGHT,
        points : [{ x : x - this.width/2, y: y - this.height/2},
                  { x : x + this.width/2, y: y - this.height/2},
                  { x : x + this.width/2, y: y + this.height/2},
                  { x : x - this.width/2, y: y + this.height/2}]
    };
};




exports.ServerWhirlwind = ServerWhirlwind;