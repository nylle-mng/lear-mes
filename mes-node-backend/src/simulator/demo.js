/**
 * Demo Simulator
 * Publishes simulated PLC data to HiveMQ MQTT broker when DEMO_MODE=true.
 * Data flows through the full stack: Simulator → MQTT → Node.js engine → WebSocket → React
 * This is identical to what real Node-RED + S7 PLC data would look like.
 */
const mqtt = require('mqtt');

const PLANT_ID   = process.env.PLANT_ID || 'plant1';
const TOTAL_LINES = 37;

// Simulate 37 lines with individual state
const lineSimState = {};
for (let i = 1; i <= TOTAL_LINES; i++) {
  const id = i < 10 ? `L0${i}` : `L${i}`;
  lineSimState[id] = {
    partsCount:    0,
    scrapCount:    0,
    motorSpeed:    parseFloat((Math.random() * 20 + 10).toFixed(1)),
    taktTime:      parseFloat((Math.random() * 4 + 2).toFixed(1)), // 2–6 sec takt
    isRunning:     true,
    activeFault:   null,
    operatingTime: 0,
    downtime:      0,
    lastPartAt:    Date.now()
  };
}

const FAULT_CODES = ['E-STOP', 'JAM_DETECTED', 'MOTOR_OVERLOAD', 'SENSOR_FAILURE'];

function startSimulator() {
  const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost';
  const client = mqtt.connect(brokerUrl, {
    port:     parseInt(process.env.MQTT_PORT || '1883'),
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    clientId: `lear-mes-simulator-${Date.now()}`
  });

  client.on('connect', () => {
    console.log('[SIMULATOR] ✅ Demo simulator connected to MQTT broker');
    console.log(`[SIMULATOR] Simulating ${TOTAL_LINES} conveyor lines...`);

    // Subscribe to command topic to listen for START/STOP from dashboard
    client.subscribe(`mes/${PLANT_ID}/line/+/command`, (err) => {
      if (!err) console.log('[SIMULATOR] Subscribed to command topics');
    });

    client.on('message', (topic, message) => {
      // mes/plant1/line/L01/command
      const parts = topic.split('/');
      if (parts.length === 5 && parts[4] === 'command') {
        const lineId = parts[3];
        if (lineSimState[lineId]) {
          try {
            const cmd = JSON.parse(message.toString());
            if (cmd.action === 'START') {
              lineSimState[lineId].isRunning = true;
              lineSimState[lineId].activeFault = null;
              console.log(`[SIMULATOR] Overrode LINE_${lineId} to START`);
            } else if (cmd.action === 'STOP') {
              lineSimState[lineId].isRunning = false;
              console.log(`[SIMULATOR] Overrode LINE_${lineId} to STOP`);
            } else if (cmd.action === 'SPEED') {
              lineSimState[lineId].motorSpeed = cmd.value;
              lineSimState[lineId].taktTime = cmd.taktTime;
              lineSimState[lineId].autoTakt = cmd.autoTakt;
              console.log(`[SIMULATOR] Overrode LINE_${lineId} SPEED: ${cmd.value}Hz (Takt: ${cmd.taktTime}s) Auto: ${cmd.autoTakt}`);
            } else if (cmd.action === 'REJECT') {
              lineSimState[lineId].scrapCount += 1;
              console.log(`[SIMULATOR] Manual REJECT added to LINE_${lineId}`);
            } else if (cmd.action === 'RESET') {
              lineSimState[lineId].partsCount = 0;
              lineSimState[lineId].scrapCount = 0;
              lineSimState[lineId].downtime = 0;
              lineSimState[lineId].operatingTime = 0;
              console.log(`[SIMULATOR] RESET counters on LINE_${lineId}`);
            }
          } catch (e) {
            console.error('[SIMULATOR] Invalid command payload', e);
          }
        }
      }
    });

    // Tick every 1 second — simulate production
    setInterval(() => {
      const now = Date.now();

      Object.entries(lineSimState).forEach(([lineId, line]) => {
        if (!line.isRunning) {
          line.downtime += 1;

          // Auto-recover after 10–30 sec downtime
          if (line.downtime > Math.floor(Math.random() * 20 + 10)) {
            line.isRunning   = true;
            line.activeFault = null;
            line.downtime    = 0;
          }
        } else {
          line.operatingTime += 1;

          // Produce a part when takt time elapses
          const elapsed = (now - line.lastPartAt) / 1000;
          if (elapsed >= line.taktTime) {
            line.partsCount += 1;
            line.lastPartAt  = now;
            // 0.5% chance of scrap
            if (Math.random() < 0.005) line.scrapCount += 1;
          }

          // 0.2% chance of random fault per tick
          if (Math.random() < 0.002) {
            line.isRunning   = false;
            line.activeFault = FAULT_CODES[Math.floor(Math.random() * FAULT_CODES.length)];
          }
        }

        // Publish status
        client.publish(
          `mes/${PLANT_ID}/line/${lineId}/status`,
          JSON.stringify({
            isRunning:   line.isRunning,
            activeFault: line.activeFault,
            motorSpeed:  line.isRunning ? line.motorSpeed : 0,
            timestamp:   new Date().toISOString()
          }),
          { qos: 1 }
        );

        // Publish production
        client.publish(
          `mes/${PLANT_ID}/line/${lineId}/production`,
          JSON.stringify({
            partsCount:    line.partsCount,
            scrapCount:    line.scrapCount,
            taktTime:      line.taktTime,
            operatingTime: line.operatingTime,
            downtime:      line.downtime,
            motorSpeed:    line.isRunning ? line.motorSpeed : 0,
            timestamp:     new Date().toISOString()
          }),
          { qos: 1 }
        );
      });
    }, 1000);
  });

  client.on('error', (err) => console.error('[SIMULATOR] MQTT error:', err.message));
}

module.exports = { startSimulator };
