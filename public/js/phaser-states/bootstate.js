/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
*  Estado inicial del juego. Esta clase se  encarga de crear las configuraciones básicas del juego. 
*  Además es la encargada de detectar la orientación correcta en dispositivos móviles(landscape). 
* 
* @class BootState
* @constructor
* 
*  
*/ 
"use strict";

var BootState = function(){};

/* Sobreescribe el método predefinido de Phaser.State#preload. 
 * Sirve para precargar los recursos necesarios para la ejecución de este estado.
 *  
 */

BootState.prototype.preload = function(){
    // Imagen del fondo del juego
    this.game.load.image('background', 'assets/sprites/background.png');
          
};

/* Método que llama el estado para crear los sprites o configuraciones correspondientes al juego.
 * 
 * @returns {undefined}
 */

BootState.prototype.create = function(){
    
    // Configuraciones del ejecución del juego.
    this.game.world.setBounds(0, 0, 1905*2, 1770*2);
    // El canvas se adapta al tamaño de la ventana incluso si esta cambia.
    this.game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    // El canvas mantendrá las dimensiones al entrar en full screen.
    this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    // Limitamos el número de pointer a uno para mejorar el rendimiento.
    this.game.input.maxPointers = 1;
    
    this.game.device.desktop ? this.game.input.touch.enabled = false:this.game.input.mouse.enabled = false;
    // Evitamos que limpie el canvas cada dibujado ya que hay una imagen de fondo.
    this.game.renderer.clearBeforeRender = false;
    // Tiempo mínimo para considerar que es un hold.
    this.game.input.holdRate = 170;
    // El contenedor con los elementos que se quiere que se vean alentrar en full screen.
    this.game.scale.fullScreenTarget = document.getElementById('mBody');
    
    // Inicia el nuevo Phaser.State para la carga de recursos. 
    this.game.state.start('load');
}; 
