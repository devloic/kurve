#!/usr/bin/env node

/**
 * Simple build script to replace Gulp
 * Concatenates JS files and copies assets
 */

const fs = require('fs');
const path = require('path');

// Configuration
const sourceFiles = [
    './node_modules/pixi.js/dist/browser/pixi.js',
    './src/window.js',
    './src/Kurve.js',
    './src/KurveStorage.js',
    './src/KurveSound.js',
    './src/KurveTheming.js',
    './src/KurveFactory.js',
    './src/KurveConfig.js',
    './src/KurveUtility.js',
    './src/KurveMultiplayer.js',
    './src/KurveMenu.js',
    './src/KurveGame.js',
    './src/KurveField.js',
    './src/KurveSuperpowerconfig.js',
    './src/KurveSuperpower.js',
    './src/KurveCurve.js',
    './src/KurvePoint.js',
    './src/KurvePlayer.js',
    './src/KurveLightbox.js',
    './src/KurvePrivacypolicy.js',
];

const outputFile = './dist/js/kurve.js';
const distDir = './dist';

// Ensure dist directories exist
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
}

// Copy directory recursively
function copyDir(src, dest) {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Concatenate JS files
function buildJS() {
    console.log('🔨 Building JavaScript...');

    ensureDir(path.dirname(outputFile));

    let content = '';
    for (const file of sourceFiles) {
        if (fs.existsSync(file)) {
            console.log(`  Adding: ${file}`);
            content += fs.readFileSync(file, 'utf8') + '\n';
        } else {
            console.warn(`  ⚠️  File not found: ${file}`);
        }
    }

    fs.writeFileSync(outputFile, content);
    console.log(`✅ JavaScript built: ${outputFile}`);
}

// Note: Colyseus is loaded from CDN in index.html
// The npm package version has Node.js dependencies that don't work in browser

// Compile SCSS to CSS
function compileCSS() {
    console.log('🔨 Compiling SCSS...');
    ensureDir('./dist/css');

    try {
        const sass = require('sass');
        const result = sass.compile('./scss/main.scss', {
            style: 'compressed'
        });

        fs.writeFileSync('./dist/css/main.css', result.css);
        console.log('✅ CSS compiled successfully');
    } catch (error) {
        console.error('❌ Error compiling SCSS:', error.message);
        process.exit(1);
    }
}

// Copy images
function copyImages() {
    console.log('🔨 Copying images...');
    if (fs.existsSync('./images')) {
        copyDir('./images', './dist/images');
        console.log('✅ Images copied');
    }
}

// Copy sounds
function copySounds() {
    console.log('🔨 Copying sounds...');
    if (fs.existsSync('./sound')) {
        copyDir('./sound', './dist/sound');
        console.log('✅ Sounds copied');
    }
}

// Main build function
function build() {
    console.log('🚀 Starting build...\n');

    ensureDir(distDir);

    buildJS();
    compileCSS();
    copyImages();
    copySounds();

    console.log('\n✨ Build complete!');
}

// Watch mode
function watch() {
    console.log('👀 Watching for changes...\n');

    // Initial build
    build();

    // Watch source files
    console.log('\n👀 Watching src/ for changes...');
    fs.watch('./src', { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.js')) {
            console.log(`\n📝 Change detected: ${filename}`);
            buildJS();
        }
    });

    // Watch SCSS if it exists
    if (fs.existsSync('./scss')) {
        console.log('👀 Watching scss/ for changes...');
        fs.watch('./scss', { recursive: true }, (eventType, filename) => {
            if (filename) {
                console.log(`\n📝 SCSS change detected: ${filename}`);
                console.log('ℹ️  You may need to compile SCSS manually');
            }
        });
    }
}

// Run based on command
const command = process.argv[2];

if (command === 'watch') {
    watch();
} else {
    build();
}
