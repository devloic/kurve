#!/usr/bin/env node

/**
 * Bundle Colyseus for browser using browserify
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outputFile = './dist/js/colyseus.js';

// Ensure dist/js exists
if (!fs.existsSync('./dist/js')) {
    fs.mkdirSync('./dist/js', { recursive: true });
}

// Create a temporary entry file that exports Colyseus
const entryFile = './colyseus-entry.js';
const entryContent = `
// Browser entry for Colyseus
const Colyseus = require('colyseus.js');
window.Colyseus = Colyseus;
module.exports = Colyseus;
`;

fs.writeFileSync(entryFile, entryContent);

try {
    console.log('🔨 Bundling Colyseus for browser...');

    // Use browserify to create standalone bundle
    execSync(
        `npx browserify ${entryFile} -s Colyseus -o ${outputFile}`,
        { stdio: 'inherit' }
    );

    console.log(`✅ Colyseus bundled: ${outputFile}`);

    // Clean up entry file
    fs.unlinkSync(entryFile);
} catch (error) {
    console.error('❌ Failed to bundle Colyseus:', error.message);
    if (fs.existsSync(entryFile)) {
        fs.unlinkSync(entryFile);
    }
    process.exit(1);
}
