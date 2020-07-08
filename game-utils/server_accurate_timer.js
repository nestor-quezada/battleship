/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase encargada de almacenar en el servidor el estado actual del jugador. Se ha creado este timer basandose en el 
* presentado en el  siguiente enlace: https://github.com/timetocode/node-game-loop/blob/master/gameLoop.js
* 
* @class AccurateTimer
* @constructor
* @param {function} callback - Función que se ejecuta cada vez que se cumple el delay.
* @param {delay} delay - Tiempo entre iteraciones.
* 
*/

var AccurateTimer = function(callback, delay) {
    this.delay = delay;
    this.callback = callback;
};

AccurateTimer.prototype.running = false;

/**
 * Incializa el timer.
 * 
 * @returns {undefined}
 */

AccurateTimer.prototype.start = function() {
    this.running = true;
    this.previousTick = Date.now();
    this.update();
};

/**
 * Para el timer evitando que se ejecute la siguiente iteración.
 * 
 * @returns {undefined}
 */

AccurateTimer.prototype.stop = function() {
    clearTimeout(this.nextTick);
    this.running = false;
};

/**
 * Esta función se llama cada pocos ms, el callback en cambio solo se ejecutará cuando se cumpla el delay.
 * 
 * @returns {undefined}
 */

AccurateTimer.prototype.update = function() {
   
    var now = Date.now();
  
    if (this.previousTick + this.delay <= now) {
        var delta = (now - this.previousTick) / 1000;
        this.previousTick = now;
        this.callback(delta);
    }
      
    if(this.running){
        this.nextTick = setTimeout(this.update.bind(this));
    }
  
};

exports.AccurateTimer = AccurateTimer;