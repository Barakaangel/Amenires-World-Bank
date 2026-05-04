/**
 * Amenires World Bank - Auto-Restart Server
 * Keeps the server running and auto-restarts on failure
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║        AMENIRES WORLD BANK - SERVER STARTUP                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let serverProcess;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 10;

function startServer() {
  if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
    console.error('\n❌ Maximum restart attempts reached. Stopping.\n');
    process.exit(1);
  }

  restartAttempts++;
  console.log(`🔄 Starting server (attempt ${restartAttempts})...`);
  console.log(`🌐 Server will be available at: http://localhost:3000`);
  console.log(`📱 Open in browser: http://localhost:3000\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Press Ctrl+C to stop the server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Spawn server process
  serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname),
    stdio: 'inherit',
    shell: true
  });

  // Handle server exit
  serverProcess.on('exit', (code, signal) => {
    console.error(`\n❌ Server stopped with exit code: ${code}`);
    
    if (signal === 'SIGINT' || signal === 'SIGTERM') {
      console.log('👋 Server stopped by user');
      process.exit(0);
    }
    
    if (code !== 0) {
      console.log(`⏳ Waiting 5 seconds before restart...`);
      setTimeout(() => {
        startServer();
      }, 5000);
    }
  });

  // Handle server errors
  serverProcess.on('error', (error) => {
    console.error(`\n❌ Server error: ${error.message}`);
    
    if (error.code === 'ENOENT') {
      console.error('❌ Error: server.js not found');
      process.exit(1);
    }
    
    console.log(`⏳ Waiting 5 seconds before restart...`);
    setTimeout(() => {
      startServer();
    }, 5000);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server...');
  
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down server...');
  
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  
  process.exit(0);
});

// Start the server
startServer();
