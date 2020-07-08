/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
*  Estado principal del juego. Esta clase se encarga de crear el 'mundo' y de gestionar el control del jugador.
* 
* @class PlayState
* @constructor
*  
*/ 
"use strict";

var PlayState = function(){
    this.dialogMessagesActive = false;
    this.time_acumulator = 0;
    this.last_time = 0;
};

// Coordenadas de los remolinos.
PlayState.prototype.whirlwindCoor = [{x:960,y:960},{x:960,y:960*3},{x:960*3,y:960},{x:960*3,y:960*3}];

/**
 * Sirve para crear todos los sprites necesarios del juego.
 * 
 * @returns {undefined}
 */

PlayState.prototype.create = function () {
    if(!this.PingActive)this.game.startPing();
    this.game.world.removeAll();
    this.game.coins = [];
    this.game.players = [];
    this.game.enemies = [];
    this.background = this.game.add.image(0, 0,'background');
    this.background2 = this.game.add.image(1905, 0,'background');
    this.background3 = this.game.add.image(0, 1770,'background');
    this.background4 = this.game.add.image(1905, 1770,'background');
    this.layerWhirlwinds = this.game.add.group();
    for(var i=0; i < this.whirlwindCoor.length; i++){
        var x = this.whirlwindCoor[i].x;
        var y = this.whirlwindCoor[i].y;
        var whirlwind = this.layerWhirlwinds.create(parseFloat(x),parseFloat(y),'whirlwind',0);
        whirlwind.anchor.setTo(0.5);
        whirlwind.animations.add('whirlwind');
        whirlwind.play('whirlwind',10,true);
    }
    this.game.emitterLayer = this.game.add.group();
    this.initGame(this.game.initialStatus);
         
    if(this.game.waiting){ 
        this.game.waitingLabel = this.game.add.bitmapText( 255, 255, 'p2', this.game.socket.nickname.toUpperCase() 
            + ' \nwaiting for other players...', 20 );
        this.game.waitingLabel.fixedToCamera = true;
        this.game.waitingLabel.angle = 180;
    }
     

    // Configuraciones del juego para el pc 
    
    if(this.game.device.desktop){    
        this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(function(){

            if(this.dialogMessagesActive) {

                    if($('#mymessage').val().trim())this.game.socket.emit(EventCode.CHAT_MESSAGE,  {id:this.game.socket.id,m:$('#mymessage').val().trim()}, true);
                    $('#mymessage').val('');
                    $('#messages').css({top: $(document).height()/2, left:$(document).width()/2});

                }else {

                   this.dialogMessagesActive = true;
                   $('#messages').css({top: $(document).height()/2, left:$(document).width()/2});
                   $('#messages').show();
                   $('#labelm').trigger('click');
                   $('#messages').focus();

                }


        }.bind(this), this);
     
        $('#buttonCloseMessagesInput').click(function(){
            if(this.dialogMessagesActive){
                this.dialogMessagesActive = false;
                $('#messages').hide();
            }
        }.bind(this));
    }
    if(!this.game.device.desktop){
        this.game.input.onHold.add(function(){
                this.localPlayer.fired = 1;
                
           }.bind(this), this);
    }else{
       this.game.input.onDown.add(function(){
            this.localPlayer.fired = 1;

       }.bind(this), this); 
    }
    
    this.game.input.onUp.add(function(){
         this.localPlayer.fired = 0;

     }.bind(this), this);
   
    // Configuraciones del juego para dispositivos móviles 
    
    this.explosions = this.game.add.group();
    this.explosions.name = 'explosion';
    this.explosions.createMultiple(30, 'explosion');
    this.explosions.forEach(this.setupExplosion, this);            
      
    this.layerCoins = this.game.add.group();
    this.layerCoins.enableBody = true;
       
    this.bulletsIcon = this.game.add.image(200,18,'bullets');
    this.bulletsIcon.fixedToCamera = true;
    
    this.game.numBullets = this.game.add.bitmapText( 245, 15, 'p2', 'x10', 20 );
    this.game.numBullets.fixedToCamera = true;
    this.game.numBullets.angle = 180;
    
    this.game.leaderboard = this.game.add.bitmapText( this.game.width - 150, 15, 'p2', '', 15 );
    this.game.leaderboard.fixedToCamera = true;
    this.game.leaderboard.angle = 180;
    
    this.killsIcon = this.game.add.image(300, 15, 'skull');
    this.killsIcon.fixedToCamera = true;
    
    this.game.numKills = this.game.add.bitmapText(335, 15, 'p2', 'x0', 20);
    this.game.numKills.fixedToCamera = true;
    this.game.numKills.angle = 180;
    
    this.game.started = true;
    
    $('#leaderboard' ).show();
   
    this.MOVE_LIMIT = -100;
    this.MOVE_SPEED = 7000;
    if(this.game.device.desktop){
        this.game.messagesToAll = this.game.add.bitmapText( 0, $(document).height() - 47, 'p2', 'Press Enter to send a message', 22 );
        this.game.messagesToAll.fixedToCamera = true;
        this.game.messagesToAll.angle = 180;
        this.wobble = this.MOVE_LIMIT;
    
        this.game.add.tween(this)
            .to(
                { wobble: screen.width * window.devicePixelRatio },
                this.MOVE_SPEED, null, true, 0,
                -1, false
            );
    }
    
    this.game.camera.follow(this.localPlayer);
    this.game.camera.roundPx = false;
    
    var graphics = this.game.add.graphics(0, 0);
    this.miniMap = new MiniMap(this.game, $(document).width()- 105, $(document).height()- 105, graphics);
};

/**
 * Sirve para configurar las explosiones.
 * 
 * @param {type} explosion
 * @returns {undefined}
 */

PlayState.prototype.setupExplosion = function  (explosion) {

    explosion.anchor.x = 0.5;
    explosion.anchor.y = 0.5;
    explosion.animations.add('explosion');

};

PlayState.prototype.createCoins = function() {
    this.layerCoins.destroy();
    this.layerCoins = this.game.add.group();
    this.layerCoins.enableBody = true;
       
    for(var i = 0; i < this.game.coins.length; i++){
        var x = this.game.coins[i][0];
        var y = this.game.coins[i][1];
       
        if(this.game.device.desktop){
            setTimeout(function(x,y){
                var coin = this.layerCoins.create(x, y, 'coins', 0);
                    coin.anchor.setTo(0.5);
                    coin.moves = false;
                    coin.animations.add('rot');
                    coin.play('rot', 15, true);
                    var bounce= this.game.add.tween(coin);
                    
                    coin.width= 0;
                    coin.height=0;
                    bounce.to({ width: 24, height:24 }, 2000,Phaser.Easing.Elastic.In);
                    bounce.start();
                    
         
            }.bind(this,x,y),100*i);
        }else{
             var coin = this.layerCoins.create(x, y, 'coins', 0);
             coin.anchor.setTo(0.5);
             coin.moves = false;
             coin.width = 24;
             coin.height = 24;

        }
        
    }
       
    this.game.coins = [];
};

/**
 * Se llama automáticamente por Phaser. Sirve para principalmente para detectar las colisiones entre los diferentes sprites y aplicar los efectos gráficos correspondientes.
 * 
 * @returns {undefined}
 */

PlayState.prototype.update = function() {
              
    if(this.game.device.desktop){   
        this.game.messagesToAll.cameraOffset.x = this.wobble;
        this.game.messagesToAll.cameraOffset.y = $(document).height() * window.devicePixelRatio - 30;
    }
    if(this.game.coins.length > 0) this.createCoins();
    
    if(this.game.waitingLabel && !this.game.waiting){ 
        this.game.waitingLabel.destroy();
    }
       
    for(var i = 0 ; i < this.game.players.length ; i++){
        var player1 = this.game.players[i];
        this.game.physics.arcade.overlap( this.game.layerEnemies, player1.getBullets(), this.bulletToSprite, null, this );
        for(var j = 0 ; j < this.game.players.length ; j++){
            var player2 = this.game.players[j];
            if(player1 !== player2){
                
                this.game.physics.arcade.overlap( player1, player2.getBullets(), this.bulletToSprite, null, this );
                
            }
        }
    }
       
    this.game.physics.arcade.overlap( this.game.layerPlayers, this.layerCoins, this.coinsCollision, null, this );
    
  
    this.miniMap.update();  
};

/**
 * Sirve para animar las monedas cuando se detecta colisión.
 * 
 * @param {Player} player - Jugador que colisiona.
 * @param {Phaser.Sprite} coin - Moneda que colisiona.
 * @returns {undefined}
 */

PlayState.prototype.coinsCollision = function (player, coin){
    if(this.game.device.desktop)
    {
        var bounce = this.game.add.tween(coin);
        bounce.to({ width: 0, height:0, x:player.x,y: player.y, alpha:0, tint:0 }, 50);
        bounce.onComplete.add(function(){
            coin.destroy();
        }, this);
        bounce.start();
    }else{
        coin.destroy();
    }
};

/**
 * Sirve para configurar las coordenadas de la explosión al colisionar la bala y el jugador.
 * 
 * @param {Player} player - Jugador que colisiona.
 * @param {Missile} bullet - Bala que colisiona.
 * @returns {undefined}
 */

PlayState.prototype.bulletToSprite = function (player, bullet){
        
    if(player.id !== bullet.id);
    bullet.explode = false;
    bullet.kill();
    var explosion = this.explosions.getFirstExists(false);
        explosion.reset(player.x , player.y);
        explosion.play('explosion', 10, false, true);

};

/**
 * Sirve para inicializar los sprites con coordenadas provenientes del servidor.
 * 
 * @param {Object} initialStatus
 * @returns {undefined}
 */

PlayState.prototype.initGame = function (initialStatus){
    
    this.game.layerPlayers = this.game.add.group();
    this.game.layerPlayers.enableBody = true;
    for(var i = 0 ; i < initialStatus.players.length ; i++){
        
        var player = new Player(this.game, initialStatus.players[i]);
            this.game.players.push(player);
            
        if(this.game.socket.id === initialStatus.players[i].id){
            this.localPlayer = player;
        }
        
        this.game.layerPlayers.add(player);                
       
    }    
        
    for(var i=0; i < initialStatus.coins.length; i++ ){
        var x = initialStatus.coins[i][0];
        var y = initialStatus.coins[i][1];
        
        this.game.coins[i] = [x,y];
    }
    
    this.game.layerEnemies = this.game.add.group();
    this.game.layerEnemies.enableBody = true;
    
    for(var i=0; i < initialStatus.enemies.length; i++ ){
        var id = initialStatus.enemies[i].id;
        
        var enemy = new Enemy(this.game, 0, 0, 'enemy', 0, id);
        this.game.layerEnemies.add(enemy);
        this.game.enemies.push(enemy);
    }
    
    if(this.game.players.length === 1) this.game.waiting = true;
};
/*
PlayState.prototype.render = function(){
    this.game.debug.text(this.game.time.fps || '--', 2, 14, "#00ff00");
    
};*/




