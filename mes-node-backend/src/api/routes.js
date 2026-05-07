/**
 * REST API Routes
 * Provides historical data endpoints consumed by the React dashboard.
 */
const express = require('express');
const pool    = require('../db/pool');
const { publishCommand } = require('../mqtt/client');

const router = express.Router();

// ─── GET /api/health ──────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── GET /api/production/history?lineId=L01&hours=8 ─────────────────────────
router.get('/production/history', async (req, res) => {
  const { lineId, hours = 8 } = req.query;
  try {
    const query = lineId
      ? `SELECT line_id, timestamp, parts_count, scrap_count, motor_speed, is_running
         FROM production_log
         WHERE line_id = $1 AND timestamp >= NOW() - INTERVAL '${parseInt(hours)} hours'
         ORDER BY timestamp DESC LIMIT 500`
      : `SELECT line_id, timestamp, parts_count, scrap_count, is_running
         FROM production_log
         WHERE timestamp >= NOW() - INTERVAL '${parseInt(hours)} hours'
         ORDER BY timestamp DESC LIMIT 500`;

    const result = await pool.query(query, lineId ? [lineId] : []);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/oee?lineId=L01&hours=8 ─────────────────────────────────────────
router.get('/oee', async (req, res) => {
  const { lineId, hours = 8 } = req.query;
  try {
    const query = lineId
      ? `SELECT line_id, timestamp, availability, performance, quality, oee, parts_count
         FROM oee_snapshots
         WHERE line_id = $1 AND timestamp >= NOW() - INTERVAL '${parseInt(hours)} hours'
         ORDER BY timestamp DESC LIMIT 200`
      : `SELECT line_id, timestamp, availability, performance, quality, oee
         FROM oee_snapshots
         WHERE timestamp >= NOW() - INTERVAL '${parseInt(hours)} hours'
         ORDER BY timestamp DESC LIMIT 500`;

    const result = await pool.query(query, lineId ? [lineId] : []);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/alarms?acknowledged=false ──────────────────────────────────────
router.get('/alarms', async (req, res) => {
  const { acknowledged = 'false', lineId } = req.query;
  try {
    let query = `SELECT * FROM alarms WHERE acknowledged = $1`;
    const params = [acknowledged === 'true'];
    if (lineId) { query += ` AND line_id = $2`; params.push(lineId); }
    query += ` ORDER BY timestamp DESC LIMIT 100`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/alarms/:id/acknowledge ────────────────────────────────────────
router.post('/alarms/:id/acknowledge', async (req, res) => {
  const { id } = req.params;
  const { user = 'OPERATOR' } = req.body;
  try {
    await pool.query(`
      UPDATE alarms
      SET acknowledged = TRUE, ack_timestamp = NOW(), ack_user = $1
      WHERE id = $2
    `, [user, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/line/:lineId/command ──────────────────────────────────────────
// Sends a START/STOP command down to the PLC via MQTT
router.post('/line/:lineId/command', (req, res) => {
  const { lineId } = req.params;
  const { action } = req.body; // e.g. { action: 'START' }
  if (!['START', 'STOP', 'RESET'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Must be START, STOP, or RESET.' });
  }
  publishCommand(lineId, { action, timestamp: new Date().toISOString() });
  res.json({ success: true, lineId, action });
});

// ─── GET /api/shifts ──────────────────────────────────────────────────────────
router.get('/shifts', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM shifts ORDER BY start_time DESC LIMIT 20`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
