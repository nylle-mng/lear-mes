/**
 * MQTT Client
 * Subscribes to all MES topics from Mosquitto broker.
 * Forwards normalized payloads to the MES Processing Engine.
 */
const mqtt = require('mqtt');
const { processLineUpdate } = require('../mes/engine');

let client = null;
let broadcastCallback = null;

// Called from index.js to wire up WebSocket broadcast
function setBroadcastCallback(cb) {
  broadcastCallback = cb;
}

function connect() {
  const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost';
  const options = {
    port:     parseInt(process.env.MQTT_PORT || '1883'),
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    clientId: `lear-mes-backend-${Date.now()}`,
    reconnectPeriod: 5000,
    connectTimeout: 10000
  };

  console.log(`[MQTT] Connecting to ${brokerUrl}...`);
  client = mqtt.connect(brokerUrl, options);

  client.on('connect', () => {
    console.log('[MQTT] ✅ Connected to broker');

    // Subscribe to all plant topics
    const plantId = process.env.PLANT_ID || 'plant1';
    client.subscribe(`mes/${plantId}/#`, { qos: 1 }, (err) => {
      if (err) console.error('[MQTT] Subscribe error:', err.message);
      else console.log(`[MQTT] Subscribed to mes/${plantId}/#`);
    });
  });

  client.on('message', async (topic, messageBuffer) => {
    try {
      const payload = JSON.parse(messageBuffer.toString());

      // Topic format: mes/{plantId}/line/{lineId}/{type}
      // e.g. mes/plant1/line/L01/status  or  mes/plant1/line/L01/production
      const parts = topic.split('/');
      if (parts.length < 5 || parts[2] !== 'line') return;

      const lineId = parts[3]; // e.g. "L01"

      const enriched = await processLineUpdate(lineId, payload);

      // Broadcast updated state to all WebSocket clients
      if (broadcastCallback) {
        broadcastCallback({
          type:  'LINE_UPDATE',
          lineId,
          data:  enriched,
          topic
        });
      }
    } catch (err) {
      console.error('[MQTT] Message parse error:', err.message, 'Topic:', topic);
    }
  });

  client.on('error',       (err) => console.error('[MQTT] Error:', err.message));
  client.on('reconnect',   ()    => console.log('[MQTT] Reconnecting...'));
  client.on('offline',     ()    => console.warn('[MQTT] Client offline'));

  return client;
}

// Publish a command back to a PLC line (e.g. START/STOP)
function publishCommand(lineId, command) {
  if (!client || !client.connected) {
    console.warn('[MQTT] Cannot publish — not connected');
    return;
  }
  const plantId = process.env.PLANT_ID || 'plant1';
  const topic = `mes/${plantId}/line/${lineId}/command`;
  client.publish(topic, JSON.stringify(command), { qos: 1 });
  console.log(`[MQTT] Published command to ${topic}:`, command);
}

module.exports = { connect, setBroadcastCallback, publishCommand };
