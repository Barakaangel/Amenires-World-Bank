/**
 * Simple Standalone Server for Amenires World Bank
 * No database required - works immediately
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for all origins
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running!' });
});

// System status
app.get('/api/system/status', (req, res) => {
  res.json({
    status: 'operational',
    bank: {
      name: 'Amenires World Bank',
      type: 'Global Universal Banking System',
      securityLevel: 'Maximum'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║        AMENIRES WORLD BANK - SERVER RUNNING             ║');
  console.log('║                                                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Open your browser and visit: http://localhost:${PORT}`);
  console.log('\nPress Ctrl+C to stop the server\n');
});
