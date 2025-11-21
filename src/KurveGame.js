/**
 *
 * Program:     Kurve
 * Author:      Markus Mächler, marmaechler@gmail.com
 * License:     http://www.gnu.org/licenses/gpl.txt
 * Link:        http://achtungkurve.com
 *
 * Copyright © 2014, 2015 Markus Mächler
 *
 * Kurve is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kurve is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kurve.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

'use strict';

Kurve.Game = {    
    
    runIntervalId:          null,
    fps:                    null,
    intervalTimeOut:        null,
    maxPoints:              null,
        
    keysDown:               {},
    isRunning:              false,
    curves:                 [],
    runningCurves:          {},
    players:                [],
    deathMatch:             false,
    isPaused:               false,
    isRoundStarted:         false,
    playerScoresElement:    null,
    isGameOver:             false,
    CURRENT_FRAME_ID:       0,
    
    init: function() {
        this.fps = Kurve.Config.Game.fps;
        this.intervalTimeOut = Math.round(1000 / this.fps);
        this.playerScoresElement = document.getElementById('player-scores');

        this.Audio.init();
    },
    
    run: function() {
        requestAnimationFrame(this.drawFrame.bind(this));
    },
    
    drawFrame: function() {
        this.CURRENT_FRAME_ID++;

        for (var i in this.runningCurves) {
            for (var j = 0; this.runningCurves[i] && j < this.runningCurves[i].length; ++j) {
                this.runningCurves[i][j].drawNextFrame();
            }
        }
    },
    
    addWindowListeners: function() {
        Kurve.Menu.removeWindowListeners();
        
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));  
    },
    
    onKeyDown: function(event) {
        if (Kurve.Menu.scrollKeys.indexOf(event.key) >= 0) {
            event.preventDefault(); //prevent page scrolling
        }

        if ( event.keyCode === 32 ) {
            this.onSpaceDown();
        }

        // F key (keyCode 70) toggles fullscreen
        if ( event.keyCode === 70 ) {
            if (!document.fullscreenElement) {
                document.body.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }

        this.keysDown[event.keyCode] = true;

        // Send key event to multiplayer server
        if (Kurve.Multiplayer && Kurve.Multiplayer.isMultiplayerMode) {
            Kurve.Multiplayer.sendKeyDown(event.keyCode);
        }
    },

    onKeyUp: function(event) {
        delete this.keysDown[event.keyCode];

        // Send key event to multiplayer server
        if (Kurve.Multiplayer && Kurve.Multiplayer.isMultiplayerMode) {
            Kurve.Multiplayer.sendKeyUp(event.keyCode);
        }
    },
    
    isKeyDown: function(keyCode) {
        return this.keysDown[keyCode] === true;
    },
    
    onSpaceDown: function() {
        if ( this.isGameOver ) return location.reload();
        if ( this.isRunning || this.isPaused ) {
            this.togglePause();
            if (Kurve.Multiplayer && Kurve.Multiplayer.isMultiplayerMode) {
                Kurve.Multiplayer.sendPauseGame();
            }
            return;
        }

        if ( !this.isRoundStarted && !this.deathMatch) {
            if (Kurve.Multiplayer && Kurve.Multiplayer.isMultiplayerMode) {
                Kurve.Multiplayer.sendStartRound();
                Kurve.Lightbox.hide();
            } else {
                this.startNewRound();
            }
            return;
        }

        if ( !this.isRoundStarted && this.deathMatch) return this.startDeathMatch();
    },
    
    togglePause: function() {
        if ( this.isPaused ) {
            this.endPause();
        } else {
            this.doPause();
        }
    },

    doPause: function() {
        if ( this.isPaused ) return;

        this.isPaused = true;
        this.Audio.pauseIn();
        this.stopRun();
        Kurve.Lightbox.show('<h2>Game is paused</h2>');
    },

    endPause: function() {
        if ( !this.isPaused ) return;

        this.isPaused = false;
        this.Audio.pauseOut();
        Kurve.Lightbox.hide();
        this.startRun();
    },
    
    startGame: function() {
        this.maxPoints = (this.curves.length - 1) * 10;

        this.addPlayers();
        this.applyDebugFreezeState();
        this.addWindowListeners();
        this.renderPlayerScores();

        this.startNewRound.bind(this);
    },


    redrawUI: function() {



        // Re-initialize the field and redraw the player scores
        // This is useful when the window is resized between rounds
        if (Kurve.Multiplayer && Kurve.Multiplayer.isMultiplayerMode) {
            // In multiplayer, request new field size from server
           Kurve.Multiplayer.sendScreenSize();
        }
        Kurve.Field.resize();
        Kurve.Field.drawField();
    },
    
    renderPlayerScores: function() {
        var playerHTML  = '';

        this.players.sort(this.playerSorting);
        this.players.forEach(function(player) { playerHTML += player.renderScoreItem() });

        // Add version number at the bottom
        playerHTML += '<div style="text-align: center; margin-top: 20px; font-size: 32px; font-weight: bold; color: #95a5a6;">' + Kurve.Config.version + '</div>';


        this.playerScoresElement.innerHTML = playerHTML;
    },



    applyDebugFreezeState: function() {
        // Apply freeze state from menu checkbox to local player
        if (Kurve.Menu && Kurve.Menu.getDebugFreezeState) {
            var freezeState = Kurve.Menu.getDebugFreezeState();
            this.players.forEach(function(player) {
                if (player.isLocal) {
                    player.setFrozen(freezeState);
                    console.log('Applied debug freeze state to local player:', freezeState);
                }
            });
        }
    },
    
    playerSorting: function(playerA, playerB) {
        return playerB.getPoints() - playerA.getPoints();
    },
    
    addPlayers: function() {
        Kurve.Game.curves.forEach(function(curve) {
            for (var i=0; i<Kurve.Config.Game.initialSuperpowerCount; i++) {
                curve.getPlayer().getSuperpower().incrementCount();
            }

            Kurve.Game.players.push( curve.getPlayer() );
        });
    },
    
    notifyDeath: function(curve) {
        var playerId = curve.getPlayer().getId();
        // Drop this curve.
        if ( this.runningCurves[playerId] === undefined ) return;

        this.runningCurves[playerId].splice(this.runningCurves[playerId].indexOf(curve), 1);

        if ( this.runningCurves[playerId].length === 0 ) {
            // Drop this player.
            delete this.runningCurves[curve.getPlayer().getId()];
            for (var i in this.runningCurves) {
                this.runningCurves[i][0].getPlayer().incrementPoints();
            }
        
            this.renderPlayerScores();

            if ( Object.keys(this.runningCurves).length === 2 ) {
                this.Audio.tension();
            }

            // In multiplayer mode, let the server decide when to end the round
            // In single player mode, end the round locally when only one player remains
            if ( Object.keys(this.runningCurves).length === 1 ) {
                if (!Kurve.Multiplayer || !Kurve.Multiplayer.isMultiplayerMode) {
                    this.terminateRound();
                }
            }
        }
    },
    
    startNewRound: function() {
        this.isRoundStarted = true;
        this.CURRENT_FRAME_ID = 0;

        Kurve.Field.clearFieldContent();
        this.initRun();
        this.renderPlayerScores();

        setTimeout(this.startRun.bind(this), Kurve.Config.Game.startDelay);
        this.Audio.startNewRound();
    },
    
    startRun: function() {
        this.isRunning = true;
        this.runIntervalId = setInterval(this.run.bind(this), this.intervalTimeOut);
    },
    
    stopRun: function() {
        this.isRunning = false;
        clearInterval(this.runIntervalId);
    },
    
    initRun: function() {
        this.curves.forEach(function(curve) {
            Kurve.Game.runningCurves[curve.getPlayer().getId()] = [curve];
            
            curve.setPosition(Kurve.Field.getRandomPosition().getPosX(), Kurve.Field.getRandomPosition().getPosY());
            curve.setRandomAngle();
            curve.getPlayer().getSuperpower().init(curve);
            curve.drawCurrentPosition(Kurve.Field);
        });
    },
    
    terminateRound: function() {
        this.curves.forEach(function(curve) {
            curve.getPlayer().getSuperpower().close(curve);
        });

        if ( this.deathMatch ) {
            var curve = this.runningCurves[Object.keys(this.runningCurves)[0]][0];
            this.gameOver(curve.getPlayer());
        }

        this.isRoundStarted = false;
        this.stopRun();
        this.runningCurves  = {};
        this.incrementSuperpowers();
        this.Audio.terminateRound();

        // Handle field resizing between rounds
        if (!Kurve.Multiplayer || !Kurve.Multiplayer.isMultiplayerMode) {
            // Local mode: resize field to current window size
            Kurve.Field.resize();
        } else {
            // Multiplayer mode: send current screen size to server
            // This allows field to adjust if players resized their windows during the round
            Kurve.Multiplayer.sendScreenSize();
        }

        this.checkForWinner();
    },

    incrementSuperpowers: function() {
        var numberOfPlayers = this.players.length;

        if (numberOfPlayers === 2) {
            this.players[0].getSuperpower().incrementCount();
            this.players[1].getSuperpower().incrementCount();
        } else {
            for (var i in this.players) {
                if (parseInt(i) === 0) continue; // skip the leader

                this.players[i].getSuperpower().incrementCount();
            }

            // extra superpower for the loser
            this.players[numberOfPlayers - 1].getSuperpower().incrementCount();
        }
    },
    
    checkForWinner: function() {
        if ( this.deathMatch ) return;

        var winners = [];
        
        this.players.forEach(function(player) {
            if (player.getPoints() >= Kurve.Game.maxPoints) winners.push(player);
        });
        
        if (winners.length === 0) return;
        if (winners.length === 1) this.gameOver(winners[0]);
        if (winners.length  >  1) this.initDeathMatch(winners);
    },

    initDeathMatch: function(winners) {
        this.deathMatch = true;
        this.Audio.initDeathMatch();
        Kurve.Lightbox.show('<div class="deathmatch"><h1>DEATHMATCH!</h1></div>');

        var winnerCurves = [];
        this.curves.forEach(function(curve) {
            winners.forEach(function(player){
                if (curve.getPlayer() === player) {
                    winnerCurves.push(curve);
                    player.setColor(Kurve.Theming.getThemedValue('field', 'deathMatchColor'));
                }
            });
        });

        this.curves = winnerCurves;
    },
    
    startDeathMatch: function(winners) {
        Kurve.Lightbox.hide();
        this.startNewRound();
    },
    
    gameOver: function(winner) {
        this.isGameOver = true;

        this.Audio.gameOver();

        Kurve.Lightbox.show(
            '<h1 class="active ' + winner.getId() + '">' + winner.getId() + ' wins!</h1>' +
            '<a href="#" onclick="Kurve.reload(); return false;" title="Go back to the menu"  class="button">Start new game</a>'
        );
    },

    Audio: {
        stemLevel: 1,
        audioPlayer: null,
        defaultFadeTime: 1000,

        init: function() {
            this.audioPlayer = Kurve.Sound.getAudioPlayer();
        },

        startNewRound: function() {
            var startIn1Delay = Kurve.Config.Game.startDelay / 3;
            var startIn2Delay = 2 * startIn1Delay;
            var startOutDelay = 3 * startIn1Delay;

            setTimeout(this.audioPlayer.play.bind(this.audioPlayer, 'game-start-in', {reset: true}), startIn1Delay);
            setTimeout(this.audioPlayer.play.bind(this.audioPlayer, 'game-start-in', {reset: true}), startIn2Delay);
            setTimeout(function() {
                this.audioPlayer.play('game-start-out', {reset: true});
                this.setAllCurvesMuted('all', false);

                if ( Kurve.Game.deathMatch ) {
                    this.stemLevel = 3;
                    this.audioPlayer.play('game-music-stem-1', {fade: this.defaultFadeTime, volume: 1, background: true, loop: true, reset: true});
                    this.audioPlayer.play('game-music-stem-4', {fade: this.defaultFadeTime, volume: 1, background: true, loop: true, reset: true});
                } else {
                    this.stemLevel = 1;
                    this.audioPlayer.play('game-music-stem-1', {fade: this.defaultFadeTime, volume: 1, background: true, loop: true, reset: true});
                    this.audioPlayer.play('game-music-stem-2', {fade: this.defaultFadeTime, volume: 0, background: true, loop: true, reset: true});
                    this.audioPlayer.play('game-music-stem-3', {fade: this.defaultFadeTime, volume: 0, background: true, loop: true, reset: true});
                }
            }.bind(this), startOutDelay);
        },

        terminateRound: function() {
            this.pauseAllCurves('all', {reset: true});
            this.audioPlayer.pause('game-music-stem-1', {fade: this.defaultFadeTime, reset: true});
            this.audioPlayer.pause('game-music-stem-2', {fade: this.defaultFadeTime, reset: true});
            this.audioPlayer.pause('game-music-stem-3', {fade: this.defaultFadeTime, reset: true});
            this.audioPlayer.pause('game-music-stem-4', {fade: this.defaultFadeTime, reset: true});
            this.audioPlayer.play('game-end');
        },

        pauseIn: function() {
            this.audioPlayer.play('game-pause-in');
            this.setAllCurvesMuted('all', true);
            this.audioPlayer.setVolume('game-music-stem-1', {volume: 0.25, fade: this.defaultFadeTime});

            if (this.stemLevel > 1) {
                this.audioPlayer.setVolume('game-music-stem-2', {volume: 0, fade: this.defaultFadeTime});
            }

            if (this.stemLevel > 2) {
                this.audioPlayer.setVolume('game-music-stem-3', {volume: 0, fade: this.defaultFadeTime});
            }

            if (Kurve.Game.deathMatch) {
                this.audioPlayer.setVolume('game-music-stem-4', {volume: 0, fade: this.defaultFadeTime});
            }
        },

        pauseOut: function() {
            this.audioPlayer.play('game-pause-out');
            this.setAllCurvesMuted('all', false);
            this.audioPlayer.setVolume('game-music-stem-1', {volume: 1, fade: this.defaultFadeTime});

            if (this.stemLevel > 1) {
                this.audioPlayer.setVolume('game-music-stem-2', {volume: 0.5, fade: this.defaultFadeTime});
            }

            if (this.stemLevel > 2) {
                this.audioPlayer.setVolume('game-music-stem-3', {volume: 0.3, fade: this.defaultFadeTime});
            }

            if (Kurve.Game.deathMatch) {
                this.audioPlayer.setVolume('game-music-stem-4', {volume: 1, fade: this.defaultFadeTime});
            }
        },

        tension: function() {
            if (Kurve.Game.deathMatch) {
                return;
            }

            this.stemLevel = 3;
            this.audioPlayer.setVolume('game-music-stem-2', {volume: 0.5, fade: this.defaultFadeTime});
            this.audioPlayer.setVolume('game-music-stem-3', {volume: 0.3, fade: this.defaultFadeTime});
        },

        initDeathMatch: function() {
            this.audioPlayer.play('game-deathmatch');
        },

        gameOver: function() {
            this.audioPlayer.pause('all');
            this.audioPlayer.play('game-victory');
        },

        setAllCurvesMuted: function(soundKey, muted) {
            Kurve.Game.curves.forEach(function(curve) {
                curve.setMuted(soundKey, muted);
            });
        },

        pauseAllCurves: function(soundKey, options) {
            Kurve.Game.curves.forEach(function(curve) {
                curve.pause(soundKey, options);
            });
        }
    }
};
