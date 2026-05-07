/**
 * Lear MES — Node.js Backend Entry Point
 * Boots: Express REST API + WebSocket server + MQTT subscriber
 */
require('dotenv').config();

const express    = require('express');
const http       = require('http');
const WebSocket  = require('ws');
const cors       = require('cors');
const mqttClient = require('./mqtt/client');
const routes     = require('./api/routes');
const { getAllLineStates } = require('./mes/engine');
const { startSimulator }  = require('./simulator/demo');

const PORT = parseInt(process.env.PORT || '3001');

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── WebSocket Server ─────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server, path: '/ws' });
const clients = new Set();

wss.on('connection', (ws, req) => {
  console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);
  clients.add(ws);

  // Send current full state snapshot on connect
  const currentState = getAllLineStates();
  ws.send(JSON.stringify({
    type: 'FULL_STATE',
    data: currentState,
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      // Handle commands from dashboard (e.g. START/STOP a line)
      if (msg.type === 'LINE_COMMAND') {
        const { lineId, action } = msg;
        mqttClient.publishCommand(lineId, { action });
        console.log(`[WS] Dashboard command: ${action} on LINE_${lineId}`);
      }
    } catch (err) {
      console.error('[WS] Message parse error:', err.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('[WS] Client disconnected');
  });

  ws.on('error', (err) => console.error('[WS] Error:', err.message));
});

// ─── Broadcast to all connected dashboard clients ─────────────────────────────
function broadcast(payload) {
  const message = JSON.stringify(payload);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// ─── Start MQTT and wire broadcast ────────────────────────────────────────────
mqttClient.setBroadcastCallback(broadcast);
mqttClient.connect();

// ─── Start Demo Simulator if DEMO_MODE=true ───────────────────────────────────
if (process.env.DEMO_MODE === 'true') {
  console.log('[SERVER] 🎮 DEMO_MODE enabled — starting simulator...');
  // Small delay to let the main MQTT subscriber connect first
  setTimeout(() => startSimulator(), 3000);
}

// ─── Start HTTP/WS Server ─────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`[SERVER] ✅ Lear MES Node.js backend running on port ${PORT}`);
  console.log(`[SERVER]    REST API: http://localhost:${PORT}/api`);
  console.log(`[SERVER]    WebSocket: ws://localhost:${PORT}/ws`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[SERVER] Shutting down gracefully...');
  server.close(() => process.exit(0));
});
