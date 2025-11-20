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

Kurve.Multiplayer = {
    client: null,
    room: null,
    isMultiplayerMode: false,
    sessionId: null,
    serverUrl: 'ws://localhost:2568',
    remotePlayers: {},
    keysDown: {},

    init: function() {
        // Initialize Colyseus client when entering multiplayer mode
        this.client = new Colyseus.Client(this.serverUrl);
    },

    async joinGame() {
        try {
            // Clear any existing game state
            Kurve.Game.curves = [];
            Kurve.Game.players = [];
            Kurve.Game.runningCurves = {};
            this.remotePlayers = {};

            const nickname = Kurve.Menu.getPlayerNickname();

            // Try to reconnect with stored token first
            const reconnectionToken = localStorage.getItem('kurve_reconnection_token');

            if (reconnectionToken) {
                try {
                    console.log('Attempting to reconnect with token...');
                    this.room = await this.client.reconnect(reconnectionToken);
                    console.log('Reconnected successfully!');
                } catch (reconnectError) {
                    console.log('Reconnection failed, joining new room...');
                    localStorage.removeItem('kurve_reconnection_token');
                    this.room = await this.client.joinOrCreate('kurve', { nickname: nickname });
                }
            } else {
                this.room = await this.client.joinOrCreate('kurve', { nickname: nickname });
            }

            this.sessionId = this.room.sessionId;

            // Store reconnection token for future refreshes
            localStorage.setItem('kurve_reconnection_token', this.room.reconnectionToken);

            console.log('Joined room:', this.room.id);
            console.log('Session ID:', this.sessionId);
            console.log('Nickname:', nickname);

            this.setupRoomListeners();
            this.isMultiplayerMode = true;

            return true;
        } catch (e) {
            console.error('Failed to join game:', e);
            alert('Could not connect to server. Make sure the server is running on ' + this.serverUrl);
            return false;
        }
    },

    setupRoomListeners: function() {
        // Listen to state changes
        this.room.state.players.onAdd((player, sessionId) => {
            console.log('Player added:', player.nickname, '(' + sessionId + ')', 'Color:', player.color, 'ID:', player.id);

            if (sessionId !== this.sessionId) {
                // Create remote player curve
                this.createRemotePlayer(player, sessionId);

                // Listen to this remote player's property changes
                player.onChange(() => {
                    if (this.remotePlayers[sessionId]) {
                        this.updateRemotePlayer(player, sessionId);
                        // Update points if they changed
                        if (this.remotePlayers[sessionId].player.getPoints() !== player.points) {
                            this.remotePlayers[sessionId].player.setPoints(player.points);
                            Kurve.Game.renderPlayerScores();
                        }
                    }
                });
            } else {
                // This is the local player
                this.setupLocalPlayer(player);

                // Listen to local player state changes
                player.onChange(() => {
                    this.localPlayerState = player;
                    // Update points if they changed
                    const localPlayer = Kurve.Game.players.find(p => p.isLocal);
                    if (localPlayer && localPlayer.getPoints() !== player.points) {
                        localPlayer.setPoints(player.points);
                        Kurve.Game.renderPlayerScores();
                    }
                });
            }

            // Update waiting message with player count
            this.updateWaitingMessage();
        });

        this.room.state.players.onRemove((player, sessionId) => {
            console.log('Player removed:', player.id, sessionId);

            // Remove from remotePlayers
            if (this.remotePlayers[sessionId]) {
                const remote = this.remotePlayers[sessionId];

                // Remove from game arrays
                const playerIndex = Kurve.Game.players.indexOf(remote.player);
                if (playerIndex > -1) {
                    Kurve.Game.players.splice(playerIndex, 1);
                }

                const curveIndex = Kurve.Game.curves.indexOf(remote.curve);
                if (curveIndex > -1) {
                    Kurve.Game.curves.splice(curveIndex, 1);
                }

                delete this.remotePlayers[sessionId];
            }

            // Also check if it's the local player
            if (sessionId === this.sessionId) {
                const playerIndex = Kurve.Game.players.findIndex(p => p.getId() === sessionId);
                if (playerIndex > -1) {
                    Kurve.Game.players.splice(playerIndex, 1);
                }

                const curveIndex = Kurve.Game.curves.findIndex(c => c.getPlayer().getId() === sessionId);
                if (curveIndex > -1) {
                    Kurve.Game.curves.splice(curveIndex, 1);
                }
            }
        });

        this.room.state.onChange(() => {
            // Update game state
            if (this.room.state.isRunning !== Kurve.Game.isRunning) {
                Kurve.Game.isRunning = this.room.state.isRunning;
            }

            if (this.room.state.isGameOver && !Kurve.Game.isGameOver) {
                const winner = Array.from(this.room.state.players.values()).find(
                    p => p.id === this.room.state.winnerId
                );
                if (winner) {
                    Kurve.Game.gameOver(this.getLocalPlayerForRemote(winner));
                }
            }
        });

        // Listen to key events from other players
        this.room.onMessage('playerKeyDown', (message) => {
            if (this.remotePlayers[message.playerId]) {
                this.remotePlayers[message.playerId].keysDown[message.keyCode] = true;
            }
        });

        this.room.onMessage('playerKeyUp', (message) => {
            if (this.remotePlayers[message.playerId]) {
                delete this.remotePlayers[message.playerId].keysDown[message.keyCode];
            }
        });

        this.room.onMessage('countdown', (message) => {
            // Find local player
            const localPlayer = Kurve.Game.players.find(p => p.isLocal);

            console.log('Countdown - players:', Kurve.Game.players.length);
            console.log('Local player found:', localPlayer);

            let content = '<h1 style="font-size: 120px;">' + message.count + '</h1>';

            if (localPlayer) {
                console.log('Building player info display');
                const playerColor = localPlayer.getColor();
                const nickname = localPlayer.nickname || localPlayer.getId();

                // Get key names
                const leftKey = localPlayer.getKeyName(localPlayer.getKeyLeft());
                const rightKey = localPlayer.getKeyName(localPlayer.getKeyRight());
                const superpowerKey = localPlayer.getKeyName(localPlayer.getKeySuperpower());

                console.log('Player info:', { playerColor, nickname, leftKey, rightKey, superpowerKey });

                content += '<div style="margin-top: 40px; font-size: 24px;">';
                content += '<div style="margin-bottom: 20px;">';
                content += '<span style="display: inline-block; width: 30px; height: 30px; background-color: ' + playerColor + '; margin-right: 10px; vertical-align: middle; border: 2px solid #fff;"></span>';
                content += '<span style="font-weight: bold;">' + nickname + '</span>';
                content += '</div>';
                content += '<div style="font-size: 20px;">';
                content += '<span style="margin-right: 20px;">← ' + leftKey + '</span>';
                content += '<span style="margin-right: 20px;">→ ' + rightKey + '</span>';
                content += '<span>⚡ ' + superpowerKey + '</span>';
                content += '</div>';
                content += '</div>';
            } else {
                console.log('No local player found!');
            }

            Kurve.Lightbox.show(content);
        });

        this.room.onMessage('roundStarted', () => {
            Kurve.Lightbox.hide();
            if (!Kurve.Game.isRoundStarted) {
                // Don't call startNewRound() - initialize with server positions instead
                Kurve.Game.isRoundStarted = true;
                Kurve.Game.CURRENT_FRAME_ID = 0;
                Kurve.Field.clearFieldContent();

                // Initialize all curves with server-provided positions
                Kurve.Game.curves.forEach((curve) => {
                    const playerId = curve.getPlayer().getId();
                    Kurve.Game.runningCurves[playerId] = [curve];

                    // Get position from server state
                    let serverState = null;
                    if (this.localPlayerCurve === curve && this.localPlayerState) {
                        serverState = this.localPlayerState;
                    } else {
                        // Find in remote players
                        for (const sessionId in this.remotePlayers) {
                            if (this.remotePlayers[sessionId].curve === curve) {
                                serverState = this.remotePlayers[sessionId].playerState;
                                break;
                            }
                        }
                    }

                    if (serverState) {
                        curve.setPosition(serverState.positionX, serverState.positionY);
                        curve.setAngle(serverState.angle);
                    }

                    curve.getPlayer().getSuperpower().init(curve);
                    curve.drawCurrentPosition(Kurve.Field);
                });

                Kurve.Game.renderPlayerScores();
                setTimeout(() => {
                    Kurve.Game.startRun();
                }, Kurve.Config.Game.startDelay);
                Kurve.Game.Audio.startNewRound();
            }
        });

        this.room.onMessage('roundEnded', (message) => {
            Kurve.Game.terminateRound();

            // Show round winner and "Press SPACE to start next round" message
            setTimeout(() => {
                let content = '<h2>Round Over!</h2>';

                // Find and display the round winner
                if (message.roundWinnerId) {
                    const roundWinner = Array.from(this.room.state.players.values()).find(
                        p => p.id === message.roundWinnerId
                    );

                    if (roundWinner) {
                        const winnerPlayer = this.getLocalPlayerForRemote(roundWinner);

                        if (winnerPlayer) {
                            const winnerName = winnerPlayer.nickname || winnerPlayer.getId();
                            const winnerColor = winnerPlayer.getColor();

                            content += '<div style="margin: 20px 0;">';
                            content += '<span style="display: inline-block; width: 30px; height: 30px; background-color: ' + winnerColor + '; margin-right: 10px; vertical-align: middle; border: 2px solid #fff;"></span>';
                            content += '<span style="font-size: 24px; font-weight: bold;">' + winnerName + ' wins this round!</span>';
                            content += '</div>';
                        }
                    }
                }

                content += '<p style="margin-top: 20px; font-size: 20px;">Press <strong>SPACE</strong> to start next round</p>';
                Kurve.Lightbox.show(content);
            }, 1000);
        });

        this.room.onMessage('gameOver', (message) => {
            const winner = Array.from(this.room.state.players.values()).find(
                p => p.id === message.winnerId
            );
            if (winner) {
                const winnerPlayer = this.getLocalPlayerForRemote(winner);
                Kurve.Game.gameOver(winnerPlayer);

                // Show winner announcement with option to start new game
                setTimeout(() => {
                    const winnerName = winnerPlayer.nickname || winnerPlayer.getId();
                    const winnerColor = winnerPlayer.getColor();

                    let content = '<h1 style="font-size: 60px; margin-bottom: 30px;">🏆 Game Over! 🏆</h1>';
                    content += '<div style="margin: 30px 0;">';
                    content += '<span style="display: inline-block; width: 40px; height: 40px; background-color: ' + winnerColor + '; margin-right: 15px; vertical-align: middle; border: 3px solid #fff;"></span>';
                    content += '<span style="font-size: 36px; font-weight: bold;">' + winnerName + ' Wins!</span>';
                    content += '</div>';
                    content += '<p style="margin-top: 40px; font-size: 22px;">Press <strong>SPACE</strong> to play again</p>';

                    Kurve.Lightbox.show(content);
                }, 1500);
            }
        });

        this.room.onMessage('startError', (message) => {
            alert(message.message);
        });
    },

    updateWaitingMessage: function() {
        if (!this.room) return;

        const playerCount = this.room.state.players.size;
        let message = '<h2>Waiting for players...</h2>';
        message += '<p>Players connected: ' + playerCount + '/6</p>';

        if (playerCount >= 2) {
            message += '<p><strong>Press SPACE to start the game!</strong></p>';
        } else {
            message += '<p>Need at least 2 players to start</p>';
        }

        Kurve.Lightbox.show(message);
    },

    createRemotePlayer: function(playerState, sessionId) {
        // Use sessionId as unique identifier
        const localPlayer = new Kurve.Player(
            sessionId,
            playerState.keyLeft,
            playerState.keyRight,
            playerState.keySuperpower
        );
        localPlayer.setColor(playerState.color);
        localPlayer.setIsActive(true);
        // Store nickname for display and server's player ID for color mapping
        localPlayer.nickname = playerState.nickname;
        localPlayer.serverPlayerId = playerState.id;

        const curve = new Kurve.Curve(
            localPlayer,
            Kurve.Game,
            Kurve.Field,
            Kurve.Config.Curve,
            Kurve.Sound.getAudioPlayer()
        );

        // Mark this curve as remote (don't run physics)
        curve.isRemote = true;

        this.remotePlayers[sessionId] = {
            player: localPlayer,
            curve: curve,
            playerState: playerState,
            keysDown: {}
        };

        Kurve.Game.curves.push(curve);
        Kurve.Game.players.push(localPlayer);
    },

    setupLocalPlayer: function(playerState) {
        // Use sessionId as unique identifier
        const localPlayer = new Kurve.Player(
            this.sessionId,
            playerState.keyLeft,
            playerState.keyRight,
            playerState.keySuperpower
        );
        localPlayer.setColor(playerState.color);
        localPlayer.setIsActive(true);
        // Store nickname for display and server's player ID for color mapping
        localPlayer.nickname = playerState.nickname;
        localPlayer.serverPlayerId = playerState.id;
        localPlayer.isLocal = true; // Mark as local player

        const curve = new Kurve.Curve(
            localPlayer,
            Kurve.Game,
            Kurve.Field,
            Kurve.Config.Curve,
            Kurve.Sound.getAudioPlayer()
        );

        // Store reference to local player's curve for position updates
        this.localPlayerCurve = curve;
        this.localPlayerState = playerState;

        Kurve.Game.curves.push(curve);
        Kurve.Game.players.push(localPlayer);
    },

    updateRemotePlayer: function(playerState, sessionId) {
        const remote = this.remotePlayers[sessionId];
        if (!remote) return;

        // Store old position before updating
        const oldX = remote.curve.getPositionX();
        const oldY = remote.curve.getPositionY();
        const hadPreviousPosition = oldX !== null && oldY !== null;

        // Update remote player's curve position and state
        remote.curve.setPositionX(playerState.positionX);
        remote.curve.setPositionY(playerState.positionY);
        remote.curve.setNextPositionX(playerState.nextPositionX);
        remote.curve.setNextPositionY(playerState.nextPositionY);
        remote.curve.setAngle(playerState.angle);
        remote.curve.setIsInvisible(playerState.isInvisible);
        remote.player.points = playerState.points;

        // Draw the remote player's line on the canvas
        if (Kurve.Game.isRunning && playerState.isAlive) {
            if (hadPreviousPosition && !playerState.isInvisible) {
                // Draw visible line from old position to new position
                Kurve.Field.drawLine(
                    'curve',
                    oldX,
                    oldY,
                    playerState.positionX,
                    playerState.positionY,
                    remote.player.getColor(),
                    remote.curve
                );
            } else if (hadPreviousPosition && playerState.isInvisible) {
                // Draw invisible gap (powerUp tracking)
                Kurve.Field.drawLine(
                    'powerUp',
                    oldX,
                    oldY,
                    playerState.positionX,
                    playerState.positionY,
                    '',
                    remote.curve
                );
            }
        }
    },

    getLocalPlayerForRemote: function(playerState) {
        // Check if this is the local player by comparing server playerState.id
        if (this.localPlayerState && this.localPlayerState.id === playerState.id) {
            // Find the local player in Kurve.Game.players
            const localPlayer = Kurve.Game.players.find(p => p.isLocal);
            if (localPlayer) {
                return localPlayer;
            }
        }

        // Find the corresponding remote player object
        for (const sessionId in this.remotePlayers) {
            if (this.remotePlayers[sessionId].playerState.id === playerState.id) {
                return this.remotePlayers[sessionId].player;
            }
        }

        return null;
    },

    sendKeyDown: function(keyCode) {
        if (this.room && this.isMultiplayerMode) {
            this.room.send('keyDown', { keyCode: keyCode });
        }
    },

    sendKeyUp: function(keyCode) {
        if (this.room && this.isMultiplayerMode) {
            this.room.send('keyUp', { keyCode: keyCode });
        }
    },

    sendPositionUpdate: function(curve) {
        if (this.room && this.isMultiplayerMode) {
            this.room.send('updatePosition', {
                positionX: curve.getPositionX(),
                positionY: curve.getPositionY(),
                nextPositionX: curve.getNextPositionX(),
                nextPositionY: curve.getNextPositionY(),
                angle: curve.getOptions().angle,
                isInvisible: curve.isInvisible()
            });
        }
    },

    sendPlayerDied: function() {
        if (this.room && this.isMultiplayerMode) {
            this.room.send('playerDied', {});
        }
    },

    sendStartRound: function() {
        if (this.room && this.isMultiplayerMode) {
            this.room.send('startRound', {});
        }
    },

    sendPauseGame: function() {
        if (this.room && this.isMultiplayerMode) {
            this.room.send('pauseGame', {});
        }
    },

    disconnect: function() {
        if (this.room) {
            this.room.leave();
            this.room = null;
        }
        this.isMultiplayerMode = false;
        this.sessionId = null;
        this.remotePlayers = {};

        // Clear reconnection token when explicitly disconnecting
        localStorage.removeItem('kurve_reconnection_token');
    }
};
