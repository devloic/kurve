# 🎮 Kurve - 30 Second Quickstart

## First Time Setup

```bash
npm run setup
```

## Start Developing

```bash
npm start
```

**That's it!** 🎉

Your browser will open at http://localhost:3010 with:
- ✅ Hot reload enabled
- ✅ Multiplayer server running
- ✅ Auto-refresh on changes

## What Just Happened?

Two services are now running:

1. **Client (Browser)** - http://localhost:3010
   - Game interface with live reload
   - Changes to JS/CSS instantly appear

2. **Server (Multiplayer)** - ws://localhost:2568
   - Handles online multiplayer
   - Auto-restarts on code changes

## Try It Out

### Local Multiplayer (Single Screen)
1. Open http://localhost:3010
2. Select players with mouse/keyboard
3. Press SPACE to start

### Online Multiplayer (Multiple Screens)
1. Open http://localhost:3010 in 2+ browser tabs
2. Click **"Local Game"** button → switches to **"Online Game"**
3. Press SPACE in each tab to join
4. Press SPACE again to start round
5. Play across screens!

## Making Changes

1. Edit files in `src/` or `server/src/`
2. Save (Ctrl+S)
3. Watch terminal for build status
4. Browser auto-refreshes (or server auto-restarts)

## Common Commands

```bash
npm start              # Full dev mode (recommended)
npm run build          # Production build
npm run serve          # Client only
npm run server         # Server only
```

## Need Help?

- **Development:** See [DEVELOPMENT.md](DEVELOPMENT.md)
- **Multiplayer:** See [MULTIPLAYER_SETUP.md](MULTIPLAYER_SETUP.md)

## Project Structure

```
src/               # Client code (edit here)
server/src/        # Server code (edit here)
scss/              # Styles (edit here)
dist/              # Built files (auto-generated, don't edit)
```

## Troubleshooting

### Port in use?
```bash
# Mac/Linux
lsof -ti:3010 | xargs kill -9
lsof -ti:2568 | xargs kill -9

# Windows
netstat -ano | findstr :3010
taskkill /PID <PID> /F
```

### Not reloading?
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Check terminal for errors
3. Restart: `npm start`

---

**Ready to develop? Run `npm start` and get coding!** 🚀
