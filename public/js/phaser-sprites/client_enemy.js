/**
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
