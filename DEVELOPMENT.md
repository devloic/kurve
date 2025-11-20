# 🚀 Kurve Development Guide

Complete guide for developing Kurve with hot reload, live browser sync, and efficient workflow.

## Quick Start

```bash
# Install all dependencies (client + server)
npm run setup

# Start development mode with hot reload
npm run dev
# or simply
npm start
```

This single command will:
- ✅ Start the Colyseus server with hot reload (port 2568)
- ✅ Build the client with fast development builds
- ✅ Start BrowserSync with live reload (port 3000)
- ✅ Watch for file changes and auto-rebuild
- ✅ Auto-refresh browser on changes

## 📁 Project Structure

```
kurve/
├── src/                    # Client source files
│   ├── Kurve.js           # Main game initialization
│   ├── KurveGame.js       # Game logic
│   ├── KurveCurve.js      # Curve/snake logic
│   ├── KurvePlayer.js     # Player management
│   ├── KurveMenu.js       # Menu system
│   ├── KurveMultiplayer.js # Multiplayer client
│   └── ...                # Other game modules
├── server/                # Colyseus multiplayer server
│   └── src/
│       ├── index.ts       # Server entry point
│       ├── rooms/         # Game room logic
│       └── schema/        # State schemas
├── scss/                  # Sass stylesheets
├── images/                # Game images/assets
├── sound/                 # Game sounds
├── dist/                  # Built files (auto-generated)
│   ├── js/
│   ├── css/
│   ├── images/
│   └── sound/
└── index.html            # Main HTML file
```

## 🛠️ Development Commands

### Primary Commands

```bash
# Full development mode (recommended)
npm run dev
# Runs both client and server with hot reload

# Just client development
npm run serve
# BrowserSync on http://localhost:3010

# Just server development
npm run server
# Server on ws://localhost:2568
```

### Build Commands

```bash
# Development build (fast, no minification)
npm run build:dev

# Production build (minified, optimized)
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch
```

### Individual Tasks

```bash
# Run specific gulp tasks
gulp js           # Build JavaScript (minified)
gulp js:dev       # Build JavaScript (fast, no minification)
gulp sass         # Build CSS
gulp images       # Copy images
gulp sound        # Copy sounds
```

## 🔥 Hot Reload Features

### Client Hot Reload

**What triggers reload:**
- ✅ JavaScript files in `src/` → Full page reload
- ✅ SCSS files in `scss/` → CSS injection (no reload!)
- ✅ `index.html` → Full page reload
- ✅ Images in `images/` → Auto-copy to dist
- ✅ Sounds in `sound/` → Auto-copy to dist

**Development optimizations:**
- No uglification (10x faster builds)
- Source maps enabled
- Live CSS injection
- Auto-browser refresh

### Server Hot Reload

**What triggers restart:**
- ✅ TypeScript files in `server/src/` → Auto-restart
- ✅ Schema changes → Auto-recompile

**Features:**
- Uses `ts-node-dev` for instant restarts
- Preserves process on crash
- Console output preserved

## 🌐 Development URLs

When running `npm run dev`:

| Service | URL | Purpose |
|---------|-----|---------|
| **Game Client** | http://localhost:3010 | Main game interface |
| **BrowserSync UI** | http://localhost:3011 | BrowserSync control panel |
| **Colyseus Server** | ws://localhost:2568 | WebSocket game server |
| **Colyseus Monitor** | http://localhost:2568/colyseus | Server monitoring dashboard |

## 📝 Development Workflow

### Making Changes

1. **Edit source files** in `src/`, `scss/`, or `server/src/`
2. **Save the file** (Ctrl+S / Cmd+S)
3. **Watch the terminal** for build status
4. **Browser auto-refreshes** (client changes) or **server restarts** (server changes)

### Example Workflow: Adding a Feature

```bash
# 1. Start development mode
npm run dev

# 2. Edit files (e.g., src/KurveGame.js)
# Changes are automatically detected and rebuilt

# 3. Browser reloads automatically
# Test your changes immediately

# 4. Edit server (e.g., server/src/rooms/KurveRoom.ts)
# Server automatically restarts

# 5. When done, build for production
npm run build
```

## 🐛 Debugging

### Client Debugging

**Browser DevTools:**
```javascript
// Source maps are enabled, so you can debug original files
// Set breakpoints in Chrome DevTools Sources tab
```

**Console Logging:**
```javascript
// The game object is globally available
console.log(Kurve.Game);
console.log(Kurve.players);
console.log(Kurve.Multiplayer);
```

### Server Debugging

**Server logs:**
```bash
# Server console shows all connections and messages
[server] KurveRoom created!
[server] abc123 joined!
[server] Player added: player1 abc123
```

**Colyseus Monitor:**
- Open http://localhost:2568/colyseus
- View active rooms
- See connected clients
- Monitor state changes

## 🔧 Configuration

### BrowserSync Config

Edit `bs-config.js` to customize:
- Port numbers
- Reload behavior
- Proxy settings
- UI options

### Gulp Config

Edit `gulpfile.js` to customize:
- Source file order
- Build pipeline
- Watch patterns
- Output locations

### Server Config

Edit `server/src/index.ts`:
```typescript
const port = Number(process.env.PORT || 2568);
```

Edit `src/KurveMultiplayer.js`:
```javascript
serverUrl: 'ws://localhost:2568',
```

## 🎯 Performance Tips

### Fast Builds

```bash
# Development mode uses build:dev (no minification)
# ~10x faster than production builds
npm run serve
```

### Selective Rebuilds

```bash
# Only rebuild what you're working on
gulp js:dev       # Just JavaScript
gulp sass         # Just CSS
gulp images       # Just images
```

### Browser Sync Options

Disable ghost mode if you don't need synchronized testing:
```javascript
// bs-config.js
"ghostMode": {
    "clicks": false,
    "scroll": false,
    "location": false,
    "forms": false
}
```

## 🧪 Testing Multiplayer Locally

### Multiple Browser Windows

1. Run `npm run dev`
2. Browser opens at http://localhost:3010
3. Open the same URL in another tab/window
4. Toggle both to "Online Game" mode
5. Join and play!

### Multiple Devices (LAN)

1. Find your local IP:
   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   # or
   ip addr
   ```

2. Access from other devices:
   ```
   http://192.168.1.XXX:3010  # Your IP
   ```

3. Make sure `KurveMultiplayer.js` points to your IP:
   ```javascript
   serverUrl: 'ws://192.168.1.XXX:2568',
   ```

## 📊 Build Output

### Development Build

```
dist/
├── js/
│   ├── kurve.min.js      # ~2MB (with source maps, not minified)
│   └── kurve.min.js.map  # Source map
├── css/
│   └── main.css          # Compiled CSS
├── images/               # Copied images
└── sound/               # Copied sounds
```

### Production Build

```
dist/
├── js/
│   ├── kurve.min.js      # ~500KB (minified + uglified)
│   └── kurve.min.js.map  # Source map
├── css/
│   └── main.css          # Compiled CSS
├── images/
└── sound/
```

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 (client)
# Mac/Linux:
lsof -ti:3010 | xargs kill -9

# Windows:
netstat -ano | findstr :3010
taskkill /PID <PID> /F

# Kill process on port 2568 (server)
# Mac/Linux:
lsof -ti:2568 | xargs kill -9
```

### BrowserSync Not Reloading

1. Check terminal for build errors
2. Verify files are being watched:
   ```
   [Kurve] Watching files...
   ```
3. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
4. Restart dev mode

### Server Not Restarting

1. Check for TypeScript errors in console
2. Verify `ts-node-dev` is installed:
   ```bash
   cd server
   npm install
   ```
3. Manually restart:
   ```bash
   npm run server
   ```

### Changes Not Appearing

1. **Check build completed:**
   ```
   [Kurve] Finished 'js:dev' after 1.2 s
   ```

2. **Clear browser cache:**
   - Hard reload (Ctrl+Shift+R)
   - Or disable cache in DevTools

3. **Verify file paths:**
   - Source files in `src/`
   - Built files in `dist/`

## 📚 Additional Resources

- **Colyseus Docs:** https://docs.colyseus.io/
- **BrowserSync Docs:** https://browsersync.io/docs
- **Gulp Docs:** https://gulpjs.com/
- **Original Kurve:** https://github.com/maechler/kurve

## 🎮 Happy Developing!

For multiplayer setup, see `MULTIPLAYER_SETUP.md`
