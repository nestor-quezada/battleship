/**
* @author   Néstor Quezada Castillo <neqc2015@gmail.com>
*  
*/

/* 
*  Clase que facilita el acceder a los diferentes códigos de eventos.
*  
* 
* @class EventCode
* @constructor
* 
*  
*/ 

var EventCode = {
    
    PING              : 0 ,
    JOIN_GAME         : 1 ,
    UPDATE_GAME       : 2 ,
    CHAT_MESSAGE      : 3 ,
    UPDATE_GAMES_LIST : 4 ,
    NEW_PLAYER        : 5 ,
    INI_STATUS        : 6 ,
    PLAYER_LEFT       : 7 ,
    GAME_OVER         : 8 ,
    UPDATE_PLAYER     : 9 ,
    LEADERBOARD       : 10,
    COINS             : 11
    
};

/* 
*  Clase que facilita la decodificación de la información binaria.
*  
* 
* @class Entity
* @constructor
* 
*  
*/
 
var Entity = {
    
    Player : { 
        
                TYPE: 0,
                
                TypeOfMessage:{
                    
                    Update: { CODE : 0, LEN: 21 },
                    
                    Kill  : { CODE : 1, LEN: 1  }
                    
                },
                      
                LEN : 21
             },
             
    Enemy  : { 
                TYPE: 4,
                
                TypeOfMessage:{
                    
                    Update: { CODE : 0, LEN: 13 },
                                       
                    Kill  : { CODE : 1, LEN: 1  },
                    
                    Create: { CODE : 2, LEN: 1  }
                    
                    
                    
                }
            }
    
};
