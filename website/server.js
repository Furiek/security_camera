const http = require('http');
const WebSocket = require('ws');

const ESP32_STREAM_URL = 'http://192.168.0.112:81/stream';
const PORT = 8080;

const clients = [];

const wsServer = new WebSocket.Server({ port: PORT });
wsServer.on('connection', ws => {
  clients.push(ws);
  console.log('[Server] New client connected');

  ws.on('close', () => {
    const i = clients.indexOf(ws);
    if (i !== -1) clients.splice(i, 1);
    console.log('[Server] Client disconnected');
  });
});

console.log(`[Server] WebSocket server running on ws://0.0.0.0:${PORT}`);

// MJPEG HTTP stream reader
http.get(ESP32_STREAM_URL, res => {
  let buffer = Buffer.alloc(0);

  res.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);

    // JPEG start/end markers
    const SOI = buffer.indexOf(Buffer.from([0xFF, 0xD8])); // Start of Image
    const EOI = buffer.indexOf(Buffer.from([0xFF, 0xD9]), SOI); // End of Image

    if (SOI !== -1 && EOI !== -1 && EOI > SOI) {
      const jpeg = buffer.slice(SOI, EOI + 2);
      buffer = buffer.slice(EOI + 2);

      // Send to all clients
      clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) ws.send(jpeg);
      });

      console.log(`[Server] Sent frame to ${clients.length} client(s), size: ${jpeg.length}`);
    }
  });

  res.on('end', () => {
    console.warn('[Server] MJPEG stream ended');
  });

}).on('error', err => {
  console.error('[Server] Error connecting to ESP32:', err.message);
});
