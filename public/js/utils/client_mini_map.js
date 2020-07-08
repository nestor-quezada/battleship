/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase que sirve para facilitar la animación de las balas.
* 
* @class MiniMap
* @constructor
* @param {Phaser.Game} game - Objeto game.
* @param {Number} x - Coordeanada x inicial del sprite.
* @param {Number} y - Coordeanada y inicial del sprite.
* @param {String} key - Nombre del recurso a utilizar para el sprite.
* @param {Number} frame - Si es un sprite sheet el numero del frame que se quiere utilizar.
*/
"use strict";
var MiniMap = function(game, x, y, graphics) {
  
  this.game = game;
  this.x = x;
  this.y = y;
  this.scale = 0.03;
  this.width = this.game.world.bounds.width*this.scale;
  this.height = this.game.world.bounds.height*this.scale;
  this.playerDiameter = 0.07*this.width;
  this.enemyDiameter = 0.04*this.width;
  this.MapBackground = graphics; 
  this.init();
};

MiniMap.prototype.init = function() {
    
    //this.MapBackground = this.game.add.graphics(this.x, this.y);
    this.MapBackground.fixedToCamera = true;
    this.x = $(document).width()*window.devicePixelRatio - this.width - 5;
    this.y = $(document).height()*window.devicePixelRatio - this.height - 5;
};

/**
 * Se llama automaticamente por Phaser. Dentro de este se cambia la rotación de la bala para dar un efecto a la bala.
 * 
 * @returns {undefined}
 */

MiniMap.prototype.update = function() {
    this.drawMapBackground();
    this.drawPlayers();
    this.drawEnemies();
};

MiniMap.prototype.drawMapBackground = function() {
    this.MapBackground.clear();
    this.MapBackground.beginFill(0x000000, 0.6);
    this.MapBackground.drawRect(this.x, this.y, this.width, this.height);
    this.MapBackground.endFill();
};

MiniMap.prototype.drawPlayer = function(x, y, isLocalPlayer) {
    var scaledXY = this.scaleCoor(x,y);
    var color = isLocalPlayer ? 0xffffff : 0x669999;
    this.MapBackground.beginFill(color, 1);
    this.MapBackground.drawCircle(scaledXY[0], scaledXY[1], this.playerDiameter);
    this.MapBackground.endFill();
};

MiniMap.prototype.drawPlayers = function() {
    this.game.players.forEach(function(player, index){
        var isLocalPlayer = player.id === this.game.socket.id ? true : false; 
        this.drawPlayer(player.x, player.y, isLocalPlayer);
    }.bind(this));
};

MiniMap.prototype.drawEnemy = function(x, y) {
    var scaledXY = this.scaleCoor(x,y);
    var color = 0xff0000;
    this.MapBackground.beginFill(color, 1);
    this.MapBackground.drawCircle(scaledXY[0], scaledXY[1], this.enemyDiameter);
    this.MapBackground.endFill();
};

MiniMap.prototype.drawEnemies = function() {
    this.game.enemies.forEach(function(enemy, index){
        this.drawEnemy(enemy.x, enemy.y);
    }.bind(this));
};

MiniMap.prototype.scaleCoor = function(x, y) {
    var x = x/this.game.world.bounds.width * this.width + this.x;
    var y = y/this.game.world.bounds.height * this.height + this.y;
    
    return [x,y];
};