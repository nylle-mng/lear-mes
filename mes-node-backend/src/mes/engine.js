/**
 * MES Processing Engine
 * Receives normalized line data, calculates OEE, detects alarms,
 * persists to SQL, and returns enriched state for the dashboard.
 */
const pool = require('../db/pool');

// In-memory line state — keyed by lineId
const lineStates = {};
// Track the last logged fault per line to prevent duplicate alarm entries
const lastLoggedFault = {};
let activeShiftId = null;

// ─── Start or resume today's shift ────────────────────────────────────────────
async function ensureActiveShift() {
  if (activeShiftId) return activeShiftId;
  try {
    const result = await pool.query(`
      INSERT INTO shifts (shift_name, target_qty, plant_id)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [`Shift-${new Date().toISOString().slice(0,10)}`, 1200, process.env.PLANT_ID || 'plant1']);

    if (result.rows.length > 0) {
      activeShiftId = result.rows[0].id;
    } else {
      // Shift already exists today, fetch it
      const existing = await pool.query(`
        SELECT id FROM shifts WHERE shift_name = $1 LIMIT 1
      `, [`Shift-${new Date().toISOString().slice(0,10)}`]);
      activeShiftId = existing.rows[0]?.id;
    }
  } catch (err) {
    console.error('[MES] Could not ensure active shift:', err.message);
  }
  return activeShiftId;
}

// ─── Calculate OEE ────────────────────────────────────────────────────────────
function calculateOEE(line) {
  const totalTime = (line.operatingTime || 0) + (line.downtime || 0);
  const A = totalTime > 0 ? (line.operatingTime / totalTime) * 100 : 0;
  const P = line.operatingTime > 0 && line.taktTime > 0
    ? Math.min(((line.taktTime * line.partsCount) / line.operatingTime) * 100, 100)
    : 0;
  const goodParts = Math.max(0, (line.partsCount || 0) - (line.scrapCount || 0));
  const Q = line.partsCount > 0 ? (goodParts / line.partsCount) * 100 : 100;
  const oee = (A / 100) * (P / 100) * (Q / 100) * 100;
  return {
    availability: parseFloat(A.toFixed(2)),
    performance:  parseFloat(P.toFixed(2)),
    quality:      parseFloat(Q.toFixed(2)),
    oee:          parseFloat(oee.toFixed(2))
  };
}

// ─── Process incoming line update from MQTT ───────────────────────────────────
async function processLineUpdate(lineId, payload) {
  const prev = lineStates[lineId] || {};
  const line = { ...prev, ...payload, lineId };
  lineStates[lineId] = line;

  const shiftId = await ensureActiveShift();
  const oee = calculateOEE(line);
  const plantId = process.env.PLANT_ID || 'plant1';

  // Persist production tick (throttled to every 10 seconds per line to avoid DB flood)
  if (!line._lastProdLog || (Date.now() - line._lastProdLog) >= 10000) {
    try {
      await pool.query(`
        INSERT INTO production_log
          (line_id, plant_id, shift_id, parts_count, scrap_count, motor_speed, is_running)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        lineId, plantId, shiftId,
        line.partsCount || 0,
        line.scrapCount || 0,
        line.motorSpeed  || 0,
        line.isRunning   ?? true
      ]);
      lineStates[lineId]._lastProdLog = Date.now();
    } catch (err) {
      console.error(`[MES] DB write error (production_log) for ${lineId}:`, err.message);
    }
  }

  // Persist OEE snapshot every N ticks (configurable)
  const snapshotInterval = parseInt(process.env.OEE_SNAPSHOT_INTERVAL_SEC || '60');
  if (!line._lastSnapshot || (Date.now() - line._lastSnapshot) >= snapshotInterval * 1000) {
    try {
      await pool.query(`
        INSERT INTO oee_snapshots
          (line_id, plant_id, shift_id, availability, performance, quality, oee, parts_count, scrap_count, operating_sec, downtime_sec)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        lineId, plantId, shiftId,
        oee.availability, oee.performance, oee.quality, oee.oee,
        line.partsCount || 0, line.scrapCount || 0,
        line.operatingTime || 0, line.downtime || 0
      ]);
      lineStates[lineId]._lastSnapshot = Date.now();
    } catch (err) {
      console.error(`[MES] DB write error (oee_snapshots) for ${lineId}:`, err.message);
    }
  }

  // Detect and log new alarms — only insert once per fault, not every tick
  const currentFault = line.activeFault || null;
  const lastFault    = lastLoggedFault[lineId] || null;
  if (currentFault && currentFault !== lastFault) {
    lastLoggedFault[lineId] = currentFault;
    try {
      await pool.query(`
        INSERT INTO alarms (line_id, plant_id, fault_code, description)
        VALUES ($1, $2, $3, $4)
      `, [lineId, plantId, currentFault, `Fault detected on LINE_${lineId}`]);
      console.log(`[ALARM] LINE_${lineId}: ${currentFault}`);
    } catch (err) {
      console.error(`[MES] DB write error (alarms) for ${lineId}:`, err.message);
    }
  }
  // Clear tracked fault when line recovers
  if (!currentFault && lastFault) {
    lastLoggedFault[lineId] = null;
    console.log(`[ALARM CLEARED] LINE_${lineId} recovered from ${lastFault}`);
  }

  return { ...line, oee };
}

// ─── Get all current line states (for WebSocket broadcast) ───────────────────
function getAllLineStates() {
  return lineStates;
}

module.exports = { processLineUpdate, getAllLineStates, calculateOEE };
