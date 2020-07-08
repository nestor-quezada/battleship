 /* 
 * @author   Néstor Quezada Castillo <neqc2015@gmail.com>
 * 
 * Declaración del módulo de la aplicación y sus dependencias
 */
"use strict";

angular.module('BattleShip',['ngMaterial','AppCtrls','ngRoute'])
    .config(['$mdIconProvider', '$mdThemingProvider', '$routeProvider',function($mdIconProvider, $mdThemingProvider, $routeProvider) {
        var rootURL = "assets/icons/";

        $mdThemingProvider.theme('altTheme')
                        .primaryPalette('blue')
                        .accentPalette('red');    
        $mdIconProvider
                        //.defaultIconSet(rootURL + "assets/svg/avatars.svg", 128)
                        .icon("settings", rootURL + "settings.svg", 24)
                        .icon("game", rootURL + "game-icon.svg", 32)
                        .icon("menu", rootURL + "menu.svg", 24)
                        .icon("team", rootURL + "team.svg", 24);
        $routeProvider.
            when('/', {
                templateUrl: 'static/partials/landing.html',
                controller: 'AppCtrl'
            }).
            when('/game', {
                templateUrl: 'static/partials/game.html',
                controller: 'GameCtrl'
            }).
            otherwise({
                redirectTo: '/'
            });


    }]);

