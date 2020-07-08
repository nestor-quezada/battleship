/**
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

