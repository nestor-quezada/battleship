/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase para facilitar el manejo de las monedas.
* 
* @class ServerBullet
* @constructor
* @param {ServerCoin} _game - Instancia del juego.
*  
*/

var ServerCoin = function(_game){

    this.game = _game;
    this.coins = this.game.coins;
    this.width =  this.WIDTH;
    this.height =  this.HEIGHT;
        
    this.init();
   
};

ServerCoin.prototype.WIDTH = 52;
ServerCoin.prototype.HEIGHT = 52;
ServerCoin.prototype.TYPE = 2;

ServerCoin.prototype.init = function(){
    this.x = this.getIniCoor();
    this.y = this.getIniCoor();
    
};

/**
 * Sirve para obtener unas coordenadas aleatorias dentro de los límites del mundo.
 * 
 * @returns {unresolved}
 */

ServerCoin.prototype.getIniCoor =  function () {
    
    var max = this.game.WORLD_WIDTH - 2 * this.WIDTH;
    var min = 0 + 2 * this.WIDTH;
    
    return parseFloat((Math.random() * (max - min) + min).toFixed(0));
};

/**
 * Buffer con las coordenadas de las monedas.
 * 
 * @returns {Buffer}
 */

ServerCoin.prototype.binaryStatus = function(){
    var state = new Buffer(new Uint16Array([this.x, this.y]).buffer);
    
    return state;
};

/**
 * Array con las coordenadas de las monedas.
 * 
 * @returns {Array}
 */

ServerCoin.prototype.status = function(){
    var state = [this.x, this.y];
    return state;
};

/**
 * Método que sirve para determinar las colisiones con otros elementos.
 * 
 * @returns {Object}
 */

ServerCoin.prototype.getRec = function(){
    var x = this.x, y = this.y;
    return {
        x : this.x,
        y : this.y,
        width : this.WIDTH,
        height : this.HEIGHT,
        points:[{ x : x - this.width/2, y: y - this.height/2},
                { x : x + this.width/2, y: y - this.height/2},
                { x : x + this.width/2, y: y + this.height/2},
                { x : x - this.width/2, y: y + this.height/2}]
    };
};

/**
 * Elimina esta moneda.
 * 
 * @returns {undefined}
 */

ServerCoin.prototype.kill = function(){
    var index = this.coins.indexOf(this);
    this.coins.splice(index, 1);
};

exports.ServerCoin = ServerCoin;