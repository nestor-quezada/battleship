/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

"use strict";
var Game = require('./game-core/server_game').Game;
var server = require('http').createServer(), 
    url = require('url'),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ server: server }),
    express = require('express'),
    app = express(),
    uuid = require('node-uuid');

var Server = function(){
    this.games = [];
    this.clientInfo = [];
};

/* Variables juego */

Server.prototype.roomId = 1;
Server.prototype.debug = true;
Server.prototype.publicId = 1;
Server.prototype.gameNames = ['Against All'];


/* Variables servidor */

Server.prototype.mIP = "";
Server.prototype.mPort = "8000";

/* Configuramos el servidor */

Server.prototype.setupServer = function(){
    this.l = 0;
    app.get('/', function(req, res){
        res.sendFile(__dirname + '/public/views/index.html');
    });
    
    // Enrutamiento de recursos
    app.use('/js',     express.static(__dirname + '/public/dist'));
    app.use('/assets', express.static(__dirname + '/public/assets'));
    app.use('/static', express.static(__dirname + '/public'));
    app.use('/vendors',express.static(__dirname + '/public/vendors'));
    app.use('/styles', express.static(__dirname + '/public/styles'));
    

    app.get('/games/available', function(req, res){
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(this.getGamesInfo(), null, 0));
    });
      
    // Si no existe el recurso se redirecciona a la página principal
    app.get('*', function(req, res){
      res.redirect('/');
    });
        
    app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 8000);
    app.set('ip', process.env.OPENSHIFT_NODEJS_IP || '' );

    app.get('/', function(req, res){
        res.sendFile(__dirname + '/public/views/test.html');
    });

    app.use('/vendors',express.static(__dirname + '/public/vendors'));

    wss.on('connection', this.onClientConnection.bind(this));
    
    server.on('request', app);
    server.listen(app.get("port"),app.get("ip"), function () { console.log('Listening on ' + server.address().port) });
    
};

Server.prototype.initGames = function(){
   
    this.games[ this.roomId ] = new Game( { name: this.gameNames[0], room: this.roomId, wss: wss } );
    this.roomId++;
    
};

/* Event handlers */

Server.prototype.onClientConnection = function (socket){
    
    var self = this;
    socket.id = uuid.v4();
      
    socket.on('message', function (message) {
      
               
        var decodedData = self.decodeData(message);
        var decodedMessage, type;
        
        decodedMessage = decodedData.data;
        type = decodedData.type;
        
        switch(type){
           
            case EventCode.JOIN_GAME:
                self.onJoinGame(decodedMessage, socket);
            break;
            case EventCode.UPDATE_PLAYER:
                self.onUpdatePlayer(decodedMessage, socket);
            break;
            case EventCode.CHAT_MESSAGE:
                self.onChatMessage(decodedMessage, socket);
            break;
            case EventCode.PING:
                self.onPing(decodedMessage, socket);
            break;
            
                        
        }
        
       
    });
    
    socket.on('close', self.onClientDisconnect.bind(this, socket));
    
};

Server.prototype.decodeData = function(data){
    var decodedMessage, type;
    if(data instanceof Buffer){
        decodedMessage = new Uint8Array(data);
        type = decodedMessage[0];
            
        return {type: type, data: decodedMessage};
    }else if(typeof(data) === 'string'){
        var message;
             
        try {
            message = JSON.parse(data);
            decodedMessage = message.d;
            type = message.t;
            if(typeof(type) === 'number' && decodedMessage)
            {
                return {type: type, data: decodedMessage};
            
            }else{
                
                return false;
            
            }
        } catch (e) {
            return false;
        }
        
    }else{
        return false;
    }
              
        
        
};

Server.prototype.onPing = function(data, socket){
    
    var timestamp;
       
    timestamp = data;
   
    socket.send(JSON.stringify({t:EventCode.PING, d: data}));
       
};

Server.prototype.onChatMessage = function(data, socket){
    if(!this.clientInfo[socket.id])return;
    
    var publicId = this.clientInfo[socket.id].publicId;
    
    if(!publicId) return;
    var id, message;
    
    id= data.id;
    message = data.m;
    
    if(typeof(id) !== 'number' && typeof(message) !== 'string') return;
    // Limpia informacion del cliente
    var message = message.replace(/[^A-Za-z 0-9].*/g, '');
        
    wss.clients.forEach(function (client) {
        if(client.readyState === 1)client.send(JSON.stringify({t:EventCode.CHAT_MESSAGE, d: {id: id, m: message}}));
    });
    
};

 
Server.prototype.onJoinGame = function ( clientData, socket){
    var self = this; // Referencia a Server 
    var game = this.games [1];
       
    // Falta validar la información aportada por el cliente(nickname).
    var id = self.publicId;
    var initialStatus;
    var nickname = clientData.nickname;
    var newPlayer;                                 

    // Almacenamos la información del cliente (claves)
    self.clientInfo [ socket.id ] = { room : 1 , publicId : id };
    newPlayer = game.addPlayer( nickname, id, socket );
    initialStatus = game.info();
    
    // Iniciamos el loop del juego solo si es la primera vez que se une un jugador
    if(game.players.length === 1) game.start();
    
    socket.gameJoined = true;
    // Enviamos el status actual del juego al cliente
    socket.send(JSON.stringify({ t:EventCode.INI_STATUS, d:{ is:initialStatus, id:id}}));
    //socket.to(room).emit('new player joined', { player: newPlayer.status() });
    // Informamos al resto de clientes que se ha unido un nuevo jugador
    wss.clients.forEach(function (client) {
        if( client.id !== socket.id && client.readyState === 1  ) client.send(JSON.stringify({ t: EventCode.NEW_PLAYER, d:{ player:newPlayer.status()}}));
    });

    self.publicId++;


};       
        
Server.prototype.onUpdatePlayer = function(data, socket){
    
    var room = this.clientInfo[socket.id].room;
      
    var publicId = data[1];
    // Verifica que los datos provengan del cliente autorizado 
    if(this.clientInfo[socket.id].publicId !== publicId ) return;
    var game = this.games[room];
    if(!game.started) return null;
    // Jugador que se ha de  actualizar 
    var player = game.players.getById( publicId, 'id' );
    if(!player)return;
    // Guardamos los inputs para poder actualizar el sevidor
    player.addInputs(data);
     
};

Server.prototype.onClientDisconnect = function(socket){
    console.log('client leaving without playing');
    if(this.clientInfo[socket.id] === undefined) return null;
    var room = this.clientInfo[socket.id].room;
    var publicId = this.clientInfo[socket.id].publicId;
    
    var game = this.games[room];
    // Jugador que se ha de  borrar
    game.players.remById( publicId, 'id' );
    // En caso de que ya no haya jugadores en la partida paramos el juego
    if(!game.players.length){
        game.stop();
        console.log('Game stopped');
    } 
       
    console.log("client with id: " + socket.id + " has leaved the room: " + room );
    //limpiar el array client data
};
 
Server.prototype.getGamesInfo  = function (){
    var gamesInfo = [];
    this.games.forEach(function(el){
       gamesInfo.push(el.info());       
    });
     
    return gamesInfo;  
 };
 
 Server.prototype.run = function(){
    this.setupServer();
    this.initGames(); 
 };
 
 var gameServer = new Server();
     gameServer.run();
  
     
Array.prototype.getById = function(key, prop){
    for (var i=0; i < this.length; i++) {
        if (this[i][prop] === key) {
            return this[i];
        }
    }
};

Array.prototype.remById = function(key, prop){
    for (var i=0; i < this.length; i++) {
        if (this[i][prop] === key) {
            this[i].kill('b');
            return null;
        }
    }
};

var EventCode = {
    
    PING : 0,
    JOIN_GAME      : 1,
    UPDATE_GAME    : 2,
    CHAT_MESSAGE   : 3,
    UPDATE_GAMES_LIST : 4,
    NEW_PLAYER     : 5,
    INI_STATUS     : 6,
    PLAYER_LEFT    : 7,
    GAME_OVER_WHIRLWIND : 8,
    UPDATE_PLAYER  : 9,
    LEADERBOARD    : 10,
    COINS          : 11,
    GAME_OVER_BULLET : 12
    
    
   
};