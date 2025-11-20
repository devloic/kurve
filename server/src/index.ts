import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { KurveRoom } from './rooms/KurveRoom';

const port = Number(process.env.PORT || 2568);
const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve Colyseus.js client library (browser-ready version)
app.use('/lib', express.static(path.join(__dirname, '../public')));

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: require('http').createServer(app)
  }),
});

// Register the game room
gameServer.define('kurve', KurveRoom);

// Register Colyseus monitor (optional, for debugging)
app.use('/colyseus', monitor());

gameServer.listen(port);
console.log(`🎮 Kurve Multiplayer Server listening on ws://localhost:${port}`);
console.log(`📊 Monitor available at http://localhost:${port}/colyseus`);
