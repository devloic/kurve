#!/usr/bin/env node

/**
 * Simple development server with auto-reload
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3010;
const BUILD_WATCH = true;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ico': 'image/x-icon',
};

// Create HTTP server
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('500 Internal Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🎮 Game server running at http://localhost:${PORT}/`);
    console.log(`📂 Serving files from: ${__dirname}`);

    if (BUILD_WATCH) {
        console.log('👀 Watching for file changes...');

        // Watch src directory
        fs.watch('./src', { recursive: true }, (eventType, filename) => {
            if (filename && filename.endsWith('.js')) {
                console.log(`\n📝 Change detected: ${filename}`);
                console.log('🔨 Rebuilding...');

                exec('node build.js', (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ Build error: ${error.message}`);
                        return;
                    }
                    console.log('✅ Build complete! Refresh your browser to see changes.');
                });
            }
        });

        // Watch SCSS if it exists
        if (fs.existsSync('./scss')) {
            fs.watch('./scss', { recursive: true }, (eventType, filename) => {
                if (filename) {
                    console.log(`\n📝 SCSS change detected: ${filename}`);
                    console.log('ℹ️  You may need to compile SCSS manually');
                }
            });
        }
    }
});
