// This is a CommonJS file (not ES module) to avoid __dirname issues
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Serve static files
app.use(express.static(path.join(__dirname, 'client')));

// Sample API endpoints for demo
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running in preview mode' });
});

// For all other requests to /api, return a message
app.use('/api', (req, res) => {
  res.json({ 
    message: 'This is a preview server. Full API functionality is not available.',
    request: {
      path: req.path,
      method: req.method
    }
  });
});

// All other routes should serve the preview page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'preview.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Preview server running at http://localhost:${PORT}`);
});