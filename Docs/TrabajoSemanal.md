# Descripción avances 
### Semana 1
- Entender la problemática de los juegos en tiempo real.
- Investigación sobre el estado del arte de WebSockets.
- Investigación sobre los diversos frameworks que usan el protocolo de websockets.
- Investigación de los frameworks elegidos ([Socket.IO], [Node.JS]).

### Semana 2
- Entender el funcionamiento del framework [Angular] e implementar una página de inicio con este.
- Entender el funcionamiento del framework [Angular Material] y utilizarla para el diseño de la página de inicio
- Entender el funcionamiento del framework [Phaser.IO] y desarrollar un mini-juego de prueba.
- Ordenar el código y separarlo en diferentes módulos.
- Depurar los errores que puedan surgir al utilizar en conjunto los diferentes frameworks.

##Semana 3
- Implementada la opción de crear partida.
- Implementada la opción unirte a una partida existente(El número de usuarios que se puede unir no está limitado).
- Implementada comunicación básica entre los diferentes dispositivos y el servidor para transmitir la posición de los diferentes jugadores
entre si.
- Añadidos gestos táctites para poder controlar con dispositivos móviles el jugador.

##Semana 4
- Añadida ventana de login
- Creadas imagenes con photoshop para utilizar en el juego (prueba)
- Implementado control para moviles y pcs (prueba)
- Test de el retardo de las comunicaciones (Se ha probado a compensarlo mediante buffers)
- Se ha tratado de hacer el canvas adaptativo. A la hora de dibujarlo se tienen en cuenta las dimensiones del dispositivo.
- También se tiene en cuenta si se trata de un dispositivo táctil o no para dibujar elementos extra como botones.
- Se puede decrementar la vida de los contrarios.

##Semana 5
- Ahora se actualiza los nombres de usurio en el resto de clientes.
- Cambiadas algunas imagenes(botones,jugadore,etc).
- Mejorado control del juego en dispositivos táctiles.
- Añadido otro buffer en el cliente, con este se trata de mostrar en el cliente un poco más tarde las acciones que realiza(caminar,disparar) para asi tratar de compensar el tiempo que tarda en llegar el broadcast de sus acciones al resto de clientes.

##Semana 6 y 7
- Se ha reorganizado el código en diferentes clases
- Se ha cambiado la arquitectura de comunicación, ahora el servidor es el autoritativo y ejecuta la lógica básica del juego. 
- El servidor envía actualizaciones cada cierto tiempo.
- El usuario envía las ordenes las procesa y hace broadcast de estas, con lo que se evita que los jugadores puedan hacer trampas.
- Se ha implementado la interpolación de los otros clientes, ya que el servidor envia actualizaciones que son las posiciones pero muestreadas en el tiempo.
- En el cliente aparte de realizar la interpolación se realiza la predicción del cliente. Esto es ejecutar la misma lógica que corre el servidor pero añadiendole los efectos gráficos.
- Por otro lado también se ha añadido un joystick en los dispositivos móviles.
- También se ha eliminado la opción de crear partida ya que la gracia del juego esque haya varios jugadores en al misma partida.

##Semana 1 Abril hasta 10 Mayo
- Implementada la corrección de cliente y reconciliación con el servidor
- Ahora el jugador puede subir de nivel (tres niveles)
- Cambiada la comunicación a binaria, y con esto se ha cambiado la libreria de websockets en el servidor
- Simplificada la pantalla inicial de la página
- Añadidas monedas para que el jugador pueda tener una característica especial(escudo) durante un cierto tiempo
- Se ha optado por incluir un QuadTree para reducir el numero de comprobaciones de colisiones en el servidor
- En el cliente ahora se usa la api nativa de websockets que implemente el navegador
- Se ha actualizado la version de node del servidor a la última disponible en openshift 5.1
- Se ha implementado un sencillo sistema de chat
- Se ha implementado un tabla de posiciones(mayor número de muertes)

##11 Mayo hasta 25  Mayo
- Corregida comunicación con el servidor.
- Mejorados algunos aspectos gráficos.
- Arreglados algunos fallos.
- Comentado código cliente.
- Se han cambiado las dimensiones del mundo del juego.
- Corregidos problemas con la interpolación.
- Corregidos problemas con el movimiento del jugador local(vibración).
- Cambiadas la fuente de texto del juego.
- Arreglados problemas con el fullscreen en dispositivos móviles.
- Reducido tamaño de assets para mejorar la carga de la página.
- Añadidos emitters al sprite del jugador para simular movimiento del agua.

## Hasta el 7 de Junio
- Corregidos problemas de lag.
- Añadidos barcos enemigos.
- Algunas optimizaciones en la ejecución del código.
- Añadidos nuevos mensajes binarios para poder comunicar el estado de los barcos enemigos.
- Cambiada la detección de colisiones del servidor a una más precisa(SAT) que tiene en cuenta la rotación de la entidad.
 

 

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [Node.js]:<https://nodejs.org/en/>
   [Socket.IO]:<http://socket.io/>
   [Phaser.IO]:<http://phaser.io/>
   [Angular]:<https://angular.io/>
   [Angular Material]:<https://material.angularjs.org/latest/>
