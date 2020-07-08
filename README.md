## Synopsis
Juego multijugador en tiempo real. Desarrollado empleando los frameworks [ws] y [Node.js] para la comunicación. El desarrollo gráfico se realiza con el framework [Phaser.IO]. Para el manejo de los datos de usuario y diseño general empleo [Angular] y [Angular Material].

Se puede acceder al juego en la siguiente URL:http://battleship-neqc.rhcloud.com/

## Motivation

Trabajo Fin de Grado.

## Installation

Para poder ejecutar la aplicación es necesario tener instalado Node.JS ,descargarse el código y ejecutar el comando : $ node server.js , donde server.js es el fichero que se encuentra en el directorio principal de este proyecto.

#API

El fichero más importante es server.js que es el configura el servidor HTTP y de Webscokets. La parte del núcleo del juego en el serevidor esta en las carpetas que empiezan por game_xxx y la parte cliente esta dentro de la carpeta public.

## License

MIT License

Copyright (c) 2016 Néstor Eduardo Quezada Castillo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [Node.js]: <https://nodejs.org/en/>
   [ws]:<https://github.com/websockets/ws>
   [Phaser.IO]:<http://phaser.io/>
   [Angular]:<https://angular.io/>
   [Angular Material]:<https://material.angularjs.org/latest/>