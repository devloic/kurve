# 🎮 Kurve Installation Guide

Simple installation guide for Kurve with multiplayer and hot reload.

## Prerequisites

- **Node.js** 16+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

Check if installed:
```bash
node --version   # Should show v16 or higher
npm --version    # Should show 7 or higher
```

Don't have Node.js? Download from: https://nodejs.org/

## Installation

### Option 1: Quick Install (Recommended)

```bash
# Clone or download the repository
cd kurve

# One command installs everything
npm run setup
```

This installs:
- ✅ Client dependencies (Pixi.js, Gulp, BrowserSync, etc.)
- ✅ Server dependencies (Colyseus, TypeScript, Express, etc.)

### Option 2: Manual Install

```bash
# Install client dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

## Verify Installation

```bash
# Check client dependencies
npm list --depth=0

# Check server dependencies
cd server
npm list --depth=0
cd ..
```

You should see packages like:
- Client: `pixi.js`, `gulp`, `browser-sync`, `concurrently`
- Server: `colyseus`, `express`, `typescript`

## First Run

### Development Mode (Recommended)

```bash
npm start
```

This will:
1. Build the client (fast dev build)
2. Start the Colyseus server
3. Start BrowserSync
4. Open browser at http://localhost:3010

You should see:
```
[client] [Kurve] Access URLs:
[client]  --------------------------------------
[client]        Local: http://localhost:3010
[client]     External: http://192.168.1.xxx:3010
[client]  --------------------------------------
[server] 🎮 Kurve Multiplayer Server listening on ws://localhost:2568
```

### Production Build

```bash
# Build for production
npm run build

# Then serve with any HTTP server
python -m http.server 8080
# or
npx http-server -p 8080
```

## Project Structure After Install

```
kurve/
├── node_modules/          # Client dependencies (auto-generated)
├── server/
│   ├── node_modules/      # Server dependencies (auto-generated)
│   └── src/              # Server source files
├── src/                  # Client source files
├── dist/                 # Built files (created on first build)
│   ├── js/
│   ├── css/
│   ├── images/
│   └── sound/
└── index.html           # Main HTML file
```

## Troubleshooting Installation

### npm install fails

**"EACCES: permission denied"**
```bash
# Don't use sudo! Fix npm permissions instead:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**"node-gyp rebuild failed"**
```bash
# Install build tools
# Mac:
xcode-select --install

# Linux (Ubuntu/Debian):
sudo apt-get install build-essential

# Windows:
npm install --global windows-build-tools
```

### Server dependencies fail

**TypeScript errors**
```bash
cd server
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Port conflicts

**Port 3000 or 2568 already in use**
```bash
# Find and kill the process
# Mac/Linux:
lsof -ti:3010 | xargs kill -9
lsof -ti:2568 | xargs kill -9

# Windows:
netstat -ano | findstr :3010
taskkill /PID <PID> /F
```

### Build fails

**Gulp not found**
```bash
# Make sure devDependencies are installed
npm install

# Or install gulp globally (optional)
npm install -g gulp
```

**Sass compilation fails**
```bash
# Reinstall sass
npm uninstall sass gulp-sass
npm install sass gulp-sass
```

## Uninstall

To completely remove:

```bash
# Remove dependencies
rm -rf node_modules
rm -rf server/node_modules

# Remove built files
rm -rf dist

# Remove lock files
rm package-lock.json
rm server/package-lock.json
```

## Upgrade

To upgrade to latest dependencies:

```bash
# Update client dependencies
npm update

# Update server dependencies
cd server
npm update
cd ..

# Or fresh install
npm run setup
```

## System Requirements

### Minimum
- **OS:** Windows 10, macOS 10.14, Ubuntu 18.04 or later
- **RAM:** 2GB
- **Disk:** 500MB free space (including dependencies)
- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Recommended
- **OS:** Windows 11, macOS 12+, Ubuntu 20.04+
- **RAM:** 4GB+
- **Disk:** 1GB free space
- **Browser:** Latest Chrome, Firefox, Safari, or Edge

## Network Setup (for multiplayer)

### Local Network (LAN)
No special setup needed. All devices on same network can connect.

### Internet (Remote Server)
For online play across internet:
1. Deploy server to cloud provider (Heroku, AWS, etc.)
2. Update `serverUrl` in `src/KurveMultiplayer.js`
3. Ensure WebSocket port is open

## Next Steps

After successful installation:

1. **Quick Test:** Run `npm start` and open http://localhost:3010
2. **Read Docs:** See [QUICKSTART.md](QUICKSTART.md) for usage
3. **Development:** See [DEVELOPMENT.md](DEVELOPMENT.md) for dev workflow
4. **Multiplayer:** See [MULTIPLAYER_SETUP.md](MULTIPLAYER_SETUP.md) for online play

## Getting Help

- **Installation issues:** Check troubleshooting section above
- **Development questions:** See [DEVELOPMENT.md](DEVELOPMENT.md)
- **Multiplayer setup:** See [MULTIPLAYER_SETUP.md](MULTIPLAYER_SETUP.md)
- **Bug reports:** Open issue on GitHub

---

**Installation complete? Run `npm start` to play!** 🚀
