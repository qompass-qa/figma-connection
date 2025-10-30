#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import open from 'open';
import ConfigManager from '../lib/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle command line arguments
const args = process.argv.slice(2);
const config = new ConfigManager();

// Check for help or version flags
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🎨 Figma Browser

Usage:
  figma-browser [options]

Options:
  --port, -p <port>     Port to run server on (default: 3000)
  --no-browser         Don't open browser automatically
  --config             Show config file location
  --clear-config       Clear all saved configuration
  --help, -h           Show this help message
  --version, -v        Show version number

Examples:
  figma-browser                    # Start with default settings
  figma-browser --port 8080        # Start on port 8080
  figma-browser --no-browser       # Start without opening browser
  `);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageData = JSON.parse(await import('fs').then(fs => fs.readFileSync(packagePath, 'utf8')));
  console.log('Figma Browser v1.0.0');
  process.exit(0);
}

if (args.includes('--config')) {
  console.log(`📁 Config file location: ${config.getConfigPath()}`);
  process.exit(0);
}

if (args.includes('--clear-config')) {
  if (config.clearAll()) {
    console.log('✅ Configuration cleared successfully');
  } else {
    console.log('❌ Failed to clear configuration');
  }
  process.exit(0);
}

// Parse port option
let port = config.get('settings.port', 3000);
const portIndex = args.findIndex(arg => arg === '--port' || arg === '-p');
if (portIndex !== -1 && args[portIndex + 1]) {
  port = parseInt(args[portIndex + 1]);
}

// Parse no-browser option
const noBrowser = args.includes('--no-browser') || !config.get('settings.autoOpenBrowser', true);

console.log('🎨 Starting Figma Browser...');
console.log(`📁 Config: ${config.getConfigPath()}`);
console.log('📁 Launching graphical interface...');

// Set port environment variable
process.env.PORT = port.toString();

// Import and start the server
const serverPath = path.join(__dirname, '..', 'lib', 'server.js');
const serverProcess = spawn('node', [serverPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

// Wait a moment for server to start, then open browser
if (!noBrowser) {
  setTimeout(async () => {
    try {
      console.log(`🌐 Opening browser at http://localhost:${port}`);
      await open(`http://localhost:${port}`);
    } catch (error) {
      console.log('⚠️  Could not open browser automatically.');
      console.log(`🔗 Please open http://localhost:${port} manually`);
    }
  }, 1500);
} else {
  console.log(`🔗 Server will be available at http://localhost:${port}`);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Figma Browser...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down Figma Browser...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

serverProcess.on('close', (code) => {
  console.log(`\n📊 Server exited with code ${code}`);
  process.exit(code);
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});