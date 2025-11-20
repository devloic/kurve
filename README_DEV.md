# Kurve - Quick Reference

An HTML5 multiplayer implementation of "Achtung, die Kurve!" with online multiplayer support.

## 🚀 Quick Start (Development)

```bash
# One-time setup
npm run setup

# Start development (hot reload enabled)
npm start
```

Opens browser at http://localhost:3010 with:
- ✅ Auto-reload on file changes
- ✅ Multiplayer server running
- ✅ Fast development builds

## 🎮 Game Modes

### Local Multiplayer (Single Screen)
- Traditional mode - multiple players on one keyboard
- 2-6 players on same screen
- Original game mechanics

### Online Multiplayer (Multiple Screens)
- Click **"Local Game"** button to switch to **"Online Game"**
- Play across multiple devices/browsers
- Real-time synchronization via Colyseus

## 📖 Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete development guide with hot reload
- **[MULTIPLAYER_SETUP.md](MULTIPLAYER_SETUP.md)** - Multiplayer setup and deployment

## 🛠️ Commands

```bash
# Development
npm start                 # Start dev mode with hot reload
npm run dev              # Same as start

# Building
npm run build            # Production build (minified)
npm run build:dev        # Development build (fast)

# Individual services
npm run serve            # Client only (with hot reload)
npm run server           # Server only

# Setup
npm run setup            # Install all dependencies
```

## 🌐 URLs (Development Mode)

- **Game:** http://localhost:3010
- **BrowserSync UI:** http://localhost:3011
- **Server Monitor:** http://localhost:2568/colyseus

## 📁 Key Files

```
src/
├── KurveGame.js         # Main game logic
├── KurveCurve.js        # Snake/curve mechanics
├── KurveMultiplayer.js  # Online multiplayer client
└── KurveMenu.js         # Menu system

server/src/
├── index.ts             # Server entry
└── rooms/KurveRoom.ts   # Game room logic
```

## 🔥 Features

- **Hot Reload:** Changes appear instantly in browser
- **Source Maps:** Debug original TypeScript/JavaScript
- **Live CSS Injection:** Styles update without reload
- **Auto Server Restart:** Server restarts on code changes
- **Multi-Device Testing:** Test on multiple browsers simultaneously

## 🐛 Debugging

### Client
```javascript
// Browser console
console.log(Kurve.Game);
console.log(Kurve.Multiplayer);
```

### Server
- Check terminal output
- Monitor at http://localhost:2568/colyseus

## 📝 License

GPL3 - See original project at https://github.com/maechler/kurve
