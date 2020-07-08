/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
* Clase encargada de controlar y dibujar a cada jugador.
* 
* @class Player
* @constructor
* @param {Phaser.Game} game - Objeto game.
* @param {Object} _status - Objeto con los datos iniciales sobre el estado del jugador.
*/
"use strict";

var Player = function ( game, status ){
    Phaser.Sprite.call(this, game, parseFloat(status.x.toFixed(3)), parseFloat(status.y.toFixed(3)), 'player');
    
    this.status = status;
    this.coorBuffer = [];    
    this.id = status.id;
    this.nickname = status.n;
    this.clientInputs = [];
    this.clientPredictionInputs = [];
    this.clientBinaryInputs = new Uint8Array();
    this.l_x=0;
    this.l_y=0;
    this.bulletsArray = [];
    this.last_update_time = Date.now();
    // Verificación para saber si el nuevo objeto pertenece al cliente local
    this.id === this.game.socket.id ? this.isLocalPlayer = true : this.isLocalPlayer = false;
       
    this.init();
    
    
    
    
};

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;


Player.prototype.BULLET_INTER_TWO = 500;
Player.prototype.BULLET_INTER_THREE = 400;
Player.prototype.VEL_LEVEL_TWO = 200;
Player.prototype.VEL_LEVEL_THREE = 170;
Player.prototype.INI_LIFE = 30;
Player.prototype.MAX_LIFE_ONE = 30;
Player.prototype.BULLET_FRAME_TWO = 0;
Player.prototype.BULLET_FRAME_THREE = 1;
Player.prototype.I_ID = 0;
Player.prototype.I_B  = 1;
Player.prototype.I_F  = 2;
Player.prototype.I_L  = 3;
Player.prototype.I_K  = 4;
Player.prototype.I_X  = 5;
Player.prototype.I_Y  = 6;
Player.prototype.I_R  = 7;
Player.prototype.I_S  = 8;
Player.prototype.BULLET_LIFESPAN = 700;
Player.prototype.INI_FRAMES = 2;

Player.prototype.numInputsToSend = 2; // Número de inputs que ha de contener cada envio al servidor.
Player.prototype.bulletTime = 0;
Player.prototype.fired = 0;
Player.prototype.life = Player.prototype.INI_LIFE;
Player.prototype.tweenComplete = true;
Player.prototype.minFrames = Player.prototype.INI_FRAMES; // Número mínimo de estados para poder interpolar.
Player.prototype.interpIndex = 0;
Player.prototype.numKills = 0;
Player.prototype.currentVelocity = 300; // Velocidad actual del jugador.
Player.prototype.curretBulletInterval = 400;
Player.prototype.emitterVelocityFactor = 25; // Factor que se le aplica al emisor de partículas.
Player.prototype.actualBulletFrame = 0;
Player.prototype.actualSeqNum = 0;
Player.prototype.sequence = 0;
Player.prototype.last_seq = 0;
Player.prototype.numBullets = 30;
Player.prototype.minLen = 2; // Factor que se usa para determinar si se debe o no usar interpolación. Sirve para compensar la lenta lectura del buffer.

/* Inicializa el jugador creando todos los elementos necesarios dependiendo de si es local o remoto.
 * 
 * @returns {undefined}
 */

Player.prototype.init = function() {
  
    // Creamos el grupo de las balas 
    this.bullets = this.game.add.physicsGroup();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    
    for(var i=0; i < 3; i++){
        var bullet = new Missile(this.game, 50, 50, 'bullets', 0, this);
        this.bullets.add(bullet);
        this.bulletsArray.push(bullet);
    }
    
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);
     
    // Creación y configuración de la física del jugador    
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.collideWorldBounds = true;
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    this.anchor = new Phaser.Point(0.5,0.5);
    this.scale.setTo(1.3);
    this.body.moves = false;    
    if(!this.isLocalPlayer){
        // Creamos la barra de vida del jugador remoto
        this.healthBar = this.game.add.graphics(-this.body.halfWidth, - this.INI_LIFE*5/(6*2));
        this.healthBar.rotation = 1.5708;
        this.addChild(this.healthBar);
        
    }else{
        this.lifeText = this.game.add.bitmapText( 25, 3, 'p2', 'Life', 15 );
        this.lifeText.fixedToCamera = true;
        this.lifeText.angle = -180;
        
        // Creamos la barra de vida del jugador local
        this.healthBar = this.game.add.graphics(10,15);
        this.healthBar.fixedToCamera = true;
        
    }
    
    // Nickname del jugador 
    this.text = this.game.add.bitmapText( -this.body.halfWidth - 12, 0, 'p2', this.nickname, 15 );
    this.text.anchor.set(0.5);
    this.text.y = -this.text.width/2;
    this.text.rotation = -1.5708;
    this.addChild(this.text);
    
    // Mensaje del jugador
    this.message = this.game.add.bitmapText( 0, 0, 'p2', '', 15 );
    this.message.rotation = Math.PI;
         
    if(this.game.device.desktop){// Emisor de particulas del jugador para crear el efecto de las olas.
        this.emitter = this.game.add.emitter(0, 0, 10);
        this.emitter.makeParticles( [ 'particle' ] );
        this.emitter.setAlpha(1, 0.5, 500);
        this.emitter.setScale(3, 0.3, 0.8, 0.3, 1000);
        this.emitter.start(false, 500, 50);
        this.game.emitterLayer.add(this.emitter);  
    }
    
    // Cañon
    this.gun = this.game.add.image(0, 0,'gun');
    this.gun.alpha = 0;
    this.gun.anchor.setTo(0.5);
    this.gun.scale.setTo(1);
    this.level = 1;
};

/* Dibuja el mensaje del jugador cerca del sprite correspondiente.
 * 
 * @param {String} data - Mensaje del jugador.
 * @returns {undefined}
 */

Player.prototype.showMessage = function(data){
    if(!this.nickname)this.nickname = 'anonym' + this.id;
    this.message.setText(this.nickname +': '+ data);
    if(this.clearMessage) clearInterval(this.clearMessage);
    this.clearMessage = setTimeout(function(){this.message.setText('');}.bind(this),2000);
};

/* Sirve para almacenar los update de cada jugador y tratar de compensar el retardo y jitter con el que llegan los paquetes.
 * 
 * @param {Unit8Array} data - Estado del jugador procedente del servidor en formato binario.
 * @returns {undefined}
 */
Player.prototype.updateBuffer = function(data){
    
    if(this.coorBuffer.length > 5) {
        this.minFrames = this.INI_FRAMES;
        this.coorBuffer = [];
    }
    
    var state = [];
    state[this.I_B] = data[this.I_B];
    state[this.I_S] = new Uint32Array(data.slice(17,21).buffer)[0];
    state[this.I_K] = data[this.I_K];
    state[this.I_F] = data[this.I_F];
    state[this.I_L] = data[this.I_L];
    state[this.I_X] = new Float32Array(data.slice(5,9).buffer)[0];
    state[this.I_Y] = new Float32Array(data.slice(9,13).buffer)[0];
    state[this.I_R] = new Float32Array(data.slice(13,17).buffer)[0];
    
    if( state[this.I_S] !== undefined && state[this.I_S] !== -1 && state[this.I_S] !== this.last_seq ){ 
        this.coorBuffer.push(state);
    }
   
    var maxSeqDiff = this.sequence - Math.round(this.game.net_latency/(16*2) + state[this.I_S]);
       
    if(this.isLocalPlayer && maxSeqDiff > 6){ 
         this.stopClientProcessing = true;
    }else{
        this.stopClientProcessing = false;
    }
          
        
};

/* Método que se llama de forma automática por Phaser en cada actualización del juego.
 * 
 * @returns {undefined}
 */

Player.prototype.update = function(){
       
    this.gun.alpha = 1;
        
    this.updatePhysics();
    // Solo usamos el emisor de particulas en PC ya que consume muchos recursos.
    if(this.game.device.desktop){
        this.updateEmitter();
    }
    
    // Animación de los mensajes
    this.message.x = this.x - this.body.halfWidth - 20;
    this.message.y = this.y - this.body.halfWidth - 20;
    
    this.checkPlayerLevel();
     
    this.isLocalPlayer ? this.drawLocal() : this.drawRemote();
    // Variables para calcular la veleocidad del jugador.       
    this.l_x = this.x;
    this.l_y = this.y;
    
};

Player.prototype.checkPlayerLevel = function(){
    // Dependiendo del nivel de jugador se dibuja una u otra imagen(barco).
  
;    if(this.numKills > 0){
        this.currentVelocity = this.VEL_LEVEL_TWO;
        this.curretBulletInterval = this.BULLET_INTER_TWO;
        this.actualBulletFrame = this.BULLET_FRAME_TWO;
        this.loadTexture('ship-level-2');
        this.emitterVelocityFactor = 100;
        this.body.setSize(this.width, this.height, 0, 0);
        this.gun.scale.setTo(1.2);     
        this.text.x = -this.body.halfWidth+50;
        this.text.y = -this.text.width/2;
        this.level = 1;
    }
    
    if(this.numKills > 1){
        this.currentVelocity = this.VEL_LEVEL_THREE;
        this.curretBulletInterval = this.BULLET_INTER_THREE;
        this.actualBulletFrame = this.BULLET_FRAME_THREE;
        this.loadTexture('ship-level-3');
        this.emitterVelocityFactor = 200;
        this.body.setSize(this.width, this.height, 0, 0);
        this.text.x = -this.body.halfWidth+110;
        this.text.y = -this.text.width/2;
        this.gun.scale.setTo(1.5);  
        this.level = 2;
    }
};

Player.prototype.updateEmitter = function(){
    this.vx = this.x - this.l_x;
    this.vy = this.y - this.l_y;

    var px= this.vx;
    var py= this.vy;

    px *= -1;
    py *= -1;

    // Configuramos las particulas dependiendo de la velocidad del jugador en cada instante.
    this.emitter.minParticleSpeed.set(px*this.emitterVelocityFactor, py*this.emitterVelocityFactor);
    this.emitter.maxParticleSpeed.set(px*this.emitterVelocityFactor, py*this.emitterVelocityFactor);
    
    this.emitter.emitX = this.x;
    this.emitter.emitY = this.y;
};


/* Dibuja los elementos correspondientes al jugador local.
 * 
 * @returns {undefined}
 */

Player.prototype.drawLocal = function(){
   
    this.healthBar.clear();
    this.healthBar.beginFill(0x00004d, 1);
    this.healthBar.drawRoundedRect(0+10, 0+5,this.INI_LIFE*5, 20,5);
   
    if( 20 <= this.life && this.life <= 30 ){
        this.healthBar.beginFill(0x33cc33, 1);
       
    }
    if( 10 <= this.life && this.life  < 20 ){ 
        this.healthBar.beginFill(0xffff33, 1);
         
    }
    if( 0 <= this.life && this.life < 10){ 
        this.healthBar.beginFill(0xe60000, 1);
         
    }
    this.healthBar.drawRoundedRect(0+10, 2+5, this.life * 5, 16,2);
    this.healthBar.endFill();       
    
};

/* Facilita la concatenación de arrays.
 * 
 * @returns {Uint8Array} 
 *    
 */

Player.prototype.arrayBufferConcat = function() {
  var length = 0;
  var buffer = null;

  for (var i in arguments) {
    buffer = arguments[i];
    length += buffer.byteLength;
  }

  var joined = new Uint8Array(length);
  var offset = 0;

  for (var i in arguments) {
    buffer = arguments[i];
    joined.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  return joined;
  
};

/* Crea un array con el input actual del jugador local y lo envía al servidor.
 * 
 * @returns {undefined}
 */

Player.prototype.sendInputs = function(){
    
    
 
    var firstChunk = new Uint8Array([this.fired]);
    var secondChunk= new Uint8Array(new Uint16Array([this.game.input.activePointer.worldX,this.game.input.activePointer.worldY]).buffer);
     
    var clientInput = this.arrayBufferConcat(firstChunk,secondChunk);
    
    this.clientBinaryInputs = this.arrayBufferConcat(this.clientBinaryInputs, clientInput);
    if(this.clientBinaryInputs.length === this.numInputsToSend*5) {
          
        var info = new Uint8Array([EventCode.UPDATE_PLAYER, this.id]); 
        this.clientBinaryInputs = this.arrayBufferConcat(info, this.clientBinaryInputs);
       
         this.game.socket.emit('', this.clientBinaryInputs , false);
        
         
        this.clientBinaryInputs = new Uint8Array();
    }
     
};

 /**
  *  Si el jugador no es el local lo movemos con los datos aportados por el servidor 
  *  
  */

Player.prototype.drawRemote = function(){
          
    // Actualizamos la barra de vida
    this.healthBar.clear();
    this.healthBar.beginFill(0x000000, 1);
    this.healthBar.drawRoundedRect(0, 0,this.INI_LIFE*5/6, 4,2);
    
    if( 20 <= this.life && this.life <= 30 ){
        this.healthBar.beginFill(0x33cc33, 1);
       
    }
    if( 10 <= this.life && this.life  < 20 ){ 
        this.healthBar.beginFill(0xffff33, 1);
         
    }
    if( 0 <= this.life && this.life < 10){ 
        this.healthBar.beginFill(0xe60000, 1);
         
    }
    this.healthBar.drawRoundedRect(0, 0, this.life*5/6, 4,2);
    this.healthBar.endFill();
    
   
    
};

/* Facilita el asignar los diferente valores de la interpolación al ritmo de los dibujados del juego.
 * 
 * @returns {undefined}
 */

Player.prototype.interpolate = function (){
    
    this.num_seq++;
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

/* Crea una bala solo cada cierto tiempo. Para ello utiliza un pool de balas que se van reseteando y 
 * se inicializan en la posición del jugador.
 * 
 * @returns {undefined}
 */

Player.prototype.fireBullet = function () {

    if (Date.now() > this.bulletTime && this.numBullets > 0)
    {   
        var bullet = this.bullets.getFirstExists(false);
        
        if (bullet)
        {   
                           
            bullet.rotation = this.rotation;
            bullet.reset(this.x, this.y);
            bullet.targetRotation = this.rotation;
            this.game.physics.arcade.velocityFromRotation(this.rotation, 700, bullet.body.velocity);
            this.gun.rotation = this.rotation;
            bullet.lifespan = 1200;
            
            bullet.alpha =0;
            this.game.time.events.add(100,function(){
                bullet.alpha = 1;
            }.bind(this));
            bullet.explode = true;
            
            bullet.frame = this.actualBulletFrame;
            var bounce1= this.game.add.tween(this.gun);
            var width = this.gun.width;
            var height = this.gun.height;
            // Animación del cañon
            bounce1.to({width:width*1.2,height: height*1.3 }, 100);
            bounce1.onComplete.add(function(){
               this.gun.width = width;
               this.gun.height = height;

            }.bind(this), this);
            bounce1.start();
            
            
            this.bulletTime = Date.now() + this.curretBulletInterval;
            

        }
    
    }
    
   
};

/* Facilita el acceso al grupo de balas del jugador.
 * 
 * @returns {Phaser.Group}
 */
Player.prototype.getBullets = function(){
    return this.bullets;
};

/* Sirve para almacenar los inputs del jugador local. De modo que luego puedan ser reaplicados al hacer la corrección de cliente y
 * renconciliación con el servidor.
 * 
 * @param {Array} input - Inputs del cliente local(Coordenadas del pointer).
 * @returns {undefined}
 */

Player.prototype.storeClientInput = function(input){
   this.clientInputs.push(input);
};

/* Procesa las actualizaciones del servidor.
 * 
 * @returns {undefined}
 */

Player.prototype.remotePlayerPhysics = function(){
     
    if( this.tweenComplete && this.coorBuffer.length === 0 ){
        this.minFrames = this.INI_FRAMES;
    }
    this.gun.x = this.x ;
    this.gun.y = this.y ;
    this.gun.rotation = this.rotation;      
    // Asegura que haya componentes en el buffer y que no este interpolando
    if( this.coorBuffer.length >= this.minFrames && this.tweenComplete ){
       
        if(this.coorBuffer.length > this.minLen) { // Este factor de tres igual se puede adaptar dependiendo de las ocndiciones de la red???
            this.useInterpolation = false;
            
        }
        else{
            this.useInterpolation = true;
            
        }

        // Si es la primera vez que entra se asignan directamente las coordenadas.
        if(this.minFrames === this.INI_FRAMES){
            this.x = this.coorBuffer[0][this.I_X];
            this.y = this.coorBuffer[0][this.I_Y];
            this.rotation = this.coorBuffer[0][this.I_R];
            this.last_seq = this.coorBuffer[0][this.I_S];
            this.numKills = this.coorBuffer[0][this.I_K];
            this.numBullets = this.coorBuffer[0][this.I_B];
            this.coorBuffer.shift();
            this.minFrames = 1;
                   
            return;
            
        }
              
        // Buscamos el último estado
        this.latestState = this.coorBuffer[0];
        this.coorBuffer.shift();
        // Número de secuencia actual
        this.current_seq = this.latestState[this.I_S];
        // Actualizamos el número de jugadores que ha eliminado
        this.numKills = this.latestState[this.I_K];
        // Factor que nos dice el número de muestras que se ha de interpolar
        this.fps_inter_fact = this.current_seq - this.last_seq + 1;
        // Actualizamos el valor del último número de secuencia procesado
        this.last_seq = this.latestState[this.I_S];
        // Si el factor es mayor de dos, es decir hay mas de un número de secuencia de diferencia se interpola
        if(this.fps_inter_fact > 2 && this.useInterpolation){
            this.tweenData = this.game.getInterpolatedData(
                                                [this.x, parseFloat(this.latestState[this.I_X].toFixed(3))],
                                                [this.y, parseFloat(this.latestState[this.I_Y].toFixed(3))],
                                                [this.rotation, parseFloat(this.latestState[this.I_R].toFixed(3))], this.fps_inter_fact);


            this.tweenData.shift();
            this.tweenComplete = false;
            if(this.latestState[this.I_F])this.fireBullet();
            this.life = this.latestState[this.I_L];
            this.numBullets = this.latestState[this.I_B];
        // Caso contrario se asigna directamente el valor   
        }else if(this.fps_inter_fact ===  2 || !this.useInterpolation){
            this.tweenComplete = true;
            this.x = parseFloat(this.latestState[this.I_X].toFixed(3));
            this.y = parseFloat(this.latestState[this.I_Y].toFixed(3));
            this.rotation = parseFloat(this.latestState[this.I_R].toFixed(3));    
            this.latestState[this.I_F] ? this.fireBullet() : null;
            this.life = this.latestState[this.I_L];
            this.numBullets = this.latestState[this.I_B];
            this.numKills = this.latestState[this.I_K];
        }
            
        
        
        
    }
    
    // Se interpola    
    if(!this.tweenComplete){
        this.interpolate();
    }
        
};

/* Función que realiza la predicción de cliente, corrección de cliente y reconciliación con el servidor.
 * 
 * @returns {undefined}
 */


Player.prototype.localPlayerPhysics = function(){
   
    if(this.game.input.activePointer.worldY === -1 || this.game.input.activePointer.worldX === -1 ||  this.stopClientProcessing) return;
    
    // Mínimo una componente del servidor para poder interpolar.
    this.minFrames = 1;
    
    
    
    // Predicción de cliente
    this.clientPredicction();
        
    if( this.coorBuffer.length >= this.minFrames ){
        // Correción de cliente
        this.clientCorrection();
        // Reconciliación con el servidor        
        this.serverReconciliation();
          
    }
    // Guardamos los inputs del cliente
    this.storeClientInput([this.sequence, this.game.input.activePointer.worldX, this.game.input.activePointer.worldY, this.fired]);
    this.sendInputs();        
    
    this.sequence++;
    
   
    
};

Player.prototype.clientPredicction = function(){
   
    if( this.game.physics.arcade.distanceToPointer(this) < 100 ){      
        this.body.velocity.x = 0;
        this.body.velocity.y = 0;
        this.rotation = parseFloat(this.game.physics.arcade.angleToPointer(this).toFixed(3));
        
    }else{
        var angle = Math.atan2(this.game.input.activePointer.worldY - this.y, this.game.input.activePointer.worldX - this.x);
        var speed = this.currentVelocity;
        this.tempvx = Math.cos(angle.toFixed(3)) * speed;
        this.tempvy = Math.sin(angle.toFixed(3)) * speed;
        var delta = 0.016;
        
        this.rotation = parseFloat((angle.toFixed(3)));
        this.x += parseFloat((this.tempvx * delta).toFixed(3));
        this.y += parseFloat((this.tempvy * delta).toFixed(3));
    }
    this.gun.x = parseFloat(this.x.toFixed(3));
    this.gun.y = parseFloat(this.y.toFixed(3));
    this.gun.rotation = this.rotation;
    if(this.fired)this.fireBullet();
    
};

Player.prototype.clientCorrection = function(){
    
    this.life = this.coorBuffer[0][this.I_L];
    this.numKills = this.coorBuffer[0][this.I_K];
    this.numBullets = this.coorBuffer[0][this.I_B];
    this.game.numBullets.setText('x' + this.numBullets);
    this.game.numKills.setText('x' + this.numKills);

    this.x = parseFloat(this.coorBuffer[0][this.I_X].toFixed(3));
    this.y = parseFloat(this.coorBuffer[0][this.I_Y].toFixed(3));
       
    //if(this.coorBuffer[0][this.I_F]) this.fireBullet(this.coorBuffer[0]);
    
    this.actualSeqNum = this.coorBuffer[0][this.I_S];
    this.last_seq = this.actualSeqNum;
    this.coorBuffer.shift();
    
    
};

Player.prototype.serverReconciliation = function(){
    
   // Reconciliación con el servidor
    for(var i=0; i < this.clientInputs.length; i++){

        if(this.clientInputs[i][0] <= this.actualSeqNum){
            this.clientInputs.splice(i, 1);
            i--;
        }else{

            if(this.game.physics.arcade.distanceToXY(this, this.clientInputs[i][1], this.clientInputs[i][2]) >= 100){

                var angle = Math.atan2(this.clientInputs[i][2] - this.y, this.clientInputs[i][1] - this.x);
                var speed = this.currentVelocity;
                this.tempvx = Math.cos(angle.toFixed(3)) * speed;
                this.tempvy = Math.sin(angle.toFixed(3)) * speed;
                var delta = 0.016;

                this.x += parseFloat((this.tempvx * delta).toFixed(3));
                this.y += parseFloat((this.tempvy * delta).toFixed(3));

            }

        }

    }
};

/**
 * Actualizamos la física de los jugadores dependiendo de si es jugador local o remoto.
 * 
 * @returns {undefined}
 */

Player.prototype.updatePhysics = function(){
    if(this.isLocalPlayer){
        this.localPlayerPhysics();
    }else{
        this.remotePlayerPhysics();
    }
};
