/**
 * Database Migration Script
 * Run once with: node src/db/migrate.js
 * Creates all required tables if they don't already exist.
 */
require('dotenv').config();
const pool = require('./pool');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('[MIGRATE] Running migrations...');

    await client.query(`
      -- Shifts table
      CREATE TABLE IF NOT EXISTS shifts (
        id          SERIAL PRIMARY KEY,
        shift_name  VARCHAR(50)  NOT NULL,
        start_time  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        end_time    TIMESTAMPTZ,
        target_qty  INTEGER      NOT NULL DEFAULT 1200,
        plant_id    VARCHAR(50)  NOT NULL DEFAULT 'plant1'
      );
    `);

    await client.query(`
      -- Production log — one row per production tick per line
      CREATE TABLE IF NOT EXISTS production_log (
        id           SERIAL PRIMARY KEY,
        line_id      VARCHAR(10)  NOT NULL,
        plant_id     VARCHAR(50)  NOT NULL DEFAULT 'plant1',
        shift_id     INTEGER      REFERENCES shifts(id),
        timestamp    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        parts_count  INTEGER      NOT NULL DEFAULT 0,
        scrap_count  INTEGER      NOT NULL DEFAULT 0,
        motor_speed  NUMERIC(6,2) DEFAULT 0,
        is_running   BOOLEAN      NOT NULL DEFAULT TRUE
      );
      CREATE INDEX IF NOT EXISTS idx_prod_log_line_time ON production_log(line_id, timestamp DESC);
    `);

    await client.query(`
      -- Alarms table — one row per alarm event
      CREATE TABLE IF NOT EXISTS alarms (
        id             SERIAL PRIMARY KEY,
        line_id        VARCHAR(10)  NOT NULL,
        plant_id       VARCHAR(50)  NOT NULL DEFAULT 'plant1',
        timestamp      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        fault_code     VARCHAR(100) NOT NULL,
        description    TEXT,
        acknowledged   BOOLEAN      NOT NULL DEFAULT FALSE,
        ack_timestamp  TIMESTAMPTZ,
        ack_user       VARCHAR(100)
      );
      CREATE INDEX IF NOT EXISTS idx_alarms_line ON alarms(line_id, acknowledged);
    `);

    await client.query(`
      -- OEE snapshots — computed every N seconds by the backend
      CREATE TABLE IF NOT EXISTS oee_snapshots (
        id            SERIAL PRIMARY KEY,
        line_id       VARCHAR(10)  NOT NULL,
        plant_id      VARCHAR(50)  NOT NULL DEFAULT 'plant1',
        shift_id      INTEGER      REFERENCES shifts(id),
        timestamp     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        availability  NUMERIC(5,2) NOT NULL DEFAULT 0,
        performance   NUMERIC(5,2) NOT NULL DEFAULT 0,
        quality       NUMERIC(5,2) NOT NULL DEFAULT 0,
        oee           NUMERIC(5,2) NOT NULL DEFAULT 0,
        parts_count   INTEGER      NOT NULL DEFAULT 0,
        scrap_count   INTEGER      NOT NULL DEFAULT 0,
        operating_sec INTEGER      NOT NULL DEFAULT 0,
        downtime_sec  INTEGER      NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_oee_line_time ON oee_snapshots(line_id, timestamp DESC);
    `);

    console.log('[MIGRATE] ✅ All tables created successfully.');
  } catch (err) {
    console.error('[MIGRATE] ❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
