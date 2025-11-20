# Kurve Multiplayer Setup Guide

This guide explains how to set up and run the multiplayer version of Kurve (Achtung, die Kurve) using Colyseus.

## Overview

The game now supports two modes:
- **Local Game**: Traditional local multiplayer on a single screen (original functionality)
- **Online Game**: Multiplayer across multiple screens using a central Colyseus server

## Installation

### 1. Install Client Dependencies

```bash
npm install
```

### 2. Install Server Dependencies

```bash
cd server
npm install
cd ..
```

## Running the Game

### Step 1: Start the Colyseus Server

In a terminal, navigate to the server directory and start the server:

```bash
cd server
npm run dev
```

The server will start on `ws://localhost:2568`

You should see:
```
🎮 Kurve Multiplayer Server listening on ws://localhost:2568
```

### Step 2: Build the Client

In another terminal, build the client-side code:

```bash
npm run build
# or for development with watch:
gulp watch
```

### Step 3: Serve the Game

Open `index.html` in a web browser. For local development, you can use a simple HTTP server:

```bash
# Using Python 3
python -m http.server 8080

# Using Node.js http-server (install with: npm install -g http-server)
http-server -p 8080
```

Then open `http://localhost:8080` in your browser.

### Step 4: Play Multiplayer

1. Open the game in multiple browser windows/tabs (or on different computers on the same network)
2. In the menu, click the **"Local Game"** button to toggle to **"Online Game"** mode
3. Press SPACE to join the multiplayer room
4. Wait for other players to join
5. Any player can press SPACE to start the round
6. Play!

## How Multiplayer Works

### Architecture

- **Server** (`server/`): Colyseus server that manages game state and synchronizes players
  - `src/index.ts`: Server entry point
  - `src/rooms/KurveRoom.ts`: Game room logic
  - `src/schema/GameState.ts`: Shared state schema

- **Client** (`src/KurveMultiplayer.js`): Handles connection to server and synchronization
  - Sends player inputs (key presses, position updates)
  - Receives updates from other players
  - Manages remote player rendering

### Real-time Synchronization

Each player's game instance:
1. **Sends** its own curve position, angle, and state to the server
2. **Receives** position updates from all other players
3. **Renders** all players' curves in real-time on their screen

Key features:
- **60 FPS synchronization**: Position updates sent every frame
- **Input forwarding**: Key presses are broadcast to other players
- **Death notification**: When a player dies, all clients are notified
- **Round coordination**: Any player can start a round, synchronized across all clients

### Server Configuration

Default server settings in `server/src/index.ts`:
- Port: `2568`
- Max players per room: `6`
- Frame rate: `60 FPS`

To change the server URL, edit `src/KurveMultiplayer.js`:
```javascript
serverUrl: 'ws://localhost:2568',  // Change this for remote servers
```

## Troubleshooting

### "Could not connect to server" error

1. Make sure the Colyseus server is running (`cd server && npm run dev`)
2. Check that the server URL in `src/KurveMultiplayer.js` matches your server address
3. Check browser console for connection errors

### Players not seeing each other

1. Make sure all players are in **Online Game** mode (not Local Game)
2. Verify all players pressed SPACE to join the room
3. Check the server console for connection logs

### Position desync

1. Make sure all players have the same game version
2. Check network latency (high latency may cause visible desync)
3. Restart the server and reconnect all clients

## Development

### Server Development

The server uses TypeScript and ts-node-dev for hot reloading:

```bash
cd server
npm run dev  # Watches for changes and restarts automatically
```

### Client Development

Use gulp watch to automatically rebuild on changes:

```bash
gulp watch
```

### Monitoring

Colyseus Monitor is available at `http://localhost:2568/colyseus` when the server is running. This provides:
- Active rooms
- Connected clients
- Server statistics

## Network Play (LAN/Internet)

### LAN (Local Network)

1. Find your computer's local IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` or `ip addr`

2. Update `src/KurveMultiplayer.js` with your IP:
   ```javascript
   serverUrl: 'ws://192.168.1.XXX:2568',  // Your local IP
   ```

3. Other players on the same network can connect using your IP

### Internet (Remote Server)

1. Deploy the server to a cloud provider (Heroku, AWS, DigitalOcean, etc.)
2. Update the `serverUrl` in `src/KurveMultiplayer.js` to your server's public URL
3. Make sure WebSocket connections are allowed (check firewall/security groups)

## Technical Details

### State Synchronization

The game uses Colyseus Schema for efficient state synchronization:

```typescript
class PlayerState extends Schema {
  @type('number') positionX
  @type('number') positionY
  @type('number') angle
  @type('boolean') isAlive
  // ... more properties
}
```

### Message Types

Client → Server:
- `keyDown`: Player pressed a key
- `keyUp`: Player released a key
- `updatePosition`: Player position update
- `playerDied`: Player's curve died
- `startRound`: Request to start a new round
- `pauseGame`: Toggle pause state

Server → Client:
- State changes (automatic via Colyseus)
- `playerKeyDown`: Broadcast key press
- `playerKeyUp`: Broadcast key release
- `roundStarted`: Round has started
- `roundEnded`: Round has ended
- `gameOver`: Game completed with winner

## License

The multiplayer functionality follows the same GPL3 license as the original Kurve game.
