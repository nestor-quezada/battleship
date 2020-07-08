/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
*  Estado para la carga de los recursos(imagenes, spritesheets)
* 
* @class  LoadState 
* @constructor
* @param {Phaser.Game} game - Objeto al que pertenece el estado.
*  
*/ 
"use strict";

var LoadState = function(){};

LoadState.prototype.preload = function() {
    
    this.background = this.game.add.image(0, 0,'background');
    //this.game.time.advancedTiming = true;
    this.game.load.onLoadComplete.add(this.onLoadComplete, this);
    this.game.load.image('skull', 'assets/sprites/skull.png');
    this.game.load.image('particle', 'assets/sprites/circle.png');
    this.game.load.image('player', 'assets/sprites/ship-level-1.png');
    this.game.load.image('ship-level-2', 'assets/sprites/ship-level-2.png');
    this.game.load.image('enemy', 'assets/sprites/enemymin.png');
    this.game.load.image('ship-level-3', 'assets/sprites/ship-level-3.png');
    this.game.load.image('gun', 'assets/sprites/gunmin.png');
    this.game.load.bitmapFont('p2', 'assets/fonts/open-sans/ops.png', 'assets/fonts/open-sans/ops.xml');
    this.game.load.spritesheet('bullets', 'assets/sprites/new-bullets-sheet-24.png', 34, 24, 2);
    this.game.load.spritesheet('coins', 'assets/sprites/coins.png' , 40, 44, 4);
    this.game.load.spritesheet('whirlwind', 'assets/sprites/smoke-sheet.png', 256, 256, 15);
    this.game.load.spritesheet('explosion', 'assets/sprites/explosion-3.png', 128, 128, 16);
    this.game.load.spritesheet('bexplosion', 'assets/sprites/bulletexplosion.png', 128, 128, 16);
      
     
     // Si es dispositivo móvil guiamos al usuario para entrar al modo full screen.
    if(!this.game.device.desktop){
        this.game.scale.forceOrientation(true, false);
        this.game.scale.enterIncorrectOrientation.add(this.enterIncorrectOrientation, this);
        this.game.scale.leaveIncorrectOrientation.add(this.leaveIncorrectOrientation, this);
        this.game.scale.fullScreenTarget = document.getElementById('mBody');
        
    }
};

/* Se encarga de mostrar el cuadro para empezar el juego solo cuando los recursos esten cargados.
 * 
 * @returns {undefined}
 */
LoadState.prototype.onLoadComplete = function() {
    $('body').show();
    if(this.game.device.desktop)$('#mainView').show();
    
     // Aseguramos que el juego tenga las dimensiones de la pantalla del dispositivo al entrar a fullscreen.
    this.game.scale.onFullScreenChange.add(function(){
       if(this.game.scale.isFullScreen )this.game.scale.setGameSize(screen.width * window.devicePixelRatio, screen.height * window.devicePixelRatio);
    }.bind(this), this);
    
    // Si el dispositivo es tactil y ya estaba orientado correctamente mostramos el mensaje para que haga tap y entre a full screen.
    if(!this.game.device.desktop && this.game.scale.isLandscape ){
               
        $(document).one('click',function(){
            if(!this.game.scale.isFullScreen){
                this.game.scale.startFullScreen(true, true);
            }
            $('#mainView').show();
            $('#touchtostart').hide();
        }.bind(this));
        $('#touchtostart').show();
    
    }
    
   
};

 

/* Se llama cuando el dispositivo móvil rota y la posición final del dispositivo no es la correcta(portrait).
 * Al no ser la orientación correcta se muestra un mensaje para que rote el dispositivo.
 * 
 * @returns {undefined}
 */

LoadState.prototype.enterIncorrectOrientation =  function () {
    
    this.game.orientated = false;
    $('#mainView').hide();
    if(!this.game.started) $('#incorrectOrientation').show();
    $('#touchtostart').hide();
      
};

/* Se llama cuando el dispositivo móvil rota y la posición final del dispositivo es la correcta(lanscape).
 * Al ser la orientación correcta se muestra un mensaje para que el usuario haga tap y asi poder iniciar 
 * el modo fullscreen si el navegador lo permite. Esto es necesario ya que los navegadores no permiten 
 * llamar a fullscreen mediante código por motivos de seguridad.
 * 
 * @returns {undefined}
 */

LoadState.prototype.leaveIncorrectOrientation = function () {
    
    this.game.orientated = true;
    if(!this.game.started && !this.game.scale.isFullScreen)$('#touchtostart').show();
    $('#incorrectOrientation').hide();
    if(!this.game.started){
        $(document).one('click',function(){
            if(this.game.orientated && !this.game.scale.isFullScreen){
                this.game.scale.startFullScreen(true, true);
            }
            $('#mainView').show();
            $('#touchtostart').hide();
        }.bind(this));
    }
};



